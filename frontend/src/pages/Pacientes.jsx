import { useState, useEffect } from 'react'
import api from '../lib/api'
import FormPaciente from '../components/FormPaciente'
import TarjetaPaciente from '../components/TarjetaPaciente'
import Notificacion from '../components/Notificacion'
import Modal from '../components/Modal'

const API = '/api/pacientes'

const decodeToken = (t) => { try { return JSON.parse(atob(t.split('.')[1])) } catch { return null } }

export default function Pacientes() {
  const usuario = decodeToken(localStorage.getItem('token'))
  const esAdmin = usuario?.rol === 'admin'
  const [pacientes, setPacientes]       = useState([])
  const [doctores, setDoctores]         = useState([])
  const [pacienteEditar, setEditar]     = useState(null)
  const [mostrarForm, setMostrarForm]   = useState(false)
  const [notificacion, setNotificacion] = useState(null)
  const [modal, setModal]               = useState(null)
  const [busqueda, setBusqueda]         = useState('')

  const cargarPacientes = async () => {
    const res = await api.get(API)
    setPacientes(res.data)
  }

  useEffect(() => {
    cargarPacientes()
    if (esAdmin) api.get('/api/usuarios').then(r => setDoctores(r.data))
  }, [])

  const handleGuardar = async (datos, datosCita) => {
    if (pacienteEditar) {
      await api.put(`${API}/${pacienteEditar.id}`, datos)
      setNotificacion({ mensaje: 'Paciente actualizado correctamente', tipo: 'exito' })
    } else {
      const resPaciente = await api.post(API, datos)
      if (datosCita) {
        await api.post('/api/citas', {
          ...datosCita,
          pacienteId: resPaciente.data.id,
          estado: 'agendada',
        })
        setNotificacion({ mensaje: 'Paciente y cita creados correctamente', tipo: 'exito' })
      } else {
        setNotificacion({ mensaje: 'Paciente creado correctamente', tipo: 'exito' })
      }
    }
    setEditar(null)
    setMostrarForm(false)
    cargarPacientes()
  }

  const handleEditar = (paciente) => {
    setEditar(paciente)
    setMostrarForm(true)
  }

  const handleEliminar = (id) => {
    setModal({
      titulo: 'Eliminar paciente',
      mensaje: 'Se eliminarán también todas sus citas. Esta acción no se puede deshacer.',
      onConfirmar: async () => {
        await api.delete(`${API}/${id}`)
        setModal(null)
        setNotificacion({ mensaje: 'Paciente eliminado', tipo: 'error' })
        cargarPacientes()
      }
    })
  }

  const filtrados = pacientes.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.telefono.includes(busqueda) ||
    (p.email && p.email.toLowerCase().includes(busqueda.toLowerCase()))
  )

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">

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
        className="flex items-center justify-between mb-6"
        style={{ animation: 'fadeInUp 0.4s both' }}
      >
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#1D1D1B', fontFamily: "'Bell MT', serif" }}>
            Pacientes
          </h1>
          <p className="text-sm mt-0.5" style={{ color: '#B2B2B2' }}>
            {pacientes.length} paciente{pacientes.length !== 1 ? 's' : ''} registrado{pacientes.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => { setEditar(null); setMostrarForm(true) }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nuevo paciente
        </button>
      </div>

      {/* Form */}
      {mostrarForm && (
        <FormPaciente
          paciente={pacienteEditar}
          onGuardar={handleGuardar}
          onCancelar={() => { setMostrarForm(false); setEditar(null) }}
          doctores={doctores}
        />
      )}

      {/* Search */}
      {pacientes.length > 0 && (
        <div
          className="relative mb-5"
          style={{ animation: 'fadeInUp 0.4s cubic-bezier(0.16,1,0.3,1) 60ms both' }}
        >
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2"
            width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke="#B2B2B2" strokeWidth="2" strokeLinecap="round"
          >
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className="input"
            style={{ paddingLeft: '2.25rem' }}
            placeholder="Buscar por nombre, teléfono o email..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
        </div>
      )}

      {/* List */}
      <div className="flex flex-col gap-3">
        {filtrados.length === 0 ? (
          <div
            className="card rounded-2xl py-16 text-center"
            style={{ animation: 'fadeInUp 0.4s both' }}
          >
            <div className="mx-auto mb-3 flex justify-center text-gray-300">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <p className="text-sm font-medium" style={{ color: '#B2B2B2' }}>
              {busqueda ? 'Sin resultados para tu búsqueda' : 'No hay pacientes registrados'}
            </p>
          </div>
        ) : (
          filtrados.map((p, i) => (
            <div
              key={p.id}
              style={{ animation: `fadeInUp 0.4s cubic-bezier(0.16,1,0.3,1) ${i * 40}ms both` }}
            >
              <TarjetaPaciente
                paciente={p}
                onEditar={handleEditar}
                onEliminar={handleEliminar}
                esAdmin={esAdmin}
              />
            </div>
          ))
        )}
      </div>

    </div>
  )
}
