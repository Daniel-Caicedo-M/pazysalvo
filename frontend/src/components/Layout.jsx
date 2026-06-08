import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../services/auth.jsx';
import { api } from '../services/api.js';

export default function Layout({ children }) {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [pendientesCount, setPendientesCount] = useState(0);

  useEffect(() => {
    if (!usuario) return;
    api.actasPendientes()
      .then(({ actas }) => setPendientesCount(actas.length))
      .catch(() => {});
  }, [usuario]);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-lg border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2">
            <svg viewBox="0 0 100 100" className="w-7 h-7" fill="#0E79FD">
              <path d="M10 10 L50 10 L10 50 Z"/>
              <path d="M50 10 L90 10 L90 50 Z"/>
              <path d="M10 50 L50 50 L10 90 Z"/>
              <path d="M50 50 L90 50 L50 90 Z"/>
            </svg>
            <span className="font-semibold text-brand">Siesa</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 ml-6">
            <Link to="/" className="px-3 py-1.5 text-sm rounded-lg hover:bg-gray-100 text-ink-soft">Actas</Link>
            <Link to="/pendientes" className="px-3 py-1.5 text-sm rounded-lg hover:bg-gray-100 text-ink-soft inline-flex items-center gap-1.5">
              Pendientes
              {pendientesCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-brand text-white text-[10px] font-medium rounded-full">
                  {pendientesCount}
                </span>
              )}
            </Link>
            {(usuario?.rol === 'admin' || usuario?.rol === 'rrhh') && (
              <Link to="/recordatorios" className="px-3 py-1.5 text-sm rounded-lg hover:bg-gray-100 text-ink-soft">Recordatorios</Link>
            )}
            {usuario?.rol === 'admin' && (
              <Link to="/usuarios" className="px-3 py-1.5 text-sm rounded-lg hover:bg-gray-100 text-ink-soft">Usuarios</Link>
            )}
          </nav>

          <div className="ml-auto flex items-center gap-3 text-sm">
            {usuario && (
              <>
                <div className="text-right hidden sm:block">
                  <div className="font-medium text-ink">{usuario.nombre}</div>
                  <div className="text-xs text-muted font-mono">{usuario.rol}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:border-ink"
                >
                  Salir
                </button>
              </>
            )}
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
