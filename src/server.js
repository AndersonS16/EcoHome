import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import pool from './config/db.js'; // Conexión a PostgreSQL existente

// 1. IMPORTAR RUTAS
import productRoutes from './routes/product.routes.js';
import authRoutes from './routes/auth.routes.js';

dotenv.config();

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
    // Validar firma del token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'clave_secreta_super_segura_ecohome');
    // Asociar datos del usuario directamente al socket
    socket.user = decoded; 
    next();
  } catch (err) {
    return next(new Error('Autenticación fallida: Token inválido o expirado'));
  }
});

// Canal en tiempo real con persistencia
io.on('connection', (socket) => {
  console.log(`[Socket.io] Usuario autenticado conectado: ${socket.user.username} (ID DB: ${socket.user.id})`);

  socket.on('new-message', async (data) => {
    try {
      const text = typeof data === 'object' ? data.text : data;
      const userId = socket.user.id;

      // Persistencia en base de datos PostgreSQL
      const query = `
        INSERT INTO messages (user_id, text) 
        VALUES ($1, $2) 
        RETURNING id, user_id, text, created_at
      `;
      const result = await pool.query(query, [userId, text]);
      const savedMessage = result.rows[0];

      // Broadcast con datos enriquecidos del usuario autenticado
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