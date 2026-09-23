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

const SECRET_KEY = process.env.JWT_SECRET || 'clave_secreta_super_segura_ecohome';

app.use(cors());
app.use(express.json());

// Registro de Rutas API REST
app.use('/auth', authRoutes);
app.use('/products', productRoutes);
app.use('/users', userRoutes);

app.get('/', (req, res) => {
  res.send('API de EcoHomeStore corriendo correctamente en Render 🚀');
});

// Middleware de Socket.IO para autenticación JWT
io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  if (!token) return next(new Error('Autenticación requerida'));

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) return next(new Error('Token inválido'));
    socket.user = decoded; // Adjunta { id, username } al socket
    next();
  });
});

io.on('connection', async (socket) => {
  console.log('Cliente conectado:', socket.id);

  // 1. Cargar historial directo desde Supabase
  try {
    const historyRes = await pool.query(`
      SELECT m.id, COALESCE(u.username, 'AndersonPrueba') AS username, m.text, m.created_at
      FROM messages m
      LEFT JOIN users u ON m.user_id = u.id
      ORDER BY m.id DESC LIMIT 10;
    `);
    
    // Forzar el envío del evento 'messages' al socket conectado
    socket.emit('messages', historyRes.rows.reverse());
  } catch (err) {
    console.error('Error al cargar historial desde Supabase:', err.message);
    socket.emit('error', err.message);
  }

  // 2. Escuchar nuevo mensaje
  socket.on('new-message', async (data) => {
    try {
      const textMsg = typeof data === 'object' ? data.text : data;
      const insertRes = await pool.query(
        'INSERT INTO messages (user_id, text) VALUES ($1, $2) RETURNING id, text, created_at',
        [4, textMsg]
      );

      const savedMsg = {
        id: insertRes.rows[0].id,
        username: 'AndersonPrueba',
        text: insertRes.rows[0].text,
        created_at: insertRes.rows[0].created_at
      };

      io.emit('new-message', savedMsg);
    } catch (err) {
      console.error('Error al insertar en Supabase:', err.message);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor activo en el puerto ${PORT}`);
});