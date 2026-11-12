import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  currentUser: User | null;
  role: UserRole;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: string, department?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const initAuth = async () => {
    try {
      const token = localStorage.getItem('spendwise_token');
      if (token) {
        const user = await authApi.getMe();
        setCurrentUser(user);
      }
      // No token = user is not authenticated. Do NOT auto-login.
    } catch (err) {
      // Token is invalid or expired — clear it safely
      console.warn('Auth init failed, clearing invalid token', err);
      localStorage.removeItem('spendwise_token');
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const data = await authApi.login(email, password);
      localStorage.setItem('spendwise_token', data.token);
      setCurrentUser(data.user);
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, role?: string, department?: string) => {
    setLoading(true);
    try {
      await authApi.register(name, email, password, role, department);
      // Explicit registration: User must sign in with their newly created credentials
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('spendwise_token');
    setCurrentUser(null);
  };

  const refreshUser = async () => {
    try {
      const user = await authApi.getMe();
      setCurrentUser(user);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role: currentUser?.role || 'employee',
        loading,
        isAuthenticated: !!currentUser,
        login,
        register,
        logout,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
