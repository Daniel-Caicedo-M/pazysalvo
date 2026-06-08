import { query } from '../db/index.js';
import { enviarCorreo, plantillaRecordatorio } from './email.js';
import { registrarAuditoria } from './auditoria.js';
import 'dotenv/config';

const DIAS_UMBRAL = parseInt(process.env.RECORDATORIO_DIAS_UMBRAL || '2', 10);

export async function obtenerPendientesPorResponsable({ ignorarUmbral = false } = {}) {
  const sql = `
    SELECT u.id AS usuario_id, u.email, u.nombre,
           json_agg(json_build_object(
             'id', a.id,
             'codigo', a.codigo,
             'colaborador_nombre', a.colaborador_nombre,
             'colaborador_cc', a.colaborador_cc,
             'cargo', a.cargo,
             'created_at', a.created_at
           ) ORDER BY a.created_at ASC) AS actas
    FROM usuarios u
    INNER JOIN acta_responsables ar ON ar.usuario_id = u.id
    INNER JOIN actas a ON a.id = ar.acta_id
    LEFT JOIN firmas f ON f.acta_id = a.id AND f.usuario_id = u.id
    WHERE u.activo = TRUE
      AND u.rol = 'firmante'
      AND a.estado = 'en_proceso'
      AND f.id IS NULL
      ${ignorarUmbral ? '' : `AND a.created_at < NOW() - INTERVAL '${DIAS_UMBRAL} days'`}
    GROUP BY u.id, u.email, u.nombre
    ORDER BY u.nombre`;
  const res = await query(sql);
  return res.rows;
}

export async function ejecutarRecordatorios({ ignorarUmbral = false, disparadoPor = 'cron' } = {}) {
  const pendientes = await obtenerPendientesPorResponsable({ ignorarUmbral });
  const detalle = [];
  let enviados = 0;
  let fallidos = 0;

  for (const p of pendientes) {
    const { html, text } = plantillaRecordatorio({
      nombreResponsable: p.nombre,
      actasPendientes: p.actas,
    });
    const subject = p.actas.length === 1
      ? `Tienes 1 acta de Paz y Salvo pendiente`
      : `Tienes ${p.actas.length} actas de Paz y Salvo pendientes`;
    const r = await enviarCorreo({ to: p.email, subject, html, text });
    if (r.ok) {
      enviados++;
      await registrarAuditoria({
        usuarioId: p.usuario_id,
        accion: 'recordatorio_enviado',
        detalle: { actas: p.actas.map(a => a.codigo), disparadoPor },
      });
    } else fallidos++;
    detalle.push({ email: p.email, nombre: p.nombre, actas: p.actas.length, enviado: r.ok, error: r.error });
  }
  return { enviados, fallidos, total: pendientes.length, detalle };
}

export async function recordarA(usuarioId, { disparadoPor = 'admin' } = {}) {
  const userRes = await query(
    `SELECT id, email, nombre FROM usuarios WHERE id = $1 AND activo = TRUE`,
    [usuarioId]
  );
  if (userRes.rows.length === 0) throw new Error('usuario no encontrado');
  const u = userRes.rows[0];
  const actasRes = await query(`
    SELECT a.id, a.codigo, a.colaborador_nombre, a.colaborador_cc, a.cargo, a.created_at
    FROM actas a
    INNER JOIN acta_responsables ar ON ar.acta_id = a.id
    LEFT JOIN firmas f ON f.acta_id = a.id AND f.usuario_id = $1
    WHERE ar.usuario_id = $1 AND a.estado = 'en_proceso' AND f.id IS NULL
    ORDER BY a.created_at ASC`, [usuarioId]);
  if (actasRes.rows.length === 0) return { ok: true, sinPendientes: true };
  const { html, text } = plantillaRecordatorio({
    nombreResponsable: u.nombre, actasPendientes: actasRes.rows,
  });
  const subject = actasRes.rows.length === 1
    ? `Tienes 1 acta de Paz y Salvo pendiente`
    : `Tienes ${actasRes.rows.length} actas de Paz y Salvo pendientes`;
  const r = await enviarCorreo({ to: u.email, subject, html, text });
  await registrarAuditoria({
    usuarioId: u.id, accion: 'recordatorio_enviado',
    detalle: { actas: actasRes.rows.map(a => a.codigo), disparadoPor },
  });
  return { ok: r.ok, email: u.email, actas: actasRes.rows.length, error: r.error };
}
