import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [token,   setToken]   = useState(() => localStorage.getItem('ff_token'));
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    api.get('/auth/me')
      .then(r => setUser(r.data))
      .catch(() => { localStorage.removeItem('ff_token'); setToken(null); })
      .finally(() => setLoading(false));
  }, [token]);

  const login = (tok, usr) => {
    localStorage.setItem('ff_token', tok);
    setToken(tok); setUser(usr);
  };
  const logout = () => {
    localStorage.removeItem('ff_token');
    setToken(null); setUser(null);
  };

  return <Ctx.Provider value={{ token, user, login, logout, loading }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
