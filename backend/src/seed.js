require('dotenv').config()
const bcrypt = require('bcryptjs')
const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Iniciando seed...')

  // Admin
  const adminPass = await bcrypt.hash('intradent2026', 10)
  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@intradent.com' },
    update: {},
    create: {
      nombre: 'Administrador Intradent',
      email: 'admin@intradent.com',
      password: adminPass,
      rol: 'admin'
    }
  })
  console.log('✅ Admin creado:', admin.email)

  // 5 Doctores
  const doctorPass = await bcrypt.hash('doctor123', 10)
  const doctores = [
    { nombre: 'Dr. Carlos Mendoza',   email: 'carlos.mendoza@intradent.com'  },
    { nombre: 'Dra. Ana Rodríguez',   email: 'ana.rodriguez@intradent.com'   },
    { nombre: 'Dr. Luis Vargas',      email: 'luis.vargas@intradent.com'     },
    { nombre: 'Dra. María Torres',    email: 'maria.torres@intradent.com'    },
    { nombre: 'Dr. Pedro Gutiérrez',  email: 'pedro.gutierrez@intradent.com' },
  ]

  for (const doc of doctores) {
    const u = await prisma.usuario.upsert({
      where: { email: doc.email },
      update: {},
      create: { ...doc, password: doctorPass, rol: 'doctor' }
    })
    console.log('✅ Doctor creado:', u.email)
  }

  // Asignar pacientes y citas sin doctor al admin
  const p = await prisma.paciente.updateMany({
    where: { doctorId: null },
    data: { doctorId: admin.id }
  })
  const c = await prisma.cita.updateMany({
    where: { doctorId: null },
    data: { doctorId: admin.id }
  })
  console.log(`✅ ${p.count} pacientes y ${c.count} citas asignadas al admin`)
  console.log('🎉 Seed completado')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
