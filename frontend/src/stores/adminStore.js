import { defineStore } from 'pinia'
import axios from 'axios'

export const useAdminStore = defineStore('admin', {
  state: () => ({
    adminList: [],
    isLoading: false,
    error: null,
    selectedAdmin: null,
  }),

  getters: {
    totalAdmins: (state) => state.adminList.length,
    getAdminById: (state) => (id) => state.adminList.find(admin => admin.id === id),
  },

  actions: {
    async fetchAdmins() {
      this.isLoading = true
      this.error = null
      try {
        const response = await axios.get('/api/admins') // Cambia a tu endpoint real
        this.adminList = response.data
      } catch (err) {
        this.error = err.message || 'Error cargando administradores'
      } finally {
        this.isLoading = false
      }
    },

    async addAdmin(adminData) {
      try {
        const response = await axios.post('/api/admins', adminData)
        this.adminList.push(response.data)
      } catch (err) {
        this.error = err.message || 'No se pudo agregar el administrador'
      }
    },

    async deleteAdmin(id) {
      try {
        await axios.delete(`/api/admins/${id}`)
        this.adminList = this.adminList.filter(admin => admin.id !== id)
      } catch (err) {
        this.error = err.message || 'No se pudo eliminar el administrador'
      }
    },

    selectAdmin(admin) {
      this.selectedAdmin = admin
    },

    clearSelectedAdmin() {
      this.selectedAdmin = null
    }
  }
})
