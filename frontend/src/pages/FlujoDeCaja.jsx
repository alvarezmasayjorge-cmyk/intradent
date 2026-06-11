import { useState, useEffect } from 'react'
import api from '../lib/api'
import { CATEGORIAS_INGRESO, CATEGORIAS_EGRESO } from '../constants/categorias'

const decodeToken = (t) => { try { return JSON.parse(atob(t.split('.')[1])) } catch { return null } }

const hoyStr = () => new Date().toISOString().split('T')[0]

const fmtMonto = (n) => `Bs. ${Number(n || 0).toFixed(2)}`

const fmtFecha = (f) =>
  new Date(f).toLocaleString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

const diasPendiente = (fecha) => {
  const diff = Date.now() - new Date(fecha).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

// ─── Iconos ───────────────────────────────────────────────────────────────
const IconIngresos = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
  </svg>
)
const IconEgresos = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>
  </svg>
)
const IconCaja = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
  </svg>
)
const IconDeudores = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)

// ─── KPI Card ─────────────────────────────────────────────────────────────
function KpiCard({ label, monto, Icon, color, sub }) {
  return (
    <div className="card rounded-2xl p-5 flex flex-col gap-2" style={{ borderTop: `3px solid ${color}` }}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#B2B2B2' }}>{label}</span>
        <span style={{ color }}><Icon /></span>
      </div>
      <p className="text-2xl font-bold" style={{ color: '#1D1D1B' }}>{fmtMonto(monto)}</p>
      {sub && <p className="text-xs" style={{ color: '#B2B2B2' }}>{sub}</p>}
    </div>
  )
}

// ─── Modal Movimiento ─────────────────────────────────────────────────────
function ModalMovimiento({ onGuardar, onCerrar }) {
  const [form, setForm] = useState({ tipo: 'INGRESO', categoria: 'Consulta', concepto: '', monto: '', fecha: hoyStr() })
  const [guardando, setGuardando] = useState(false)

  const categorias = form.tipo === 'INGRESO' ? CATEGORIAS_INGRESO : CATEGORIAS_EGRESO

  const handleTipo = (tipo) => {
    const cat = tipo === 'INGRESO' ? CATEGORIAS_INGRESO[0] : CATEGORIAS_EGRESO[0]
    setForm(f => ({ ...f, tipo, categoria: cat }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setGuardando(true)
    try {
      await onGuardar(form)
      onCerrar()
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)' }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" style={{ animation: 'fadeInUp 0.25s both' }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-lg" style={{ color: '#1D1D1B' }}>Registrar Movimiento</h3>
          <button onClick={onCerrar} style={{ color: '#B2B2B2' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Tipo */}
          <div>
            <label className="form-label">Tipo</label>
            <div className="grid grid-cols-2 gap-2">
              {['INGRESO', 'EGRESO'].map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleTipo(t)}
                  className="py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    border: form.tipo === t ? `2px solid ${t === 'INGRESO' ? '#22c55e' : '#ef4444'}` : '2px solid #e5e7e5',
                    background: form.tipo === t ? (t === 'INGRESO' ? '#f0fdf4' : '#fef2f2') : '#fff',
                    color: form.tipo === t ? (t === 'INGRESO' ? '#16a34a' : '#dc2626') : '#B2B2B2',
                  }}
                >
                  {t === 'INGRESO' ? '↑ Ingreso' : '↓ Egreso'}
                </button>
              ))}
            </div>
          </div>

          {/* Categoría */}
          <div>
            <label className="form-label">Categoría</label>
            <select value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))} className="input">
              {categorias.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Concepto */}
          <div>
            <label className="form-label">Concepto</label>
            <input
              type="text"
              placeholder="Descripción del movimiento"
              value={form.concepto}
              onChange={e => setForm(f => ({ ...f, concepto: e.target.value }))}
              required
              className="input"
            />
          </div>

          {/* Monto + Fecha */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Monto (Bs.)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.monto}
                onChange={e => setForm(f => ({ ...f, monto: e.target.value }))}
                required
                className="input"
              />
            </div>
            <div>
              <label className="form-label">Fecha</label>
              <input
                type="date"
                value={form.fecha}
                onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
                className="input"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onCerrar} className="btn-ghost flex-1">Cancelar</button>
            <button type="submit" className="btn-primary flex-1" disabled={guardando}>
              {guardando ? 'Guardando…' : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Modal Pagar Deudor ───────────────────────────────────────────────────
function ModalPagar({ deudor, onConfirmar, onCerrar }) {
  const [registrarIngreso, setRegistrarIngreso] = useState(true)
  const [guardando, setGuardando] = useState(false)

  const handleConfirmar = async () => {
    setGuardando(true)
    try { await onConfirmar(registrarIngreso) } finally { setGuardando(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)' }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6" style={{ animation: 'fadeInUp 0.25s both' }}>
        <h3 className="font-bold text-lg mb-2" style={{ color: '#1D1D1B' }}>Marcar como pagado</h3>
        <p className="text-sm mb-4" style={{ color: '#B2B2B2' }}>
          <strong style={{ color: '#1D1D1B' }}>{deudor.paciente.nombre}</strong> — {deudor.concepto}<br />
          Monto: <strong style={{ color: '#22c55e' }}>{fmtMonto(deudor.monto)}</strong>
        </p>

        <label className="flex items-center gap-3 p-3 rounded-xl cursor-pointer mb-4"
          style={{ background: registrarIngreso ? '#f0fdf4' : '#f9fafb', border: `1.5px solid ${registrarIngreso ? '#22c55e' : '#e5e7e5'}` }}>
          <input
            type="checkbox"
            checked={registrarIngreso}
            onChange={e => setRegistrarIngreso(e.target.checked)}
            className="w-4 h-4 accent-green-500"
          />
          <span className="text-sm font-medium" style={{ color: '#1D1D1B' }}>
            Registrar como ingreso en Flujo de Caja
          </span>
        </label>

        <div className="flex gap-3">
          <button onClick={onCerrar} className="btn-ghost flex-1">Cancelar</button>
          <button onClick={handleConfirmar} className="btn-primary flex-1" disabled={guardando}
            style={{ background: '#22c55e', borderColor: '#22c55e' }}>
            {guardando ? 'Guardando…' : 'Confirmar pago'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Página Principal ─────────────────────────────────────────────────────
export default function FlujoDeCaja() {
  const usuario = decodeToken(localStorage.getItem('token'))
  const esAdmin = usuario?.rol === 'admin'

  const [resumen, setResumen]         = useState({ ingresos: 0, egresos: 0, cajaNeta: 0, totalPorCobrar: 0 })
  const [movimientos, setMovimientos] = useState([])
  const [deudores, setDeudores]       = useState([])
  const [usuarios, setUsuarios]       = useState([])
  const [tab, setTab]                 = useState('movimientos')
  const [mostrarModal, setMostrarModal] = useState(false)
  const [deudorPagar, setDeudorPagar]   = useState(null)
  const [cargando, setCargando]         = useState(true)

  const [filtros, setFiltros] = useState({
    desde: hoyStr(), hasta: hoyStr(), usuarioId: 'todos', tipo: 'todos'
  })
  const [filtrosActivos, setFiltrosActivos] = useState({ ...filtros })

  const cargarTodo = async (f = filtrosActivos) => {
    setCargando(true)
    try {
      const params = new URLSearchParams({
        desde: f.desde, hasta: f.hasta,
        ...(f.usuarioId !== 'todos' && { usuarioId: f.usuarioId }),
        ...(f.tipo !== 'todos' && { tipo: f.tipo })
      })
      const [resRes, movRes, deuRes] = await Promise.all([
        api.get(`/api/caja/resumen?${params}`),
        api.get(`/api/caja/movimientos?${params}`),
        api.get('/api/caja/deudores?estado=PENDIENTE')
      ])
      setResumen(resRes.data)
      setMovimientos(movRes.data)
      setDeudores(deuRes.data)
    } catch (e) {
      console.error('Error cargando flujo:', e)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    if (esAdmin) api.get('/api/usuarios').then(r => setUsuarios(r.data))
    cargarTodo()
  }, [])

  const handleFiltrar = () => {
    setFiltrosActivos({ ...filtros })
    cargarTodo(filtros)
  }

  const handleLimpiar = () => {
    const reset = { desde: hoyStr(), hasta: hoyStr(), usuarioId: 'todos', tipo: 'todos' }
    setFiltros(reset)
    setFiltrosActivos(reset)
    cargarTodo(reset)
  }

  const handleGuardarMovimiento = async (form) => {
    await api.post('/api/caja/movimientos', form)
    cargarTodo()
  }

  const handleEliminarMovimiento = async (id) => {
    if (!window.confirm('¿Eliminar este movimiento?')) return
    await api.delete(`/api/caja/movimientos/${id}`)
    cargarTodo()
  }

  const handlePagarDeudor = async (registrarIngreso) => {
    await api.patch(`/api/caja/deudores/${deudorPagar.id}/pagar`, { registrarIngreso })
    setDeudorPagar(null)
    cargarTodo()
  }

  const handleExportPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf')
      const { default: autoTable } = await import('jspdf-autotable')

      const doc = new jsPDF()
      doc.setFontSize(16)
      doc.text('Flujo de Caja', 14, 18)
      doc.setFontSize(10)
      doc.setTextColor(120)
      doc.text(`Período: ${filtrosActivos.desde} al ${filtrosActivos.hasta}`, 14, 26)
      doc.text(`Ingresos: Bs. ${(resumen.ingresos || 0).toFixed(2)}   Egresos: Bs. ${(resumen.egresos || 0).toFixed(2)}   Caja Neta: Bs. ${(resumen.cajaNeta || 0).toFixed(2)}`, 14, 32)
      doc.setTextColor(0)
      autoTable(doc, {
        startY: 40,
        head: [['Fecha', 'Tipo', 'Categoría', 'Concepto', 'Monto', 'Usuario']],
        body: movimientos.map(m => [
          fmtFecha(m.fecha),
          m.tipo,
          m.categoria,
          m.concepto,
          `Bs. ${m.monto.toFixed(2)}`,
          m.usuario?.nombre || ''
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [114, 144, 120] }
      })
      doc.save(`flujo-caja-${filtrosActivos.desde}-${filtrosActivos.hasta}.pdf`)
    } catch (e) {
      console.error('Error generando PDF:', e)
      alert('Error al generar el PDF. Intenta de nuevo.')
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">

      {mostrarModal && (
        <ModalMovimiento onGuardar={handleGuardarMovimiento} onCerrar={() => setMostrarModal(false)} />
      )}
      {deudorPagar && (
        <ModalPagar deudor={deudorPagar} onConfirmar={handlePagarDeudor} onCerrar={() => setDeudorPagar(null)} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6" style={{ animation: 'fadeInUp 0.4s both' }}>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#1D1D1B', fontFamily: "'Bell MT', serif" }}>
            Flujo de Caja
          </h1>
          <p className="text-sm mt-0.5" style={{ color: '#B2B2B2' }}>Control de ingresos, egresos y cuentas por cobrar</p>
        </div>
        <button className="btn-primary" onClick={() => setMostrarModal(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          <span className="hidden sm:inline">Registrar Movimiento</span>
          <span className="sm:hidden">Nuevo</span>
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6" style={{ animation: 'fadeInUp 0.45s both' }}>
        <KpiCard label="Ingresos Totales"   monto={resumen.ingresos}        Icon={IconIngresos} color="#22c55e" sub={`Período filtrado`} />
        <KpiCard label="Egresos Totales"    monto={resumen.egresos}         Icon={IconEgresos}  color="#ef4444" sub={`Período filtrado`} />
        <KpiCard label="Caja Neta"          monto={resumen.cajaNeta}        Icon={IconCaja}     color="#3b82f6" sub="Ingresos − Egresos" />
        <KpiCard label="Cuentas por Cobrar" monto={resumen.totalPorCobrar}  Icon={IconDeudores} color="#f59e0b" sub={`${deudores.length} deudor${deudores.length !== 1 ? 'es' : ''}`} />
      </div>

      {/* Filtros */}
      <div className="card rounded-2xl p-4 mb-6" style={{ animation: 'fadeInUp 0.5s both' }}>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="form-label">Desde</label>
            <input type="date" value={filtros.desde} onChange={e => setFiltros(f => ({ ...f, desde: e.target.value }))} className="input" style={{ width: '140px' }} />
          </div>
          <div>
            <label className="form-label">Hasta</label>
            <input type="date" value={filtros.hasta} onChange={e => setFiltros(f => ({ ...f, hasta: e.target.value }))} className="input" style={{ width: '140px' }} />
          </div>
          {esAdmin && (
            <div>
              <label className="form-label">Usuario</label>
              <select value={filtros.usuarioId} onChange={e => setFiltros(f => ({ ...f, usuarioId: e.target.value }))} className="input" style={{ width: '160px' }}>
                <option value="todos">Todos los usuarios</option>
                {usuarios.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="form-label">Tipo</label>
            <select value={filtros.tipo} onChange={e => setFiltros(f => ({ ...f, tipo: e.target.value }))} className="input" style={{ width: '130px' }}>
              <option value="todos">Todos</option>
              <option value="ingreso">Ingreso</option>
              <option value="egreso">Egreso</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={handleFiltrar} className="btn-primary">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              Filtrar
            </button>
            <button onClick={handleLimpiar} className="btn-ghost">Limpiar</button>
            <button onClick={handleExportPDF} className="btn-ghost flex items-center gap-1.5"
              style={{ background: '#1D1D1B', color: '#fff', border: 'none' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
              </svg>
              PDF Caja
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card rounded-2xl overflow-hidden" style={{ animation: 'fadeInUp 0.55s both' }}>
        <div className="flex" style={{ borderBottom: '1px solid #eaf0f4' }}>
          {[
            { id: 'movimientos', label: 'Movimientos', count: movimientos.length },
            { id: 'deudores', label: 'Deudores', count: deudores.length }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="px-6 py-4 text-sm font-semibold flex items-center gap-2 transition-all"
              style={{
                color: tab === t.id ? '#2B7A9B' : '#B2B2B2',
                borderBottom: tab === t.id ? '2px solid #2B7A9B' : '2px solid transparent',
                background: 'transparent'
              }}
            >
              {t.label}
              {t.count > 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                  style={{ background: tab === t.id ? '#E3F0F5' : '#f3f4f6', color: tab === t.id ? '#2B7A9B' : '#9ca3af' }}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Movimientos */}
        {tab === 'movimientos' && (
          <div>
            {cargando ? (
              <div className="p-8 text-center text-sm" style={{ color: '#B2B2B2' }}>Cargando…</div>
            ) : movimientos.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-sm font-medium" style={{ color: '#B2B2B2' }}>No hay movimientos en el período seleccionado</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid #eaf0f4' }}>
                      {['Fecha y Hora', 'Tipo', 'Categoría', 'Concepto / Detalle', 'Monto', 'Usuario', ''].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#B2B2B2' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {movimientos.map((m, i) => (
                      <tr key={m.id} style={{ borderTop: i > 0 ? '1px solid #f0f3f5' : 'none' }}>
                        <td className="px-4 py-3 text-xs" style={{ color: '#6b7280', whiteSpace: 'nowrap' }}>
                          {fmtFecha(m.fecha)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                            style={{
                              background: m.tipo === 'INGRESO' ? '#f0fdf4' : '#fef2f2',
                              color: m.tipo === 'INGRESO' ? '#16a34a' : '#dc2626'
                            }}>
                            {m.tipo === 'INGRESO' ? '↑ Ingreso' : '↓ Egreso'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm" style={{ color: '#6b7280' }}>{m.categoria}</td>
                        <td className="px-4 py-3 text-sm font-medium" style={{ color: '#1D1D1B' }}>{m.concepto}</td>
                        <td className="px-4 py-3 text-sm font-bold tabular-nums"
                          style={{ color: m.tipo === 'INGRESO' ? '#16a34a' : '#dc2626' }}>
                          {m.tipo === 'EGRESO' ? '−' : '+'}{fmtMonto(m.monto)}
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: '#B2B2B2' }}>{m.usuario?.nombre}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => handleEliminarMovimiento(m.id)}
                            className="text-xs px-2 py-1 rounded-lg transition-colors hover:bg-red-50"
                            style={{ color: '#dc2626' }}>
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab Deudores */}
        {tab === 'deudores' && (
          <div>
            {deudores.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-sm font-medium" style={{ color: '#B2B2B2' }}>No hay deudores pendientes</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid #eaf0f4' }}>
                      {['Paciente', 'Concepto', 'Monto', 'Fecha Cita', 'Días Pendiente', 'Acción'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#B2B2B2' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {deudores.map((d, i) => {
                      const dias = diasPendiente(d.createdAt)
                      return (
                        <tr key={d.id} style={{ borderTop: i > 0 ? '1px solid #f0f3f5' : 'none' }}>
                          <td className="px-4 py-3">
                            <p className="text-sm font-semibold" style={{ color: '#1D1D1B' }}>{d.paciente.nombre}</p>
                            <p className="text-xs" style={{ color: '#B2B2B2' }}>{d.paciente.telefono}</p>
                          </td>
                          <td className="px-4 py-3 text-sm" style={{ color: '#6b7280' }}>{d.concepto}</td>
                          <td className="px-4 py-3 text-sm font-bold tabular-nums" style={{ color: '#f59e0b' }}>
                            {fmtMonto(d.monto)}
                          </td>
                          <td className="px-4 py-3 text-xs" style={{ color: '#6b7280', whiteSpace: 'nowrap' }}>
                            {d.cita ? new Date(d.cita.fecha).toLocaleDateString('es-BO') : '—'}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                              style={{ background: dias > 30 ? '#fef2f2' : '#fffbeb', color: dias > 30 ? '#dc2626' : '#d97706' }}>
                              {dias} día{dias !== 1 ? 's' : ''}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => setDeudorPagar(d)}
                              className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors"
                              style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}
                            >
                              Marcar Pagado
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
