import React, { useState } from 'react';
import '../App.css';

function OCRPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [ocrResult, setOcrResult] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setOcrResult('');
      setConfidence(0);
      setError('');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedFile) {
      setError('Please select a file first.');
      return;
    }

    setLoading(true);
    setError('');
    setOcrResult('');

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
      const response = await fetch(`${backendUrl}/api/ocr`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to process image. Please try again.');
      }

      const data = await response.json();
      setOcrResult(data.text);
      setConfidence(data.confidence || 0);
    } catch (err) {
      console.error("OCR Error:", err);
      setError(err.message || 'An unexpected error occurred. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>OCR Text Extractor</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
        Upload an image to extract text instantly.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="upload-area">
          <input
            type="file"
            id="file-upload"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <label htmlFor="file-upload" style={{ cursor: 'pointer', width: '100%', display: 'block' }}>
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Preview"
                style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '0.5rem' }}
              />
            ) : (
              <div>
                <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>📁</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 500 }}>Click to upload an image</span>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  Supports PNG, JPG, JPEG
                </p>
              </div>
            )}
          </label>
        </div>

        <button type="submit" className="btn-primary" disabled={loading || !selectedFile}>
          {loading ? 'Processing...' : 'Extract Text'}
        </button>
      </form>

      {loading && <div className="loading-spinner"></div>}

      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}

      {ocrResult && (
        <div className="result-area">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>Extracted Text:</h3>
            {confidence > 0 && (
              <span
                className="confidence-badge"
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '2rem',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  backgroundColor: confidence >= 80 ? '#10b981' : confidence >= 60 ? '#f59e0b' : '#ef4444',
                  color: 'white'
                }}
              >
                {confidence}% Confidence
              </span>
            )}
          </div>
          <div className="result-box">
            {ocrResult}
          </div>
          <button
            className="btn-primary"
            style={{ marginTop: '1rem', backgroundColor: 'var(--text-secondary)' }}
            onClick={() => navigator.clipboard.writeText(ocrResult)}
          >
            Copy to Clipboard
          </button>
        </div>
      )}
    </div>
  );
}

export default OCRPage;
