import { useEffect, useState } from 'react';
import { api, descargarPdf, verPdf } from '../services/api.js';
import Layout from '../components/Layout.jsx';

export default function Documentos() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accion, setAccion] = useState(null); // { actaId, tipo }
  const [toast, setToast] = useState(null);

  function cargar() {
    setLoading(true);
    api.listarDocumentos()
      .then(setData)
      .catch(err => setToast({ type: 'error', msg: err.message }))
      .finally(() => setLoading(false));
  }

  useEffect(() => { cargar(); }, []);

  async function descargar(actaId, codigo) {
    setAccion({ actaId, tipo: 'descargar' });
    try {
      await descargarPdf(actaId, codigo);
    } catch (err) {
      setToast({ type: 'error', msg: err.message });
    } finally {
      setAccion(null);
    }
  }

  async function ver(actaId) {
    setAccion({ actaId, tipo: 'ver' });
    try {
      await verPdf(actaId);
    } catch (err) {
      setToast({ type: 'error', msg: err.message });
    } finally {
      setAccion(null);
    }
  }

  async function regenerar(actaId, codigo) {
    if (!confirm(`¿Regenerar el PDF de ${codigo}?`)) return;
    try {
      await api.regenerarPdf(actaId);
      setToast({ type: 'success', msg: 'PDF regenerado' });
      cargar();
    } catch (err) {
      setToast({ type: 'error', msg: err.message });
    }
  }

  function fmtSize(bytes) {
    if (!bytes) return '—';
    return bytes < 1024 * 1024
      ? `${Math.round(bytes / 1024)} KB`
      : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  const busy = (actaId, tipo) => accion?.actaId === actaId && accion?.tipo === tipo;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-6 py-10">
        <p className="text-brand font-mono text-xs uppercase tracking-wider mb-2">Archivo documental</p>
        <h1 className="font-serif text-5xl mb-2">Documentos <em className="text-brand italic">PDF</em></h1>
        <p className="text-muted mb-8">Actas finalizadas con su PDF de evidencia, almacenado en la base de datos.</p>

        {loading ? (
          <div className="p-12 text-center text-muted">Cargando…</div>
        ) : !data || data.documentos.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center">
            <h2 className="font-serif text-3xl mb-2">Sin documentos</h2>
            <p className="text-muted">Aún no hay actas finalizadas. Los PDFs aparecen aquí cuando todas las firmas de un acta se completan.</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-6 py-3 text-left font-medium">Código</th>
                  <th className="px-6 py-3 text-left font-medium">Colaborador</th>
                  <th className="px-6 py-3 text-left font-medium">Finalizada</th>
                  <th className="px-6 py-3 text-left font-medium">PDF</th>
                  <th className="px-6 py-3 text-left font-medium">Tamaño</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.documentos.map(d => (
                  <tr key={d.actaId} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-mono text-xs text-muted">{d.codigo}</td>
                    <td className="px-6 py-3">
                      <p className="font-medium">{d.colaborador}</p>
                      <p className="text-xs text-muted">CC {d.cc} · {d.cargo}</p>
                    </td>
                    <td className="px-6 py-3 text-muted text-xs">
                      {d.finalizada_at ? new Date(d.finalizada_at).toLocaleString('es-CO') : '—'}
                    </td>
                    <td className="px-6 py-3">
                      {d.pdfDisponible
                        ? <span className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full">✓ Guardado</span>
                        : <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">Se genera al abrir</span>}
                    </td>
                    <td className="px-6 py-3 text-muted text-xs font-mono">{fmtSize(d.pdfSize)}</td>
                    <td className="px-6 py-3 text-right whitespace-nowrap space-x-3">
                      <button
                        onClick={() => ver(d.actaId)}
                        disabled={busy(d.actaId, 'ver')}
                        className="text-brand text-xs font-medium hover:underline disabled:opacity-40"
                      >
                        {busy(d.actaId, 'ver') ? 'Abriendo…' : '👁 Ver'}
                      </button>
                      <button
                        onClick={() => descargar(d.actaId, d.codigo)}
                        disabled={busy(d.actaId, 'descargar')}
                        className="text-brand text-xs font-medium hover:underline disabled:opacity-40"
                      >
                        {busy(d.actaId, 'descargar') ? 'Descargando…' : '⬇ Descargar'}
                      </button>
                      <button
                        onClick={() => regenerar(d.actaId, d.codigo)}
                        className="text-muted text-xs font-medium hover:text-ink"
                      >
                        Regenerar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
