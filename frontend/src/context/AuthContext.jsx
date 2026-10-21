import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/authApi';
import { userApi } from '../api/userApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const data = await authApi.getMe();
        setUser(data.user);
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    checkAuth();

    const handleAuthExpired = () => {
      setUser(null);
    };

    window.addEventListener('auth:expired', handleAuthExpired);
    return () => window.removeEventListener('auth:expired', handleAuthExpired);
  }, []);

  const login = async (email, password) => {
    const data = await authApi.login({ email, password });
    setUser(data.user);
    return data.user;
  };

  const register = async (name, email, password, confirmPassword) => {
    const data = await authApi.register({ name, email, password, confirmPassword });
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  };

  const updateProfile = async (name) => {
    const data = await userApi.updateProfile({ name });
    setUser(data.user);
    return data.user;
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
