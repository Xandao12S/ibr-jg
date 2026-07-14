// src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import '../components/Login.css';

export default function Login() {
  const [nome, setNome] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Substitua pelo ID do YouTube que você quer usar (parte após v=)
  const videoId = '7XqWVfI-UM8';

  async function handleLogin(e) {
    e.preventDefault();
    const trimmed = String(nome || '').trim();
    if (!trimmed) {
      alert('Digite seu nome.');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .ilike('nome', trimmed)
        .limit(1);

      if (error) {
        console.error(error);
        alert('Erro ao consultar banco.');
        setLoading(false);
        return;
      }
      if (!data || data.length === 0) {
        alert('Nome não encontrado.');
        setLoading(false);
        return;
      }

      localStorage.setItem('current_user', JSON.stringify(data[0]));
      navigate('/');
    } catch (err) {
      console.error(err);
      alert('Erro ao processar login.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-root">
      {/* Vídeo de fundo (YouTube) */}
      <div className="video-background" aria-hidden="true">
        <iframe
          title="background-video"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}&modestbranding=1&rel=0&iv_load_policy=3&disablekb=1`}
          frameBorder="0"
          allow="autoplay; fullscreen; picture-in-picture"
        />
      </div>

      {/* Cartão de login */}
      <main className="login-wrapper">
        <div className="login-card" role="main" aria-label="Tela de login">
          <img src="/ibr.jpg" alt="IBR Logo" className="login-logo" />

          <h2 className="verse-title">Versículo do Dia</h2>
          <p className="verse-text">
            Lâmpada para os meus pés é a tua palavra e luz para o meu caminho.
            <span className="verse-ref">Salmos 119:105</span>
          </p>

          <form onSubmit={handleLogin} className="login-form">
            <label className="sr-only" htmlFor="nome">Nome</label>
            <input
              id="nome"
              type="text"
              className="login-input"
              placeholder="Digite seu nome completo"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              aria-label="Nome"
              autoComplete="name"
            />

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? 'Consultando...' : 'ENTRAR'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}