// src/pages/EscalaDoMes.jsx
import React, { useEffect, useState } from 'react'

export default function EscalaDoMes() {
  const [escala, setEscala] = useState(null)
  const [ultimaPublicacao, setUltimaPublicacao] = useState(null)

  function carregarEscala() {
    try {
      const raw = localStorage.getItem('escala_publicada')
      const rawAt = localStorage.getItem('escala_publicada_at')
      let parsed = null
      try { parsed = JSON.parse(raw) } catch {}
      let escalaArray = null
      let publishedAt = rawAt || null

      if (Array.isArray(parsed)) {
        escalaArray = parsed
      } else if (parsed && parsed.escala) {
        escalaArray = parsed.escala
        publishedAt = parsed.publishedAt || publishedAt
      } else if (parsed) {
        escalaArray = parsed
      }

      setEscala(escalaArray)
      setUltimaPublicacao(publishedAt)
    } catch (err) {
      console.error('Erro ao ler escala_publicada:', err)
      setEscala(null)
      setUltimaPublicacao(null)
    }
  }

  useEffect(() => {
    carregarEscala()

    function handleStorage(e) {
      if (e.key === 'escala_publicada' || e.key === 'escala_publicada_at') {
        carregarEscala()
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  function formatarData(iso) {
    try {
      return new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    } catch {
      return iso
    }
  }

  function formatarTimestamp(isoTs) {
    if (!isoTs) return '—'
    try {
      const d = new Date(isoTs)
      return d.toLocaleString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    } catch {
      return isoTs
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <div>
          <h2 style={{ margin: 0 }}>ESCALA DO MES — Escala Publicada</h2>
          <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
            Última publicação: {formatarTimestamp(ultimaPublicacao)}
          </div>
        </div>

        <div>
          <button onClick={carregarEscala} style={{ marginRight: 8 }}>Atualizar</button>
        </div>
      </div>

      {!escala && (
        <div style={{ color: '#6b7280' }}>
          Nenhuma escala publicada ainda.
        </div>
      )}

      {escala && (
        <div style={{ display: 'grid', gap: 12 }}>
          {escala.map(dia => (
            <article key={dia.data} style={{ padding: 12, background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb' }}>
              <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ fontSize: 16 }}>{formatarData(dia.data)}</strong>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>Domingo</div>
                </div>
              </header>

              <section style={{ marginTop: 12, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {Object.keys(dia.turnos || {}).length === 0 && (
                  <div style={{ color: '#9ca3af' }}>Nenhum turno disponível</div>
                )}

                {Object.entries(dia.turnos || {}).map(([periodo, funcoes]) => (
                  <div key={periodo} style={{ flex: 1, minWidth: 220 }}>
                    <div style={{ fontWeight: 700, color: '#7f1d1d', marginBottom: 8 }}>{periodo}</div>
                    <div style={{ display: 'grid', gap: 6 }}>
                      {Object.keys(funcoes).length === 0 && (
                        <div style={{ color: '#9ca3af' }}>Sem funções neste turno</div>
                      )}
                      {Object.entries(funcoes).map(([func, nome]) => (
                        <div key={func} style={{ display: 'flex', justifyContent: 'space-between', background: '#f8fafc', padding: '8px 10px', borderRadius: 6, border: '1px solid #eef2f7' }}>
                          <div style={{ fontWeight: 600 }}>{func}</div>
                          <div style={{ color: nome === 'Vago' ? '#b91c1c' : '#111' }}>{nome}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </section>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}