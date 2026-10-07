import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../config/api';

const TOKEN_KEY = 'trendz_auth_token';

const AuthContext = createContext(null);

function saveToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() =>
    localStorage.getItem(TOKEN_KEY)
  );

  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearSession = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      if (!token) {
        if (active) {
          setIsLoading(false);
        }
        return;
      }

      try {
        const data = await apiRequest('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (active) {
          setUser(data.user);
        }
      } catch {
        if (active) {
          clearSession();
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    setIsLoading(true);
    restoreSession();

    return () => {
      active = false;
    };
  }, [token]);

  const authenticate = (data) => {
    saveToken(data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token && user),
      isLoading,

      register: async (credentials) => {
        const data = await apiRequest('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(credentials)
        });

        authenticate(data);
        return data;
      },

      login: async (credentials) => {
        const data = await apiRequest('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(credentials)
        });

        authenticate(data);
        return data;
      },

      logout: () => {
        clearSession();
      }
    }),
    [token, user, isLoading]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
