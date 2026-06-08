import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import Layout from '../components/Layout.jsx';

export default function NuevaActa() {
  const [form, setForm] = useState({
    colaborador_nombre: '', colaborador_cc: '', colaborador_email: '',
    cargo: '', area: '', ciudad: '', tipo_retiro: 'Definitivo', fecha_retiro: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function update(k, v) { setForm(prev => ({ ...prev, [k]: v })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = { ...form };
      if (!payload.colaborador_email) delete payload.colaborador_email;
      const { acta } = await api.crearActa(payload);
      navigate(`/actas/${acta.id}`);
    } catch (err) {
      setError(err.message || 'Error creando acta');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-6 py-10">
        <p className="text-brand font-mono text-xs uppercase tracking-wider mb-2">Nueva acta</p>
        <h1 className="font-serif text-4xl mb-8">Datos del colaborador</h1>

        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-8 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Tipo de retiro">
              <select value={form.tipo_retiro} onChange={e => update('tipo_retiro', e.target.value)} className="input">
                <option>Definitivo</option><option>Temporal</option>
              </select>
            </Field>
            <Field label="Fecha de retiro" required>
              <input type="date" value={form.fecha_retiro} onChange={e => update('fecha_retiro', e.target.value)} required className="input" />
            </Field>
          </div>

          <Field label="Nombre completo" required>
            <input type="text" value={form.colaborador_nombre} onChange={e => update('colaborador_nombre', e.target.value)} required className="input" />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="C.C." required>
              <input type="text" value={form.colaborador_cc} onChange={e => update('colaborador_cc', e.target.value)} required className="input" />
            </Field>
            <Field label="Ciudad" required>
              <input type="text" value={form.ciudad} onChange={e => update('ciudad', e.target.value)} required className="input" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Cargo" required>
              <input type="text" value={form.cargo} onChange={e => update('cargo', e.target.value)} required className="input" />
            </Field>
            <Field label="Área / Unidad" required>
              <input type="text" value={form.area} onChange={e => update('area', e.target.value)} required className="input" />
            </Field>
          </div>

          <Field label="Correo corporativo (opcional)">
            <input type="email" value={form.colaborador_email} onChange={e => update('colaborador_email', e.target.value)} placeholder="usuario@siesa.com" className="input" />
          </Field>

          {error && <div className="text-sm text-red-700 bg-red-50 border-l-4 border-red-500 px-3 py-2 rounded">{error}</div>}

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button type="submit" disabled={loading} className="bg-ink text-white font-medium px-6 py-3 rounded-xl hover:bg-brand hover:shadow-brand transition disabled:opacity-50">
              {loading ? 'Creando…' : 'Crear acta'}
            </button>
            <button type="button" onClick={() => navigate('/')} className="px-6 py-3 border border-gray-200 rounded-xl hover:border-ink">Cancelar</button>
          </div>
        </form>
      </div>
      <style>{`
        .input { width: 100%; padding: 11px 14px; border: 1px solid #E5E7EB; border-radius: 10px; font-family: inherit; font-size: 15px; transition: all 0.15s; }
        .input:focus { outline: none; border-color: #0E79FD; box-shadow: 0 0 0 4px rgba(14,121,253,0.15); }
      `}</style>
    </Layout>
  );
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted mb-1.5">
        {label} {required && <span className="text-brand">*</span>}
      </label>
      {children}
    </div>
  );
}
