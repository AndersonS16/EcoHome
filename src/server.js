// src/server.js
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log(`[Socket.io] Usuario conectado. ID: ${socket.id}`);

  socket.on('new-message', (data) => {
    console.log('[Socket.io] Mensaje recibido:', data);
    io.emit('receive-message', data);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.io] Usuario desconectado. ID: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});