from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import ConvLSTM2D, BatchNormalization, TimeDistributed, Conv2D

def create_convlstm_model(input_shape, num_classes):
    model = Sequential()

    model.add(ConvLSTM2D(filters=64, kernel_size=(3, 3), input_shape=input_shape,
                         padding='same', return_sequences=True))
    model.add(BatchNormalization())
    model.add(ConvLSTM2D(filters=64, kernel_size=(3, 3), padding='same', return_sequences=True))
    model.add(BatchNormalization())
    
    model.add(TimeDistributed(Conv2D(filters=32, kernel_size=(3, 3), padding='same', activation='relu')))
    model.add(BatchNormalization())
    
    model.add(TimeDistributed(Conv2D(filters=num_classes, kernel_size=(1, 1), padding='same', activation='softmax')))
    
    return model