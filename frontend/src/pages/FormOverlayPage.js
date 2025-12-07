
import React, { useState } from 'react';
import Draggable from 'react-draggable';
import '../App.css';

function FormOverlayPage() {
    const [templateImage, setTemplateImage] = useState(null);
    const [templatePreview, setTemplatePreview] = useState(null);
    const [extractedData, setExtractedData] = useState({});

    // Each text element to be placed on the form
    // { id, text, x, y, fontSize, fontFamily }
    const [textElements, setTextElements] = useState([]);

    // 1. Handle Template Image Upload (The empty form)
    const handleTemplateUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setTemplateImage(file);
            setTemplatePreview(URL.createObjectURL(file));
        }
    };

    // 2. Load Data from LocalStorage (or sample if empty)
    const loadExtractedData = () => {
        const stored = localStorage.getItem('ocr_extracted_fields');
        let dataToLoad = {};

        if (stored) {
            try {
                dataToLoad = JSON.parse(stored);
                console.log("Loaded data from storage:", dataToLoad);
            } catch (e) {
                console.error("Failed to parse stored data", e);
            }
        }

        // If empty, providing a sample for testing
        if (Object.keys(dataToLoad).length === 0) {
            alert("No newly extracted data found! Loading sample data for demo.");
            dataToLoad = {
                "Name": "John Doe",
                "ID": "A12345678",
                "Date": "2023-01-01"
            };
        }

        setExtractedData(dataToLoad);

        // Convert to draggable elements
        const elements = Object.entries(dataToLoad).map(([key, value], index) => ({
            id: `field-${index}`,
            label: key,
            text: value,
            x: 50,
            y: 50 + (index * 60),
            fontSize: 24, // High res default
            fontFamily: 'Arial',
            color: '#000000'
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

    // 5. Generate Final Image (Fixed Scaling)
    const generateFinalImage = async () => {
        if (!templatePreview) return;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        // We need to wait for the image to support crossOrigin if hosted, 
        // but here it's a local object URL so it's fine.
        img.src = templatePreview;

        await new Promise(resolve => { img.onload = resolve; });

        // Set canvas to full resolution of the image
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        // Draw the template form
        ctx.drawImage(img, 0, 0);

        // Calculate scaling factor
        // The user edits on a screen where the image might be 800px wide
        // But the actual image might be 3000px wide.
        const container = document.getElementById('canvas-container');
        const displayedImage = container.querySelector('img');

        if (!displayedImage) {
            console.error("Could not find displayed image element");
            return;
        }

        const scaleX = img.naturalWidth / displayedImage.clientWidth;
        const scaleY = img.naturalHeight / displayedImage.clientHeight;

        // Draw text
        textElements.forEach(el => {
            // Apply scaling
            // Coordinates in draggable are relative to the container *top-left*
            // We need to ensure text is drawn at those scaled coordinates

            const finalX = el.x * scaleX;
            const finalY = el.y * scaleY;
            const finalFontSize = el.fontSize * scaleX; // Scale font size

            ctx.font = `${finalFontSize}px ${el.fontFamily}`;
            ctx.fillStyle = el.color;
            ctx.textBaseline = 'top';

            // Adjust for padding added in HTML view
            ctx.fillText(el.text, finalX, finalY);
        });

        // Download
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = 'filled-form.png';
        link.href = dataUrl;
        link.click();
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
                        <button className="btn-primary" onClick={loadExtractedData}>
                            Load Extracted Data
                        </button>
                        <div style={{ marginTop: '1rem', maxHeight: '300px', overflowY: 'auto' }}>
                            {textElements.length === 0 && <p style={{ color: '#888', fontStyle: 'italic' }}>No data loaded.</p>}
                            {textElements.map(el => (
                                <div key={el.id} style={{ marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{el.label}</label>
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
                                    position={{ x: el.x, y: el.y }}
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
