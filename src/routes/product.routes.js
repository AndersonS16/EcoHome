// POST /products - Crear producto con la relación del creador
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, price } = req.body;
    // Convierte el id a un entero seguro
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
    console.error('Error interno al insertar el producto:', error);
    res.status(500).json({ error: error.message });
  }
});