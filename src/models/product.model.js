import pool from '../config/db.js';

class ProductModel {
  // GET /products
  async getAll() {
    const query = 'SELECT * FROM products ORDER BY id ASC;';
    const { rows } = await pool.query(query);
    return rows;
  }

  // GET /products/:id
  async getById(id) {
    const query = 'SELECT * FROM products WHERE id = $1;';
    const { rows } = await pool.query(query, [id]);
    return rows[0];
  }

  // POST /products
  async create({ name, price }) {
    const query = `
      INSERT INTO products (name, price)
      VALUES ($1, $2)
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [name, price]);
    return rows[0];
  }

  // PUT /products/:id
  async update(id, { name, price }) {
    const query = `
      UPDATE products
      SET name = $1, price = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [name, price, id]);
    return rows[0];
  }

  // DELETE /products/:id
  async delete(id) {
    const query = 'DELETE FROM products WHERE id = $1 RETURNING *;';
    const { rows } = await pool.query(query, [id]);
    return rows[0];
  }
}

export default new ProductModel();