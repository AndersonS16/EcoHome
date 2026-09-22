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
  const username = socket.handshake.query.username || 'Arturo';

  try {
    // Carga de los últimos 10 mensajes al conectar
    const historyQuery = `
      SELECT id, username, text, created_at 
      FROM messages 
      ORDER BY id DESC LIMIT 10;
    `;
    const historyRes = await pool.query(historyQuery);
    socket.emit('messages', historyRes.rows.reverse());
  } catch (err) {
    console.error('Error al cargar historial de chat:', err);
  }

  // Recepción e inserción de nuevos mensajes
  socket.on('new-message', async (data) => {
    try {
      const insertQuery = `
        INSERT INTO messages (username, text) 
        VALUES ($1, $2) RETURNING id, username, text, created_at;
      `;
      const newMsgRes = await pool.query(insertQuery, [data.user || username, data.text]);
      io.emit('new-message', newMsgRes.rows[0]);
    } catch (err) {
      console.error('Error al guardar mensaje:', err);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor activo en el puerto ${PORT}`);
});