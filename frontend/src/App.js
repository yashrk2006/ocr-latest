import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import DocumentExtractorPage from './pages/DocumentExtractorPage';
import FormOverlayPage from './pages/FormOverlayPage';
import OCRPage from './pages/OCRPage';
import Background from './components/Background';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Background />
        <nav style={{ padding: '1rem', backgroundColor: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '2rem' }}>
            <Link to="/" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold', fontSize: '1.1rem' }}>🎯 Smart Document Hub</Link>
            <Link to="/fill-form" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontWeight: '600' }}>✍️ Auto-Fill Form</Link>
            <Link to="/basic" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontWeight: '600' }}>📝 Basic OCR</Link>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<DocumentExtractorPage />} />
          <Route path="/fill-form" element={<FormOverlayPage />} />
          <Route path="/basic" element={<OCRPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
