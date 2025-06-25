# Frontend Client for Tropical Cloud Cluster Detection Pipeline

## Overview

This directory (`client/`) contains the source code for the React-based frontend application. It provides the user interface for visualizing satellite data, interacting with the cloud cluster detection model, and viewing analysis results.

The client is built using:

*   **React:** For building the user interface.
*   **TypeScript:** For static typing.
*   **Vite:** As the build tool and development server.
*   **Tailwind CSS:** For styling.
*   **Shadcn UI:** For pre-built UI components.
*   **Leaflet & React-Leaflet:** For interactive map display.
*   `@tanstack/react-query`: For data fetching and state management related to server data.

## Development

The client application is typically managed and run as part of the main project from the root directory.

1.  **Install Dependencies:**
    Navigate to the project root directory and run:
    ```bash
    npm install
    ```
    This installs all necessary dependencies for both the client and the server, including React, Leaflet, etc.

2.  **Run Development Server:**
    From the project root directory:
    ```bash
    npm run dev
    ```
    This command starts the backend Node.js/Express server and the Vite development server for the client. The client application is usually accessible at `http://localhost:5173` (Vite's default) or `http://localhost:3000` (if proxied by the backend). Check the console output for the correct URL.

## Python Scripts in `client/src/`

Currently, this `client/` directory (specifically `client/src/`) also houses several Python scripts critical for the AI/ML pipeline:

*   `client/src/download.py`: Conceptual outline for downloading satellite data.
*   `client/src/process.py`: Conceptual outline for preprocessing satellite data.
*   `client/src/train.py`: Script for training the U-Net segmentation model.
*   `client/src/models/`: Contains Python model definitions (e.g., `unet.py`).
*   `client/src/config.py`: Configuration for the Python scripts.

**To run these Python scripts:**

1.  Ensure you have installed the Python dependencies listed in the root `requirements.txt` (preferably in a virtual environment).
    ```bash
    # From project root
    pip install -r requirements.txt
    ```
2.  Execute the scripts from the project root directory, for example:
    ```bash
    python client/src/train.py --epochs 10
    ```
Refer to the main project `README.md` in the root directory for more detailed instructions on these Python scripts and their parameters.

*Note: For better project organization, these Python scripts and related files might be refactored into a dedicated top-level directory (e.g., `python_pipeline/`) in the future.*

## Folder Structure (within `client/src/`)

*   `assets/`: Static assets like images, logos.
*   `components/`: Reusable React UI components.
    *   `ui/`: Base UI elements, likely from Shadcn UI.
    *   Custom components like `satellite-map.tsx`, `metrics-cards.tsx`, etc.
*   `hooks/`: Custom React hooks.
*   `lib/`: Utility functions, type definitions (`types.ts`), and shared libraries for the client.
*   `models/`: (Python) Machine learning model definitions.
*   `pages/`: Top-level page components that assemble various UI components (e.g., `dashboard.tsx`).
*   `App.tsx`: The main application component, often handling routing.
*   `main.tsx`: The entry point for the React application.
*   `config.py`: (Python) Configuration for Python scripts.
*   `download.py`, `process.py`, `train.py`, `validate.py`: (Python) Core AI/ML pipeline scripts.

## Building for Production

The client is built as part of the main project's build process. From the root directory:

```bash
npm run build
```
This will use Vite to bundle the client application, typically outputting to a `dist/client` (or similar) directory within the main `dist` folder. The production server then serves these static assets.
