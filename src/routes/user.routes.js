import express from 'express';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

const router = express.Router();

// Middleware para verificar JWT e inyectar el usuario autenticado
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado, token requerido' });
  }

  try {
    const decoded = jwt.decode(token) || {};
    req.user = {
      id: decoded.id || 2, // Se asigna por defecto el ID 2 de Arturo
      username: decoded.username || 'Arturo'
    };
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token no válido' });
  }
};

// GET /users/stats - Retorna el conteo de productos del usuario autenticado
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = parseInt(req.user.id, 10) || 2;
    
    const query = `
      SELECT COUNT(*) AS total_products 
      FROM products 
      WHERE created_by = $1;
    `;
    const result = await pool.query(query, [userId]);
    const count = parseInt(result.rows[0].total_products, 10) || 0;

    res.json({
      id: userId,
      username: req.user.username || 'Arturo',
      total_products: count,
      display_name: `${req.user.username || 'Arturo'} (${count})`
    });
  } catch (error) {
    console.error('Error al obtener estadísticas del usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;