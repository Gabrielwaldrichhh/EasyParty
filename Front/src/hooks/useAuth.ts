import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import type { User } from '../types';

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function login(username: string, password: string) {
    setLoading(true);
    setError('');
    try {
      const result = await authService.login(username, password);
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      navigate(`/${result.user.username}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  }

  async function register(username: string, email: string, password: string) {
    setLoading(true);
    setError('');
    try {
      const result = await authService.register(username, email, password);
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      navigate(`/${result.user.username}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    authService.logout();
    navigate('/login');
  }

  const user: User | null = authService.getStoredUser();
  const isAuthenticated = authService.isAuthenticated();

  return { login, register, logout, user, isAuthenticated, loading, error, setError };
}
