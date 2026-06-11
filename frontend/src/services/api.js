const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

class APIError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = localStorage.getItem('token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_URL}${path}`, {
    method, headers, body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new APIError(data.error || `Error ${res.status}`, res.status, data);
  return data;
}

export const api = {
  // auth
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password }, auth: false }),
  changePassword: (newPassword) => request('/auth/change-password', { method: 'POST', body: { newPassword } }),
  me: () => request('/auth/me'),

  // actas
  listarActas: () => request('/actas'),
  detalleActa: (id) => request(`/actas/${id}`),
  crearActa: (datos) => request('/actas', { method: 'POST', body: datos }),
  anularActa: (id, motivo) => request(`/actas/${id}/anular`, { method: 'POST', body: { motivo } }),

  // firmas
  firmar: (actaId, observaciones) => request('/firmas', {
    method: 'POST', body: { actaId, observaciones, confirmacion: true },
  }),
  firmarMasivo: (actaIds, observaciones) => request('/firmas/masivo', {
    method: 'POST', body: { actaIds, observaciones, confirmacion: true },
  }),
  actasPendientes: () => request('/firmas/pendientes'),
  verificarFirmas: (actaId) => request(`/firmas/verificar/${actaId}`),

  // usuarios
  listarUsuarios: () => request('/usuarios'),
  crearUsuario: (datos) => request('/usuarios', { method: 'POST', body: datos }),
  resetPassword: (id) => request(`/usuarios/${id}/reset-password`, { method: 'POST' }),
  toggleActivo: (id, activo) => request(`/usuarios/${id}/activo`, { method: 'PATCH', body: { activo } }),

  // recordatorios
  previewRecordatorios: (ignorarUmbral = false) =>
    request(`/recordatorios/preview?ignorarUmbral=${ignorarUmbral}`),
  enviarRecordatorios: (ignorarUmbral = false) =>
    request('/recordatorios/enviar', { method: 'POST', body: { ignorarUmbral } }),
  recordarAUsuario: (usuarioId) =>
    request(`/recordatorios/enviar/${usuarioId}`, { method: 'POST' }),

  // documentos (PDFs)
  listarDocumentos: () => request('/documentos'),
  regenerarPdf: (actaId) => request(`/documentos/${actaId}/regenerar`, { method: 'POST' }),
};

// Descarga del PDF desde la BD
export async function descargarPdf(actaId, codigo) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/documentos/${actaId}/pdf`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Error ${res.status}`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${codigo}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

// Abre el PDF inline en una pestaña nueva
export async function verPdf(actaId) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/documentos/${actaId}/ver`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Error ${res.status}`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

export { APIError };
