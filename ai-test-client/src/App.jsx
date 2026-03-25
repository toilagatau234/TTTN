import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import CustomDesign from './pages/CustomDesign';
import AppHome from './AppHome';
import './index.css';

function App() {
  return (
    <Router>
      <nav className="main-nav">
        <div className="nav-container">
          <div className="nav-logo">
            <span role="img" aria-label="flower">🌸</span>
            <span>Hydrangea Demo</span>
          </div>
          <div className="nav-links">
            <Link to="/">🧪 Tester Interface</Link>
            <Link to="/customDesign" className="nav-highlight">✨ Custom Bouquet</Link>
          </div>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<AppHome />} />
        <Route path="/customDesign" element={<CustomDesign />} />
      </Routes>
    </Router>
  );
}

export default App;
