import argparse
import torch
from torch.utils.data import DataLoader, Dataset
from torch import nn, optim
import numpy as np
from models.unet import UNet
from models.vit import VisionTransformer
import os

class CloudDataset(Dataset):
    def __init__(self, images_dir, masks_dir, transform=None):
        self.image_files = sorted([os.path.join(images_dir, f) for f in os.listdir(images_dir)])
        self.mask_files = sorted([os.path.join(masks_dir, f) for f in os.listdir(masks_dir)])
        self.transform = transform

    def __len__(self):
        return len(self.image_files)

    def __getitem__(self, idx):
        img = np.load(self.image_files[idx])  # or use image loader for .png/.tif
        mask = np.load(self.mask_files[idx])
        img = torch.tensor(img, dtype=torch.float32).permute(2, 0, 1)  # (C,H,W)
        mask = torch.tensor(mask, dtype=torch.float32).unsqueeze(0)
        if self.transform:
            img, mask = self.transform(img, mask)
        return img, mask

def train(model_type="unet", epochs=10, batch_size=4, lr=1e-3, device="cuda" if torch.cuda.is_available() else "cpu"):
    images_dir = "data/processed/images"
    masks_dir = "data/processed/masks"
    dataset = CloudDataset(images_dir, masks_dir)
    dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=True)
    
    if model_type == "unet":
        model = UNet(in_channels=dataset[0][0].shape[0], out_channels=1)
    elif model_type == "vit":
        model = VisionTransformer(in_channels=dataset[0][0].shape[0], num_classes=2)
    else:
        raise ValueError("Invalid model_type, choose 'unet' or 'vit'")
    
    model = model.to(device)
    criterion = nn.BCEWithLogitsLoss()
    optimizer = optim.Adam(model.parameters(), lr=lr)

    for epoch in range(epochs):
        model.train()
        total_loss = 0
        for imgs, masks in dataloader:
            imgs, masks = imgs.to(device), masks.to(device)
            optimizer.zero_grad()
            outputs = model(imgs)
            if model_type == "unet":
                outputs = outputs.squeeze(1)
            loss = criterion(outputs, masks.squeeze(1))
            loss.backward()
            optimizer.step()
            total_loss += loss.item()
        print(f"Epoch {epoch+1}/{epochs}, Loss: {total_loss/len(dataloader):.4f}")

    os.makedirs("models", exist_ok=True)
    torch.save(model.state_dict(), f"models/{model_type}_cloud.pth")
    print("Training complete. Model saved.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--model_type", type=str, default="unet")
    parser.add_argument("--epochs", type=int, default=10)
    parser.add_argument("--batch_size", type=int, default=4)
    parser.add_argument("--lr", type=float, default=1e-3)
    args = parser.parse_args()
    train(
        model_type=args.model_type,
        epochs=args.epochs,
        batch_size=args.batch_size,
        lr=args.lr
    )