import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import OCRPage from "./pages/OCRPage";
import DocumentExtractorPage from "./pages/DocumentExtractorPage";

function Navigation() {
  const location = useLocation();

  const navStyle = {
    display: 'flex',
    gap: '1rem',
    padding: '1rem',
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: '0.5rem',
    marginBottom: '2rem',
    justifyContent: 'center',
    flexWrap: 'wrap'
  };

  const linkStyle = (path) => ({
    padding: '0.75rem 1.5rem',
    borderRadius: '0.5rem',
    textDecoration: 'none',
    fontWeight: 600,
    transition: 'all 0.3s',
    backgroundColor: location.pathname === path ? 'var(--primary)' : 'transparent',
    color: location.pathname === path ? 'white' : 'var(--text-primary)',
  });

  return (
    <nav style={navStyle}>
      <Link to="/" style={linkStyle('/')}>
        📝 Basic OCR
      </Link>
      <Link to="/extract" style={linkStyle('/extract')}>
        🎯 Smart Document Hub
      </Link>
    </nav>
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <div style={{ padding: '1rem' }}>
          <Navigation />
          <Routes>
            <Route path="/" element={<OCRPage />} />
            <Route path="/extract" element={<DocumentExtractorPage />} />
          </Routes>
        </div>
      </BrowserRouter>
    </div>
  );
}

export default App;
