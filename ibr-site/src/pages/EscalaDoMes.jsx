// src/pages/Escalas.jsx
import React, { useEffect, useState } from 'react'

export default function Escalas() {
  const [escalaMensal, setEscalaMensal] = useState(null)

  useEffect(() => {
    const carregarEscala = () => {
      const stored = localStorage.getItem('escala_mensal')
      if (stored) {
        setEscalaMensal(JSON.parse(stored))
      }
    }
    carregarEscala()
    window.addEventListener('storage', carregarEscala)
    return () => window.removeEventListener('storage', carregarEscala)
  }, [])

  const containerStyle = {
    padding: '40px 20px',
    maxWidth: '900px',
    margin: '0 auto',
    fontFamily: 'Inter, sans-serif'
  }

  const cardStyle = {
    background: '#fff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    border: '1px solid #eee'
  }

  const diaStyle = {
    marginBottom: '20px',
    padding: '15px',
    background: '#f9f9f9',
    borderRadius: '8px',
    borderLeft: '5px solid #6b1515'
  }

  const turnoTitle = {
    fontWeight: '800',
    color: '#6b1515',
    fontSize: '14px',
    textTransform: 'uppercase',
    marginBottom: '8px',
    marginTop: '10px'
  }

  const itemStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '5px 0',
    borderBottom: '1px solid #eee',
    fontSize: '14px'
  }

  return (
    <div style={containerStyle}>
      <h2 style={{ textAlign: 'center', marginBottom: '30px', fontSize: '28px', color: '#1a1a1a' }}>
        Escala do Mês
      </h2>

      <div style={cardStyle}>
        {!escalaMensal ? (
          <p style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
            A escala deste mês ainda não foi publicada pela administração.
          </p>
        ) : (
          <div>
            <h3 style={{ marginBottom: '20px', color: '#333', borderBottom: '2px solid #f0f0f0', paddingBottom: '10px' }}>
              {escalaMensal.monthLabel}
            </h3>

            {escalaMensal.data.map((dia, idx) => (
              <div key={idx} style={diaStyle}>
                <div style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '10px', color: '#111' }}>
                  {new Date(dia.data + 'T00:00:00').toLocaleDateString('pt-BR', { 
                    weekday: 'long', 
                    day: '2-digit', 
                    month: 'long' 
                  })}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  {['Manhã', 'Noite'].map(periodo => (
                    <div key={periodo}>
                      <div style={turnoTitle}>{periodo}</div>
                      {dia.turnos[periodo] && Object.entries(dia.turnos[periodo]).length > 0 ? (
                        Object.entries(dia.turnos[periodo]).map(([funcao, nome]) => (
                          <div key={funcao} style={itemStyle}>
                            <span style={{ color: '#555' }}>{funcao}</span>
                            <span style={{ fontWeight: '600' }}>{nome}</span>
                          </div>
                        ))
                      ) : (
                        <div style={{ color: '#999', fontSize: '12px' }}>Sem escala</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}