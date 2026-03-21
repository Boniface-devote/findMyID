"""
FastAPI OCR Service for ID Document Processing
Supports: Uganda National ID and Makerere University Student ID
Runs on port 3030
"""

import base64
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import cv2
import numpy as np

from ocr_engine import process_id_image

app = FastAPI(title="OCR Service", version="2.0.0")

# CORS middleware - allow all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class OCRResponse(BaseModel):
    success: bool
    message: str
    card_type: Optional[str] = None  # 'student_id', 'national_id', or 'unknown'
    fields: Optional[dict] = None
    raw_text: Optional[str] = None


class Base64Request(BaseModel):
    image: str  # Base64 encoded image


@app.get("/")
async def health_check():
    """Health endpoint."""
    return {
        "status": "ok",
        "service": "ocr-service",
        "version": "2.0.0",
        "port": 3030,
        "supported_cards": ["national_id", "student_id"]
    }


@app.post("/ocr", response_model=OCRResponse)
async def ocr_endpoint(file: UploadFile = File(...)):
    """OCR endpoint accepting multipart file upload.
    
    Returns:
        OCRResponse with card_type, fields, and raw_text
    """
    try:
        # Validate file type
        if not file.content_type or not file.content_type.startswith("image/"):
            return OCRResponse(
                success=False,
                message="File must be an image",
                card_type=None,
                fields=None,
                raw_text=None
            )
        
        # Read image
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return OCRResponse(
                success=False,
                message="Could not decode image",
                card_type=None,
                fields=None,
                raw_text=None
            )
        
        # Process image
        result = process_id_image(img)
        
        return OCRResponse(
            success=True,
            message=f"Processed successfully. Detected: {result['card_type']}. Found {result['ocr_count']} text regions.",
            card_type=result['card_type'],
            fields=result['fields'],
            raw_text=result['raw_text']
        )
        
    except Exception as e:
        return OCRResponse(
            success=False,
            message=f"Error processing image: {str(e)}",
            card_type=None,
            fields=None,
            raw_text=None
        )


@app.post("/ocr/base64", response_model=OCRResponse)
async def ocr_base64_endpoint(request: Base64Request):
    """OCR endpoint for base64-encoded images.
    
    Returns:
        OCRResponse with card_type, fields, and raw_text
    """
    try:
        # Decode base64
        image_data = base64.b64decode(request.image)
        nparr = np.frombuffer(image_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return OCRResponse(
                success=False,
                message="Could not decode image from base64",
                card_type=None,
                fields=None,
                raw_text=None
            )
        
        # Process image
        result = process_id_image(img)
        
        return OCRResponse(
            success=True,
            message=f"Processed successfully. Detected: {result['card_type']}. Found {result['ocr_count']} text regions.",
            card_type=result['card_type'],
            fields=result['fields'],
            raw_text=result['raw_text']
        )
        
    except Exception as e:
        return OCRResponse(
            success=False,
            message=f"Error processing image: {str(e)}",
            card_type=None,
            fields=None,
            raw_text=None
        )


if __name__ == "__main__":
    import uvicorn
    print("Starting OCR Service v2.0.0 on port 3030...")
    print("Supported card types: National ID, Student ID")
    uvicorn.run(app, host="0.0.0.0", port=3030)
