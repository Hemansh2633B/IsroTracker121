import streamlit as st
import subprocess
import os

st.set_page_config(
    page_title="Tropical Cloud Cluster Detection",
    layout="wide"
)

st.title("🌩️ Tropical Cloud Cluster Detection Platform")

st.markdown("""
This dashboard allows you to train deep learning models (U-Net or Vision Transformer) for tropical cloud cluster detection using satellite data, validate results, and interact with a deployed API and visualization tools.
""")

st.header("1. Model Training")

# --- Model, Training Parameter Selection ---
with st.form("train_form"):
    model_type = st.selectbox("Model Architecture", ["unet", "vit"])
    epochs = st.number_input("Epochs", min_value=1, max_value=100, value=10)
    batch_size = st.number_input("Batch Size", min_value=1, max_value=64, value=4)
    lr = st.number_input("Learning Rate", min_value=1e-6, max_value=1e-1, value=1e-3, format="%.6f")
    submitted = st.form_submit_button("Start Training")

if submitted:
    st.info(f"Starting training: {model_type} | epochs: {epochs} | batch size: {batch_size} | lr: {lr}")
    cmd = [
        "python", "src/train.py",
        "--model_type", model_type,
        "--epochs", str(epochs),
        "--batch_size", str(batch_size),
        "--lr", str(lr)
    ]
    with st.spinner("Training in progress..."):
        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
        log_area = st.empty()
        logs = ""
        for line in iter(process.stdout.readline, ''):
            logs += line
            log_area.text(logs)
        process.stdout.close()
        process.wait()
    st.success("Training complete!")

st.header("2. Validation")
if st.button("Validate Latest Model"):
    st.info("Running validation...")
    cmd = ["python", "src/validate.py"]
    with st.spinner("Validation in progress..."):
        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
        val_output = ""
        for line in iter(process.stdout.readline, ''):
            val_output += line
        process.stdout.close()
        process.wait()
    st.text(val_output)
    st.success("Validation complete!")

st.header("3. Predict & Visualize")
uploaded_file = st.file_uploader("Upload a satellite image (npy, png, tiff, etc.) for prediction", type=["npy", "png", "tif", "tiff"])
if uploaded_file is not None:
    st.info("Prediction feature coming soon! (Integrate with API or model inference)")

st.header("4. API & NLP/LLM Assistant")
st.markdown("""
Interact with the deployed API or ask questions about the data, models, or results using an integrated LLM-powered assistant.
""")

user_query = st.text_area("Ask a question (e.g., 'Explain the cloud cluster detection results'):")
if st.button("Ask LLM"):
    st.info("LLM integration coming soon! (Connect to backend LLM service)")

st.markdown("---")
st.caption("Developed for tropical satellite cloud cluster AI research. Modular and extensible for your workflow.")