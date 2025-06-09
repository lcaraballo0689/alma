// src/stores/authStore.js
import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
  // Inicializamos el estado tomando valores de localStorage, lo que garantiza la compatibilidad con el código legacy.
  state: () => ({
    token: localStorage.getItem('token') || null,
    refreshToken: localStorage.getItem('refreshToken') || null,
    user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : {},
    permissions: localStorage.getItem('permissions') ? JSON.parse(localStorage.getItem('permissions')) : []
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
    getToken: (state) => state.token,
    clienteNombre: (state) => state.user.clienteNombre || '',
    clienteId: (state) => state.user.clienteId || null,
    clienteData: (state) => state.user,
    tipoUsuarioId: (state) => state.user.tipoUsuarioId || null,
    userPermissions: (state) => state.permissions
  },
  actions: {
    async login(credentials) {
      try {
        // Importar apiClient dinámicamente para evitar problemas de dependencias circulares
        const apiClient = (await import('@/services/api')).default;
        
        const response = await apiClient.post('/api/auth/login', credentials);
        
        if (response.data) {
          const { token, refreshToken, user } = response.data;
          
          // Guardar tokens y usuario
          this.setToken(token);
          this.setRefreshToken(refreshToken);
          this.setUser(user);
          
          // Devolver los datos incluyendo el tipo de usuario para que el componente pueda redirigir
          return {
            success: true,
            tipoUsuarioId: user.tipoUsuarioId,
            user: user
          };
        }
      } catch (error) {
        // Limpiar cualquier dato de sesión anterior
        this.resetAuth();
        throw error;
      }
    },
    
    logout() {
      this.resetAuth();
    },
    
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
      // Si el usuario trae permisos, se guardan; si no, se limpian.
      if (user.permisos) {
        this.permissions = user.permisos;
        localStorage.setItem('permissions', JSON.stringify(user.permisos));
      } else {
        this.permissions = [];
        localStorage.removeItem('permissions');
      }
    },
    removeUser() {
      this.user = {};
      localStorage.removeItem('user');
      this.permissions = [];
      localStorage.removeItem('permissions');
    },
    // Reset completo de autenticación
    resetAuth() {
      this.token = null;
      this.refreshToken = null;
      this.user = {};
      this.permissions = [];
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('permissions');
    }
  },
  // Se utiliza el plugin de persistencia para mantener el estado en localStorage
  persist: {
    enabled: true,
    strategies: [
      {
        key: 'auth',
        storage: localStorage,
        paths: ['token', 'refreshToken', 'user', 'permissions']
      }
    ]
  }
});
