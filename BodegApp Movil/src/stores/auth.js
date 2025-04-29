import apiClient from '@/services/api'
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token'),
    refreshToken: localStorage.getItem('refreshToken'),
    user: JSON.parse(localStorage.getItem('user') || 'null'),
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
  },
  actions: {
    setAuth({ token, refreshToken, user }) {
      this.token = token; this.refreshToken = refreshToken; this.user = user;
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
    },
    async refreshAuth() {
      try {
        const response = await apiClient.post('/api/auth/refresh', { refreshToken: this.refreshToken });
        this.token = response.data.token;
        this.refreshToken = response.data.refreshToken;
        localStorage.setItem('token', this.token);
        localStorage.setItem('refreshToken', this.refreshToken);
      } catch (e) {
        this.clearAuth();
        throw e;
      }
    },
    clearAuth() {
      this.token = null; this.refreshToken = null; this.user = null;
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    },
  },
})