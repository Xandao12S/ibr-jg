// src/pages/Restricoes.jsx
import React, { useState, useEffect, useMemo } from 'react'

export default function Restricoes() {
  const [membros, setMembros] = useState([])
  const [nome, setNome] = useState('')
  const [data, setData] = useState('')
  const [periodos, setPeriodos] = useState([]) // ['Manhã', 'Noite']
  const [restricoes, setRestricoes] = useState([])

  useEffect(() => {
    const loadMembros = () => {
      try {
        const raw = localStorage.getItem('membros_ibr')
        setMembros(raw ? JSON.parse(raw) : [])
      } catch (e) {
        console.error("Erro ao carregar membros", e)
        setMembros([])
      }
    }
    const loadRestricoes = () => {
      try {
        const raw = localStorage.getItem('restricoes_ibr_list')
        setRestricoes(raw ? JSON.parse(raw) : [])
      } catch {
        setRestricoes([])
      }
    }
    loadMembros()
    loadRestricoes()

    function onStorage(e) {
      const keys = ['membros_ibr', 'restricoes_ibr_list', 'restricoes_ibr', 'restricoes_sync']
      if (!e || e.key === null || keys.includes(e.key)) {
        loadMembros()
        loadRestricoes()
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const togglePeriodo = (p) => {
    setPeriodos(prev => prev.includes(p) ? prev.filter(item => item !== p) : [...prev, p])
  }

  // Quando enviar, salvamos também o memberId (se o nome selecionado existir na lista de membros)
  const enviarRestricao = (e) => {
    e.preventDefault()
    if (!nome || !data || periodos.length === 0) {
      return
    }

    const found = membros.find(m => String(m.nome) === String(nome))
    const novaRestricao = {
      id: Date.now(),
      responsavel: nome,
      memberId: found ? found.id : null,
      data: data,
      periodo: periodos
    }

    try {
      const salvas = JSON.parse(localStorage.getItem('restricoes_ibr_list') || '[]')
      const novaLista = [...salvas, novaRestricao]
      localStorage.setItem('restricoes_ibr_list', JSON.stringify(novaLista))

      // trigger para outras abas
      localStorage.setItem('restricoes_sync', String(Date.now()))
      window.dispatchEvent(new Event('storage'))

      setRestricoes(novaLista)
      // opcional: não usar alert se você removeu alerts em todo o projeto
      setNome('')
      setData('')
      setPeriodos([])
    } catch (err) {
      console.error(err)
      alert('Erro ao salvar.')
    }
  }

  // Verifica permissão geral (ADM/Líder) baseada na flag de sessão
  const temPermissaoGeral = useMemo(() => {
    try {
      return typeof window !== 'undefined' && sessionStorage.getItem('ibr_admin_ok') === '1'
    } catch {
      return false
    }
  }, [])

  // proteger a remoção server-side-like: checar permissão antes de executar
  const removerRestricao = (id) => {
    if (!temPermissaoGeral) {
      // não permite a remoção se não for admin/líder
      console.warn('Ação de remoção bloqueada: usuário sem permissão.')
      return
    }
    try {
      const atual = JSON.parse(localStorage.getItem('restricoes_ibr_list') || '[]')
      const filtrado = atual.filter(r => r.id !== id)
      localStorage.setItem('restricoes_ibr_list', JSON.stringify(filtrado))
      localStorage.setItem('restricoes_sync', String(Date.now()))
      window.dispatchEvent(new Event('storage'))
      setRestricoes(filtrado)
    } catch (err) {
      console.error(err)
    }
  }

  // Helper para iniciais do avatar
  const initials = (nome) => {
    if (!nome) return ''
    return nome.split(' ').map(s => s[0]).slice(0,2).join('').toUpperCase()
  }

  return (
    <div style={{ maxWidth: 1200, margin: '24px auto', padding: '0 16px', fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial' }}>
      <h2 style={{ color: '#7f1d1d', marginBottom: 6 }}>Enviar Restrição</h2>
      <p style={{ color: '#6b7280', marginTop: 0 }}>Selecione seu nome, a data e os períodos que você não poderá estar disponível.</p>

      <form onSubmit={enviarRestricao} style={{
        display: 'grid',
        gridTemplateColumns: '1fr 220px',
        gap: 12,
        background: '#ffffff',
        padding: 16,
        borderRadius: 12,
        boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
        border: '1px solid #eef2f6'
      }}>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Seu nome</label>
          <select
            value={nome}
            onChange={e => setNome(e.target.value)}
            style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e6e9ee', background: '#fff' }}
          >
            <option value="">Escolha seu nome...</option>
            {membros.map(m => (
              <option key={m.id} value={m.nome}>{m.nome}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Data</label>
          <input
            type="date"
            value={data}
            onChange={e => setData(e.target.value)}
            style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e6e9ee' }}
          />
        </div>

        <div style={{ gridColumn: '1 / span 2' }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Períodos</label>
          <div style={{ display: 'flex', gap: 10 }}>
            {['Manhã', 'Noite'].map(p => (
              <button
                key={p}
                type="button"
                onClick={() => togglePeriodo(p)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 10,
                  border: periodos.includes(p) ? '1px solid #7f1d1d' : '1px solid #e6e9ee',
                  background: periodos.includes(p) ? '#7f1d1d' : '#fff',
                  color: periodos.includes(p) ? '#fff' : '#111',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div style={{ gridColumn: '1 / span 2', textAlign: 'right' }}>
          <button type="submit" className="btn-vinho" style={{ padding: '10px 16px', borderRadius: 10 }}>Enviar restrição</button>
        </div>
      </form>

      <div style={{ display: 'grid', gridTemplateColumns: '520px 1fr', gap: 16, marginTop: 18 }}>
        <aside style={{ background: '#fff', padding: 20, borderRadius: 14, boxShadow: '0 10px 30px rgba(15,23,42,0.06)', border: '1px solid #eef2f6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div>
              <h3 style={{ margin: 0, color: '#7f1d1d', fontSize: 20 }}>Nomes e Funções</h3>
              <div style={{ marginTop: 6, color: '#6b7280', fontSize: 13 }}>Lista sincronizada com o Painel ADM</div>
            </div>
            <div style={{ color: '#6b7280', fontSize: 13 }}>{membros.length} membros</div>
          </div>

          <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
            {membros.length === 0 ? (
              <div style={{ color: '#9ca3af', padding: 12 }}>Nenhum membro cadastrado.</div>
            ) : (
              membros.map(m => {
                const isLeader = Array.isArray(m.funcao) ? m.funcao.includes('Líder') : m.funcao === 'Líder'
                return (
                  <div key={m.id} style={{ display: 'flex', gap: 14, alignItems: 'center', padding: 14, borderRadius: 12, border: '1px solid #f3f4f6', background: '#fff' }}>
                    <div style={{ width: 64, height: 64, borderRadius: 12, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#111', fontSize: 18 }}>
                      {initials(m.nome)}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ fontWeight: 900, fontSize: 18, color: isLeader ? '#b8860b' : '#111' }}>{m.nome}</div>
                        {isLeader && (
                          <div style={{ padding: '6px 10px', borderRadius: 999, background: '#fff4d9', color: '#b8860b', fontSize: 13, fontWeight: 800 }}>
                            Líder
                          </div>
                        )}
                      </div>
                      <div style={{ color: '#4b5563', fontSize: 15, marginTop: 6 }}>{Array.isArray(m.funcao) ? m.funcao.join(', ') : m.funcao}</div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      {temPermissaoGeral ? (
                        <button
                          onClick={() => {
                            const nova = membros.filter(x => x.id !== m.id)
                            localStorage.setItem('membros_ibr', JSON.stringify(nova))
                            localStorage.setItem('membros_sync', String(Date.now()))
                            window.dispatchEvent(new Event('storage'))
                            setMembros(nova)
                          }}
                          style={{ background: 'none', border: '1px solid #f3f4f6', padding: '8px 10px', borderRadius: 8, cursor: 'pointer', color: '#b91c1c', fontWeight: 700 }}
                        >
                          Remover
                        </button>
                      ) : null}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </aside>

        <div style={{ background: '#fff', padding: 12, borderRadius: 12, boxShadow: '0 8px 20px rgba(15,23,42,0.04)', border: '1px solid #eef2f6', maxHeight: 600, overflow: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px' }}>
            <h3 style={{ margin: 0, color: '#111', fontSize: 15 }}>Restrições Pendentes</h3>
            <div style={{ color: '#6b7280', fontSize: 12 }}>{restricoes.length} itens</div>
          </div>

          <div style={{ marginTop: 8, display: 'grid', gap: 8 }}>
            {restricoes.length === 0 ? (
              <div style={{ padding: 12, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>Nenhuma restrição enviada.</div>
            ) : (
              restricoes.map(r => (
                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: 10, border: '1px solid #f3f4f6', background: '#fff' }}>
                  <div style={{ fontSize: 13 }}>
                    <div style={{ fontWeight: 700 }}>{r.responsavel}</div>
                    <div style={{ color: '#6b7280', fontSize: 12 }}>{new Date(r.data + 'T00:00:00').toLocaleDateString('pt-BR')} • {Array.isArray(r.periodo) ? r.periodo.join(', ') : r.periodo}</div>
                  </div>
                  <div>
                    {temPermissaoGeral ? (
                      <button onClick={() => removerRestricao(r.id)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px 8px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>Remover</button>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}