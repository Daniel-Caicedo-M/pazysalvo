import { query } from '../db/index.js';

export async function registrarAuditoria({ usuarioId, accion, entidad, entidadId, detalle, ipOrigen }) {
  try {
    await query(
      `INSERT INTO auditoria (usuario_id, accion, entidad, entidad_id, detalle, ip_origen)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [usuarioId || null, accion, entidad || null, entidadId || null, detalle || null, ipOrigen || null]
    );
  } catch (err) {
    console.error('[auditoria] error registrando:', err.message);
  }
}
