import { useState, useEffect, useRef, useCallback } from 'react'
import Cropper from 'react-easy-crop'

const decodeToken = (t) => { try { return JSON.parse(atob(t.split('.')[1])) } catch { return null } }

const DURACIONES = [
  { value: 15,  label: '15 min' },
  { value: 30,  label: '30 min' },
  { value: 45,  label: '45 min' },
  { value: 60,  label: '1 hora' },
  { value: 90,  label: '1 h 30 min' },
  { value: 120, label: '2 horas' },
]

const createImage = (url) =>
  new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })

async function getCroppedImg(imageSrc, croppedAreaPixels) {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  // 400x400 es suficiente para un avatar y ocupa ~10x menos que 1080x1080
  canvas.width = 400
  canvas.height = 400
  const ctx = canvas.getContext('2d')
  ctx.drawImage(
    image,
    croppedAreaPixels.x, croppedAreaPixels.y,
    croppedAreaPixels.width, croppedAreaPixels.height,
    0, 0, 400, 400
  )
  return canvas.toDataURL('image/jpeg', 0.82)
}

export default function FormPaciente({ paciente, onGuardar, onCancelar, doctores = [] }) {
  const usuario = decodeToken(localStorage.getItem('token'))
  const esAdmin = usuario?.rol === 'admin'

  const [form, setForm] = useState({ nombre: '', telefono: '', email: '', doctorId: '', foto: '' })
  const [crearCita, setCrearCita] = useState(false)
  const [formCita, setFormCita]   = useState({ fecha: '', motivo: '', duracion: 30 })

  // Estados para foto
  const [preview, setPreview]   = useState(null)
  const [imageSrc, setImageSrc] = useState(null)
  const [crop, setCrop]         = useState({ x: 0, y: 0 })
  const [zoom, setZoom]         = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [procesando, setProcesando] = useState(false)
  const inputRef = useRef()

  useEffect(() => {
    if (paciente) {
      setForm({ ...paciente, doctorId: paciente.doctorId || '', foto: paciente.foto || '' })
      setPreview(paciente.foto || null)
    }
  }, [paciente])

  const handleChange     = e => setForm({ ...form, [e.target.name]: e.target.value })
  const handleChangeCita = e => setFormCita({ ...formCita, [e.target.name]: e.target.value })

  // Handlers para foto
  const handleFoto = (e) => {
    const file = e.target.files[0]
    if (!file) return
    e.target.value = ''
    const reader = new FileReader()
    reader.onload = (ev) => {
      setImageSrc(ev.target.result)
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setCroppedAreaPixels(null)
    }
    reader.readAsDataURL(file)
  }

  const onCropComplete = useCallback((_, pixels) => {
    setCroppedAreaPixels(pixels)
  }, [])

  const confirmarRecorte = async () => {
    if (!croppedAreaPixels) return
    setProcesando(true)
    try {
      const base64 = await getCroppedImg(imageSrc, croppedAreaPixels)
      setPreview(base64)
      setForm(f => ({ ...f, foto: base64 }))
      setImageSrc(null)
    } catch (e) {
      console.error('Error al recortar:', e)
    } finally {
      setProcesando(false)
    }
  }

  const handleSubmit = e => {
    e.preventDefault()
    onGuardar(form, crearCita && !paciente ? formCita : null)
  }

  const iniciales = form.nombre
    ? form.nombre.split(' ').slice(0, 2).map(w => w.charAt(0).toUpperCase()).join('')
    : '?'

  const cropSize = Math.min(window.innerWidth - 48, 320)

  return (
    <div
      className="card rounded-2xl p-6 mb-6"
      style={{ animation: 'fadeInUp 0.35s cubic-bezier(0.16,1,0.3,1)', borderTop: '3px solid #2B7A9B' }}
    >
      <h2 className="font-semibold mb-5" style={{ color: '#1D1D1B', fontFamily: "'Bell MT', serif" }}>
        {paciente ? 'Editar paciente' : 'Nuevo paciente'}
      </h2>

      {/* ── Modal cropper ── */}
      {imageSrc && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6"
          style={{ background: 'rgba(0,0,0,0.9)' }}
        >
          <p className="text-white text-sm font-semibold mb-4">Encuadra la foto</p>

          <div style={{ position: 'relative', width: cropSize, height: cropSize, borderRadius: '1rem', overflow: 'hidden' }}>
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              cropShape="round"
              showGrid={false}
            />
          </div>

          <div className="flex items-center gap-3 mt-5" style={{ width: cropSize }}>
            <span className="text-white text-xs">−</span>
            <input
              type="range" min={1} max={3} step={0.01}
              value={zoom} onChange={e => setZoom(Number(e.target.value))}
              className="flex-1"
              style={{ accentColor: '#2B7A9B' }}
            />
            <span className="text-white text-xs">+</span>
          </div>

          <div className="flex gap-3 mt-5">
            <button
              type="button"
              onClick={() => setImageSrc(null)}
              className="btn-ghost text-sm px-5 py-2"
              style={{ color: 'white', borderColor: 'rgba(255,255,255,0.2)' }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirmarRecorte}
              disabled={procesando}
              className="btn-primary text-sm px-5 py-2"
            >
              {procesando ? 'Procesando...' : 'Usar esta foto'}
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
        
        {/* Foto */}
        <div className="md:col-span-2 flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex-shrink-0 flex items-center justify-center overflow-hidden"
            style={{
              background: preview ? 'transparent' : 'linear-gradient(135deg, #2B7A9B, #1F6384)',
              cursor: 'pointer', flexShrink: 0
            }}
            onClick={() => inputRef.current.click()}
          >
            {preview
              ? <img src={preview} alt="foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span className="text-white font-bold text-lg">{iniciales}</span>
            }
          </div>
          <div>
            <button type="button" onClick={() => inputRef.current.click()} className="btn-ghost text-xs px-3 py-1.5">
              {preview ? 'Cambiar foto' : 'Subir foto'}
            </button>
            {preview && (
              <button
                type="button"
                onClick={() => { setPreview(null); setForm(f => ({ ...f, foto: '' })) }}
                className="text-xs ml-2"
                style={{ color: '#B2B2B2' }}
              >
                Quitar
              </button>
            )}
            <p className="text-xs mt-1" style={{ color: '#B2B2B2' }}>JPG o PNG</p>
            <input ref={inputRef} type="file" accept="image/*" onChange={handleFoto} style={{ display: 'none' }} />
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="form-label">Nombre completo</label>
          <input name="nombre" value={form.nombre} onChange={handleChange} required className="input" placeholder="Ej: María García" />
        </div>

        <div>
          <label className="form-label">Teléfono</label>
          <input name="telefono" value={form.telefono} onChange={handleChange} required className="input" placeholder="Ej: 70012345" />
        </div>

        <div>
          <label className="form-label">Email <span style={{ color: '#B2B2B2', fontWeight: 400 }}>(opcional)</span></label>
          <input name="email" type="email" value={form.email || ''} onChange={handleChange} className="input" placeholder="Ej: maria@gmail.com" />
        </div>

        {esAdmin && doctores.length > 0 && (
          <div className="md:col-span-2">
            <label className="form-label">Doctor asignado</label>
            <select name="doctorId" value={form.doctorId} onChange={handleChange} className="input">
              <option value="">Sin asignar</option>
              {doctores.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
            </select>
          </div>
        )}

        {/* Toggle crear cita (solo al crear, no al editar) */}
        {!paciente && (
          <div className="md:col-span-2">
            <button
              type="button"
              onClick={() => setCrearCita(!crearCita)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all"
              style={{
                border: `2px solid ${crearCita ? '#2B7A9B' : '#e5e7e5'}`,
                background: crearCita ? '#E3F0F5' : '#fafafa',
              }}
            >
              <span className="text-sm font-semibold" style={{ color: crearCita ? '#2B7A9B' : '#B2B2B2' }}>
                Crear cita al mismo tiempo
              </span>
              <div
                className="w-10 h-6 rounded-full relative transition-all"
                style={{ background: crearCita ? '#2B7A9B' : '#d1d5db' }}
              >
                <div
                  className="absolute top-1 w-4 h-4 bg-white rounded-full transition-all"
                  style={{ left: crearCita ? '22px' : '4px' }}
                />
              </div>
            </button>
          </div>
        )}

        {/* Campos de cita */}
        {crearCita && !paciente && (
          <>
            <div className="md:col-span-2" style={{ borderTop: '1px solid #eaf0f4', paddingTop: '1rem' }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#B2B2B2' }}>Datos de la cita</p>
            </div>
            <div>
              <label className="form-label">Fecha y hora</label>
              <input type="datetime-local" name="fecha" value={formCita.fecha} onChange={handleChangeCita} required={crearCita} className="input" />
            </div>
            <div>
              <label className="form-label">Duración</label>
              <select name="duracion" value={formCita.duracion} onChange={handleChangeCita} className="input">
                {DURACIONES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="form-label">Motivo</label>
              <input name="motivo" value={formCita.motivo} onChange={handleChangeCita} required={crearCita} className="input" placeholder="Ej: Limpieza dental" />
            </div>
          </>
        )}

        <div className="md:col-span-2 flex gap-3 justify-end pt-1">
          <button type="button" onClick={onCancelar} className="btn-ghost">Cancelar</button>
          <button type="submit" className="btn-primary">
            {paciente ? 'Guardar cambios' : crearCita ? 'Crear paciente y cita' : 'Crear paciente'}
          </button>
        </div>
      </form>
    </div>
  )
}
