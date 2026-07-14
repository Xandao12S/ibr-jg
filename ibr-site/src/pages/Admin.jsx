// src/pages/Admin.jsx
import React, { useEffect, useState } from 'react'

const ADMIN_PASSWORD = 'senha123' // Troque aqui pela sua senha

export default function Admin() {
  const [authorized, setAuthorized] = useState(false)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const ok = sessionStorage.getItem('ibr_admin_ok')
    if (ok === '1') { setAuthorized(true); setChecked(true); return }
    const pass = window.prompt('Digite a senha do painel ADM:')
    if (pass === ADMIN_PASSWORD) {
      sessionStorage.setItem('ibr_admin_ok', '1')
      setAuthorized(true)
    } else {
      alert('Senha incorreta.')
    }
    setChecked(true)
  }, [])

  if (!checked) return null
  if (!authorized) return <div style={{ padding: 20 }}>Acesso negado.</div>

  return (
    <div style={{ padding: 20 }}>
      <AdminTools />
    </div>
  )
}

function AdminTools() {
  const [escalas, setEscalas] = useState([]) // registros: { nome, funcao: [] }
  const [restricoes, setRestricoes] = useState([]) // lista de restrições
  const [sugestaoGerada, setSugestaoGerada] = useState(null) // sugestão original
  const [sugestaoEditada, setSugestaoEditada] = useState(null) // versão editável
  const [editingField, setEditingField] = useState(null) // {dayIndex, periodo, func} or null
  const [editingValue, setEditingValue] = useState('')

  const funcoesDisponiveis = ['OBS', 'Holyrics', 'Som', 'Foto', 'Redes Sociais']
  const periodos = ['Manhã', 'Noite']

  useEffect(() => {
    try { const raw = localStorage.getItem('escalas_ibr'); setEscalas(raw ? JSON.parse(raw) : []) } catch { setEscalas([]) }
    try { const r = localStorage.getItem('restricoes_ibr_list'); setRestricoes(r ? JSON.parse(r) : []) } catch { setRestricoes([]) }
  }, [])

  useEffect(() => { try { localStorage.setItem('escalas_ibr', JSON.stringify(escalas)) } catch {} }, [escalas])
  useEffect(() => { try { localStorage.setItem('restricoes_ibr_list', JSON.stringify(restricoes)) } catch {} }, [restricoes])

  function getDomingosDoMesAtual() {
    const hoje = new Date()
    const ano = hoje.getFullYear()
    const mes = hoje.getMonth() // 0..11
    const domingos = []
    const d = new Date(ano, mes, 1)
    while (d.getMonth() === mes) {
      if (d.getDay() === 0) {
        domingos.push(d.toISOString().split('T')[0])
      }
      d.setDate(d.getDate() + 1)
    }
    return domingos
  }

  function gerarEscalaAutomatica() {
    const domingos = getDomingosDoMesAtual()
    if (domingos.length === 0) {
      alert('Não há domingos no mês atual (improvável).')
      return
    }

    const escalaFinal = domingos.map(data => {
      const turnos = {}
      periodos.forEach(periodo => {
        const alocadosNoTurno = {}
        funcoesDisponiveis.forEach(func => {
          const disponiveis = escalas.filter(p => {
            const temFuncao = (p.funcao || []).some(f => f.toLowerCase() === func.toLowerCase())
            const temRestricao = restricoes.some(r =>
              r.data === data &&
              r.periodo.includes(periodo) &&
              r.responsavel.toLowerCase() === p.nome.toLowerCase()
            )
            return temFuncao && !temRestricao
          })

          if (disponiveis.length > 0) {
            const sorteado = disponiveis[Math.floor(Math.random() * disponiveis.length)]
            alocadosNoTurno[func] = sorteado.nome
          } else {
            alocadosNoTurno[func] = 'Vago'
          }
        })
        turnos[periodo] = alocadosNoTurno
      })
      return { data, turnos }
    })

    setSugestaoGerada(escalaFinal)
    setSugestaoEditada(JSON.parse(JSON.stringify(escalaFinal)))
  }

  function startEditingName(dayIndex, periodo, func) {
    setEditingField({ dayIndex, periodo, func })
    const current = sugestaoEditada?.[dayIndex]?.turnos?.[periodo]?.[func] ?? ''
    setEditingValue(current === 'Vago' ? '' : current)
  }

  function cancelEditing() {
    setEditingField(null)
    setEditingValue('')
  }

  function saveEditing() {
    if (!editingField || !sugestaoEditada) return
    const { dayIndex, periodo, func } = editingField
    const novo = JSON.parse(JSON.stringify(sugestaoEditada))
    const value = editingValue.trim() === '' ? 'Vago' : editingValue.trim()
    if (novo[dayIndex] && novo[dayIndex].turnos && novo[dayIndex].turnos[periodo]) {
      novo[dayIndex].turnos[periodo][func] = value
      setSugestaoEditada(novo)
    }
    cancelEditing()
  }

  // Remove função sem confirmação (comportamento solicitado)
  function removerFuncaoNaSugestao(dayIndex, periodo, func) {
    if (!sugestaoEditada) return
    const novo = JSON.parse(JSON.stringify(sugestaoEditada))
    if (novo[dayIndex] && novo[dayIndex].turnos && novo[dayIndex].turnos[periodo]) {
      delete novo[dayIndex].turnos[periodo][func]
      setSugestaoEditada(novo)
    }
  }

  function reverterParaOriginal() {
    if (!sugestaoGerada) return
    setSugestaoEditada(JSON.parse(JSON.stringify(sugestaoGerada)))
    cancelEditing()
  }

  // === ALTERAÇÃO: grava também timestamp da publicação ===
  function publicarEscala(escala) {
    try {
      // salva a escala (array) para compatibilidade com o código existente
      localStorage.setItem('escala_publicada', JSON.stringify(escala))
      // salva timestamp ISO em chave separada
      const now = new Date().toISOString()
      localStorage.setItem('escala_publicada_at', now)
      // também dispare um storage event manual para a mesma aba se quiser atualizar imediatamente
      // (outras abas recebem automaticamente)
      window.dispatchEvent(new StorageEvent('storage', { key: 'escala_publicada', newValue: JSON.stringify(escala) }))
      window.dispatchEvent(new StorageEvent('storage', { key: 'escala_publicada_at', newValue: now }))
      alert('Escala publicada com sucesso!\nPublicado em: ' + new Date(now).toLocaleString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }))
    } catch (err) {
      console.error('Erro ao publicar escala:', err)
      alert('Erro ao publicar. Veja console.')
    }
  }

  function exportRestrCSV() {
    const rows = [['Responsável', 'Data', 'Períodos', 'Salvo Em']]
    restricoes.forEach(r => rows.push([r.responsavel, r.data, r.periodo.join(';'), r.criadoEm]))
    const csv = rows.map(r => r.map(c => `"${String(c || '').replace(/"/g,'""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'restricoes_export.csv'; a.click(); URL.revokeObjectURL(url)
  }

  function exportEscalasCSV() {
    const rows = [['Nome', 'Funções']]
    escalas.forEach(r => rows.push([r.nome, r.funcao.join(';')]))
    const csv = rows.map(r => r.map(c => `"${String(c || '').replace(/"/g,'""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'escalas_export.csv'; a.click(); URL.revokeObjectURL(url)
  }

  function removerRestr(id) {
    if (!confirm('Remover esta restrição?')) return
    setRestricoes(prev => prev.filter(r => r.id !== id))
  }

  function limparTodasRestr() {
    if (!confirm('Apagar todas as restrições?')) return
    setRestricoes([])
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <h2 style={{ margin: 0 }}>Painel ADM</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={exportEscalasCSV} className="btn-vinho">Exportar Escalas (CSV)</button>
          <button onClick={exportRestrCSV} className="btn-vinho">Exportar Restrições (CSV)</button>
          <button onClick={limparTodasRestr} style={{ color: '#b91c1c' }}>Limpar todas as restrições</button>
          <button onClick={gerarEscalaAutomatica} style={{ marginLeft: 8, background: '#7f1d1d', color: '#fff', padding: '8px 12px', borderRadius: 8, border: 'none' }}>
            Criar Escala
          </button>
        </div>
      </div>

      {!sugestaoEditada && (
        <div style={{ color: '#6b7280', marginBottom: 12 }}>
          Nenhuma sugestão gerada ainda. Clique em "Criar Escala" para gerar todas os domingos do mês atual.
        </div>
      )}

      {sugestaoEditada && (
        <div style={{ background: '#fff', padding: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h3 style={{ margin: 0 }}>Editar Sugestão (antes de publicar)</h3>
            <div>
              <button onClick={reverterParaOriginal} style={{ marginRight: 8 }}>Reverter alterações</button>
              <button onClick={() => publicarEscala(sugestaoEditada)} className="btn-vinho">Publicar edição</button>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            {sugestaoEditada.map((dia, dayIndex) => (
              <div key={dia.data} style={{ padding: 12, background: '#f9fafb', borderRadius: 8, border: '1px solid #eee' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{new Date(dia.data + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</strong>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Domingo</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 20, marginTop: 12 }}>
                  {periodos.map(periodo => (
                    <div key={periodo} style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: '#7f1d1d', marginBottom: 8 }}>{periodo}</div>
                      <div style={{ display: 'grid', gap: 6 }}>
                        {Object.keys(dia.turnos[periodo] || {}).length === 0 && (
                          <div style={{ color: '#9ca3af' }}>Nenhuma função (removida)</div>
                        )}
                        {Object.entries(dia.turnos[periodo] || {}).map(([func, nome]) => {
                          const isEditing = editingField && editingField.dayIndex === dayIndex && editingField.periodo === periodo && editingField.func === func
                          return (
                            <div key={func} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '6px 8px', borderRadius: 6, border: '1px solid #f0f0f0' }}>
                              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                <div style={{ fontWeight: 600 }}>{func}</div>
                                {isEditing ? (
                                  <input
                                    value={editingValue}
                                    onChange={e => setEditingValue(e.target.value)}
                                    placeholder="Nome da pessoa"
                                    style={{ padding: 6, borderRadius: 6, border: '1px solid #ddd', minWidth: 160 }}
                                  />
                                ) : (
                                  <div style={{ color: nome === 'Vago' ? '#b91c1c' : '#111' }}>{nome}</div>
                                )}
                              </div>

                              <div style={{ display: 'flex', gap: 8 }}>
                                {isEditing ? (
                                  <>
                                    <button onClick={saveEditing} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: 6 }}>Salvar</button>
                                    <button onClick={cancelEditing}>Cancelar</button>
                                  </>
                                ) : (
                                  <>
                                    <button onClick={() => startEditingName(dayIndex, periodo, func)}>Editar nome</button>
                                    <button onClick={() => removerFuncaoNaSugestao(dayIndex, periodo, func)} style={{ color: '#b91c1c' }}>Remover função</button>
                                  </>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      <div style={{ marginTop: 24 }}>
        <h4>Restrições Atuais</h4>
        {restricoes.length === 0 ? <div style={{ color: '#9ca3af' }}>Nenhuma restrição.</div> : restricoes.map(r => (
          <div key={r.id} style={{ padding: 8, borderBottom: '1px dashed #eee' }}>
            <div style={{ fontWeight: 700 }}>{r.responsavel}</div>
            <div style={{ color: '#4b5563' }}>{r.data} — {r.periodo.join(', ')}</div>
          </div>
        ))}
      </div>
    </div>
  )
}