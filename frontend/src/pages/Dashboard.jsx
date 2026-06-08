import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../services/auth.jsx';
import { api } from '../services/api.js';
import Layout from '../components/Layout.jsx';

export default function Dashboard() {
  const { usuario } = useAuth();
  const [actas, setActas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listarActas()
      .then(({ actas }) => setActas(actas))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    total: actas.length,
    enProceso: actas.filter(a => a.estado === 'en_proceso').length,
    finalizadas: actas.filter(a => a.estado === 'finalizada').length,
    borrador: actas.filter(a => a.estado === 'borrador').length,
  };

  const puedeCrear = usuario?.rol === 'rrhh' || usuario?.rol === 'admin';

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-baseline justify-between mb-8">
          <div>
            <p className="text-brand font-mono text-xs uppercase tracking-wider mb-2">Panel principal</p>
            <h1 className="font-serif text-5xl">Actas <em className="text-brand italic">de retiro</em></h1>
            <p className="text-muted mt-2">Gestión digital de Paz y Salvo</p>
          </div>
          {puedeCrear && (
            <Link to="/nueva" className="bg-ink text-white font-medium px-5 py-3 rounded-xl hover:bg-brand hover:shadow-brand transition inline-flex items-center gap-2">
              + Nueva acta
            </Link>
          )}
        </div>

        <div className="grid grid-cols-4 gap-4 mb-8">
          <Stat label="Total" value={stats.total} />
          <Stat label="En proceso" value={stats.enProceso} accent="text-amber-600" />
          <Stat label="Finalizadas" value={stats.finalizadas} accent="text-emerald-600" />
          <Stat label="Borradores" value={stats.borrador} accent="text-gray-500" />
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-medium">Actas recientes</h2>
          </div>
          {loading ? (
            <div className="p-12 text-center text-muted">Cargando…</div>
          ) : actas.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-muted mb-3">No hay actas todavía.</p>
              {puedeCrear && <Link to="/nueva" className="text-brand font-medium">Crear la primera</Link>}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-6 py-3 text-left font-medium">Código</th>
                  <th className="px-6 py-3 text-left font-medium">Colaborador</th>
                  <th className="px-6 py-3 text-left font-medium">Cargo</th>
                  <th className="px-6 py-3 text-left font-medium">Fecha retiro</th>
                  <th className="px-6 py-3 text-left font-medium">Estado</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {actas.map(a => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-mono text-xs text-muted">{a.codigo}</td>
                    <td className="px-6 py-3 font-medium">{a.colaborador_nombre}</td>
                    <td className="px-6 py-3 text-muted">{a.cargo}</td>
                    <td className="px-6 py-3 text-muted">{a.fecha_retiro}</td>
                    <td className="px-6 py-3"><EstadoBadge estado={a.estado} /></td>
                    <td className="px-6 py-3 text-right">
                      <Link to={`/actas/${a.id}`} className="text-brand font-medium text-sm">Ver →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Layout>
  );
}

function Stat({ label, value, accent = 'text-ink' }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <p className="text-xs uppercase tracking-wider text-muted font-medium">{label}</p>
      <p className={`font-serif text-4xl mt-1 ${accent}`}>{value}</p>
    </div>
  );
}

function EstadoBadge({ estado }) {
  const styles = {
    borrador:    'bg-gray-100 text-gray-700',
    en_proceso:  'bg-amber-50 text-amber-700',
    finalizada:  'bg-emerald-50 text-emerald-700',
    anulada:     'bg-red-50 text-red-700',
  };
  const labels = { borrador: 'Borrador', en_proceso: 'En proceso', finalizada: 'Finalizada', anulada: 'Anulada' };
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${styles[estado]}`}>
      {labels[estado] || estado}
    </span>
  );
}
