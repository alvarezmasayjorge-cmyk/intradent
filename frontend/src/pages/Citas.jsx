import { useState, useEffect, useRef } from 'react'
import api from '../lib/api'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
import FormCita from '../components/FormCita'
import Notificacion from '../components/Notificacion'
import Modal from '../components/Modal'

const API_CITAS = '/api/citas'
const API_PACIENTES = '/api/pacientes'
const API_USUARIOS = '/api/usuarios'

const decodeToken = (t) => { try { return JSON.parse(atob(t.split('.')[1])) } catch { return null } }

const ESTADO_COLORS = {
  agendo: '#e6a817',
  confirmo: '#2B7A9B',
  asistio: '#3b82f6',
  reprogramo: '#6366f1',
  cancelo: '#dc2626',
}

const ESTADO_LABELS = {
  agendo: 'Agendó',
  confirmo: 'Confirmó',
  asistio: 'Asistió',
  reprogramo: 'Reprogramó',
  cancelo: 'Canceló',
}

const LeyendaDot = ({ color, label }) => (
  <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: '#B2B2B2' }}>
    <span
      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
      style={{ backgroundColor: color }}
    />
    {label}
  </span>
)

const useIsMobile = (breakpoint = 768) => {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
  )
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    const handler = (e) => setIsMobile(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [breakpoint])
  return isMobile
}

export default function Citas() {
  const usuario = decodeToken(localStorage.getItem('token'))
  const esAdmin = usuario?.rol === 'admin'
  const isMobile = useIsMobile()
  const calendarRef = useRef(null)

  const [citas, setCitas] = useState([])
  const [pacientes, setPacientes] = useState([])
  const [doctores, setDoctores] = useState([])
  const [mostrarForm, setMostrarForm] = useState(false)
  const [citaEditar, setCitaEditar] = useState(null)
  const [fechaSeleccionada, setFecha] = useState(null)
  const [notificacion, setNotificacion] = useState(null)
  const [modal, setModal] = useState(null)
  const [vistaActiva, setVistaActiva] = useState('listWeek')
  const [busqueda, setBusqueda] = useState('')
  const [mostrarDropdown, setMostrarDropdown] = useState(false)
  const [pacienteInicialId, setPacienteInicialId] = useState('')

  const cargarDatos = async () => {
    const [resCitas, resPacientes] = await Promise.all([
      api.get(API_CITAS),
      api.get(API_PACIENTES)
    ])
    setCitas(resCitas.data)
    setPacientes(resPacientes.data)
  }

  useEffect(() => {
    cargarDatos()
    if (esAdmin) api.get(API_USUARIOS).then(r => setDoctores(r.data))
  }, [])

  useEffect(() => {
    const api = calendarRef.current?.getApi()
    if (!api) return
    const nuevaVista = isMobile ? 'listWeek' : 'timeGridWeek'
    if (api.view.type !== nuevaVista) {
      api.changeView(nuevaVista)
      setVistaActiva(nuevaVista)
    }
  }, [isMobile])

  const citasFiltradas = citas.filter(c => {
    if (!busqueda) return true;
    return c.paciente.nombre.toLowerCase().includes(busqueda.toLowerCase());
  })

  const pacientesFiltradosDropdown = busqueda
    ? pacientes.filter(p => p.nombre.toLowerCase().includes(busqueda.toLowerCase()))
    : []

  const handleAgendarParaPaciente = (pacienteId, nombre) => {
    setBusqueda(nombre)
    setPacienteInicialId(pacienteId)
    setCitaEditar(null)
    setFecha(null)
    setMostrarForm(true)
    setMostrarDropdown(false)
  }

  const eventosCalendario = citasFiltradas.map(c => {
    const inicio = new Date(c.fecha)
    const fin = new Date(inicio.getTime() + (c.duracion || 30) * 60000)
    return {
      id: c.id,
      title: esAdmin && c.doctor
        ? `${c.paciente.nombre} · ${c.motivo} (${c.doctor.nombre})`
        : `${c.paciente.nombre} · ${c.motivo}`,
      start: c.fecha,
      end: fin.toISOString(),
      backgroundColor: ESTADO_COLORS[c.estado] ?? ESTADO_COLORS.agendo,
      borderColor: 'transparent',
      extendedProps: {
        estado: c.estado,
        duracion: c.duracion,
        telefono: c.paciente.telefono,
        paciente: c.paciente.nombre,
        motivo: c.motivo,
        doctor: c.doctor?.nombre,
      }
    }
  })

  const handleFechaClick = (info) => {
    setFecha(info.dateStr)
    setPacienteInicialId('')
    setCitaEditar(null)
    setMostrarForm(true)
  }

  const handleEventoClick = (info) => {
    const cita = citas.find(c => c.id === parseInt(info.event.id))
    setCitaEditar(cita)
    setMostrarForm(true)
  }

  const handleGuardar = async () => {
    // FormCita ya hizo la llamada API; solo notificar y refrescar
    setNotificacion({ mensaje: citaEditar ? 'Cita actualizada correctamente' : 'Cita creada correctamente', tipo: 'exito' })
    setCitaEditar(null)
    setMostrarForm(false)
    cargarDatos()
  }

  const handleEliminar = (id) => {
    setModal({
      titulo: 'Eliminar cita',
      mensaje: 'Esta acción no se puede deshacer. ¿Estás segura?',
      onConfirmar: async () => {
        await api.delete(`${API_CITAS}/${id}`)
        setModal(null)
        setNotificacion({ mensaje: 'Cita eliminada', tipo: 'error' })
        setCitaEditar(null)
        setMostrarForm(false)
        cargarDatos()
      }
    })
  }

  const cambiarVista = (vista) => {
    const api = calendarRef.current?.getApi()
    if (api) {
      api.changeView(vista)
      setVistaActiva(vista)
    }
  }

  const renderEventoLista = (info) => {
    const { event } = info
    const color = event.backgroundColor
    const estado = event.extendedProps.estado
    return (
      <div className="flex items-center gap-3 py-1 w-full">
        <span
          className="w-1 self-stretch rounded-full flex-shrink-0"
          style={{ backgroundColor: color, minHeight: '32px' }}
        />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm truncate" style={{ color: '#1D1D1B' }}>
            {event.extendedProps.paciente}
          </div>
          <div className="text-xs truncate" style={{ color: '#6b7280' }}>
            {event.extendedProps.motivo}
            {esAdmin && event.extendedProps.doctor ? ` · ${event.extendedProps.doctor}` : ''}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide"
              style={{ backgroundColor: color + '22', color: color }}
            >
              {ESTADO_LABELS[estado] ?? estado}
            </span>
            <span className="text-[11px]" style={{ color: '#9ca3af' }}>
              {event.extendedProps.duracion} min
            </span>
          </div>
        </div>
      </div>
    )
  }

  const renderEventoGrid = (info) => {
    const { event } = info
    return (
      <div className="flex flex-col gap-0.5 p-1 text-xs leading-tight w-full">
        <strong className="truncate text-[11px]">{event.title}</strong>
        <span className="truncate opacity-90 text-[10px] capitalize">
          {ESTADO_LABELS[event.extendedProps.estado] ?? event.extendedProps.estado} | {event.extendedProps.duracion} min
        </span>
        {event.extendedProps.telefono && (
          <span className="truncate opacity-90 text-[10px]">{event.extendedProps.telefono}</span>
        )}
      </div>
    )
  }

  return (
    <div className="p-3 md:p-8 max-w-6xl mx-auto">

      {notificacion && (
        <Notificacion
          mensaje={notificacion.mensaje}
          tipo={notificacion.tipo}
          onCerrar={() => setNotificacion(null)}
        />
      )}
      {modal && (
        <Modal
          titulo={modal.titulo}
          mensaje={modal.mensaje}
          onConfirmar={modal.onConfirmar}
          onCancelar={() => setModal(null)}
        />
      )}

      {/* Header */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 md:mb-6 gap-4"
        style={{ animation: 'fadeInUp 0.4s both' }}
      >
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-bold" style={{ color: '#1D1D1B', fontFamily: "'Bell MT', serif" }}>
            Citas
          </h1>
          <p className="text-xs md:text-sm mt-0.5" style={{ color: '#B2B2B2' }}>
            {citasFiltradas.length} cita{citasFiltradas.length !== 1 ? 's' : ''} registrada{citasFiltradas.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none sm:w-64">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="Buscar paciente..."
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value)
                setMostrarDropdown(true)
              }}
              onFocus={() => setMostrarDropdown(true)}
              onBlur={() => setTimeout(() => setMostrarDropdown(false), 200)}
              className="input w-full"
              style={{ paddingLeft: '2.25rem', paddingTop: '0.5rem', paddingBottom: '0.5rem', minHeight: '38px', margin: 0 }}
            />
            {mostrarDropdown && busqueda && pacientesFiltradosDropdown.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto" style={{ top: '100%' }}>
                {pacientesFiltradosDropdown.map(p => (
                  <button
                    key={p.id}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors border-b border-gray-100 last:border-0"
                    onClick={() => handleAgendarParaPaciente(p.id, p.nombre)}
                  >
                    <div className="font-semibold text-sm text-gray-900">{p.nombre}</div>
                    <div className="text-[11px] text-[#2B7A9B] font-semibold mt-0.5">Seleccionar para agendar</div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            className="btn-primary flex-shrink-0"
            style={{ padding: '0.5rem 1rem', minHeight: '38px' }}
            onClick={() => { setPacienteInicialId(''); setCitaEditar(null); setFecha(null); setMostrarForm(true) }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span className="hidden sm:inline">Nueva cita</span>
            <span className="sm:hidden">Nueva</span>
          </button>
        </div>
      </div>

      {/* Form */}
      {mostrarForm && (
        <FormCita
          cita={citaEditar}
          pacientes={pacientes}
          doctores={doctores}
          esAdmin={esAdmin}
          fechaInicial={fechaSeleccionada}
          pacienteInicialId={pacienteInicialId}
          onGuardar={handleGuardar}
          onEliminar={handleEliminar}
          onCancelar={() => { setMostrarForm(false); setCitaEditar(null) }}
        />
      )}

      {/* Switcher de vista (solo móvil) */}
      {isMobile && (
        <div
          className="flex gap-1.5 mb-3 p-1 rounded-xl"
          style={{ background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
        >
          {[
            { v: 'listWeek', label: 'Lista' },
            { v: 'timeGridDay', label: 'Día' },
            { v: 'dayGridMonth', label: 'Mes' },
          ].map(opt => (
            <button
              key={opt.v}
              onClick={() => cambiarVista(opt.v)}
              className="flex-1 py-2 px-2 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: vistaActiva === opt.v ? '#2B7A9B' : 'transparent',
                color: vistaActiva === opt.v ? '#fff' : '#B2B2B2',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* Calendar */}
      <div
        className="card rounded-2xl overflow-hidden calendar-wrap"
        style={{ animation: 'fadeInUp 0.45s cubic-bezier(0.16,1,0.3,1) 80ms both' }}
      >
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          initialView={isMobile ? 'listWeek' : 'timeGridWeek'}
          headerToolbar={
            isMobile
              ? { left: 'prev,next', center: 'title', right: 'today' }
              : { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek' }
          }
          buttonText={{ today: 'Hoy', month: 'Mes', week: 'Semana', day: 'Día', list: 'Lista' }}
          allDayText="Todo el día"
          noEventsText="No hay citas en este rango"
          events={eventosCalendario}
          eventContent={(info) => (
            info.view.type.startsWith('list') ? renderEventoLista(info) : renderEventoGrid(info)
          )}
          dateClick={handleFechaClick}
          eventClick={handleEventoClick}
          datesSet={(arg) => setVistaActiva(arg.view.type)}
          locale="es"
          height="auto"
          contentHeight={isMobile ? 'auto' : undefined}
          slotMinTime="07:00:00"
          slotMaxTime="20:00:00"
          slotDuration="00:30:00"
          slotLabelInterval="00:30:00"
          slotLabelFormat={{
            hour: 'numeric',
            minute: '2-digit',
            meridiem: 'short'
          }}
          dayMaxEvents={isMobile ? 2 : 4}
          longPressDelay={300}
        />
      </div>

      {/* Leyenda */}
      <div
        className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-4 mt-4 px-1"
        style={{ animation: 'fadeInUp 0.4s cubic-bezier(0.16,1,0.3,1) 160ms both' }}
      >
        <LeyendaDot color="#e6a817" label="Agendó" />
        <LeyendaDot color="#2B7A9B" label="Confirmó" />
        <LeyendaDot color="#3b82f6" label="Asistió" />
        <LeyendaDot color="#6366f1" label="Reprogramó" />
        <LeyendaDot color="#dc2626" label="Canceló" />
      </div>

    </div>
  )
}
