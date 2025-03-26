// src/stores/authStore.js
import { defineStore } from 'pinia';

/**
 * Pinia store for managing authentication state.
 *
 * This store handles the authentication data by maintaining properties such as:
 *
 * @property {(string|null)} token - The access token used for authentication.
 *   Se obtiene mediante el getter getToken y se verifica la autenticación con isAuthenticated.
 *
 * @property {(string|null)} refreshToken - The refresh token used to obtain a new access token.
 *
 * @property {Object} user - The user information object.
 *   Contiene datos del usuario autenticado, incluyendo por ejemplo 'clienteNombre'.
 *
 * Getters:
 * @property {function(): boolean} isAuthenticated - Devuelve true si existe un token, false de lo contrario.
 * @property {function(): (string|null)} getToken - Retorna el token actual.
 * @property {function(): string} clienteNombre - Retorna el nombre del cliente (clienteNombre) extraído del objeto user.
 * @property {function(): Object} clienteData - Retorna el objeto completo con la información del usuario.
 *
 * Actions:
 * @property {function(string): void} setToken - Establece un nuevo token y lo guarda en localStorage.
 * @property {function(): void} removeToken - Elimina el token del estado y de localStorage.
 * @property {function(string): void} setRefreshToken - Establece un nuevo refresh token y lo guarda en localStorage.
 * @property {function(): void} removeRefreshToken - Elimina el refresh token del estado y de localStorage.
 * @property {function(Object): void} setUser - Establece la información del usuario y la guarda en localStorage.
 * @property {function(): void} removeUser - Elimina la información del usuario del estado y de localStorage.
 * @property {function(): void} resetAuth - Realiza un reseteo completo de la autenticación, eliminando token, refreshToken y user del estado y de localStorage.
 *
 * Además, el estado se inicializa tomando valores persistidos en localStorage para mantener la sesión a través de recargas de página.
 */
export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || null,
    refreshToken: localStorage.getItem('refreshToken') || null,
    user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : {},
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
    getToken: (state) => state.token,
    clienteNombre: (state) => state.user.clienteNombre || '',
    clienteId: (state) => state.user.clienteId || null,
    clienteData: (state) => state.user,
    tipoUsuarioId: (state) => state.user.tipoUsuarioId || null,

  },
  actions: {
    setToken(token) {
      this.token = token;
      localStorage.setItem('token', token);
    },
    removeToken() {
      this.token = null;
      localStorage.removeItem('token');
    },
    setRefreshToken(refreshToken) {
      this.refreshToken = refreshToken;
      localStorage.setItem('refreshToken', refreshToken);
    },
    removeRefreshToken() {
      this.refreshToken = null;
      localStorage.removeItem('refreshToken');
    },
    setUser(user) {
      this.user = user;
      localStorage.setItem('user', JSON.stringify(user));
    },
    removeUser() {
      this.user = {};
      localStorage.removeItem('user');
    },
    // Reset completo de autenticación
    resetAuth() {
      this.token = null;
      this.refreshToken = null;
      this.user = {};
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    },
  },
});
