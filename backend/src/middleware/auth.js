import jwt from 'jsonwebtoken';
import 'dotenv/config';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

export function autenticar(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'token requerido' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'token inválido o expirado' });
  }
}

export function requiereRol(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'no autenticado' });
    if (!roles.includes(req.user.rol)) return res.status(403).json({ error: 'sin permisos' });
    next();
  };
}

export function firmarToken(usuario) {
  return jwt.sign(
    { id: usuario.id, email: usuario.email, nombre: usuario.nombre, area: usuario.area, rol: usuario.rol },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );
}
