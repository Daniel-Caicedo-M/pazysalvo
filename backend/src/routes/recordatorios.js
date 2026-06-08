import { Router } from 'express';
import { autenticar, requiereRol } from '../middleware/auth.js';
import {
  obtenerPendientesPorResponsable,
  ejecutarRecordatorios,
  recordarA,
} from '../services/recordatorios.js';
import 'dotenv/config';

const router = Router();

router.get('/preview', autenticar, requiereRol('admin', 'rrhh'), async (req, res) => {
  const ignorarUmbral = req.query.ignorarUmbral === 'true';
  const pendientes = await obtenerPendientesPorResponsable({ ignorarUmbral });
  res.json({
    umbralDias: parseInt(process.env.RECORDATORIO_DIAS_UMBRAL || '2', 10),
    ignorarUmbral,
    totalResponsables: pendientes.length,
    pendientes: pendientes.map(p => ({
      usuario_id: p.usuario_id,
      email: p.email,
      nombre: p.nombre,
      actasPendientes: p.actas.length,
      actas: p.actas,
    })),
  });
});

router.post('/enviar', autenticar, requiereRol('admin', 'rrhh'), async (req, res) => {
  const ignorarUmbral = Boolean(req.body.ignorarUmbral);
  try {
    const r = await ejecutarRecordatorios({
      ignorarUmbral, disparadoPor: `manual:${req.user.email}`,
    });
    res.json(r);
  } catch (err) {
    console.error('[recordatorios] error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/enviar/:usuarioId', autenticar, requiereRol('admin', 'rrhh'), async (req, res) => {
  const usuarioId = parseInt(req.params.usuarioId, 10);
  try {
    const r = await recordarA(usuarioId, { disparadoPor: `manual:${req.user.email}` });
    res.json(r);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/cron', async (req, res) => {
  const secret = req.query.secret || req.headers['x-cron-secret'];
  if (!secret || secret !== process.env.RECORDATORIO_CRON_SECRET) {
    return res.status(401).json({ error: 'no autorizado' });
  }
  try {
    const r = await ejecutarRecordatorios({ disparadoPor: 'cron' });
    res.json({ ok: true, timestamp: new Date().toISOString(), ...r });
  } catch (err) {
    console.error('[cron] error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
