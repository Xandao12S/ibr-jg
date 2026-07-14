// src/pages/Home.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import '../components/Home.css'; // Certifique-se de ter este arquivo ou use App.css

export default function Home() {
  return (
    <div className="home-container">
      {/* Texto de Bem-vindo */}
      <div className="welcome-card">
        <h1>Bem-vindo à IBR Jardim Guarujá</h1>
        <p>Conectados em fé, servindo ao Senhor com amor.</p>
      </div>

      {/* Menu Inferior Responsivo */}
      <nav className="bottom-nav">
        <Link to="/" className="nav-item">
          <span className="nav-icon">🏠</span>
          <span className="nav-label">INÍCIO</span>
        </Link>
        
        <Link to="/escalas" className="nav-item">
          <span className="nav-icon">📅</span>
          <span className="nav-label">ESCALA</span>
        </Link>
        
        <Link to="/informativos" className="nav-item">
          <span className="nav-icon">🎓</span>
          <span className="nav-label">TUTORIAIS</span>
        </Link>
      </nav>
    </div>
  );
}