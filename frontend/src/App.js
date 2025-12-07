import React, { useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import DocumentExtractorPage from './pages/DocumentExtractorPage';
import FormOverlayPage from './pages/FormOverlayPage';
import OCRPage from './pages/OCRPage';
import Background from './components/Background';
import './App.css';

// Styling for the floating navbar
const navStyle = {
  position: 'fixed',
  top: '1.5rem',
  left: '50%',
  transform: 'translateX(-50%)',
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  backdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '2rem',
  padding: '0.75rem 2rem',
  display: 'flex',
  gap: '2rem',
  zIndex: 100,
  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)'
};

const linkStyle = {
  color: 'rgba(255,255,255,0.6)',
  textDecoration: 'none',
  fontWeight: '500',
  fontSize: '0.95rem',
  transition: 'color 0.2s',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem'
};

const activeLinkStyle = {
  ...linkStyle,
  color: 'white',
  textShadow: '0 0 10px rgba(255,255,255,0.3)'
};

// Nav Item Component to handle active state
const NavItem = ({ to, icon, label }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link to={to} style={isActive ? activeLinkStyle : linkStyle}>
      <span>{icon}</span>
      {label}
    </Link>
  );
};

function App() {
  return (
    <Router>
      <div className="App">
        <Background />

        {/* Floating Navigation Pill */}
        <nav style={navStyle}>
          <NavItem to="/" icon="⚡" label="Extract" />
          <NavItem to="/fill-form" icon="✍️" label="Auto-Fill" />
          <NavItem to="/basic" icon="📝" label="Basic OCR" />
        </nav>

        {/* Padding top to account for fixed navbar */}
        <div style={{ paddingTop: '80px', paddingBottom: '40px', flex: 1 }}>
          <Routes>
            <Route path="/" element={<DocumentExtractorPage />} />
            <Route path="/fill-form" element={<FormOverlayPage />} />
            <Route path="/basic" element={<OCRPage />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
