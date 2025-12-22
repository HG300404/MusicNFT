from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
import os
import random
import traceback
import gc
import time

import numpy as np
import scipy.io.wavfile as wavfile
import torch
from transformers import pipeline

# --- Image generation (free local) ---
from diffusers import StableDiffusionPipeline
from PIL import Image

app = FastAPI()

# CORS middleware để frontend có thể gọi API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Disable tokenizers parallelism warning
os.environ["TOKENIZERS_PARALLELISM"] = "false"

# =========================
# MUSIC CONFIG
# =========================
FIXED_SECONDS = 10
MODEL_ID = "facebook/musicgen-small"

class MusicRequest(BaseModel):
    prompt: str

# Load music model once
device_index = 0 if torch.cuda.is_available() else -1
print(f"Using device for MusicGen: {'CUDA' if torch.cuda.is_available() else 'CPU'}")
music_pipe = pipeline("text-to-audio", model=MODEL_ID, device=device_index)
print("Music model loaded successfully")

# =========================
# IMAGE CONFIG
# =========================
# Stable Diffusion v1.5 (nhẹ hơn SDXL)
IMG_MODEL_ID = "runwayml/stable-diffusion-v1-5"

# CPU-friendly defaults
IMG_WIDTH = 256
IMG_HEIGHT = 256
IMG_STEPS = 8


class ImageRequest(BaseModel):
    prompt: str
    negative_prompt: str | None = None  # optional

# Load image model once
print(f"Using device for ImageGen: {'CUDA' if torch.cuda.is_available() else 'CPU'}")
img_device = "cuda" if torch.cuda.is_available() else "cpu"
img_dtype = torch.float16 if img_device == "cuda" else torch.float32

try:
    img_pipe = StableDiffusionPipeline.from_pretrained(IMG_MODEL_ID, torch_dtype=img_dtype)
    img_pipe = img_pipe.to(img_device)

    # tiết kiệm RAM trên GPU (nếu có)
    if img_device == "cuda":
        img_pipe.enable_attention_slicing()

    print("Image model loaded successfully")
except Exception as e:
    img_pipe = None
    print("Failed to load image model:", e)

# =========================
# ROUTES
# =========================

@app.get("/")
def root():
    return {"status": "ok", "docs": "/docs"}

@app.post("/generate-music")
async def generate_music(request: MusicRequest):
    if not request.prompt or not request.prompt.strip():
        raise HTTPException(status_code=400, detail="prompt is required")

    try:
        seed = random.randint(0, 2**32 - 1)
        torch.manual_seed(seed)
        if torch.cuda.is_available():
            torch.cuda.manual_seed_all(seed)

        with torch.inference_mode():
            output = music_pipe(
                request.prompt,
                forward_params={
                    "do_sample": True,
                    "max_length": FIXED_SECONDS * 50
                }
            )

        os.makedirs("outputs", exist_ok=True)
        filename = datetime.now().strftime("music_%Y%m%d_%H%M%S.wav")
        file_path = os.path.join("outputs", filename)

        audio = np.array(output["audio"])
        audio_int16 = (np.clip(audio, -1.0, 1.0) * 32767).astype(np.int16)
        wavfile.write(file_path, rate=output["sampling_rate"], data=audio_int16)

        # Trả về URL để frontend có thể truy cập file
        file_url = f"http://localhost:8000/files/{filename}"
        return {
            "file": file_path,
            "fileUrl": file_url,
            "filename": filename,
            "seconds": FIXED_SECONDS,
            "seed": seed
        }

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error generating music: {e}")

    finally:
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()

@app.get("/files/{filename}")
async def get_file(filename: str):
    """Serve file audio hoặc image từ thư mục outputs"""
    file_path = os.path.join("outputs", filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    # Xác định media type dựa trên extension
    if filename.endswith('.wav'):
        media_type = "audio/wav"
    elif filename.endswith('.png') or filename.endswith('.jpg'):
        media_type = "image/png" if filename.endswith('.png') else "image/jpeg"
    else:
        media_type = "application/octet-stream"
    
    return FileResponse(
        file_path,
        media_type=media_type,
        filename=filename
    )

@app.post("/generate-image")
def generate_image(req: ImageRequest):
    if not req.prompt or not req.prompt.strip():
        raise HTTPException(status_code=400, detail="prompt is required")

    if img_pipe is None:
        raise HTTPException(
            status_code=500,
            detail="Image model not loaded. Ensure diffusers/pillow installed and model download succeeded."
        )

    try:
        # seed khác nhau mỗi lần
        seed = random.randint(0, 2**32 - 1)
        generator = torch.Generator(device=img_device).manual_seed(seed) if img_device == "cuda" else None

        with torch.inference_mode():
            result = img_pipe(
                prompt=req.prompt,
                negative_prompt=req.negative_prompt,
                width=IMG_WIDTH,
                height=IMG_HEIGHT,
                num_inference_steps=IMG_STEPS,
                generator=generator
            )
            image: Image.Image = result.images[0]

        os.makedirs("outputs", exist_ok=True)
        filename = f"img_{int(time.time())}_{seed}.png"
        path = os.path.join("outputs", filename)
        image.save(path)

        # Trả về URL để frontend có thể truy cập file
        file_url = f"http://localhost:8000/files/{filename}"
        return {
            "file": path,
            "fileUrl": file_url,
            "filename": filename,
            "width": IMG_WIDTH,
            "height": IMG_HEIGHT,
            "steps": IMG_STEPS,
            "seed": seed
        }

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error generating image: {e}")

    finally:
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
