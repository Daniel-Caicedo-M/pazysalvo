import { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import Layout from '../components/Layout.jsx';

export default function Recordatorios() {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [ignorarUmbral, setIgnorarUmbral] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [toast, setToast] = useState(null);

  function cargar() {
    setLoading(true);
    api.previewRecordatorios(ignorarUmbral)
      .then(setPreview)
      .catch(err => setToast({ type: 'error', msg: err.message }))
      .finally(() => setLoading(false));
  }

  useEffect(() => { cargar(); }, [ignorarUmbral]);

  async function enviarTodos() {
    if (!confirm(`¿Enviar ${preview.totalResponsables} recordatorios por correo?`)) return;
    setEnviando(true); setResultado(null);
    try {
      const r = await api.enviarRecordatorios(ignorarUmbral);
      setResultado(r);
      setToast({ type: 'success', msg: `${r.enviados} recordatorios enviados` });
      cargar();
    } catch (err) {
      setToast({ type: 'error', msg: err.message });
    } finally {
      setEnviando(false);
    }
  }

  async function enviarA(usuarioId, nombre) {
    if (!confirm(`¿Enviar recordatorio a ${nombre}?`)) return;
    try {
      const r = await api.recordarAUsuario(usuarioId);
      if (r.ok) setToast({ type: 'success', msg: `Recordatorio enviado a ${nombre}` });
      else setToast({ type: 'error', msg: r.error || 'no se pudo enviar' });
    } catch (err) {
      setToast({ type: 'error', msg: err.message });
    }
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-6 py-10">
        <p className="text-brand font-mono text-xs uppercase tracking-wider mb-2">Comunicaciones</p>
        <h1 className="font-serif text-5xl mb-2">Recordatorios <em className="text-brand italic">por correo</em></h1>
        <p className="text-muted mb-8">Notifica a los responsables que tienen actas pendientes de firma.</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <p className="text-xs uppercase tracking-wider text-muted font-medium">Responsables con pendientes</p>
            <p className="font-serif text-4xl mt-1">{preview?.totalResponsables ?? '—'}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <p className="text-xs uppercase tracking-wider text-muted font-medium">Total actas pendientes</p>
            <p className="font-serif text-4xl mt-1">
              {preview?.pendientes.reduce((s, p) => s + p.actasPendientes, 0) ?? '—'}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <p className="text-xs uppercase tracking-wider text-muted font-medium">Umbral de envío</p>
            <p className="font-serif text-4xl mt-1">{preview?.umbralDias ?? '—'} <span className="text-lg text-muted">días</span></p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl mb-6 p-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={ignorarUmbral} onChange={e => setIgnorarUmbral(e.target.checked)}
                className="w-4 h-4 accent-brand cursor-pointer" />
              <span className="text-sm">Ignorar umbral de días (enviar a TODOS los pendientes)</span>
            </label>
            <button onClick={enviarTodos} disabled={enviando || !preview || preview.totalResponsables === 0}
              className="bg-ink text-white font-medium px-5 py-2.5 rounded-xl hover:bg-brand hover:shadow-brand transition disabled:opacity-40 inline-flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              {enviando ? 'Enviando…' : `Enviar a ${preview?.totalResponsables ?? 0} responsables`}
            </button>
          </div>
        </div>

        {resultado && (
          <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-5 mb-6">
            <p className="font-medium text-emerald-800 mb-2">Resultado del envío</p>
            <p className="text-sm text-emerald-900">
              {resultado.enviados} enviados · {resultado.fallidos} fallidos · {resultado.total} total
            </p>
          </div>
        )}

        {loading ? (
          <div className="p-12 text-center text-muted">Cargando…</div>
        ) : preview?.totalResponsables === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h2 className="font-serif text-3xl mb-2">Nada pendiente</h2>
            <p className="text-muted">
              {ignorarUmbral ? 'No hay actas pendientes de firma en este momento.'
                : `No hay actas con más de ${preview?.umbralDias} días sin firmar.`}
            </p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="px-6 py-3 border-b border-gray-100 bg-gray-50">
              <h2 className="font-medium text-sm">Responsables que recibirán recordatorio</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {preview?.pendientes.map(p => (
                <div key={p.usuario_id} className="p-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <p className="font-medium">{p.nombre}</p>
                      <p className="text-xs text-muted font-mono">{p.email}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 bg-brand-soft text-brand text-xs font-medium rounded-full">
                        {p.actasPendientes}
                      </span>
                      <button onClick={() => enviarA(p.usuario_id, p.nombre)}
                        className="text-xs text-brand font-medium hover:underline">
                        Enviar solo a este →
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {p.actas.map(a => (
                      <div key={a.id} className="text-xs flex items-center gap-2 text-muted">
                        <span className="font-mono">{a.codigo}</span>
                        <span>·</span>
                        <span>{a.colaborador_nombre}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {toast && <Toast type={toast.type} msg={toast.msg} onClose={() => setToast(null)} />}
      </div>
    </Layout>
  );
}

function Toast({ type, msg, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, []);
  const bg = type === 'error' ? 'bg-red-600' : type === 'success' ? 'bg-emerald-600' : 'bg-ink';
  return <div className={`fixed bottom-6 right-6 ${bg} text-white px-4 py-3 rounded-xl shadow-lg text-sm`}>{msg}</div>;
}
