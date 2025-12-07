import React, { useState } from 'react';
import '../App.css';
import { ProgressWithLabel } from '../components/ui/progress-bar';

function OCRPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [ocrResult, setOcrResult] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [language, setLanguage] = useState('eng');
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      if (file.type === 'application/pdf') {
        setPreviewUrl(null); // No preview for PDF
      } else {
        setPreviewUrl(URL.createObjectURL(file));
      }
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
      // Use relative path for unified deployment
      const response = await fetch(`/api/ocr?language=${language}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to process image. Please try again.');
      }

      const data = await response.json();
      setOcrResult(data.text);
      setEditedText(data.text);
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
      <h1>OCR Text Extractor <span style={{ fontSize: '1rem', color: '#666', fontWeight: 'normal' }}>v2.0</span></h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
        Upload an image to extract text instantly.
      </p>

      {/* Language Selector */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
          🌍 Language:
        </label>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          style={{
            padding: '0.75rem',
            borderRadius: '0.5rem',
            border: '2px solid var(--border)',
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            fontSize: '1rem',
            width: '100%',
            maxWidth: '300px'
          }}
        >
          <option value="eng">English</option>
          <option value="spa">Spanish (Español)</option>
          <option value="fra">French (Français)</option>
          <option value="deu">German (Deutsch)</option>
          <option value="hin">Hindi (हिन्दी)</option>
          <option value="hin+eng">Hindi + English (Mixed)</option>
          <option value="ara">Arabic (العربية)</option>
          <option value="chi_sim">Chinese Simplified (简体中文)</option>
          <option value="chi_tra">Chinese Traditional (繁體中文)</option>
          <option value="jpn">Japanese (日本語)</option>
          <option value="kor">Korean (한국어)</option>
          <option value="rus">Russian (Русский)</option>
          <option value="por">Portuguese (Português)</option>
          <option value="ita">Italian (Italiano)</option>
          <option value="nld">Dutch (Nederlands)</option>
          <option value="pol">Polish (Polski)</option>
          <option value="tur">Turkish (Türkçe)</option>
          <option value="vie">Vietnamese (Tiếng Việt)</option>
          <option value="tha">Thai (ไทย)</option>
          <option value="ben">Bengali (বাংলা)</option>
          <option value="mar">Marathi (मराठी)</option>
          <option value="tam">Tamil (தமிழ்)</option>
          <option value="tel">Telugu (తెలుగు)</option>
        </select>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="upload-area">
          <input
            type="file"
            id="file-upload"
            accept="image/*,application/pdf"
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
            ) : selectedFile && selectedFile.type === 'application/pdf' ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}>
                <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>📄</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 600 }}>{selectedFile.name}</span>
                <p style={{ color: 'var(--text-secondary)' }}>PDF Document Ready</p>
              </div>
            ) : (
              <div>
                <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>📁</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 500 }}>Click to upload an image</span>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  Supports PNG, JPG, JPEG, PDF
                </p>
              </div>
            )}
          </label>
        </div>

        <button type="submit" className="btn-primary" disabled={loading || !selectedFile}>
          {loading ? 'Processing...' : 'Extract Text'}
        </button>
      </form>

      {loading && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(255,255,255,0.8)',
          display: 'flex', flexDirection: 'column',
          justifyContent: 'center', alignItems: 'center',
          zIndex: 2000,
          backdropFilter: 'blur(5px)'
        }}>
          <ProgressWithLabel
            value="auto"
            simulated={true}
            label="Scanning Document..."
            colorFrom="#10b981"
            colorTo="#3b82f6"
          />
          <p style={{ marginTop: '1rem', color: '#666' }}>Analyzing text patterns...</p>
        </div>
      )}

      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}

      {ocrResult && (
        <div className="result-area">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>Extracted Text:</h3>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
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
          </div>

          {/* Editable Text Area */}
          {isEditing ? (
            <textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              style={{
                width: '100%',
                minHeight: '300px',
                padding: '1rem',
                borderRadius: '0.5rem',
                border: '2px solid var(--primary)',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '1rem',
                fontFamily: 'inherit',
                resize: 'vertical',
                lineHeight: '1.6'
              }}
            />
          ) : (
            <div className="result-box" style={{ whiteSpace: 'pre-wrap' }}>
              {editedText}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Edit Button - Forced Visibility */}
            {!isEditing && (
              <button
                id="edit-btn"
                className="btn-primary"
                onClick={() => {
                  console.log("Edit mode activated");
                  setIsEditing(true);
                }}
                style={{
                  backgroundColor: '#3b82f6', // Bright Blue
                  display: 'inline-block',
                  visibility: 'visible',
                  opacity: 1
                }}
              >
                ✎ Edit Text
              </button>
            )}

            {isEditing && (
              <>
                <button
                  className="btn-primary"
                  onClick={() => {
                    setOcrResult(editedText);
                    setIsEditing(false);
                  }}
                  style={{ backgroundColor: '#10b981' }}
                >
                  ✓ Save Changes
                </button>
                <button
                  className="btn-primary"
                  onClick={() => {
                    setEditedText(ocrResult);
                    setIsEditing(false);
                  }}
                  style={{ backgroundColor: '#ef4444' }}
                >
                  ✗ Cancel
                </button>
              </>
            )}

            <button
              className="btn-primary"
              style={{ backgroundColor: 'var(--text-secondary)' }}
              onClick={() => navigator.clipboard.writeText(editedText)}
            >
              📋 Copy to Clipboard
            </button>

            <button
              className="btn-primary"
              style={{ backgroundColor: '#6366f1' }}
              onClick={() => {
                const blob = new Blob([editedText], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'extracted-text.txt';
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              💾 Download as TXT
            </button>

            {/* Text Formatting Options */}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn-primary"
                style={{ backgroundColor: '#8b5cf6', padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                onClick={() => setEditedText(editedText.toUpperCase())}
                title="Convert to UPPERCASE"
              >
                AA
              </button>
              <button
                className="btn-primary"
                style={{ backgroundColor: '#8b5cf6', padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                onClick={() => setEditedText(editedText.toLowerCase())}
                title="Convert to lowercase"
              >
                aa
              </button>
              <button
                className="btn-primary"
                style={{ backgroundColor: '#8b5cf6', padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                onClick={() => {
                  const titleCase = editedText.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
                  setEditedText(titleCase);
                }}
                title="Convert to Title Case"
              >
                Aa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OCRPage;
