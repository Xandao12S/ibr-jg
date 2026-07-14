// src/App.jsx
import React from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom'

// PÁGINAS (confirme que os arquivos existem em src/pages/)
import Home from './pages/Home'
import Escalas from './pages/Escalas'
import EscalaDoMes from './pages/EscalaDoMes'
import Admin from './pages/Admin'

// Bottom navigation (coloque o arquivo em src/components/BottomNav.jsx)
import BottomNav from './components/BottomNav'

// Se você tem um CSS global (Tailwind ou index.css), importe aqui:
// import './index.css'

/* ---------------------------
   Header (logo clicável -> /admin)
   --------------------------- */
function Header() {
  const navigate = useNavigate()

  // URL pública da logo (substitua se quiser outra)
  const logoUrl =
    'https://yt3.googleusercontent.com/ytc/AIdro_lT-bUYeCrQuU__DE2-9o79gZMI_ZPl1s1zd5TIh89rKQ=s160-c-k-c0x00ffffff-no-rj'

  return (
    <header style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '12px 18px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* Logo clicável que leva ao Admin */}
        <div
          onClick={() => navigate('/admin')}
          style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', userSelect: 'none' }}
          title="Acesso ao Painel ADM"
        >
          <img
            src={logoUrl}
            alt="Logo IBR"
            style={{ height: 40, width: 'auto', borderRadius: 4 }}
            onError={(e) => {
              e.target.style.display = 'none'
            }}
          />
          <div>
            <div style={{ fontWeight: 700, color: '#7f1d1d' }}>IBR</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>Jardim Guarujá</div>
          </div>
        </div>

        <nav>
          <Link to="/" style={{ marginRight: 14, textDecoration: 'none', color: '#374151', fontWeight: 600 }}>
            Início
          </Link>
          <Link to="/escalas" style={{ marginRight: 14, textDecoration: 'none', color: '#374151', fontWeight: 600 }}>
            Escalas
          </Link>
          <Link to="/escala-do-mes" style={{ textDecoration: 'none', color: '#374151', fontWeight: 600 }}>
            ESCALA DO MES
          </Link>
        </nav>
      </div>
    </header>
  )
}

/* ---------------------------
   App principal com rotas + BottomNav
   --------------------------- */
export default function App() {
  return (
    <Router>
      <div style={{ minHeight: '100vh', background: '#fafafa', paddingBottom: 84 }}>
        <Header />
        <MainRoutes />
        <BottomNav />
      </div>
    </Router>
  )
}

/* Mantemos as rotas em componente separado para organização */
function MainRoutes() {
  return (
    <main style={{ maxWidth: 1100, margin: '20px auto', padding: '0 18px' }}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/escalas" element={<Escalas />} />
        <Route path="/escala-do-mes" element={<EscalaDoMes />} />
        <Route path="/admin" element={<Admin />} />
        {/* rota para tutoriais — crie src/pages/Tutoriais.jsx se quiser usar */}
        <Route
          path="/tutoriais"
          element={
            <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>
              <h2>Página de Tutoriais</h2>
              <p>Ainda não criada — adicione o arquivo <code>src/pages/Tutoriais.jsx</code> ou edite esta rota.</p>
            </div>
          }
        />

        {/* fallback simples */}
        <Route
          path="*"
          element={
            <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>
              <h2>Página não encontrada</h2>
              <p>
                <Link to="/" style={{ color: '#7f1d1d' }}>
                  Voltar ao início
                </Link>
              </p>
            </div>
          }
        />
      </Routes>
    </main>
  )
}