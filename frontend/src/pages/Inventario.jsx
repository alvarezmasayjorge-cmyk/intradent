import { useState, useEffect } from 'react'
import api from '../lib/api'
import FormInsumo from '../components/FormInsumo'
import TarjetaInsumo from '../components/TarjetaInsumo'
import Notificacion from '../components/Notificacion'
import Modal from '../components/Modal'

const API = '/api/insumos'

export default function Inventario() {
  const [insumos, setInsumos] = useState([])
  const [insumoEditar, setEditar] = useState(null)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [notificacion, setNotificacion] = useState(null)
  const [modal, setModal] = useState(null)
  const [busqueda, setBusqueda] = useState('')

  const cargarInsumos = async () => {
    const res = await api.get(API)
    setInsumos(res.data)
  }

  useEffect(() => {
    cargarInsumos()
  }, [])

  const handleGuardar = async (datos) => {
    try {
      if (insumoEditar) {
        await api.put(`${API}/${insumoEditar.id}`, datos)
        setNotificacion({ mensaje: 'Insumo actualizado correctamente', tipo: 'exito' })
      } else {
        await api.post(API, datos)
        setNotificacion({ mensaje: 'Insumo creado correctamente', tipo: 'exito' })
      }
      setEditar(null)
      setMostrarForm(false)
      cargarInsumos()
    } catch (error) {
      setNotificacion({ mensaje: error.response?.data?.error || 'Error al guardar', tipo: 'error' })
    }
  }

  const handleEditar = (insumo) => {
    setEditar(insumo)
    setMostrarForm(true)
  }

  const handleEliminar = (id) => {
    setModal({
      titulo: 'Eliminar insumo',
      mensaje: '¿Está seguro de que desea eliminar este insumo? Esta acción no se puede deshacer.',
      onConfirmar: async () => {
        try {
          await api.delete(`${API}/${id}`)
          setModal(null)
          setNotificacion({ mensaje: 'Insumo eliminado', tipo: 'error' })
          cargarInsumos()
        } catch (error) {
          setNotificacion({ mensaje: error.response?.data?.error || 'Error al eliminar', tipo: 'error' })
        }
      }
    })
  }

  const handleAjustarStock = async (id, delta) => {
    try {
      const actualizado = await api.patch(`${API}/${id}/stock`, { delta })
      setInsumos(prev => prev.map(i => i.id === id ? actualizado.data : i))
    } catch (error) {
      setNotificacion({ mensaje: 'Error al ajustar stock', tipo: 'error' })
    }
  }

  const filtrados = insumos.filter(i =>
    i.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (i.proveedor && i.proveedor.toLowerCase().includes(busqueda.toLowerCase()))
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
            Inventario
          </h1>
          <p className="text-sm mt-0.5" style={{ color: '#B2B2B2' }}>
            {insumos.length} insumo{insumos.length !== 1 ? 's' : ''} registrado{insumos.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => { setEditar(null); setMostrarForm(true) }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nuevo insumo
        </button>
      </div>

      {/* Form */}
      {mostrarForm && (
        <FormInsumo
          insumo={insumoEditar}
          onGuardar={handleGuardar}
          onCancelar={() => { setMostrarForm(false); setEditar(null) }}
        />
      )}

      {/* Search */}
      {insumos.length > 0 && (
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
            placeholder="Buscar por nombre o proveedor..."
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
                <path d="M9 2L6.5 6.5M15 2l2.5 4.5M12 2v4m-6 4h12m-10 4v8m4-8v8m4-8v8M4 18h16a2 2 0 002-2v-8a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2z"/>
              </svg>
            </div>
            <p className="text-sm font-medium" style={{ color: '#B2B2B2' }}>
              {busqueda ? 'Sin resultados para tu búsqueda' : 'No hay insumos registrados'}
            </p>
          </div>
        ) : (
          filtrados.map((i, idx) => (
            <div
              key={i.id}
              style={{ animation: `fadeInUp 0.4s cubic-bezier(0.16,1,0.3,1) ${idx * 40}ms both` }}
            >
              <TarjetaInsumo
                insumo={i}
                onEditar={handleEditar}
                onEliminar={handleEliminar}
                onAjustarStock={handleAjustarStock}
              />
            </div>
          ))
        )}
      </div>

    </div>
  )
}
