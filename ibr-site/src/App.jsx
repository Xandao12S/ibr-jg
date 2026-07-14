// src/App.jsx
import React from 'react'
import { Link, Navigate, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Restricoes from './pages/Restricoes.jsx' // antes: Escalas.jsx
import Login from './pages/Login.jsx'
import Admin from './pages/Admin.jsx'
import EscalaDoMes from './pages/EscalaDoMes.jsx'
import Tutoriais from './pages/Tutoriais.jsx'
import Informativos from './pages/Informativos.jsx'
import './index.css'

function getCurrentUser() {
  try {
    const raw = localStorage.getItem('current_user') || sessionStorage.getItem('current_user')
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function ProtectedRoute({ children, requireAdmin = false }) {
  const location = useLocation()
  const user = getCurrentUser()
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  if (requireAdmin && !user.is_admin) return <Navigate to="/" replace />
  return children
}

function Header() {
  const navigate = useNavigate()
  const user = getCurrentUser()

  function handleLogoClick() {
    if (user && user.is_admin) navigate('/admin')
    else navigate('/')
  }

  function logout() {
    localStorage.removeItem('current_user')
    sessionStorage.removeItem('current_user')
    try { window.dispatchEvent(new StorageEvent('storage', { key: 'current_user', newValue: null })) } catch {}
    navigate('/')
  }

  return (
    <>
      <header style={{ background: '#fff', borderBottom: '1px solid #eee', padding: '12px 18px', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div onClick={handleLogoClick} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', userSelect: 'none' }}>
            {/* Se preferir usar uma imagem local, substitua por import e use src={logo} */}
            <img src="https://www.instagram.com/ibrjdguaruja.jpg" alt="Logo IBR" style={{ height: 40, width: 'auto', borderRadius: 4 }} />
            <div>
              <div style={{ fontWeight: 700, color: '#7f1d1d' }}>IBR</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>Jardim Guarujá</div>
            </div>
          </div>

          {/* centraliza os botões */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, justifyContent: 'center' }}>
            <Link to="/" style={headerBtnStyle}>Início</Link>

            {/* link visível "Escalas" agora aponta para /restricoes */}
            <Link to="/restricoes" style={headerBtnStyle}>Escalas</Link>

            <Link to="/escala-do-mes" style={headerBtnStyle}>Escala do Mês</Link>
            <Link to="/informativos" style={headerBtnStyle}>Informativos</Link>
            <Link to="/tutoriais" style={headerBtnStyle}>Tutoriais</Link>
          </nav>

          <div style={{ marginLeft: 'auto' }}>
            {user ? (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{
                  textAlign: 'right', padding: '6px 12px', borderRadius: '8px',
                  border: user.is_leader ? '2px solid #ffd700' : 'none',
                  boxShadow: user.is_leader ? '0 0 10px rgba(255, 215, 0, 0.35)' : 'none',
                  background: user.is_leader ? 'linear-gradient(to right, #fff, #fffaf0)' : 'transparent'
                }}>
                  <div style={{ fontWeight: 700, color: user.is_leader ? '#b8860b' : 'inherit', fontSize: 14 }}>
                    {user.nome} {user.is_leader && '⭐'}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>
                    {Array.isArray(user.funcao) ? user.funcao.join(', ') : user.funcao}
                  </div>
                </div>
                <button onClick={logout} style={{ padding: '6px 10px', borderRadius: 8, fontSize: 13 }}>Sair</button>
              </div>
            ) : (
              <Link to="/login" style={{ fontWeight: 600, color: '#7f1d1d', textDecoration: 'none' }}>Entrar</Link>
            )}
          </div>
        </div>
      </header>
    </>
  )
}

function BottomTabs() {
  const user = getCurrentUser()
  if (!user) return null

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: '#fff', borderTop: '1px solid #e2e8f0',
      padding: '10px 0', zIndex: 100, boxShadow: '0 -2px 10px rgba(0,0,0,0.05)'
    }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 16px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <Link to="/" style={btnStyle}>
          <span style={{ fontSize: 20 }}>🏠</span>
          <span style={{ fontSize: 11, fontWeight: 700 }}>INÍCIO</span>
        </Link>
        <Link to="/escala-do-mes" style={btnStyle}>
          <span style={{ fontSize: 20 }}>📅</span>
          <span style={{ fontSize: 11, fontWeight: 700 }}>ESCALA</span>
        </Link>
        <Link to="/tutoriais" style={btnStyle}>
          <span style={{ fontSize: 20 }}>🎓</span>
          <span style={{ fontSize: 11, fontWeight: 700 }}>TUTORIAIS</span>
        </Link>
      </div>
    </div>
  )
}

const headerBtnStyle = {
  background: '#4b0f0f',
  color: '#fff',
  padding: '8px 12px',
  borderRadius: '8px',
  textDecoration: 'none',
  fontWeight: 700,
  fontSize: '13px'
}

const btnStyle = {
  background: '#0f172a',
  color: '#fff',
  textDecoration: 'none',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '10px',
  borderRadius: '12px',
  gap: 4
}

export default function App() {
  return (
    <div style={{ paddingBottom: 120 }}>
      <Header />
      <main style={{ maxWidth: 1100, margin: '20px auto', padding: '0 16px', paddingBottom: '140px' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />

          {/* rota atualizada para /restricoes */}
          <Route path="/restricoes" element={<ProtectedRoute><Restricoes /></ProtectedRoute>} />

          <Route path="/escala-do-mes" element={<ProtectedRoute><EscalaDoMes /></ProtectedRoute>} />
          <Route path="/tutoriais" element={<ProtectedRoute><Tutoriais /></ProtectedRoute>} />
          <Route path="/informativos" element={<ProtectedRoute><Informativos /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute requireAdmin={true}><Admin /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <BottomTabs />
    </div>
  )
}