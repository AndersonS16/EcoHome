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
    req.user = user; // Contiene { id, username }
    next();
  });
};

// GET /users/stats - Dinámico para cualquier usuario con JWT
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const username = req.user.username;

    const query = `SELECT COUNT(*) AS total_products FROM products WHERE created_by = $1;`;
    const result = await pool.query(query, [userId]);
    const count = parseInt(result.rows[0].total_products, 10) || 0;

    res.json({
      id: userId,
      username: username,
      total_products: count,
      display_name: `${username} (${count})`
    });
  } catch (err) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;