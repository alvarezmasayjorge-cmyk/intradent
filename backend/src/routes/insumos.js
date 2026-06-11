const express = require('express')
const router = express.Router()
const prisma = require('../prisma')
const { verificarToken } = require('../middleware/auth')

const soloAdmin = (req, res, next) => {
  if (req.usuario.rol !== 'admin') {
    return res.status(403).json({ error: 'Solo administradores pueden gestionar inventario' })
  }
  next()
}

router.get('/', verificarToken, soloAdmin, async (req, res) => {
  try {
    const insumos = await prisma.insumo.findMany({
      orderBy: { nombre: 'asc' }
    })
    res.json(insumos)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.get('/:id', verificarToken, soloAdmin, async (req, res) => {
  try {
    const insumo = await prisma.insumo.findUnique({
      where: { id: parseInt(req.params.id) }
    })
    if (!insumo) return res.status(404).json({ error: 'Insumo no encontrado' })
    res.json(insumo)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/', verificarToken, soloAdmin, async (req, res) => {
  try {
    const { nombre, cantidad, minimo, proveedor, precio } = req.body
    const insumo = await prisma.insumo.create({
      data: {
        nombre,
        cantidad: parseInt(cantidad) || 0,
        minimo: parseInt(minimo) || 0,
        proveedor: proveedor || null,
        precio: precio ? parseFloat(precio) : null
      }
    })
    res.json(insumo)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.put('/:id', verificarToken, soloAdmin, async (req, res) => {
  try {
    const { nombre, cantidad, minimo, proveedor, precio } = req.body
    const insumo = await prisma.insumo.update({
      where: { id: parseInt(req.params.id) },
      data: {
        nombre,
        cantidad: cantidad !== undefined ? parseInt(cantidad) : undefined,
        minimo: minimo !== undefined ? parseInt(minimo) : undefined,
        proveedor: proveedor || null,
        precio: precio ? parseFloat(precio) : null
      }
    })
    res.json(insumo)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.patch('/:id/stock', verificarToken, soloAdmin, async (req, res) => {
  try {
    const { delta } = req.body
    const insumo = await prisma.insumo.findUnique({
      where: { id: parseInt(req.params.id) }
    })
    if (!insumo) return res.status(404).json({ error: 'Insumo no encontrado' })

    const nuevaCantidad = Math.max(0, insumo.cantidad + delta)
    const actualizado = await prisma.insumo.update({
      where: { id: parseInt(req.params.id) },
      data: { cantidad: nuevaCantidad }
    })
    res.json(actualizado)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.delete('/:id', verificarToken, soloAdmin, async (req, res) => {
  try {
    await prisma.insumo.delete({
      where: { id: parseInt(req.params.id) }
    })
    res.json({ message: 'Insumo eliminado correctamente' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
