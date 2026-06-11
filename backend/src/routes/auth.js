const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const prisma = require('../prisma')

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    const usuario = await prisma.usuario.findUnique({ where: { email } })
    if (!usuario) return res.status(401).json({ error: 'Credenciales incorrectas' })

    const passwordValida = await bcrypt.compare(password, usuario.password)
    if (!passwordValida) return res.status(401).json({ error: 'Credenciales incorrectas' })

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, rol: usuario.rol, nombre: usuario.nombre },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      token,
      usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol, foto: usuario.foto }
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
