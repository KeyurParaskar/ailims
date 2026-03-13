import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { login as apiLogin, register as apiRegister, getCurrentUser } from '../services/api';

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'lab_manager' | 'lab_tech' | 'viewer';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName?: string, lastName?: string) => Promise<void>;
  logout: () => void;
  hasRole: (requiredRole: string | string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ROLE_HIERARCHY: Record<string, number> = {
  admin: 4,
  lab_manager: 3,
  lab_tech: 2,
  viewer: 1,
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const userData = await getCurrentUser();
          setUser(userData);
          setToken(storedToken);
        } catch (error) {
          console.error('Failed to get user:', error);
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await apiLogin(email, password);
    if (response.success) {
      localStorage.setItem('token', response.token);
      setToken(response.token);
      setUser(response.user);
    } else {
      throw new Error(response.error || 'Login failed');
    }
  };

  const register = async (email: string, password: string, firstName?: string, lastName?: string) => {
    const response = await apiRegister(email, password, firstName, lastName);
    if (response.success) {
      localStorage.setItem('token', response.token);
      setToken(response.token);
      setUser(response.user);
    } else {
      throw new Error(response.error || 'Registration failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const hasRole = (requiredRole: string | string[]): boolean => {
    if (!user) return false;

    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    
    // Check if user has any of the required roles
    if (roles.includes(user.role)) return true;

    // Check role hierarchy (higher roles have access to lower role features)
    const userLevel = ROLE_HIERARCHY[user.role] || 0;
    return roles.some((role) => {
      const requiredLevel = ROLE_HIERARCHY[role] || 0;
      return userLevel >= requiredLevel;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
