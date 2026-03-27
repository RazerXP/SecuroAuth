import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import api from '../lib/axios';
import type { AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';

interface RetryAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Set up axios interceptors for token handling
  useEffect(() => {
    const responseInterceptor = api.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError<unknown, RetryAxiosRequestConfig>) => {
        const config = error.config as RetryAxiosRequestConfig | undefined;
        const isGetMe = config?.url?.includes('/auth/me');

        if (error.response?.status === 403 && config && !config._retry && isGetMe) {
          config._retry = true;

          try {
            await refreshToken();
            return api(config);
          } catch (refreshError) {
            await logout();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  // Check if user is logged in on mount
  useEffect(() => {
    api.get('/auth/me')
      .then((response: AxiosResponse) => {
        setUser(response.data.user);
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const { user: userData } = response.data;
    setUser(userData);
  };

  const signup = async (email: string, password: string) => {
    const response = await api.post('/auth/signup', { email, password });
    const { user: userData } = response.data;
    setUser(userData);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  const refreshToken = async () => {
    await api.post('/auth/refresh');
  };

  const value: AuthContextType = {
    user,
    login,
    signup,
    logout,
    refreshToken,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};