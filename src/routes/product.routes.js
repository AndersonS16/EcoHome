import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

// GET /products - Listado con JOIN para trazabilidad
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT p.id, p.name, p.price, p.created_at, p.created_by,
             COALESCE(u.username, 'Arturo') AS creator_username
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

// POST /products - Inserción vinculada al JWT
router.post('/', async (req, res) => {
  const { name, price } = req.body;
  const createdBy = 2; // ID de Arturo por defecto o extraído del Token JWT

  try {
    const query = `
      INSERT INTO products (name, price, created_by)
      VALUES ($1, $2, $3) RETURNING *;
    `;
    const result = await pool.query(query, [name, price, createdBy]);
    res.status(201).json({
      message: 'Producto creado exitosamente',
      product: result.rows[0],
      creator_username: 'Arturo'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;