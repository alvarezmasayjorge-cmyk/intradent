const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const prisma = require('../prisma')
const { verificarToken, soloAdmin } = require('../middleware/auth')

// Obtener todos los doctores (admin)
router.get('/', verificarToken, soloAdmin, async (req, res) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true, nombre: true, email: true, rol: true, foto: true, createdAt: true,
        _count: { select: { pacientes: true, citas: true } }
      },
      orderBy: { createdAt: 'asc' }
    })
    res.json(usuarios)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Obtener pacientes de un doctor específico
router.get('/:id/pacientes', verificarToken, soloAdmin, async (req, res) => {
  try {
    const doctorId = parseInt(req.params.id)
    
    // Obtener pacientes del doctor con información de última cita
    const pacientes = await prisma.paciente.findMany({
      where: { doctorId },
      include: {
        citas: {
          orderBy: { fecha: 'desc' },
          take: 1,
          select: { fecha: true, motivo: true, estado: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    // Transformar la respuesta para incluir la última cita
    const pacientesConUltimaCita = pacientes.map(p => ({
      ...p,
      ultimaCita: p.citas[0] || null,
      citas: undefined // No enviar el array completo
    }))
    
    res.json(pacientesConUltimaCita)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Crear doctor (admin)
router.post('/', verificarToken, soloAdmin, async (req, res) => {
  try {
    const { nombre, email, password, rol, foto } = req.body
    const existe = await prisma.usuario.findUnique({ where: { email } })
    if (existe) return res.status(400).json({ error: 'El email ya está registrado' })

    const hash = await bcrypt.hash(password, 10)
    const usuario = await prisma.usuario.create({
      data: { nombre, email, password: hash, rol: rol || 'doctor', foto: foto || null },
      select: { id: true, nombre: true, email: true, rol: true, foto: true, createdAt: true }
    })
    res.json(usuario)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Editar doctor (admin)
router.put('/:id', verificarToken, soloAdmin, async (req, res) => {
  try {
    const { nombre, email, password, rol, foto } = req.body
    const data = { nombre, email, rol }
    if (password) data.password = await bcrypt.hash(password, 10)
    if (foto !== undefined) data.foto = foto || null

    const usuario = await prisma.usuario.update({
      where: { id: parseInt(req.params.id) },
      data,
      select: { id: true, nombre: true, email: true, rol: true, foto: true, createdAt: true }
    })
    res.json(usuario)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Eliminar doctor (admin)
router.delete('/:id', verificarToken, soloAdmin, async (req, res) => {
  try {
    await prisma.usuario.delete({ where: { id: parseInt(req.params.id) } })
    res.json({ message: 'Usuario eliminado correctamente' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
