import { Router } from 'express';
import { query } from '../db/index.js';
import { autenticar, requiereRol } from '../middleware/auth.js';
import { generarPdfActa } from '../services/pdf.js';
import { registrarAuditoria } from '../services/auditoria.js';

const router = Router();

// ===========================================================
// Listar PDFs de actas finalizadas (admin)
// ===========================================================
router.get('/', autenticar, requiereRol('admin'), async (req, res) => {
  const actasRes = await query(
    `SELECT id, codigo, colaborador_nombre, colaborador_cc, cargo, area,
            finalizada_at, pdf_generado_at,
            CASE WHEN pdf_documento IS NOT NULL THEN octet_length(pdf_documento) ELSE NULL END AS pdf_size
     FROM actas WHERE estado = 'finalizada'
     ORDER BY finalizada_at DESC`
  );

  res.json({
    documentos: actasRes.rows.map(a => ({
      actaId: a.id,
      codigo: a.codigo,
      colaborador: a.colaborador_nombre,
      cc: a.colaborador_cc,
      cargo: a.cargo,
      area: a.area,
      finalizada_at: a.finalizada_at,
      pdfDisponible: a.pdf_size !== null,
      pdfGeneradoAt: a.pdf_generado_at,
      pdfSize: a.pdf_size,
    })),
  });
});

// Helper: obtiene (o genera y guarda) el PDF de un acta finalizada
async function obtenerPdf(actaId) {
  const actaRes = await query(`SELECT * FROM actas WHERE id = $1`, [actaId]);
  if (actaRes.rows.length === 0) return { error: 'acta no encontrada', status: 404 };
  const acta = actaRes.rows[0];
  if (acta.estado !== 'finalizada') return { error: 'el acta no está finalizada', status: 400 };

  let pdfBuffer = acta.pdf_documento;
  if (!pdfBuffer) {
    const firmasRes = await query(
      `SELECT usuario_email, usuario_nombre, area, hash_acta, hash_firma, hash_prev, observaciones, firmado_at
       FROM firmas WHERE acta_id = $1 ORDER BY firmado_at ASC`, [actaId]
    );
    pdfBuffer = await generarPdfActa(acta, firmasRes.rows);
    query(
      `UPDATE actas SET pdf_documento = $1, pdf_generado_at = NOW() WHERE id = $2`,
      [pdfBuffer, actaId]
    ).catch(err => console.error('[documentos] error guardando pdf:', err.message));
  }
  return { acta, pdfBuffer };
}

// ===========================================================
// Descargar PDF (admin)
// ===========================================================
router.get('/:actaId/pdf', autenticar, requiereRol('admin'), async (req, res) => {
  const actaId = parseInt(req.params.actaId, 10);
  if (isNaN(actaId)) return res.status(400).json({ error: 'id inválido' });

  const r = await obtenerPdf(actaId);
  if (r.error) return res.status(r.status).json({ error: r.error });

  await registrarAuditoria({
    usuarioId: req.user.id,
    accion: 'pdf_descargado',
    entidad: 'acta',
    entidadId: actaId,
    detalle: { codigo: r.acta.codigo },
    ipOrigen: req.ip,
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${r.acta.codigo}.pdf"`);
  res.send(r.pdfBuffer);
});

// ===========================================================
// Ver PDF inline en el navegador (admin)
// ===========================================================
router.get('/:actaId/ver', autenticar, requiereRol('admin'), async (req, res) => {
  const actaId = parseInt(req.params.actaId, 10);
  if (isNaN(actaId)) return res.status(400).json({ error: 'id inválido' });

  const r = await obtenerPdf(actaId);
  if (r.error) return res.status(r.status).json({ error: r.error });

  await registrarAuditoria({
    usuarioId: req.user.id,
    accion: 'pdf_visualizado',
    entidad: 'acta',
    entidadId: actaId,
    detalle: { codigo: r.acta.codigo },
    ipOrigen: req.ip,
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${r.acta.codigo}.pdf"`);
  res.send(r.pdfBuffer);
});

// ===========================================================
// Regenerar PDF (admin) — útil si cambió la plantilla
// ===========================================================
router.post('/:actaId/regenerar', autenticar, requiereRol('admin'), async (req, res) => {
  const actaId = parseInt(req.params.actaId, 10);
  const actaRes = await query(`SELECT * FROM actas WHERE id = $1 AND estado = 'finalizada'`, [actaId]);
  if (actaRes.rows.length === 0) return res.status(404).json({ error: 'acta finalizada no encontrada' });
  const acta = actaRes.rows[0];

  const firmasRes = await query(
    `SELECT usuario_email, usuario_nombre, area, hash_acta, hash_firma, hash_prev, observaciones, firmado_at
     FROM firmas WHERE acta_id = $1 ORDER BY firmado_at ASC`, [actaId]
  );

  try {
    const pdfBuffer = await generarPdfActa(acta, firmasRes.rows);
    await query(
      `UPDATE actas SET pdf_documento = $1, pdf_generado_at = NOW() WHERE id = $2`,
      [pdfBuffer, actaId]
    );
    await registrarAuditoria({
      usuarioId: req.user.id,
      accion: 'pdf_regenerado',
      entidad: 'acta',
      entidadId: actaId,
      detalle: { codigo: acta.codigo },
      ipOrigen: req.ip,
    });
    res.json({ ok: true, size: pdfBuffer.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
