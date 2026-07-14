import React from 'react'
import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="card" style={{ textAlign: 'center', padding: '50px 20px' }}>
      <h1 style={{ color: 'var(--brand)', fontSize: '2.5rem' }}>Bem-vindo à IBR Jardim Guarujá</h1>
      <p style={{ fontSize: '1.2rem', marginBottom: '30px' }}>
        Conectados em fé, servindo ao Senhor com amor.
      </p>
      <Link to="/escalas" className="btn-vinho">Ver Escalas de Serviço</Link>
    </div>
  )
}