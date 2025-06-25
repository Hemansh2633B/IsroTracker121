# Tropical Cloud Cluster Detection Pipeline

## Steps

1. **Environment & Data Pipelines:**  
   - Setup Python env: `pip install -r requirements.txt`
   - Structure `data/` as shown above.

2. **Data Download & Preprocessing:**  
   - Run: `python src/download.py`  
   - Run: `python src/preprocess.py`

3. **Model Training:**  
   - Edit `src/train.py` to choose `UNet` or `VisionTransformer`.
   - Run: `python src/train.py` or use the dashboard.

4. **Validation:**  
   - Run: `python src/validate.py` or use the dashboard.

5. **Dashboard:**  
   - `streamlit run src/dashboard/app.py`

## Requirements

See `requirements.txt`.

## Notes

- Fill in TODOs for your specific datasets and model choices.
- Modular design for easy expansion.