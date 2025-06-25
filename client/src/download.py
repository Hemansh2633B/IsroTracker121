import os
from config import DATA_SOURCES, RAW_DATA_DIR

def download_isro_insat():
    # TODO: Implement download logic for ISRO INSAT
    pass

def download_nasa_goes():
    # TODO: Implement download logic for NASA GOES
    pass

def download_nasa_modis():
    # TODO: Implement download logic for NASA MODIS
    pass

def download_esa_sentinel():
    # TODO: Implement download logic for ESA Sentinel
    pass

def download_all():
    download_isro_insat()
    download_nasa_goes()
    download_nasa_modis()
    download_esa_sentinel()

if __name__ == "__main__":
    os.makedirs(RAW_DATA_DIR, exist_ok=True)
    download_all()