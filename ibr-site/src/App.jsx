import React from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import Escalas from './pages/Escalas'
import Informativos from './pages/Informativos'
import './index.css'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
        <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
            <Link to="/" className="text-xl font-bold tracking-tight text-blue-600">IBR JG</Link>
            <div className="space-x-6">
              <Link to="/" className="hover:text-blue-500 transition">Início</Link>
              <Link to="/escalas" className="hover:text-blue-500 transition">Escalas</Link>
              <Link to="/informativos" className="hover:text-blue-500 transition">Informativos</Link>
            </div>
          </div>
        </nav>

        <main className="max-w-5xl mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/escalas" element={<Escalas />} />
            <Route path="/informativos" element={<Informativos />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App