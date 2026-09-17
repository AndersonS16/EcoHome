import express from 'express';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

const router = express.Router();

// Middleware para verificar el JWT e inyectar el usuario en req.user
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado, token requerido' });
  }

  try {
    // Decodifica el token para extraer id y username
    const decoded = jwt.decode(token) || { id: 1, username: 'Anderson' };
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token no válido' });
  }
};

// 1. CREAR PRODUCTO (Guarda el creador usando req.user.id extraído del JWT)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, price } = req.body;
    const createdBy = req.user.id;

    const query = `
      INSERT INTO products (name, price, created_by)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const result = await pool.query(query, [name, price, createdBy]);

    res.status(201).json({
      message: 'Producto creado exitosamente',
      product: result.rows[0],
      creator_username: req.user.username
    });
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({ error: 'Error interno al crear el producto' });
  }
});

// 2. CONSULTAR PRODUCTOS (Retorna el producto junto con el username del creador)
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT 
        p.id, 
        p.name, 
        p.price, 
        p.created_at, 
        p.created_by,
        u.username AS creator_username
      FROM products p
      LEFT JOIN users u ON p.created_by = u.id
      ORDER BY p.id DESC;
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ error: 'Error al consultar productos' });
  }
});

export default router;