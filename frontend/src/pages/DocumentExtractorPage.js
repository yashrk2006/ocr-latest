import React, { useState } from 'react';
import '../App.css';

function DocumentExtractorPage() {
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [documentType, setDocumentType] = useState('id_card');
    const [extractedFields, setExtractedFields] = useState(null);
    const [rawText, setRawText] = useState('');
    const [language, setLanguage] = useState('eng');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Form data (for auto-fill)
    const [formData, setFormData] = useState({
        full_name: '',
        id_number: '',
        date_of_birth: '',
        address: '',
        gender: '',
        phone: '',
        email: ''
    });

    // Validation state
    const [validationErrors, setValidationErrors] = useState({});

    // Validation helper functions
    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    const validatePhone = (phone) => {
        const re = /^[\d\s\-\+\(\)]{10,}$/;
        return re.test(phone);
    };

    const validateDate = (date) => {
        const re = /^\d{4}-\d{2}-\d{2}$/;
        return re.test(date);
    };

    const validateField = (fieldName, value) => {
        if (!value) return true; // Empty is okay

        switch (fieldName) {
            case 'email':
                return validateEmail(value);
            case 'phone':
                return validatePhone(value);
            case 'date_of_birth':
                return validateDate(value);
            default:
                return true;
        }
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            setExtractedFields(null);
            setRawText('');
            setError('');
        }
    };

    const handleExtractFields = async (event) => {
        event.preventDefault();
        if (!selectedFile) {
            setError('Please select a file first.');
            return;
        }

        setLoading(true);
        setError('');
        setExtractedFields(null);

        const formDataObj = new FormData();
        formDataObj.append('file', selectedFile);

        try {
            const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
            const response = await fetch(
                `${backendUrl}/api/extract-fields?document_type=${documentType}&language=${language}`,
                {
                    method: 'POST',
                    body: formDataObj,
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || 'Failed to extract fields. Please try again.');
            }

            const data = await response.json();
            setExtractedFields(data);
            setRawText(data.raw_text || '');

            // Auto-fill form with extracted data
            if (data.fields) {
                setFormData(prevData => ({
                    ...prevData,
                    ...data.fields
                }));
            }

        } catch (err) {
            console.error("Extraction Error:", err);
            setError(err.message || 'An unexpected error occurred. Is the backend running?');
        } finally {
            setLoading(false);
        }
    };

    const handleFormChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Validate field
        if (!validateField(field, value)) {
            setValidationErrors(prev => ({
                ...prev,
                [field]: `Invalid format`
            }));
        } else {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const getConfidenceColor = (confidence) => {
        if (confidence >= 0.8) return '#10b981';  // Green
        if (confidence >= 0.6) return '#f59e0b';  // Yellow
        return '#ef4444';  // Red
    };

    const getConfidenceLabel = (confidence) => {
        if (confidence >= 0.8) return 'High';
        if (confidence >= 0.6) return 'Medium';
        return 'Low';
    };

    return (
        <div className="container">
            <h1>🎯 Smart Document Extractor</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                Upload a document to automatically extract and verify information
            </p>

            {/* Document Type Selector */}
            <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                    Document Type:
                </label>
                <select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
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
                    <option value="id_card">ID Card / Driver's License</option>
                    <option value="passport">Passport</option>
                    <option value="form">Form / Application</option>
                    <option value="general">General Document</option>
                </select>
            </div>

            {/* Language Selector */}
            <div style={{ marginBottom: '2rem' }}>
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

            {/* Upload Area */}
            <form onSubmit={handleExtractFields}>
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
                                <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>📄</span>
                                <span style={{ fontSize: '1.1rem', fontWeight: 500 }}>Click to upload a document</span>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                                    Supports PNG, JPG, JPEG
                                </p>
                            </div>
                        )}
                    </label>
                </div>

                <button type="submit" className="btn-primary" disabled={loading || !selectedFile}>
                    {loading ? 'Extracting Fields...' : 'Extract & Auto-Fill'}
                </button>
            </form>

            {loading && <div className="loading-spinner"></div>}

            {error && (
                <div className="error-message">
                    <strong>Error:</strong> {error}
                </div>
            )}

            {/* Extracted Fields and Form */}
            {extractedFields && (
                <div style={{ marginTop: '2rem' }}>
                    <h2>📋 Extracted Information</h2>

                    {/* Two-column layout */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '1.5rem' }}>

                        {/* Left: Extracted Fields */}
                        <div>
                            <h3 style={{ marginBottom: '1rem' }}>Detected Fields:</h3>
                            {Object.keys(extractedFields.fields).length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {Object.entries(extractedFields.fields).map(([key, value]) => {
                                        const confidence = extractedFields.confidence?.[key] || 0;
                                        return (
                                            <div
                                                key={key}
                                                style={{
                                                    padding: '1rem',
                                                    borderRadius: '0.5rem',
                                                    backgroundColor: 'var(--bg-secondary)',
                                                    border: '2px solid var(--border)'
                                                }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                    <strong style={{ textTransform: 'capitalize' }}>
                                                        {key.replace(/_/g, ' ')}:
                                                    </strong>
                                                    <span
                                                        style={{
                                                            padding: '0.25rem 0.75rem',
                                                            borderRadius: '1rem',
                                                            fontSize: '0.75rem',
                                                            fontWeight: 600,
                                                            backgroundColor: getConfidenceColor(confidence),
                                                            color: 'white'
                                                        }}
                                                    >
                                                        {getConfidenceLabel(confidence)} ({Math.round(confidence * 100)}%)
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: '1.1rem' }}>{value}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p style={{ color: 'var(--text-secondary)' }}>No structured fields detected</p>
                            )}
                        </div>

                        {/* Right: Editable Form */}
                        <div>
                            <h3 style={{ marginBottom: '1rem' }}>Verification Form:</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {Object.entries(formData).map(([key, value]) => (
                                    <div key={key}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, textTransform: 'capitalize' }}>
                                            {key.replace(/_/g, ' ')}:
                                        </label>
                                        <input
                                            type="text"
                                            value={value}
                                            onChange={(e) => handleFormChange(key, e.target.value)}
                                            placeholder={`Enter ${key.replace(/_/g, ' ')}`}
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                borderRadius: '0.5rem',
                                                border: validationErrors[key] ? '2px solid #ef4444' : '2px solid var(--border)',
                                                backgroundColor: extractedFields.fields[key] ? '#f0fdf4' : 'var(--bg-secondary)',
                                                color: 'var(--text-primary)',
                                                fontSize: '1rem'
                                            }}
                                        />
                                        {validationErrors[key] && (
                                            <span style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
                                                {validationErrors[key]}
                                            </span>
                                        )}
                                    </div>
                                ))}

                                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                                    <button
                                        className="btn-primary"
                                        onClick={() => alert('Form data submitted successfully!\n\n' + JSON.stringify(formData, null, 2))}
                                        disabled={Object.keys(validationErrors).length > 0}
                                    >
                                        ✓ Submit Data
                                    </button>

                                    <button
                                        className="btn-primary"
                                        style={{ backgroundColor: '#6366f1' }}
                                        onClick={() => {
                                            const blob = new Blob([JSON.stringify(formData, null, 2)], { type: 'application/json' });
                                            const url = URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = 'form-data.json';
                                            a.click();
                                            URL.revokeObjectURL(url);
                                        }}
                                    >
                                        JSON
                                    </button>

                                    <button
                                        className="btn-primary"
                                        style={{ backgroundColor: '#8b5cf6' }}
                                        onClick={() => {
                                            const headers = Object.keys(formData).join(',');
                                            const values = Object.values(formData).map(v => `"${v}"`).join(',');
                                            const csvContent = `${headers}\n${values}`;
                                            const blob = new Blob([csvContent], { type: 'text/csv' });
                                            const url = URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = 'form-data.csv';
                                            a.click();
                                            URL.revokeObjectURL(url);
                                        }}
                                    >
                                        CSV
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Raw Text Section */}
                    {rawText && (
                        <div style={{ marginTop: '2rem' }}>
                            <details>
                                <summary style={{ cursor: 'pointer', fontWeight: 600, padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '0.5rem' }}>
                                    View Raw Extracted Text
                                </summary>
                                <div className="result-box" style={{ marginTop: '1rem' }}>
                                    {rawText}
                                </div>
                            </details>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default DocumentExtractorPage;
