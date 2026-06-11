import { useState } from 'react'
import api from '../lib/api'

const API = '/api/auth'

export default function Login({ onLogin }) {
  const [form, setForm]       = useState({ email: '', password: '' })
  const [error, setError]     = useState('')
  const [cargando, setCargando] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setCargando(true)
    setError('')
    try {
      const res = await api.post(`${API}/login`, form)
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('usuario', JSON.stringify(res.data.usuario))
      onLogin()
    } catch {
      setError('Email o contraseña incorrectos')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div
      className="min-h-screen flex"
      style={{ background: 'linear-gradient(135deg, #1D1D1B 0%, #1a2d35 55%, #1D1D1B 100%)' }}
    >
      {/* ── Left branding panel (desktop) ── */}
      <div
        className="hidden lg:flex flex-col justify-center items-center w-1/2 p-16 relative overflow-hidden"
        style={{ borderRight: '1px solid rgba(255,255,255,0.05)' }}
      >
        {/* Decorative blobs */}
        <div
          className="absolute rounded-full"
          style={{
            width: '480px', height: '480px',
            top: '-120px', left: '-120px',
            background: 'radial-gradient(circle, rgba(43,122,155,0.18) 0%, transparent 70%)',
            pointerEvents: 'none'
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: '320px', height: '320px',
            bottom: '-80px', right: '-80px',
            background: 'radial-gradient(circle, rgba(43,122,155,0.12) 0%, transparent 70%)',
            pointerEvents: 'none'
          }}
        />

        <div className="relative text-center" style={{ animation: 'fadeInUp 0.6s cubic-bezier(0.16,1,0.3,1)' }}>
          <div
            className="mx-auto mb-8 flex items-center justify-center rounded-3xl"
            style={{
              width: '100px', height: '100px',
              background: 'linear-gradient(135deg, rgba(43,122,155,0.3), rgba(31,99,132,0.15))',
              border: '1px solid rgba(43,122,155,0.3)',
              backdropFilter: 'blur(12px)'
            }}
          >
            <img src="/logo.webp" alt="Intradent" style={{ width: '58px' }} />
          </div>

          <h1
            className="text-4xl font-bold text-white mb-2"
            style={{ fontFamily: "'Bell MT', 'Georgia', serif', letterSpacing: '-0.01em'" }}
          >
            Intradent
          </h1>
          <p className="text-sm tracking-[0.22em] uppercase mb-12 font-medium" style={{ color: '#2B7A9B' }}>
            Odontología Especializada
          </p>

          <div className="flex flex-col gap-4 text-left">
            {[
              'Gestión inteligente de citas',
              'Recordatorios automáticos a pacientes',
              'Control y seguimiento de pacientes',
            ].map((txt, i) => (
              <div
                key={i}
                className="flex items-center gap-3 text-sm"
                style={{
                  color: 'rgba(255,255,255,0.5)',
                  animation: `fadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) ${300 + i * 80}ms both`
                }}
              >
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs"
                  style={{ background: 'rgba(43,122,155,0.25)', color: '#2B7A9B' }}
                >
                  ✓
                </span>
                {txt}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex flex-col justify-center items-center flex-1 p-6">
        <div
          className="w-full max-w-[420px] bg-white rounded-2xl p-8 md:p-10"
          style={{
            boxShadow: '0 32px 80px rgba(0,0,0,0.45)',
            animation: 'scaleIn 0.45s cubic-bezier(0.16,1,0.3,1)'
          }}
        >
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-7">
            <div
              className="mx-auto mb-4 flex items-center justify-center rounded-2xl"
              style={{
                width: '64px', height: '64px',
                background: 'linear-gradient(135deg, #2B7A9B, #1F6384)'
              }}
            >
              <img src="/logo.webp" alt="Intradent" style={{ width: '38px' }} />
            </div>
            <h1 className="text-lg font-bold" style={{ color: '#1D1D1B', fontFamily: "'Bell MT', serif" }}>
              Intradent
            </h1>
            <p className="text-xs tracking-widest uppercase mt-1" style={{ color: '#B2B2B2' }}>
              Odontología Especializada
            </p>
          </div>

          <h2 className="text-2xl font-bold mb-1" style={{ color: '#1D1D1B', fontFamily: "'Bell MT', serif" }}>
            Bienvenido
          </h2>
          <p className="text-sm mb-8" style={{ color: '#B2B2B2' }}>
            Ingresa tus credenciales para continuar
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="form-label">Correo electrónico</label>
              <input
                className="input"
                name="email"
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
                placeholder="correo@ejemplo.com"
              />
            </div>

            <div>
              <label className="form-label">Contraseña</label>
              <input
                className="input"
                name="password"
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div
                className="rounded-xl px-4 py-3 text-sm flex items-center gap-2"
                style={{ background: '#fee2e2', color: '#dc2626', animation: 'fadeInUp 0.3s both' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={cargando}
              className="btn-primary w-full py-3 text-sm font-semibold mt-1"
            >
              {cargando
                ? <span style={{ opacity: 0.8 }}>Ingresando...</span>
                : 'Ingresar al sistema'
              }
            </button>
          </form>

          <p className="text-center text-xs mt-6" style={{ color: '#d1d5db' }}>
            Consultorio Dental Intradent · Acceso restringido
          </p>
        </div>
      </div>
    </div>
  )
}
