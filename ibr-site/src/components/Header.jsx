// src/components/Header.jsx
import React, { useEffect, useRef } from 'react';
import './Header.css';

export default function Header() {
  const headerRef = useRef(null);

  useEffect(() => {
    function setHeaderHeight() {
      if (!headerRef.current) return;
      const h = headerRef.current.offsetHeight;
      document.documentElement.style.setProperty('--site-header-height', `${h}px`);
    }
    setHeaderHeight();
    window.addEventListener('resize', setHeaderHeight);
    window.addEventListener('orientationchange', setHeaderHeight);
    const t = setTimeout(setHeaderHeight, 200);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', setHeaderHeight);
      window.removeEventListener('orientationchange', setHeaderHeight);
    };
  }, []);

  return (
    <header className="site-header" ref={headerRef}>
      <div className="header-inner">
        <div className="brand">
          <img src="/ibr.jpg" alt="IBR" className="header-logo" />
          <div className="brand-text">
            <div className="brand-title">IBR</div>
            <div className="brand-sub">Jardim Guarujá</div>
          </div>
        </div>

        {/* Mantém apenas um link superior: Informativos */}
        <nav className="navbar" aria-label="Navegação principal">
          <a className="nav-link" href="/informativos">Informativos</a>
        </nav>
      </div>
    </header>
  );
}