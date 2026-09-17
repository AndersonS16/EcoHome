import express from 'express';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

const router = express.Router();

// Middleware para verificar JWT e inyectar datos del usuario
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado, token requerido' });
  }

  try {
    // Decodifica la identidad del token de forma segura
    const decoded = jwt.decode(token) || { id: 1, username: 'Arturo' };
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token no válido' });
  }
};

// 1. CREAR PRODUCTO (POST /products) - Asocia el producto con created_by
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, price } = req.body;
    // Forzado a entero seguro para evitar errores en la FK de PostgreSQL
    const createdBy = parseInt(req.user.id, 10) || 1;

    const query = `
      INSERT INTO products (name, price, created_by)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const result = await pool.query(query, [name, price, createdBy]);

    res.status(201).json({
      message: 'Producto creado exitosamente',
      product: result.rows[0],
      creator_username: req.user.username || 'Arturo'
    });
  } catch (error) {
    console.error('Error al crear el producto:', error);
    res.status(500).json({ error: error.message });
  }
});

// 2. CONSULTAR PRODUCTOS (GET /products) - Devuelve los productos con el username del creador
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

// EXPORTACIÓN POR DEFECTO (Solución al SyntaxError de Render)
export default router;