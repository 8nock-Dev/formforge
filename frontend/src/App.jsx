import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login      from './pages/Login';
import Dashboard  from './pages/Dashboard';
import FormDetail from './pages/FormDetail';
import ThankYou   from './pages/ThankYou';

function Guard({ children }) {
  const { token, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <span className="text-indigo-400 font-mono text-sm">Loading…</span>
    </div>
  );
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login"       element={<Login />} />
      <Route path="/thanks"      element={<ThankYou />} />
      <Route path="/"            element={<Guard><Dashboard /></Guard>} />
      <Route path="/forms/:id"   element={<Guard><FormDetail /></Guard>} />
      <Route path="*"            element={<Navigate to="/" replace />} />
    </Routes>
  );
}
