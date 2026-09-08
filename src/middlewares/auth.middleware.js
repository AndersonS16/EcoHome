import jwt from 'jsonwebtoken';

// Middleware para verificar que el token sea válido
export const authJWT = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado' });
  }

  const token = authHeader.split(' ')[1]; // Formato "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: 'Formato de token inválido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'clave_secreta_super_segura_ecohome');
    req.user = decoded; // Adjunta datos del payload (id, role, etc.)
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido o expirado' });
  }
};

// Middleware para restringir acceso por Rol (admin vs cliente)
export const authorizeRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== requiredRole) {
      return res.status(403).json({ 
        error: `Acceso prohibido. Se requiere rol de ${requiredRole}` 
      });
    }
    next();
  };
};