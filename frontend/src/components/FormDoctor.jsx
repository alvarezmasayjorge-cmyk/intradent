import { useState, useEffect, useRef, useCallback } from 'react'
import Cropper from 'react-easy-crop'

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

export default function FormDoctor({ usuario, onGuardar, onCancelar }) {
  const [form, setForm]         = useState({ nombre: '', email: '', password: '', rol: 'doctor', foto: '' })
  const [preview, setPreview]   = useState(null)
  const [imageSrc, setImageSrc] = useState(null)
  const [crop, setCrop]         = useState({ x: 0, y: 0 })
  const [zoom, setZoom]         = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [procesando, setProcesando] = useState(false)
  const inputRef = useRef()

  useEffect(() => {
    if (usuario) {
      setForm({ nombre: usuario.nombre, email: usuario.email, password: '', rol: usuario.rol, foto: usuario.foto || '' })
      setPreview(usuario.foto || null)
    }
  }, [usuario])

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleFoto = (e) => {
    const file = e.target.files[0]
    if (!file) return
    // Reset para poder seleccionar el mismo archivo otra vez
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

  const handleSubmit = e => { e.preventDefault(); onGuardar(form) }

  const iniciales = form.nombre
    ? form.nombre.split(' ').slice(0, 2).map(w => w.charAt(0).toUpperCase()).join('')
    : '?'

  // Tamaño del cropper adaptado a la pantalla
  const cropSize = Math.min(window.innerWidth - 48, 320)

  return (
    <div
      className="card rounded-2xl p-6 mb-6"
      style={{ animation: 'fadeInUp 0.35s cubic-bezier(0.16,1,0.3,1)', borderTop: '3px solid #2B7A9B' }}
    >
      <h2 className="font-semibold mb-5" style={{ color: '#1D1D1B', fontFamily: "'Bell MT', serif" }}>
        {usuario ? 'Editar usuario' : 'Nuevo usuario'}
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
          <input name="nombre" value={form.nombre} onChange={handleChange} required className="input" placeholder="Ej: Dr. Carlos Mendoza" />
        </div>

        <div>
          <label className="form-label">Email</label>
          <input name="email" type="email" value={form.email} onChange={handleChange} required className="input" placeholder="correo@ejemplo.com" />
        </div>

        <div>
          <label className="form-label">
            Contraseña {usuario && <span style={{ color: '#B2B2B2', fontWeight: 400 }}>(dejar vacío para no cambiar)</span>}
          </label>
          <input
            name="password" type="password" value={form.password} onChange={handleChange}
            required={!usuario} className="input" placeholder="••••••••"
          />
        </div>

        <div>
          <label className="form-label">Rol</label>
          <select name="rol" value={form.rol} onChange={handleChange} className="input">
            <option value="doctor">Doctor</option>
            <option value="admin">Administrador</option>
          </select>
        </div>

        <div className="md:col-span-2 flex gap-3 justify-end pt-1">
          <button type="button" onClick={onCancelar} className="btn-ghost">Cancelar</button>
          <button type="submit" className="btn-primary">
            {usuario ? 'Guardar cambios' : 'Crear usuario'}
          </button>
        </div>
      </form>
    </div>
  )
}
