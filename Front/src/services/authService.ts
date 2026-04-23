import api from './api';
import type { AuthResponse, User, UpdateProfilePayload } from '../types';

export const authService = {
  async login(username: string, password: string): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/login', { username, password });
    return data;
  },

  async register(username: string, email: string, password: string): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/register', { username, email, password });
    return data;
  },

  async checkUsername(username: string): Promise<{ available: boolean; suggestions: string[] }> {
    const { data } = await api.get(`/auth/check/username/${encodeURIComponent(username)}`);
    return data;
  },

  async checkEmail(email: string): Promise<{ available: boolean }> {
    const { data } = await api.get(`/auth/check/email/${encodeURIComponent(email)}`);
    return data;
  },

  async getMe(): Promise<User> {
    const { data } = await api.get<{ success: boolean; data: User }>('/auth/me');
    return data.data;
  },

  async updateProfile(payload: UpdateProfilePayload): Promise<User> {
    const { data } = await api.put<{ success: boolean; data: User }>('/auth/profile', payload);
    // Atualiza o usuário no localStorage
    const stored = localStorage.getItem('user');
    if (stored) {
      localStorage.setItem('user', JSON.stringify({ ...JSON.parse(stored), ...data.data }));
    }
    return data.data;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  /**
   * RISCO DE SEGURANÇA (BAIXO/MÉDIO — TCC):
   * O token JWT e dados do usuário são armazenados em localStorage,
   * que é acessível por qualquer script JavaScript na mesma origem.
   * Em caso de XSS, um atacante pode roubar o token.
   * Mitigação em produção real: usar httpOnly cookies para o token.
   * Para este TCC a abordagem está documentada e aceita como trade-off.
   */
  getStoredUser() {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      // JSON inválido — limpa dados corrompidos
      localStorage.removeItem('user');
      return null;
    }
  },

  isAuthenticated() {
    return !!localStorage.getItem('token');
  },
};
