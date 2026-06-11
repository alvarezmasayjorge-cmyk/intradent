export default function TarjetaInsumo({ insumo, onEditar, onEliminar, onAjustarStock }) {
  const stockBajo = insumo.cantidad <= insumo.minimo

  const IconEdit = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  )

  const IconTrash = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
      <line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
    </svg>
  )

  return (
    <div
      className="card p-5 card-hover"
      style={{
        background: stockBajo ? 'var(--warning-bg)' : 'white',
        borderLeft: stockBajo ? '4px solid var(--warning)' : 'none'
      }}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <h3 className="font-semibold" style={{ color: '#1D1D1B', fontSize: '15px' }}>
              {insumo.nombre}
            </h3>
            {stockBajo && (
              <span
                className="text-xs px-2 py-1 rounded-full font-semibold"
                style={{ background: 'var(--warning)', color: 'white' }}
              >
                Stock bajo
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div>
              <p className="text-xs mb-1" style={{ color: '#B2B2B2' }}>Cantidad</p>
              <p className="font-bold text-lg" style={{ color: stockBajo ? 'var(--warning)' : '#2B7A9B' }}>
                {insumo.cantidad}
              </p>
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: '#B2B2B2' }}>Mínimo</p>
              <p className="text-sm font-medium" style={{ color: '#1D1D1B' }}>{insumo.minimo}</p>
            </div>
            {insumo.proveedor && (
              <div>
                <p className="text-xs mb-1" style={{ color: '#B2B2B2' }}>Proveedor</p>
                <p className="text-sm font-medium" style={{ color: '#1D1D1B' }}>{insumo.proveedor}</p>
              </div>
            )}
            {insumo.precio !== null && (
              <div>
                <p className="text-xs mb-1" style={{ color: '#B2B2B2' }}>Precio</p>
                <p className="text-sm font-medium" style={{ color: '#1D1D1B' }}>Bs. {insumo.precio.toFixed(2)}</p>
              </div>
            )}
          </div>

          {/* Quick stock adjustment buttons */}
          <div className="flex gap-2 items-center">
            <button
              onClick={() => onAjustarStock(insumo.id, -1)}
              className="px-3 py-1.5 text-sm font-medium rounded-lg flex items-center gap-1"
              style={{ border: '1px solid #e5e7e5', color: '#B2B2B2' }}
            >
              −
            </button>
            <span className="text-xs px-2" style={{ color: '#B2B2B2' }}>Ajustar</span>
            <button
              onClick={() => onAjustarStock(insumo.id, 1)}
              className="px-3 py-1.5 text-sm font-medium rounded-lg flex items-center gap-1"
              style={{ border: '1px solid #e5e7e5', color: '#2B7A9B' }}
            >
              +
            </button>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => onEditar(insumo)}
            className="p-2 rounded-lg transition-all"
            style={{ background: 'rgba(114, 144, 120, 0.1)', color: '#2B7A9B' }}
            title="Editar"
          >
            <IconEdit />
          </button>
          <button
            onClick={() => onEliminar(insumo.id)}
            className="p-2 rounded-lg transition-all"
            style={{ background: 'rgba(220, 38, 38, 0.1)', color: '#dc2626' }}
            title="Eliminar"
          >
            <IconTrash />
          </button>
        </div>
      </div>
    </div>
  )
}
