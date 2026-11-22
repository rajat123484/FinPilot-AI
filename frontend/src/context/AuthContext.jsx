import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('finpilot_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('finpilot_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyUser = async () => {
      if (token) {
        try {
          const userData = await api.auth.getMe();
          setUser(userData);
          localStorage.setItem('finpilot_user', JSON.stringify(userData));
        } catch (err) {
          console.warn('Session verification failed:', err);
          logout();
        }
      }
      setLoading(false);
    };

    const handleAuthExpired = () => {
      logout();
    };

    window.addEventListener('auth-expired', handleAuthExpired);
    verifyUser();

    return () => {
      window.removeEventListener('auth-expired', handleAuthExpired);
    };
  }, [token]);

  const saveAuthSession = (authResponse) => {
    const { access_token, user: userData } = authResponse;
    setToken(access_token);
    setUser(userData);
    localStorage.setItem('finpilot_token', access_token);
    localStorage.setItem('finpilot_user', JSON.stringify(userData));
  };

  const login = async (email, password) => {
    const data = await api.auth.login(email, password);
    saveAuthSession(data);
    return data;
  };

  const register = async (userData) => {
    const data = await api.auth.register(userData);
    saveAuthSession(data);
    return data;
  };

  const demoLogin = async () => {
    const data = await api.auth.demoLogin();
    saveAuthSession(data);
    return data;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('finpilot_token');
    localStorage.removeItem('finpilot_user');
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('finpilot_user', JSON.stringify(updatedUser));
  };

  const formatCurrency = (amount) => {
    const symbolMap = { USD: '$', EUR: '€', INR: '₹', GBP: '£', JPY: '¥', CAD: 'C$' };
    const sym = symbolMap[user?.currency || 'USD'] || '$';
    return `${sym}${Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        loading,
        login,
        register,
        demoLogin,
        logout,
        updateUser,
        formatCurrency,
        currencySymbol: { USD: '$', EUR: '€', INR: '₹', GBP: '£' }[user?.currency || 'USD'] || '$',
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
