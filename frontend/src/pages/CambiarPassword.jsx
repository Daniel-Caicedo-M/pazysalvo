import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/auth.jsx';

export default function CambiarPassword() {
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { cambiarPassword } = useAuth();
  const navigate = useNavigate();

  const reqs = {
    length: newPwd.length >= 8,
    upper: /[A-Z]/.test(newPwd),
    number: /[0-9]/.test(newPwd),
  };
  const allMet = Object.values(reqs).every(Boolean);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (newPwd !== confirmPwd) return setError('las contraseñas no coinciden');
    if (!allMet) return setError('la contraseña no cumple los requisitos');
    setLoading(true);
    try {
      await cambiarPassword(newPwd);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-white via-brand-soft to-white">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
        <h1 className="font-serif text-4xl mb-2">Cambia tu contraseña</h1>
        <p className="text-muted text-sm mb-6">Por seguridad, debes establecer una nueva contraseña antes de continuar.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">Nueva contraseña</label>
            <input
              type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand-glow transition"
            />
            <div className="mt-2 space-y-1 text-xs">
              <Req met={reqs.length}>Mínimo 8 caracteres</Req>
              <Req met={reqs.upper}>Una mayúscula</Req>
              <Req met={reqs.number}>Un número</Req>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">Confirmar contraseña</label>
            <input
              type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand-glow transition"
            />
          </div>

          {error && (
            <div className="text-sm text-red-700 bg-red-50 border-l-4 border-red-500 px-3 py-2 rounded">{error}</div>
          )}

          <button
            type="submit" disabled={loading || !allMet}
            className="w-full bg-ink text-white font-medium py-3.5 rounded-xl hover:bg-brand hover:shadow-brand transition disabled:opacity-50"
          >
            {loading ? 'Guardando…' : 'Guardar y continuar'}
          </button>
        </form>
      </div>
    </div>
  );
}

function Req({ met, children }) {
  return (
    <div className={`flex items-center gap-2 ${met ? 'text-emerald-600' : 'text-muted'}`}>
      <span className={`w-2 h-2 rounded-full ${met ? 'bg-emerald-500' : 'bg-gray-300'}`} />
      {children}
    </div>
  );
}
