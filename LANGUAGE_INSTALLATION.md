# Installing Additional Tesseract Languages

## Current Status
Your Tesseract installation currently has: **English (eng)** only

## ✅ Good News!
The application now automatically falls back to English if a requested language isn't installed. So it won't crash anymore!

## 📥 How to Add More Languages

### Method 1: Download Individual Languages (Recommended)

1. **Open PowerShell as Administrator**
2. **Run commands** to download languages you need:

```powershell
# Hindi
Invoke-WebRequest -Uri "https://github.com/tesseract-ocr/tessdata/raw/main/hin.traineddata" -OutFile "C:\Program Files\Tesseract-OCR\tessdata\hin.traineddata"

# Spanish
Invoke-WebRequest -Uri "https://github.com/tesseract-ocr/tessdata/raw/main/spa.traineddata" -OutFile "C:\Program Files\Tesseract-OCR\tessdata\spa.traineddata"

# French
Invoke-WebRequest -Uri "https://github.com/tesseract-ocr/tessdata/raw/main/fra.traineddata" -OutFile "C:\Program Files\Tesseract-OCR\tessdata\fra.traineddata"

# German  
Invoke-WebRequest -Uri "https://github.com/tesseract-ocr/tessdata/raw/main/deu.traineddata" -OutFile "C:\Program Files\Tesseract-OCR\tessdata\deu.traineddata"

# Arabic
Invoke-WebRequest -Uri "https://github.com/tesseract-ocr/tessdata/raw/main/ara.traineddata" -OutFile "C:\Program Files\Tesseract-OCR\tessdata\ara.traineddata"

# Chinese Simplified
Invoke-WebRequest -Uri "https://github.com/tesseract-ocr/tessdata/raw/main/chi_sim.traineddata" -OutFile "C:\Program Files\Tesseract-OCR\tessdata\chi_sim.traineddata"

# Japanese
Invoke-WebRequest -Uri "https://github.com/tesseract-ocr/tessdata/raw/main/jpn.traineddata" -OutFile "C:\Program Files\Tesseract-OCR\tessdata\jpn.traineddata"

# Korean
Invoke-WebRequest -Uri "https://github.com/tesseract-ocr/tessdata/raw/main/kor.traineddata" -OutFile "C:\Program Files\Tesseract-OCR\tessdata\kor.traineddata"
```

### Method 2: Manual Download

1. **Visit**: https://github.com/tesseract-ocr/tessdata
2. **Find** the `.traineddata` file for your language
3. **Download** it (click on the file, then click "Download")
4. **Copy** to: `C:\Program Files\Tesseract-OCR\tessdata\`
   - You'll need admin permission

### Method 3: Download All Languages (Large!)

If you want ALL languages (~1GB total):

1. **Clone** the entire tessdata repository:
```powershell
git clone https://github.com/tesseract-ocr/tessdata.git
```

2. **Copy** all `.traineddata` files to `C:\Program Files\Tesseract-OCR\tessdata\`

## 🔍 Check Installed Languages

Visit: http://localhost:8000/api/available-languages

This will show you all currently installed languages.

## 📝 Language Codes

- `eng` - English
- `spa` - Spanish
- `fra` - French
- `deu` - German
- `hin` - Hindi
- `ara` - Arabic
- `chi_sim` - Chinese (Simplified)
- `chi_tra` - Chinese (Traditional)
- `jpn` - Japanese
- `kor` - Korean
- `rus` - Russian
- `por` - Portuguese
- `ita` - Italian
- `nld` - Dutch
- `pol` - Polish
- `tur` - Turkish
- `vie` - Vietnamese
- `tha` - Thai
- `ben` - Bengali
- `mar` - Marathi
- `tam` - Tamil
- `tel` - Telugu

Full list: https://tesseract-ocr.github.io/tessdoc/Data-Files-in-different-versions.html

## ✨ After Installing

1. **No restart needed!** - Just select the language in the dropdown
2. The OCR will automatically use the new language
3. If a language isn't installed, it automatically falls back to English
