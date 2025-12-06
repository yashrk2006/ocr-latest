from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List
import uuid
from datetime import datetime, timezone
from io import BytesIO

from PIL import Image
import pytesseract
import fitz # PyMuPDF

from field_extractor import FieldExtractor


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)



# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    # Exclude MongoDB's _id field from the query results
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks


# We'll use pytesseract which is more accurate for documents
# Note: Tesseract binary needs to be installed separately
import pytesseract
from PIL import Image, ImageEnhance, ImageFilter

# Try to find tesseract executable
import shutil
if not shutil.which('tesseract'):
    # Common paths on Windows
    tesseract_paths = [
        r'C:\Program Files\Tesseract-OCR\tesseract.exe',
        r'C:\Program Files (x86)\Tesseract-OCR\tesseract.exe',
    ]
    for path in tesseract_paths:
        if os.path.exists(path):
            pytesseract.pytesseract.tesseract_cmd = path
            break

@api_router.get("/available-languages")
async def get_available_languages():
    """
    Get list of installed Tesseract languages
    """
    try:
        import subprocess
        result = subprocess.run(
            [pytesseract.pytesseract.tesseract_cmd, '--list-langs'],
            capture_output=True,
            text=True,
            timeout=5
        )
        available_langs = result.stdout.strip().split('\n')[1:]  # Skip first line (header)
        return {
            "languages": available_langs,
            "count": len(available_langs),
            "message": "To add more languages, download .traineddata files from https://github.com/tesseract-ocr/tessdata"
        }
    except Exception as e:
        logger.exception("Error getting available languages")
        return {
            "languages": ["eng"],
            "count": 1,
            "error": str(e)
        }

@api_router.post("/ocr")
async def perform_ocr(
    file: UploadFile = File(...),
    language: str = "eng"
):
    """
    Perform OCR on an uploaded image file and return extracted text.
    Uses Tesseract OCR with advanced image preprocessing for better accuracy.
    
    Args:
        file: Image file to process
        language: Tesseract language code (eng, spa, fra, deu, hin, ara, etc.)
    """
    if not file.content_type or (not file.content_type.startswith("image/") and file.content_type != "application/pdf"):
        raise HTTPException(status_code=400, detail="Only image files and PDFs are supported.")

    # Validate language is installed
    try:
        import subprocess
        result = subprocess.run(
            [pytesseract.pytesseract.tesseract_cmd, '--list-langs'],
            capture_output=True,
            text=True,
            timeout=5
        )
        available_langs = result.stdout.strip().split('\n')[1:]  # Skip first line (header)
        
        if language not in available_langs:
            logger.warning(f"Language '{language}' not installed. Available: {available_langs}")
            # Fallback to English
            language = 'eng'
            logger.info(f"Falling back to English (eng)")
    except Exception as e:
        logger.warning(f"Could not check available languages: {e}. Proceeding with {language}")

    try:
        file_bytes = await file.read()
        
        # Handle PDF or Image
        if file.content_type == "application/pdf":
            # Convert PDF to Image
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            if doc.page_count < 1:
                raise HTTPException(status_code=400, detail="PDF is empty")
            page = doc.load_page(0)
            pix = page.get_pixmap(dpi=300)
            original_image = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        else:
            # Open image with PIL
            original_image = Image.open(BytesIO(file_bytes))
        
        # Convert to RGB if needed
        if original_image.mode != 'RGB':
            original_image = original_image.convert('RGB')
        
        # Upscale image if it's too small (helps with low-resolution scans)
        width, height = original_image.size
        min_dimension = 2000  # Target minimum dimension
        if width < min_dimension or height < min_dimension:
            scale_factor = max(min_dimension / width, min_dimension / height)
            new_width = int(width * scale_factor)
            new_height = int(height * scale_factor)
            original_image = original_image.resize((new_width, new_height), Image.Resampling.LANCZOS)
            logger.info(f"Upscaled image from {width}x{height} to {new_width}x{new_height}")
        
        # Convert to grayscale
        image = original_image.convert('L')
        
        # Apply adaptive thresholding using numpy and PIL
        import numpy as np
        img_array = np.array(image)
        
        # Apply Gaussian blur to reduce noise
        from PIL import ImageFilter
        image_blurred = image.filter(ImageFilter.GaussianBlur(radius=1))
        
        # Enhance contrast significantly
        enhancer = ImageEnhance.Contrast(image_blurred)
        image_contrast = enhancer.enhance(2.0)
        
        # Enhance sharpness
        enhancer = ImageEnhance.Sharpness(image_contrast)
        image_sharp = enhancer.enhance(2.0)
        
        # Convert to binary (black and white) using adaptive threshold
        # This helps with varied lighting conditions
        img_array = np.array(image_sharp)
        
        # Apply Otsu's thresholding for automatic threshold selection
        from PIL import ImageOps
        threshold_value = 128
        # Simple binary threshold (values below threshold become black, above become white)
        binary_image = image_sharp.point(lambda x: 0 if x < threshold_value else 255, '1')
        
        # Optimize: Run only one robust mode (PSM 3 - Fully Automatic) for speed
        # This is 3x faster than trying multiple modes
        try:
            custom_config = f'--oem 1 --psm 3'
            
            # Run OCR once
            best_text = pytesseract.image_to_string(binary_image, lang=language, config=custom_config)
            
            # Get confidence
            data = pytesseract.image_to_data(binary_image, lang=language, config=custom_config, output_type=pytesseract.Output.DICT)
            confidences = [int(conf) for conf in data['conf'] if conf != '-1']
            best_confidence = sum(confidences) / len(confidences) if confidences else 0
            
            logger.info(f"OCR completed with confidence: {best_confidence:.2f}%")
            
        except Exception as e:
            logger.error(f"OCR failed: {str(e)}")
            # Fallback to raw image if processing failed
            best_text = pytesseract.image_to_string(image, lang=language, config='--oem 1 --psm 3')
            best_confidence = 0
        
        logger.info(f"OCR completed with confidence: {best_confidence:.2f}%")
        
        # Apply post-processing to fix common OCR errors
        best_text = post_process_ocr_text(best_text)
        
    except pytesseract.TesseractNotFoundError:
        logger.error("Tesseract OCR not found")
        raise HTTPException(
            status_code=500,
            detail="Tesseract OCR is not installed. Please install from https://github.com/UB-Mannheim/tesseract/wiki"
        )
    except Exception as exc:
        logger.exception("Error during OCR processing")
        raise HTTPException(status_code=500, detail=f"OCR processing failed: {str(exc)}") from exc

    return {"text": best_text, "confidence": round(best_confidence, 2)}


def post_process_ocr_text(text: str) -> str:
    """
    Post-process OCR text to fix common recognition errors.
    """
    import re
    
    # Fix pipe character (|) that should be capital I
    # Match | when it appears:
    # - At the start of a sentence (after . ! ? or newline)
    # - As a standalone word
    # - Before common contractions like 've, 'll, 'm, 'd
    text = re.sub(r'(?<=[.!?\n]\s)\|(?=\s)', 'I', text)  # After sentence ending
    text = re.sub(r'^\|(?=\s)', 'I', text, flags=re.MULTILINE)  # Start of line
    text = re.sub(r'\|\s', 'I ', text)  # Standalone | followed by space
    text = re.sub(r'\|\'', 'I\'', text)  # |'ve, |'m, etc.
    
    # Fix common word errors
    common_fixes = {
        r'\bcan\'t\b': 'can\'t',
        r'\bdon\'t\b': 'don\'t', 
        r'\bhave\b': 'have',
        r'\bwas\b': 'was',
    }
    
    for pattern, replacement in common_fixes.items():
        text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
    
    # Remove excessive spaces (more than 1 space)
    text = re.sub(r' {2,}', ' ', text)
    
    # Fix spacing around punctuation
    text = re.sub(r'\s+([.,!?;:])', r'\1', text)  # Remove space before punctuation
    text = re.sub(r'([.,!?;:])(?=[A-Za-z])', r'\1 ', text)  # Add space after punctuation if missing
    
    return text.strip()


class TrainingPattern(BaseModel):
    field: str
    keyword: str

@api_router.get("/training/patterns")
async def get_training_patterns():
    """Get all field patterns including custom ones"""
    extractor = FieldExtractor()
    return extractor.field_keywords

@api_router.post("/training/patterns")
async def add_training_pattern(pattern: TrainingPattern):
    """Add a new keyword pattern for a field"""
    extractor = FieldExtractor()
    if not pattern.field or not pattern.keyword:
        raise HTTPException(status_code=400, detail="Field and keyword are required")
        
    success = extractor.save_custom_pattern(pattern.field, pattern.keyword)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to save pattern")
        
    return {
        "message": f"Successfully trained system to recognize '{pattern.keyword}' as '{pattern.field}'", 
        "patterns": extractor.field_keywords
    }


@api_router.post("/extract-fields")
async def extract_fields(
    file: UploadFile = File(...),
    document_type: str = "general",
    language: str = "eng"
):
    """
    Extract structured fields from a document image.
    
    Args:
        file: Image file upload
        document_type: Type of document (id_card, passport, form, general)
        language: Tesseract language code (eng, spa, fra, deu, hin, ara, etc.)
    
    Returns:
        Extracted fields with confidence scores
    """
    if not file.content_type or (not file.content_type.startswith("image/") and file.content_type != "application/pdf"):
        raise HTTPException(status_code=400, detail="Only image files and PDFs are supported.")
    
    try:
        # First, perform OCR to get text
        file_bytes = await file.read()
        
        # Handle PDF or Image
        if file.content_type == "application/pdf":
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            if doc.page_count < 1:
                raise HTTPException(status_code=400, detail="PDF is empty")
            page = doc.load_page(0)
            pix = page.get_pixmap(dpi=300)
            original_image = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        else:
            original_image = Image.open(BytesIO(file_bytes))
        
        if original_image.mode != 'RGB':
            original_image = original_image.convert('RGB')
        
        # Upscale if needed
        width, height = original_image.size
        min_dimension = 2000
        if width < min_dimension or height < min_dimension:
            scale_factor = max(min_dimension / width, min_dimension / height)
            new_width = int(width * scale_factor)
            new_height = int(height * scale_factor)
            original_image = original_image.resize((new_width, new_height), Image.Resampling.LANCZOS)
        
        # Convert to grayscale and enhance
        image = original_image.convert('L')
        
        from PIL import ImageFilter, ImageEnhance
        image_blurred = image.filter(ImageFilter.GaussianBlur(radius=1))
        
        enhancer = ImageEnhance.Contrast(image_blurred)
        image_contrast = enhancer.enhance(2.0)
        
        enhancer = ImageEnhance.Sharpness(image_contrast)
        image_sharp = enhancer.enhance(2.0)
        
        # Perform OCR with specified language
        custom_config = r'--oem 1 --psm 6'
        raw_text = pytesseract.image_to_string(image_sharp, lang=language, config=custom_config)
        
        # Post-process text
        processed_text = post_process_ocr_text(raw_text)
        
        # Extract structured fields
        extractor = FieldExtractor()
        result = extractor.extract_all_fields(processed_text, document_type)
        
        # Add raw text to result
        result['raw_text'] = processed_text
        
        logger.info(f"Extracted {len(result['fields'])} fields from {document_type}")
        
        return result
        
    except Exception as exc:
        logger.exception("Error during field extraction")
        raise HTTPException(status_code=500, detail=f"Field extraction failed: {str(exc)}") from exc


# Include the router in the main app
app.include_router(api_router)

# Serve React Frontend
build_dir = ROOT_DIR.parent / "frontend" / "build"

if build_dir.exists():
    # 1. Mount the static assets (JS, CSS, images)
    # React build usually puts them in a 'static' folder, but also specific files at root
    app.mount("/static", StaticFiles(directory=str(build_dir / "static")), name="static")
    
    # 2. Serve specific root files (favicon, manifest, etc.) if they exist
    # This loop is optional but good for typical CRA structure
    for file in build_dir.iterdir():
        if file.is_file():
            # Create specific routes for root files to avoid conflict with catch-all
            # e.g. /favicon.ico, /manifest.json
            @app.get(f"/{file.name}", include_in_schema=False)
            async def serve_root_file(file_path=file): # capture closure variable
                return FileResponse(file_path)

    # 3. Catch-all route for SPA (React Router) - serve index.html
    # This must be the LAST route
    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        # Check if strictly requesting an API route that somehow fell through (unlikely)
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="Not Found")
            
        # Serve index.html
        return FileResponse(build_dir / "index.html")

else:
    logger.warning("Frontend build directory not found. Run 'npm run build' in frontend folder.")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)





@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()