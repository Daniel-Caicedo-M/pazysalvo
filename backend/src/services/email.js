import 'dotenv/config';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'onboarding@resend.dev';
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'Paz y Salvo SIESA';
const APP_URL = process.env.APP_URL || 'http://localhost:5173';

export async function enviarCorreo({ to, subject, html, text }) {
  if (!RESEND_API_KEY) {
    console.log('[email] modo dev (sin RESEND_API_KEY)');
    console.log('  →', { to, subject });
    return { ok: true, dev: true };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${EMAIL_FROM_NAME} <${EMAIL_FROM}>`,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error('[email] resend error:', data);
      return { ok: false, error: data.message };
    }
    return { ok: true, id: data.id };
  } catch (err) {
    console.error('[email] error de red:', err.message);
    return { ok: false, error: err.message };
  }
}

export function plantillaRecordatorio({ nombreResponsable, actasPendientes }) {
  const linkApp = `${APP_URL}/pendientes`;
  const filas = actasPendientes.map(a => `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid #E5E7EB;">
        <div style="font-family:'Courier New',monospace;font-size:11px;color:#6B7280;">${escapeHtml(a.codigo)}</div>
        <div style="font-weight:600;color:#0A0A1A;margin-top:2px;">${escapeHtml(a.colaborador_nombre)}</div>
        <div style="font-size:12px;color:#6B7280;">CC ${escapeHtml(a.colaborador_cc)} · ${escapeHtml(a.cargo || '')}</div>
      </td>
      <td style="padding:12px 16px;border-bottom:1px solid #E5E7EB;text-align:right;font-size:12px;color:#6B7280;">
        ${escapeHtml(diasDesde(a.created_at))} en espera
      </td>
    </tr>`).join('');

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#FAFBFC;font-family:-apple-system,system-ui,sans-serif;color:#0A0A1A;">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
    <div style="background:white;border:1px solid #E5E7EB;border-radius:18px;padding:32px;">
      <div style="font-size:18px;font-weight:700;color:#0E79FD;margin-bottom:24px;">Siesa</div>
      <p style="font-family:Georgia,serif;font-size:30px;line-height:1.15;margin:0 0 8px;color:#0A0A1A;">Tienes firmas pendientes</p>
      <p style="color:#6B7280;font-size:15px;margin:0 0 24px;">
        Hola ${escapeHtml(nombreResponsable)}, este es un recordatorio de las actas de Paz y Salvo que aún requieren tu firma.
      </p>
      <table style="width:100%;border-collapse:collapse;margin:0 0 24px;border:1px solid #E5E7EB;border-radius:12px;overflow:hidden;">${filas}</table>
      <div style="text-align:center;margin:24px 0 8px;">
        <a href="${linkApp}" style="display:inline-block;background:#0A0A1A;color:white;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:500;font-size:14px;">Firmar ahora →</a>
      </div>
      <p style="font-size:12px;color:#9CA3AF;text-align:center;margin:24px 0 0;">Puedes firmar varias actas a la vez desde la bandeja de pendientes.</p>
      <hr style="border:none;border-top:1px solid #E5E7EB;margin:24px 0;">
      <p style="font-size:11px;color:#9CA3AF;text-align:center;margin:0;">Este es un recordatorio automático del sistema Paz y Salvo de Siesa.</p>
    </div>
  </div>
</body></html>`;

  const text = `Tienes firmas pendientes\n\n` +
    `Hola ${nombreResponsable}, este es un recordatorio de actas de Paz y Salvo que aún requieren tu firma:\n\n` +
    actasPendientes.map(a => `- ${a.codigo} · ${a.colaborador_nombre} (${diasDesde(a.created_at)} en espera)`).join('\n') +
    `\n\nFirma ahora: ${linkApp}`;

  return { html, text };
}

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function diasDesde(fecha) {
  const ms = Date.now() - new Date(fecha).getTime();
  const dias = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (dias === 0) return 'hoy';
  if (dias === 1) return '1 día';
  return `${dias} días`;
}
