import torch
import torch.nn as nn

class UNet(nn.Module):
    def __init__(self, in_channels=3, out_channels=1):
        super().__init__()
        # Minimal stub, replace with your full U-Net
        self.conv = nn.Conv2d(in_channels, out_channels, kernel_size=3, padding=1)
    def forward(self, x):
        return self.conv(x)