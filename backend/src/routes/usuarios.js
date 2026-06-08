import { Router } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { query } from '../db/index.js';
import { autenticar, requiereRol } from '../middleware/auth.js';
import { registrarAuditoria } from '../services/auditoria.js';
import 'dotenv/config';

const router = Router();
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);

router.get('/', autenticar, async (req, res) => {
  const { rol } = req.user;
  let result;
  if (rol === 'admin') {
    result = await query(
      `SELECT id, email, nombre, area, rol, must_change_pwd, activo, created_at
       FROM usuarios ORDER BY area, nombre`
    );
  } else {
    result = await query(
      `SELECT id, email, nombre, area, rol FROM usuarios
       WHERE rol = 'firmante' AND activo = TRUE ORDER BY area, nombre`
    );
  }
  res.json({ usuarios: result.rows });
});

const crearUsuarioSchema = z.object({
  email: z.string().email(),
  nombre: z.string().min(2),
  area: z.string().min(2),
  rol: z.enum(['admin', 'rrhh', 'firmante']),
});

router.post('/', autenticar, requiereRol('admin'), async (req, res) => {
  const parsed = crearUsuarioSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'datos inválidos' });
  const { email, nombre, area, rol } = parsed.data;
  const INITIAL_PASSWORD = process.env.INITIAL_PASSWORD || 'Siesa2026*';
  const hash = await bcrypt.hash(INITIAL_PASSWORD, BCRYPT_ROUNDS);
  try {
    const result = await query(
      `INSERT INTO usuarios (email, nombre, area, rol, password_hash, must_change_pwd)
       VALUES ($1, $2, $3, $4, $5, TRUE)
       RETURNING id, email, nombre, area, rol`,
      [email.toLowerCase(), nombre, area, rol, hash]
    );
    await registrarAuditoria({
      usuarioId: req.user.id, accion: 'usuario_creado', entidad: 'usuario',
      entidadId: result.rows[0].id, detalle: { email, rol }, ipOrigen: req.ip,
    });
    res.status(201).json({ usuario: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'email ya registrado' });
    throw err;
  }
});

router.post('/:id/reset-password', autenticar, requiereRol('admin'), async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const INITIAL_PASSWORD = process.env.INITIAL_PASSWORD || 'Siesa2026*';
  const hash = await bcrypt.hash(INITIAL_PASSWORD, BCRYPT_ROUNDS);
  const result = await query(
    `UPDATE usuarios SET password_hash = $1, must_change_pwd = TRUE WHERE id = $2 RETURNING id, email`,
    [hash, userId]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: 'usuario no encontrado' });
  await registrarAuditoria({
    usuarioId: req.user.id, accion: 'password_reseteado', entidad: 'usuario',
    entidadId: userId, ipOrigen: req.ip,
  });
  res.json({ ok: true, email: result.rows[0].email });
});

router.patch('/:id/activo', autenticar, requiereRol('admin'), async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const { activo } = req.body;
  const result = await query(
    `UPDATE usuarios SET activo = $1 WHERE id = $2 RETURNING id, email, activo`,
    [Boolean(activo), userId]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: 'usuario no encontrado' });
  res.json({ usuario: result.rows[0] });
});

export default router;
