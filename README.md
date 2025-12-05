# OCR Text Extractor

A powerful OCR (Optical Character Recognition) application built with React and FastAPI that extracts text from images with high accuracy.

![OCR Application](https://img.shields.io/badge/OCR-Tesseract%205.5-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110-green)
![React](https://img.shields.io/badge/React-18.0-blue)

## ✨ Features

- 🖼️ **Image Upload**: Support for PNG, JPG, and JPEG formats
- 🔍 **Advanced OCR**: Uses Tesseract 5.5 with LSTM neural networks
- 🎯 **High Accuracy**: Advanced image preprocessing for better text recognition
- 📊 **Confidence Scores**: Real-time confidence metrics for extracted text
- 🔧 **Auto-Correction**: Intelligent post-processing to fix common OCR errors
- 📋 **Copy to Clipboard**: Easy text copying functionality
- 💅 **Modern UI**: Beautiful, responsive interface

## 🚀 Technology Stack

### Backend
- **FastAPI**: Modern, fast Python web framework
- **Tesseract OCR**: Advanced OCR engine with LSTM support
- **Pillow (PIL)**: Image processing
- **NumPy**: Numerical operations for image enhancement
- **Motor**: Async MongoDB driver

### Frontend
- **React 18**: Modern UI library
- **Axios**: HTTP client
- **React Router**: Navigation

## 📋 Prerequisites

- **Python 3.8+**
- **Node.js 16+**
- **Tesseract OCR 5.5+** - [Download here](https://github.com/UB-Mannheim/tesseract/wiki)
- **MongoDB** (for status tracking)

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/ocr-11.git
cd ocr-11
```

### 2. Install Tesseract OCR

**Windows:**
- Download and install from [UB-Mannheim Tesseract](https://github.com/UB-Mannheim/tesseract/wiki)
- Use default installation path: `C:\Program Files\Tesseract-OCR`

**Linux:**
```bash
sudo apt install tesseract-ocr
```

**macOS:**
```bash
brew install tesseract
```

### 3. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# Linux/Mac:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
# Add your MongoDB connection string and other configs
```

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
# Add backend URL (default: http://localhost:8000)
```

## 🏃 Running the Application

### Start Backend Server

```bash
cd backend
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: **http://localhost:8000**

### Start Frontend

```bash
cd frontend
npm start
```

Frontend will be available at: **http://localhost:3000**

## 🎨 How It Works

### Image Preprocessing Pipeline

1. **Upscaling**: Low-resolution images are upscaled to minimum 2000px
2. **Grayscale Conversion**: Converts to single-channel for processing
3. **Gaussian Blur**: Reduces noise
4. **Contrast Enhancement**: Increases contrast by 2x
5. **Sharpness Enhancement**: Sharpens text edges by 2x
6. **Binary Thresholding**: Converts to pure black/white

### OCR Processing

- Tests multiple Tesseract PSM (Page Segmentation Modes)
- Uses LSTM neural network mode (OEM 1) for best accuracy
- Selects result with highest confidence score
- Applies post-processing to fix common errors

### Post-Processing

- Fixes pipe character (|) to capital I
- Corrects spacing around punctuation
- Removes excessive whitespace
- Corrects common word recognition errors

## 📊 API Endpoints

### OCR Processing
```
POST /api/ocr
Content-Type: multipart/form-data

Response:
{
  "text": "Extracted text content",
  "confidence": 85.5
}
```

### Health Check
```
GET /api/
Response: {"message": "Hello World"}
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [Tesseract OCR](https://github.com/tesseract-ocr/tesseract) - OCR engine
- [FastAPI](https://fastapi.tiangolo.com/) - Backend framework
- [React](https://reactjs.org/) - Frontend library

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

**Made with ❤️ by Kushw**
