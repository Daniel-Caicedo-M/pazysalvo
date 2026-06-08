import { Router } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { query } from '../db/index.js';
import { firmarToken, autenticar } from '../middleware/auth.js';
import { registrarAuditoria } from '../services/auditoria.js';
import 'dotenv/config';

const router = Router();
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 10,
  message: { error: 'demasiados intentos de login, espera 15 minutos' },
});

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

router.post('/login', loginLimiter, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'datos inválidos' });
  const { email, password } = parsed.data;

  const result = await query(
    `SELECT id, email, nombre, area, rol, password_hash, must_change_pwd, activo
     FROM usuarios WHERE LOWER(email) = LOWER($1)`, [email]
  );
  if (result.rows.length === 0) return res.status(401).json({ error: 'credenciales inválidas' });
  const user = result.rows[0];
  if (!user.activo) return res.status(403).json({ error: 'usuario inactivo' });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    await registrarAuditoria({ usuarioId: user.id, accion: 'login_fallido', ipOrigen: req.ip });
    return res.status(401).json({ error: 'credenciales inválidas' });
  }
  await registrarAuditoria({ usuarioId: user.id, accion: 'login_exitoso', ipOrigen: req.ip });

  if (user.must_change_pwd) {
    const tempToken = firmarToken(user);
    return res.json({
      mustChangePassword: true, tempToken,
      usuario: { id: user.id, email: user.email, nombre: user.nombre, rol: user.rol },
    });
  }

  const token = firmarToken(user);
  return res.json({
    mustChangePassword: false, token,
    usuario: { id: user.id, email: user.email, nombre: user.nombre, area: user.area, rol: user.rol },
  });
});

const changePasswordSchema = z.object({
  newPassword: z.string().min(8, 'mínimo 8 caracteres')
    .regex(/[A-Z]/, 'debe contener al menos una mayúscula')
    .regex(/[0-9]/, 'debe contener al menos un número'),
});

router.post('/change-password', autenticar, async (req, res) => {
  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const { newPassword } = parsed.data;
  const INITIAL_PASSWORD = process.env.INITIAL_PASSWORD || 'Siesa2026*';
  if (newPassword === INITIAL_PASSWORD) {
    return res.status(400).json({ error: 'no puedes usar la contraseña inicial' });
  }
  const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await query(
    `UPDATE usuarios SET password_hash = $1, must_change_pwd = FALSE WHERE id = $2`,
    [newHash, req.user.id]
  );
  await registrarAuditoria({ usuarioId: req.user.id, accion: 'cambio_password', ipOrigen: req.ip });
  const result = await query(
    `SELECT id, email, nombre, area, rol FROM usuarios WHERE id = $1`, [req.user.id]
  );
  const user = result.rows[0];
  return res.json({ token: firmarToken(user), usuario: user });
});

router.get('/me', autenticar, async (req, res) => {
  const result = await query(
    `SELECT id, email, nombre, area, rol, must_change_pwd FROM usuarios WHERE id = $1`,
    [req.user.id]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: 'usuario no encontrado' });
  res.json({ usuario: result.rows[0] });
});

export default router;
