
import React, { useState, useRef, useEffect } from 'react';
import Draggable from 'react-draggable';
import '../App.css';

function FormOverlayPage() {
    const [templateImage, setTemplateImage] = useState(null);
    const [templatePreview, setTemplatePreview] = useState(null);
    const [extractedData, setExtractedData] = useState({});

    // Each text element to be placed on the form
    // { id, text, x, y, fontSize, fontFamily }
    const [textElements, setTextElements] = useState([]);

    const [loading, setLoading] = useState(false);
    const [dragMode, setDragMode] = useState(true); // true = drag, false = edit

    // 1. Handle Template Image Upload (The empty form)
    const handleTemplateUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setTemplateImage(file);
            setTemplatePreview(URL.createObjectURL(file));
        }
    };

    // 2. Handle Data Source (Extracted data to fill)
    // For now, let's simulate pasting data or fetching from previous extraction
    // In a real flow, this could come from location.state or context
    const loadSampleData = () => {
        const sample = {
            "First Name": "John",
            "Last Name": "Doe",
            "Date of Birth": "1990-01-01",
            "Address": "123 Main St, New York, NY",
            "Phone": "+1-555-0199"
        };
        setExtractedData(sample);

        // Convert to draggable elements
        const elements = Object.entries(sample).map(([key, value], index) => ({
            id: `field-${index}`,
            label: key,
            text: value,
            x: 50,
            y: 50 + (index * 40), // Stagger them initially
            fontSize: 16,
            fontFamily: 'Arial',
            color: 'black'
        }));
        setTextElements(elements);
    };

    // 3. Update element position
    const handleStop = (id, e, data) => {
        setTextElements(prev => prev.map(el =>
            el.id === id ? { ...el, x: data.x, y: data.y } : el
        ));
    };

    // 4. Update element style
    const updateStyle = (id, key, value) => {
        setTextElements(prev => prev.map(el =>
            el.id === id ? { ...el, [key]: value } : el
        ));
    };

    // 5. Generate Final Image (using canvas)
    const generateFinalImage = async () => {
        if (!templatePreview) return;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;

            // Draw template
            ctx.drawImage(img, 0, 0);

            // Draw text elements
            // Note: We need to scale coordinates if the screen preview size != actual image size
            // For simplicity here, assuming 1:1 or handling scaling logic later
            // A robust solution calculates the ratio between rendered width and natural width

            const container = document.getElementById('canvas-container');
            const ratio = img.width / container.offsetWidth;

            textElements.forEach(el => {
                ctx.font = `${el.fontSize * ratio}px ${el.fontFamily}`;
                ctx.fillStyle = el.color;
                ctx.fillText(el.text, el.x * ratio, (el.y + el.fontSize) * ratio);
            });

            // Download
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = 'filled-form.png';
            link.href = dataUrl;
            link.click();
        };
        img.src = templatePreview;
    };

    return (
        <div className="container" style={{ maxWidth: '1400px' }}>
            <h1>✍️ Smart Form Filler</h1>
            <p>Drag extracted text onto your form perfectly.</p>

            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem' }}>

                {/* Controls Sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="card">
                        <h3>1. Upload Empty Form</h3>
                        <input type="file" accept="image/*" onChange={handleTemplateUpload} />
                    </div>

                    <div className="card">
                        <h3>2. Load Data</h3>
                        <button className="btn-primary" onClick={loadSampleData}>
                            Load Extracted Data
                        </button>
                        <div style={{ marginTop: '1rem', maxHeight: '300px', overflowY: 'auto' }}>
                            {textElements.map(el => (
                                <div key={el.id} style={{ marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
                                    <label style={{ fontSize: '0.8rem', color: '#666' }}>{el.label}</label>
                                    <input
                                        type="text"
                                        value={el.text}
                                        onChange={(e) => updateStyle(el.id, 'text', e.target.value)}
                                        style={{ width: '100%', padding: '0.25rem' }}
                                    />
                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                        <input
                                            type="number"
                                            value={el.fontSize}
                                            onChange={(e) => updateStyle(el.id, 'fontSize', parseInt(e.target.value))}
                                            style={{ width: '60px' }}
                                            title="Font Size"
                                        />
                                        <input
                                            type="color"
                                            value={el.color}
                                            onChange={(e) => updateStyle(el.id, 'color', e.target.value)}
                                            title="Text Color"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button className="btn-primary" style={{ backgroundColor: '#10b981' }} onClick={generateFinalImage}>
                        💾 Download Signed Form
                    </button>
                </div>

                {/* Main Canvas Area */}
                <div
                    className="canvas-container"
                    id="canvas-container"
                    style={{
                        position: 'relative',
                        border: '2px dashed #ccc',
                        minHeight: '600px',
                        backgroundColor: '#f8f9fa',
                        overflow: 'hidden'
                    }}
                >
                    {templatePreview ? (
                        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                            <img
                                src={templatePreview}
                                alt="Form Template"
                                style={{ width: '100%', display: 'block', userSelect: 'none' }}
                                draggable={false}
                            />

                            {textElements.map(el => (
                                <Draggable
                                    key={el.id}
                                    defaultPosition={{ x: el.x, y: el.y }}
                                    onStop={(e, data) => handleStop(el.id, e, data)}
                                    bounds="parent"
                                >
                                    <div
                                        style={{
                                            position: 'absolute',
                                            cursor: 'move',
                                            fontSize: `${el.fontSize}px`,
                                            fontFamily: el.fontFamily,
                                            color: el.color,
                                            border: '1px dashed rgba(0,0,255,0.3)', // Helper border while editing
                                            padding: '2px',
                                            whiteSpace: 'nowrap',
                                            zIndex: 10
                                        }}
                                    >
                                        {el.text}
                                    </div>
                                </Draggable>
                            ))}
                        </div>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#aaa' }}>
                            Upload a form image to start
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default FormOverlayPage;
