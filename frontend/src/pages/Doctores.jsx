import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import api from '../lib/api'
import Notificacion from '../components/Notificacion'
import Modal from '../components/Modal'
import FormDoctor from '../components/FormDoctor'

export default function Doctores() {
  const [usuarios, setUsuarios]         = useState([])
  const [mostrarForm, setMostrarForm]   = useState(false)
  const [editando, setEditando]         = useState(null)
  const [notificacion, setNotificacion] = useState(null)
  const [modal, setModal]               = useState(null)
  const [doctorSeleccionado, setDoctorSeleccionado] = useState(null)
  const [pacientesDoctor, setPacientesDoctor]       = useState([])
  const [cargandoPacientes, setCargandoPacientes]   = useState(false)

  const cargar = async () => {
    const res = await api.get('/api/usuarios')
    setUsuarios(res.data)
  }

  useEffect(() => { cargar() }, [])

  const handleGuardar = async (datos) => {
    if (editando) {
      await api.put(`/api/usuarios/${editando.id}`, datos)
      setNotificacion({ mensaje: 'Usuario actualizado correctamente', tipo: 'exito' })
    } else {
      await api.post('/api/usuarios', datos)
      setNotificacion({ mensaje: 'Usuario creado correctamente', tipo: 'exito' })
    }
    setEditando(null)
    setMostrarForm(false)
    cargar()
  }

  const handleEliminar = (u) => {
    setModal({
      titulo: `Eliminar a ${u.nombre}`,
      mensaje: 'Se eliminarán también todos sus pacientes y citas. Esta acción no se puede deshacer.',
      onConfirmar: async () => {
        await api.delete(`/api/usuarios/${u.id}`)
        setModal(null)
        setNotificacion({ mensaje: 'Usuario eliminado', tipo: 'error' })
        cargar()
      }
    })
  }

  const handleVerPacientes = async (doctor) => {
    setDoctorSeleccionado(doctor)
    setCargandoPacientes(true)
    try {
      const res = await api.get(`/api/usuarios/${doctor.id}/pacientes`)
      setPacientesDoctor(res.data)
    } catch {
      setPacientesDoctor([])
    } finally {
      setCargandoPacientes(false)
    }
  }

  const admins   = usuarios.filter(u => u.rol === 'admin')
  const doctores = usuarios.filter(u => u.rol === 'doctor')

  const ROL_BADGE = {
    admin:  { bg: '#E3F0F5', color: '#2B7A9B', label: 'Admin'  },
    doctor: { bg: '#f0f4f8', color: '#64748b', label: 'Doctor' },
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      {notificacion && (
        <Notificacion mensaje={notificacion.mensaje} tipo={notificacion.tipo} onCerrar={() => setNotificacion(null)} />
      )}
      {modal && (
        <Modal titulo={modal.titulo} mensaje={modal.mensaje} onConfirmar={modal.onConfirmar} onCancelar={() => setModal(null)} />
      )}

      {/* Modal pacientes del doctor */}
      {doctorSeleccionado && (
        <PacientesModal
          doctor={doctorSeleccionado}
          pacientes={pacientesDoctor}
          cargando={cargandoPacientes}
          onCerrar={() => setDoctorSeleccionado(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6" style={{ animation: 'fadeInUp 0.4s both' }}>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#1D1D1B', fontFamily: "'Bell MT', serif" }}>
            Equipo médico
          </h1>
          <p className="text-sm mt-0.5" style={{ color: '#B2B2B2' }}>
            {usuarios.length} usuario{usuarios.length !== 1 ? 's' : ''} registrado{usuarios.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button className="btn-primary" onClick={() => { setEditando(null); setMostrarForm(true) }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nuevo usuario
        </button>
      </div>

      {mostrarForm && (
        <FormDoctor
          usuario={editando}
          onGuardar={handleGuardar}
          onCancelar={() => { setMostrarForm(false); setEditando(null) }}
        />
      )}

      {/* Admins */}
      {admins.length > 0 && (
        <div className="mb-6" style={{ animation: 'fadeInUp 0.4s cubic-bezier(0.16,1,0.3,1) 60ms both' }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#B2B2B2' }}>
            Administradores
          </p>
          <div className="flex flex-col gap-3">
            {admins.map((u, i) => (
              <UsuarioCard key={u.id} u={u} i={i} badge={ROL_BADGE.admin}
                onEditar={() => { setEditando(u); setMostrarForm(true) }}
                onEliminar={() => handleEliminar(u)}
                onVerPacientes={() => handleVerPacientes(u)} />
            ))}
          </div>
        </div>
      )}

      {/* Doctores */}
      {doctores.length > 0 && (
        <div style={{ animation: 'fadeInUp 0.4s cubic-bezier(0.16,1,0.3,1) 120ms both' }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#B2B2B2' }}>
            Doctores
          </p>
          <div className="flex flex-col gap-3">
            {doctores.map((u, i) => (
              <UsuarioCard key={u.id} u={u} i={i} badge={ROL_BADGE.doctor}
                onEditar={() => { setEditando(u); setMostrarForm(true) }}
                onEliminar={() => handleEliminar(u)}
                onVerPacientes={() => handleVerPacientes(u)} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function PacientesModal({ doctor, pacientes, cargando, onCerrar }) {
  const iniciales = doctor.nombre.split(' ').slice(0, 2).map(w => w.charAt(0).toUpperCase()).join('')
  return createPortal(
    <div className="fixed inset-0 flex flex-col" style={{ background: 'rgba(0,0,0,0.6)', zIndex: 9999 }}>
      <div
        className="flex flex-col bg-white w-full max-w-lg mx-auto mt-auto md:mt-16 md:mb-auto rounded-t-3xl md:rounded-3xl overflow-hidden"
        style={{ maxHeight: '85vh' }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 flex-shrink-0" style={{ borderBottom: '1px solid #eaf0f4' }}>
          <div className="avatar flex-shrink-0 overflow-hidden" style={{ padding: 0 }}>
            {doctor.foto
              ? <img src={doctor.foto} alt={doctor.nombre} className="w-full h-full object-cover" />
              : iniciales
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: '#1D1D1B' }}>{doctor.nombre}</p>
            <p className="text-xs" style={{ color: '#B2B2B2' }}>
              {cargando ? 'Cargando...' : `${pacientes.length} paciente${pacientes.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <button
            onClick={onCerrar}
            style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: '#f5f5f5', color: '#1D1D1B', fontSize: '16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: 'none', cursor: 'pointer', flexShrink: 0
            }}
          >
            ✕
          </button>
        </div>

        {/* Lista */}
        <div className="overflow-y-auto flex-1">
          {cargando ? (
            <div className="flex flex-col gap-3 p-4">
              {[0,1,2].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}
            </div>
          ) : pacientes.length === 0 ? (
            <div className="py-16 text-center">
              <svg className="mx-auto mb-2" style={{ color: '#d1d5db' }} width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <p className="text-sm" style={{ color: '#B2B2B2' }}>Sin pacientes asignados</p>
            </div>
          ) : (
            pacientes.map((p, i) => {
              const ini = p.nombre.split(' ').slice(0, 2).map(w => w.charAt(0).toUpperCase()).join('')
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-3 px-5 py-3.5"
                  style={{ borderBottom: '1px solid #f0f3f5' }}
                >
                  <div className="avatar flex-shrink-0 text-xs" style={{ background: 'linear-gradient(135deg, #B2B2B2, #929292)' }}>
                    {ini}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: '#1D1D1B' }}>{p.nombre}</p>
                    <p className="text-xs" style={{ color: '#B2B2B2' }}>{p.telefono}</p>
                  </div>
                  {p.ultimaCita && (
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs" style={{ color: '#B2B2B2' }}>Última cita</p>
                      <p className="text-xs font-medium" style={{ color: '#1D1D1B' }}>
                        {new Date(p.ultimaCita.fecha).toLocaleDateString('es-BO', { day: '2-digit', month: 'short' })}
                      </p>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

function FotoModal({ src, nombre, onCerrar }) {
  return createPortal(
    <div className="fixed inset-0 flex flex-col" style={{ background: 'rgba(0,0,0,0.95)', zIndex: 9999 }}>
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <p className="text-white text-sm font-semibold truncate flex-1 mr-3">{nombre}</p>
        <button onClick={onCerrar} style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.12)', color: 'white', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', flexShrink: 0 }}>✕</button>
      </div>
      <div className="flex-1 flex items-center justify-center p-6">
        <img src={src} alt={nombre} style={{ width: '100%', maxWidth: '320px', maxHeight: '70vh', objectFit: 'contain', borderRadius: '1rem', boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }} />
      </div>
    </div>,
    document.body
  )
}

function UsuarioCard({ u, i, badge, onEditar, onEliminar, onVerPacientes }) {
  const [verFoto, setVerFoto] = useState(false)
  const iniciales = u.nombre.split(' ').slice(0, 2).map(w => w.charAt(0).toUpperCase()).join('')
  return (
    <div
      className="card card-hover rounded-2xl px-5 py-4 flex items-center gap-4"
      style={{ animation: `fadeInUp 0.4s cubic-bezier(0.16,1,0.3,1) ${i * 40}ms both` }}
    >
      {verFoto && u.foto && <FotoModal src={u.foto} nombre={u.nombre} onCerrar={() => setVerFoto(false)} />}
      <div
        className="avatar flex-shrink-0 overflow-hidden"
        style={{ padding: 0, cursor: u.foto ? 'pointer' : 'default' }}
        onClick={() => u.foto && setVerFoto(true)}
      >
        {u.foto
          ? <img src={u.foto} alt={u.nombre} className="w-full h-full object-cover" />
          : iniciales
        }
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-sm font-semibold" style={{ color: '#1D1D1B' }}>{u.nombre}</h3>
          <span className="badge" style={{ backgroundColor: badge.bg, color: badge.color }}>{badge.label}</span>
        </div>
        <p className="text-xs mt-0.5" style={{ color: '#B2B2B2' }}>{u.email}</p>
        <button
          onClick={onVerPacientes}
          className="text-xs mt-1.5 px-2.5 py-1 rounded-lg flex items-center gap-1.5"
          style={{ color: '#2B7A9B', background: '#E3F0F5', border: 'none', cursor: 'pointer' }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          {u._count.pacientes} paciente{u._count.pacientes !== 1 ? 's' : ''}
          <span style={{ color: '#B2B2B2', margin: '0 2px' }}>·</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          {u._count.citas} cita{u._count.citas !== 1 ? 's' : ''}
        </button>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <button onClick={onEditar} className="btn-ghost text-xs px-3 py-1.5">
          <span className="hidden sm:inline">Editar</span>
          <span className="sm:hidden">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </span>
        </button>
        <button onClick={onEliminar} className="btn-danger text-xs px-3 py-1.5">
          <span className="hidden sm:inline">Eliminar</span>
          <span className="sm:hidden">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            </svg>
          </span>
        </button>
      </div>
    </div>
  )
}
