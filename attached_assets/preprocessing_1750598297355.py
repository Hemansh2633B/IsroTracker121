import os
import numpy as np
import cv2

def normalize_image(image):
    return (image - np.min(image)) / (np.max(image) - np.min(image))

def save_image(image, path):
    cv2.imwrite(path, image)

def preprocess_images(image_paths, save_dir):
    if not os.path.exists(save_dir):
        os.makedirs(save_dir)
    
    for image_path in image_paths:
        image = cv2.imread(image_path)
        normalized_image = normalize_image(image)
        save_image(os.path.join(save_dir, os.path.basename(image_path)), normalized_image)

def preprocess_masks(mask_paths, save_dir):
    if not os.path.exists(save_dir):
        os.makedirs(save_dir)
    
    for mask_path in mask_paths:
        mask = cv2.imread(mask_path, cv2.IMREAD_GRAYSCALE)
        normalized_mask = normalize_image(mask)
        save_image(os.path.join(save_dir, os.path.basename(mask_path)), normalized_mask)