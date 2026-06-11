export default function Modal({ titulo = '¿Estás segura?', mensaje, onConfirmar, onCancelar }) {
  return (
    <div
      className="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onCancelar() }}
    >
      <div
        className="modal-box bg-white rounded-2xl p-6 w-full max-w-sm"
        style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}
      >
        {/* Icon */}
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center mb-4"
          style={{ background: '#fee2e2' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>

        <h3 className="text-base font-bold mb-1" style={{ color: '#1D1D1B' }}>{titulo}</h3>
        <p className="text-sm mb-6" style={{ color: '#B2B2B2', lineHeight: '1.6' }}>{mensaje}</p>

        <div className="flex gap-3">
          <button onClick={onCancelar} className="btn-ghost flex-1">
            Cancelar
          </button>
          <button
            onClick={onConfirmar}
            className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold text-white transition-all"
            style={{
              background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
              boxShadow: '0 2px 8px rgba(220,38,38,0.3)'
            }}
          >
            Sí, eliminar
          </button>
        </div>
      </div>
    </div>
  )
}
