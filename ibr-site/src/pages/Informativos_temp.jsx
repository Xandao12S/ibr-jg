import React from 'react'

const avisos = [
  { id: 1, titulo: 'Culto de Celebração', data: 'Domingo às 18h', desc: 'Esperamos por você e sua família para um tempo precioso.' },
  { id: 2, titulo: 'Culto de Comunhão', data: 'Quarta às 20h', desc: 'Alinhamento para o próximo trimestre.' },
]

export default function Informativos() {
  return (
    <div className="animate-fade-in">
      <h1 className="text-3xl font-bold mb-6">Informativos</h1>
      <div className="grid gap-6">
        {avisos.map(aviso => (
          <div key={aviso.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
            <span className="text-sm font-semibold text-blue-500 uppercase">{aviso.data}</span>
            <h2 className="text-xl font-bold mt-1">{aviso.titulo}</h2>
            <p className="text-gray-600 mt-2">{aviso.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}