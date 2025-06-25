import argparse
import torch
from torch.utils.data import DataLoader, Dataset, Subset
from torch import nn, optim
import numpy as np
import os
import logging
from sklearn.model_selection import train_test_split
# Assuming models are in client/src/models/
from models.unet import UNet
# from models.vit import VisionTransformer # Keep if ViT training is also a goal

# Assuming config.py is in client/src/
try:
    from config import PROCESSED_DATA_DIR, MODEL_DIR
except ImportError:
    print("Warning: config.py not found or PROCESSED_DATA_DIR/MODEL_DIR not defined. Using placeholders.")
    PROCESSED_DATA_DIR = "data/processed_placeholder" # Should match process.py
    MODEL_DIR = "models_placeholder"

# --- Configure Logging ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- Dataset Definition ---
class CloudSegmentationDataset(Dataset):
    def __init__(self, image_paths, mask_paths, transform=None, target_transform=None):
        self.image_paths = image_paths
        self.mask_paths = mask_paths
        self.transform = transform
        self.target_transform = target_transform # For mask specific transforms if needed

        if len(self.image_paths) != len(self.mask_paths):
            raise ValueError("Number of images and masks must be the same.")
        if len(self.image_paths) == 0:
            raise ValueError("No images found. Check dataset paths.")
        logging.info(f"Dataset initialized with {len(self.image_paths)} samples.")

    def __len__(self):
        return len(self.image_paths)

    def __getitem__(self, idx):
        try:
            img_path = self.image_paths[idx]
            mask_path = self.mask_paths[idx]

            # Load image and mask - assuming .npy format from process.py
            # Image shape expected by UNet: (C, H, W)
            # Mask shape expected for BCEWithLogitsLoss: (1, H, W) or (H, W)
            image = np.load(img_path) # Should be (H, W, C) or (C, H, W)
            mask = np.load(mask_path)   # Should be (H, W) or (1, H, W)

            # Ensure image is (C, H, W) - common PyTorch convention
            if image.ndim == 2: # H, W -> 1, H, W (grayscale)
                image = np.expand_dims(image, axis=0)
            elif image.ndim == 3 and image.shape[-1] < image.shape[0] and image.shape[-1] < image.shape[1]: # H, W, C -> C, H, W
                 image = np.transpose(image, (2, 0, 1))

            # Ensure mask is (1, H, W) or (H,W) and float for BCEWithLogitsLoss
            if mask.ndim == 3 and mask.shape[0] == 1: # Already (1,H,W)
                pass
            elif mask.ndim == 2: # H,W -> 1,H,W
                mask = np.expand_dims(mask, axis=0)
            else: # Other format, try to squeeze if possible
                mask = np.squeeze(mask)
                if mask.ndim == 2: mask = np.expand_dims(mask, axis=0)
                else: raise ValueError(f"Mask {mask_path} has unexpected shape {mask.shape} after squeeze")


            image = torch.tensor(image, dtype=torch.float32)
            mask = torch.tensor(mask, dtype=torch.float32) # BCEWithLogitsLoss expects float targets

            if self.transform:
                image = self.transform(image)
            if self.target_transform: # If you have specific transforms for masks
                mask = self.target_transform(mask)

            return image, mask
        except Exception as e:
            logging.error(f"Error loading data at index {idx}: Image: {self.image_paths[idx]}, Mask: {self.mask_paths[idx]}. Error: {e}")
            # Return a dummy sample or skip. For simplicity, we might raise or return None and handle in collate_fn
            # For now, let's make it return something to avoid crashing DataLoader, but this needs robust handling
            dummy_img_shape = (3, 256, 256) if image is None or image.ndim < 2 else image.shape
            dummy_mask_shape = (1, 256, 256) if mask is None or mask.ndim < 2 else mask.shape
            return torch.zeros(dummy_img_shape, dtype=torch.float32), torch.zeros(dummy_mask_shape, dtype=torch.float32)


# --- Metrics ---
def dice_coefficient(preds, targets, smooth=1e-6):
    preds = torch.sigmoid(preds) # Apply sigmoid if model outputs logits
    preds = (preds > 0.5).float() # Binarize

    intersection = (preds * targets).sum(dim=(1,2,3) if preds.ndim == 4 else (1,2)) # Sum over H, W, (and C if present)
    union = preds.sum(dim=(1,2,3) if preds.ndim == 4 else (1,2)) + targets.sum(dim=(1,2,3) if preds.ndim == 4 else (1,2))
    dice = (2. * intersection + smooth) / (union + smooth)
    return dice.mean() # Average over batch

def iou_score(preds, targets, smooth=1e-6):
    preds = torch.sigmoid(preds) # Apply sigmoid if model outputs logits
    preds = (preds > 0.5).float() # Binarize

    intersection = (preds * targets).sum(dim=(1,2,3) if preds.ndim == 4 else (1,2))
    union = preds.sum(dim=(1,2,3) if preds.ndim == 4 else (1,2)) + targets.sum(dim=(1,2,3) if preds.ndim == 4 else (1,2)) - intersection
    iou = (intersection + smooth) / (union + smooth)
    return iou.mean()


# --- Training Function ---
def train_model(
    model_type="unet",
    n_channels=1, # Number of input channels for the model
    n_classes=1,  # Number of output classes (1 for binary segmentation)
    epochs=25,
    batch_size=4,
    lr=1e-4,
    val_split=0.2,
    device_str="cuda" if torch.cuda.is_available() else "cpu",
    save_checkpoint=True
    ):

    ensure_dir(MODEL_DIR)
    ensure_dir(PROCESSED_DATA_DIR) # process.py should create subdirs like /images and /masks

    # Assuming PROCESSED_DATA_DIR contains subdirs 'images' and 'masks'
    # These subdirs are expected to be populated by process.py with .npy files
    images_base_dir = os.path.join(PROCESSED_DATA_DIR, "all_sources_images") # Example, adjust if process.py saves differently
    masks_base_dir = os.path.join(PROCESSED_DATA_DIR, "all_sources_masks")   # Example

    # Create dummy data if dirs don't exist or are empty, for testing the script structure
    ensure_dir(images_base_dir)
    ensure_dir(masks_base_dir)
    if not os.listdir(images_base_dir) or not os.listdir(masks_base_dir):
        logging.warning(f"Processed data not found or empty in {images_base_dir} or {masks_base_dir}. Creating dummy data for test run.")
        # Create a few dummy .npy files
        for i in range(10): # Create 10 dummy samples
            dummy_img = np.random.rand(n_channels, 256, 256).astype(np.float32)
            dummy_mask = np.random.randint(0, 2, (1, 256, 256)).astype(np.float32)
            np.save(os.path.join(images_base_dir, f"dummy_img_{i}.npy"), dummy_img)
            np.save(os.path.join(masks_base_dir, f"dummy_mask_{i}.npy"), dummy_mask)

    all_image_files = sorted([os.path.join(images_base_dir, f) for f in os.listdir(images_base_dir) if f.endswith('.npy')])
    all_mask_files = sorted([os.path.join(masks_base_dir, f) for f in os.listdir(masks_base_dir) if f.endswith('.npy')])

    # Match files - very basic matching, assumes corresponding sort order
    # A more robust approach would match by base filename if prefixes/suffixes differ
    if len(all_image_files) != len(all_mask_files):
        logging.warning("Mismatch in number of image and mask files. Trying to find common subset by name.")
        img_basenames = {os.path.splitext(os.path.basename(f))[0].replace("_patch_","").replace("_img_","") : f for f in all_image_files}
        mask_basenames = {os.path.splitext(os.path.basename(f))[0].replace("_mask_","") : f for f in all_mask_files}
        common_basenames = set(img_basenames.keys()) & set(mask_basenames.keys())

        all_image_files = [img_basenames[bn] for bn in common_basenames]
        all_mask_files = [mask_basenames[bn] for bn in common_basenames]
        logging.info(f"Found {len(all_image_files)} common image/mask pairs.")


    if not all_image_files:
        logging.error("No training data found after matching. Please check data processing and paths.")
        return

    # Split data
    img_train, img_val, mask_train, mask_val = train_test_split(
        all_image_files, all_mask_files, test_size=val_split, random_state=42
    )

    train_dataset = CloudSegmentationDataset(image_paths=img_train, mask_paths=mask_train) # Add transforms later
    val_dataset = CloudSegmentationDataset(image_paths=img_val, mask_paths=mask_val)

    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=2, pin_memory=True)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=2, pin_memory=True)

    logging.info(f"Training with {len(train_dataset)} samples, Validating with {len(val_dataset)} samples.")

    device = torch.device(device_str)

    if model_type.lower() == "unet":
        model = UNet(n_channels=n_channels, n_classes=n_classes, bilinear=False) # bilinear can be an arg
    # elif model_type.lower() == "vit":
    #     model = VisionTransformer(img_size=256, patch_size=16, in_chans=n_channels, num_classes=n_classes) # Example ViT init
    else:
        logging.error(f"Invalid model_type: {model_type}. Choose 'unet'.") # or 'vit'
        return

    model = model.to(device)

    # Loss and Optimizer
    # For binary segmentation (n_classes=1), BCEWithLogitsLoss is common.
    # For multi-class, CrossEntropyLoss (expects raw logits from model and Long targets for masks).
    if n_classes == 1:
        criterion = nn.BCEWithLogitsLoss()
    else:
        # criterion = nn.CrossEntropyLoss() # If n_classes > 1, masks should be LongTensor (C, H, W) or (H,W) with class indices
        logging.warning("Multi-class not fully configured for loss/metrics, using BCEWithLogitsLoss as placeholder.")
        criterion = nn.BCEWithLogitsLoss() # Placeholder, needs adjustment for multi-class

    optimizer = optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-5)
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, 'min', patience=3, factor=0.1, verbose=True)

    best_val_metric = -float('inf') # Or float('inf') if using loss

    logging.info(f"Starting training: {epochs} epochs, Batch size: {batch_size}, LR: {lr}, Device: {device_str}")

    for epoch in range(epochs):
        model.train()
        epoch_train_loss = 0.0
        epoch_train_dice = 0.0
        epoch_train_iou = 0.0

        for i, (images, masks) in enumerate(train_loader):
            images, masks = images.to(device), masks.to(device)

            optimizer.zero_grad()
            outputs = model(images) # Model output: (B, n_classes, H, W)

            loss = criterion(outputs, masks) # BCEWithLogitsLoss expects logits and float targets

            loss.backward()
            optimizer.step()

            epoch_train_loss += loss.item()
            # Metrics calculated on logits for binary case
            epoch_train_dice += dice_coefficient(outputs, masks).item()
            epoch_train_iou += iou_score(outputs, masks).item()

            if (i + 1) % 2 == 0: # Log every 20 batches
                 logging.info(f"Epoch [{epoch+1}/{epochs}], Batch [{i+1}/{len(train_loader)}], Batch Loss: {loss.item():.4f}")

        avg_train_loss = epoch_train_loss / len(train_loader)
        avg_train_dice = epoch_train_dice / len(train_loader)
        avg_train_iou = epoch_train_iou / len(train_loader)
        logging.info(f"--- Epoch {epoch+1} Train Summary --- Loss: {avg_train_loss:.4f}, Dice: {avg_train_dice:.4f}, IoU: {avg_train_iou:.4f}")

        # Validation phase
        model.eval()
        epoch_val_loss = 0.0
        epoch_val_dice = 0.0
        epoch_val_iou = 0.0
        with torch.no_grad():
            for images, masks in val_loader:
                images, masks = images.to(device), masks.to(device)
                outputs = model(images)
                loss = criterion(outputs, masks)

                epoch_val_loss += loss.item()
                epoch_val_dice += dice_coefficient(outputs, masks).item()
                epoch_val_iou += iou_score(outputs, masks).item()

        avg_val_loss = epoch_val_loss / len(val_loader)
        avg_val_dice = epoch_val_dice / len(val_loader)
        avg_val_iou = epoch_val_iou / len(val_loader)
        logging.info(f"--- Epoch {epoch+1} Val Summary --- Loss: {avg_val_loss:.4f}, Dice: {avg_val_dice:.4f}, IoU: {avg_val_iou:.4f}")

        scheduler.step(avg_val_loss) # Or another metric like avg_val_dice if maximizing

        # Save checkpoint
        current_val_metric = avg_val_dice # Using Dice for saving best model
        if current_val_metric > best_val_metric:
            best_val_metric = current_val_metric
            if save_checkpoint:
                checkpoint_path = os.path.join(MODEL_DIR, f"{model_type}_best_epoch{epoch+1}_dice{best_val_metric:.4f}.pth")
                torch.save(model.state_dict(), checkpoint_path)
                logging.info(f"Checkpoint saved: {checkpoint_path} (Best Val Dice: {best_val_metric:.4f})")

    # Save final model
    if save_checkpoint:
        final_model_path = os.path.join(MODEL_DIR, f"{model_type}_final_cloud_segmentation.pth")
        torch.save(model.state_dict(), final_model_path)
        logging.info(f"Training complete. Final model saved to {final_model_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train a segmentation model for cloud detection.")
    parser.add_argument("--model_type", type=str, default="unet", help="Model type: 'unet'") # or 'vit'
    parser.add_argument("--n_channels", type=int, default=1, help="Number of input channels (e.g., 1 for grayscale, 3 for RGB-like)")
    parser.add_argument("--n_classes", type=int, default=1, help="Number of output classes (1 for binary segmentation)")
    parser.add_argument("--epochs", type=int, default=10, help="Number of training epochs") # Reduced for quick test
    parser.add_argument("--batch_size", type=int, default=2, help="Batch size") # Reduced for quick test
    parser.add_argument("--lr", type=float, default=1e-4, help="Learning rate")
    parser.add_argument("--val_split", type=float, default=0.2, help="Proportion of data for validation (0.0 to 1.0)")
    parser.add_argument("--device", type=str, default="cuda" if torch.cuda.is_available() else "cpu", help="Device: 'cuda' or 'cpu'")

    args = parser.parse_args()

    train_model(
        model_type=args.model_type,
        n_channels=args.n_channels,
        n_classes=args.n_classes,
        epochs=args.epochs,
        batch_size=args.batch_size,
        lr=args.lr,
        val_split=args.val_split,
        device_str=args.device
    )
    logging.info("--- Training script finished ---")
