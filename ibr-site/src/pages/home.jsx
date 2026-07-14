import React from 'react'
import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="text-center py-20 animate-fade-in">
      <h1 className="text-5xl font-extrabold text-blue-600 mb-4">Bem-vindo à IBR JG</h1>
      <p className="text-xl text-gray-600 mb-8">Acesse informativos, escalas e a agenda da nossa igreja.</p>
      <div className="flex justify-center gap-4">
        <Link to="/escalas" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition">Ver Escalas</Link>
        <Link to="/informativos" className="bg-white text-blue-600 border border-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition">Informativos</Link>
      </div>
    </div>
  )
}