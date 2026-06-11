const cron = require('node-cron')
const prisma = require('./prisma')
const { enviarRecordatorio } = require('./email')

const iniciarRecordatorios = () => {
  // Corre cada 30 minutos
  cron.schedule('*/30 * * * *', async () => {
    console.log('🔔 Verificando recordatorios...')

    const ahora = new Date()

    // Recordatorio 24 horas antes
    const en24h = new Date(ahora.getTime() + 24 * 60 * 60 * 1000)
    const rango24hInicio = new Date(en24h.getTime() - 15 * 60 * 1000)
    const rango24hFin = new Date(en24h.getTime() + 15 * 60 * 1000)

    // Recordatorio 1 hora antes
    const en1h = new Date(ahora.getTime() + 60 * 60 * 1000)
    const rango1hInicio = new Date(en1h.getTime() - 15 * 60 * 1000)
    const rango1hFin = new Date(en1h.getTime() + 15 * 60 * 1000)

    try {
      // Buscar citas en 24 horas
      const citas24h = await prisma.cita.findMany({
        where: {
          fecha: { gt: rango24hInicio, lte: rango24hFin },
          estado: { in: ['agendo', 'confirmo'] }
        },
        include: { paciente: true }
      })

      // Buscar citas en 1 hora
      const citas1h = await prisma.cita.findMany({
        where: {
          fecha: { gt: rango1hInicio, lte: rango1hFin },
          estado: { in: ['agendo', 'confirmo'] }
        },
        include: { paciente: true }
      })

      // Enviar recordatorios 24h
      for (const cita of citas24h) {
        if (cita.paciente.email) {
          await enviarRecordatorio(cita.paciente, cita, '24h')
          console.log(`✅ Recordatorio 24h enviado a ${cita.paciente.email}`)
        }
      }

      // Enviar recordatorios 1h
      for (const cita of citas1h) {
        if (cita.paciente.email) {
          await enviarRecordatorio(cita.paciente, cita, '1h')
          console.log(`✅ Recordatorio 1h enviado a ${cita.paciente.email}`)
        }
      }

    } catch (error) {
      console.error('Error enviando recordatorios:', error)
    }
  })

  console.log('✅ Sistema de recordatorios iniciado')
}

module.exports = { iniciarRecordatorios }