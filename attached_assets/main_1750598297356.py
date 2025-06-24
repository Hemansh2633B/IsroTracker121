import os
import sys
from data.downloader import download_data
from data.preprocessing import preprocess_data
from models.unet import UNet
from models.convlstm import ConvLSTM
from models.rainfall_predictor import RainfallPredictor
from models.cyclone_classifier import CycloneClassifier
from inference.realtime import RealTimeInference
from ui.tkinter_app import run_tkinter_app
from config import Config

def main():
    config = Config()
    
    if not os.path.exists(config.data_dir):
        print("Downloading data...")
        download_data(config.data_dir)
    
    print("Preprocessing data...")
    preprocess_data(config.data_dir, config.preprocessed_data_dir)
    
    print("Initializing models...")
    unet_model = UNet(config)
    convlstm_model = ConvLSTM(config)
    rainfall_model = RainfallPredictor(config)
    cyclone_model = CycloneClassifier(config)
    
    print("Starting real-time inference...")
    real_time_inference = RealTimeInference(unet_model, convlstm_model, rainfall_model, cyclone_model, config)
    
    print("Launching GUI...")
    run_tkinter_app(real_time_inference)

if __name__ == "__main__":
    main()