'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface User {
  id: string;
  username: string;
  email: string;
  displayName?: string;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // Check for existing user data on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    try {
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('token');
      
      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      clearAuth();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      // Use Next.js rewrite to avoid CORS and hardcoded hosts
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        let message = 'Login failed';
        try {
          const contentType = response.headers.get('Content-Type') || '';
          if (contentType.includes('application/json')) {
            const error = await response.json();
            message = error.message || message;
          } else {
            const text = await response.text();
            message = text || message;
          }
        } catch {}
        throw new Error(message);
      }

      const data = await response.json();
      
      // Store user data and token
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
    } catch (error) {
      console.error('Login error:', error);
      const isNetwork = error instanceof TypeError && error.message === 'Failed to fetch';
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const wrapped = new Error(
        isNetwork
          ? `Unable to reach the server. Ensure the backend is running at ${apiUrl}`
          : (error as Error).message
      );
      throw wrapped;
    }
  };

  const register = async (username: string, email: string, password: string, displayName?: string) => {
    try {
      // Use Next.js rewrite to avoid CORS and hardcoded hosts
      const response = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password, displayName }),
      });

      if (!response.ok) {
        let message = 'Registration failed';
        let errors: string[] = [];
        try {
          const contentType = response.headers.get('Content-Type') || '';
          if (contentType.includes('application/json')) {
            const error = await response.json();
            message = error.message || message;
            // Extract validation errors array if present
            if (error.errors && Array.isArray(error.errors)) {
              errors = error.errors;
            } else if (error.errors && typeof error.errors === 'object') {
              // If errors is an object, convert to array
              errors = Object.values(error.errors).flat().filter(e => typeof e === 'string') as string[];
            }
          } else {
            const text = await response.text();
            message = text || message;
          }
        } catch {}
        // Create an error with both message and errors array
        const error = new Error(message) as Error & { errors?: string[] };
        if (errors.length > 0) {
          error.errors = errors;
        }
        throw error;
      }

      const data = await response.json();
      
      // Store user data and real token returned by backend
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
    } catch (error) {
      console.error('Registration error:', error);
      const isNetwork = error instanceof TypeError && error.message === 'Failed to fetch';
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const wrapped = new Error(
        isNetwork
          ? `Unable to reach the server. Ensure the backend is running at ${apiUrl}`
          : (error as Error).message
      );
      throw wrapped;
    }
  };

  const logout = () => {
    clearAuth();
  };

  const clearAuth = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

