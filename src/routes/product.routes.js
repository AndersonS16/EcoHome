import { Router } from 'express';
import productModel from '../models/product.model.js';
import { authJWT, authorizeRole } from '../middlewares/auth.middleware.js';

const router = Router();

// Middleware de validación de datos de entrada (name y price)
const validateProduct = (req, res, next) => {
  const { name, price } = req.body;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'El nombre del producto es obligatorio y debe ser texto' });
  }

  const numericPrice = Number(price);
  if (isNaN(numericPrice) || numericPrice <= 0) {
    return res.status(400).json({ error: 'El precio debe ser un número mayor a 0' });
  }

  next();
};

// GET /products -> Devuelve todos los productos (Público)
router.get('/', async (req, res) => {
  try {
    const products = await productModel.getAll();
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /products/:id -> Devuelve un producto por ID (Público)
router.get('/:id', async (req, res) => {
  try {
    const product = await productModel.getById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /products -> Crear producto (Protegida: Admin)
router.post('/', authJWT, authorizeRole('admin'), validateProduct, async (req, res) => {
  try {
    const newProduct = await productModel.create(req.body);
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /products/:id -> Actualizar producto (Protegida: Admin)
router.put('/:id', authJWT, authorizeRole('admin'), validateProduct, async (req, res) => {
  try {
    const updatedProduct = await productModel.update(req.params.id, req.body);
    if (!updatedProduct) {
      return res.status(404).json({ error: 'Producto no encontrado para actualizar' });
    }
    res.status(200).json(updatedProduct);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /products/:id -> Eliminar producto (Protegida: Admin)
router.delete('/:id', authJWT, authorizeRole('admin'), async (req, res) => {
  try {
    const deletedProduct = await productModel.delete(req.params.id);
    if (!deletedProduct) {
      return res.status(404).json({ error: 'Producto no encontrado para eliminar' });
    }
    res.status(200).json({ message: 'Producto eliminado exitosamente', product: deletedProduct });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;