import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  host: 'localhost',
  user: 'postgres',
  password: 'postgres',
  database: 'ecohome_db',
  port: 5432,
});

pool.on('connect', () => {
  console.log('Conectado a PostgreSQL exitosamente');
});

export default pool;