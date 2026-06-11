const express = require('express')
const router = express.Router()
const prisma = require('../prisma')
const { verificarToken } = require('../middleware/auth')

router.get('/', verificarToken, async (req, res) => {
  try {
    const where = req.usuario.rol === 'admin' ? {} : { doctorId: req.usuario.id }
    const citas = await prisma.cita.findMany({
      where,
      include: { paciente: true, doctor: { select: { id: true, nombre: true } }, deudor: true },
      orderBy: { fecha: 'asc' }
    })
    res.json(citas)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/', verificarToken, async (req, res) => {
  try {
    const { fecha, motivo, estado, pacienteId, duracion } = req.body
    const doctorId = req.usuario.rol === 'admin'
      ? (req.body.doctorId ? parseInt(req.body.doctorId) : req.usuario.id)
      : req.usuario.id
    const cita = await prisma.cita.create({
      data: {
        fecha: new Date(fecha),
        motivo,
        estado: estado || 'agendo',
        duracion: duracion ? parseInt(duracion) : 30,
        pacienteId: parseInt(pacienteId),
        doctorId
      },
      include: { paciente: true, doctor: { select: { id: true, nombre: true } } }
    })
    res.json(cita)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.put('/:id', verificarToken, async (req, res) => {
  try {
    const { fecha, motivo, estado, duracion } = req.body
    const cita = await prisma.cita.update({
      where: { id: parseInt(req.params.id) },
      data: {
        fecha: new Date(fecha),
        motivo,
        estado,
        duracion: duracion ? parseInt(duracion) : undefined
      },
      include: { paciente: true, doctor: { select: { id: true, nombre: true } }, deudor: true }
    })
    res.json(cita)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.delete('/:id', verificarToken, async (req, res) => {
  try {
    await prisma.cita.delete({ where: { id: parseInt(req.params.id) } })
    res.json({ message: 'Cita eliminada correctamente' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
