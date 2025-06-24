import os
import requests
import zipfile
import time

def download_file(url, dest_folder):
    if not os.path.exists(dest_folder):
        os.makedirs(dest_folder)
    
    response = requests.get(url, stream=True)
    if response.status_code == 200:
        file_path = os.path.join(dest_folder, url.split('/')[-1])
        with open(file_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        return file_path
    else:
        raise Exception(f"Failed to download file: {url}")

def unzip_file(zip_file_path, extract_to):
    with zipfile.ZipFile(zip_file_path, 'r') as zip_ref:
        zip_ref.extractall(extract_to)

def auto_download_ir_images(base_url, dest_folder, max_retries=5):
    for attempt in range(max_retries):
        try:
            zip_file_path = download_file(base_url, dest_folder)
            unzip_file(zip_file_path, dest_folder)
            os.remove(zip_file_path)
            print("Download and extraction successful.")
            break
        except Exception as e:
            print(f"Attempt {attempt + 1} failed: {e}")
            time.sleep(2)  # Wait before retrying
    else:
        print("All attempts to download the file failed.")