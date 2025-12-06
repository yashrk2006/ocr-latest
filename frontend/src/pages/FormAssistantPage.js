import React, { useState, useEffect } from 'react';
import '../App.css';

function FormAssistantPage() {
    const [selectedFile, setSelectedFile] = useState(null);
    const [extractedData, setExtractedData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [language, setLanguage] = useState('eng');
    const [copiedField, setCopiedField] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Profile Management
    const [profiles, setProfiles] = useState({});
    const [profileName, setProfileName] = useState('');
    const [showSaveDialog, setShowSaveDialog] = useState(false);

    useEffect(() => {
        // Load profiles from localStorage
        const savedProfiles = localStorage.getItem('ocr_profiles');
        if (savedProfiles) {
            setProfiles(JSON.parse(savedProfiles));
        }
    }, []);

    const handleFileChange = (event) => {
        setSelectedFile(event.target.files[0]);
        setExtractedData(null);
    };

    const handleExtract = async (e) => {
        e.preventDefault();
        if (!selectedFile) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            // Use relative path for unified deployment
            const response = await fetch(
                `/api/extract-fields?document_type=general&language=${language}`,
                {
                    method: 'POST',
                    body: formData,
                }
            );

            const data = await response.json();
            setExtractedData(data.fields);
        } catch (error) {
            console.error('Error:', error);
            alert('Extraction failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text, fieldName) => {
        navigator.clipboard.writeText(text);
        setCopiedField(fieldName);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const saveProfile = () => {
        if (!profileName.trim()) {
            alert('Please enter a profile name');
            return;
        }
        const newProfiles = { ...profiles, [profileName]: extractedData };
        setProfiles(newProfiles);
        localStorage.setItem('ocr_profiles', JSON.stringify(newProfiles));
        setShowSaveDialog(false);
        setProfileName('');
        alert('Profile saved!');
    };

    const loadProfile = (name) => {
        setExtractedData(profiles[name]);
    };

    const deleteProfile = (name) => {
        if (window.confirm(`Delete profile "${name}"?`)) {
            const newProfiles = { ...profiles };
            delete newProfiles[name];
            setProfiles(newProfiles);
            localStorage.setItem('ocr_profiles', JSON.stringify(newProfiles));
            if (extractedData === profiles[name]) {
                setExtractedData(null);
            }
        }
    };

    const openPopOut = () => {
        const width = 400;
        const height = 600;
        const left = window.screen.width - width;
        const top = 0;

        const popup = window.open('', 'OCRHelper', `width=${width},height=${height},left=${left},top=${top}`);

        if (popup) {
            const data = extractedData || {};

            const htmlContent = `
        <html>
          <head>
            <title>OCR Auto-Fill Helper</title>
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; padding: 1rem; background: #f8fafc; margin: 0; }
              h3 { margin-top: 0; color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem; }
              .card { background: white; padding: 0.75rem; margin-bottom: 0.5rem; border-radius: 0.5rem; border: 1px solid #e2e8f0; cursor: pointer; transition: all 0.2s; }
              .card:hover { border-color: #6366f1; transform: translateY(-1px); box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
              .label { font-size: 0.7rem; color: #64748b; text-transform: uppercase; font-weight: bold; margin-bottom: 0.25rem; }
              .value { font-size: 0.9rem; color: #1e293b; word-break: break-word; font-weight: 500; }
              .copied { background-color: #dcfce7; border-color: #22c55e; }
              .footer { margin-top: 1rem; font-size: 0.8rem; color: #94a3b8; text-align: center; }
            </style>
          </head>
          <body>
            <h3>📋 Click to Copy</h3>
            <div id="fields"></div>
            <div class="footer">Keep this window open while filling forms</div>
            <script>
              const data = ${JSON.stringify(data)};
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

            popup.document.open();
            popup.document.write(htmlContent);
            popup.document.close();
        }
    };

    // Filter fields based on search
    const filteredFields = extractedData
        ? Object.entries(extractedData).filter(([key, value]) =>
            key.toLowerCase().includes(searchTerm.toLowerCase()) ||
            String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
        : [];

    return (
        <div className="container" style={{ maxWidth: '1200px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1>🤖 Auto-Fill Station</h1>
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                        Your personal data hub for filling online forms instantly.
                    </p>
                </div>

                {extractedData && (
                    <button
                        className="btn-primary"
                        onClick={openPopOut}
                        style={{ backgroundColor: '#6366f1', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        ↗️ Pop Out Window
                    </button>
                )}
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: '300px 1fr',
                gap: '2rem',
                alignItems: 'start'
            }}>

                {/* Left Panel: Controls */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* 1. Profiles */}
                    <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '1rem' }}>
                        <h3 style={{ marginTop: 0 }}>📂 Saved Profiles</h3>
                        {Object.keys(profiles).length === 0 ? (
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No saved profiles yet.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {Object.keys(profiles).map(name => (
                                    <div key={name} style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            className="btn-primary"
                                            onClick={() => loadProfile(name)}
                                            style={{ flex: 1, padding: '0.5rem', fontSize: '0.9rem', backgroundColor: 'white', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                                        >
                                            {name}
                                        </button>
                                        <button
                                            onClick={() => deleteProfile(name)}
                                            style={{ padding: '0.5rem', border: 'none', background: '#fee2e2', color: '#ef4444', borderRadius: '0.5rem', cursor: 'pointer' }}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 2. New Extraction */}
                    <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '1rem' }}>
                        <h3 style={{ marginTop: 0 }}>📄 New Document</h3>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Language:</label>
                            <select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem' }}
                            >
                                <option value="eng">English</option>
                                <option value="spa">Spanish</option>
                                <option value="fra">French</option>
                                <option value="deu">German</option>
                                <option value="hin">Hindi</option>
                            </select>
                        </div>

                        <input
                            type="file"
                            onChange={handleFileChange}
                            accept="image/*"
                            style={{ marginBottom: '1rem', width: '100%' }}
                        />

                        <button
                            className="btn-primary"
                            onClick={handleExtract}
                            disabled={!selectedFile || loading}
                            style={{ width: '100%' }}
                        >
                            {loading ? 'Processing...' : '⚡ Extract Data'}
                        </button>
                    </div>
                </div>

                {/* Right Panel: Data Dashboard */}
                <div>
                    {extractedData ? (
                        <>
                            {/* Toolbar */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                                <input
                                    type="text"
                                    placeholder="🔍 Search fields..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', width: '250px' }}
                                />

                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    {showSaveDialog ? (
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <input
                                                type="text"
                                                placeholder="Profile Name"
                                                value={profileName}
                                                onChange={(e) => setProfileName(e.target.value)}
                                                style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}
                                            />
                                            <button className="btn-primary" onClick={saveProfile} style={{ padding: '0.5rem 1rem' }}>Save</button>
                                            <button onClick={() => setShowSaveDialog(false)} style={{ padding: '0.5rem', border: 'none', background: 'none', cursor: 'pointer' }}>❌</button>
                                        </div>
                                    ) : (
                                        <button
                                            className="btn-primary"
                                            onClick={() => setShowSaveDialog(true)}
                                            style={{ backgroundColor: '#10b981' }}
                                        >
                                            💾 Save as Profile
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Fields Grid */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                                gap: '1rem'
                            }}>
                                {filteredFields.map(([key, value]) => (
                                    <button
                                        key={key}
                                        onClick={() => copyToClipboard(value, key)}
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'flex-start',
                                            padding: '1rem',
                                            backgroundColor: copiedField === key ? '#dcfce7' : 'white',
                                            border: copiedField === key ? '2px solid #22c55e' : '1px solid var(--border-color)',
                                            borderRadius: '0.75rem',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            textAlign: 'left',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                            position: 'relative',
                                            overflow: 'hidden'
                                        }}
                                    >
                                        <span style={{
                                            fontSize: '0.75rem',
                                            textTransform: 'uppercase',
                                            color: 'var(--text-secondary)',
                                            fontWeight: 700,
                                            marginBottom: '0.25rem'
                                        }}>
                                            {key.replace(/_/g, ' ')}
                                        </span>
                                        <span style={{
                                            fontSize: '1rem',
                                            fontWeight: 500,
                                            color: 'var(--text-primary)',
                                            wordBreak: 'break-word'
                                        }}>
                                            {value}
                                        </span>
                                        {copiedField === key && (
                                            <div style={{
                                                position: 'absolute',
                                                top: 0, left: 0, right: 0, bottom: 0,
                                                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: '#15803d',
                                                fontWeight: 'bold',
                                                backdropFilter: 'blur(1px)'
                                            }}>
                                                ✓ COPIED
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>

                            {filteredFields.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                                    No fields match your search "{searchTerm}"
                                </div>
                            )}
                        </>
                    ) : (
                        <div style={{
                            border: '2px dashed var(--border-color)',
                            borderRadius: '1rem',
                            padding: '4rem',
                            textAlign: 'center',
                            color: 'var(--text-secondary)'
                        }}>
                            <h2>👈 Start Here</h2>
                            <p>Upload a document or load a profile to see your data dashboard.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default FormAssistantPage;
