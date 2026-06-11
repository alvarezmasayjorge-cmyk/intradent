const express = require('express')
const router = express.Router()
const prisma = require('../prisma')
const { verificarToken } = require('../middleware/auth')

router.get('/', verificarToken, async (req, res) => {
  try {
    const where = req.usuario.rol === 'admin' ? {} : { doctorId: req.usuario.id }
    const pacientes = await prisma.paciente.findMany({
      where,
      include: { doctor: { select: { id: true, nombre: true, foto: true } } },
      orderBy: { createdAt: 'desc' }
    })
    res.json(pacientes)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/:id', verificarToken, async (req, res) => {
  try {
    const paciente = await prisma.paciente.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { doctor: { select: { id: true, nombre: true, foto: true } } }
    })
    if (!paciente) return res.status(404).json({ error: 'Paciente no encontrado' })
    res.json(paciente)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/', verificarToken, async (req, res) => {
  try {
    const { nombre, telefono, email, foto } = req.body
    const doctorId = req.usuario.rol === 'admin'
      ? (req.body.doctorId ? parseInt(req.body.doctorId) : req.usuario.id)
      : req.usuario.id
    const paciente = await prisma.paciente.create({
      data: { nombre, telefono, email, foto, doctorId },
      include: { doctor: { select: { id: true, nombre: true, foto: true } } }
    })
    res.json(paciente)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.put('/:id', verificarToken, async (req, res) => {
  try {
    const { nombre, telefono, email, foto } = req.body
    const paciente = await prisma.paciente.update({
      where: { id: parseInt(req.params.id) },
      data: { nombre, telefono, email, foto },
      include: { doctor: { select: { id: true, nombre: true, foto: true } } }
    })
    res.json(paciente)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.delete('/:id', verificarToken, async (req, res) => {
  try {
    const pacienteId = parseInt(req.params.id)
    // Primero eliminamos todas las citas asociadas para evitar restricción de llave foránea
    await prisma.cita.deleteMany({ where: { pacienteId } })
    
    // Ahora eliminamos al paciente
    await prisma.paciente.delete({ where: { id: pacienteId } })
    
    res.json({ message: 'Paciente y sus citas eliminados correctamente' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
