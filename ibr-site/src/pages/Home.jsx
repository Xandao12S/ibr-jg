// src/pages/Home.jsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient'; 
import '../components/Home.css'; 

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

  const fetchSupabaseAlbum = useCallback(async () => {
    try {
      const { data, error: listError } = await supabase.storage
        .from('album_ibr')
        .list('', { limit: 10, sortBy: { column: 'created_at', order: 'desc' } });

      if (listError) throw listError;
      if (!data || data.length === 0) return;

      const photos = data.map(file => {
        const { data: pub } = supabase.storage
          .from('album_ibr')
          .getPublicUrl(file.name);
        return { id: file.id, dataUrl: pub.publicUrl };
      });

      setAlbum(photos);
    } catch (e) {
      console.error('Erro ao buscar fotos do Supabase:', e);
    }
  }, []);

  useEffect(() => {
    fetchSupabaseAlbum();
  }, [fetchSupabaseAlbum]);

  useEffect(() => {
    if (!album || album.length === 0) return;

    if (layerRefs.current[0]) {
      layerRefs.current[0].style.backgroundImage = `url("${album[0].dataUrl}")`;
      layerRefs.current[0].style.backgroundPosition = 'top center';
      layerRefs.current[0].style.backgroundSize = 'cover';
      layerRefs.current[0].style.opacity = '1';
    }

    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setCurrentIndex(prev => {
        const nextIndex = (prev + 1) % album.length;
        const nextLayer = 1 - activeLayer;
        
        if (layerRefs.current[nextLayer]) {
          layerRefs.current[nextLayer].style.backgroundImage = `url("${album[nextIndex].dataUrl}")`;
          layerRefs.current[nextLayer].style.backgroundPosition = 'top center';
          layerRefs.current[nextLayer].style.backgroundSize = 'cover';
          
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

  const textHighlightStyle = {
    color: '#ffffff',
    textShadow: '2px 2px 8px rgba(0,0,0,0.8)',
    fontWeight: '600'
  };

  return (
    <div className="home-page" style={{ position: 'relative', overflow: 'hidden', minHeight: '100vh' }}>
      
      {/* Camadas de Fundo */}
      {album.length > 0 && (
        <>
          <div
            ref={el => (layerRefs.current[0] = el)}
            style={{
              position: 'absolute', inset: 0, 
              transition: 'opacity 1.5s ease-in-out', opacity: 0, zIndex: 0, filter: 'brightness(0.4)'
            }}
          />
          <div
            ref={el => (layerRefs.current[1] = el)}
            style={{
              position: 'absolute', inset: 0, 
              transition: 'opacity 1.5s ease-in-out', opacity: 0, zIndex: 0, filter: 'brightness(0.4)'
            }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 1 }} />
        </>
      )}

      {/* Conteúdo Principal */}
      <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', paddingTop: '10vh', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        
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
        <div className="welcome-card" style={{ marginTop: '50px', flex: 1 }}>
          <h1 style={{ ...textHighlightStyle, fontSize: '3rem', marginBottom: '10px' }}>
            Bem-vindo à IBR Jardim Guarujá
          </h1>
          <p style={{ ...textHighlightStyle, fontSize: '1.3rem', color: '#e5e5e5' }}>
            Conectados em fé, servindo ao Senhor com amor.
          </p>

          {/* Seção Próximos Eventos - Ajustada para ser Transparente */}
          <section className="content" style={{ background: 'transparent', marginTop: '40px' }}>
            <div className="container">
              <h2 style={{ ...textHighlightStyle, fontSize: '1.8rem', marginBottom: '20px' }}>Horários de Culto</h2>
              <div className="cards" style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <div className="card" style={{ background: 'rgba(255,255,255,0.15)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)', color: 'white', backdropFilter: 'blur(4px)', minWidth: '200px' }}>
                  <strong style={{fontSize: '1.2rem'}}>Quarta-Feira</strong>
                  <p style={{marginTop: '10px', opacity: 0.9}}>20:00 - Culto de Oração</p>
                </div>
                <div className="card" style={{ background: 'rgba(255,255,255,0.15)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)', color: 'white', backdropFilter: 'blur(4px)', minWidth: '200px' }}>
                  <strong style={{fontSize: '1.2rem'}}>Domingo</strong>
                  <p style={{marginTop: '10px', opacity: 0.9}}>09:00 - Escola Bíblica Dominical</p>
                  <p style={{marginTop: '10px', opacity: 0.9}}>18:00 - Culto de Celebração</p>
                </div>
              </div>
            </div>
          </section>
          {/* Seção Próximos Eventos - Ajustada para ser Transparente */}
          <section className="content" style={{ background: 'transparent', marginTop: '40px' }}>
            <div className="container">
              <h2 style={{ ...textHighlightStyle, fontSize: '1.8rem', marginBottom: '20px' }}>Reuniões / Ensaios</h2>
              <div className="cards" style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <div className="card" style={{ background: 'rgba(255,255,255,0.15)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)', color: 'white', backdropFilter: 'blur(4px)', minWidth: '200px' }}>
                  <strong style={{fontSize: '1.2rem'}}>Sábados</strong>
                  <p style={{marginTop: '10px', opacity: 0.9}}>09:00 - Ensaios</p>
                </div>
              </div>
            </div>
          </section>
        </div>

      </div>
    </div>
  );
}