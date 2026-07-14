// src/pages/Home.jsx
import React from 'react';
import '../components/Home.css'; // ou use seu CSS global

export default function Home() {
  const versiculo = {
    texto: 'Lâmpada para os meus pés é a tua palavra e luz para o meu caminho.',
    referencia: 'Salmos 119:105'
  };

  return (
    <div className="home-page">
      {/* Conteúdo superior (logo, navbar já existentes) */}

      {/* Versículo do dia: centralizado visualmente */}
      <section className="verse-section" aria-label="Versículo do dia">
        <div className="verse-card">
          <p className="verse-text">“{versiculo.texto}”</p>
          <p className="verse-ref">{versiculo.referencia}</p>
        </div>
      </section>

      {/* Resto do conteúdo — por exemplo welcome card e menu inferior */}
      <div className="welcome-card">
        <h1>Bem-vindo à IBR Jardim Guarujá</h1>
        <p>Conectados em fé, servindo ao Senhor com amor.</p>
      </div>

      {/* ...menu inferior etc */}
    </div>
  );
}