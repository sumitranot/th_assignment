import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/authService.js';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(true);

  // Synchronize authentication status on startup
  useEffect(() => {
    let isMounted = true;
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        if (isMounted) setIsLoading(false);
        return;
      }

      try {
        const currentUser = await authService.getCurrentUser();
        if (isMounted) {
          setUser(currentUser);
          localStorage.setItem('user', JSON.stringify(currentUser));
        }
      } catch {
        // Token was invalid, expired, or user deleted
        if (isMounted) {
          authService.logout();
          setUser(null);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen for global unauthorized events from apiClient
    const handleUnauthorizedEvent = () => {
      setUser(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorizedEvent);
    return () => {
      isMounted = false;
      window.removeEventListener('auth:unauthorized', handleUnauthorizedEvent);
    };
  }, []);

  const login = async ({ username, password }) => {
    const data = await authService.login({ username, password });
    setUser(data.user);
    return data;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const value = {
    user,
    isAuthenticated: Boolean(user),
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
