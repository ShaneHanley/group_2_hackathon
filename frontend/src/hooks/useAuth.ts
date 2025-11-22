import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface User {
  id: string;
  email: string;
  displayName: string;
  department?: string;
  roles: string[];
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('accessToken'),
  );

  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUserInfo();
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const fetchUserInfo = async () => {
    try {
      const response = await api.get('/auth/userinfo');
      setUser(response.data);
      setIsLoading(false);
    } catch (error) {
      setToken(null);
      localStorage.removeItem('accessToken');
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { accessToken, user: userData } = response.data;
      setToken(accessToken);
      localStorage.setItem('accessToken', accessToken);
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      setUser(userData);
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed',
      };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('accessToken');
    delete api.defaults.headers.common['Authorization'];
  };

  return {
    user,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    logout,
  };
}

