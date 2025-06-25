# Tropical Cloud Cluster Detection Pipeline

## Overview

This project is an AI/ML pipeline designed to identify tropical cloud clusters (TCCs) using satellite data. It features a web-based frontend for visualization and interaction, a Node.js/Express backend API, and Python scripts for data processing and PyTorch model training.

The goal is to provide a system for downloading satellite imagery, processing it, training a segmentation model (U-Net) to detect cloud clusters, and visualizing these results on an interactive map.

## Tech Stack

*   **Frontend:** React, TypeScript, Vite, Tailwind CSS, Leaflet, `@tanstack/react-query`, Shadcn UI
*   **Backend API:** Node.js, TypeScript, Express.js (tsx for development)
*   **AI/ML (Python):** PyTorch, NumPy, scikit-learn, various libraries for satellite data handling (xarray, rasterio, etc. - see `requirements.txt`)
*   **Database (Optional, if used by server):** NeonDB (Postgres) with Drizzle ORM (inferred from `package.json` dependencies)

## Project Structure

*   `client/`: Contains the React frontend source code.
    *   `client/src/components/`: Reusable React components.
    *   `client/src/pages/`: Top-level page components (e.g., Dashboard).
    *   `client/src/assets/`: Static assets like images, icons.
    *   `client/src/lib/`: Utility functions and type definitions for the client.
    *   `client/src/download.py`, `client/src/process.py`, `client/src/train.py`: Python scripts for AI/ML tasks.
    *   `client/src/models/`: Python ML models (e.g., `unet.py`).
*   `server/`: Node.js/Express backend API source code.
*   `public/`: Static assets served by Vite (e.g., `index.html` for the client).
*   `package.json`: Manages Node.js dependencies for both client and server, and provides build/run scripts.
*   `requirements.txt`: Python dependencies for the AI/ML pipeline. (Successfully renamed from `requirments.txt`)
*   `data/`: (Convention, should be created by user or scripts)
    *   `data/raw/`: For raw downloaded satellite data.
    *   `data/processed/`: For preprocessed data ready for model training/inference.
    *   `data/processed_placeholder/`: Dummy data directory created by `client/src/process.py` if actual data is not found.
*   `models/`: (Convention, should be created by `client/src/train.py`) For saved trained model checkpoints.
*   `models_placeholder/`: Dummy models directory created by `client/src/train.py` if `config.py` is not fully set up.

*Note on Python scripts location:* The Python scripts for data handling and model training are currently located within `client/src/`. For better project organization, consider refactoring these into a dedicated top-level `python_pipeline/` or `ai_scripts/` directory in the future.

## Setup and Running

### Prerequisites

*   Node.js (v18.x or v20.x recommended)
*   npm (comes with Node.js)
*   Python (v3.8+ recommended)
*   pip (comes with Python)

### 1. Clone Repository

```bash
git clone <repository_url>
cd <repository_directory>
```

### 2. Install Node.js Dependencies

From the project root directory, install all Node.js dependencies listed in `package.json` (for both client and server):

```bash
npm install
```

This will also install `leaflet`, `react-leaflet@^4.2.1`, and `@types/leaflet` which were added for the map functionality.

### 3. Install Python Dependencies

It's highly recommended to use a Python virtual environment.

```bash
# Create a virtual environment (optional but recommended)
python -m venv .venv
# Activate it:
# On Windows: .venv\Scripts\activate
# On macOS/Linux: source .venv/bin/activate

# Install Python packages
pip install -r requirements.txt
```

### 4. Configure Environment (if needed)

*   **Python Scripts (`client/src/config.py`):** The Python scripts rely on `client/src/config.py` for paths like `RAW_DATA_DIR`, `PROCESSED_DATA_DIR`, and `MODEL_DIR`. Ensure these are set up if you intend to use actual data. If not, the scripts have some placeholder behavior.
*   **Server (`server/`):** Check if any `.env` file or specific environment variables are required for the server (e.g., database connection strings, API keys). (Details would be added here as the server is developed).

### 5. Running the Application (Development Mode)

The main development script starts both the backend server and the frontend Vite development server.

From the project root directory:

```bash
npm run dev
```

*   This command typically starts the Express backend server (e.g., on a port like 8000 or as specified in `server/index.ts`).
*   It also starts the Vite development server for the React client (e.g., on port 3000 or 5173, often proxied or served by the backend in dev).
*   Check the console output for the exact URLs and ports. The application should be accessible via a URL like `http://localhost:3000` or `http://localhost:5173` (default Vite port).

### 6. Running Python AI/ML Scripts (Independently)

These scripts are currently located in `client/src/`. Ensure your Python environment (with installed dependencies) is active.

*   **Data Download (Conceptual):**
    ```bash
    python client/src/download.py
    ```
    *Note: This script currently contains a conceptual outline and does not perform actual downloads. It needs to be implemented with specific data source APIs and credentials.*

*   **Data Preprocessing (Conceptual):**
    ```bash
    python client/src/process.py
    ```
    *Note: This script outlines preprocessing steps. If actual raw data (as per `client/src/config.py`) is not found in `data/raw/`, it will create and use dummy data files in `data/raw_placeholder/` and output to `data/processed_placeholder/` for demonstration purposes.*

*   **Model Training:**
    ```bash
    python client/src/train.py --help
    ```
    This will show available training arguments. Example usage:
    ```bash
    python client/src/train.py --n_channels 1 --epochs 20 --batch_size 4 --lr 0.0001
    ```
    *Note: If processed data (from the previous step) is not found in the configured `PROCESSED_DATA_DIR` (e.g., `data/processed_placeholder/all_sources_images`), the training script will generate dummy `.npy` image and mask files for a test run.* Saved models will be placed in `models/` (or `models_placeholder/`).

### 7. Building for Production

To build the frontend and backend for a production deployment:

```bash
npm run build
```

This command will:
1.  Use Vite to build the static assets for the React client (typically into a `dist/client` or similar folder within the root `dist` folder).
2.  Use esbuild to compile the Node.js/Express server into the `dist/` folder.

### 8. Starting the Production Server

After a successful build:

```bash
npm start
```

This runs the optimized server from the `dist/` directory.

## Key Features (Current & Enhanced by Agent Jules)

*   **U-Net Model:** Implemented a standard U-Net architecture for semantic segmentation of cloud clusters (`client/src/models/unet.py`).
*   **Enhanced Training Script:** `client/src/train.py` now includes:
    *   Train/validation data splitting.
    *   Calculation of Dice coefficient and IoU metrics.
    *   Checkpointing to save the best model based on validation performance.
    *   Learning rate scheduling.
    *   Logging of training progress.
    *   Ability to run with dummy data if processed data is not found.
*   **Data Download & Preprocessing Outlines:** Conceptual outlines for data download (`client/src/download.py`) and preprocessing (`client/src/process.py`) have been established, including placeholder execution with dummy data.
*   **Interactive Map Display:** The frontend (`client/src/components/satellite-map.tsx`) now uses Leaflet to display a real map with markers for cloud clusters (currently simulated data).
*   **Comprehensive README:** This file, providing updated setup and operational guidance.

## Notes on FastAPI/Streamlit

The `requirements.txt` file includes `fastapi`, `uvicorn`, and `streamlit`. This suggests potential for alternative Python-based API services or diagnostic dashboards. However, the current primary backend API is the Node.js/Express server found in the `server/` directory, and the main interactive UI is the React client. The Python scripts for data processing and training are standalone scripts for now.

## Future Work / TODOs (Examples)

*   Implement actual data download logic in `client/src/download.py`.
*   Implement detailed data preprocessing routines in `client/src/process.py` using real satellite data libraries.
*   Develop the backend API endpoints in `server/` for:
    *   Serving lists of available (processed) satellite data.
    *   Triggering model inference on selected data.
    *   Returning prediction masks/results to the frontend.
*   Enhance the frontend map to display actual satellite imagery layers and prediction overlays.
*   Implement animation of time-series satellite data on the map.
*   Refactor Python AI/ML scripts into a separate top-level directory.
*   Address vulnerabilities reported by `npm audit`.

---
This README aims to provide a current snapshot and guide for the project.
Contributions and improvements are welcome!
