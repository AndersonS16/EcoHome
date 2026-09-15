import pkg from 'pg';
import 'dotenv/config';

const { Pool } = pkg;

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.on('connect', () => {
  console.log('Conectado a PostgreSQL en Supabase exitosamente');
});

export default pool;