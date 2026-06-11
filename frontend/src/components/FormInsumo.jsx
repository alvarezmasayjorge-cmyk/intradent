import { useState, useEffect } from 'react'

export default function FormInsumo({ insumo, onGuardar, onCancelar }) {
  const [formData, setFormData] = useState({
    nombre: '',
    cantidad: 0,
    minimo: 0,
    proveedor: '',
    precio: ''
  })

  useEffect(() => {
    if (insumo) {
      setFormData({
        nombre: insumo.nombre,
        cantidad: insumo.cantidad,
        minimo: insumo.minimo,
        proveedor: insumo.proveedor || '',
        precio: insumo.precio ? insumo.precio.toString() : ''
      })
    }
  }, [insumo])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'nombre' || name === 'proveedor' ? value : parseFloat(value) || value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.nombre.trim()) {
      alert('El nombre del insumo es requerido')
      return
    }
    onGuardar(formData)
    setFormData({ nombre: '', cantidad: 0, minimo: 0, proveedor: '', precio: '' })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="card mb-6 p-6"
      style={{ animation: 'fadeInUp 0.4s cubic-bezier(0.16,1,0.3,1) both' }}
    >
      <h2 className="text-lg font-bold mb-4" style={{ color: '#1D1D1B' }}>
        {insumo ? 'Editar insumo' : 'Nuevo insumo'}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs font-semibold mb-2" style={{ color: '#1D1D1B' }}>
            Nombre *
          </label>
          <input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            className="input w-full"
            placeholder="Ej: Guantes latex"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-2" style={{ color: '#1D1D1B' }}>
            Cantidad actual
          </label>
          <input
            type="number"
            name="cantidad"
            value={formData.cantidad}
            onChange={handleChange}
            className="input w-full"
            min="0"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-2" style={{ color: '#1D1D1B' }}>
            Stock mínimo (alerta)
          </label>
          <input
            type="number"
            name="minimo"
            value={formData.minimo}
            onChange={handleChange}
            className="input w-full"
            min="0"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-2" style={{ color: '#1D1D1B' }}>
            Proveedor
          </label>
          <input
            type="text"
            name="proveedor"
            value={formData.proveedor}
            onChange={handleChange}
            className="input w-full"
            placeholder="Ej: Dental Supply Co."
          />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-2" style={{ color: '#1D1D1B' }}>
            Precio unitario (Bs.)
          </label>
          <input
            type="number"
            name="precio"
            value={formData.precio}
            onChange={handleChange}
            className="input w-full"
            step="0.01"
            min="0"
          />
        </div>
      </div>

      <div className="flex gap-3 justify-end mt-6">
        <button
          type="button"
          onClick={onCancelar}
          className="px-4 py-2 rounded-lg text-sm font-medium"
          style={{ border: '1px solid #e5e7e5', color: '#B2B2B2' }}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="btn-primary"
        >
          {insumo ? 'Actualizar' : 'Crear'} insumo
        </button>
      </div>
    </form>
  )
}
