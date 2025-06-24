# Tropical Cloud AI

## Overview
Tropical Cloud AI is a comprehensive system designed for the analysis and prediction of tropical cloud formations. This project utilizes advanced machine learning techniques, including U-Net segmentation, ConvLSTM tracking, rainfall prediction, and cyclone classification, to provide real-time insights into tropical weather patterns.

## Project Structure
The project is organized into the following directories and files:

```
tropical-cloud-ai
├── src
│   ├── data
│   │   ├── downloader.py        # Functions to download IR images from MOSDAC FTP/API
│   │   ├── preprocessing.py      # Functions for normalizing and saving IR images and masks
│   │   └── utils.py             # Utility functions for data processing
│   ├── models
│   │   ├── unet.py              # U-Net model architecture for segmentation
│   │   ├── convlstm.py          # ConvLSTM model for tracking cloud clusters
│   │   ├── rainfall_predictor.py # CNN-based model for rainfall prediction
│   │   └── cyclone_classifier.py  # Model for classifying cyclone genesis
│   ├── inference
│   │   ├── realtime.py          # Real-time inference loop
│   │   └── postprocess.py       # Functions for post-processing model outputs
│   ├── ui
│   │   └── tkinter_app.py       # Tkinter GUI for user interaction
│   ├── main.py                  # Entry point for the application
│   └── config.py                # Configuration settings for the project
├── requirements.txt              # Project dependencies
└── README.md                     # Project documentation
```

## Installation
To set up the project, clone the repository and install the required dependencies:

```bash
git clone <repository-url>
cd tropical-cloud-ai
pip install -r requirements.txt
```

## Usage
1. **Data Downloading**: Use the `downloader.py` script to automatically download new infrared images.
2. **Data Preprocessing**: Run the `preprocessing.py` script to normalize and save the images and masks for training.
3. **Model Training**: Implement training scripts using the models defined in the `models` directory.
4. **Real-time Inference**: Use the `realtime.py` script to load trained models and process incoming data for predictions.
5. **User Interface**: Launch the Tkinter application using `tkinter_app.py` to interact with the system and visualize results.

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for more details.