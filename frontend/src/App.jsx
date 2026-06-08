import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './services/auth.jsx';
import Login from './pages/Login.jsx';
import CambiarPassword from './pages/CambiarPassword.jsx';
import Dashboard from './pages/Dashboard.jsx';
import NuevaActa from './pages/NuevaActa.jsx';
import ActaDetalle from './pages/ActaDetalle.jsx';
import Usuarios from './pages/Usuarios.jsx';
import Pendientes from './pages/Pendientes.jsx';
import Recordatorios from './pages/Recordatorios.jsx';

function ProtectedRoute({ children, roles }) {
  const { usuario, loading } = useAuth();
  if (loading) return <div className="p-12 text-center text-muted">Cargando…</div>;
  if (!usuario) return <Navigate to="/login" replace />;
  if (usuario.must_change_pwd) return <Navigate to="/cambiar-password" replace />;
  if (roles && !roles.includes(usuario.rol)) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/cambiar-password" element={<CambiarPassword />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/pendientes" element={<ProtectedRoute><Pendientes /></ProtectedRoute>} />
      <Route path="/nueva" element={<ProtectedRoute roles={['rrhh', 'admin']}><NuevaActa /></ProtectedRoute>} />
      <Route path="/actas/:id" element={<ProtectedRoute><ActaDetalle /></ProtectedRoute>} />
      <Route path="/recordatorios" element={<ProtectedRoute roles={['admin', 'rrhh']}><Recordatorios /></ProtectedRoute>} />
      <Route path="/usuarios" element={<ProtectedRoute roles={['admin']}><Usuarios /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
