import { Router } from 'express';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { query, withTransaction } from '../db/index.js';
import { autenticar, requiereRol } from '../middleware/auth.js';
import { calcularHashActa } from '../services/firma.js';
import { registrarAuditoria } from '../services/auditoria.js';
import { enviarCorreo, plantillaNuevaActa } from '../services/email.js';

const router = Router();

const crearActaSchema = z.object({
  colaborador_nombre: z.string().min(2),
  colaborador_cc: z.string().min(5),
  colaborador_email: z.string().email().optional().nullable(),
  cargo: z.string().min(2),
  area: z.string().min(2),
  ciudad: z.string().min(2),
  tipo_retiro: z.enum(['Temporal', 'Definitivo']),
  fecha_retiro: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

router.get('/', autenticar, async (req, res) => {
  const { rol, id } = req.user;
  let result;
  if (rol === 'admin' || rol === 'rrhh') {
    result = await query(
      `SELECT a.*, u.nombre AS creada_por_nombre
       FROM actas a LEFT JOIN usuarios u ON u.id = a.creada_por
       ORDER BY a.created_at DESC LIMIT 200`
    );
  } else {
    result = await query(
      `SELECT DISTINCT a.*, u.nombre AS creada_por_nombre
       FROM actas a
       INNER JOIN acta_responsables ar ON ar.acta_id = a.id
       LEFT JOIN usuarios u ON u.id = a.creada_por
       WHERE ar.usuario_id = $1
       ORDER BY a.created_at DESC LIMIT 200`, [id]
    );
  }
  res.json({ actas: result.rows });
});

router.get('/:id', autenticar, async (req, res) => {
  const actaId = parseInt(req.params.id, 10);
  if (isNaN(actaId)) return res.status(400).json({ error: 'id inválido' });
  const actaRes = await query(`SELECT * FROM actas WHERE id = $1`, [actaId]);
  if (actaRes.rows.length === 0) return res.status(404).json({ error: 'acta no encontrada' });
  const acta = actaRes.rows[0];
  const responsables = await query(
    `SELECT ar.usuario_id, ar.area, ar.orden, u.nombre, u.email
     FROM acta_responsables ar INNER JOIN usuarios u ON u.id = ar.usuario_id
     WHERE ar.acta_id = $1 ORDER BY ar.orden ASC`, [actaId]
  );
  const firmas = await query(
    `SELECT id, usuario_id, usuario_email, usuario_nombre, area,
            hash_acta, hash_firma, hash_prev, observaciones, firmado_at
     FROM firmas WHERE acta_id = $1 ORDER BY firmado_at ASC`, [actaId]
  );
  res.json({ acta, responsables: responsables.rows, firmas: firmas.rows });
});

router.post('/', autenticar, requiereRol('rrhh', 'admin'), async (req, res) => {
  const parsed = crearActaSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'datos inválidos', detalles: parsed.error.issues });
  const datos = parsed.data;
  const codigo = `PYS-${new Date().getFullYear()}-${nanoid(8).toUpperCase()}`;

  try {
    const result = await withTransaction(async (client) => {
      const actaIns = await client.query(
        `INSERT INTO actas
           (codigo, colaborador_nombre, colaborador_cc, colaborador_email,
            cargo, area, ciudad, tipo_retiro, fecha_retiro, estado, creada_por)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'en_proceso', $10)
         RETURNING *`,
        [codigo, datos.colaborador_nombre, datos.colaborador_cc, datos.colaborador_email || null,
         datos.cargo, datos.area, datos.ciudad, datos.tipo_retiro, datos.fecha_retiro, req.user.id]
      );
      const acta = actaIns.rows[0];
      const hash = calcularHashActa(acta);
      await client.query(`UPDATE actas SET hash_contenido = $1 WHERE id = $2`, [hash, acta.id]);
      const firmantes = await client.query(
        `SELECT id, area FROM usuarios WHERE rol = 'firmante' AND activo = TRUE ORDER BY area, nombre`
      );
      let orden = 0;
      for (const f of firmantes.rows) {
        await client.query(
          `INSERT INTO acta_responsables (acta_id, usuario_id, area, orden) VALUES ($1, $2, $3, $4)`,
          [acta.id, f.id, f.area, orden++]
        );
      }
      acta.hash_contenido = hash;
      return acta;
    });
    await registrarAuditoria({
      usuarioId: req.user.id, accion: 'acta_creada', entidad: 'acta', entidadId: result.id,
      detalle: { codigo: result.codigo, colaborador: result.colaborador_nombre }, ipOrigen: req.ip,
    });

    // Notificar de inmediato a todos los responsables (best-effort, no bloquea la respuesta)
    setImmediate(async () => {
      try {
        const responsablesRes = await query(
          `SELECT u.id, u.email, u.nombre
           FROM acta_responsables ar
           INNER JOIN usuarios u ON u.id = ar.usuario_id
           WHERE ar.acta_id = $1 AND u.activo = TRUE`,
          [result.id]
        );
        for (const resp of responsablesRes.rows) {
          const { html, text } = plantillaNuevaActa({
            nombreResponsable: resp.nombre,
            acta: result,
          });
          const r = await enviarCorreo({
            to: resp.email,
            subject: `Nueva acta de Paz y Salvo por firmar · ${result.codigo}`,
            html, text,
          });
          if (r.ok) {
            await registrarAuditoria({
              usuarioId: resp.id,
              accion: 'notificacion_nueva_acta_enviada',
              entidad: 'acta',
              entidadId: result.id,
              detalle: { codigo: result.codigo },
            });
          } else {
            console.error(`[email] fallo notificando a ${resp.email}:`, r.error);
          }
        }
        console.log(`[email] notificaciones de nueva acta enviadas: ${responsablesRes.rows.length}`);
      } catch (err) {
        console.error('[email] error notificando nueva acta:', err.message);
      }
    });

    res.status(201).json({ acta: result });
  } catch (err) {
    console.error('[actas] error creando:', err);
    res.status(500).json({ error: 'error creando acta' });
  }
});

router.post('/:id/anular', autenticar, requiereRol('admin'), async (req, res) => {
  const actaId = parseInt(req.params.id, 10);
  const { motivo } = req.body;
  const result = await query(
    `UPDATE actas SET estado = 'anulada' WHERE id = $1 AND estado != 'finalizada' RETURNING *`,
    [actaId]
  );
  if (result.rows.length === 0) return res.status(400).json({ error: 'acta no encontrada o ya finalizada' });
  await registrarAuditoria({
    usuarioId: req.user.id, accion: 'acta_anulada', entidad: 'acta', entidadId: actaId,
    detalle: { motivo }, ipOrigen: req.ip,
  });
  res.json({ acta: result.rows[0] });
});

export default router;
