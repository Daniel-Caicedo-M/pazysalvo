import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api } from './api.js';
import { useInactivityTimer } from './useInactivityTimer.js';

const AuthContext = createContext(null);

// Configuración de timeout por inactividad
const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;   // 15 minutos
const INACTIVITY_WARNING_MS = 60 * 1000;        // aviso 60s antes

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aviso, setAviso] = useState(null);
  const usuarioRef = useRef(null);

  useEffect(() => { usuarioRef.current = usuario; }, [usuario]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }
    api.me()
      .then(({ usuario }) => setUsuario(usuario))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  const logout = useCallback((razon = null) => {
    localStorage.removeItem('token');
    setUsuario(null);
    setAviso(null);
    if (razon === 'inactividad') {
      sessionStorage.setItem('logout_reason', 'Tu sesión se cerró por inactividad.');
    }
  }, []);

  const login = async (email, password) => {
    const data = await api.login(email, password);
    if (data.mustChangePassword) {
      localStorage.setItem('token', data.tempToken);
      setUsuario({ ...data.usuario, must_change_pwd: true });
      return { mustChangePassword: true };
    }
    localStorage.setItem('token', data.token);
    setUsuario(data.usuario);
    return { mustChangePassword: false };
  };

  const cambiarPassword = async (newPassword) => {
    const data = await api.changePassword(newPassword);
    localStorage.setItem('token', data.token);
    setUsuario(data.usuario);
  };

  const { reset } = useInactivityTimer({
    enabled: !!usuario,
    timeoutMs: INACTIVITY_TIMEOUT_MS,
    warningMs: INACTIVITY_WARNING_MS,
    onTimeout: () => {
      if (usuarioRef.current) logout('inactividad');
    },
    onWarning: (segundos) => setAviso({ segundos }),
  });

  const seguirActivo = useCallback(() => {
    setAviso(null);
    reset();
  }, [reset]);

  return (
    <AuthContext.Provider value={{ usuario, login, logout, cambiarPassword, loading }}>
      {children}
      {aviso && usuario && (
        <InactivityWarning
          segundos={aviso.segundos}
          onSeguir={seguirActivo}
          onSalir={() => logout('inactividad')}
        />
      )}
    </AuthContext.Provider>
  );
}

function InactivityWarning({ segundos, onSeguir, onSalir }) {
  const [restantes, setRestantes] = useState(segundos);

  useEffect(() => {
    const id = setInterval(() => {
      setRestantes(s => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
      <div className="bg-white rounded-2xl p-7 max-w-sm w-full shadow-2xl text-center">
        <div className="w-14 h-14 mx-auto mb-4 bg-amber-50 rounded-full flex items-center justify-center">
          <svg className="w-7 h-7 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
        <h2 className="font-serif text-2xl mb-1">¿Sigues ahí?</h2>
        <p className="text-sm text-muted mb-4">
          Tu sesión se cerrará en <strong className="text-ink font-mono">{restantes}s</strong> por inactividad.
        </p>
        <div className="flex gap-2 justify-center">
          <button onClick={onSalir} className="px-4 py-2 border border-gray-200 rounded-xl text-sm hover:border-ink">
            Cerrar sesión
          </button>
          <button onClick={onSeguir} className="px-4 py-2 bg-ink text-white rounded-xl text-sm font-medium hover:bg-brand">
            Seguir conectado
          </button>
        </div>
      </div>
    </div>
  );
}

export const useAuth = () => useContext(AuthContext);
