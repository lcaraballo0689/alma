// src/stores/sessionStore.js
import { defineStore } from 'pinia';

export const useSessionStore = defineStore('session', {
  state: () => ({
    token: localStorage.getItem('token') || null,
    refreshToken: localStorage.getItem('refreshToken') || null,
    user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : {},
    sessionExpired: false
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
    clienteNombre: (state) => state.user.clienteNombre || ''
  },
  actions: {
    setToken(token) {
      this.token = token;
      localStorage.setItem('token', token);
    },
    setRefreshToken(refreshToken) {
      this.refreshToken = refreshToken;
      localStorage.setItem('refreshToken', refreshToken);
    },
    setUser(user) {
      this.user = user;
      localStorage.setItem('user', JSON.stringify(user));
    },
    expireSession() {
      this.sessionExpired = true;
      this.token = null;
      this.refreshToken = null;
      this.user = {};
      this.$reset();
      localStorage.clear();
      
    },
    resetSession() {
      this.sessionExpired = false;
      this.token = null;
      this.refreshToken = null;
      this.user = {};
      localStorage.clear();
    }
  }
});
