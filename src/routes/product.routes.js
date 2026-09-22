import express from 'express';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET || 'clave_secreta_super_segura_ecohome';

// Middleware para verificar JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token requerido' });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido o expirado' });
    req.user = user;
    next();
  });
};

// GET /products - Listado público con trazabilidad
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT p.id, p.name, p.price, p.created_at, p.created_by,
             COALESCE(u.username, 'Anónimo') AS creator_username
      FROM products p
      LEFT JOIN users u ON p.created_by = u.id
      ORDER BY p.id DESC;
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al consultar productos' });
  }
});

// POST /products - Asigna created_by según el usuario del JWT
router.post('/', authenticateToken, async (req, res) => {
  const { name, price } = req.body;
  const createdBy = req.user.id;

  if (!name || !price) return res.status(400).json({ error: 'Nombre y precio requeridos' });

  try {
    const query = `
      INSERT INTO products (name, price, created_by)
      VALUES ($1, $2, $3) RETURNING *;
    `;
    const result = await pool.query(query, [name, price, createdBy]);
    res.status(201).json({
      message: 'Producto creado exitosamente',
      product: result.rows[0],
      creator_username: req.user.username
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;