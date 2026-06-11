export default function TarjetaPaciente({ paciente, onEditar, onEliminar, esAdmin }) {
  const iniciales = paciente.nombre
    .split(' ')
    .slice(0, 2)
    .map(w => w.charAt(0).toUpperCase())
    .join('')

  return (
    <div
      className="card card-hover rounded-2xl px-5 py-4 flex items-center gap-4"
    >
      {/* Avatar */}
      <div 
        className="avatar flex-shrink-0 text-sm overflow-hidden" 
        style={{ background: paciente.foto ? 'transparent' : undefined }}
      >
        {paciente.foto ? (
          <img src={paciente.foto} alt={paciente.nombre} className="w-full h-full object-cover" />
        ) : (
          iniciales
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold truncate" style={{ color: '#1D1D1B' }}>
          {paciente.nombre}
        </h3>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 mt-0.5">
          <p className="text-xs flex items-center gap-1" style={{ color: '#B2B2B2' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.57a16 16 0 0 0 6.29 6.29l.94-.94a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            {paciente.telefono}
          </p>
          {paciente.email && (
            <p className="text-xs flex items-center gap-1 hidden sm:flex" style={{ color: '#B2B2B2' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              {paciente.email}
            </p>
          )}
          {esAdmin && paciente.doctor && (
            <p className="text-xs flex items-center gap-1.5" style={{ color: '#2B7A9B' }}>
              {paciente.doctor.foto ? (
                <img src={paciente.doctor.foto} alt={paciente.doctor.nombre} className="w-4 h-4 rounded-full object-cover" />
              ) : (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              )}
              {paciente.doctor.nombre}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-shrink-0">
        <button onClick={() => onEditar(paciente)} className="btn-ghost text-xs px-3 py-1.5">
          <span className="hidden sm:inline">Editar</span>
          <span className="sm:hidden">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </span>
        </button>
        <button onClick={() => onEliminar(paciente.id)} className="btn-danger text-xs px-3 py-1.5">
          <span className="hidden sm:inline">Eliminar</span>
          <span className="sm:hidden">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
            </svg>
          </span>
        </button>
      </div>
    </div>
  )
}
