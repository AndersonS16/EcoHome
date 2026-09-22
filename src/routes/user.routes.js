import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

// GET /users/stats - Retorna el contador dinámico Nombre (N)
router.get('/stats', async (req, res) => {
  try {
    const userId = 2; // ID asociado a Arturo
    const query = `SELECT COUNT(*) AS total_products FROM products WHERE created_by = $1;`;
    const result = await pool.query(query, [userId]);
    const count = parseInt(result.rows[0].total_products, 10) || 0;

    res.json({
      id: userId,
      username: 'Arturo',
      total_products: count,
      display_name: `Arturo (${count})`
    });
  } catch (err) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;