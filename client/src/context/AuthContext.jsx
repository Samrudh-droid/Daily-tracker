import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setUnauthorizedHandler } from '../lib/api';

const AuthContext = createContext(null);
const tokenKey = 'daily-tracker-token';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const handleUnauthorized = useCallback(() => {
    localStorage.removeItem(tokenKey);
    setUser(null);
    setLoading(false);
    navigate('/login', { replace: true });
  }, [navigate]);

  useEffect(() => {
    setUnauthorizedHandler(handleUnauthorized);
    return () => setUnauthorizedHandler(null);
  }, [handleUnauthorized]);

  useEffect(() => {
    if (!localStorage.getItem(tokenKey)) {
      setLoading(false);
      return;
    }

    api
      .get('/auth/me')
      .then(({ data }) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const finishLogin = useCallback((token, authenticatedUser) => {
    localStorage.setItem(tokenKey, token);
    setUser(authenticatedUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(tokenKey);
    setUser(null);
    navigate('/login', { replace: true });
  }, [navigate]);

  const value = useMemo(
    () => ({ user, loading, finishLogin, logout }),
    [user, loading, finishLogin, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
