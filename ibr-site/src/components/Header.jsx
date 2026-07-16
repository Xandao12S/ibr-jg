// src/components/Header.jsx
import React, { useState } from 'react';
import './Header.css';

export default function Header({ siteName = 'IBR Jardim Guarujá' }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="app-header" role="banner">
      <div className="header-inner">
        <div className="logo">
          <img src="/ibr.jpg" alt="IBR" />
          <div className="brand">
            <div className="brand-title">IBR</div>
            <div className="brand-sub">Jardim Guarujá</div>
          </div>
        </div>

        <nav className={`nav-buttons ${open ? 'is-open' : ''}`} aria-label="Navegação principal">
          <a href="/" className="nav-link">Início</a>
          <a href="/escalas" className="nav-link">Escalas</a>
          <a href="/informativos" className="nav-link">Informativos</a>
          <a href="/album" className="nav-link">Álbum</a>
        </nav>

        <div className="header-right">
          <div className="user">Equipe</div>

          <button
            className={`hamburger ${open ? 'is-active' : ''}`}
            aria-label={open ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={open}
            onClick={() => setOpen(s => !s)}
          >
            <span className="hamburger-box">
              <span className="hamburger-inner" />
            </span>
          </button>
        </div>
      </div>

      {/* menu móvel (aparece em telas pequenas) */}
      <div className={`mobile-menu ${open ? 'visible' : ''}`} role="menu" aria-hidden={!open}>
        <a className="mobile-link" href="/" onClick={() => setOpen(false)}>Início</a>
        <a className="mobile-link" href="/escalas" onClick={() => setOpen(false)}>Escalas</a>
        <a className="mobile-link" href="/informativos" onClick={() => setOpen(false)}>Informativos</a>
        <a className="mobile-link" href="/album" onClick={() => setOpen(false)}>Álbum</a>
      </div>
    </header>
  );
}