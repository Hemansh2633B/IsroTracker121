# Configuration settings for the tropical cloud AI project

class Config:
    DATA_PATH = 'data/'
    MODEL_PATH = 'models/'
    OUTPUT_PATH = 'output/'
    
    # U-Net parameters
    UNET_INPUT_SIZE = (256, 256, 3)
    UNET_NUM_CLASSES = 2
    UNET_LR = 1e-4
    UNET_EPOCHS = 50
    
    # ConvLSTM parameters
    CONVLSTM_INPUT_SHAPE = (10, 256, 256, 3)  # 10 time steps
    CONVLSTM_LR = 1e-4
    CONVLSTM_EPOCHS = 50
    
    # Rainfall predictor parameters
    RAINFALL_INPUT_SIZE = (256, 256, 3)
    RAINFALL_LR = 1e-4
    RAINFALL_EPOCHS = 50
    
    # Cyclone classifier parameters
    CYCLONE_INPUT_SIZE = (256, 256, 3)
    CYCLONE_NUM_CLASSES = 3  # Example: No Cyclone, Weak Cyclone, Strong Cyclone
    CYCLONE_LR = 1e-4
    CYCLONE_EPOCHS = 50
    
    # Other settings
    BATCH_SIZE = 16
    SEED = 42
    NUM_WORKERS = 4
    LOGGING_DIR = 'logs/'