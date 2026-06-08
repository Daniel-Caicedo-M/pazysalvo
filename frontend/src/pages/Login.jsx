import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/auth.jsx';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const reason = sessionStorage.getItem('logout_reason');
    if (reason) {
      setAviso(reason);
      sessionStorage.removeItem('logout_reason');
    }
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setAviso('');
    setLoading(true);
    try {
      const { mustChangePassword } = await login(email, password);
      navigate(mustChangePassword ? '/cambiar-password' : '/');
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-white via-brand-soft to-white">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
        <div className="flex items-center gap-2 mb-8">
          <svg viewBox="0 0 100 100" className="w-8 h-8" fill="#0E79FD">
            <path d="M10 10 L50 10 L10 50 Z"/>
            <path d="M50 10 L90 10 L90 50 Z"/>
            <path d="M10 50 L50 50 L10 90 Z"/>
            <path d="M50 50 L90 50 L50 90 Z"/>
          </svg>
          <span className="text-xl font-semibold text-brand">Siesa</span>
        </div>

        <h1 className="font-serif text-4xl mb-2">Inicia sesión</h1>
        <p className="text-muted text-sm mb-6">Accede con tu correo corporativo para gestionar las actas de Paz y Salvo.</p>

        {aviso && (
          <div className="text-sm text-amber-800 bg-amber-50 border-l-4 border-amber-500 px-3 py-2 rounded mb-4">
            {aviso}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">Correo corporativo</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder="usuario@siesa.com"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand-glow transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">Contraseña</label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                value={password} onChange={e => setPassword(e.target.value)} required
                className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand-glow transition"
              />
              <button
                type="button" onClick={() => setShowPwd(!showPwd)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-muted hover:text-ink rounded"
              >
                {showPwd ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-700 bg-red-50 border-l-4 border-red-500 px-3 py-2 rounded">{error}</div>
          )}

          <button
            type="submit" disabled={loading}
            className="w-full bg-ink text-white font-medium py-3.5 rounded-xl hover:bg-brand hover:shadow-brand transition disabled:opacity-50"
          >
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>

          <div className="text-xs text-muted text-center bg-brand-soft rounded-xl p-3 mt-2">
            <strong>¿Primer ingreso?</strong> La contraseña inicial es <code className="bg-white px-2 py-0.5 rounded font-mono text-brand">Siesa2026*</code>
          </div>
        </form>
      </div>
    </div>
  );
}
