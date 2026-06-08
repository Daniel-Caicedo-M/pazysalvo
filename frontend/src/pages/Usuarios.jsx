import { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import Layout from '../components/Layout.jsx';

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  function cargar() {
    api.listarUsuarios()
      .then(({ usuarios }) => setUsuarios(usuarios))
      .catch(err => setToast({ type: 'error', msg: err.message }))
      .finally(() => setLoading(false));
  }

  useEffect(() => { cargar(); }, []);

  async function reset(id) {
    if (!confirm('¿Resetear contraseña a la inicial (Siesa2026*)?')) return;
    try {
      await api.resetPassword(id);
      setToast({ type: 'success', msg: 'Contraseña reseteada' });
      cargar();
    } catch (err) { setToast({ type: 'error', msg: err.message }); }
  }

  async function toggle(id, activo) {
    try {
      await api.toggleActivo(id, !activo);
      cargar();
    } catch (err) { setToast({ type: 'error', msg: err.message }); }
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-6 py-10">
        <p className="text-brand font-mono text-xs uppercase tracking-wider mb-2">Administración</p>
        <h1 className="font-serif text-5xl mb-8">Usuarios</h1>
        {loading ? (
          <div className="p-12 text-center text-muted">Cargando…</div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-6 py-3 text-left font-medium">Nombre</th>
                  <th className="px-6 py-3 text-left font-medium">Email</th>
                  <th className="px-6 py-3 text-left font-medium">Área</th>
                  <th className="px-6 py-3 text-left font-medium">Rol</th>
                  <th className="px-6 py-3 text-left font-medium">Estado</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {usuarios.map(u => (
                  <tr key={u.id} className={u.activo === false ? 'opacity-50' : ''}>
                    <td className="px-6 py-3 font-medium">{u.nombre}</td>
                    <td className="px-6 py-3 font-mono text-xs text-muted">{u.email}</td>
                    <td className="px-6 py-3 text-muted">{u.area}</td>
                    <td className="px-6 py-3">
                      <span className="px-2 py-0.5 bg-brand-soft text-brand-dark text-xs font-medium rounded">{u.rol}</span>
                    </td>
                    <td className="px-6 py-3 text-xs">
                      {u.must_change_pwd ? <span className="text-amber-600">Pendiente cambio</span>
                        : u.activo === false ? <span className="text-red-600">Inactivo</span>
                        : <span className="text-emerald-600">Activo</span>}
                    </td>
                    <td className="px-6 py-3 text-right space-x-2">
                      <button onClick={() => reset(u.id)} className="text-brand text-xs font-medium">Reset</button>
                      <button onClick={() => toggle(u.id, u.activo)} className="text-muted text-xs font-medium">
                        {u.activo === false ? 'Activar' : 'Desactivar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {toast && (
          <div className={`fixed bottom-6 right-6 ${toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'} text-white px-4 py-3 rounded-xl shadow-lg text-sm`}>
            {toast.msg}
          </div>
        )}
      </div>
    </Layout>
  );
}
