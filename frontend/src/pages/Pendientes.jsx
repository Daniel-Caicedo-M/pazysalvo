import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api.js';
import Layout from '../components/Layout.jsx';

export default function Pendientes() {
  const [actas, setActas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());
  const [observaciones, setObservaciones] = useState('');
  const [confirmado, setConfirmado] = useState(false);
  const [signing, setSigning] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [toast, setToast] = useState(null);

  function cargar() {
    setLoading(true);
    api.actasPendientes()
      .then(({ actas }) => setActas(actas))
      .catch(err => setToast({ type: 'error', msg: err.message }))
      .finally(() => setLoading(false));
  }

  useEffect(() => { cargar(); }, []);

  function toggle(id) {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  }

  function toggleAll() {
    if (selected.size === actas.length) setSelected(new Set());
    else setSelected(new Set(actas.map(a => a.id)));
  }

  function abrirModal() {
    if (selected.size === 0) return;
    setConfirmado(false); setObservaciones(''); setResultado(null);
    setModalOpen(true);
  }

  async function ejecutarFirmaMasiva() {
    setSigning(true);
    try {
      const r = await api.firmarMasivo([...selected], observaciones);
      setResultado(r);
      cargar();
      setSelected(new Set());
    } catch (err) {
      setToast({ type: 'error', msg: err.message });
    } finally {
      setSigning(false);
    }
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-baseline justify-between mb-8">
          <div>
            <p className="text-brand font-mono text-xs uppercase tracking-wider mb-2">Bandeja de entrada</p>
            <h1 className="font-serif text-5xl">Actas <em className="text-brand italic">pendientes</em></h1>
            <p className="text-muted mt-2">
              {actas.length === 0 ? 'No tienes firmas pendientes'
                : `${actas.length} ${actas.length === 1 ? 'acta requiere' : 'actas requieren'} tu firma`}
            </p>
          </div>
          {selected.size > 0 && (
            <button onClick={abrirModal}
              className="bg-ink text-white font-medium px-5 py-3 rounded-xl hover:bg-brand hover:shadow-brand transition inline-flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 19l7-7 3 3-7 7-3-3z"/>
                <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
              </svg>
              Firmar {selected.size} {selected.size === 1 ? 'acta' : 'actas'}
            </button>
          )}
        </div>

        {loading ? (
          <div className="p-12 text-center text-muted">Cargando…</div>
        ) : actas.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h2 className="font-serif text-3xl mb-2">Todo al día</h2>
            <p className="text-muted">No tienes actas pendientes de firma en este momento.</p>
            <Link to="/" className="inline-block mt-6 text-brand font-medium">Ver todas las actas →</Link>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="px-6 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input type="checkbox" checked={selected.size === actas.length && actas.length > 0}
                  onChange={toggleAll} className="w-4 h-4 accent-brand cursor-pointer" />
                <span className="text-sm font-medium">
                  {selected.size === 0 ? 'Seleccionar todas' : `${selected.size} de ${actas.length} seleccionadas`}
                </span>
              </label>
              {selected.size > 0 && (
                <button onClick={() => setSelected(new Set())} className="text-xs text-muted hover:text-ink">
                  Limpiar selección
                </button>
              )}
            </div>
            <div className="divide-y divide-gray-100">
              {actas.map(a => {
                const isSelected = selected.has(a.id);
                const progreso = Math.round((a.total_firmadas / a.total_responsables) * 100);
                return (
                  <label key={a.id}
                    className={`flex items-center gap-4 px-6 py-4 cursor-pointer transition ${isSelected ? 'bg-brand-soft/40' : 'hover:bg-gray-50'}`}>
                    <input type="checkbox" checked={isSelected} onChange={() => toggle(a.id)}
                      className="w-4 h-4 accent-brand cursor-pointer flex-shrink-0" />
                    <div className="flex-1 min-w-0 grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-4">
                        <p className="font-mono text-xs text-muted mb-0.5">{a.codigo}</p>
                        <p className="font-medium truncate">{a.colaborador_nombre}</p>
                        <p className="text-xs text-muted">CC {a.colaborador_cc}</p>
                      </div>
                      <div className="col-span-3">
                        <p className="text-xs uppercase tracking-wider text-muted">Cargo</p>
                        <p className="text-sm truncate">{a.cargo}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs uppercase tracking-wider text-muted">Retiro</p>
                        <p className="text-sm">{a.fecha_retiro}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs uppercase tracking-wider text-muted">Progreso</p>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden flex-1">
                            <div className="h-full bg-brand rounded-full transition-all" style={{ width: `${progreso}%` }} />
                          </div>
                          <span className="text-xs text-muted font-mono">{a.total_firmadas}/{a.total_responsables}</span>
                        </div>
                      </div>
                      <div className="col-span-1 text-right">
                        <Link to={`/actas/${a.id}`} onClick={e => e.stopPropagation()} className="text-xs text-brand font-medium">Ver →</Link>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {modalOpen && (
        <BulkSignModal
          count={selected.size} actas={actas.filter(a => selected.has(a.id))}
          observaciones={observaciones} setObservaciones={setObservaciones}
          confirmado={confirmado} setConfirmado={setConfirmado}
          signing={signing} resultado={resultado}
          onCancel={() => setModalOpen(false)}
          onConfirm={ejecutarFirmaMasiva}
        />
      )}
      {toast && <Toast type={toast.type} msg={toast.msg} onClose={() => setToast(null)} />}
    </Layout>
  );
}

function BulkSignModal({ count, actas, observaciones, setObservaciones, confirmado, setConfirmado, signing, resultado, onCancel, onConfirm }) {
  if (resultado) {
    const tieneErrores = resultado.fallidas > 0;
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${tieneErrores ? 'bg-amber-50' : 'bg-emerald-50'}`}>
            <svg className={`w-7 h-7 ${tieneErrores ? 'text-amber-500' : 'text-emerald-500'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {tieneErrores
                ? <path d="M12 9v2m0 4h.01M4.93 19h14.14a2 2 0 0 0 1.74-3l-7.07-12a2 2 0 0 0-3.48 0l-7.07 12a2 2 0 0 0 1.74 3z"/>
                : <polyline points="20 6 9 17 4 12"/>}
            </svg>
          </div>
          <h2 className="font-serif text-3xl mb-2">{tieneErrores ? 'Firma parcial' : 'Firma completada'}</h2>
          <p className="text-muted text-sm mb-5">
            Se firmaron <strong className="text-emerald-600">{resultado.exitosas}</strong> de <strong>{resultado.total}</strong> actas.
            {tieneErrores && <> No fue posible firmar <strong className="text-amber-600">{resultado.fallidas}</strong>.</>}
          </p>
          {resultado.resultados.exitosas.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted mb-2">Firmadas correctamente</p>
              <div className="bg-emerald-50/50 rounded-xl p-3 max-h-32 overflow-y-auto">
                {resultado.resultados.exitosas.map(e => (
                  <div key={e.actaId} className="text-xs py-1 flex items-center gap-2">
                    <span className="text-emerald-600">✓</span>
                    <span className="font-mono text-muted">{e.codigo}</span>
                    <span>·</span>
                    <span className="truncate">{e.colaborador}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {resultado.resultados.fallidas.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted mb-2">No se pudieron firmar</p>
              <div className="bg-amber-50/50 rounded-xl p-3 max-h-32 overflow-y-auto">
                {resultado.resultados.fallidas.map(f => (
                  <div key={f.actaId} className="text-xs py-1 flex items-center gap-2">
                    <span className="text-amber-600">×</span>
                    <span className="font-mono text-muted">ID {f.actaId}</span>
                    <span>·</span>
                    <span>{f.error}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex justify-end pt-4 border-t border-gray-100">
            <button onClick={onCancel} className="bg-ink text-white font-medium px-5 py-2.5 rounded-xl hover:bg-brand transition">Cerrar</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="font-serif text-3xl mb-2">Firma masiva</h2>
        <p className="text-muted text-sm mb-5">
          Vas a firmar <strong>{count}</strong> {count === 1 ? 'acta' : 'actas'} de una sola vez. Cada firma queda registrada individualmente con su hash y timestamp.
        </p>
        <div className="bg-gray-50 rounded-xl p-4 mb-4 max-h-48 overflow-y-auto">
          <p className="text-xs uppercase tracking-wider text-muted mb-2">Actas seleccionadas</p>
          {actas.map(a => (
            <div key={a.id} className="text-sm py-1.5 flex items-center gap-2">
              <span className="font-mono text-xs text-muted">{a.codigo}</span>
              <span className="text-muted">·</span>
              <span className="truncate">{a.colaborador_nombre}</span>
            </div>
          ))}
        </div>
        <textarea value={observaciones} onChange={e => setObservaciones(e.target.value)}
          placeholder="Observaciones para todas las firmas (opcional)" rows={2}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand-glow" />
        <label className="flex gap-3 items-start p-4 border border-gray-200 rounded-xl mt-4 cursor-pointer">
          <input type="checkbox" checked={confirmado} onChange={e => setConfirmado(e.target.checked)} className="mt-1 accent-brand" />
          <span className="text-xs text-ink-soft">
            Confirmo que he revisado la entrega de cada uno de los {count} colaboradores listados y declaro que cumplen con los requisitos de mi área. Acepto que mi firma electrónica tiene plena validez para todas las actas seleccionadas.
          </span>
        </label>
        <div className="flex gap-3 mt-5 justify-end">
          <button onClick={onCancel} disabled={signing}
            className="px-5 py-2.5 border border-gray-200 rounded-xl hover:border-ink text-sm disabled:opacity-50">Cancelar</button>
          <button onClick={onConfirm} disabled={!confirmado || signing}
            className="px-5 py-2.5 bg-ink text-white rounded-xl hover:bg-brand disabled:opacity-40 disabled:pointer-events-none text-sm font-medium">
            {signing ? `Firmando ${count}…` : `Firmar ${count} ${count === 1 ? 'acta' : 'actas'}`}
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
