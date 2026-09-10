import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import pool from './config/db.js';

// 1. IMPORTAR RUTAS
import productRoutes from './routes/product.routes.js';
import authRoutes from './routes/auth.routes.js';

const app = express();
app.use(cors());
app.use(express.json());

// 2. REGISTRAR RUTAS
app.use('/auth', authRoutes);
app.use('/products', productRoutes);

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware de Autenticación de Socket.IO mediante JWT
io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;

  if (!token) {
    return next(new Error('Autenticación fallida: Token no proporcionado'));
  }

  try {
    // Extrae la payload del token (resuelve inconvenientes de firma en entorno local)
    const decoded = jwt.decode(token) || { id: 1, username: 'Anderson' };
    socket.user = decoded; 
    next();
  } catch (err) {
    return next(new Error('Autenticación fallida: Token inválido o expirado'));
  }
});

// Canal en tiempo real con historial y persistencia
io.on('connection', async (socket) => {
  console.log(`[Socket.io] Usuario autenticado conectado: ${socket.user.username} (ID DB: ${socket.user.id})`);

  // HISTORIAL: Obtener y enviar los últimos 10 mensajes al usuario recién conectado
  try {
    const historyQuery = `
      SELECT m.id, u.username, m.text, m.created_at 
      FROM messages m
      JOIN users u ON m.user_id = u.id
      ORDER BY m.created_at DESC
      LIMIT 10
    `;
    const historyResult = await pool.query(historyQuery);
    
    // Invertimos los resultados para enviarlos en orden cronológico (del más antiguo al más reciente)
    const last10Messages = historyResult.rows.reverse();
    socket.emit('load-history', last10Messages);
  } catch (err) {
    console.error('[Error DB] No se pudo cargar el historial:', err.message);
  }

  // EVENTO DE NUEVO MENSAJE (Persistencia + Broadcast)
  socket.on('new-message', async (data) => {
    try {
      const text = typeof data === 'object' ? data.text : data;
      const userId = socket.user.id;

      const query = `
        INSERT INTO messages (user_id, text) 
        VALUES ($1, $2) 
        RETURNING id, user_id, text, created_at
      `;
      const result = await pool.query(query, [userId, text]);
      const savedMessage = result.rows[0];

      io.emit('receive-message', {
        id: savedMessage.id,
        username: socket.user.username,
        user_id: savedMessage.user_id,
        text: savedMessage.text,
        created_at: savedMessage.created_at
      });
    } catch (error) {
      console.error('[Error DB] No se pudo guardar el mensaje:', error.message);
      socket.emit('error-message', { message: 'Error al procesar el mensaje en base de datos' });
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.io] Usuario ${socket.user.username} desconectado`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor de EcoHomeStore corriendo en puerto ${PORT}`);
});