// src/pages/Admin.jsx
import React, { useEffect, useState, useCallback, useRef } from 'react'

// --- helpers de normalização ---
function normalizeText(s) {
  if (!s) return ''
  return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/gi, '').trim().toLowerCase()
}

function namesMatch(memberName, responsavel) {
  const a = normalizeText(memberName); const b = normalizeText(responsavel)
  return a === b || a.includes(b) || b.includes(a)
}

function normalizeDateStr(s) {
  if (!s) return ''
  const d = new Date(s)
  if (!isNaN(d.getTime())) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }
  return String(s)
}

function normalizePeriod(p) {
  const n = normalizeText(p)
  if (n.includes('manha')) return 'Manhã'
  if (n.includes('noite')) return 'Noite'
  return p
}

function monthLabelFromDateStr(dStr) {
  try {
    const d = new Date(dStr + 'T00:00:00')
    return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  } catch { return '' }
}

export default function Admin() {
  const [authorized, setAuthorized] = useState(false)
  const [checked, setChecked] = useState(false)
  const [restricoes, setRestricoes] = useState([])
  const [membros, setMembros] = useState([])
  const [sugestaoEditada, setSugestaoEditada] = useState(null)
  const [viewMode, setViewMode] = useState('full') 
  const [showMembrosPanel, setShowMembrosPanel] = useState(false)
  const [escalaMensal, setEscalaMensal] = useState(null)

  // edição de membro (novo)
  const [editingMember, setEditingMember] = useState(null)

  // Membros form
  const [membroNome, setMembroNome] = useState('')
  const [funcoesSelecionadas, setFuncoesSelecionadas] = useState([])
  const [isOpenFuncoes, setIsOpenFuncoes] = useState(false)
  const dropdownRef = useRef(null)

  const funcoesOpcoes = ['Líder', 'Som', 'OBS', 'Holyrics', 'Foto', 'Redes Sociais']
  const periodos = ['Manhã', 'Noite']

  const loadData = useCallback(() => {
    try {
      setRestricoes(JSON.parse(localStorage.getItem('restricoes_ibr_list') || '[]'))
      setMembros(JSON.parse(localStorage.getItem('membros_ibr') || '[]'))

      const storedMensal = localStorage.getItem('escala_mensal')
      if (storedMensal) {
        setEscalaMensal(JSON.parse(storedMensal))
      } else {
        const oldPub = localStorage.getItem('escala_publicada')
        if (oldPub) {
          try {
            const parsed = JSON.parse(oldPub)
            if (Array.isArray(parsed) && parsed.length > 0) {
              const label = monthLabelFromDateStr(parsed[0].data)
              const obj = { monthLabel: label, data: parsed, createdAt: new Date().toISOString() }
              localStorage.setItem('escala_mensal', JSON.stringify(obj))
              setEscalaMensal(obj)
            } else if (parsed && parsed.data) {
              const label = parsed.monthLabel || (parsed.data[0] ? monthLabelFromDateStr(parsed.data[0].data) : '')
              const obj = { monthLabel: label, data: parsed, createdAt: new Date().toISOString() }
              localStorage.setItem('escala_mensal', JSON.stringify(obj))
              setEscalaMensal(obj)
            }
          } catch (e) { /* nada */ }
        }
      }
    } catch { }
  }, [])

  useEffect(() => {
    const ok = sessionStorage.getItem('ibr_admin_ok')
    if (ok === '1') { setAuthorized(true); setChecked(true); return }
    const pass = window.prompt('Senha ou Nome de Líder/ADM:')
    const m = JSON.parse(localStorage.getItem('membros_ibr') || '[]')
    const isPower = m.find(x => x.nome.toLowerCase() === pass?.toLowerCase() && (Array.isArray(x.funcao) ? x.funcao.includes('Líder') || x.funcao.includes('ADM') : (x.funcao === 'Líder' || x.funcao === 'ADM')))
    // OBS: mantenha sua lógica de senha / ADMIN_PASSWORD conforme já tiver configurado
    if (pass === 'senha123' || isPower) {
      sessionStorage.setItem('ibr_admin_ok', '1'); setAuthorized(true)
    } else { alert('Acesso negado.') }
    setChecked(true)
  }, [])

  useEffect(() => {
    loadData()
    window.addEventListener('storage', loadData)
    return () => window.removeEventListener('storage', loadData)
  }, [loadData])

  // Fecha o dropdown se clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpenFuncoes(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const toggleFuncao = (f) => {
    setFuncoesSelecionadas(prev => prev.includes(f) ? prev.filter(i => i !== f) : [...prev, f])
  }

  const adicionarMembro = () => {
    const novaLista = [...membros, { id: Date.now(), nome: membroNome, funcao: funcoesSelecionadas }]
    localStorage.setItem('membros_ibr', JSON.stringify(novaLista))
    localStorage.setItem('membros_sync', String(Date.now()))
    setMembros(novaLista); setMembroNome(''); setFuncoesSelecionadas([]); setIsOpenFuncoes(false)
  }

  // Remover membro (corrigido e sincronizado)
  const removerMembro = (id) => {
    const nova = membros.filter(x => x.id !== id)
    localStorage.setItem('membros_ibr', JSON.stringify(nova))
    localStorage.setItem('membros_sync', String(Date.now()))
    setMembros(nova)
    window.dispatchEvent(new Event('storage'))
  }

  // Funções de edição de membro (novo)
  const startEditMember = (m) => {
    // clona e garante que funcao seja array
    setEditingMember({ id: m.id, nome: m.nome, funcao: Array.isArray(m.funcao) ? [...m.funcao] : (m.funcao ? [m.funcao] : []) })
  }

  const toggleEditMemberFunc = (f) => {
    setEditingMember(prev => {
      if (!prev) return prev
      const funcs = prev.funcao || []
      return {
        ...prev,
        funcao: funcs.includes(f) ? funcs.filter(x => x !== f) : [...funcs, f]
      }
    })
  }

  const saveEditedMember = () => {
    if (!editingMember) return
    const nova = membros.map(m => m.id === editingMember.id ? { ...m, nome: editingMember.nome, funcao: editingMember.funcao } : m)
    localStorage.setItem('membros_ibr', JSON.stringify(nova))
    localStorage.setItem('membros_sync', String(Date.now()))
    setMembros(nova)
    setEditingMember(null)
    window.dispatchEvent(new Event('storage'))
  }

  const cancelEditMember = () => setEditingMember(null)

  function gerarEscalaAutomatica() {
    const hoje = new Date()
    const domingos = []
    const d = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
    while (d.getMonth() === hoje.getMonth()) {
      if (d.getDay() === 0) domingos.push(d.toISOString().split('T')[0])
      d.setDate(d.getDate() + 1)
    }

    const funcoesEscala = ['Som', 'OBS', 'Holyrics', 'Foto', 'Redes Sociais']
    const escala = domingos.map(dataRaw => {
      const dataNorm = normalizeDateStr(dataRaw)
      const turnos = {}
      periodos.forEach(p => {
        const alocados = {}; const assignedKeys = new Set()
        funcoesEscala.forEach(f => {
          const candidatos = membros.filter(m => {
            const temF = Array.isArray(m.funcao) ? m.funcao.includes(f) : m.funcao === f
            if (!temF || assignedKeys.has(m.id)) return false
            const temR = restricoes.some(r => normalizeDateStr(r.data) === dataNorm && 
                (Array.isArray(r.periodo) ? r.periodo : [r.periodo]).some(rp => normalizePeriod(rp) === p) &&
                (r.memberId === m.id || namesMatch(m.nome, r.responsavel)))
            return !temR
          })
          const escolhido = candidatos.length ? candidatos[Math.floor(Math.random() * candidatos.length)] : null
          if (escolhido) { alocados[f] = escolhido.nome; assignedKeys.add(escolhido.id) }
          else { alocados[f] = 'Vago' }
        })
        turnos[p] = alocados
      })
      return { data: dataRaw, turnos }
    })
    setSugestaoEditada(escala)
  }

  function publicarEscala(e) {
    if (!Array.isArray(e) || e.length === 0) {
      return
    }
    const monthLabel = monthLabelFromDateStr(e[0].data) || (new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }))
    const obj = { monthLabel, data: e, createdAt: new Date().toISOString() }
    localStorage.setItem('escala_mensal', JSON.stringify(obj))
    localStorage.setItem('escala_publicada', JSON.stringify(e))
    setEscalaMensal(obj)
    setSugestaoEditada(null)
  }

  function removerEscalaMensal() {
    localStorage.removeItem('escala_mensal')
    localStorage.removeItem('escala_publicada')
    setEscalaMensal(null)
  }

  // ------------------ Edição da Sugestão de Escala (select por função) ------------------
  const [editingDay, setEditingDay] = useState(null)

  function startEditDay(day) {
    setEditingDay(JSON.parse(JSON.stringify(day)))
  }

  function updateEditingAssignment(periodo, funcao, novoValor) {
    setEditingDay(prev => {
      if (!prev) return prev
      const turnos = { ...prev.turnos }
      turnos[periodo] = { ...turnos[periodo], [funcao]: novoValor }
      return { ...prev, turnos }
    })
  }

  function removeFunctionFromEditing(periodo, funcao) {
    if (!confirm('Remover esta função desta escala?')) return
    setEditingDay(prev => {
      if (!prev) return prev
      const turnos = { ...prev.turnos }
      const novoPeriodo = { ...turnos[periodo] }
      delete novoPeriodo[funcao]
      turnos[periodo] = novoPeriodo
      return { ...prev, turnos }
    })
  }

  function saveEditingDay() {
    if (!editingDay) return
    setSugestaoEditada(prev => {
      if (!prev) return [editingDay]
      return prev.map(d => d.data === editingDay.data ? editingDay : d)
    })
    setEditingDay(null)
  }

  function cancelEditingDay() {
    setEditingDay(null)
  }
  // -----------------------------------------------------------------------

  // helpers para layout similar à imagem 1
  const containerStyle = {
    background: '#f7f6f5',
    minHeight: '100vh',
    padding: '40px 20px'
  }
  const cardStyle = {
    background: '#fff',
    borderRadius: 8,
    boxShadow: '0 6px 20px rgba(0,0,0,0.05)',
    border: '1px solid rgba(0,0,0,0.04)',
    padding: 18
  }
  const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }
  const topButtonsStyle = { display: 'flex', gap: 10 }
  const addBtnStyle = { background: '#6b1515', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 8, cursor: 'pointer' }
  const secondaryBtnStyle = { background: '#7b1d1d', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 8, cursor: 'pointer' }
  const listRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 8px', borderBottom: '1px solid #f0f0f0' }
  const nameCol = { display: 'flex', alignItems: 'center', gap: 12, minWidth: 220 }
  const nameText = { fontWeight: 700 }
  const funcsText = { color: '#4b5563' }
  const removeLink = { color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }

  // helper para gerar iniciais
  const initials = (nome) => {
    if (!nome) return ''
    return nome.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase()
  }

  // estilo das iniciais: amarelo apenas para líderes
  const initialsStyle = (isLeader) => ({
    width: 40,
    height: 40,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    background: isLeader ? '#ffecb5' : 'transparent',
    color: isLeader ? '#b8860b' : '#374151',
    fontWeight: 800,
    fontSize: 13,
    marginRight: 8
  })

  if (!checked) return null
  if (!authorized) return <div style={{ padding: 20 }}>Acesso negado.</div>

  return (
    <div style={containerStyle}>
      <div style={{ maxWidth: 980, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h1 style={{ margin: 0, fontSize: 22 }}>Painel ADM</h1>
          <div style={topButtonsStyle}>
            <button onClick={() => setViewMode(v => v === 'full' ? 'escala' : 'full')} style={secondaryBtnStyle}>
              {viewMode === 'full' ? 'Escala' : 'Painel ADM'}
            </button>
            {viewMode === 'full' && <button onClick={() => setShowMembrosPanel(!showMembrosPanel)} style={secondaryBtnStyle}>
              {showMembrosPanel ? 'Fechar Membros' : 'Membros'}
            </button>}
            {viewMode === 'escala' && <button onClick={gerarEscalaAutomatica} style={{ ...addBtnStyle, background: '#111' }}>Criar Escala</button>}
          </div>
        </div>

        <div style={cardStyle}>
          {viewMode === 'full' && showMembrosPanel && (
            <>
              <h3 style={{ marginTop: 0, marginBottom: 12 }}>Cadastrar Membro</h3>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 18 }}>
                <input placeholder="Nome" value={membroNome} onChange={e => setMembroNome(e.target.value)} style={{ padding: 10, flex: 1, borderRadius: 6, border: '1px solid #e6e6e6' }} />
                
                {/* Dropdown de Funções */}
                <div ref={dropdownRef} style={{ position: 'relative', width: 320 }}>
                  <div 
                    onClick={() => setIsOpenFuncoes(!isOpenFuncoes)}
                    style={{ padding: 10, borderRadius: 6, border: '1px solid #e6e6e6', background: '#fff', cursor: 'pointer', color: funcoesSelecionadas.length ? '#000' : '#9ca3af' }}
                  >
                    {funcoesSelecionadas.length ? funcoesSelecionadas.join(', ') : 'Selecione as funções...'}
                  </div>
                  
                  {isOpenFuncoes && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #e6e6e6', borderRadius: 6, zIndex: 10, padding: 10, boxShadow: '0 6px 18px rgba(0,0,0,0.06)', marginTop: 6 }}>
                      {funcoesOpcoes.map(f => (
                        <label key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 4px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={funcoesSelecionadas.includes(f)} onChange={() => toggleFuncao(f)} />
                          <span style={{ marginLeft: 6 }}>{f}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <button onClick={adicionarMembro} style={{ ...addBtnStyle, padding: '10px 18px' }}>Adicionar</button>
              </div>

              <div style={{ borderTop: '1px solid #f0f0f0', borderRadius: 6, overflow: 'hidden' }}>
                {membros.length === 0 ? <div style={{ padding: 16, color: '#9ca3af' }}>Nenhum membro cadastrado.</div> : membros.map(m => {
                  const isLeader = Array.isArray(m.funcao) ? m.funcao.includes('Líder') : m.funcao === 'Líder'
                  const isEditingThis = editingMember && editingMember.id === m.id
                  return (
                    <div key={m.id} style={listRow}>
                      <div style={nameCol}>
                        <div style={initialsStyle(isLeader)}>{initials(m.nome)}</div>
                        <div style={{ width: '100%' }}>
                          {!isEditingThis ? (
                            <>
                              <div style={nameText}>{m.nome}</div>
                              <div style={funcsText}>{Array.isArray(m.funcao) ? m.funcao.join(', ') : m.funcao}</div>
                            </>
                          ) : (
                            // Editor inline (aparece ao clicar em Editar)
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              <input value={editingMember.nome} onChange={e => setEditingMember(prev => ({ ...prev, nome: e.target.value }))} style={{ padding: 8, borderRadius: 6, border: '1px solid #e6e6e6' }} />
                              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                {funcoesOpcoes.map(f => (
                                  <label key={f} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <input type="checkbox" checked={(editingMember.funcao || []).includes(f)} onChange={() => toggleEditMemberFunc(f)} />
                                    <span style={{ fontSize: 13 }}>{f}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        {!isEditingThis ? (
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              onClick={() => startEditMember(m)}
                              style={{ background: 'none', border: '1px solid #f3f4f6', padding: '8px 10px', borderRadius: 8, cursor: 'pointer', color: '#0f172a', fontWeight: 700 }}
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => removerMembro(m.id)}
                              style={{ ...removeLink, padding: '8px 10px', borderRadius: 8 }}
                            >
                              Remover
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={saveEditedMember} style={{ background: '#7b1d1d', color: '#fff', border: 'none', padding: '8px 10px', borderRadius: 8, cursor: 'pointer' }}>Salvar</button>
                            <button onClick={cancelEditMember} style={{ background: '#e5e7eb', border: 'none', padding: '8px 10px', borderRadius: 8 }}>Cancelar</button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {/* ===================== Escala do Mês (publicada) ===================== */}
          {viewMode === 'escala' && escalaMensal && (
            <div style={{ marginBottom: 14, padding: 12, background: '#fff', borderRadius: 6, border: '1px solid #e6e6e6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>Escala do Mês — {escalaMensal.monthLabel}</h3>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={removerEscalaMensal} style={{ background: '#fee2e2', border: '1px solid #fca5a5', padding: '8px 12px', borderRadius: 8 }}>Remover Escala do Mês</button>
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                {Array.isArray(escalaMensal.data) && escalaMensal.data.map(dia => (
                  <div key={dia.data} style={{ padding: 12, background: '#fafafa', borderRadius: 6, border: '1px solid #f3f3f3', marginBottom: 8 }}>
                    <strong style={{ display: 'block', marginBottom: 8 }}>{new Date(dia.data + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}</strong>
                    <div style={{ display: 'flex', gap: 16 }}>
                      {periodos.map(p => (
                        <div key={p} style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, color: '#7f1d1d', marginBottom: 6 }}>{p}</div>
                          {dia.turnos && dia.turnos[p] ? Object.entries(dia.turnos[p]).map(([f, n]) => {
                            const highlightWeekend = p === 'Noite' && (f === 'Som' || f === 'Holyrics')
                            return (
                              <div
                                key={f}
                                style={{
                                  fontSize: 13,
                                  padding: '8px',
                                  marginBottom: 6,
                                  border: highlightWeekend ? '1px solid #7b1d1d' : 'none',
                                  borderRadius: highlightWeekend ? 8 : 0,
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  background: highlightWeekend ? '#fff' : 'transparent'
                                }}
                              >
                                <div style={{ color: '#555' }}>
                                  <span style={{ fontWeight: 600 }}>{f}:</span> <span style={{ marginLeft: 8, fontWeight: 700 }}>{n}</span>
                                </div>

                                {highlightWeekend && (
                                  <div style={{
                                    background: '#7b1d1d',
                                    color: '#fff',
                                    padding: '4px 10px',
                                    borderRadius: 999,
                                    fontSize: 12,
                                    fontWeight: 800
                                  }}>
                                    Sábado
                                  </div>
                                )}
                              </div>
                            )
                          }) : <div style={{ color: '#9ca3af' }}>Sem dados</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* ==================================================================== */}

          {viewMode === 'escala' && sugestaoEditada && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>Sugestão de Escala</h3>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => publicarEscala(sugestaoEditada)} style={secondaryBtnStyle}>Publicar Agora</button>
                  <button onClick={() => setSugestaoEditada(null)} style={{ background: '#e5e7eb', border: 'none', padding: '8px 12px', borderRadius: 8 }}>Descartar</button>
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                {sugestaoEditada.map(dia => (
                  <div key={dia.data} style={{ padding: 12, background: '#fff', borderRadius: 6, border: '1px solid #f3f3f3', marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ display: 'block', marginBottom: 8 }}>{new Date(dia.data + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}</strong>
                      <div>
                        <button onClick={() => startEditDay(dia)} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #ddd' }}>Editar</button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 16 }}>
                      {periodos.map(p => (
                        <div key={p} style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, color: '#7f1d1d', marginBottom: 6 }}>{p}</div>
                          {Object.entries(dia.turnos[p]).map(([f, n]) => {
                            const highlightWeekend = p === 'Noite' && (f === 'Som' || f === 'Holyrics')
                            return (
                              <div
                                key={f}
                                style={{
                                  fontSize: 13,
                                  padding: '8px',
                                  marginBottom: 6,
                                  border: highlightWeekend ? '1px solid #7b1d1d' : 'none',
                                  borderRadius: highlightWeekend ? 8 : 0,
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  background: highlightWeekend ? '#fff' : 'transparent'
                                }}
                              >
                                <div style={{ color: '#555' }}>
                                  <span style={{ fontWeight: 600 }}>{f}:</span> <span style={{ marginLeft: 8, fontWeight: 700 }}>{n}</span>
                                </div>

                                {highlightWeekend && (
                                  <div style={{
                                    background: '#7b1d1d',
                                    color: '#fff',
                                    padding: '4px 10px',
                                    borderRadius: 999,
                                    fontSize: 12,
                                    fontWeight: 800
                                  }}>
                                    Sábado
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {editingDay && (
                <div style={{ marginTop: 12, padding: 12, background: '#fff', borderRadius: 6, border: '1px solid #e8e8e8' }}>
                  <h4 style={{ marginTop: 0 }}>Editar — {new Date(editingDay.data + 'T00:00:00').toLocaleDateString('pt-BR')}</h4>

                  {Object.entries(editingDay.turnos).map(([p, turnos]) => (
                    <div key={p} style={{ marginBottom: 12 }}>
                      <div style={{ fontWeight: 700, marginBottom: 8 }}>{p}</div>
                      {Object.entries(turnos).map(([f, n]) => {
                        const candidatos = membros.filter(m => Array.isArray(m.funcao) ? m.funcao.includes(f) : m.funcao === f)
                        const includesCurrent = candidatos.some(m => m.nome === n)
                        return (
                          <div key={f} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                            <div style={{ width: 140 }}>{f}</div>

                            <select
                              value={n}
                              onChange={e => updateEditingAssignment(p, f, e.target.value)}
                              style={{ padding: 8, border: '1px solid #ddd', borderRadius: 6, flex: 1 }}
                            >
                              <option value="Vago">Vago</option>
                              {candidatos.map(mem => (
                                <option key={mem.id} value={mem.nome}>{mem.nome}</option>
                              ))}
                              {!includesCurrent && n !== 'Vago' && (
                                <option value={n}>{n} (atual)</option>
                              )}
                            </select>

                            <button
                              onClick={() => removeFunctionFromEditing(p, f)}
                              style={{ padding: '6px 8px', borderRadius: 6, background: '#fee2e2', border: '1px solid #fca5a5' }}
                            >
                              Remover Função
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  ))}

                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button onClick={saveEditingDay} style={{ background: '#7b1d1d', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: 8 }}>Salvar</button>
                    <button onClick={cancelEditingDay} style={{ background: '#e5e7eb', border: 'none', padding: '8px 12px', borderRadius: 8 }}>Cancelar</button>
                  </div>
                </div>
              )}

            </div>
          )}

          {viewMode === 'escala' && (
            <div>
              <h4 style={{ marginTop: 0 }}>Restrições do Mês</h4>
              {restricoes.length === 0 ? <p style={{ color: '#9ca3af' }}>Nenhuma restrição.</p> : restricoes.map(r => (
                <div key={r.id} style={{ padding: '10px 0', borderBottom: '1px solid #f0f0f0', fontSize: 13 }}>
                  <strong>{r.responsavel}</strong> - {r.data} ({Array.isArray(r.periodo) ? r.periodo.join(', ') : r.periodo})
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}