def preprocess_insat():
    # TODO: Implement INSAT preprocessing (harmonization, normalization)
    pass

def preprocess_goes():
    # TODO: Implement GOES preprocessing
    pass

def preprocess_modis():
    # TODO: Implement MODIS preprocessing
    pass

def preprocess_sentinel():
    # TODO: Implement Sentinel preprocessing
    pass

def preprocess_all():
    preprocess_insat()
    preprocess_goes()
    preprocess_modis()
    preprocess_sentinel()

if __name__ == "__main__":
    preprocess_all()