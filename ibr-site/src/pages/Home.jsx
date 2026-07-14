import React from 'react'
import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '60vh', textAlign: 'center', padding: 20
    }}>
      <div style={{
        background: '#fff', padding: 40, borderRadius: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        maxWidth: 800, width: '100%'
      }}>
        <h1 style={{ color: 'var(--primary)', fontSize: 36, margin: 0 }}>Bem-vindo à IBR Jardim Guarujá</h1>
        <p style={{ color: 'var(--muted)', marginTop: 12 }}>Conectados em fé, servindo ao Senhor com amor.</p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 24 }}>
          <Link to="/escalas" style={{
            background: 'var(--primary)', color: '#fff', padding: '14px 28px', borderRadius: 10,
            textDecoration: 'none', fontWeight: 800, fontSize: 16
          }}>
            Ver Escalas de Serviço
          </Link>

          <Link to="/informativos" style={{
            background: 'var(--primary)', color: '#fff', padding: '14px 28px', borderRadius: 10,
            textDecoration: 'none', fontWeight: 800, fontSize: 16
          }}>
            Informativos
          </Link>

          <Link to="/tutoriais" style={{
            background: 'var(--primary)', color: '#fff', padding: '14px 20px', borderRadius: 10,
            textDecoration: 'none', fontWeight: 800, fontSize: 16
          }}>
            Tutoriais
          </Link>
        </div>
      </div>
    </div>
  )
}