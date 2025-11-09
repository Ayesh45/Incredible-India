from PIL import Image
import os

input_dir = "static/images/states"
output_dir = "static/images/states_optimized"

# Create output directory if it doesn't exist
os.makedirs(output_dir, exist_ok=True)

# Set target dimensions
TARGET_WIDTH = 1280
TARGET_HEIGHT = 800
QUALITY = 80  # 1–100 (lower = smaller file size)

for filename in os.listdir(input_dir):
    if filename.lower().endswith((".jpg", ".jpeg", ".png")):
        input_path = os.path.join(input_dir, filename)
        output_path = os.path.join(output_dir, filename)

        try:
            with Image.open(input_path) as img:
                img = img.convert("RGB")
                img.thumbnail((TARGET_WIDTH, TARGET_HEIGHT))
                img.save(output_path, "JPEG", quality=QUALITY, optimize=True)
                print(f"✅ Resized & optimized: {filename}")
        except Exception as e:
            print(f"⚠️ Skipped {filename}: {e}")
