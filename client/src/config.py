DATA_SOURCES = {
    "isro_insat": {
        "url": "Search MOSDAC (mosdac.gov.in) or IMGEOS (imgeos.gov.in)",
        "notes": "Requires registration. Check for FTP/HTTP download options. Data: INSAT-3D, INSAT-3DR."
    },
    "nasa_goes": {
        "url": "NOAA CLASS (ncei.noaa.gov/class), AWS S3 (s3://noaa-goes16/, s3://noaa-goes17/), Google Cloud",
        "notes": "ABI instrument data. Check for specific product names (e.g., Cloud Top Temperature). Libraries: requests, boto3."
    },
    "nasa_modis": {
        "url": "LAADS DAAC (ladsweb.modaps.eosdis.nasa.gov), Earthdata Search (search.earthdata.nasa.gov)",
        "notes": "Terra and Aqua satellite data. Products like MOD06/MYD06 (Cloud Product). Requires Earthdata login for bulk access."
    },
    "esa_sentinel": {
        "url": "Copernicus Data Space Ecosystem (dataspace.copernicus.eu), Sentinel Hub (sentinel-hub.com)",
        "notes": "Sentinel-3 (OLCI/SLSTR for clouds) or Sentinel-2 (MSI). Copernicus Hub API often used with 'sentinelsat' library."
    }
}
RAW_DATA_DIR = "data/raw"  # Base directory for raw downloaded data
# Example: data/raw/isro_insat/, data/raw/nasa_goes/, etc.
PROCESSED_DATA_DIR = "data/processed"
MODEL_DIR = "models"
# TODO: Add API keys or credentials if required, ideally via environment variables or a secure config
# Example: NASA_EARTHDATA_LOGIN_USER = "your_username"
# NASA_EARTHDATA_LOGIN_PASSWORD = "your_password"
# Test comment to check file modification