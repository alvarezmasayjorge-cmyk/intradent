import { useState, Suspense, lazy } from 'react'
import Pacientes from './pages/Pacientes'
import Citas from './pages/Citas'
import Doctores from './pages/Doctores'
import Inventario from './pages/Inventario'
import Login from './pages/Login'

const Dashboard   = lazy(() => import('./pages/Dashboard'))
const FlujoDeCaja = lazy(() => import('./pages/FlujoDeCaja'))

// Decodifica el payload del JWT sin librería externa
const decodeToken = (token) => {
  try { return JSON.parse(atob(token.split('.')[1])) } catch { return null }
}

const IconGrid = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
  </svg>
)
const IconCalendar = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
)
const IconUsers = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)
const IconDoctor = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
)
const IconBox = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>
)
const IconCaja = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
  </svg>
)
const IconLogout = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
)

export default function App() {
  const [pagina, setPagina] = useState('dashboard')
  const [autenticado, setAutenticado] = useState(!!localStorage.getItem('token'))

  const token = localStorage.getItem('token')
  const usuario = token ? (JSON.parse(localStorage.getItem('usuario') || 'null') || decodeToken(token)) : null
  const esAdmin = usuario?.rol === 'admin'

  const navItems = [
    { id: 'dashboard',   label: 'Dashboard',    Icon: IconGrid },
    { id: 'citas',       label: 'Citas',         Icon: IconCalendar },
    { id: 'pacientes',   label: 'Pacientes',     Icon: IconUsers },
    { id: 'flujo-caja',  label: 'Flujo de Caja', Icon: IconCaja },
    ...(esAdmin ? [
      { id: 'doctores',   label: 'Doctores',    Icon: IconDoctor },
      { id: 'inventario', label: 'Inventario',  Icon: IconBox }
    ] : []),
  ]

  const handleLogin  = () => { setAutenticado(true) }
  const handleLogout = () => { localStorage.removeItem('token'); localStorage.removeItem('usuario'); setAutenticado(false) }

  if (!autenticado) return <Login onLogin={handleLogin} />

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#F3F7FA' }}>

      {/* ── Sidebar desktop ── */}
      <aside
        className="hidden md:flex flex-col fixed top-0 left-0 h-screen z-40"
        style={{ width: 'var(--sidebar-w)', backgroundColor: '#1D1D1B' }}
      >
        {/* Logo */}
        <div className="px-5 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #2B7A9B, #1F6384)' }}>
              <img src="/logo.webp" alt="Intradent" style={{ width: '22px' }} />
            </div>
            <div className="overflow-hidden">
              <h1 className="text-sm font-bold text-white leading-tight truncate">Intradent</h1>
              <p className="text-xs font-medium" style={{ color: '#2B7A9B' }}>Odontología Especializada</p>
            </div>
          </div>
        </div>

        {/* Usuario activo */}
        {usuario && (
          <div className="px-5 pt-4 pb-2 flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden text-sm font-bold text-white"
              style={{ background: usuario.foto ? 'transparent' : 'linear-gradient(135deg, #2B7A9B, #1F6384)' }}
            >
              {usuario.foto
                ? <img src={usuario.foto} alt={usuario.nombre} className="w-full h-full object-cover" />
                : usuario.nombre.charAt(0).toUpperCase()
              }
            </div>
            <div className="overflow-hidden">
              <p className="text-xs truncate font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>
                {usuario.nombre}
              </p>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-semibold mt-0.5 inline-block"
                style={{
                  background: esAdmin ? 'rgba(43,122,155,0.25)' : 'rgba(255,255,255,0.08)',
                  color: esAdmin ? '#2B7A9B' : 'rgba(255,255,255,0.4)'
                }}
              >
                {esAdmin ? 'Admin' : 'Doctor'}
              </span>
            </div>
          </div>
        )}

        <div className="px-5 pt-3 pb-2">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.2)' }}>
            Menú
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 flex flex-col gap-0.5">
          {navItems.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setPagina(id)}
              className={`nav-item${pagina === id ? ' active' : ''}`}
            >
              <Icon />{label}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 pb-5 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={handleLogout} className="nav-item" style={{ color: 'rgba(255,255,255,0.35)' }}>
            <IconLogout />Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 pb-20 md:pb-0">
        <div className="md:ml-[260px]">

          {/* Mobile header */}
          <header
            className="md:hidden sticky top-0 z-30 bg-white px-4 py-3 flex justify-between items-center"
            style={{ borderBottom: '1px solid #eaf0f4', boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #2B7A9B, #1F6384)' }}>
                <img src="/logo.webp" alt="Intradent" style={{ width: '16px' }} />
              </div>
              <span className="text-sm font-bold truncate max-w-[160px]" style={{ color: '#1D1D1B' }}>
                {usuario?.nombre || 'Intradent'}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="text-xs px-3 py-1.5 rounded-lg flex-shrink-0"
              style={{ border: '1px solid #e5e7e5', color: '#B2B2B2' }}
            >
              Salir
            </button>
          </header>

          <div key={pagina} className="page-enter">
            <Suspense fallback={<div className="p-8 text-center" style={{ color: '#B2B2B2', fontSize: '14px' }}>Cargando…</div>}>
              {pagina === 'dashboard'   && <Dashboard usuario={usuario} />}
              {pagina === 'citas'       && <Citas />}
              {pagina === 'pacientes'   && <Pacientes />}
              {pagina === 'flujo-caja'  && <FlujoDeCaja />}
              {pagina === 'doctores'    && esAdmin && <Doctores />}
              {pagina === 'inventario'  && esAdmin && <Inventario />}
            </Suspense>
          </div>
        </div>
      </main>

      {/* ── Bottom nav móvil ── */}
      <nav
        className="fixed bottom-0 left-0 right-0 bg-white md:hidden z-40 flex"
        style={{ borderTop: '1px solid #eaf0f4', boxShadow: '0 -4px 20px rgba(0,0,0,0.07)' }}
      >
        {navItems.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setPagina(id)}
            className="flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-all"
            style={{ color: pagina === id ? '#2B7A9B' : '#B2B2B2' }}
          >
            <span style={{
              transform: pagina === id ? 'scale(1.15)' : 'scale(1)',
              transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}>
              <Icon />
            </span>
            {label}
          </button>
        ))}
      </nav>

    </div>
  )
}
