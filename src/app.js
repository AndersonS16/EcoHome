import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import pool from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/product.routes.js';
import userRoutes from './routes/user.routes.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

// Registro de Rutas API REST
app.use('/auth', authRoutes);
app.use('/products', productRoutes);
app.use('/users', userRoutes);

app.get('/', (req, res) => {
  res.send('API de EcoHomeStore corriendo correctamente en Render 🚀');
});

// Lógica de Socket.IO con Persistencia y Límite de 10 Mensajes
io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.query?.username;
  if (!token) return next(new Error('Autenticación requerida'));
  next();
});

io.on('connection', async (socket) => {
  // Cargar el historial con JOIN para enviar los últimos 10 al conectar
  try {
    const historyQuery = `
      SELECT m.id, u.username, m.text, m.created_at
      FROM messages m
      JOIN users u ON m.user_id = u.id
      ORDER BY m.id DESC LIMIT 10;
    `;
    const historyRes = await pool.query(historyQuery);
    socket.emit('messages', historyRes.rows.reverse());
  } catch (err) {
    console.error('Error al cargar historial:', err);
  }

  // Escuchar 'new-message' y guardar en Postgres asociando user_id
  socket.on('new-message', async (data) => {
    try {
      const { username, text } = data;
      
      // 1. Obtener el id del usuario por su username
      const userRes = await pool.query('SELECT id FROM users WHERE username = $1', [username || 'AndersonPrueba']);
      const userId = userRes.rows.length > 0 ? userRes.rows[0].id : 1;

      // 2. Insertar mensaje con user_id
      const insertQuery = `
        INSERT INTO messages (user_id, text) 
        VALUES ($1, $2) RETURNING id, text, created_at;
      `;
      const insertRes = await pool.query(insertQuery, [userId, text]);

      const newMessage = {
        id: insertRes.rows[0].id,
        username: username || 'AndersonPrueba',
        text: text,
        created_at: insertRes.rows[0].created_at
      };

      // 3. Emitir a todos en tiempo real
      io.emit('new-message', newMessage);
    } catch (err) {
      console.error('Error al guardar mensaje en Postgres:', err);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor activo en el puerto ${PORT}`);
});