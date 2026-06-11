import { useState, useEffect } from 'react'
import api from '../lib/api'

const getDiaSemana = (fechaStr) => {
  if (!fechaStr) return '';
  try {
    const [datePart] = fechaStr.split('T');
    if (!datePart) return '';
    const [year, month, day] = datePart.split('-');
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('es-BO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  } catch(e) {
    return '';
  }
}

const ESTADOS = [
  { value: 'agendo',      label: 'Agendó'      },
  { value: 'confirmo',    label: 'Confirmó'    },
  { value: 'asistio',     label: 'Asistió'     },
  { value: 'reprogramo',  label: 'Reprogramó'  },
  { value: 'cancelo',     label: 'Canceló'     },
]

const DURACIONES = [
  { value: 15,  label: '15 min' },
  { value: 30,  label: '30 min' },
  { value: 45,  label: '45 min' },
  { value: 60,  label: '1 hora' },
  { value: 90,  label: '1 hora 30 min' },
  { value: 120, label: '2 horas' },
]

export default function FormCita({ cita, pacientes, doctores = [], esAdmin = false, fechaInicial, pacienteInicialId, onGuardar, onEliminar, onCancelar }) {
  const [form, setForm] = useState({
    pacienteId: '',
    fecha:      '',
    motivo:     '',
    estado:     'agendo',
    duracion:   30,
    doctorId:   '',
  })
  const [deudor, setDeudor] = useState({ activo: false, monto: '', concepto: '' })
  const [guardando, setGuardando] = useState(false)
  const [yaDeudor, setYaDeudor] = useState(false)

  useEffect(() => {
    if (cita) {
      const dateObj = new Date(cita.fecha);
      const tzOffset = dateObj.getTimezoneOffset() * 60000;
      const localISOTime = new Date(dateObj.getTime() - tzOffset).toISOString().slice(0, 16);

      setForm({
        pacienteId: cita.pacienteId,
        fecha:      localISOTime,
        motivo:     cita.motivo,
        estado:     cita.estado,
        duracion:   cita.duracion || 30,
        doctorId:   cita.doctorId || '',
      })
      setYaDeudor(!!cita.deudor)
    } else {
      setForm(f => {
        let initialFecha = f.fecha;
        if (fechaInicial) {
          if (fechaInicial.length === 10) {
            initialFecha = fechaInicial + 'T09:00';
          } else {
            initialFecha = fechaInicial.slice(0, 16);
          }
        }
        return { ...f, fecha: initialFecha, pacienteId: pacienteInicialId || f.pacienteId };
      });
      setYaDeudor(false);
    }
  }, [cita, fechaInicial, pacienteInicialId])

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleEstadoChange = (valor) => {
    setForm(f => ({ ...f, estado: valor }))
    if (valor !== 'asistio') {
      setDeudor({ activo: false, monto: '', concepto: '' })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setGuardando(true)
    try {
      const [datePart, timePart] = form.fecha.split('T');
      const [year, month, day] = datePart.split('-');
      const [hour, minute] = timePart.split(':');
      const localDate = new Date(year, month - 1, day, hour, minute);
      const dataToSave = { ...form, fecha: localDate.toISOString() };

      // Guardar la cita primero (obtenemos el ID si es nueva)
      let citaId = cita?.id
      if (!cita) {
        const res = await api.post('/api/citas', dataToSave)
        citaId = res.data.id
      } else {
        await api.put(`/api/citas/${cita.id}`, dataToSave)
      }

      // Si asistió y marcó como deudor, registrar deuda
      if (form.estado === 'asistio' && deudor.activo && deudor.monto && deudor.concepto && citaId) {
        try {
          await api.post('/api/caja/deudores', {
            citaId,
            monto: parseFloat(deudor.monto),
            concepto: deudor.concepto
          })
        } catch (err) {
          // Si ya existe deudor para esta cita no es error crítico
          console.warn('Deudor no creado:', err.response?.data?.error)
        }
      }

      onGuardar(dataToSave)
    } catch (err) {
      console.error('Error guardando cita:', err)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div
      className="card rounded-2xl p-4 md:p-6 mb-6"
      style={{ animation: 'fadeInUp 0.35s cubic-bezier(0.16,1,0.3,1)', borderTop: '3px solid #2B7A9B' }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <h2 className="font-semibold" style={{ color: '#1D1D1B', fontFamily: "'Bell MT', serif" }}>
          {cita ? 'Editar cita' : 'Nueva cita'}
        </h2>
        {cita && (
          <button
            onClick={() => onEliminar(cita.id)}
            className="btn-danger text-xs px-3 py-2 w-full sm:w-auto"
          >
            Eliminar cita
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="form-label">Paciente</label>
          <select name="pacienteId" value={form.pacienteId} onChange={handleChange} required className="input">
            <option value="">Seleccionar paciente…</option>
            {pacientes.map(p => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="form-label">Fecha y hora</label>
          <input type="datetime-local" name="fecha" value={form.fecha} onChange={handleChange} required className="input" />
          {form.fecha && (
            <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-xl" style={{ background: '#E3F0F5', border: '1px solid #a8d0df' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2B7A9B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <span className="text-sm font-semibold capitalize" style={{ color: '#175270' }}>
                {getDiaSemana(form.fecha)}
              </span>
            </div>
          )}
        </div>

        <div>
          <label className="form-label">Motivo</label>
          <input name="motivo" value={form.motivo} onChange={handleChange} required className="input" placeholder="Ej: Limpieza dental" />
        </div>

        <div>
          <label className="form-label">Duración</label>
          <select name="duracion" value={form.duracion} onChange={handleChange} className="input">
            {DURACIONES.map(d => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>

        {esAdmin && doctores.length > 0 && (
          <div className="md:col-span-2">
            <label className="form-label">Doctor asignado</label>
            <select name="doctorId" value={form.doctorId} onChange={handleChange} className="input">
              <option value="">Sin asignar</option>
              {doctores.map(d => (
                <option key={d.id} value={d.id}>{d.nombre}</option>
              ))}
            </select>
          </div>
        )}

        <div className="md:col-span-2">
          <label className="form-label">Estado</label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {ESTADOS.map(e => (
              <button
                key={e.value}
                type="button"
                onClick={() => handleEstadoChange(e.value)}
                className="py-3 px-3 md:py-2 rounded-xl text-xs font-semibold text-left transition-all"
                style={{
                  border: form.estado === e.value ? '2px solid #2B7A9B' : '2px solid #e5e7e5',
                  background: form.estado === e.value ? '#E3F0F5' : '#fff',
                  color: form.estado === e.value ? '#2B7A9B' : '#B2B2B2',
                  minHeight: '44px',
                }}
              >
                {e.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sección deudor — solo si estado es 'asistio' y no tiene deudor previo */}
        {form.estado === 'asistio' && !yaDeudor && (
          <div
            className="md:col-span-2 rounded-2xl p-4"
            style={{ background: '#fffbeb', border: '1.5px solid #fcd34d' }}
          >
            <div className="flex items-center gap-3 mb-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p className="text-sm font-semibold" style={{ color: '#92400e' }}>¿El paciente quedó a deber?</p>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <button
                type="button"
                onClick={() => setDeudor(d => ({ ...d, activo: false }))}
                className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                style={{
                  border: !deudor.activo ? '2px solid #2B7A9B' : '2px solid #e5e7e5',
                  background: !deudor.activo ? '#E3F0F5' : '#fff',
                  color: !deudor.activo ? '#2B7A9B' : '#B2B2B2',
                }}
              >
                No, pagó completo
              </button>
              <button
                type="button"
                onClick={() => setDeudor(d => ({ ...d, activo: true }))}
                className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                style={{
                  border: deudor.activo ? '2px solid #d97706' : '2px solid #e5e7e5',
                  background: deudor.activo ? '#fffbeb' : '#fff',
                  color: deudor.activo ? '#d97706' : '#B2B2B2',
                }}
              >
                Sí, quedó a deber
              </button>
            </div>
            {deudor.activo && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Monto adeudado (Bs.)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={deudor.monto}
                    onChange={e => setDeudor(d => ({ ...d, monto: e.target.value }))}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Concepto</label>
                  <input
                    type="text"
                    placeholder="Ej: Tratamiento de conducto"
                    value={deudor.concepto}
                    onChange={e => setDeudor(d => ({ ...d, concepto: e.target.value }))}
                    className="input"
                    required
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {yaDeudor && form.estado === 'asistio' && (
          <div
            className="md:col-span-2 rounded-2xl px-4 py-3 flex items-center gap-2"
            style={{ background: '#fef3c7', border: '1.5px solid #fcd34d' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <p className="text-xs font-medium" style={{ color: '#92400e' }}>
              Este paciente tiene una deuda registrada. Gestiona el cobro desde Flujo de Caja → Deudores.
            </p>
          </div>
        )}

        <div className="md:col-span-2 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end pt-1">
          <button type="button" onClick={onCancelar} className="btn-ghost w-full sm:w-auto">Cancelar</button>
          <button type="submit" className="btn-primary w-full sm:w-auto" disabled={guardando}>
            {guardando ? 'Guardando…' : (cita ? 'Guardar cambios' : 'Crear cita')}
          </button>
        </div>
      </form>
    </div>
  )
}
