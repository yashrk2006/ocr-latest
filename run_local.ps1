# Check if running in a virtual environment is better, but here we assume .venv exists in root
$VENV_PYTHON = ".\.venv\Scripts\python.exe"

if (-not (Test-Path $VENV_PYTHON)) {
    Write-Error "Virtual environment not found at .\.venv. Please create it first."
    exit 1
}

Write-Host "=== OCR App Local Runner ==="
Write-Host "1. Checking Frontend Build..."

if (-not (Test-Path "frontend\build\index.html")) {
    Write-Host "Frontend build not found or incomplete. Building..."
    Push-Location frontend
    npm install
    npm run build
    Pop-Location
} else {
    Write-Host "Frontend build exists. Skipping rebuild to save time."
    Write-Host "(To force rebuild, delete frontend\build or run 'npm run build' in frontend/)"
}

Write-Host "2. Updating Backend Dependencies..."
& $VENV_PYTHON -m pip install -r backend\requirements.txt

Write-Host "3. Starting Backend Server..."
Write-Host "The app will be available at http://localhost:8000"
Write-Host "To stop, press Ctrl+C"

Push-Location backend
# Run uvicorn using the venv python
& "..\$VENV_PYTHON" -m uvicorn server:app --reload --host 127.0.0.1 --port 8000
Pop-Location
