import { useEffect } from 'react'

const TIPOS = {
  exito: {
    bg:     '#e8f3f8',
    border: '#2B7A9B',
    text:   '#175270',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2B7A9B" strokeWidth="2.5" strokeLinecap="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="9 12 11 14 15 10"/>
      </svg>
    )
  },
  error: {
    bg:     '#fff5f5',
    border: '#dc2626',
    text:   '#b91c1c',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
    )
  },
  info: {
    bg:     '#e8f3f8',
    border: '#2B7A9B',
    text:   '#175270',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2B7A9B" strokeWidth="2.5" strokeLinecap="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    )
  }
}

export default function Notificacion({ mensaje, tipo = 'exito', onCerrar }) {
  useEffect(() => {
    const t = setTimeout(onCerrar, 3500)
    return () => clearTimeout(t)
  }, [onCerrar])

  const c = TIPOS[tipo] ?? TIPOS.info

  return (
    <div
      className="notif-enter fixed top-5 right-5 z-50 flex items-center gap-3 rounded-xl px-4 py-3.5"
      style={{
        backgroundColor: c.bg,
        border: `1.5px solid ${c.border}`,
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        minWidth: '260px',
        maxWidth: '360px'
      }}
    >
      <span className="flex-shrink-0">{c.icon}</span>
      <p className="text-sm font-medium flex-1" style={{ color: c.text }}>{mensaje}</p>
      <button
        onClick={onCerrar}
        className="flex-shrink-0 ml-1 rounded-lg p-1 transition-colors"
        style={{ color: c.border }}
        aria-label="Cerrar"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  )
}
