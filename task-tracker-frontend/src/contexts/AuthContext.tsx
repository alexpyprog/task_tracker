import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { authApi } from '../api/auth';
import { usersApi } from '../api/users';
import { UserOut } from '../types/auth';

interface AuthContextType {
  user: UserOut | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  updateUser: (data: any) => Promise<void>;
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
  const [user, setUser] = useState<UserOut | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const userData = await usersApi.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Failed to load user:', error);
      authApi.logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    await authApi.login({ username, password });
    await loadUser();
  };

  const register = async (data: any) => {
    await authApi.register(data);
    await login(data.username, data.password);
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
  };

  const updateUser = async (data: any) => {
    if (!user) return;
    const updatedUser = await usersApi.updateUser(user.id, data);
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};