import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../services/auth.jsx';
import { api } from '../services/api.js';
import Layout from '../components/Layout.jsx';

export default function ActaDetalle() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(null);
  const [observaciones, setObservaciones] = useState('');
  const [confirmado, setConfirmado] = useState(false);
  const [toast, setToast] = useState(null);

  function cargar() {
    setLoading(true);
    api.detalleActa(id)
      .then(setData)
      .catch(err => setToast({ type: 'error', msg: err.message }))
      .finally(() => setLoading(false));
  }

  useEffect(() => { cargar(); }, [id]);

  async function handleFirmar() {
    try {
      await api.firmar(parseInt(id, 10), observaciones);
      setToast({ type: 'success', msg: 'Firma registrada' });
      setSigning(null); setObservaciones(''); setConfirmado(false);
      cargar();
    } catch (err) {
      setToast({ type: 'error', msg: err.message });
    }
  }

  if (loading) return <Layout><div className="p-12 text-center text-muted">Cargando…</div></Layout>;
  if (!data) return <Layout><div className="p-12 text-center text-muted">No encontrada</div></Layout>;

  const { acta, responsables, firmas } = data;
  const firmasPorUsuario = Object.fromEntries(firmas.map(f => [f.usuario_id, f]));
  const yaFirme = !!firmasPorUsuario[usuario.id];
  const soyResponsable = responsables.some(r => r.usuario_id === usuario.id);
  const puedeFirmar = (soyResponsable && !yaFirme && acta.estado === 'en_proceso') ||
                      (usuario.rol === 'admin' && acta.estado === 'en_proceso');
  const progreso = Math.round((firmas.length / responsables.length) * 100);

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-baseline justify-between mb-2">
          <p className="text-brand font-mono text-xs uppercase tracking-wider">{acta.codigo}</p>
          <EstadoBadge estado={acta.estado} />
        </div>
        <h1 className="font-serif text-5xl mb-2">{acta.colaborador_nombre}</h1>
        <p className="text-muted mb-8">{acta.cargo} · {acta.area}</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-white border border-gray-200 rounded-2xl p-6">
              <h2 className="font-medium mb-4">Datos del colaborador</h2>
              <dl className="grid grid-cols-2 gap-y-3 text-sm">
                <Row k="Tipo de retiro" v={acta.tipo_retiro} />
                <Row k="Fecha de retiro" v={acta.fecha_retiro} />
                <Row k="C.C." v={acta.colaborador_cc} />
                <Row k="Ciudad" v={acta.ciudad} />
                <Row k="Cargo" v={acta.cargo} />
                <Row k="Área" v={acta.area} />
                {acta.colaborador_email && <Row k="Correo" v={acta.colaborador_email} />}
              </dl>
            </section>

            <section className="bg-white border border-gray-200 rounded-2xl p-6">
              <h2 className="font-medium mb-4">Responsables y firmas</h2>
              <div className="space-y-2">
                {responsables.map(r => {
                  const firma = firmasPorUsuario[r.usuario_id];
                  const isCurrent = r.usuario_id === usuario.id;
                  return (
                    <div key={r.usuario_id}
                      className={`flex items-center justify-between p-4 rounded-xl border-2 ${firma ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-200'}`}>
                      <div className="min-w-0">
                        <p className="text-xs font-mono uppercase tracking-wider text-brand">{r.area}</p>
                        <p className="font-medium">{r.nombre}</p>
                        <p className="text-xs text-muted">
                          {firma ? `Firmado · ${new Date(firma.firmado_at).toLocaleString('es-CO')}` : 'Pendiente'}
                        </p>
                      </div>
                      {firma ? (
                        <span className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-medium rounded-lg">✓ Firmado</span>
                      ) : isCurrent && puedeFirmar ? (
                        <button onClick={() => setSigning(r.usuario_id)}
                          className="px-4 py-2 bg-ink text-white text-sm font-medium rounded-lg hover:bg-brand transition">
                          Firmar
                        </button>
                      ) : usuario.rol === 'admin' && !firma && acta.estado === 'en_proceso' ? (
                        <button onClick={() => setSigning(r.usuario_id)}
                          className="px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-lg" title="Firmar como admin">
                          Firmar admin
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </section>

            {acta.estado === 'finalizada' && (
              <section className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-6">
                <h2 className="font-medium text-emerald-800 mb-2">Declaración de Paz y Salvo</h2>
                <p className="text-sm text-emerald-900">
                  Se declara a <strong>{acta.colaborador_nombre}</strong> C.C. <strong>{acta.colaborador_cc}</strong> a <strong>PAZ Y SALVO</strong> con Sistemas de Información Empresarial – SIESA, el día {new Date(acta.finalizada_at).toLocaleDateString('es-CO')}.
                </p>
              </section>
            )}
          </div>

          <aside className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <p className="text-xs uppercase tracking-wider text-muted font-medium mb-2">Progreso</p>
              <p className="font-serif text-3xl mb-2">{firmas.length} <span className="text-muted text-lg">/ {responsables.length}</span></p>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-1">
                <div className="h-full bg-gradient-to-r from-brand to-sky-400 rounded-full transition-all duration-500" style={{ width: `${progreso}%` }} />
              </div>
              <p className="text-xs text-muted font-mono">{progreso}% completado</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <p className="text-xs uppercase tracking-wider text-muted font-medium mb-3">Hash del acta</p>
              <code className="text-xs font-mono break-all text-ink-soft">{acta.hash_contenido}</code>
            </div>
          </aside>
        </div>
      </div>

      {signing !== null && (
        <SignModal
          responsable={responsables.find(r => r.usuario_id === signing)}
          observaciones={observaciones} setObservaciones={setObservaciones}
          confirmado={confirmado} setConfirmado={setConfirmado}
          onCancel={() => { setSigning(null); setObservaciones(''); setConfirmado(false); }}
          onConfirm={handleFirmar}
        />
      )}
      {toast && <Toast type={toast.type} msg={toast.msg} onClose={() => setToast(null)} />}
    </Layout>
  );
}

function Row({ k, v }) {
  return (
    <>
      <dt className="text-muted text-xs uppercase tracking-wider">{k}</dt>
      <dd className="font-medium">{v || '—'}</dd>
    </>
  );
}

function EstadoBadge({ estado }) {
  const styles = {
    borrador: 'bg-gray-100 text-gray-700',
    en_proceso: 'bg-amber-50 text-amber-700',
    finalizada: 'bg-emerald-50 text-emerald-700',
    anulada: 'bg-red-50 text-red-700',
  };
  const labels = { borrador: 'Borrador', en_proceso: 'En proceso', finalizada: 'Finalizada', anulada: 'Anulada' };
  return <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${styles[estado]}`}>{labels[estado]}</span>;
}

function SignModal({ responsable, observaciones, setObservaciones, confirmado, setConfirmado, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <h2 className="font-serif text-3xl mb-2">Confirmar firma</h2>
        <p className="text-muted text-sm mb-5">Al confirmar, dejas registro de tu firma electrónica con la fecha y hora actual.</p>
        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <p className="text-xs uppercase tracking-wider text-muted">Firmando como</p>
          <p className="font-serif text-2xl">{responsable?.nombre}</p>
          <p className="text-xs text-muted font-mono">{responsable?.area}</p>
        </div>
        <textarea value={observaciones} onChange={e => setObservaciones(e.target.value)}
          placeholder="Observaciones (opcional)" rows={2}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand-glow" />
        <label className="flex gap-3 items-start p-4 border border-gray-200 rounded-xl mt-4 cursor-pointer">
          <input type="checkbox" checked={confirmado} onChange={e => setConfirmado(e.target.checked)} className="mt-1 accent-brand" />
          <span className="text-xs text-ink-soft">
            Confirmo que he revisado la entrega del colaborador y declaro que cumple con los requisitos de mi área. Acepto que mi firma electrónica tiene plena validez.
          </span>
        </label>
        <div className="flex gap-3 mt-5 justify-end">
          <button onClick={onCancel} className="px-5 py-2.5 border border-gray-200 rounded-xl hover:border-ink text-sm">Cancelar</button>
          <button onClick={onConfirm} disabled={!confirmado}
            className="px-5 py-2.5 bg-ink text-white rounded-xl hover:bg-brand disabled:opacity-40 disabled:pointer-events-none text-sm font-medium">
            Firmar ahora
          </button>
        </div>
      </div>
    </div>
  );
}

function Toast({ type, msg, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, []);
  const bg = type === 'error' ? 'bg-red-600' : type === 'success' ? 'bg-emerald-600' : 'bg-ink';
  return <div className={`fixed bottom-6 right-6 ${bg} text-white px-4 py-3 rounded-xl shadow-lg text-sm`}>{msg}</div>;
}
