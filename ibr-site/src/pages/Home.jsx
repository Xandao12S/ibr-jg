// src/pages/Home.jsx
import React, { useEffect, useState, useRef } from 'react';
import '../components/Home.css'; 

function loadAlbum() {
  try {
    const raw = JSON.parse(localStorage.getItem('album_ibr') || '[]');
    if (!Array.isArray(raw)) return [];
    return raw.map(item => ({ id: item.id, dataUrl: item.dataUrl }));
  } catch (e) {
    console.error('Erro ao carregar album', e);
    return [];
  }
}

export default function Home() {
  const [album, setAlbum] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeLayer, setActiveLayer] = useState(0); 
  const layerRefs = useRef([null, null]);
  const intervalRef = useRef(null);

  const versiculo = {
    texto: 'Lâmpada para os meus pés é a tua palavra e luz para o meu caminho.',
    referencia: 'Salmos 119:105'
  };

  useEffect(() => {
    setAlbum(loadAlbum());
    function onStorage(e) {
      if (e.key === 'album_ibr' || e.key === 'album_ibr_sync') {
        setAlbum(loadAlbum());
      }
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    if (!album || album.length === 0) return;

    if (layerRefs.current[0]) {
      layerRefs.current[0].style.backgroundImage = `url("${album[0].dataUrl}")`;
      layerRefs.current[0].style.opacity = '1';
    }

    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setCurrentIndex(prev => {
        const nextIndex = (prev + 1) % album.length;
        const nextLayer = 1 - activeLayer;
        if (layerRefs.current[nextLayer]) {
          layerRefs.current[nextLayer].style.backgroundImage = `url("${album[nextIndex].dataUrl}")`;
          layerRefs.current[nextLayer].style.opacity = '0';
          void layerRefs.current[nextLayer].offsetHeight;
          layerRefs.current[nextLayer].style.opacity = '1';
        }
        setActiveLayer(nextLayer);
        return nextIndex;
      });
    }, 5000); 

    return () => clearInterval(intervalRef.current);
  }, [album, activeLayer]);

  // Estilo comum para as letras ficarem visíveis (Branco com Sombra)
  const textHighlightStyle = {
    color: '#ffffff',
    textShadow: '2px 2px 8px rgba(0,0,0,0.8)', // Sombra forte para legibilidade
    fontWeight: '600'
  };

  return (
    <div className="home-page" style={{ position: 'relative', overflow: 'hidden', minHeight: '100vh' }}>
      
      {/* Camadas de Fundo (Imagens) */}
      {album.length > 0 && (
        <>
          <div
            ref={el => (layerRefs.current[0] = el)}
            style={{
              position: 'absolute', inset: 0, backgroundPosition: 'center', backgroundSize: 'cover',
              transition: 'opacity 1.5s ease-in-out', opacity: 0, zIndex: 0, filter: 'brightness(0.4)'
            }}
          />
          <div
            ref={el => (layerRefs.current[1] = el)}
            style={{
              position: 'absolute', inset: 0, backgroundPosition: 'center', backgroundSize: 'cover',
              transition: 'opacity 1.5s ease-in-out', opacity: 0, zIndex: 0, filter: 'brightness(0.4)'
            }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 1 }} />
        </>
      )}

      {/* Conteúdo Principal */}
      <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', paddingTop: '10vh' }}>
        
        {/* Versículo */}
        <section className="verse-section">
          <div className="verse-card" style={{ background: 'transparent' }}>
            <p className="verse-text" style={{ ...textHighlightStyle, fontSize: '1.5rem', fontStyle: 'italic' }}>
              “{versiculo.texto}”
            </p>
            <p className="verse-ref" style={{ ...textHighlightStyle, color: '#fca311', fontSize: '1.2rem' }}>
              {versiculo.referencia}
            </p>
          </div>
        </section>

        {/* Boas Vindas */}
        <div className="welcome-card" style={{ marginTop: '50px' }}>
          <h1 style={{ ...textHighlightStyle, fontSize: '3rem', marginBottom: '10px' }}>
            Bem-vindo à IBR Jardim Guarujá
          </h1>
          <p style={{ ...textHighlightStyle, fontSize: '1.3rem', color: '#e5e5e5' }}>
            Conectados em fé, servindo ao Senhor com amor.
          </p>
        </div>

      </div>
    </div>
  );
}