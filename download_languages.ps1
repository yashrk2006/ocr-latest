# Download Tesseract Language Data Files
# Run this script as Administrator

$tessdata_dir = "C:\Program Files\Tesseract-OCR\tessdata"
$base_url = "https://github.com/tesseract-ocr/tessdata/raw/main"

# List of languages to download
$languages = @(
    "hin",      # Hindi
    "spa",      # Spanish
    "fra",      # French
    "deu",      # German
    "ara",      # Arabic
    "chi_sim",  # Chinese Simplified
    "chi_tra",  # Chinese Traditional
    "jpn",      # Japanese
    "kor",      # Korean
    "rus",      # Russian
    "por",      # Portuguese
    "ita",      # Italian
    "nld",      # Dutch
    "pol",      # Polish
    "tur",      # Turkish
    "vie",      # Vietnamese
    "tha",      # Thai
    "ben",      # Bengali
    "mar",      # Marathi
    "tam",      # Tamil
    "tel"       # Telugu
)

Write-Host "Downloading Tesseract language data files..." -ForegroundColor Green
Write-Host "This may take a few minutes..." -ForegroundColor Yellow

$downloaded = 0
$failed = 0

foreach ($lang in $languages) {
    $filename = "$lang.traineddata"
    $destination = Join-Path $tessdata_dir $filename
    
    # Skip if already exists
    if (Test-Path $destination) {
        Write-Host "✓ $filename already exists" -ForegroundColor Gray
        continue
    }
    
    $url = "$base_url/$filename"
    
    try {
        Write-Host "Downloading $filename..." -NoNewline
        Invoke-WebRequest -Uri $url -OutFile $destination -UseBasicParsing
        Write-Host " ✓ Done" -ForegroundColor Green
        $downloaded++
    }
    catch {
        Write-Host " ✗ Failed" -ForegroundColor Red
        Write-Host "  Error: $_" -ForegroundColor Red
        $failed++
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Download Summary:" -ForegroundColor Cyan
Write-Host "  Downloaded: $downloaded" -ForegroundColor Green
Write-Host "  Failed: $failed" -ForegroundColor Red
Write-Host "  Total: $($languages.Count)" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan

if ($downloaded -gt 0) {
    Write-Host "`n✓ Language installation complete!" -ForegroundColor Green
    Write-Host "You can now use these languages in your OCR application." -ForegroundColor Green
}
