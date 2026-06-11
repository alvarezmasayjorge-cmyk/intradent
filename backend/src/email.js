require('dotenv').config()
const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
})

const enviarRecordatorio = async (paciente, cita, tipo) => {
  const hora = new Date(cita.fecha).toLocaleTimeString('es-BO', { 
    hour: '2-digit', 
    minute: '2-digit',
    timeZone: 'America/La_Paz'
  })
  const fecha = new Date(cita.fecha).toLocaleDateString('es-BO', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    timeZone: 'America/La_Paz'
  })

  const asunto = tipo === '24h' 
    ? '🦷 Recordatorio: Tu cita es mañana' 
    : '🦷 Recordatorio: Tu cita es en 1 hora'

  const mensaje = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
      <h2 style="color: #2B7A9B;">🦷 Consultorio Dental Intradent</h2>
      <p>Hola <strong>${paciente.nombre}</strong>,</p>
      <p>${tipo === '24h' ? 'Te recordamos que mañana tenés una cita:' : 'Tu cita es en 1 hora:'}</p>
      <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p><strong>📅 Fecha:</strong> ${fecha}</p>
        <p><strong>🕐 Hora:</strong> ${hora}</p>
        <p><strong>📋 Motivo:</strong> ${cita.motivo}</p>
      </div>
      <p>Si necesitás cancelar o reprogramar tu cita, por favor contactanos.</p>
      <p style="color: #64748b; font-size: 12px;">Este es un mensaje automático de Consultorio Dental Intradent.</p>
    </div>
  `

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: paciente.email,
    subject: asunto,
    html: mensaje
  })
}

module.exports = { enviarRecordatorio }
