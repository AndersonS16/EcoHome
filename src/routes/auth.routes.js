import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import userModel from '../models/user.model.js';

const router = Router();

// POST /auth/signup (Registro sin contraseñas en texto plano)
router.post('/signup', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    // Encriptar contraseña
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const newUser = await userModel.create({
      username,
      email,
      password_hash,
      role: role || 'cliente'
    });

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: newUser
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /auth/login (Valida credenciales y devuelve JWT)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await userModel.findByEmail(email);
    if (!user) {
      return res.status(400).json({ error: 'Credenciales inválidas' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(400).json({ error: 'Credenciales inválidas' });
    }

    // Generar JWT
    const payload = {
      id: user.id,
      username: user.username,
      role: user.role
    };

    const token = jwt.sign(
      payload, 
      process.env.JWT_SECRET || 'clave_secreta_super_segura_ecohome', 
      { expiresIn: '2h' }
    );

    res.json({
      message: 'Login exitoso',
      token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;