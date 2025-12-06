import React, { useState, useEffect } from 'react';
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
    const [copiedField, setCopiedField] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Profile Management
    const [profiles, setProfiles] = useState({});
    const [profileName, setProfileName] = useState('');
    const [showSaveDialog, setShowSaveDialog] = useState(false);

    // Form data (for auto-fill)
    const [formData, setFormData] = useState({});

    // Validation state
    const [validationErrors, setValidationErrors] = useState({});

    // Training State
    const [showTraining, setShowTraining] = useState(false);
    const [trainingPatterns, setTrainingPatterns] = useState({});
    const [newKeyword, setNewKeyword] = useState('');
    const [selectedTrainingField, setSelectedTrainingField] = useState('name');

    useEffect(() => {
        if (showTraining) {
            fetchTrainingPatterns();
        }
    }, [showTraining]);

    const fetchTrainingPatterns = async () => {
        try {
            const res = await fetch(`/api/training/patterns`);
            if (res.ok) {
                const data = await res.json();
                setTrainingPatterns(data);
            }
        } catch (e) {
            console.error("Failed to fetch patterns", e);
        }
    };

    const handleAddPattern = async () => {
        if (!newKeyword.trim()) return;
        try {
            const res = await fetch(`/api/training/patterns`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ field: selectedTrainingField, keyword: newKeyword })
            });
            if (res.ok) {
                const data = await res.json();
                setTrainingPatterns(data.patterns);
                setNewKeyword('');
                alert(`Learned: "${newKeyword}" is a "${selectedTrainingField}"`);
            }
        } catch (e) {
            alert("Failed to save pattern");
        }
    };

    useEffect(() => {
        // Load profiles
        const savedProfiles = localStorage.getItem('ocr_profiles');
        if (savedProfiles) {
            setProfiles(JSON.parse(savedProfiles));
        }
    }, []);

    // Validation helper functions
    const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const validatePhone = (phone) => /^[\d\s\-\+\(\)]{10,}$/.test(phone);
    const validateDate = (date) => /^\d{4}-\d{2}-\d{2}$/.test(date);

    const validateField = (fieldName, value) => {
        if (!value) return true;
        if (fieldName.includes('email')) return validateEmail(value);
        if (fieldName.includes('phone')) return validatePhone(value);
        if (fieldName.includes('date') || fieldName.includes('dob')) return validateDate(value);
        return true;
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);
            if (file.type === 'application/pdf') {
                setPreviewUrl(null); // No preview for PDF
            } else {
                setPreviewUrl(URL.createObjectURL(file));
            }
            setExtractedFields(null);
            setRawText('');
            setError('');
            setFormData({});
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
            // Use relative path for unified deployment
            const response = await fetch(
                `/api/extract-fields?document_type=${documentType}&language=${language}`,
                {
                    method: 'POST',
                    body: formDataObj,
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to extract fields. Please try again.');
            }

            const data = await response.json();
            setExtractedFields(data);
            setRawText(data.raw_text || '');

            // Auto-fill form
            if (data.fields) {
                setFormData(data.fields);
            }
        } catch (err) {
            console.error("Extraction Error:", err);
            setError(err.message || 'An unexpected error occurred. Is the backend running?');
        } finally {
            setLoading(false);
        }
    };

    const handleFormChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        if (!validateField(field, value)) {
            setValidationErrors(prev => ({ ...prev, [field]: 'Invalid format' }));
        } else {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const copyToClipboard = (text, fieldName) => {
        navigator.clipboard.writeText(text);
        setCopiedField(fieldName);
        setTimeout(() => setCopiedField(null), 2000);
    };

    // Profile Actions
    const saveProfile = () => {
        if (!profileName.trim()) return alert('Enter profile name');
        const newProfiles = {
            ...profiles,
            [profileName]: {
                fields: formData,
                raw_text: rawText,
                document_type: documentType
            }
        };
        setProfiles(newProfiles);
        localStorage.setItem('ocr_profiles', JSON.stringify(newProfiles));
        setShowSaveDialog(false);
        setProfileName('');
        alert('Profile saved!');
    };

    const loadProfile = (name) => {
        const profile = profiles[name];
        setFormData(profile.fields);
        setRawText(profile.raw_text);
        setDocumentType(profile.document_type);
        setExtractedFields({ fields: profile.fields }); // Simulate extraction result
    };

    const deleteProfile = (name) => {
        if (window.confirm(`Delete "${name}"?`)) {
            const newProfiles = { ...profiles };
            delete newProfiles[name];
            setProfiles(newProfiles);
            localStorage.setItem('ocr_profiles', JSON.stringify(newProfiles));
        }
    };

    const openPopOut = () => {
        const width = 400;
        const height = 600;
        const left = window.screen.width - width;
        const popup = window.open('', 'OCRHelper', `width=${width},height=${height},left=${left},top=0`);

        if (popup) {
            const htmlContent = `
                <html>
                    <head>
                        <title>Auto-Fill Helper</title>
                        <style>
                            body { font-family: system-ui, sans-serif; padding: 1rem; background: #f8fafc; }
                            .card { background: white; padding: 0.75rem; margin-bottom: 0.5rem; border: 1px solid #e2e8f0; border-radius: 0.5rem; cursor: pointer; }
                            .card:hover { border-color: #6366f1; }
                            .label { font-size: 0.7rem; color: #64748b; font-weight: bold; text-transform: uppercase; }
                            .value { font-size: 0.9rem; color: #1e293b; }
                            .copied { background: #dcfce7; border-color: #22c55e; }
                        </style>
                    </head>
                    <body>
                        <h3>📋 Click to Copy</h3>
                        <div id="fields"></div>
                        <script>
                            const data = ${JSON.stringify(formData)};
                            const container = document.getElementById('fields');
                            Object.entries(data).forEach(([key, value]) => {
                                const div = document.createElement('div');
                                div.className = 'card';
                                div.innerHTML = '<div class="label">' + key.replace(/_/g, ' ') + '</div><div class="value">' + value + '</div>';
                                div.onclick = () => {
                                    navigator.clipboard.writeText(value);
                                    div.classList.add('copied');
                                    setTimeout(() => div.classList.remove('copied'), 1000);
                                };
                                container.appendChild(div);
                            });
                        </script>
                    </body>
                </html>
            `;
            popup.document.write(htmlContent);
        }
    };

    const getConfidenceColor = (confidence) => {
        if (confidence >= 0.8) return '#10b981';
        if (confidence >= 0.6) return '#f59e0b';
        return '#ef4444';
    };

    // Filter fields for display
    const filteredFields = Object.entries(formData).filter(([key, value]) =>
        key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container" style={{ maxWidth: '1200px' }}>
            {/* Hero Section with Typing Effect */}
            <div className="typing-hero">
                <div className="typing-text">Smart Document Hub</div>
                <p style={{ color: '#94a3b8', marginTop: '0.5rem', fontSize: '1.1rem' }}>
                    Extract, Verify, Save, and Auto-Fill from any document.
                </p>
            </div>

            {/* Action Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginBottom: '2rem' }}>
                <button
                    className="btn-primary"
                    onClick={() => setShowTraining(true)}
                    style={{ backgroundColor: '#f59e0b' }}
                >
                    ⚙️ Train System
                </button>
                {Object.keys(formData).length > 0 && (
                    <button
                        className="btn-primary"
                        onClick={openPopOut}
                        style={{ backgroundColor: '#6366f1' }}
                    >
                        ↗️ Pop Out Window
                    </button>
                )}
            </div>

            {/* Profile Bar */}
            <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1rem', borderRadius: '0.5rem', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 600 }}>📂 Profiles:</span>
                {Object.keys(profiles).length === 0 && <span style={{ color: '#64748b', fontSize: '0.9rem' }}>No saved profiles</span>}
                {Object.keys(profiles).map(name => (
                    <div key={name} style={{ display: 'flex', gap: '0.25rem' }}>
                        <button
                            onClick={() => loadProfile(name)}
                            style={{ padding: '0.25rem 0.75rem', borderRadius: '0.25rem', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer' }}
                        >
                            {name}
                        </button>
                        <button
                            onClick={() => deleteProfile(name)}
                            style={{ padding: '0.25rem', borderRadius: '0.25rem', border: 'none', background: '#fee2e2', color: '#ef4444', cursor: 'pointer' }}
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: extractedFields ? '1fr 2fr' : '1fr', gap: '2rem', transition: 'all 0.5s ease' }}>

                {/* Left Panel: Upload & Controls */}
                <div>
                    <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '1rem', marginBottom: '1rem' }}>
                        <h3>1. Document Settings</h3>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Type:</label>
                            <select
                                value={documentType}
                                onChange={(e) => setDocumentType(e.target.value)}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--border)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                            >
                                <option value="id_card">Student ID / Driver's License</option>
                                <option value="passport">Passport</option>
                                <option value="form">Form</option>
                                <option value="general">General Document</option>
                            </select>
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Language:</label>
                            <select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--border)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
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

                        <form onSubmit={handleExtractFields}>
                            <div className="upload-area" style={{ padding: '1.5rem' }}>
                                <input
                                    type="file"
                                    onChange={handleFileChange}
                                    accept="image/*,application/pdf"
                                    style={{ width: '100%' }}
                                />
                                {previewUrl ? (
                                    <img
                                        src={previewUrl}
                                        alt="Preview"
                                        style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '0.5rem', marginTop: '1rem' }}
                                    />
                                ) : selectedFile && selectedFile.type === 'application/pdf' ? (
                                    <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#e2e8f0', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                        <span style={{ fontSize: '1.5rem' }}>📄</span>
                                        <span style={{ fontWeight: 500 }}>{selectedFile.name}</span>
                                    </div>
                                ) : null}
                            </div>
                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={loading || !selectedFile}
                                style={{ width: '100%', marginTop: '1rem' }}
                            >
                                {loading ? 'Processing...' : '⚡ Extract & Analyze'}
                            </button>
                        </form>
                    </div>

                    {/* Detected Data (Click to Copy) */}
                    {Object.keys(formData).length > 0 && (
                        <div style={{ backgroundColor: 'white', border: '1px solid var(--border)', borderRadius: '1rem', padding: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3>📋 Detected Data</h3>
                                <input
                                    type="text"
                                    placeholder="🔍 Search..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{ width: '120px', padding: '0.25rem', borderRadius: '0.25rem', border: '1px solid #cbd5e1' }}
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {filteredFields.map(([key, value]) => (
                                    <div
                                        key={key}
                                        onClick={() => copyToClipboard(value, key)}
                                        style={{
                                            padding: '0.75rem',
                                            borderRadius: '0.5rem',
                                            border: copiedField === key ? '2px solid #22c55e' : '1px solid #e2e8f0',
                                            backgroundColor: copiedField === key ? '#dcfce7' : '#f8fafc',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>
                                            {key.replace(/_/g, ' ')}
                                        </div>
                                        <div style={{ fontSize: '0.9rem', color: '#1e293b', wordBreak: 'break-all' }}>
                                            {value}
                                        </div>
                                        {copiedField === key && <div style={{ color: '#15803d', fontSize: '0.7rem', fontWeight: 'bold', marginTop: '0.25rem' }}>✓ Copied!</div>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Panel: Verification & Export */}
                {Object.keys(formData).length > 0 && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3>✅ Verification & Export</h3>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {showSaveDialog ? (
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <input
                                            type="text"
                                            placeholder="Profile Name"
                                            value={profileName}
                                            onChange={(e) => setProfileName(e.target.value)}
                                            style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1' }}
                                        />
                                        <button className="btn-primary" onClick={saveProfile} style={{ padding: '0.5rem 1rem' }}>Save</button>
                                        <button onClick={() => setShowSaveDialog(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>❌</button>
                                    </div>
                                ) : (
                                    <button
                                        className="btn-primary"
                                        onClick={() => setShowSaveDialog(true)}
                                        style={{ backgroundColor: '#10b981' }}
                                    >
                                        💾 Save Profile
                                    </button>
                                )}
                            </div>
                        </div>

                        <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
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
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                borderRadius: '0.5rem',
                                                border: validationErrors[key] ? '2px solid #ef4444' : '2px solid #e2e8f0',
                                                backgroundColor: extractedFields && extractedFields.fields && extractedFields.fields[key] ? '#f0fdf4' : 'white',
                                                color: 'var(--text-primary)'
                                            }}
                                        />
                                        {validationErrors[key] && <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>{validationErrors[key]}</span>}
                                    </div>
                                ))}

                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                    <button
                                        className="btn-primary"
                                        style={{ backgroundColor: '#6366f1', flex: 1 }}
                                        onClick={() => {
                                            const blob = new Blob([JSON.stringify(formData, null, 2)], { type: 'application/json' });
                                            const url = URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = 'data.json';
                                            a.click();
                                        }}
                                    >
                                        Download JSON
                                    </button>
                                    <button
                                        className="btn-primary"
                                        style={{ backgroundColor: '#8b5cf6', flex: 1 }}
                                        onClick={() => {
                                            const headers = Object.keys(formData).join(',');
                                            const values = Object.values(formData).map(v => `"${v}"`).join(',');
                                            const blob = new Blob([`${headers}\n${values}`], { type: 'text/csv' });
                                            const url = URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = 'data.csv';
                                            a.click();
                                        }}
                                    >
                                        Download CSV
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Raw Text Preview */}
                        {rawText && (
                            <div style={{ marginTop: '2rem' }}>
                                <details>
                                    <summary style={{ cursor: 'pointer', color: 'var(--text-secondary)' }}>View Raw OCR Text</summary>
                                    <div className="result-box" style={{ marginTop: '1rem', maxHeight: '200px' }}>
                                        {rawText}
                                    </div>
                                </details>
                            </div>
                        )}
                    </div>
                )}
            </div>
            {loading && <div className="loading-spinner"></div>}

            {
                error && (
                    <div className="error-message">
                        <strong>Error:</strong> {error}
                    </div>
                )
            }

            {/* Training Modal */}
            {
                showTraining && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                    }}>
                        <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '1rem', width: '600px', maxWidth: '90%', maxHeight: '80vh', overflowY: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h2>⚙️ Train Extraction System</h2>
                                <button onClick={() => setShowTraining(false)} style={{ border: 'none', background: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                            </div>

                            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
                                Teach the system new keywords. For example, if "Roll No" is written as "Enrolment #", add "Enrolment #" to the "roll_no" field.
                            </p>

                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                                <select
                                    value={selectedTrainingField}
                                    onChange={(e) => setSelectedTrainingField(e.target.value)}
                                    style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', flex: 1 }}
                                >
                                    {Object.keys(trainingPatterns).map(field => (
                                        <option key={field} value={field}>{field.replace(/_/g, ' ').toUpperCase()}</option>
                                    ))}
                                </select>
                                <input
                                    type="text"
                                    placeholder="New Keyword (e.g. 'Enrolment #')"
                                    value={newKeyword}
                                    onChange={(e) => setNewKeyword(e.target.value)}
                                    style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', flex: 2 }}
                                />
                                <button className="btn-primary" onClick={handleAddPattern}>Add Rule</button>
                            </div>

                            <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '0.5rem' }}>
                                <h4 style={{ marginTop: 0 }}>Current Keywords for "{selectedTrainingField}":</h4>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {trainingPatterns[selectedTrainingField]?.map((kw, i) => (
                                        <span key={i} style={{ background: '#e2e8f0', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.9rem' }}>
                                            {kw}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}

export default DocumentExtractorPage;
