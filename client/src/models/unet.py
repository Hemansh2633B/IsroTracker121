import torch
import torch.nn as nn
import torch.nn.functional as F

class DoubleConv(nn.Module):
    """(convolution => [BN] => ReLU) * 2"""

    def __init__(self, in_channels, out_channels, mid_channels=None):
        super().__init__()
        if not mid_channels:
            mid_channels = out_channels
        self.double_conv = nn.Sequential(
            nn.Conv2d(in_channels, mid_channels, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(mid_channels),
            nn.ReLU(inplace=True),
            nn.Conv2d(mid_channels, out_channels, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True)
        )

    def forward(self, x):
        return self.double_conv(x)

class Down(nn.Module):
    """Downscaling with maxpool then double conv"""

    def __init__(self, in_channels, out_channels):
        super().__init__()
        self.maxpool_conv = nn.Sequential(
            nn.MaxPool2d(2),
            DoubleConv(in_channels, out_channels)
        )

    def forward(self, x):
        return self.maxpool_conv(x)

class Up(nn.Module):
    """Upscaling then double conv"""
    # Corrected Up class logic for channels:
    def __init__(self, in_ch_deep, in_ch_skip, out_ch, bilinear=True): # Specify channels from deep layer and skip connection
        super().__init__()
        self.bilinear = bilinear
        if bilinear:
            self.up = nn.Upsample(scale_factor=2, mode='bilinear', align_corners=True)
            # After upsampling in_ch_deep, it's concatenated with in_ch_skip
            self.conv = DoubleConv(in_ch_deep + in_ch_skip, out_ch)
        else:
            # ConvTranspose reduces channels of the deep feature map by half (typically)
            self.up = nn.ConvTranspose2d(in_ch_deep, in_ch_deep // 2, kernel_size=2, stride=2)
            self.conv = DoubleConv(in_ch_deep // 2 + in_ch_skip, out_ch)

    def forward(self, x1_deep, x2_skip):
        x1_deep = self.up(x1_deep)
        # Pad x1_deep to match x2_skip size for concatenation
        diffY = x2_skip.size()[2] - x1_deep.size()[2]
        diffX = x2_skip.size()[3] - x1_deep.size()[3]
        x1_deep = F.pad(x1_deep, [diffX // 2, diffX - diffX // 2,
                                  diffY // 2, diffY - diffY // 2])

        x = torch.cat([x2_skip, x1_deep], dim=1)
        return self.conv(x)

class OutConv(nn.Module):
    def __init__(self, in_channels, out_channels):
        super(OutConv, self).__init__()
        self.conv = nn.Conv2d(in_channels, out_channels, kernel_size=1)

    def forward(self, x):
        return self.conv(x)

class UNet(nn.Module): # Renamed from UNetCorrected for final use
    def __init__(self, n_channels, n_classes, bilinear=False):
        super().__init__()
        self.n_channels = n_channels
        self.n_classes = n_classes
        self.bilinear = bilinear

        self.inc = DoubleConv(n_channels, 64)
        self.down1 = Down(64, 128)
        self.down2 = Down(128, 256)
        self.down3 = Down(256, 512)

        deepest_channels_before_up = 1024 if not bilinear else 512 # Channels output by down4
        self.down4 = Down(512, deepest_channels_before_up)

        # Up(in_ch_deep, in_ch_skip, out_ch, bilinear)
        self.up1 = Up(deepest_channels_before_up, 512, 512, bilinear)
        self.up2 = Up(512, 256, 256, bilinear)
        self.up3 = Up(256, 128, 128, bilinear)
        self.up4 = Up(128, 64, 64, bilinear)
        self.outc = OutConv(64, n_classes)

    def forward(self, x):
        x1 = self.inc(x)        # Skip connection 1 (64 channels)
        x2 = self.down1(x1)     # Skip connection 2 (128 channels)
        x3 = self.down2(x2)     # Skip connection 3 (256 channels)
        x4 = self.down3(x3)     # Skip connection 4 (512 channels)
        x5 = self.down4(x4)     # Deepest features

        x = self.up1(x5, x4)    # x5 is from deeper layer, x4 is skip
        x = self.up2(x, x3)
        x = self.up3(x, x2)
        x = self.up4(x, x1)
        logits = self.outc(x)

        if self.n_classes == 1: # Binary segmentation (cloud vs no-cloud)
            return torch.sigmoid(logits)
        else: # Multi-class segmentation
            return F.softmax(logits, dim=1) # Apply softmax if multi-class output probabilities are desired

    # Optional: for gradient checkpointing to save memory during training
    def use_checkpointing(self):
        self.inc = torch.utils.checkpoint.checkpoint(self.inc)
        self.down1 = torch.utils.checkpoint.checkpoint(self.down1)
        self.down2 = torch.utils.checkpoint.checkpoint(self.down2)
        self.down3 = torch.utils.checkpoint.checkpoint(self.down3)
        self.down4 = torch.utils.checkpoint.checkpoint(self.down4)
        # For Up blocks, need to pass function and then inputs.
        # checkpoint requires static methods or functions, or use_reentrant=True for nn.Module methods
        # A common way is to wrap the forward of the module.
        # For simplicity here, if use_reentrant=True is acceptable (default in older PyTorch for modules):
        if hasattr(torch.utils.checkpoint, 'checkpoint_ Yeşilırmak'): # Check for a non-existent attr to simulate older pytorch
             self.up1 = torch.utils.checkpoint.checkpoint(self.up1.forward)
             self.up2 = torch.utils.checkpoint.checkpoint(self.up2.forward)
             self.up3 = torch.utils.checkpoint.checkpoint(self.up3.forward)
             self.up4 = torch.utils.checkpoint.checkpoint(self.up4.forward)
        else: # PyTorch 1.11+ recommends use_reentrant=False for nn.Sequential or custom modules if possible
             self.up1 = torch.utils.checkpoint.checkpoint(self.up1, use_reentrant=True) # Simpler for now
             self.up2 = torch.utils.checkpoint.checkpoint(self.up2, use_reentrant=True)
             self.up3 = torch.utils.checkpoint.checkpoint(self.up3, use_reentrant=True)
             self.up4 = torch.utils.checkpoint.checkpoint(self.up4, use_reentrant=True)
        self.outc = torch.utils.checkpoint.checkpoint(self.outc)


if __name__ == '__main__':
    # Example Usage
    dummy_input_1channel = torch.randn(2, 1, 256, 256) # Batch_size=2, Channels=1, Height=256, Width=256

    print("--- Testing UNet (Corrected Version) ---")

    # Test with bilinear=False (using ConvTranspose2d)
    model_convtranspose = UNet(n_channels=1, n_classes=1, bilinear=False)
    output_convtranspose = model_convtranspose(dummy_input_1channel)
    print("UNet (bilinear=False) - Input shape:", dummy_input_1channel.shape, "Output shape:", output_convtranspose.shape)
    num_params_convtranspose = sum(p.numel() for p in model_convtranspose.parameters() if p.requires_grad)
    print(f"UNet (bilinear=False) - Num params: {num_params_convtranspose:,}")

    # Test with bilinear=True (using Upsample)
    model_bilinear_true = UNet(n_channels=1, n_classes=1, bilinear=True)
    output_bilinear_true = model_bilinear_true(dummy_input_1channel)
    print("UNet (bilinear=True) - Input shape:", dummy_input_1channel.shape, "Output shape:", output_bilinear_true.shape)
    num_params_bilinear_true = sum(p.numel() for p in model_bilinear_true.parameters() if p.requires_grad)
    print(f"UNet (bilinear=True) - Num params: {num_params_bilinear_true:,}")

    # Test with 3 input channels
    dummy_input_3channel = torch.randn(2, 3, 256, 256)
    model_3c_1class = UNet(n_channels=3, n_classes=1, bilinear=False)
    output_3c_1class = model_3c_1class(dummy_input_3channel)
    print("UNet (3 channels in, 1 class out, bilinear=F) - Output shape:", output_3c_1class.shape)

    # Test with multi-class output
    model_1c_3class = UNet(n_channels=1, n_classes=3, bilinear=False)
    output_1c_3class = model_1c_3class(dummy_input_1channel)
    print("UNet (1 channel in, 3 classes out, bilinear=F) - Output shape:", output_1c_3class.shape)
    print("Output values (sum should be ~1 for each pixel if softmaxed):", output_1c_3class[0, :, 0, 0].sum().item() if output_1c_3class.shape[1] > 1 else "N/A for binary")

    print("\nU-Net model structure is defined and includes options for bilinear upsampling and gradient checkpointing.")
    print("The implementation uses DoubleConv, Down, Up, and OutConv helper modules.")
