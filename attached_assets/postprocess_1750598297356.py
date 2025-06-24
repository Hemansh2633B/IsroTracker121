def thresholding(output, threshold=0.5):
    return (output > threshold).astype(int)

def visualize_segmentation(image, mask, prediction):
    import matplotlib.pyplot as plt

    plt.figure(figsize=(12, 6))
    plt.subplot(1, 3, 1)
    plt.title("Original Image")
    plt.imshow(image)
    plt.axis('off')

    plt.subplot(1, 3, 2)
    plt.title("True Mask")
    plt.imshow(mask, cmap='gray')
    plt.axis('off')

    plt.subplot(1, 3, 3)
    plt.title("Predicted Mask")
    plt.imshow(prediction, cmap='gray')
    plt.axis('off')

    plt.show()

def postprocess_output(model_output, threshold=0.5):
    binary_mask = thresholding(model_output, threshold)
    return binary_mask