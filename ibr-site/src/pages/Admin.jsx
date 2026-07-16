// src/pages/Admin.jsx
import React, { useEffect, useState, useCallback, useRef } from 'react'

// --- helpers de normalização (mantive os mesmos que você já tinha) ---
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
  const [showInformativosPanel, setShowInformativosPanel] = useState(false)
  
  // -- Novo estado para o painel do Álbum --
  const [showAlbumPanel, setShowAlbumPanel] = useState(false)

  const [escalaMensal, setEscalaMensal] = useState(null)

  // informativos
  const [informativos, setInformativos] = useState([])
  const [informativoTitulo, setInformativoTitulo] = useState('')
  const [informativoConteudo, setInformativoConteudo] = useState('')
  const [informativoImagem, setInformativoImagem] = useState(null) // dataURL
  const fileInputRef = useRef(null)

  // estado para edição de informativo existente
  const [editingInformativo, setEditingInformativo] = useState(null)

  // edição de membro (mantido)
  const [editingMember, setEditingMember] = useState(null)
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
      setInformativos(JSON.parse(localStorage.getItem('informativos_ibr') || '[]'))

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

  // Fecha dropdown funções
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

  const removerMembro = (id) => {
    const nova = membros.filter(x => x.id !== id)
    localStorage.setItem('membros_ibr', JSON.stringify(nova))
    localStorage.setItem('membros_sync', String(Date.now()))
    setMembros(nova); window.dispatchEvent(new Event('storage'))
  }

  const startEditMember = (m) => {
    setEditingMember({ id: m.id, nome: m.nome, funcao: Array.isArray(m.funcao) ? [...m.funcao] : (m.funcao ? [m.funcao] : []) })
  }
  const toggleEditMemberFunc = (f) => {
    setEditingMember(prev => {
      if (!prev) return prev
      const funcs = prev.funcao || []
      return { ...prev, funcao: funcs.includes(f) ? funcs.filter(x => x !== f) : [...funcs, f] }
    })
  }
  const saveEditedMember = () => {
    if (!editingMember) return
    const nova = membros.map(m => m.id === editingMember.id ? { ...m, nome: editingMember.nome, funcao: editingMember.funcao } : m)
    localStorage.setItem('membros_ibr', JSON.stringify(nova))
    localStorage.setItem('membros_sync', String(Date.now()))
    setMembros(nova); setEditingMember(null); window.dispatchEvent(new Event('storage'))
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
    if (!Array.isArray(e) || e.length === 0) return
    const monthLabel = monthLabelFromDateStr(e[0].data) || (new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }))
    const obj = { monthLabel, data: e, createdAt: new Date().toISOString() }
    localStorage.setItem('escala_mensal', JSON.stringify(obj))
    localStorage.setItem('escala_publicada', JSON.stringify(e))
    setEscalaMensal(obj); setSugestaoEditada(null)
  }

  function removerEscalaMensal() {
    localStorage.removeItem('escala_mensal')
    localStorage.removeItem('escala_publicada')
    setEscalaMensal(null)
  }

  function removerRestricaoAdmin(id) {
    if (!confirm('Remover esta restrição permanentemente?')) return
    try {
      const atual = JSON.parse(localStorage.getItem('restricoes_ibr_list') || '[]')
      const filtrado = atual.filter(r => r.id !== id)
      localStorage.setItem('restricoes_ibr_list', JSON.stringify(filtrado))
      localStorage.setItem('restricoes_sync', String(Date.now()))
      window.dispatchEvent(new Event('storage'))
      setRestricoes(filtrado)
    } catch (err) {
      console.error('Erro ao remover restrição', err)
      alert('Erro ao remover restrição.')
    }
  }

  // ------------------ Informativos: captura de foto / salvar ------------------

  function handleFundoClick() {
    if (fileInputRef.current) fileInputRef.current.click()
  }

  function handleFileChange(e) {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setInformativoImagem(reader.result) // dataURL
    }
    reader.onerror = () => {
      alert('Erro ao ler arquivo.')
    }
    reader.readAsDataURL(file)
    // limpa o input para permitir re-seleção do mesmo arquivo se necessário
    e.target.value = ''
  }

  // Função que decide qual handler usar para o input file (cadastro ou edição)
  function handleFileInputChange(e) {
    if (editingInformativo) {
      // se estiver editando, atualiza o editingInformativo
      const file = e.target.files && e.target.files[0]
      if (!file) { e.target.value = ''; return }
      const reader = new FileReader()
      reader.onload = () => {
        setEditingInformativo(prev => prev ? { ...prev, imagemDataUrl: reader.result } : prev)
      }
      reader.onerror = () => {
        alert('Erro ao ler imagem.')
      }
      reader.readAsDataURL(file)
      e.target.value = ''
    } else {
      // caso contrário, é para adicionar um novo informativo
      handleFileChange(e)
    }
  }

  function limparImagemSelecionada() {
    setInformativoImagem(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function adicionarInformativo() {
    if (!informativoTitulo.trim()) {
      return
    }
    try {
      const atual = JSON.parse(localStorage.getItem('informativos_ibr') || '[]')
      const novo = {
        id: Date.now(),
        titulo: informativoTitulo.trim(),
        conteudo: informativoConteudo.trim(),
        imagemDataUrl: informativoImagem || null,
        createdAt: new Date().toISOString()
      }
      const novoArr = [novo, ...atual]
      localStorage.setItem('informativos_ibr', JSON.stringify(novoArr))
      localStorage.setItem('informativos_sync', String(Date.now()))
      window.dispatchEvent(new Event('storage'))
      setInformativos(novoArr)
      // limpa campos
      setInformativoTitulo('')
      setInformativoConteudo('')
      setInformativoImagem(null)
      setShowInformativosPanel(false)
    } catch (err) {
      console.error('Erro ao salvar informativo', err)
      alert('Erro ao salvar informativo.')
    }
  }

  // ---------- Novas funções para editar / remover informativos existentes ----------
  function removerInformativo(id) {
    try {
      const atual = JSON.parse(localStorage.getItem('informativos_ibr') || '[]')
      const novo = atual.filter(item => item.id !== id)
      localStorage.setItem('informativos_ibr', JSON.stringify(novo))
      localStorage.setItem('informativos_sync', String(Date.now()))
      window.dispatchEvent(new Event('storage'))
      setInformativos(novo)
      if (editingInformativo && editingInformativo.id === id) {
        setEditingInformativo(null)
      }
    } catch (err) {
      console.error('Erro ao remover informativo', err)
      alert('Erro ao apagar informativo.')
    }
  }

  function startEditInformativo(item) {
    setEditingInformativo({
      ...item,
      titulo: item.titulo || '',
      conteudo: item.conteudo || '',
      imagemDataUrl: item.imagemDataUrl || null
    })
  }

  function handleEditInformativoFileChange(e) {
    // não usado diretamente; delegamos via handleFileInputChange. Mantido como referência se necessário.
    const file = e.target.files && e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setEditingInformativo(prev => prev ? { ...prev, imagemDataUrl: reader.result } : prev)
    }
    reader.onerror = () => {
      alert('Erro ao ler imagem.')
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  function salvarEdicaoInformativo() {
    if (!editingInformativo || !editingInformativo.titulo.trim()) {
      alert('O título não pode ficar vazio.')
      return
    }

    try {
      const atual = JSON.parse(localStorage.getItem('informativos_ibr') || '[]')
      const novo = atual.map(item =>
        item.id === editingInformativo.id
          ? {
              ...item,
              titulo: editingInformativo.titulo.trim(),
              conteudo: editingInformativo.conteudo || '',
              imagemDataUrl: editingInformativo.imagemDataUrl || null
            }
          : item
      )

      localStorage.setItem('informativos_ibr', JSON.stringify(novo))
      localStorage.setItem('informativos_sync', String(Date.now()))
      window.dispatchEvent(new Event('storage'))
      setInformativos(novo)
      setEditingInformativo(null)
    } catch (err) {
      console.error('Erro ao salvar edição do informativo', err)
      alert('Erro ao salvar informativo.')
    }
  }

  function cancelarEdicaoInformativo() {
    setEditingInformativo(null)
  }
  // -------------------------------------------------------------------------------

  // ------------------ Edição de Sugestão de Escala (mantido) ------------------
  const [editingDay, setEditingDay] = useState(null)
  function startEditDay(day) { setEditingDay(JSON.parse(JSON.stringify(day))) }
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
  function cancelEditingDay() { setEditingDay(null) }

  // layout helpers (mantidos)
  const containerStyle = { background: '#f7f6f5', minHeight: '100vh', padding: '40px 20px' }
  const cardStyle = { background: '#fff', borderRadius: 8, boxShadow: '0 6px 20px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.04)', padding: 18 }
  const topButtonsStyle = { display: 'flex', gap: 10 }
  const addBtnStyle = { background: '#6b1515', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 8, cursor: 'pointer' }
  const secondaryBtnStyle = { background: '#7b1d1d', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 8, cursor: 'pointer' }
  const removeLink = { color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }

  if (!checked) return null
  if (!authorized) return <div style={{ padding: 20 }}>Acesso negado.</div>

  return (
    <div style={containerStyle}>
      <div style={{ maxWidth: 980, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h1 style={{ margin: 0, fontSize: 22 }}>Painel ADM</h1>
          <div style={topButtonsStyle}>
            <button onClick={() => setViewMode(v => v === 'full' ? 'escala' : 'full')} style={secondaryBtnStyle}>
              {viewMode === 'full' ? 'Escala' : 'Fechar Escala'}
            </button>
            {viewMode === 'full' && <button onClick={() => { setShowMembrosPanel(s => !s); setShowInformativosPanel(false); setShowAlbumPanel(false) }} style={secondaryBtnStyle}>
              {showMembrosPanel ? 'Fechar Membros' : 'Membros'}
            </button>}
            {viewMode === 'full' && <button onClick={() => { setShowInformativosPanel(s => !s); setShowMembrosPanel(false); setShowAlbumPanel(false) }} style={secondaryBtnStyle}>
              {showInformativosPanel ? 'Fechar Informativos' : 'Informativos'}
            </button>}
            
            {/* NOVO BOTÃO ÁLBUM */}
            {viewMode === 'full' && <button onClick={() => { setShowAlbumPanel(s => !s); setShowInformativosPanel(false); setShowMembrosPanel(false) }} style={{ ...secondaryBtnStyle, background: showAlbumPanel ? '#5a1515' : secondaryBtnStyle.background }}>
              {showAlbumPanel ? 'Fechar Álbum' : 'Álbum'}
            </button>}

            {viewMode === 'escala' && <button onClick={gerarEscalaAutomatica} style={{ ...addBtnStyle, background: '#111' }}>Criar Escala</button>}
          </div>
        </div>

        <div style={cardStyle}>

          {/* Membros (mantido) */}
          {viewMode === 'full' && showMembrosPanel && (
            <>
              <h3 style={{ marginTop: 0, marginBottom: 12 }}>Cadastrar Membro</h3>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 18 }}>
                <input placeholder="Nome" value={membroNome} onChange={e => setMembroNome(e.target.value)} style={{ padding: 10, flex: 1, borderRadius: 6, border: '1px solid #e6e6e6' }} />
                <div ref={dropdownRef} style={{ position: 'relative', width: 320 }}>
                  <div onClick={() => setIsOpenFuncoes(!isOpenFuncoes)} style={{ padding: 10, borderRadius: 6, border: '1px solid #e6e6e6', background: '#fff', cursor: 'pointer', color: funcoesSelecionadas.length ? '#000' : '#9ca3af' }}>
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
                {membros.length === 0 ? <div style={{ padding: 16, color: '#9ca3af' }}>Nenhum membro cadastrado.</div> : membros.map(m => (
                  <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 8px', borderBottom: '1px solid #f0f0f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: (Array.isArray(m.funcao) ? m.funcao.includes('Líder') : m.funcao === 'Líder') ? '#ffecb5' : 'transparent', color: (Array.isArray(m.funcao) ? m.funcao.includes('Líder') : m.funcao === 'Líder') ? '#b8860b' : '#374151', fontWeight: 800 }}>{m.nome.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase()}</div>
                      <div>
                        <div style={{ fontWeight: 700 }}>{m.nome}</div>
                        <div style={{ color: '#4b5563' }}>{Array.isArray(m.funcao) ? m.funcao.join(', ') : m.funcao}</div>
                      </div>
                    </div>
                    <div>
                      <button onClick={() => startEditMember(m)} style={{ background: 'none', border: '1px solid #f3f4f6', padding: '8px 10px', borderRadius: 8, cursor: 'pointer', color: '#0f172a', fontWeight: 700 }}>Editar</button>
                      <button onClick={() => removerMembro(m.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', marginLeft: 8 }}>Remover</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          
          {/* PAINEL ÁLBUM */}
{viewMode === 'full' && showAlbumPanel && (
  <div style={{ padding: 20, textAlign: 'center', background: '#f9f9f9', borderRadius: 10, border: '2px dashed #ddd' }}>
    <h3 style={{ marginTop: 0 }}>Painel do Álbum</h3>
    <p>Aqui você poderá gerenciar as fotos do Álbum.</p>

    <input
      id="album-file-input"
      type="file"
      accept="image/*"
      multiple
      style={{ display: 'none' }}
      onChange={async (e) => {
        const files = Array.from(e.target.files || [])
        if (files.length === 0) return
        try {
          const raw = JSON.parse(localStorage.getItem('album_ibr') || '[]')
          const current = Array.isArray(raw) ? raw : []
          const toDataUrl = (file) => new Promise((res, rej) => {
            const reader = new FileReader()
            reader.onload = () => res(String(reader.result))
            reader.onerror = () => rej(new Error('Falha leitura'))
            reader.readAsDataURL(file)
          })
          const newItems = []
          for (const f of files) {
            try {
              const dataUrl = await toDataUrl(f)
              newItems.push({ id: Date.now() + Math.random(), title: f.name, dataUrl, createdAt: new Date().toISOString() })
            } catch (err) { console.error(err) }
          }
          const merged = [...newItems, ...current]
          localStorage.setItem('album_ibr', JSON.stringify(merged))
          window.dispatchEvent(new Event('storage')); loadData()
          e.target.value = ''
          alert(`${newItems.length} foto(s) adicionada(s).`)
        } catch (err) { alert('Erro ao adicionar.') }
      }}
    />

    {/* BOTÕES LADO A LADO */}
    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 14 }}>
      <button
        onClick={() => document.getElementById('album-file-input').click()}
        style={{ background: '#6b1515', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 8, cursor: 'pointer' }}
      >
        Adicionar Foto
      </button>

      <button
        onClick={() => {
          const raw = JSON.parse(localStorage.getItem('album_ibr') || '[]')
          if (raw.length === 0) return alert('O álbum está vazio.')
          // Abre a página pública do álbum em uma nova aba para conferência
          window.open('/album', '_blank')
        }}
        style={{ background: '#374151', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 8, cursor: 'pointer' }}
      >
        Ver Álbum (Público)
      </button>
    </div>

    {/* EXIBIÇÃO DAS FOTOS NO PAINEL ADM */}
    <div style={{ marginTop: 25, borderTop: '1px solid #eee', pt: 15 }}>
      <h4 style={{ marginBottom: 15 }}>Fotos no seu servidor:</h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 10 }}>
        {(() => {
          const raw = JSON.parse(localStorage.getItem('album_ibr') || '[]')
          if (raw.length === 0) return <p style={{ color: '#999', gridColumn: '1/-1' }}>Nenhuma foto ainda.</p>
          return raw.map(foto => (
            <div key={foto.id} style={{ position: 'relative', borderRadius: 6, overflow: 'hidden', height: 100, border: '1px solid #ddd' }}>
              <img src={foto.dataUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button 
                onClick={() => {
                  if(confirm('Apagar esta foto do álbum?')) {
                    const novo = raw.filter(f => f.id !== foto.id)
                    localStorage.setItem('album_ibr', JSON.stringify(novo))
                    window.dispatchEvent(new Event('storage')); loadData()
                  }
                }}
                style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(255,0,0,0.7)', color: '#fff', border: 'none', borderRadius: '50%', width: 22, height: 22, cursor: 'pointer', fontSize: 12 }}
              >
                ×
              </button>
            </div>
          ))
        })()}
      </div>
    </div>
  </div>
)}

          {/* Painel: Adicionar Informativo (mantido) */}
          {viewMode === 'full' && showInformativosPanel && (
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ marginTop: 0 }}>Adicionar Informativo</h3>

              {/* hidden file input (capture permite câmera em mobile) - usado tanto para cadastro quanto para edição */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: 'none' }}
                onChange={handleFileInputChange}
              />

              <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'auto 1fr 160px', alignItems: 'center', marginBottom: 12 }}>
                {/* Botão Fundo (à esquerda do adicionar) */}
                <div>
                  <button onClick={handleFundoClick} style={{ background: '#f3f4f6', border: '1px solid #e6e6e6', padding: '8px 12px', borderRadius: 8 }}>
                    Fundo
                  </button>
                </div>

                <input placeholder="Título do informativo" value={informativoTitulo} onChange={e => setInformativoTitulo(e.target.value)} style={{ padding: 10, borderRadius: 6, border: '1px solid #e6e6e6' }} />

                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={adicionarInformativo} style={{ ...addBtnStyle, padding: '10px 12px' }}>Adicionar</button>
                  <button onClick={() => { setInformativoTitulo(''); setInformativoConteudo(''); limparImagemSelecionada(); setShowInformativosPanel(false) }} style={{ background: '#e5e7eb', border: 'none', padding: '10px 12px', borderRadius: 8 }}>Cancelar</button>
                </div>

                {/* textarea ocupa as 3 colunas */}
                <textarea placeholder="Conteúdo (curto)" value={informativoConteudo} onChange={e => setInformativoConteudo(e.target.value)} style={{ gridColumn: '1 / span 3', padding: 10, borderRadius: 6, border: '1px solid #e6e6e6', minHeight: 100 }} />

                {/* preview da imagem (se selecionada) */}
                {informativoImagem && (
                  <div style={{ gridColumn: '1 / span 3', display: 'flex', gap: 8, alignItems: 'center' }}>
                    <img src={informativoImagem} alt="preview" style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid #e6e6e6' }} />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => { limparImagemSelecionada() }} style={{ background: '#fee2e2', border: '1px solid #fca5a5', padding: '6px 10px', borderRadius: 8 }}>Remover Foto</button>
                      <div style={{ color: '#6b7280', fontSize: 13 }}>Foto selecionada. Se o campo Conteúdo ficar vazio, a exibição pública mostrará somente a foto e o título.</div>
                    </div>
                  </div>
                )}
              </div>

              {/* ---------------------------------------------------------
                  Nova listagem reduzida: apenas títulos + Editar / Apagar
                 --------------------------------------------------------- */}
              <div style={{ marginTop: 12 }}>
                <h3 style={{ marginBottom: 8 }}>Informativos Publicados</h3>

                {informativos.length === 0 ? (
                  <div style={{ color: '#9ca3af' }}>Nenhum informativo cadastrado.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {informativos.map(item => (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px 14px',
                          border: '1px solid #e6e6e6',
                          borderRadius: 8,
                          background: '#fff'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 56, height: 44, borderRadius: 8, overflow: 'hidden', background: '#f3f3f3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {item.imagemDataUrl ? (
                              <img src={item.imagemDataUrl} alt="thumb" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <span style={{ color: '#999', fontSize: 12 }}>sem foto</span>
                            )}
                          </div>
                          <div style={{ fontWeight: 700, color: '#111' }}>{item.titulo}</div>
                        </div>

                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            onClick={() => startEditInformativo(item)}
                            style={{
                              padding: '8px 12px',
                              borderRadius: 8,
                              border: '1px solid #d1d5db',
                              background: '#f9fafb',
                              cursor: 'pointer'
                            }}
                          >
                            Editar
                          </button>

                          <button
                            onClick={() => removerInformativo(item.id)}
                            style={{
                              padding: '8px 12px',
                              borderRadius: 8,
                              border: '1px solid #fca5a5',
                              background: '#fee2e2',
                              color: '#991b1b',
                              cursor: 'pointer'
                            }}
                          >
                            Apagar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Editor inline (aparece ao clicar em Editar) */}
                {editingInformativo && (
                  <div style={{ marginTop: 16, padding: 14, border: '1px solid #e6e6e6', borderRadius: 8, background: '#fafafa' }}>
                    <h4 style={{ marginTop: 0 }}>Editar Informativo</h4>

                    <div style={{ display: 'grid', gap: 10 }}>
                      <input
                        value={editingInformativo.titulo}
                        onChange={e => setEditingInformativo(prev => ({ ...prev, titulo: e.target.value }))}
                        placeholder="Título"
                        style={{ padding: 10, borderRadius: 6, border: '1px solid #e6e6e6' }}
                      />

                      <textarea
                        value={editingInformativo.conteudo}
                        onChange={e => setEditingInformativo(prev => ({ ...prev, conteudo: e.target.value }))}
                        placeholder="Conteúdo"
                        style={{ padding: 10, borderRadius: 6, border: '1px solid #e6e6e6', minHeight: 100 }}
                      />

                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        {editingInformativo.imagemDataUrl && (
                          <img
                            src={editingInformativo.imagemDataUrl}
                            alt="preview"
                            style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid #e6e6e6' }}
                          />
                        )}

                        <button
                          onClick={() => fileInputRef.current && fileInputRef.current.click()}
                          style={{
                            padding: '8px 12px',
                            borderRadius: 8,
                            border: '1px solid #d1d5db',
                            background: '#f9fafb',
                            cursor: 'pointer'
                          }}
                        >
                          Alterar Fundo
                        </button>

                        <button
                          onClick={() => setEditingInformativo(prev => ({ ...prev, imagemDataUrl: null }))}
                          style={{
                            padding: '8px 12px',
                            borderRadius: 8,
                            border: '1px solid #fca5a5',
                            background: '#fee2e2',
                            color: '#991b1b',
                            cursor: 'pointer'
                          }}
                        >
                          Remover Fundo
                        </button>
                      </div>

                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                        <button
                          onClick={cancelarEdicaoInformativo}
                          style={{
                            padding: '8px 12px',
                            borderRadius: 8,
                            border: '1px solid #d1d5db',
                            background: '#fff',
                            cursor: 'pointer'
                          }}
                        >
                          Cancelar
                        </button>

                        <button
                          onClick={salvarEdicaoInformativo}
                          style={{
                            padding: '8px 12px',
                            borderRadius: 8,
                            border: 'none',
                            background: '#6b1515',
                            color: '#fff',
                            cursor: 'pointer'
                          }}
                        >
                          Salvar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Escala do mês, Sugestão, edição etc. (mantidos) */}
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
                          {dia.turnos && dia.turnos[p] ? Object.entries(dia.turnos[p]).map(([f, n]) => (
                            <div key={f} style={{ fontSize: 13, padding: '8px', marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ color: '#555' }}><span style={{ fontWeight: 600 }}>{f}:</span> <span style={{ marginLeft: 8, fontWeight: 700 }}>{n}</span></div>
                            </div>
                          )) : <div style={{ color: '#9ca3af' }}>Sem dados</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sugestão de escala (mantido) */}
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
                      <div><button onClick={() => startEditDay(dia)} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #ddd' }}>Editar</button></div>
                    </div>

                    <div style={{ display: 'flex', gap: 16 }}>
                      {periodos.map(p => (
                        <div key={p} style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, color: '#7f1d1d', marginBottom: 6 }}>{p}</div>
                          {Object.entries(dia.turnos[p]).map(([f, n]) => (
                            <div key={f} style={{ fontSize: 13, padding: '8px', marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ color: '#555' }}><span style={{ fontWeight: 600 }}>{f}:</span> <span style={{ marginLeft: 8, fontWeight: 700 }}>{n}</span></div>
                            </div>
                          ))}
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
                            <select value={n} onChange={e => updateEditingAssignment(p, f, e.target.value)} style={{ padding: 8, border: '1px solid #ddd', borderRadius: 6, flex: 1 }}>
                              <option value="Vago">Vago</option>
                              {candidatos.map(mem => <option key={mem.id} value={mem.nome}>{mem.nome}</option>)}
                              {!includesCurrent && n !== 'Vago' && (<option value={n}>{n} (atual)</option>)}
                            </select>

                            <button onClick={() => removeFunctionFromEditing(p, f)} style={{ padding: '6px 8px', borderRadius: 6, background: '#fee2e2', border: '1px solid #fca5a5' }}>Remover Função</button>
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

          {/* Restrições do mês (mantidas) */}
          {viewMode === 'escala' && (
            <div>
              <h4 style={{ marginTop: 0 }}>Restrições do Mês</h4>
              {restricoes.length === 0 ? <p style={{ color: '#9ca3af' }}>Nenhuma restrição.</p> : restricoes.map(r => (
                <div key={r.id} style={{ padding: '10px 0', borderBottom: '1px solid #f0f0f0', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div><strong>{r.responsavel}</strong> - {r.data} ({Array.isArray(r.periodo) ? r.periodo.join(', ') : r.periodo})</div>
                  <div><button onClick={() => removerRestricaoAdmin(r.id)} style={{ background: '#fee2e2', border: '1px solid #fca5a5', padding: '6px 10px', borderRadius: 8 }}>Remover</button></div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}