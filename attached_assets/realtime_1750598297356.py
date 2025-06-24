import tensorflow as tf
import numpy as np
import cv2
import os
from src.models.unet import UNet
from src.models.convlstm import ConvLSTM
from src.models.rainfall_predictor import RainfallPredictor
from src.models.cyclone_classifier import CycloneClassifier
from src.data.preprocessing import preprocess_image
from src.inference.postprocess import postprocess_output

class RealTimeInference:
    def __init__(self, model_paths):
        self.unet_model = UNet()
        self.convlstm_model = ConvLSTM()
        self.rainfall_model = RainfallPredictor()
        self.cyclone_model = CycloneClassifier()
        
        self.load_models(model_paths)

    def load_models(self, model_paths):
        self.unet_model.load_weights(model_paths['unet'])
        self.convlstm_model.load_weights(model_paths['convlstm'])
        self.rainfall_model.load_weights(model_paths['rainfall'])
        self.cyclone_model.load_weights(model_paths['cyclone'])

    def run_inference(self, image):
        preprocessed_image = preprocess_image(image)
        
        segmentation = self.unet_model.predict(np.expand_dims(preprocessed_image, axis=0))
        tracked_clusters = self.convlstm_model.predict(np.expand_dims(segmentation, axis=0))
        rainfall_prediction = self.rainfall_model.predict(np.expand_dims(preprocessed_image, axis=0))
        cyclone_classification = self.cyclone_model.predict(np.expand_dims(preprocessed_image, axis=0))

        postprocessed_segmentation = postprocess_output(segmentation)
        
        return {
            'segmentation': postprocessed_segmentation,
            'tracked_clusters': tracked_clusters,
            'rainfall_prediction': rainfall_prediction,
            'cyclone_classification': cyclone_classification
        }

    def start_real_time_inference(self, video_source=0):
        cap = cv2.VideoCapture(video_source)

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            results = self.run_inference(frame)

            # Visualization code can be added here

            cv2.imshow('Real-Time Inference', frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

        cap.release()
        cv2.destroyAllWindows()

if __name__ == "__main__":
    model_paths = {
        'unet': 'path/to/unet/model',
        'convlstm': 'path/to/convlstm/model',
        'rainfall': 'path/to/rainfall/model',
        'cyclone': 'path/to/cyclone/model'
    }
    inference_system = RealTimeInference(model_paths)
    inference_system.start_real_time_inference()