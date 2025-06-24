import tkinter as tk
from tkinter import filedialog, messagebox, ttk
import os
import cv2
import numpy as np
from PIL import Image, ImageTk

# Assuming these are correctly importable from your project structure
from src.inference.realtime import run_inference
from src.data.preprocessing import preprocess_image

class TropicalCloudAIApp:
    def __init__(self, master_root):
        self.master = master_root
        master_root.title("Tropical Cloud AI")
        master_root.geometry("800x600") # Initial size, can be adjusted

        self.image_path = None
        self.original_image = None # To store PIL Image object of original
        self.processed_image_tk = None # To store PhotoImage for result

        # --- UI Element Styling ---
        style = ttk.Style()
        style.configure("TButton", padding=6, relief="flat", font=('Helvetica', 10))
        style.configure("TLabel", padding=5, font=('Helvetica', 10))
        style.configure("Header.TLabel", font=('Helvetica', 14, 'bold'))

        # --- Main Application Frame ---
        main_frame = ttk.Frame(master_root, padding="10 10 10 10")
        main_frame.pack(expand=True, fill=tk.BOTH)

        # --- Title ---
        title_label = ttk.Label(main_frame, text="Tropical Cloud AI - Inference Engine", style="Header.TLabel")
        title_label.pack(pady=(0, 10))

        # --- Controls Frame ---
        controls_frame = ttk.Frame(main_frame)
        controls_frame.pack(pady=10, fill=tk.X)

        self.load_button = ttk.Button(controls_frame, text="Load Image", command=self.load_image_action)
        self.load_button.pack(side=tk.LEFT, padx=5)

        self.run_button = ttk.Button(controls_frame, text="Run Inference", command=self.run_inference_action, state=tk.DISABLED)
        self.run_button.pack(side=tk.LEFT, padx=5)

        # --- Image Display Frame (for input and output) ---
        image_display_frame = ttk.Frame(main_frame)
        image_display_frame.pack(pady=10, expand=True, fill=tk.BOTH)

        # Input Image Area
        input_image_frame = ttk.LabelFrame(image_display_frame, text="Input Image", padding=10)
        input_image_frame.pack(side=tk.LEFT, padx=10, expand=True, fill=tk.BOTH)
        self.input_image_label = ttk.Label(input_image_frame, text="Load an image to see preview.")
        self.input_image_label.pack(expand=True, fill=tk.BOTH)


        # Output Image Area
        output_image_frame = ttk.LabelFrame(image_display_frame, text="Inference Result", padding=10)
        output_image_frame.pack(side=tk.RIGHT, padx=10, expand=True, fill=tk.BOTH)
        self.output_image_label = ttk.Label(output_image_frame, text="Results will appear here.")
        self.output_image_label.pack(expand=True, fill=tk.BOTH)

        # Store PhotoImage objects to prevent garbage collection
        self.input_photo_image = None
        self.output_photo_image = None

        # --- Status Bar ---
        self.status_label = ttk.Label(main_frame, text="Status: Ready", relief=tk.SUNKEN, anchor=tk.W)
        self.status_label.pack(side=tk.BOTTOM, fill=tk.X, pady=(10,0))


    def _update_status(self, message):
        self.status_label.config(text=f"Status: {message}")

    def _resize_pil_image(self, pil_image, max_width, max_height):
        """Resizes a PIL image to fit within max_width and max_height, maintaining aspect ratio."""
        img_width, img_height = pil_image.size
        if img_width == 0 or img_height == 0: # Avoid division by zero for empty images
            return pil_image 

        ratio = min(max_width / img_width, max_height / img_height)
        if ratio < 1: # Only scale down, not up
            new_width = int(img_width * ratio)
            new_height = int(img_height * ratio)
            return pil_image.resize((new_width, new_height), Image.LANCZOS) # Use LANCZOS for quality
        return pil_image

    def _display_pil_image_in_label(self, pil_image, label_widget):
        """Displays a PIL image in the specified Tkinter label."""
        # Get the allocated size of the label widget for resizing
        # Fallback to a default if the window isn't drawn yet or label size is tiny
        label_widget.update_idletasks() # Ensure widget dimensions are current
        max_width = label_widget.winfo_width() if label_widget.winfo_width() > 10 else 350
        max_height = label_widget.winfo_height() if label_widget.winfo_height() > 10 else 350
        
        resized_image = self._resize_pil_image(pil_image, max_width, max_height)
        
        if label_widget == self.input_image_label:
            self.input_photo_image = ImageTk.PhotoImage(resized_image)
            self.input_image_label.config(image=self.input_photo_image, text="")
        elif label_widget == self.output_image_label:
            self.output_photo_image = ImageTk.PhotoImage(resized_image)
            self.output_image_label.config(image=self.output_photo_image, text="")


    def load_image_action(self):
        """Handles the action of loading an image from the file dialog."""
        file_path = filedialog.askopenfilename(
            title="Select an Image",
            filetypes=[("Image files", "*.jpg;*.jpeg;*.png"), ("All files", "*.*")]
        )
        if file_path:
            self.image_path = file_path
            try:
                self.original_image = Image.open(self.image_path)
                self._display_pil_image_in_label(self.original_image, self.input_image_label)
                self._update_status(f"Loaded: {os.path.basename(self.image_path)}")
                self.run_button.config(state=tk.NORMAL)
                
                # Clear previous output image and PhotoImage reference
                self.output_image_label.config(image='', text="Results will appear here.")
                self.output_photo_image = None 

            except Exception as e:
                messagebox.showerror("Error Loading Image", f"Could not load image: {e}")
                self._update_status("Error loading image.")
                self.image_path = None
                self.original_image = None
                self.input_image_label.config(image='', text="Load an image to see preview.")
                self.input_photo_image = None
                self.run_button.config(state=tk.DISABLED)


    def run_inference_action(self):
        """Handles the action of running inference on the loaded image."""
        if not self.image_path or not self.original_image:
            messagebox.showwarning("No Image", "Please load an image first.")
            return

        self._update_status("Processing... Running inference...")
        self.master.update_idletasks() 
        self.run_button.config(state=tk.DISABLED) # Disable run button during processing
        self.load_button.config(state=tk.DISABLED) # Disable load button during processing


        try:
            # Simulate some processing time for status update visibility if needed for testing:
            # import time; time.sleep(2) 

            preprocessed_np_array = preprocess_image(self.image_path)
            result_np_array = run_inference(preprocessed_np_array)
            
            if result_np_array is None:
                # Handle cases where inference might return None explicitly
                messagebox.showerror("Inference Error", "Inference process returned no result.")
                self._update_status("Inference error: No result returned.")
                self.output_image_label.config(image='', text="Inference returned no result.")
                self.output_photo_image = None
                return

            # Convert NumPy array to PIL Image
            if result_np_array.dtype == np.float32 or result_np_array.dtype == np.float64:
                if np.min(result_np_array) < 0 or np.max(result_np_array) > 1:
                    # Normalize if not in 0-1 range, e.g. if it's -1 to 1
                    result_np_array = (result_np_array - np.min(result_np_array)) / (np.max(result_np_array) - np.min(result_np_array) + 1e-5) # adding epsilon to avoid div by zero
                result_np_array = (result_np_array * 255).astype(np.uint8)
            elif result_np_array.dtype != np.uint8: # If not float and not uint8, try to convert
                 result_np_array = result_np_array.astype(np.uint8)

            
            if len(result_np_array.shape) == 2: 
                pil_result_image = Image.fromarray(result_np_array, mode='L')
            elif len(result_np_array.shape) == 3:
                if result_np_array.shape[2] == 1: # Grayscale with trailing 1 channel
                     pil_result_image = Image.fromarray(result_np_array.squeeze(), mode='L')
                elif result_np_array.shape[2] == 3: 
                    pil_result_image = Image.fromarray(result_np_array, mode='RGB')
                elif result_np_array.shape[2] == 4: 
                    pil_result_image = Image.fromarray(result_np_array, mode='RGBA')
                else:
                    raise ValueError(f"Unsupported number of image channels: {result_np_array.shape[2]}")
            else:
                raise ValueError(f"Unsupported NumPy array dimensions: {result_np_array.shape}")

            self._display_pil_image_in_label(pil_result_image, self.output_image_label)
            self._update_status("Inference complete.")

        except ValueError as ve: # Catch specific conversion errors
            error_message = f"Image data error: {ve}"
            messagebox.showerror("Inference Display Error", error_message)
            self._update_status(error_message)
            self.output_image_label.config(image='', text="Error displaying result.")
            self.output_photo_image = None
        except Exception as e:
            detailed_error_message = f"An unexpected error occurred during inference: {type(e).__name__}: {e}"
            messagebox.showerror("Inference Error", detailed_error_message)
            self._update_status("Inference error encountered.") 
            self.output_image_label.config(image='', text="Error during inference.")
            self.output_photo_image = None
        finally:
            # Re-enable buttons regardless of success or failure
            self.run_button.config(state=tk.NORMAL if self.image_path else tk.DISABLED)
            self.load_button.config(state=tk.NORMAL)


if __name__ == "__main__":
    root = tk.Tk()
    app = TropicalCloudAIApp(root)
    root.mainloop()