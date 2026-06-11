import { Router } from 'express';
import { z } from 'zod';
import { query, withTransaction } from '../db/index.js';
import { autenticar } from '../middleware/auth.js';
import { generarHashFirma, verificarCadenaFirmas } from '../services/firma.js';
import { registrarAuditoria } from '../services/auditoria.js';
import { generarPdfActa } from '../services/pdf.js';

const router = Router();

const firmarSchema = z.object({
  actaId: z.number().int().positive(),
  observaciones: z.string().max(500).optional(),
  confirmacion: z.boolean().refine(v => v === true, 'debes confirmar la firma'),
});

async function firmarActa(client, { actaId, usuario, observaciones, ipOrigen, userAgent }) {
  const actaRes = await client.query(`SELECT * FROM actas WHERE id = $1 FOR UPDATE`, [actaId]);
  if (actaRes.rows.length === 0) throw new Error('acta no encontrada');
  const acta = actaRes.rows[0];
  if (acta.estado !== 'en_proceso') throw new Error(`estado ${acta.estado}`);

  if (usuario.rol !== 'admin') {
    const respRes = await client.query(
      `SELECT 1 FROM acta_responsables WHERE acta_id = $1 AND usuario_id = $2`,
      [actaId, usuario.id]
    );
    if (respRes.rows.length === 0) throw new Error('no eres responsable de esta acta');
  }

  const yaFirmoRes = await client.query(
    `SELECT 1 FROM firmas WHERE acta_id = $1 AND usuario_id = $2`,
    [actaId, usuario.id]
  );
  if (yaFirmoRes.rows.length > 0) throw new Error('ya firmaste esta acta');

  const prevRes = await client.query(
    `SELECT hash_firma FROM firmas WHERE acta_id = $1 ORDER BY firmado_at DESC LIMIT 1`,
    [actaId]
  );
  const hashPrev = prevRes.rows[0]?.hash_firma || null;
  const firmadoAt = new Date().toISOString();
  const hashFirma = generarHashFirma({
    hashActa: acta.hash_contenido,
    usuarioEmail: usuario.email,
    area: usuario.area,
    firmadoAt, hashPrev,
  });

  const ins = await client.query(
    `INSERT INTO firmas
       (acta_id, usuario_id, usuario_email, usuario_nombre, area,
        hash_acta, hash_firma, hash_prev, ip_origen, user_agent, observaciones, firmado_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING *`,
    [actaId, usuario.id, usuario.email, usuario.nombre, usuario.area,
     acta.hash_contenido, hashFirma, hashPrev, ipOrigen, userAgent || null,
     observaciones || null, firmadoAt]
  );

  const conteoRes = await client.query(
    `SELECT
      (SELECT COUNT(*) FROM acta_responsables WHERE acta_id = $1) AS requeridas,
      (SELECT COUNT(*) FROM firmas WHERE acta_id = $1) AS firmadas`,
    [actaId]
  );
  const { requeridas, firmadas } = conteoRes.rows[0];
  let acta_final = acta;
  if (parseInt(firmadas, 10) >= parseInt(requeridas, 10)) {
    const upd = await client.query(
      `UPDATE actas SET estado = 'finalizada', finalizada_at = NOW() WHERE id = $1 RETURNING *`,
      [actaId]
    );
    acta_final = upd.rows[0];

    // Generar PDF y guardarlo en la BD (fuera de la transacción, best-effort)
    const todasFirmas = await client.query(
      `SELECT usuario_email, usuario_nombre, area, hash_acta, hash_firma, hash_prev, observaciones, firmado_at
       FROM firmas WHERE acta_id = $1 ORDER BY firmado_at ASC`, [actaId]
    );
    const actaSnapshot = { ...acta_final };
    const firmasSnapshot = todasFirmas.rows;
    setImmediate(async () => {
      try {
        const pdfBuffer = await generarPdfActa(actaSnapshot, firmasSnapshot);
        await query(
          `UPDATE actas SET pdf_documento = $1, pdf_generado_at = NOW() WHERE id = $2`,
          [pdfBuffer, actaSnapshot.id]
        );
        console.log(`[pdf] guardado en BD: ${actaSnapshot.codigo} (${Math.round(pdfBuffer.length / 1024)} KB)`);
      } catch (err) {
        console.error('[pdf] error generando/guardando:', err.message);
      }
    });
  }
  return { firma: ins.rows[0], acta: acta_final };
}

// Firma individual
router.post('/', autenticar, async (req, res) => {
  const parsed = firmarSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'datos inválidos', detalles: parsed.error.issues });
  const { actaId, observaciones } = parsed.data;
  try {
    const resultado = await withTransaction(async (client) =>
      firmarActa(client, {
        actaId, usuario: req.user, observaciones,
        ipOrigen: req.ip, userAgent: req.get('user-agent'),
      })
    );
    await registrarAuditoria({
      usuarioId: req.user.id, accion: 'firma_registrada', entidad: 'acta',
      entidadId: actaId, detalle: { hash_firma: resultado.firma.hash_firma }, ipOrigen: req.ip,
    });
    res.status(201).json(resultado);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Firma masiva
const firmarMasivoSchema = z.object({
  actaIds: z.array(z.number().int().positive()).min(1).max(50),
  observaciones: z.string().max(500).optional(),
  confirmacion: z.boolean().refine(v => v === true, 'debes confirmar la firma'),
});

router.post('/masivo', autenticar, async (req, res) => {
  const parsed = firmarMasivoSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'datos inválidos', detalles: parsed.error.issues });
  const { actaIds, observaciones } = parsed.data;
  const resultados = { exitosas: [], fallidas: [] };

  for (const actaId of actaIds) {
    try {
      const r = await withTransaction(async (client) =>
        firmarActa(client, {
          actaId, usuario: req.user, observaciones,
          ipOrigen: req.ip, userAgent: req.get('user-agent'),
        })
      );
      resultados.exitosas.push({
        actaId, codigo: r.acta.codigo, colaborador: r.acta.colaborador_nombre, hashFirma: r.firma.hash_firma,
      });
      await registrarAuditoria({
        usuarioId: req.user.id, accion: 'firma_masiva_registrada', entidad: 'acta',
        entidadId: actaId, detalle: { hash_firma: r.firma.hash_firma, lote: actaIds.length }, ipOrigen: req.ip,
      });
    } catch (err) {
      resultados.fallidas.push({ actaId, error: err.message });
    }
  }
  res.status(207).json({
    total: actaIds.length,
    exitosas: resultados.exitosas.length,
    fallidas: resultados.fallidas.length,
    resultados,
  });
});

router.get('/pendientes', autenticar, async (req, res) => {
  const usuario = req.user;
  let result;
  if (usuario.rol === 'admin') {
    result = await query(
      `SELECT a.id, a.codigo, a.colaborador_nombre, a.colaborador_cc,
              a.cargo, a.area, a.fecha_retiro, a.tipo_retiro, a.created_at,
              (SELECT COUNT(*) FROM acta_responsables ar WHERE ar.acta_id = a.id) AS total_responsables,
              (SELECT COUNT(*) FROM firmas f WHERE f.acta_id = a.id) AS total_firmadas
       FROM actas a WHERE a.estado = 'en_proceso' ORDER BY a.created_at ASC`
    );
  } else {
    result = await query(
      `SELECT a.id, a.codigo, a.colaborador_nombre, a.colaborador_cc,
              a.cargo, a.area, a.fecha_retiro, a.tipo_retiro, a.created_at,
              (SELECT COUNT(*) FROM acta_responsables ar WHERE ar.acta_id = a.id) AS total_responsables,
              (SELECT COUNT(*) FROM firmas f WHERE f.acta_id = a.id) AS total_firmadas
       FROM actas a
       INNER JOIN acta_responsables ar ON ar.acta_id = a.id
       LEFT JOIN firmas f ON f.acta_id = a.id AND f.usuario_id = $1
       WHERE a.estado = 'en_proceso' AND ar.usuario_id = $1 AND f.id IS NULL
       ORDER BY a.created_at ASC`, [usuario.id]
    );
  }
  res.json({ actas: result.rows });
});

router.get('/verificar/:actaId', autenticar, async (req, res) => {
  const actaId = parseInt(req.params.actaId, 10);
  const result = await query(
    `SELECT * FROM firmas WHERE acta_id = $1 ORDER BY firmado_at ASC`, [actaId]
  );
  const verificacion = verificarCadenaFirmas(result.rows);
  res.json({ ...verificacion, totalFirmas: result.rows.length });
});

export default router;
