// src/pages/Admin.jsx
import React, { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import html2canvas from 'html2canvas'

// ---------------- helpers ----------------
function normalizeText(s) {
  if (!s) return ''
  return String(s)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/gi, '')
    .trim()
    .toLowerCase()
}
function namesMatch(memberName, responsavel) {
  const a = normalizeText(memberName)
  const b = normalizeText(responsavel)
  return a === b || a.includes(b) || b.includes(a)
}
function normalizeDateStr(s) {
  if (!s) return ''
  const value = String(s).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const d = new Date(value)
  if (!isNaN(d.getTime())) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }
  return value
}
function dateToYMD(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
function parseYMDLocal(dateStr) {
  const normalized = normalizeDateStr(dateStr)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return null
  const [year, month, day] = normalized.split('-').map(Number)
  return new Date(year, month - 1, day, 12, 0, 0)
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
  } catch {
    return ''
  }
}
function getPeriodosDaRestricao(periodo) {
  if (!periodo) return []
  if (Array.isArray(periodo)) return periodo.map(normalizePeriod)
  const str = String(periodo).trim()
  if (str.startsWith('[') || str.startsWith('{')) {
    try {
      const parsed = JSON.parse(str)
      if (Array.isArray(parsed)) return parsed.map(normalizePeriod)
    } catch {}
  }
  return str
    .replace(/[{}[\]"']/g, '')
    .split(',')
    .map((item) => normalizePeriod(item.trim()))
    .filter(Boolean)
}
function pessoaTemRestricaoNoPeriodo({ nomePessoa, dataEscala, periodoEscala, membros, restricoes }) {
  const membro = membros.find((item) => namesMatch(item.nome, nomePessoa))
  return restricoes.some((restricao) => {
    const mesmaPessoa =
      String(restricao.member_id || '') === String(membro?.id || '') ||
      namesMatch(nomePessoa, restricao.responsavel)
    if (!mesmaPessoa) return false
    const dataRestricao = normalizeDateStr(restricao.data)
    const periodosRestricao = getPeriodosDaRestricao(restricao.periodo)
    const restricaoNoMesmoDia =
      dataRestricao === normalizeDateStr(dataEscala) && periodosRestricao.includes(periodoEscala)
    const dataDaEscala = parseYMDLocal(dataEscala)
    const dataDoSabadoAnterior = new Date(dataDaEscala)
    dataDoSabadoAnterior.setDate(dataDoSabadoAnterior.getDate() - 1)
    const restricaoNoSabadoAnterior =
      dataRestricao === dateToYMD(dataDoSabadoAnterior) && periodosRestricao.includes(periodoEscala)
    return restricaoNoMesmoDia || restricaoNoSabadoAnterior
  })
}

// ---------------- Admin component ----------------
export default function Admin() {
  // auth / UI
  const [authorized, setAuthorized] = useState(true)
  const [checked, setChecked] = useState(true)
  const [viewMode, setViewMode] = useState('full')

  // data states
  const [membros, setMembros] = useState([])
  const [restricoes, setRestricoes] = useState([])
  const [informativos, setInformativos] = useState([])
  const [escalaMensal, setEscalaMensal] = useState(null)
  const [album, setAlbum] = useState([])

  // UI / forms
  const [showMembrosPanel, setShowMembrosPanel] = useState(false)
  const [showInformativosPanel, setShowInformativosPanel] = useState(false)
  const [showAlbumPanel, setShowAlbumPanel] = useState(false)

  // membros form
  const [membroNome, setMembroNome] = useState('')
  const [funcoesSelecionadas, setFuncoesSelecionadas] = useState([])
  const [isOpenFuncoes, setIsOpenFuncoes] = useState(false)
  const dropdownRef = useRef(null)
  const funcoesOpcoes = ['Líder', 'Som', 'OBS', 'Holyrics', 'Foto', 'Redes Sociais']

  // editar membro
  const [editingMember, setEditingMember] = useState(null)

  // informativos form
  const [informativoTitulo, setInformativoTitulo] = useState('')
  const [informativoConteudo, setInformativoConteudo] = useState('')
  const [informativoImagem, setInformativoImagem] = useState(null)
  const [editingInformativo, setEditingInformativo] = useState(null)
  const fileInputRef = useRef(null)

  // escala & sugestao
  const [sugestaoEditada, setSugestaoEditada] = useState(null)
  const [editingDay, setEditingDay] = useState(null)
  const periodos = ['Manhã', 'Noite']

  // compartilhamento da escala
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareBgImage, setShareBgImage] = useState(null)
  const shareCardRef = useRef(null)
  const shareBgInputRef = useRef(null)

  // album upload input
  const albumInputRef = useRef(null)

  // layout styles
  const containerStyle = { background: '#f7f6f5', minHeight: '100vh', padding: '40px 20px' }
  const cardStyle = { background: '#fff', borderRadius: 8, boxShadow: '0 6px 20px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.04)', padding: 18 }
  const topButtonsStyle = { display: 'flex', gap: 10 }
  const addBtnStyle = { background: '#6b1515', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 8, cursor: 'pointer' }
  const secondaryBtnStyle = { background: '#7b1d1d', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 8, cursor: 'pointer' }

  // ------------- Supabase CRUD helpers -------------
  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase.from('membros').select('id, nome, funcao, created_at').order('created_at', { ascending: false })
      if (error) throw error
      const norm = (data || []).map(d => ({ id: d.id, nome: d.nome, funcao: d.funcao || [] }))
      setMembros(norm)
      localStorage.setItem('membros_ibr', JSON.stringify(norm))
      return norm
    } catch (err) {
      console.error('fetchMembers err, fallback localStorage', err)
      const fallback = JSON.parse(localStorage.getItem('membros_ibr') || '[]')
      setMembros(fallback)
      return fallback
    }
  }

  const fetchInformativos = async () => {
    try {
      const { data, error } = await supabase.from('informativos').select('id, titulo, conteudo, imagem_url, created_at').order('created_at', { ascending: false })
      if (error) throw error
      const norm = (data || []).map(d => ({ id: d.id, titulo: d.titulo, conteudo: d.conteudo, imagemDataUrl: d.imagem_url || null }))
      setInformativos(norm)
      localStorage.setItem('informativos_ibr', JSON.stringify(norm))
      return norm
    } catch (err) {
      console.error('fetchInformativos err, fallback localStorage', err)
      const fallback = JSON.parse(localStorage.getItem('informativos_ibr') || '[]')
      setInformativos(fallback)
      return fallback
    }
  }

  const fetchEscalaMensal = async () => {
    try {
      const { data, error } = await supabase.from('escala_mensal').select('id, month_label, data, created_at').order('created_at', { ascending: false }).limit(1)
      if (error) throw error
      if (data && data.length > 0) {
        const head = data[0]
        const obj = { id: head.id, monthLabel: head.month_label, data: head.data, createdAt: head.created_at }
        setEscalaMensal(obj)
        localStorage.setItem('escala_mensal', JSON.stringify(obj))
        return obj
      } else {
        const fallback = JSON.parse(localStorage.getItem('escala_mensal') || 'null')
        if (fallback) setEscalaMensal(fallback)
        return fallback
      }
    } catch (err) {
      console.error('fetchEscalaMensal err, fallback localStorage', err)
      const fallback = JSON.parse(localStorage.getItem('escala_mensal') || 'null')
      if (fallback) setEscalaMensal(fallback)
      return fallback
    }
  }

  const fetchRestricoes = async () => {
    try {
      const { data, error } = await supabase.from('restricoes').select('id, responsavel, data, periodo, member_id, created_at').order('created_at', { ascending: false })
      if (error) throw error
      setRestricoes(data || [])
      localStorage.setItem('restricoes_ibr_list', JSON.stringify(data || []))
      return data || []
    } catch (err) {
      console.error('fetchRestricoes err, fallback localStorage', err)
      const fallback = JSON.parse(localStorage.getItem('restricoes_ibr_list') || '[]')
      setRestricoes(fallback)
      return fallback
    }
  }

  const fetchAlbum = async () => {
    try {
      const { data, error } = await supabase.from('album').select('id, title, image_url, created_at').order('created_at', { ascending: false })
      if (error) throw error
      setAlbum((data || []).map(d => ({ id: d.id, title: d.title, dataUrl: d.image_url })))
      localStorage.setItem('album_ibr', JSON.stringify(data || []))
      return data || []
    } catch (err) {
      console.error('fetchAlbum err, fallback localStorage', err)
      const fallback = JSON.parse(localStorage.getItem('album_ibr') || '[]')
      setAlbum(fallback)
      return fallback
    }
  }

  const fetchAll = useCallback(async () => {
    await Promise.all([fetchMembers(), fetchInformativos(), fetchEscalaMensal(), fetchRestricoes(), fetchAlbum()])
  }, [])

  // ------------------ MEMBERS CRUD ------------------
  const addMember = async (payload) => {
    try {
      const { data, error } = await supabase.from('membros').insert([payload]).select().single()
      if (error) throw error
      await fetchMembers()
      return data
    } catch (err) {
      console.error('addMember error - fallback local', err)
      const local = JSON.parse(localStorage.getItem('membros_ibr') || '[]')
      const novo = { id: String(Date.now()), nome: payload.nome, funcao: payload.funcao || [] }
      localStorage.setItem('membros_ibr', JSON.stringify([novo, ...local]))
      setMembros([novo, ...local])
      return novo
    }
  }

  const updateMember = async (id, payload) => {
    try {
      const { data, error } = await supabase.from('membros').update(payload).eq('id', id).select().single()
      if (error) throw error
      await fetchMembers()
      return data
    } catch (err) {
      console.error('updateMember err - fallback local', err)
      const local = JSON.parse(localStorage.getItem('membros_ibr') || '[]')
      const novo = local.map(m => (m.id === id ? { ...m, ...payload } : m))
      localStorage.setItem('membros_ibr', JSON.stringify(novo))
      setMembros(novo)
      return payload
    }
  }

  const deleteMember = async (id) => {
    try {
      const { error } = await supabase.from('membros').delete().eq('id', id)
      if (error) throw error
      await fetchMembers()
      return true
    } catch (err) {
      console.error('deleteMember err - fallback local', err)
      const local = JSON.parse(localStorage.getItem('membros_ibr') || '[]').filter(m => m.id !== id)
      localStorage.setItem('membros_ibr', JSON.stringify(local))
      setMembros(local)
      return false
    }
  }

  // ------------------ INFORMATIVOS CRUD ------------------
  const addInformativo = async (payload) => {
    try {
      const { data, error } = await supabase.from('informativos').insert([payload]).select().single()
      if (error) throw error
      await fetchInformativos()
      return data
    } catch (err) {
      console.error('addInformativo err - fallback local', err)
      const local = JSON.parse(localStorage.getItem('informativos_ibr') || '[]')
      const novo = { id: String(Date.now()), titulo: payload.titulo, conteudo: payload.conteudo, imagemDataUrl: payload.imagem_url || null }
      localStorage.setItem('informativos_ibr', JSON.stringify([novo, ...local]))
      setInformativos([novo, ...local])
      return novo
    }
  }

  const updateInformativo = async (id, payload) => {
    try {
      const { data, error } = await supabase.from('informativos').update(payload).eq('id', id).select().single()
      if (error) throw error
      await fetchInformativos()
      return data
    } catch (err) {
      console.error('updateInformativo err - fallback local', err)
      const local = JSON.parse(localStorage.getItem('informativos_ibr') || '[]').map(i => (i.id === id ? { ...i, ...payload } : i))
      localStorage.setItem('informativos_ibr', JSON.stringify(local))
      setInformativos(local)
      return payload
    }
  }

  const deleteInformativo = async (id) => {
    try {
      const { error } = await supabase.from('informativos').delete().eq('id', id)
      if (error) throw error
      await fetchInformativos()
      return true
    } catch (err) {
      console.error('deleteInformativo err - fallback local', err)
      const local = JSON.parse(localStorage.getItem('informativos_ibr') || '[]').filter(i => i.id !== id)
      localStorage.setItem('informativos_ibr', JSON.stringify(local))
      setInformativos(local)
      return false
    }
  }

  // ------------------ RESTRIÇÕES CRUD ------------------
  const addRestricao = async (payload) => {
    try {
      const { data, error } = await supabase.from('restricoes').insert([payload]).select().single()
      if (error) throw error
      await fetchRestricoes()
      return data
    } catch (err) {
      console.error('addRestricao err - fallback local', err)
      const local = JSON.parse(localStorage.getItem('restricoes_ibr_list') || '[]')
      const novo = { id: String(Date.now()), ...payload }
      localStorage.setItem('restricoes_ibr_list', JSON.stringify([novo, ...local]))
      setRestricoes([novo, ...local])
      return novo
    }
  }

  const deleteRestricao = async (id) => {
    const confirmar = window.confirm('Deseja realmente remover esta restrição?')
    if (!confirmar) return
    try {
      const { data, error } = await supabase.from('restricoes').delete().eq('id', id).select('id')
      if (error) throw error
      if (!data || data.length === 0) {
        throw new Error('O Supabase não autorizou a remoção desta restrição. Verifique a política RLS da tabela restricoes.')
      }
      setRestricoes((prev) => prev.filter((r) => r.id !== id))
      localStorage.setItem('restricoes_ibr_list', JSON.stringify(restricoes.filter((r) => r.id !== id)))
    } catch (err) {
      console.error('Erro ao remover restrição:', err)
      alert(`Não foi possível remover a restrição no Supabase.\n\n${err.message || 'Verifique as permissões da tabela restricoes.'}`)
    }
  }

  // ------------------ ESCALA MENSAL ------------------
  const publishEscalaMensal = async (obj) => {
    try {
      const payload = { month_label: obj.monthLabel, data: obj.data }
      const { data, error } = await supabase.from('escala_mensal').insert([payload]).select().single()
      if (error) throw error
      await fetchEscalaMensal()
      return data
    } catch (err) {
      console.error('publishEscalaMensal err - fallback local', err)
      const localObj = { id: String(Date.now()), monthLabel: obj.monthLabel, data: obj.data, createdAt: new Date().toISOString() }
      localStorage.setItem('escala_mensal', JSON.stringify(localObj))
      setEscalaMensal(localObj)
      return localObj
    }
  }

  const deleteEscalaMensal = async (id) => {
    try {
      const { error } = await supabase.from('escala_mensal').delete().eq('id', id)
      if (error) throw error
      setEscalaMensal(null)
      localStorage.removeItem('escala_mensal')
      return true
    } catch (err) {
      console.error('deleteEscalaMensal err - fallback local', err)
      setEscalaMensal(null)
      localStorage.removeItem('escala_mensal')
      return false
    }
  }

  const uploadAlbumFiles = async (files) => {
    const resultRows = []
    for (const file of files) {
      try {
        const fileExt = (file.name && file.name.split('.').pop()) || 'jpg'
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        const { error: uploadError } = await supabase.storage.from('album_ibr').upload(fileName, file, { cacheControl: '3600', upsert: false })
        if (uploadError) { alert(`Erro ao enviar ${file.name}: ${uploadError.message}`); continue }
        const { data: publicData } = await supabase.storage.from('album_ibr').getPublicUrl(fileName)
        const publicUrl = publicData?.publicUrl || null
        const { data: row, error: insertErr } = await supabase.from('album').insert([{ title: file.name, image_url: publicUrl }]).select().single()
        if (insertErr) { alert(`Erro ao criar registro no DB para ${file.name}: ${insertErr.message}`); continue }
        resultRows.push(row)
      } catch (err) {
        alert('Erro inesperado ao enviar arquivo: ' + (err.message || err))
      }
    }
    if (resultRows.length) await fetchAlbum()
    return resultRows
  }

  const deleteAlbumRow = async (id) => {
    try {
      const { error } = await supabase.from('album').delete().eq('id', id)
      if (error) throw error
      await fetchAlbum()
      return true
    } catch (err) {
      console.error('deleteAlbumRow err', err)
      const local = JSON.parse(localStorage.getItem('album_ibr') || '[]').filter(a => a.id !== id)
      localStorage.setItem('album_ibr', JSON.stringify(local))
      setAlbum(local)
      return false
    }
  }

  // ------------------ UI helpers (membros) ------------------
  const toggleFuncao = (f) => setFuncoesSelecionadas(prev => (prev.includes(f) ? prev.filter(i => i !== f) : [...prev, f]))

  const handleAddMemberClick = async () => {
    const nome = membroNome.trim()
    if (!nome) return
    await addMember({ nome, funcao: funcoesSelecionadas })
    setMembroNome('')
    setFuncoesSelecionadas([])
    setIsOpenFuncoes(false)
  }

  const startEditMember = (m) => setEditingMember({ ...m, funcao: Array.isArray(m.funcao) ? [...m.funcao] : (m.funcao ? [m.funcao] : []) })

  const handleSaveEditedMember = async () => {
    if (!editingMember) return
    await updateMember(editingMember.id, { nome: editingMember.nome, funcao: editingMember.funcao })
    setEditingMember(null)
  }

  // ------------------ Informativos UI handlers ------------------
  const handleFundoClick = () => { if (fileInputRef.current) fileInputRef.current.click() }

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setInformativoImagem(reader.result)
    reader.onerror = () => console.error('Erro ao ler arquivo.')
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const dataURLtoBlob = (dataurl) => {
    const arr = dataurl.split(',')
    const mime = arr[0].match(/:(.*?);/)[1]
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    while (n--) u8arr[n] = bstr.charCodeAt(n)
    return new Blob([u8arr], { type: mime })
  }

  const handleAddInformativo = async () => {
    const titulo = informativoTitulo.trim()
    if (!titulo) return
    let imagem_url = null
    if (informativoImagem && typeof informativoImagem === 'string' && informativoImagem.startsWith('data:')) {
      try {
        const blob = dataURLtoBlob(informativoImagem)
        const fileName = `informativo-${Date.now()}.jpg`
        const { error: uploadError } = await supabase.storage.from('album_ibr').upload(fileName, blob)
        if (!uploadError) {
          const { data: publicData } = await supabase.storage.from('album_ibr').getPublicUrl(fileName)
          imagem_url = publicData?.publicUrl || null
        }
      } catch (err) {
        console.error('informativo image upload err', err)
      }
    }
    await addInformativo({ titulo, conteudo: informativoConteudo.trim(), imagem_url })
    setInformativoTitulo('')
    setInformativoConteudo('')
    setInformativoImagem(null)
    setShowInformativosPanel(false)
  }

  const handleStartEditInformativo = (item) => setEditingInformativo({ ...item })

  const handleSaveEditInformativo = async () => {
    if (!editingInformativo) return
    await updateInformativo(editingInformativo.id, {
      titulo: editingInformativo.titulo,
      conteudo: editingInformativo.conteudo,
      imagem_url: editingInformativo.imagemDataUrl || editingInformativo.imagem_url || null
    })
    setEditingInformativo(null)
  }

  // ------------------ Escala helpers ------------------
  function gerarEscalaAutomatica() {
    const hoje = new Date()
    const domingos = []
    const d = new Date(hoje.getFullYear(), hoje.getMonth(), 1, 12, 0, 0)
    while (d.getMonth() === hoje.getMonth()) {
      if (d.getDay() === 0) domingos.push(dateToYMD(d))
      d.setDate(d.getDate() + 1)
    }

    const funcoesEscala = ['Som', 'OBS', 'Holyrics', 'Foto', 'Redes Sociais']

    const escala = domingos.map(dataRaw => {
      const dataDomingo = normalizeDateStr(dataRaw)
      const turnos = {}

      periodos.forEach(periodoAtual => {
        const alocados = {}
        const assignedKeys = new Set()

        funcoesEscala.forEach(funcao => {
          const candidatos = membros.filter(membro => {
            const temFuncao = Array.isArray(membro.funcao) ? membro.funcao.includes(funcao) : membro.funcao === funcao
            if (!temFuncao || assignedKeys.has(membro.id)) return false

            const temRestricao = restricoes.some(restricao => {
              const mesmaPessoa =
                String(restricao.member_id || '') === String(membro.id || '') ||
                namesMatch(membro.nome, restricao.responsavel)
              if (!mesmaPessoa) return false

              const dataRestricao = normalizeDateStr(restricao.data)
              const periodosRestricao = getPeriodosDaRestricao(restricao.periodo)
              const bloqueioNoDia = dataRestricao === dataDomingo && periodosRestricao.includes(periodoAtual)

              const dataDaRestricao = parseYMDLocal(dataRestricao)
              let bloqueioPorSabado = false
              if (dataDaRestricao && dataDaRestricao.getDay() === 6) {
                const diaSeguinte = new Date(dataDaRestricao)
                diaSeguinte.setDate(diaSeguinte.getDate() + 1)
                if (dateToYMD(diaSeguinte) === dataDomingo && periodosRestricao.includes(periodoAtual)) {
                  bloqueioPorSabado = true
                }
              }
              return bloqueioNoDia || bloqueioPorSabado
            })

            return !temRestricao
          })

          const escolhido = candidatos.length ? candidatos[Math.floor(Math.random() * candidatos.length)] : null
          if (escolhido) {
            alocados[funcao] = escolhido.nome
            assignedKeys.add(escolhido.id)
          } else {
            alocados[funcao] = 'Vago'
          }
        })

        turnos[periodoAtual] = alocados
      })

      return { data: dataRaw, turnos }
    })

    setSugestaoEditada(escala)
  }

  function trocarPessoaDaEscala(diaData, periodo, funcao, novoNome) {
    if (!novoNome || novoNome === 'Vago') {
      setSugestaoEditada(prev =>
        prev.map(sd =>
          sd.data === diaData
            ? { ...sd, turnos: { ...sd.turnos, [periodo]: { ...sd.turnos[periodo], [funcao]: 'Vago' } } }
            : sd
        )
      )
      return
    }

    const temRestricao = pessoaTemRestricaoNoPeriodo({ nomePessoa: novoNome, dataEscala: diaData, periodoEscala: periodo, membros, restricoes })

    if (temRestricao) {
      const confirmar = window.confirm(`⚠️ ${novoNome} tem restrição nesse dia/período (${periodo}). Realmente deseja escalar essa pessoa?`)
      if (!confirmar) return
    }

    setSugestaoEditada(prev =>
      prev.map(sd =>
        sd.data === diaData
          ? { ...sd, turnos: { ...sd.turnos, [periodo]: { ...sd.turnos[periodo], [funcao]: novoNome } } }
          : sd
      )
    )
  }

  const handlePublishEscala = async (escalaArr) => {
    if (!Array.isArray(escalaArr) || escalaArr.length === 0) return
    const monthLabel = monthLabelFromDateStr(escalaArr[0].data) || new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    await publishEscalaMensal({ monthLabel, data: escalaArr })
    setSugestaoEditada(null)
  }

  // ------------------ Compartilhar escala ------------------
  const handleCompartilharEscala = () => {
    if (!sugestaoEditada) return
    setShowShareModal(true)
  }

  const handleShareBgChange = (e) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setShareBgImage(reader.result)
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleGerarImagem = async () => {
    if (!shareCardRef.current) return
    try {
      const canvas = await html2canvas(shareCardRef.current, {
        useCORS: true,
        scale: 2,
        backgroundColor: null,
      })
      const dataUrl = canvas.toDataURL('image/png')

      if (navigator.share) {
        const blob = await (await fetch(dataUrl)).blob()
        const file = new File([blob], 'escala.png', { type: 'image/png' })
        await navigator.share({ files: [file], title: 'Escala IBR' }).catch(() => {})
      } else {
        const link = document.createElement('a')
        link.href = dataUrl
        link.download = 'escala-ibr.png'
        link.click()
      }
    } catch (err) {
      console.error('Erro ao gerar imagem:', err)
      alert('Erro ao gerar imagem.')
    }
  }

  // ------------------ Album handlers ------------------
  const handleAlbumFileInput = async (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    await uploadAlbumFiles(files)
    e.target.value = ''
  }

  // ------------------ Lifecycle ------------------
  useEffect(() => { setChecked(true) }, [])
  useEffect(() => { fetchAll() }, [fetchAll])
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpenFuncoes(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // ------------------ RENDER ------------------
  if (!checked) return null
  if (!authorized) return <div style={{ padding: 20 }}>Acesso negado.</div>

  return (
    <div style={containerStyle}>
      <div style={{ maxWidth: 980, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h1 style={{ margin: 0, fontSize: 22 }}>Painel ADM</h1>
          <div style={topButtonsStyle}>
            <button onClick={() => setViewMode(v => v === 'full' ? 'escala' : 'full')} style={secondaryBtnStyle}>
              {viewMode === 'full' ? 'Escala' : 'Fechar Escala'}
            </button>
            {viewMode === 'full' && (
              <button onClick={() => { setShowMembrosPanel(s => !s); setShowInformativosPanel(false); setShowAlbumPanel(false) }} style={secondaryBtnStyle}>
                {showMembrosPanel ? 'Fechar Membros' : 'Membros'}
              </button>
            )}
            {viewMode === 'full' && (
              <button onClick={() => { setShowInformativosPanel(s => !s); setShowMembrosPanel(false); setShowAlbumPanel(false) }} style={secondaryBtnStyle}>
                {showInformativosPanel ? 'Fechar Informativos' : 'Informativos'}
              </button>
            )}
            {viewMode === 'full' && (
              <button onClick={() => { setShowAlbumPanel(s => !s); setShowInformativosPanel(false); setShowMembrosPanel(false) }} style={{ ...secondaryBtnStyle, background: showAlbumPanel ? '#5a1515' : secondaryBtnStyle.background }}>
                {showAlbumPanel ? 'Fechar Álbum' : 'Álbum'}
              </button>
            )}
            {viewMode === 'escala' && (
              <button onClick={gerarEscalaAutomatica} style={{ ...addBtnStyle, background: '#111' }}>Criar Escala</button>
            )}
          </div>
        </div>

        {/* Modal de Compartilhar */}
        {showShareModal && sugestaoEditada && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, overflowY: 'auto' }}>
            <div style={{ background: '#fff', borderRadius: 12, padding: 20, maxWidth: 560, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 style={{ margin: 0 }}>Compartilhar Escala</h3>
                <button onClick={() => setShowShareModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
              </div>

              {/* Seletor de fundo */}
              <div style={{ marginBottom: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
                <input ref={shareBgInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleShareBgChange} />
                <button
                  onClick={() => shareBgInputRef.current && shareBgInputRef.current.click()}
                  style={{ background: '#f3f4f6', border: '1px solid #d1d5db', padding: '8px 14px', borderRadius: 8, cursor: 'pointer' }}
                >
                  🖼️ {shareBgImage ? 'Trocar Fundo' : 'Escolher Fundo'}
                </button>
                {shareBgImage && (
                  <button onClick={() => setShareBgImage(null)} style={{ background: '#fee2e2', border: '1px solid #fca5a5', padding: '8px 12px', borderRadius: 8, cursor: 'pointer', color: '#991b1b' }}>
                    Remover Fundo
                  </button>
                )}
              </div>

              {/* Preview da escala */}
<div
  ref={shareCardRef}
  style={{
    position: 'relative',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: shareBgImage ? 'transparent' : '#f5f0e8',
    padding: '20px 18px',
    minHeight: 300,
  }}
>
  {/* Imagem de fundo via <img> para o html2canvas capturar corretamente */}
  {shareBgImage && (
    <img
      src={shareBgImage}
      alt=""
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        borderRadius: 10,
        zIndex: 0,
      }}
    />
  )}

  {/* Overlay semitransparente */}
  {shareBgImage && (
    <div style={{
      position: 'absolute',
      inset: 0,
      background: 'rgba(255,255,255,0.82)',
      borderRadius: 10,
      zIndex: 1,
    }} />
  )}

  <div style={{ position: 'relative', zIndex: 2 }}>
    {/* Título */}
    <div style={{ textAlign: 'center', marginBottom: 16 }}>
      <span style={{ fontSize: 20, fontWeight: 900, color: '#1a2a5e' }}>
        📢 Escala —{' '}
        {sugestaoEditada[0] &&
          new Date(sugestaoEditada[0].data + 'T00:00:00')
            .toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
            .replace(/^\w/, c => c.toUpperCase())}
      </span>
    </div>

    {/* Dias */}
    {sugestaoEditada.map(dia => (
      <div key={dia.data} style={{
        background: 'rgba(255,255,255,0.88)',
        borderRadius: 8,
        padding: '10px 14px',
        marginBottom: 10,
        borderLeft: '4px solid #e8a020'
      }}>
        <div style={{ fontWeight: 800, fontSize: 14, color: '#1a2a5e', marginBottom: 8 }}>
          📅 {new Date(dia.data + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {periodos.map(p => (
            <div key={p} style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: '#1a2a5e', fontSize: 12, marginBottom: 4, borderBottom: '1px solid #e8a020', paddingBottom: 2 }}>{p}</div>
              {Object.entries(dia.turnos[p] || {}).map(([f, n]) => (
                <div key={f} style={{ fontSize: 12, color: '#222', lineHeight: 1.8 }}>
                  <span style={{ fontWeight: 700, color: '#1a2a5e' }}>{f}:</span> {n}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
</div>

              {/* Botões de ação */}
              <div style={{ display: 'flex', gap: 10, marginTop: 14, justifyContent: 'flex-end' }}>
                <button onClick={() => setShowShareModal(false)} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #d1d5db', background: '#f9fafb', cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button onClick={handleGerarImagem} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#25D366', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
                  📤 Gerar e Compartilhar
                </button>
              </div>
            </div>
          </div>
        )}

        <div style={cardStyle}>

          {/* Membros Panel */}
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
                <button onClick={handleAddMemberClick} style={{ ...addBtnStyle, padding: '10px 18px' }}>Adicionar</button>
              </div>

              <div style={{ borderTop: '1px solid #f0f0f0', borderRadius: 6, overflow: 'hidden' }}>
                {membros.length === 0 ? (
                  <div style={{ padding: 16, color: '#9ca3af' }}>Nenhum membro cadastrado.</div>
                ) : membros.map(m => (
                  <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 8px', borderBottom: '1px solid #f0f0f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: (Array.isArray(m.funcao) ? m.funcao.includes('Líder') : m.funcao === 'Líder') ? '#ffecb5' : 'transparent', color: (Array.isArray(m.funcao) ? m.funcao.includes('Líder') : m.funcao === 'Líder') ? '#b8860b' : '#374151', fontWeight: 800 }}>
                        {String(m.nome || '').split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700 }}>{m.nome}</div>
                        <div style={{ color: '#4b5563' }}>{Array.isArray(m.funcao) ? m.funcao.join(', ') : m.funcao}</div>
                      </div>
                    </div>
                    <div>
                      <button onClick={() => startEditMember(m)} style={{ background: 'none', border: '1px solid #f3f4f6', padding: '8px 10px', borderRadius: 8, cursor: 'pointer', color: '#0f172a', fontWeight: 700 }}>Editar</button>
                      <button onClick={() => deleteMember(m.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', marginLeft: 8 }}>Remover</button>
                    </div>
                  </div>
                ))}
              </div>

              {editingMember && (
                <div style={{ marginTop: 12, padding: 12, border: '1px solid #e6e6e6', borderRadius: 8 }}>
                  <h4 style={{ marginTop: 0 }}>Editar Membro</h4>
                  <input value={editingMember.nome} onChange={e => setEditingMember(prev => ({ ...prev, nome: e.target.value }))} style={{ padding: 10, borderRadius: 6, border: '1px solid #e6e6e6', marginBottom: 8, width: '100%' }} />
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                    {funcoesOpcoes.map(f => (
                      <label key={f} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <input type="checkbox" checked={editingMember.funcao && editingMember.funcao.includes(f)} onChange={() => setEditingMember(prev => ({ ...prev, funcao: prev.funcao.includes(f) ? prev.funcao.filter(x => x !== f) : [...prev.funcao, f] }))} />
                        <span>{f}</span>
                      </label>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button onClick={() => setEditingMember(null)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff' }}>Cancelar</button>
                    <button onClick={handleSaveEditedMember} style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: '#6b1515', color: '#fff' }}>Salvar</button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Album Panel */}
          {viewMode === 'full' && showAlbumPanel && (
            <div style={{ padding: 20, textAlign: 'center', background: '#f9f9f9', borderRadius: 10, border: '2px dashed #ddd' }}>
              <h3 style={{ marginTop: 0 }}>Painel do Álbum</h3>
              <p>Aqui você poderá gerenciar as fotos do Álbum.</p>
              <input id="album-file-input" ref={albumInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleAlbumFileInput} />
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 14 }}>
                <button onClick={() => document.getElementById('album-file-input').click()} style={{ background: '#6b1515', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 8, cursor: 'pointer' }}>Adicionar Foto</button>
              </div>
              <div style={{ marginTop: 25, borderTop: '1px solid #eee', paddingTop: 15 }}>
                <h4 style={{ marginBottom: 15 }}>Fotos no servidor:</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 10 }}>
                  {album.length === 0 ? (
                    <p style={{ color: '#999', gridColumn: '1/-1' }}>Nenhuma foto ainda.</p>
                  ) : album.map(foto => (
                    <div key={foto.id} style={{ position: 'relative', borderRadius: 6, overflow: 'hidden', height: 100, border: '1px solid #ddd' }}>
                      <img src={foto.dataUrl || foto.image_url} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button onClick={() => deleteAlbumRow(foto.id)} style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(255,0,0,0.7)', color: '#fff', border: 'none', borderRadius: '50%', width: 22, height: 22, cursor: 'pointer', fontSize: 12 }}>×</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Informativos Panel */}
          {viewMode === 'full' && showInformativosPanel && (
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ marginTop: 0 }}>Adicionar Informativo</h3>
              <input ref={fileInputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleFileChange} />
              <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'auto 1fr 160px', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <button onClick={handleFundoClick} style={{ background: '#f3f4f6', border: '1px solid #e6e6e6', padding: '8px 12px', borderRadius: 8 }}>Fundo</button>
                </div>
                <input placeholder="Título do informativo" value={informativoTitulo} onChange={e => setInformativoTitulo(e.target.value)} style={{ padding: 10, borderRadius: 6, border: '1px solid #e6e6e6' }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={handleAddInformativo} style={{ ...addBtnStyle, padding: '10px 12px' }}>Adicionar</button>
                  <button onClick={() => { setInformativoTitulo(''); setInformativoConteudo(''); setInformativoImagem(null); setShowInformativosPanel(false) }} style={{ background: '#e5e7eb', border: 'none', padding: '10px 12px', borderRadius: 8 }}>Cancelar</button>
                </div>
                <textarea placeholder="Conteúdo (curto)" value={informativoConteudo} onChange={e => setInformativoConteudo(e.target.value)} style={{ gridColumn: '1 / span 3', padding: 10, borderRadius: 6, border: '1px solid #e6e6e6', minHeight: 100 }} />
                {informativoImagem && (
                  <div style={{ gridColumn: '1 / span 3', display: 'flex', gap: 8, alignItems: 'center' }}>
                    <img src={informativoImagem} alt="preview" style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid #e6e6e6' }} />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => setInformativoImagem(null)} style={{ background: '#fee2e2', border: '1px solid #fca5a5', padding: '6px 10px', borderRadius: 8 }}>Remover Foto</button>
                      <div style={{ color: '#6b7280', fontSize: 13 }}>Foto selecionada.</div>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ marginTop: 12 }}>
                <h3 style={{ marginBottom: 8 }}>Informativos Publicados</h3>
                {informativos.length === 0 ? (
                  <div style={{ color: '#9ca3af' }}>Nenhum informativo cadastrado.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {informativos.map(item => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', border: '1px solid #e6e6e6', borderRadius: 8, background: '#fff' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 56, height: 44, borderRadius: 8, overflow: 'hidden', background: '#f3f3f3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {item.imagemDataUrl ? <img src={item.imagemDataUrl} alt="thumb" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: '#999', fontSize: 12 }}>sem foto</span>}
                          </div>
                          <div style={{ fontWeight: 700, color: '#111' }}>{item.titulo}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => handleStartEditInformativo(item)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', background: '#f9fafb', cursor: 'pointer' }}>Editar</button>
                          <button onClick={() => deleteInformativo(item.id)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #fca5a5', background: '#fee2e2', color: '#991b1b', cursor: 'pointer' }}>Apagar</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {editingInformativo && (
                  <div style={{ marginTop: 16, padding: 14, border: '1px solid #e6e6e6', borderRadius: 8, background: '#fafafa' }}>
                    <h4 style={{ marginTop: 0 }}>Editar Informativo</h4>
                    <div style={{ display: 'grid', gap: 10 }}>
                      <input value={editingInformativo.titulo} onChange={e => setEditingInformativo(prev => ({ ...prev, titulo: e.target.value }))} placeholder="Título" style={{ padding: 10, borderRadius: 6, border: '1px solid #e6e6e6' }} />
                      <textarea value={editingInformativo.conteudo} onChange={e => setEditingInformativo(prev => ({ ...prev, conteudo: e.target.value }))} placeholder="Conteúdo" style={{ padding: 10, borderRadius: 6, border: '1px solid #e6e6e6', minHeight: 100 }} />
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        {editingInformativo.imagemDataUrl && <img src={editingInformativo.imagemDataUrl} alt="preview" style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid #e6e6e6' }} />}
                        <button onClick={() => fileInputRef.current && fileInputRef.current.click()} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', background: '#f9fafb', cursor: 'pointer' }}>Alterar Fundo</button>
                        <button onClick={() => setEditingInformativo(prev => ({ ...prev, imagemDataUrl: null }))} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #fca5a5', background: '#fee2e2', color: '#991b1b', cursor: 'pointer' }}>Remover Fundo</button>
                      </div>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                        <button onClick={() => setEditingInformativo(null)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff' }}>Cancelar</button>
                        <button onClick={handleSaveEditInformativo} style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: '#6b1515', color: '#fff' }}>Salvar</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Escala publicada */}
          {viewMode === 'escala' && escalaMensal && (
            <div style={{ marginBottom: 14, padding: 12, background: '#fff', borderRadius: 6, border: '1px solid #e6e6e6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>Escala do Mês — {escalaMensal.monthLabel}</h3>
                <button onClick={() => deleteEscalaMensal(escalaMensal.id)} style={{ background: '#fee2e2', border: '1px solid #fca5a5', padding: '8px 12px', borderRadius: 8 }}>Remover Escala do Mês</button>
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

          {/* Sugestão de escala editável */}
          {viewMode === 'escala' && sugestaoEditada && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>Sugestão de Escala</h3>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => handlePublishEscala(sugestaoEditada)} style={secondaryBtnStyle}>Publicar Agora</button>
                  <button onClick={handleCompartilharEscala} style={{ background: '#25D366', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 8, cursor: 'pointer' }}>
                    📤 Compartilhar
                  </button>
                  <button onClick={() => setSugestaoEditada(null)} style={{ background: '#e5e7eb', border: 'none', padding: '8px 12px', borderRadius: 8 }}>Descartar</button>
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                {sugestaoEditada.map(dia => (
                  <div key={dia.data} style={{ padding: 12, background: '#fff', borderRadius: 6, border: '1px solid #f3f3f3', marginBottom: 10 }}>
                    <strong style={{ display: 'block', marginBottom: 8 }}>{new Date(dia.data + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}</strong>
                    <div style={{ display: 'flex', gap: 16 }}>
                      {periodos.map(p => (
                        <div key={p} style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, color: '#7f1d1d', marginBottom: 6 }}>{p}</div>
                          {Object.entries(dia.turnos[p]).map(([f, n]) => {
                            const candidatos = membros.filter(m => Array.isArray(m.funcao) ? m.funcao.includes(f) : m.funcao === f)
                            const includesCurrent = candidatos.some(m => m.nome === n)
                            return (
                              <div key={f} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                                <div style={{ width: 140 }}>{f}</div>
                                <select value={n} onChange={e => trocarPessoaDaEscala(dia.data, p, f, e.target.value)} style={{ padding: 8, border: '1px solid #ddd', borderRadius: 6, flex: 1 }}>
                                  <option value="Vago">Vago</option>
                                  {candidatos.map(mem => <option key={mem.id} value={mem.nome}>{mem.nome}</option>)}
                                  {!includesCurrent && n !== 'Vago' && <option value={n}>{n} (atual)</option>}
                                </select>
                                <button onClick={() => {
                                  const novoDia = { ...dia, turnos: { ...dia.turnos, [p]: { ...dia.turnos[p] } } }
                                  delete novoDia.turnos[p][f]
                                  setSugestaoEditada(prev => prev.map(sd => sd.data === dia.data ? novoDia : sd))
                                }} style={{ padding: '6px 8px', borderRadius: 6, background: '#fee2e2', border: '1px solid #fca5a5' }}>Remover Função</button>
                              </div>
                            )
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Restrições */}
          {viewMode === 'escala' && (
            <div>
              <h4 style={{ marginTop: 0 }}>Restrições do Mês</h4>
              {restricoes.length === 0 ? (
                <p style={{ color: '#9ca3af' }}>Nenhuma restrição.</p>
              ) : restricoes.map(r => (
                <div key={r.id} style={{ padding: '10px 0', borderBottom: '1px solid #f0f0f0', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <strong>{r.responsavel}</strong> — {r.data}
                    <span style={{ marginLeft: 6, color: '#6b7280' }}>({getPeriodosDaRestricao(r.periodo).join(', ')})</span>
                  </div>
                  <button onClick={() => deleteRestricao(r.id)} style={{ background: '#fee2e2', border: '1px solid #fca5a5', padding: '6px 10px', borderRadius: 8 }}>Remover</button>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}