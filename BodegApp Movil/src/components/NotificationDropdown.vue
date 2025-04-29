<template>
  <div class="m-0 p-0">
    <button
      ref="buttonRef"
      
      class="notification-btn position-relative"
      aria-label="Notificaciones" style="height: 64px; width: 56px;"
    >
      <i @click="toggleDropdown"  :class="['bx', 'bxs-bell', { 'animate-shake': animateIcon }]" style="font-size: 25px; margin-top: 5px; margin-left: 20px; color: #FFAB00 ;"></i>
      <span v-if="unreadCount" class="badge bg-danger notification-badge">
        {{ unreadCount }}
      </span>

      {{}}
    </button>

    <teleport to="body">
      <transition name="fade">
        <div
          v-if="showDropdown"
          class="notification-dropdown"
          @mouseenter="hover = true"
          @mouseleave="hover = false"
        >
          <div class="dropdown-header d-flex align-items-center justify-content-between">
            <h6><i class="bx bx-bell me-2"></i>Notificaciones</h6>
            <button @click="clearNotifications" class="btn btn-link"><i class="bx bx-trash" style="color: #F4511E; margin-right: 14px;"></i></button>
          </div>
          <ul v-if="unreadNotifications.length" class="list-group list-group-flush">
            <li
              v-for="n in unreadNotifications"
              :key="n.id"
              class="list-group-item d-flex justify-content-between align-center"
              :class="{ read: n.read }"
              @click="handleClick(n)"
            >
              <div>
                <strong>{{ n.title }}</strong>
                <div>
                  <small class="text-muted">{{ n.message }}</small>
                </div>
              </div>
              <button
                class="btn btn-sm btn-link text-danger p-0"
                @click.stop="markAsRead(n.id)"
                aria-label="Eliminar"
              >
                <i class="bx bx-x-circle"></i>
              </button>
            </li>
          </ul>
          <div v-else class="p-3 text-center text-muted">
            No hay notificaciones
          </div>
        </div>
      </transition>
    </teleport>
  </div>
</template>

<script>
import apiClient from '@/services/api'
import socket from '@/socket'
import { useNotificationStore } from '@/stores/notificationStore'
import notificationSound from '@/assets/sounds/newMsg.mp3'

export default {
  name: 'NotificationDropdown',
  props: {
    show: {
      type: Boolean,
      default: false
    }
  },

  data() {
    return {
      showDropdown: this.show,
      hover: false,
      animateIcon: false,
      dropdownStyle: {}
    }
  },
  computed: {
    notificationStore() {
      return useNotificationStore()
    },
    unreadCount() {
      return this.notificationStore.unreadCount
    },
    unreadNotifications() {
      return this.notificationStore.unreadNotifications
    }
  },
  methods: {
    clearNotifications() {
      this.notificationStore.clearAll()
    },
    markNotificationAsRead(id) {
      this.notificationStore.markAsRead(id)
    },
    handleMouseOver() {
      this.showDropdown = true
    },
    handleMouseLeave() {
      if (!this.hover) {
        this.showDropdown = false
      }
    },
    handleClick(notification) {
      this.markNotificationAsRead(notification.id)
      // Aquí puedes agregar más acciones al hacer clic en la notificación
    },
    async markAsRead(id) {
      await apiClient.patch(`/api/notificaciones/markRead/${id}`, { estado: 'leído' })
      this.notificationStore.removeNotification(id)
    },
    handleClick(notif) {
      this.markAsRead(notif.id)
      // ... acciones extra
    },
    clearNotifications() {
      this.notificationStore.clearAll()
    },
    playSound() {
      new Audio(notificationSound).play()
    },
    triggerShake() {
      this.animateIcon = true
      setTimeout(() => (this.animateIcon = false), 10000)
    },
    onNotify(data) {
      this.notificationStore.addNotification({
        id: data.mensajeId,
        title: data.title || 'Notificación',
        message: data.mensaje || data.message,
        read: false,
        createdAt: data.fechaActualizacion
      })
      this.playSound()
      this.triggerShake()
    },

    updatePosition() {
      const btn = this.$refs.buttonRef
      if (!btn) return
      const rect = btn.getBoundingClientRect()
      this.dropdownStyle = {
        position: 'absolute',
        top: `${rect.bottom + window.scrollY}px`,
        left: `${rect.left + window.scrollX}px`,
        zIndex: '999999',
        minWidth: `${rect.width}px`
      }
    },
    toggleDropdown() {
      this.showDropdown = !this.showDropdown
      if (this.showDropdown) {
        this.$nextTick(this.updatePosition)
      }
    },
    async markAsRead(id) {
      await apiClient.patch(`/api/notificaciones/markRead/${id}`, { estado: 'leído' })
      this.notificationStore.removeNotification(id)
    },
    handleClick(notif) {
      this.markAsRead(notif.id)
      // ... acciones extra
    },
    clearNotifications() {
      // ajusta según la implementación de tu store
      this.notificationStore.clearAll()
    },
    playSound() {
      new Audio(notificationSound).play()
    },
    triggerShake() {
      this.animateIcon = true
      setTimeout(() => (this.animateIcon = false), 10000)
    },
    onNotify(data) {
      this.notificationStore.addNotification({
        id: data.mensajeId,
        title: data.title || 'Notificación',
        message: data.mensaje || data.message,
        read: false,
        createdAt: data.fechaActualizacion
      })
      this.playSound()
      this.triggerShake()
    },
    onWindowResize() {
      if (this.showDropdown) this.updatePosition()
    }
  },
  mounted() {
    socket.on('notify', this.onNotify)
    window.addEventListener('resize', this.onWindowResize)
    window.addEventListener('scroll', this.onWindowResize)
  },
  beforeUnmount() {
    socket.off('notify', this.onNotify)
    window.removeEventListener('resize', this.onWindowResize)
    window.removeEventListener('scroll', this.onWindowResize)
  }
}
</script>

<style scoped>
.notification-dropdown {
  position: fixed; /* Cambiado a fixed para ocupar toda la pantalla */
  top: 56px; /* Ajusta según la altura del menú superior */
  left: 0;
  right: 0;
  bottom: 0;
  background: #fff;
  border-top: 1px solid #ddd;
  z-index: 1000; /* Asegúrate de que esté encima de otros elementos */
  overflow-y: auto;
  box-shadow: none; /* Elimina sombras si no son necesarias */
}

.dropdown-header {
  background: linear-gradient(130deg, #2d82c4, #0d3655); /* Cambiado para eliminar el color de fondo anterior */
  color: #fff;
  padding: 10px;
  border-bottom: 1px solid #ddd;
  font-size: 1.25rem;
  font-weight: bold;
  display: flex;
  align-items: center;  /* Fixed alignment */
  justify-content: space-between;
  transition: background-color 0.3s ease;
  cursor: pointer;
  user-select: none; /* Prevents text selection on hover */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); /* Optional shadow for header */
  z-index: 1001; /* Ensure header is above the list items */
  height: 40px;

}

.list-group-item {
  padding: 16px;
  border-bottom: 1px solid #ddd;
}

.list-group-item:hover {
  background-color: #f5f5f5;
}
</style>