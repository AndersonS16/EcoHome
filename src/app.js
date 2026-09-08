import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import productRoutes from './routes/product.routes.js';
import authRoutes from './routes/auth.routes.js';

const app = express();

app.use(express.json());

// Registrar rutas
app.use('/auth', authRoutes);
app.use('/products', productRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'EcoHomeStore API funcionando' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});