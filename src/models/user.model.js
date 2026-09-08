import pool from '../config/db.js';

class UserModel {
  async create({ username, email, password_hash, role = 'cliente' }) {
    const query = `
      INSERT INTO users (username, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, username, email, role, created_at;
    `;
    const values = [username, email, password_hash, role];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const { rows } = await pool.query(query, [email]);
    return rows[0];
  }
}

export default new UserModel();