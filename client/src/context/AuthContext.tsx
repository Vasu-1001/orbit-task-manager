import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { api } from '../services/api';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loginAsDemo: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(() => api.getToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { success, error: toastError } = useToast();

  // Verify active session on initial app load
  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      try {
        const res = await api.auth.me();
        if (isMounted) {
          setUser(res.user);
        }
      } catch {
        // If session verification fails, clear stale token
        if (isMounted) {
          setUser(null);
          setTokenState(null);
          api.setToken(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      const res = await api.auth.login(email, password);
      api.setToken(res.token);
      setTokenState(res.token);
      setUser(res.user);
      success(`Welcome back, ${res.user.name}!`, 'Signed In');
    } catch (err: any) {
      toastError(err.message, 'Login Failed');
      throw err;
    }
  };

  const register = async (name: string, email: string, password: string): Promise<void> => {
    try {
      const res = await api.auth.register(name, email, password);
      api.setToken(res.token);
      setTokenState(res.token);
      setUser(res.user);
      success('Your ORBIT workspace is ready!', 'Account Created');
    } catch (err: any) {
      toastError(err.message, 'Registration Failed');
      throw err;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await api.auth.logout();
    } catch {
      // Continue client cleanup even if network request fails
    } finally {
      api.setToken(null);
      setTokenState(null);
      setUser(null);
      success('You have been logged out securely.', 'Signed Out');
    }
  };

  const loginAsDemo = async (): Promise<void> => {
    try {
      await login('demo@orbit.app', 'DemoPassword123!');
    } catch {
      // If demo user was not yet created, register it automatically
      await register('Demo User', 'demo@orbit.app', 'DemoPassword123!');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user),
        isLoading,
        login,
        register,
        logout,
        loginAsDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
