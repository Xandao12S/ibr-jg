// src/pages/Informativos.jsx
import React, { useEffect, useState, useCallback } from 'react'

function safeParseList(raw) {
  try {
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch (e) {
    return []
  }
}

function ensureFields(item) {
  return {
    id: item.id ?? Date.now(),
    titulo: item.titulo ?? 'Sem título',
    conteudo: item.conteudo ?? '',
    imagemDataUrl: item.imagemDataUrl ?? null,
    pinned: !!item.pinned,
    createdAt: item.createdAt ?? new Date().toISOString(),
  }
}

function loadInformativosFromStorage() {
  const raw = localStorage.getItem('informativos_ibr')
  const list = safeParseList(raw).map(i => ensureFields(i))
  // Ordena: os fixados aparecem no topo da lista
  list.sort((a, b) => {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
  return list
}

function formatDate(dtStr) {
  try {
    const d = new Date(dtStr)
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch { return '' }
}

export default function Informativos() {
  const [items, setItems] = useState([])
  const [opened, setOpened] = useState(null) // item aberto no modal

  const reload = useCallback(() => {
    setItems(loadInformativosFromStorage())
  }, [])

  useEffect(() => {
    reload()
    function onStorage(e) {
      if (!e.key || e.key === 'informativos_ibr') reload()
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [reload])

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') setOpened(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div style={{ background: '#fafafa', minHeight: '100vh', padding: '28px 16px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        
        <h2 style={{ margin: '0 0 20px', fontSize: 22, fontWeight: '700', color: '#1a1a1a' }}>
          Informativos
        </h2>

        {items.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', background: '#fff', borderRadius: 12, color: '#9ca3af', border: '1px solid #eee' }}>
            Nenhum informativo publicado no momento.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {items.map(item => (
              <article 
                key={item.id} 
                onClick={() => setOpened(item)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') setOpened(item) }}
                style={{ 
                  display: 'flex', 
                  gap: 16, 
                  padding: 16, 
                  background: '#fff', 
                  borderRadius: 12, 
                  border: item.pinned ? '2px solid #fde68a' : '1px solid #efefef',
                  boxShadow: item.pinned ? '0 4px 15px rgba(0,0,0,0.05)' : '0 2px 4px rgba(0,0,0,0.02)',
                  position: 'relative',
                  cursor: 'pointer'
                }}
              >
                {/* Imagem com proporção controlada */}
                <div style={{ 
                  width: 140, 
                  height: 100, 
                  borderRadius: 8, 
                  overflow: 'hidden', 
                  background: '#f3f3f3', 
                  flexShrink: 0 
                }}>
                  {item.imagemDataUrl ? (
                    <img src={item.imagemDataUrl} alt={item.titulo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc', fontSize: 12 }}>
                      sem foto
                    </div>
                  )}
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h3 style={{ margin: '0 0 6px', fontSize: 18, color: '#111', fontWeight: '700' }}>
                        {item.titulo}
                      </h3>
                      {item.pinned && (
                        <span style={{ 
                          background: '#fde68a', 
                          color: '#92400e', 
                          fontSize: 10, 
                          fontWeight: '800', 
                          padding: '2px 8px', 
                          borderRadius: 6,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          Fixado
                        </span>
                      )}
                    </div>
                    {item.conteudo && (
                      <p style={{ 
                        margin: 0, 
                        color: '#4b5563', 
                        fontSize: 14, 
                        lineHeight: '1.5',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {item.conteudo}
                      </p>
                    )}
                  </div>
                  
                  <div style={{ marginTop: 8, color: '#9ca3af', fontSize: 12, fontWeight: '500' }}>
                    {formatDate(item.createdAt)}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Modal full-screen */}
      {opened && (
        <div 
          onClick={() => setOpened(null)} 
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: 20
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            role="dialog"
            aria-modal="true"
            style={{
              width: 'min(1100px, 96%)',
              maxHeight: '90vh',
              overflow: 'auto',
              background: '#fff',
              borderRadius: 12,
              padding: 20,
              boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
              position: 'relative'
            }}
          >
            <button 
              onClick={() => setOpened(null)}
              aria-label="Fechar"
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                background: '#fff',
                border: '1px solid #e5e7eb',
                padding: '6px 10px',
                borderRadius: 8,
                cursor: 'pointer'
              }}
            >
              Fechar
            </button>

            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexDirection: 'column' }}>
              {opened.imagemDataUrl && (
                <div style={{ width: '100%', borderRadius: 8, overflow: 'hidden', background: '#f3f3f3' }}>
                  <img src={opened.imagemDataUrl} alt={opened.titulo} style={{ width: '100%', height: 'auto', display: 'block' }} />
                </div>
              )}
              <div>
                <h2 style={{ margin: '8px 0 12px', fontSize: 24 }}>{opened.titulo}</h2>
                <div style={{ color: '#9ca3af', marginBottom: 12 }}>{formatDate(opened.createdAt)}</div>
                {opened.conteudo && <div style={{ color: '#374151', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{opened.conteudo}</div>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}