const express = require('express')
const router = express.Router()
const prisma = require('../prisma')
const { verificarToken } = require('../middleware/auth')

// GET /api/caja/resumen — KPIs del día (o del rango dado)
router.get('/resumen', verificarToken, async (req, res) => {
  try {
    const { desde, hasta, usuarioId } = req.query
    const usuario = req.usuario

    const inicioDia = desde ? new Date(desde) : new Date()
    inicioDia.setHours(0, 0, 0, 0)
    const finDia = hasta ? new Date(hasta) : new Date()
    finDia.setHours(23, 59, 59, 999)

    const whereMovimiento = {
      fecha: { gte: inicioDia, lte: finDia }
    }
    if (usuario.rol !== 'admin') {
      whereMovimiento.usuarioId = usuario.id
    } else if (usuarioId && usuarioId !== 'todos') {
      whereMovimiento.usuarioId = parseInt(usuarioId)
    }

    const movimientos = await prisma.movimientoCaja.findMany({ where: whereMovimiento })

    const ingresos = movimientos.filter(m => m.tipo === 'INGRESO').reduce((s, m) => s + m.monto, 0)
    const egresos  = movimientos.filter(m => m.tipo === 'EGRESO').reduce((s, m) => s + m.monto, 0)

    const whereDeudor = { estado: 'PENDIENTE' }
    if (usuario.rol !== 'admin') {
      whereDeudor.registradoPorId = usuario.id
    }
    const deudores = await prisma.deudorCita.findMany({ where: whereDeudor })
    const totalPorCobrar = deudores.reduce((s, d) => s + d.monto, 0)

    const tratamientos = movimientos
      .filter(m => m.tipo === 'INGRESO' && (m.categoria === 'Consulta' || m.categoria === 'Tratamiento'))
      .reduce((s, m) => s + m.monto, 0)

    res.json({
      ingresos,
      egresos,
      cajaNeta: ingresos - egresos,
      totalPorCobrar,
      tratamientos,
      balance: ingresos - egresos
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// GET /api/caja/grafico — datos últimos 7 días para gráfico
router.get('/grafico', verificarToken, async (req, res) => {
  try {
    const usuario = req.usuario
    const dias = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      dias.push(d)
    }

    const inicio = new Date(dias[0])
    inicio.setHours(0, 0, 0, 0)
    const fin = new Date(dias[dias.length - 1])
    fin.setHours(23, 59, 59, 999)

    const where = { fecha: { gte: inicio, lte: fin } }
    if (usuario.rol !== 'admin') where.usuarioId = usuario.id

    const movimientos = await prisma.movimientoCaja.findMany({ where })

    const datos = dias.map(dia => {
      const label = dia.toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit' })
      const ingresos = movimientos
        .filter(m => {
          const f = new Date(m.fecha)
          return f.toDateString() === dia.toDateString() && m.tipo === 'INGRESO'
        })
        .reduce((s, m) => s + m.monto, 0)
      const egresos = movimientos
        .filter(m => {
          const f = new Date(m.fecha)
          return f.toDateString() === dia.toDateString() && m.tipo === 'EGRESO'
        })
        .reduce((s, m) => s + m.monto, 0)
      return { label, ingresos, egresos }
    })

    res.json(datos)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// GET /api/caja/movimientos — lista con filtros
router.get('/movimientos', verificarToken, async (req, res) => {
  try {
    const { desde, hasta, usuarioId, tipo } = req.query
    const usuario = req.usuario

    const where = {}

    if (desde) {
      const d = new Date(desde)
      d.setHours(0, 0, 0, 0)
      where.fecha = { ...where.fecha, gte: d }
    }
    if (hasta) {
      const d = new Date(hasta)
      d.setHours(23, 59, 59, 999)
      where.fecha = { ...where.fecha, lte: d }
    }
    if (tipo && tipo !== 'todos') where.tipo = tipo.toUpperCase()

    if (usuario.rol !== 'admin') {
      where.usuarioId = usuario.id
    } else if (usuarioId && usuarioId !== 'todos') {
      where.usuarioId = parseInt(usuarioId)
    }

    const movimientos = await prisma.movimientoCaja.findMany({
      where,
      include: { usuario: { select: { nombre: true } } },
      orderBy: { fecha: 'desc' }
    })

    res.json(movimientos)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// POST /api/caja/movimientos — crear movimiento manual
router.post('/movimientos', verificarToken, async (req, res) => {
  try {
    const { tipo, categoria, concepto, monto, fecha } = req.body
    if (!tipo || !categoria || !concepto || !monto) {
      return res.status(400).json({ error: 'Faltan campos requeridos' })
    }
    const movimiento = await prisma.movimientoCaja.create({
      data: {
        tipo: tipo.toUpperCase(),
        categoria,
        concepto,
        monto: parseFloat(monto),
        fecha: fecha ? new Date(fecha) : new Date(),
        usuarioId: req.usuario.id
      },
      include: { usuario: { select: { nombre: true } } }
    })
    res.status(201).json(movimiento)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// DELETE /api/caja/movimientos/:id
router.delete('/movimientos/:id', verificarToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const movimiento = await prisma.movimientoCaja.findUnique({ where: { id } })
    if (!movimiento) return res.status(404).json({ error: 'Movimiento no encontrado' })
    if (req.usuario.rol !== 'admin' && movimiento.usuarioId !== req.usuario.id) {
      return res.status(403).json({ error: 'Sin permiso para eliminar este movimiento' })
    }
    await prisma.movimientoCaja.delete({ where: { id } })
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// GET /api/caja/deudores — lista deudores
router.get('/deudores', verificarToken, async (req, res) => {
  try {
    const { estado } = req.query
    const usuario = req.usuario

    const where = { estado: estado || 'PENDIENTE' }
    if (usuario.rol !== 'admin') where.registradoPorId = usuario.id

    const deudores = await prisma.deudorCita.findMany({
      where,
      include: {
        paciente: { select: { nombre: true, telefono: true } },
        cita:     { select: { fecha: true, motivo: true } },
        registradoPor: { select: { nombre: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json(deudores)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// POST /api/caja/deudores — crear deudor desde cita
router.post('/deudores', verificarToken, async (req, res) => {
  try {
    const { citaId, monto, concepto } = req.body
    if (!citaId || !monto || !concepto) {
      return res.status(400).json({ error: 'Faltan campos requeridos' })
    }

    const cita = await prisma.cita.findUnique({ where: { id: parseInt(citaId) } })
    if (!cita) return res.status(404).json({ error: 'Cita no encontrada' })

    const existe = await prisma.deudorCita.findUnique({ where: { citaId: parseInt(citaId) } })
    if (existe) return res.status(400).json({ error: 'Esta cita ya tiene un deudor registrado' })

    const deudor = await prisma.deudorCita.create({
      data: {
        citaId: parseInt(citaId),
        pacienteId: cita.pacienteId,
        monto: parseFloat(monto),
        concepto,
        registradoPorId: req.usuario.id
      },
      include: {
        paciente: { select: { nombre: true, telefono: true } },
        cita:     { select: { fecha: true, motivo: true } }
      }
    })
    res.status(201).json(deudor)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// PATCH /api/caja/deudores/:id/pagar — marcar como pagado
router.patch('/deudores/:id/pagar', verificarToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const { registrarIngreso } = req.body

    const deudor = await prisma.deudorCita.findUnique({
      where: { id },
      include: { paciente: { select: { nombre: true } } }
    })
    if (!deudor) return res.status(404).json({ error: 'Deudor no encontrado' })

    const updatedDeudor = await prisma.deudorCita.update({
      where: { id },
      data: { estado: 'PAGADO', fechaPago: new Date() }
    })

    if (registrarIngreso) {
      await prisma.movimientoCaja.create({
        data: {
          tipo: 'INGRESO',
          categoria: 'Consulta',
          concepto: `Cobro deuda: ${deudor.concepto} (${deudor.paciente.nombre})`,
          monto: deudor.monto,
          usuarioId: req.usuario.id
        }
      })
    }

    res.json(updatedDeudor)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

module.exports = router
