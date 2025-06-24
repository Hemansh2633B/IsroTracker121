def load_image(image_path):
    # Function to load an image from a given path
    from PIL import Image
    import numpy as np

    image = Image.open(image_path)
    return np.array(image)

def save_image(image_array, save_path):
    # Function to save an image array to a specified path
    from PIL import Image

    image = Image.fromarray(image_array)
    image.save(save_path)

def augment_data(image, mask):
    # Function to perform data augmentation on images and masks
    from tensorflow.keras.preprocessing.image import ImageDataGenerator

    datagen = ImageDataGenerator(rotation_range=20,
                                 width_shift_range=0.2,
                                 height_shift_range=0.2,
                                 shear_range=0.2,
                                 zoom_range=0.2,
                                 horizontal_flip=True,
                                 fill_mode='nearest')

    image = np.expand_dims(image, axis=0)
    mask = np.expand_dims(mask, axis=0)

    augmented_image = next(datagen.flow(image, batch_size=1))[0].astype(np.uint8)
    augmented_mask = next(datagen.flow(mask, batch_size=1))[0].astype(np.uint8)

    return augmented_image[0], augmented_mask[0]

def list_files_in_directory(directory):
    # Function to list all files in a given directory
    import os

    return [f for f in os.listdir(directory) if os.path.isfile(os.path.join(directory, f))]