import crypto from 'crypto';
import 'dotenv/config';

const SIGNATURE_SECRET = process.env.SIGNATURE_SECRET || 'change-me-in-production';

export function calcularHashActa(acta) {
  const payload = JSON.stringify({
    codigo: acta.codigo,
    colaborador_nombre: acta.colaborador_nombre,
    colaborador_cc: acta.colaborador_cc,
    cargo: acta.cargo,
    area: acta.area,
    ciudad: acta.ciudad,
    tipo_retiro: acta.tipo_retiro,
    fecha_retiro: acta.fecha_retiro,
  });
  return crypto.createHash('sha256').update(payload).digest('hex');
}

export function generarHashFirma({ hashActa, usuarioEmail, area, firmadoAt, hashPrev }) {
  const payload = [hashActa, usuarioEmail, area, firmadoAt, hashPrev || ''].join('|');
  return crypto.createHmac('sha256', SIGNATURE_SECRET).update(payload).digest('hex');
}

export function verificarFirma(firma) {
  const recalculado = generarHashFirma({
    hashActa: firma.hash_acta,
    usuarioEmail: firma.usuario_email,
    area: firma.area,
    firmadoAt: firma.firmado_at instanceof Date ? firma.firmado_at.toISOString() : firma.firmado_at,
    hashPrev: firma.hash_prev,
  });
  return recalculado === firma.hash_firma;
}

export function verificarCadenaFirmas(firmas) {
  const ordenadas = [...firmas].sort((a, b) => new Date(a.firmado_at) - new Date(b.firmado_at));
  let prev = null;
  for (const f of ordenadas) {
    if (f.hash_prev !== prev) return { valido: false, razon: 'eslabón roto', firma_id: f.id };
    if (!verificarFirma(f)) return { valido: false, razon: 'hash de firma alterado', firma_id: f.id };
    prev = f.hash_firma;
  }
  return { valido: true };
}
