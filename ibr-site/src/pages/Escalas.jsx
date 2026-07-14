// src/pages/Escalas.jsx
import React, { useState, useEffect, useRef } from 'react'

const initialEscalas = [
  { nome: 'João e Maria', funcao: ['OBS'] },
  { nome: 'Pedro e Ana', funcao: ['Holyrics', 'Foto'] },
]

export default function Escalas() {
  const [escalas, setEscalas] = useState(() => {
    try {
      const raw = localStorage.getItem('escalas_ibr')
      return raw ? JSON.parse(raw) : initialEscalas
    } catch {
      return initialEscalas
    }
  })

  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ nome: '', funcao: [] })
  const [funcoesOpen, setFuncoesOpen] = useState(false)
  const funcoesRef = useRef(null)

  // Agora armazenamos uma LISTA de restrições
  const [restricoes, setRestricoes] = useState(() => {
    try {
      const raw = localStorage.getItem('restricoes_ibr_list')
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })
  const [restrOpen, setRestrOpen] = useState(false)
  const [restrForm, setRestrForm] = useState({ responsavel: '', data: '', periodo: [] })
  const restrRef = useRef(null)

  useEffect(() => {
    try { localStorage.setItem('escalas_ibr', JSON.stringify(escalas)) } catch {}
  }, [escalas])

  useEffect(() => {
    try { localStorage.setItem('restricoes_ibr_list', JSON.stringify(restricoes)) } catch {}
  }, [restricoes])

  // Fecha menus ao clicar fora
  useEffect(() => {
    function handleClick(e) {
      if (funcoesRef.current && !funcoesRef.current.contains(e.target)) setFuncoesOpen(false)
      if (restrRef.current && !restrRef.current.contains(e.target)) {
        // não fecha automaticamente o modal (fechamos pelo botão)
      }
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  function openModal() {
    setForm({ nome: '', funcao: [] })
    setShowModal(true)
    setFuncoesOpen(false)
  }

  function toggleFuncao(value) {
    setForm(prev => {
      const has = prev.funcao.includes(value)
      return { ...prev, funcao: has ? prev.funcao.filter(f => f !== value) : [...prev.funcao, value] }
    })
  }

  function handleAddSubmit(e) {
    e.preventDefault()
    if (!form.nome.trim()) { alert('Por favor, preencha o nome.'); return }
    if (form.funcao.length === 0) { alert('Selecione ao menos uma função.'); return }
    setEscalas(prev => [form, ...prev])
    setShowModal(false)
  }

  function handleRemove(index) {
    if (!confirm('Remover este registro?')) return
    setEscalas(prev => prev.filter((_, i) => i !== index))
  }

  const funcoesDisponiveis = ['OBS', 'Holyrics', 'Som', 'Foto', 'Redes Sociais']
  const periodosDisponiveis = ['Manhã', 'Noite']

  // Restrições: alterna períodos no formulário
  function togglePeriodoForm(p) {
    setRestrForm(prev => {
      const has = prev.periodo.includes(p)
      return { ...prev, periodo: has ? prev.periodo.filter(x => x !== p) : [...prev.periodo, p] }
    })
  }

  // Salvar nova restrição: acrescenta à lista
  function salvarRestricao() {
    if (!restrForm.responsavel.trim()) {
      alert('Por favor, informe o responsável.')
      return
    }
    if (!restrForm.data) {
      alert('Por favor, escolha uma data.')
      return
    }
    if (restrForm.periodo.length === 0) {
      alert('Por favor, selecione pelo menos um período.')
      return
    }

    // cria item com timestamp único
    const item = {
      id: Date.now(),
      responsavel: restrForm.responsavel.trim(),
      data: restrForm.data,
      periodo: [...restrForm.periodo],
      criadoEm: new Date().toISOString()
    }

    setRestricoes(prev => [item, ...prev])
    // limpa o formulário e fecha modal (ajuste conforme preferir)
    setRestrForm({ responsavel: '', data: '', periodo: [] })
    setRestrOpen(false)
    alert('Restrição salva.')
  }

  function limparRestricoesLocais() {
    if (!confirm('Apagar todas as restrições locais?')) return
    setRestricoes([])
  }

  function removerRestricao(id) {
    if (!confirm('Remover esta restrição?')) return
    setRestricoes(prev => prev.filter(r => r.id !== id))
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ color: 'var(--brand)' }}>Nomes e Funções</h2>
        <button onClick={openModal} className="btn-vinho">Adicionar</button>
      </div>

      <div className="card">
        <table className="table" aria-label="Tabela de registros">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Funções</th>
              <th style={{ width: '80px' }}></th>
            </tr>
          </thead>
          <tbody>
            {escalas.length === 0 && (
              <tr>
                <td colSpan={3} style={{ textAlign: 'center', padding: 20, color: '#6b7280' }}>
                  Nenhum registro encontrado.
                </td>
              </tr>
            )}

            {escalas.map((item, index) => (
              <tr key={index}>
                <td style={{ fontWeight: 'bold', padding: 10 }}>{item.nome}</td>
                <td style={{ padding: 10 }}>{item.funcao.join(', ')}</td>
                <td style={{ textAlign: 'right', padding: 10 }}>
                  <button
                    onClick={() => handleRemove(index)}
                    style={{ background: 'transparent', border: 'none', color: '#db2777', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Remover
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* mostra resumo das restrições salvas (lista) */}
      <div style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Restrições salvas</h3>
          <div>
            <button onClick={() => setRestrOpen(true)} style={{ marginRight: 8 }}>Nova restrição</button>
            <button onClick={limparRestricoesLocais} style={{ color: '#b91c1c' }}>Limpar todas</button>
          </div>
        </div>

        {restricoes.length === 0 ? (
          <div style={{ color: '#6b7280', paddingTop: 8 }}>Nenhuma restrição cadastrada.</div>
        ) : (
          <ul style={{ marginTop: 8, paddingLeft: 0, listStyle: 'none' }}>
            {restricoes.map(r => (
              <li key={r.id} style={{ border: '1px solid #eee', padding: 10, borderRadius: 8, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{r.responsavel}</div>
                  <div style={{ color: '#374151' }}>Data: {r.data} — Períodos: {r.periodo.join(', ')}</div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>salvo em: {new Date(r.criadoEm).toLocaleString()}</div>
                </div>
                <div>
                  <button onClick={() => removerRestricao(r.id)} style={{ color: '#b91c1c' }}>Remover</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Modal de Adicionar registro */}
      {showModal && (
        <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ width: 450, maxWidth: '95%', background: 'white', borderRadius: 12, padding: 20 }}>
            <h3 style={{ marginTop: 0, color: 'var(--brand)' }}>Novo Registro</h3>

            <form onSubmit={handleAddSubmit} style={{ display: 'grid', gap: 12 }}>
              <label style={{ display: 'block' }}>
                <strong>Nome</strong>
                <input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} style={{ padding: 8, width: '100%', marginTop: 6, borderRadius: 6, border: '1px solid #ddd' }} autoFocus />
              </label>

              <div style={{ position: 'relative' }} ref={funcoesRef}>
                <strong>Funções</strong>
                <button type="button" onClick={() => setFuncoesOpen(open => !open)} style={{ width: '100%', textAlign: 'left', padding: '8px 10px', borderRadius: 8, border: '1px solid #ddd', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                  <div style={{ color: form.funcao.length ? '#111' : '#6b7280' }}>{form.funcao.length ? form.funcao.join(', ') : 'Selecione as funções...'}</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>{funcoesOpen ? '▴' : '▾'}</div>
                </button>

                {funcoesOpen && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, background: '#fff', border: '1px solid #e6e6e6', borderRadius: 8, padding: 10, boxShadow: '0 6px 20px rgba(0,0,0,0.08)', zIndex: 60 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 6 }}>
                      {funcoesDisponiveis.map(f => (
                        <label key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 6, cursor: 'pointer', background: form.funcao.includes(f) ? '#fff8f8' : 'transparent', border: form.funcao.includes(f) ? '1px solid var(--brand)' : '1px solid transparent' }}>
                          <input type="checkbox" checked={form.funcao.includes(f)} onChange={() => toggleFuncao(f)} />
                          <span>{f}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
                <button type="button" onClick={() => setShowModal(false)} className="button-outline" style={{ padding: '8px 14px' }}>Cancelar</button>
                <button type="submit" className="btn-vinho" style={{ padding: '8px 14px' }}>Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Restrições (abre ao clicar no botão de baixo) */}
      {restrOpen && (
        <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
          <div ref={restrRef} style={{ width: 420, maxWidth: '95%', background: '#fff', borderRadius: 12, padding: 18 }}>
            <h3 style={{ marginTop: 0, color: 'var(--brand)' }}>Nova Restrição</h3>

            <div style={{ display: 'grid', gap: 12 }}>
              <label style={{ display: 'block' }}>
                <strong>Responsável</strong>
                <input type="text" value={restrForm.responsavel} onChange={e => setRestrForm(prev => ({ ...prev, responsavel: e.target.value }))} placeholder="Seu nome" style={{ display: 'block', marginTop: 6, padding: 8, width: '100%', borderRadius: 6, border: '1px solid #ddd' }} />
              </label>

              <label style={{ display: 'block' }}>
                <strong>Data</strong>
                <input type="date" value={restrForm.data} onChange={e => setRestrForm(prev => ({ ...prev, data: e.target.value }))} style={{ display: 'block', marginTop: 6, padding: 8, width: '100%', borderRadius: 6, border: '1px solid #ddd' }} />
              </label>

              <div>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>Período</div>
                <div style={{ display: 'flex', gap: 12 }}>
                  {periodosDisponiveis.map(p => (
                    <label key={p} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <input type="checkbox" checked={restrForm.periodo.includes(p)} onChange={() => togglePeriodoForm(p)} />
                      <span>{p}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
                <button type="button" onClick={() => { setRestrForm({ responsavel: '', data: '', periodo: [] }); setRestrOpen(false) }} className="button-outline" style={{ padding: '8px 14px' }}>Cancelar</button>
                <button type="button" onClick={salvarRestricao} className="btn-vinho" style={{ padding: '8px 14px' }}>Salvar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}