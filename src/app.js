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
  console.log('Cliente conectado via Socket.IO:', socket.id);

  // 1. Enviar los últimos 10 mensajes al conectar
  try {
    const historyQuery = `
      SELECT m.id, COALESCE(u.username, 'Anónimo') AS username, m.text, m.created_at
      FROM messages m
      LEFT JOIN users u ON m.user_id = u.id
      ORDER BY m.id DESC LIMIT 10;
    `;
    const historyRes = await pool.query(historyQuery);
    // Invertir para orden cronológico y emitir evento "messages"
    socket.emit('messages', historyRes.rows.reverse());
  } catch (err) {
    console.error('Error al cargar historial:', err.message);
  }

  // 2. Escuchar 'new-message', guardar en Postgres y hacer BROADCAST a todos
  socket.on('new-message', async (data) => {
    try {
      const textMessage = typeof data === 'string' ? data : (data.text || data.message || 'Mensaje de prueba');
      const userId = socket.user ? socket.user.id : 4;
      const username = socket.user ? socket.user.username : 'AndersonPrueba';

      const insertQuery = `
        INSERT INTO messages (user_id, text)
        VALUES ($1, $2) RETURNING id, text, created_at;
      `;
      const insertRes = await pool.query(insertQuery, [userId, textMessage]);

      const savedMsg = {
        id: insertRes.rows[0].id,
        username: username,
        text: insertRes.rows[0].text,
        created_at: insertRes.rows[0].created_at
      };

      // BROADCAST a absolutamente todos los clientes conectados
      io.emit('new-message', savedMsg);
    } catch (err) {
      console.error('Error al insertar mensaje:', err.message);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor activo en el puerto ${PORT}`);
});