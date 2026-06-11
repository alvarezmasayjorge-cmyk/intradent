import { useState, useEffect } from 'react'
import api from '../lib/api'

const API_CITAS     = '/api/citas'
const API_PACIENTES = '/api/pacientes'
const API_INSUMOS   = '/api/insumos'

const decodeToken = (t) => { try { return JSON.parse(atob(t.split('.')[1])) } catch { return null } }
const fmtMonto = (n) => `Bs. ${Number(n || 0).toFixed(2)}`

const ESTADO_COLORS = {
  agendo: '#e6a817', confirmo: '#2B7A9B', asistio: '#3b82f6', reprogramo: '#6366f1', cancelo: '#dc2626'
}
const ESTADO_LABELS = {
  agendo: 'Agendó', confirmo: 'Confirmó', asistio: 'Asistió', reprogramo: 'Reprogramó', cancelo: 'Canceló'
}

// ─── Gráfico de línea SVG ─────────────────────────────────────────────────
function LineChartSVG({ datos }) {
  if (!datos || datos.length === 0) {
    return <div className="flex items-center justify-center h-48"><p className="text-sm" style={{ color: '#B2B2B2' }}>Sin datos de movimientos aún</p></div>
  }

  const W = 500, H = 160, pad = { top: 10, right: 10, bottom: 30, left: 50 }
  const innerW = W - pad.left - pad.right
  const innerH = H - pad.top - pad.bottom

  const allVals = datos.flatMap(d => [d.ingresos || 0, d.egresos || 0])
  const maxVal = Math.max(...allVals, 1)

  const xPos = (i) => pad.left + (datos.length > 1 ? (i / (datos.length - 1)) * innerW : innerW / 2)
  const yPos = (v) => pad.top + innerH - ((v || 0) / maxVal) * innerH

  const linePoints = (key) =>
    datos.map((d, i) => `${xPos(i)},${yPos(d[key])}`).join(' ')

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '180px' }}>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
        const y = pad.top + innerH * (1 - t)
        return (
          <g key={i}>
            <line x1={pad.left} y1={y} x2={W - pad.right} y2={y} stroke="#eaf0f4" strokeWidth="1" />
            <text x={pad.left - 6} y={y + 4} textAnchor="end" fontSize="9" fill="#B2B2B2">
              {Math.round(maxVal * t)}
            </text>
          </g>
        )
      })}
      {/* X labels */}
      {datos.map((d, i) => (
        <text key={i} x={xPos(i)} y={H - 6} textAnchor="middle" fontSize="9" fill="#B2B2B2">{d.label}</text>
      ))}
      {/* Lines */}
      <polyline fill="none" stroke="#22c55e" strokeWidth="2" strokeLinejoin="round" points={linePoints('ingresos')} />
      <polyline fill="none" stroke="#ef4444" strokeWidth="2" strokeLinejoin="round" points={linePoints('egresos')} />
      {/* Dots */}
      {datos.map((d, i) => (
        <g key={i}>
          <circle cx={xPos(i)} cy={yPos(d.ingresos)} r="3" fill="#22c55e" />
          <circle cx={xPos(i)} cy={yPos(d.egresos)}  r="3" fill="#ef4444" />
        </g>
      ))}
      {/* Legend */}
      <circle cx={pad.left} cy={H - 2} r="4" fill="#22c55e" />
      <text x={pad.left + 8} y={H + 1} fontSize="9" fill="#6b7280">Ingresos</text>
      <circle cx={pad.left + 70} cy={H - 2} r="4" fill="#ef4444" />
      <text x={pad.left + 78} y={H + 1} fontSize="9" fill="#6b7280">Egresos</text>
    </svg>
  )
}

// ─── Donut SVG ────────────────────────────────────────────────────────────
function DonutChart({ datos }) {
  if (!datos || datos.length === 0) {
    return <div className="flex items-center justify-center h-48"><p className="text-sm" style={{ color: '#B2B2B2' }}>Sin datos</p></div>
  }

  const total = datos.reduce((s, d) => s + d.value, 0)
  if (total === 0) {
    return <div className="flex items-center justify-center h-48"><p className="text-sm" style={{ color: '#B2B2B2' }}>Sin datos</p></div>
  }

  const cx = 80, cy = 80, r = 60, ri = 38
  let startAngle = -Math.PI / 2

  const arcs = datos.map(d => {
    const angle = (d.value / total) * 2 * Math.PI
    // Full-circle arcs are degenerate in SVG — split into two semicircles
    if (datos.length === 1) {
      return {
        ...d,
        paths: [
          `M ${cx + r} ${cy} A ${r} ${r} 0 1 1 ${cx - r} ${cy} L ${cx - ri} ${cy} A ${ri} ${ri} 0 1 0 ${cx + ri} ${cy} Z`,
          `M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy} L ${cx + ri} ${cy} A ${ri} ${ri} 0 1 0 ${cx - ri} ${cy} Z`
        ]
      }
    }
    const x1 = cx + r * Math.cos(startAngle)
    const y1 = cy + r * Math.sin(startAngle)
    const x2 = cx + r * Math.cos(startAngle + angle)
    const y2 = cy + r * Math.sin(startAngle + angle)
    const x3 = cx + ri * Math.cos(startAngle + angle)
    const y3 = cy + ri * Math.sin(startAngle + angle)
    const x4 = cx + ri * Math.cos(startAngle)
    const y4 = cy + ri * Math.sin(startAngle)
    const large = angle > Math.PI ? 1 : 0
    const path = `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${ri} ${ri} 0 ${large} 0 ${x4} ${y4} Z`
    startAngle += angle
    return { ...d, paths: [path] }
  })

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 160 160" style={{ width: '140px', height: '140px', flexShrink: 0 }}>
        {arcs.map((a, i) => a.paths.map((p, j) => <path key={`${i}-${j}`} d={p} fill={a.color} />))}
      </svg>
      <div className="flex flex-col gap-2">
        {datos.map((d, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
            <span className="text-xs" style={{ color: '#6b7280' }}>{d.name}</span>
            <span className="text-xs font-bold ml-1" style={{ color: '#1D1D1B' }}>{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Iconos ───────────────────────────────────────────────────────────────
const IconCal     = ({ color }) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
const IconUsers   = ({ color }) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
const IconMoney   = ({ color }) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
const IconDebt    = ({ color }) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
const IconEgreso  = ({ color }) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
const IconBalance = ({ color }) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
const IconTrat    = ({ color }) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
const IconAlert   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>

// ─── KPI Card ─────────────────────────────────────────────────────────────
function StatCard({ label, value, Icon, accent, delay, isMoney }) {
  return (
    <div
      className="card card-hover rounded-2xl p-5 relative overflow-hidden"
      style={{ animation: `fadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) ${delay}ms both` }}
    >
      <div className="absolute -top-5 -right-5 w-24 h-24 rounded-full"
        style={{ background: `radial-gradient(circle, ${accent}30 0%, transparent 70%)`, pointerEvents: 'none' }} />
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
        style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }} />
      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4" style={{ background: `${accent}18` }}>
        <Icon color={accent} />
      </div>
      <p className="text-2xl font-bold mb-0.5" style={{ color: '#1D1D1B' }}>
        {isMoney ? fmtMonto(value) : value}
      </p>
      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#B2B2B2' }}>{label}</p>
    </div>
  )
}

function MiniKpi({ label, value, color, Icon }) {
  return (
    <div className="card rounded-xl px-4 py-3 flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}15` }}>
        <Icon color={color} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider truncate" style={{ color: '#B2B2B2' }}>{label}</p>
        <p className="text-base font-bold" style={{ color }}>{fmtMonto(value)}</p>
      </div>
    </div>
  )
}

function SkeletonDashboard() {
  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <div className="skeleton h-24 rounded-2xl mb-6" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {[0,1,2,3].map(i => <div key={i} className="skeleton rounded-2xl" style={{ height: '120px' }} />)}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[0,1,2,3].map(i => <div key={i} className="skeleton rounded-xl" style={{ height: '64px' }} />)}
      </div>
      <div className="grid md:grid-cols-3 gap-6 mb-6">
        <div className="skeleton rounded-2xl md:col-span-2" style={{ height: '240px' }} />
        <div className="skeleton rounded-2xl" style={{ height: '240px' }} />
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="skeleton rounded-2xl" style={{ height: '220px' }} />
        <div className="skeleton rounded-2xl" style={{ height: '220px' }} />
      </div>
    </div>
  )
}

// ─── Dashboard Principal ──────────────────────────────────────────────────
export default function Dashboard({ usuario }) {
  const token = localStorage.getItem('token')
  const user  = usuario || decodeToken(token)
  const esAdmin = user?.rol === 'admin'

  const [citas, setCitas]         = useState([])
  const [pacientes, setPacientes] = useState([])
  const [insumos, setInsumos]     = useState([])
  const [resumen, setResumen]     = useState({ ingresos: 0, egresos: 0, cajaNeta: 0, totalPorCobrar: 0, tratamientos: 0 })
  const [grafico, setGrafico]     = useState([])
  const [usuarios, setUsuarios]   = useState([])
  const [filtroDoctor, setFiltroDoctor] = useState('todos')
  const [cargando, setCargando]   = useState(true)

  useEffect(() => {
    const cargarDatos = async () => {
      setCargando(true)
      try {
        const hoy = new Date().toISOString().split('T')[0]
        const params = new URLSearchParams({
          desde: hoy,
          hasta: hoy,
          ...(filtroDoctor !== 'todos' && { usuarioId: filtroDoctor })
        })

        // Cargamos en grupos para que un fallo en caja no impida ver citas
        const [resCitas, resPacientes] = await Promise.all([
          api.get(API_CITAS),
          api.get(API_PACIENTES)
        ])
        setCitas(resCitas.data || [])
        setPacientes(resPacientes.data || [])

        // Datos financieros — pueden fallar si el backend no ha migrado aún
        try {
          const [resResumen, resGrafico] = await Promise.all([
            api.get(`/api/caja/resumen?${params}`),
            api.get('/api/caja/grafico')
          ])
          setResumen(resResumen.data || { ingresos: 0, egresos: 0, cajaNeta: 0, totalPorCobrar: 0, tratamientos: 0 })
          setGrafico(resGrafico.data || [])
        } catch {
          // Backend aún no tiene el módulo de caja — mostramos ceros
        }

        // Datos de admin
        if (esAdmin) {
          try {
            const [resUsuarios, resInsumos] = await Promise.all([
              api.get('/api/usuarios'),
              api.get(API_INSUMOS)
            ])
            setUsuarios(resUsuarios.data || [])
            setInsumos(resInsumos.data || [])
          } catch {
            // Sin permisos o error — ignorar
          }
        }
      } catch (e) {
        console.error('Error cargando dashboard:', e)
      } finally {
        setCargando(false)
      }
    }
    cargarDatos()
  }, [filtroDoctor])

  if (cargando) return <SkeletonDashboard />

  const hoy = new Date().toDateString()
  const citasHoy = citas.filter(c => new Date(c.fecha).toDateString() === hoy)
  const stockBajo = insumos.filter(i => i.cantidad <= i.minimo && i.minimo > 0)
  const balance = (resumen.ingresos || 0) - (resumen.egresos || 0)

  const estadosCitas = (() => {
    const conteo = {}
    citasHoy.forEach(c => { conteo[c.estado] = (conteo[c.estado] || 0) + 1 })
    const arr = Object.entries(conteo).map(([estado, count]) => ({
      name: ESTADO_LABELS[estado] || estado,
      value: count,
      color: ESTADO_COLORS[estado] || '#ccc'
    }))
    if (arr.length === 0) arr.push({ name: 'Sin citas', value: 1, color: '#e5e7eb' })
    return arr
  })()

  const fechaHoy = new Date().toLocaleDateString('es-BO', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">

      {/* Header */}
      <div
        className="rounded-2xl p-5 md:p-6 mb-6 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1D1D1B 0%, #1a2d35 100%)', animation: 'fadeInUp 0.4s both' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#2B7A9B' }}>Panel de Control</p>
            <h1 className="text-xl md:text-2xl font-bold text-white mb-1" style={{ fontFamily: "'Bell MT', serif" }}>
              Resumen General
            </h1>
            <p className="text-xs capitalize" style={{ color: 'rgba(255,255,255,0.45)' }}>{fechaHoy}</p>
          </div>
          {esAdmin && usuarios.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Alcance:</span>
              <select
                value={filtroDoctor}
                onChange={e => setFiltroDoctor(e.target.value)}
                className="text-xs rounded-lg px-2 py-1 font-medium"
                style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
              >
                <option value="todos">Todos los usuarios</option>
                {usuarios.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* KPIs grandes */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <StatCard label="Citas de Hoy"       value={citasHoy.length}              Icon={IconCal}   accent="#3b82f6" delay={0}   />
        <StatCard label="Pacientes Totales"   value={pacientes.length}             Icon={IconUsers} accent="#2B7A9B" delay={60}  />
        <StatCard label="Ingresos de Hoy"     value={resumen.ingresos || 0}        Icon={IconMoney} accent="#22c55e" delay={120} isMoney />
        <StatCard label="Cuentas por Cobrar"  value={resumen.totalPorCobrar || 0}  Icon={IconDebt}  accent="#f59e0b" delay={180} isMoney />
      </div>

      {/* Mini KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6" style={{ animation: 'fadeInUp 0.5s 220ms both' }}>
        <MiniKpi label="Tratamientos y Pagos" value={resumen.tratamientos || 0}  color="#2B7A9B"                               Icon={IconTrat}    />
        <MiniKpi label="Flujo de Caja Manual" value={resumen.ingresos || 0}      color="#3b82f6"                               Icon={IconMoney}   />
        <MiniKpi label="Egresos del Día"      value={resumen.egresos || 0}       color="#ef4444"                               Icon={IconEgreso}  />
        <MiniKpi label="Balance del Día"      value={balance}                    color={balance >= 0 ? '#22c55e' : '#ef4444'}  Icon={IconBalance} />
      </div>

      {/* Agenda + Alertas */}
      <div className="grid md:grid-cols-3 gap-6 mb-6">

        {/* Agenda del día */}
        <div className="card rounded-2xl overflow-hidden md:col-span-2" style={{ animation: 'fadeInUp 0.5s 260ms both' }}>
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #eaf0f4' }}>
            <div>
              <h2 className="font-semibold" style={{ color: '#1D1D1B' }}>Agenda del Día</h2>
              <p className="text-xs mt-0.5" style={{ color: '#B2B2B2' }}>
                {citasHoy.length} cita{citasHoy.length !== 1 ? 's' : ''} programada{citasHoy.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          {citasHoy.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm" style={{ color: '#B2B2B2' }}>No hay citas programadas para hoy.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid #eaf0f4' }}>
                    {['Hora', 'Paciente', 'Doctor', 'Estado'].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#B2B2B2' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {citasHoy.map((c, i) => (
                    <tr key={c.id} style={{ borderTop: i > 0 ? '1px solid #f0f3f5' : 'none' }}>
                      <td className="px-4 py-3 text-sm font-semibold tabular-nums" style={{ color: '#1D1D1B', whiteSpace: 'nowrap' }}>
                        {new Date(c.fecha).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold" style={{ color: '#1D1D1B' }}>{c.paciente?.nombre || '—'}</p>
                        <p className="text-xs" style={{ color: '#B2B2B2' }}>{c.motivo}</p>
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: '#6b7280' }}>{c.doctor?.nombre || '—'}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: (ESTADO_COLORS[c.estado] || '#ccc') + '20', color: ESTADO_COLORS[c.estado] || '#ccc' }}>
                          {ESTADO_LABELS[c.estado] || c.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Alertas */}
        <div className="card rounded-2xl overflow-hidden" style={{ animation: 'fadeInUp 0.5s 280ms both' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #eaf0f4' }}>
            <h2 className="font-semibold" style={{ color: '#1D1D1B' }}>Alertas Inteligentes</h2>
          </div>
          <div className="p-4 flex flex-col gap-2">
            {!esAdmin && (
              <p className="text-xs text-center py-4" style={{ color: '#B2B2B2' }}>Solo disponible para administradores</p>
            )}
            {esAdmin && stockBajo.length === 0 && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: '#f0fdf4' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                <p className="text-xs font-medium" style={{ color: '#16a34a' }}>Sin alertas de stock</p>
              </div>
            )}
            {esAdmin && stockBajo.map(ins => (
              <div key={ins.id} className="flex items-start gap-2 px-3 py-2.5 rounded-xl" style={{ background: '#fffbeb', border: '1px solid #fcd34d' }}>
                <span style={{ color: '#d97706', marginTop: '1px' }}><IconAlert /></span>
                <p className="text-xs" style={{ color: '#92400e' }}>
                  <strong>Stock bajo:</strong> {ins.nombre} — quedan {ins.cantidad} unidades.
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid md:grid-cols-2 gap-6" style={{ animation: 'fadeInUp 0.5s 320ms both' }}>

        <div className="card rounded-2xl p-5">
          <h2 className="font-semibold mb-0.5" style={{ color: '#1D1D1B' }}>Flujo de Caja — Últimos 7 días</h2>
          <p className="text-xs mb-4" style={{ color: '#B2B2B2' }}>Ingresos vs Egresos diarios</p>
          <LineChartSVG datos={grafico} />
        </div>

        <div className="card rounded-2xl p-5">
          <h2 className="font-semibold mb-0.5" style={{ color: '#1D1D1B' }}>Estado de Citas de Hoy</h2>
          <p className="text-xs mb-4" style={{ color: '#B2B2B2' }}>Distribución por estado</p>
          <DonutChart datos={estadosCitas} />
        </div>
      </div>
    </div>
  )
}
