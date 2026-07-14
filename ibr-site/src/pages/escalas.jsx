import React from 'react'

const escalaDados = [
  { data: '20/07', recepcao: 'João e Maria', louvor: 'Grupo A', midia: 'Lucas' },
  { data: '27/07', recepcao: 'Pedro e Ana', louvor: 'Grupo B', midia: 'Marta' },
]

export default function Escalas() {
  return (
    <div className="animate-fade-in">
      <h1 className="text-3xl font-bold mb-6">Escalas do Mês</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="p-4 font-semibold text-gray-600">Data</th>
              <th className="p-4 font-semibold text-gray-600">Recepção</th>
              <th className="p-4 font-semibold text-gray-600">Louvor</th>
              <th className="p-4 font-semibold text-gray-600">Mídia</th>
            </tr>
          </thead>
          <tbody>
            {escalaDados.map((item, index) => (
              <tr key={index} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                <td className="p-4 font-medium text-blue-600">{item.data}</td>
                <td className="p-4">{item.recepcao}</td>
                <td className="p-4">{item.louvor}</td>
                <td className="p-4">{item.midia}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}