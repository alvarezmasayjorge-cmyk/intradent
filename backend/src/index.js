const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')

// Cargar variables de entorno
dotenv.config()

const pacientesRouter = require('./routes/pacientes')
const { iniciarRecordatorios } = require('./recordatorios')
const citasRouter = require('./routes/citas')
const authRouter = require('./routes/auth')
const usuariosRouter = require('./routes/usuarios')
const insumosRouter = require('./routes/insumos')
const cajaRouter    = require('./routes/caja')

const app = express()
const PORT = process.env.PORT || 3000

// Middlewares
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)
    
    const hostnames = ['localhost', 'vercel.app']
    let allowed = hostnames.some(h => origin.includes(h))
    
    if (process.env.FRONTEND_URL) {
      const urls = process.env.FRONTEND_URL.split(',').map(u => u.trim())
      if (urls.some(url => origin === url || origin.startsWith(url))) {
        allowed = true
      }
    }
    
    if (allowed) {
      callback(null, true)
    } else {
      callback(null, false)
    }
  },
  credentials: true,
}))
app.use(express.json({ limit: '5mb' }))
app.use(express.urlencoded({ limit: '5mb', extended: true }))

// Rutas
app.use('/api/pacientes', pacientesRouter)
app.use('/api/citas', citasRouter)
app.use('/api/auth', authRouter)
app.use('/api/usuarios', usuariosRouter)
app.use('/api/insumos', insumosRouter)
app.use('/api/caja',   cajaRouter)

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ 
    message: '🦷 Intradent API funcionando!',
    version: '1.0.0'
  })
})

// Seed automático si no hay usuarios
async function seedSiEsNecesario() {
  const prisma = require('./prisma')
  const bcrypt = require('bcryptjs')
  try {
    const count = await prisma.usuario.count()
    if (count > 0) {
      console.log(`ℹ️  Ya existen ${count} usuario(s), seed omitido`)
      return
    }
    console.log('🌱 Creando usuarios iniciales...')
    const adminPass = await bcrypt.hash('intradent2026', 10)
    const admin = await prisma.usuario.create({
      data: { nombre: 'Administrador Intradent', email: 'admin@intradent.com', password: adminPass, rol: 'admin' }
    })
    console.log('✅ Admin creado:', admin.email)
    const doctorPass = await bcrypt.hash('doctor123', 10)
    const doctores = [
      { nombre: 'Dr. Carlos Mendoza',  email: 'carlos.mendoza@intradent.com'  },
      { nombre: 'Dra. Ana Rodríguez',  email: 'ana.rodriguez@intradent.com'   },
      { nombre: 'Dr. Luis Vargas',     email: 'luis.vargas@intradent.com'     },
      { nombre: 'Dra. María Torres',   email: 'maria.torres@intradent.com'    },
      { nombre: 'Dr. Pedro Gutiérrez', email: 'pedro.gutierrez@intradent.com' },
    ]
    for (const doc of doctores) {
      await prisma.usuario.create({ data: { ...doc, password: doctorPass, rol: 'doctor' } })
      console.log('✅ Doctor creado:', doc.email)
    }
    await prisma.paciente.updateMany({ where: { doctorId: null }, data: { doctorId: admin.id } })
    await prisma.cita.updateMany({ where: { doctorId: null }, data: { doctorId: admin.id } })
    console.log('🎉 Seed completado')
  } catch (e) {
    console.error('❌ Error en seed:', e.message)
  }
}

// Iniciar servidor
app.listen(PORT, async () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`)
  await seedSiEsNecesario()
  iniciarRecordatorios()
})
