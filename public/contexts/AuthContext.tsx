'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, AuthStatus, checkAuthStatus, getCurrentUser, handleCASRedirect } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  refreshAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const refreshAuth = async () => {
    // Don't refresh auth if we're in the middle of logging out
    if (isLoggingOut) return;
    
    try {
      setIsLoading(true);
      const authStatus = await checkAuthStatus();
      
      if (authStatus.authenticated) {
        const userData = await getCurrentUser();
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error refreshing auth:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Immediately clear local state first
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('userType');
      
      // Call backend to clear session
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      await fetch(`${apiUrl}/auth/logout`, {
        method: 'GET',
        credentials: 'include',
      });
      
      // Navigate to home page - this will trigger a re-render with cleared state
      window.location.href = '/';
    } catch (error) {
      console.error('Error logging out:', error);
      // Even if logout request fails, clear local state and redirect
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('userType');
      window.location.href = '/';
    }
  };

  useEffect(() => {
    // Handle CAS redirects when component mounts
    handleCASRedirect();
    
    // Check authentication status on mount
    refreshAuth();
  }, []);

  const value = {
    user,
    isAuthenticated,
    isLoading,
    refreshAuth,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;