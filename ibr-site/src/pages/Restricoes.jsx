// src/pages/Restricoes.jsx
import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Restricoes() {
  const [usuarioLogado, setUsuarioLogado] = useState(null)
  const [data, setData] = useState('')
  const [periodos, setPeriodos] = useState([])
  const [restricoes, setRestricoes] = useState([])
  const [loading, setLoading] = useState(true)
  const [enviando, setEnviando] = useState(false)

  const carregarRestricoes = async () => {
    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('restricoes')
        .select('id, responsavel, data, periodo, member_id, created_at')
        .order('created_at', { ascending: false })

      if (error) throw error

      setRestricoes(data || [])
    } catch (error) {
      console.error('Erro ao buscar restrições:', error)
      alert('Não foi possível carregar as restrições do Supabase.')
      setRestricoes([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    try {
      const raw = localStorage.getItem('current_user')

      if (!raw) {
        alert('Sua sessão não foi encontrada. Faça login novamente.')
        return
      }

      const user = JSON.parse(raw)

      if (!user?.id || !user?.nome) {
        alert('Dados do usuário inválidos. Faça login novamente.')
        return
      }

      setUsuarioLogado(user)
    } catch (error) {
      console.error('Erro ao obter usuário logado:', error)
      alert('Não foi possível identificar o usuário logado.')
    }

    carregarRestricoes()
  }, [])

  const togglePeriodo = (periodo) => {
    setPeriodos((atual) =>
      atual.includes(periodo)
        ? atual.filter((item) => item !== periodo)
        : [...atual, periodo]
    )
  }

  const enviarRestricao = async (event) => {
    event.preventDefault()

    if (!usuarioLogado?.id || !usuarioLogado?.nome) {
      alert('Não foi possível identificar seu usuário. Faça login novamente.')
      return
    }

    if (!data || periodos.length === 0) {
      alert('Escolha uma data e ao menos um período.')
      return
    }

    setEnviando(true)

    try {
      const novaRestricao = {
        responsavel: String(usuarioLogado.nome).trim(),
        member_id: usuarioLogado.id,
        data,
        periodo: periodos
      }

      const { data: restricaoSalva, error } = await supabase
        .from('restricoes')
        .insert([novaRestricao])
        .select('id, responsavel, data, periodo, member_id, created_at')
        .single()

      if (error) throw error

      setRestricoes((listaAtual) => [
        restricaoSalva,
        ...listaAtual
      ])

      setData('')
      setPeriodos([])

    } catch (error) {
      console.error('Erro ao salvar restrição:', error)
      alert(
        'Não foi possível salvar sua restrição no Supabase. Verifique as políticas da tabela restricoes.'
      )
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div
      style={{
        maxWidth: 1200,
        margin: '24px auto',
        padding: '0 16px',
        fontFamily:
          'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial'
      }}
    >
      <h2 style={{ color: '#7f1d1d', marginBottom: 6 }}>
        Enviar Restrição
      </h2>

      <p style={{ color: '#6b7280', marginTop: 0 }}>
        Selecione a data e os períodos que você não poderá estar disponível.
        </p>
        <p style={{ color: '#7f1d1d', marginTop: 0 }}>
        !Para quem não puder ir no ensaio de manhã, colocar: Nome, Data (Todos os sábados que não puder ir), Períodos (Noite). Por favor e obrigado.
      </p>

      <form
        onSubmit={enviarRestricao}
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 220px',
          gap: 12,
          background: '#ffffff',
          padding: 16,
          borderRadius: 12,
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
          border: '1px solid #eef2f6'
        }}
      >
        <div>
          <label
            style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 6
            }}
          >
            Seu nome
          </label>

          <div
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: 10,
              borderRadius: 8,
              border: '1px solid #e6e9ee',
              background: '#f8fafc',
              color: '#111827',
              fontWeight: 600
            }}
          >
            {usuarioLogado?.nome || 'Carregando usuário...'}
          </div>
        </div>

        <div>
          <label
            style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 6
            }}
          >
            Data
          </label>

          <input
            type="date"
            value={data}
            onChange={(event) => setData(event.target.value)}
            disabled={!usuarioLogado || enviando}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: 10,
              borderRadius: 8,
              border: '1px solid #e6e9ee',
              background: enviando ? '#f3f4f6' : '#fff'
            }}
          />
        </div>

        <div style={{ gridColumn: '1 / span 2' }}>
          <label
            style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 8
            }}
          >
            Períodos
          </label>

          <div style={{ display: 'flex', gap: 10 }}>
            {['Manhã', 'Noite'].map((periodo) => (
              <button
                key={periodo}
                type="button"
                disabled={!usuarioLogado || enviando}
                onClick={() => togglePeriodo(periodo)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 10,
                  border: periodos.includes(periodo)
                    ? '1px solid #7f1d1d'
                    : '1px solid #e6e9ee',
                  background: periodos.includes(periodo) ? '#7f1d1d' : '#fff',
                  color: periodos.includes(periodo) ? '#fff' : '#111',
                  cursor: enviando ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  opacity: enviando ? 0.65 : 1
                }}
              >
                {periodo}
              </button>
            ))}
          </div>
        </div>

        <div style={{ gridColumn: '1 / span 2', textAlign: 'right' }}>
          <button
            type="submit"
            className="btn-vinho"
            disabled={!usuarioLogado || enviando}
            style={{
              padding: '10px 16px',
              borderRadius: 10,
              cursor: enviando ? 'not-allowed' : 'pointer',
              opacity: enviando ? 0.65 : 1
            }}
          >
            {enviando ? 'Enviando...' : 'Enviar restrição'}
          </button>
        </div>
      </form>

      <div style={{ marginTop: 18 }}>
        <div
          style={{
            background: '#fff',
            padding: 12,
            borderRadius: 12,
            boxShadow: '0 8px 20px rgba(15,23,42,0.04)',
            border: '1px solid #eef2f6',
            maxHeight: 600,
            overflow: 'auto'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '6px 8px'
            }}
          >
            <h3 style={{ margin: 0, color: '#111', fontSize: 15 }}>
              Restrições Pendentes
            </h3>

            <div style={{ color: '#6b7280', fontSize: 12 }}>
              {restricoes.length} itens
            </div>
          </div>

          <div style={{ marginTop: 8, display: 'grid', gap: 8 }}>
            {loading ? (
              <div
                style={{
                  padding: 12,
                  textAlign: 'center',
                  color: '#9ca3af',
                  fontSize: 13
                }}
              >
                Carregando restrições...
              </div>
            ) : restricoes.length === 0 ? (
              <div
                style={{
                  padding: 12,
                  textAlign: 'center',
                  color: '#9ca3af',
                  fontSize: 13
                }}
              >
                Nenhuma restrição enviada.
              </div>
            ) : (
              restricoes.map((restricao) => (
                <div
                  key={restricao.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 10px',
                    borderRadius: 10,
                    border: '1px solid #f3f4f6',
                    background: '#fff'
                  }}
                >
                  <div style={{ fontSize: 13 }}>
                    <div style={{ fontWeight: 700 }}>
                      {restricao.responsavel}
                    </div>

                    <div style={{ color: '#6b7280', fontSize: 12 }}>
                      {new Date(
                        `${restricao.data}T00:00:00`
                      ).toLocaleDateString('pt-BR')}{' '}
                      •{' '}
                      {Array.isArray(restricao.periodo)
                        ? restricao.periodo.join(', ')
                        : restricao.periodo}
                    </div>
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