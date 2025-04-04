<template>
  <div class="notification-container">
    <button
      @click="toggleDropdown"
      class="notification-btn position-relative me-4"
      aria-label="Notificaciones"
    >
      <!-- Se aplica la clase 'animate-shake' si animateIcon es true -->
      <i :class="['bi', 'bi-bell', { 'animate-shake': animateIcon }]"></i>
      <span v-if="unreadCount" class="badge bg-danger notification-badge">
        {{ unreadCount }}
      </span>
    </button>
    <transition name="fade">
      <div @mouseenter="hover = true" 
      @mouseleave="hover = false">

      <div v-if="showDropdown || hover"  
     class="notification-dropdown shadow">
        <div class="dropdown-header">
          <h6 class="mb-0"><i class="bi bi-bell me-2"></i> Notificaciones</h6>
        </div>
        <ul
          v-if="unreadNotifications.length"
          class="list-group list-group-flush"
        >
          <li
            v-for="notif in unreadNotifications"
            :key="notif.id"
            class="list-group-item notification-item"
            :class="{ read: notif.read }"
            @click="handleClick(notif)"
          >
            <div class="notification-content">
              <div class="fw-bold">{{ notif.title || "Notificación" }}</div>
              <small class="text-muted">{{ notif.message }}</small>
            </div>
            <button
              class="btn btn-sm btn-link text-danger p-0"
              @click.stop="markNotificationAsRead(notif.id)"
              aria-label="Eliminar notificación"
            >
              <i class="bi bi-x-circle"></i>
            </button>
          </li>
        </ul>
        <div v-else class="p-3 text-center text-muted">
          No hay notificaciones.
        </div>
      </div>
      </div  >
    </transition>
  </div>
</template>

<script>
import Swal from "sweetalert2";
import apiClient from "@/services/api";
import socket from "@/socket";
import { useNotificationStore } from "@/stores/notificationStore";
import notificationSound from "@/assets/sounds/newMsg.mp3"; // Asegúrate de tener este archivo

export default {
  name: "NotificationsNavbar",
  data() {
    return {
      hover: false,
      showDropdown: false,
      animateIcon: false,
      notificationStore: useNotificationStore(),
    };
  },
  computed: {
    notifications() {
      return this.notificationStore.notifications;
    },
    unreadCount() {
      return this.notificationStore.unreadCount;
    },
    unreadNotifications() {
      return this.notificationStore.unreadNotifications;
    },
  },
  methods: {
    handleMouseOver() {
      this.showDropdown = !this.showDropdown;
    },
    toggleDropdown() {
      this.showDropdown = !this.showDropdown;
    },
    async markNotificationAsRead(id) {
      try {
        // Llama al endpoint para marcar la notificación como leída en la BBDD.
        await apiClient.patch(`/api/notificaciones/markRead/${id}`, {
          estado: "leído",
        });
        // Luego elimina la notificación del store para actualizar la UI.
        this.notificationStore.removeNotification(id);
      } catch (error) {
        console.error("Error al marcar la notificación como leída:", error);
      }
    },
    handleClick(notif) {
      // Al hacer clic, se marca la notificación como leída (actualiza la BBDD y elimina del store)
      this.markNotificationAsRead(notif.id);
      // Aquí podrías agregar redirección u otra acción adicional
    },
    playNotificationSound() {
      const audio = new Audio(notificationSound);
      audio.play();
    },
    triggerIconAnimation() {
      this.animateIcon = true;
      setTimeout(() => {
        this.animateIcon = false;
      }, 10000); // La animación se activa por 10 segundos
    },
    handleNewNotification(data) {
      // Agregar la notificación al store.
      this.notificationStore.addNotification({
        id: data.mensajeId,
        title: data.title || "Notificación",
        message: data.mensaje || data.message,
        estado: data.estado,
        createdAt: data.fechaActualizacion || new Date().toISOString(),
        read: false,
      });
      // Reproduce el sonido de notificación
      this.playNotificationSound();
      // Activa la animación del ícono
      this.triggerIconAnimation();
      Swal.fire({
        toast: true,
        position: "bottom-end",
        // Definimos nuestro icono personalizado con iconHtml
        title: data.title || "Nueva notificación",
        text: data.mensaje || data.message,
        timer: 15000,
        timerProgressBar: true,
        showConfirmButton: false,
      });
    },
  },
  mounted() {
    // Suscribirse al evento "notify" para recibir notificaciones en tiempo real.
    socket.on("notify", this.handleNewNotification);
  },
  beforeUnmount() {
    socket.off("notify", this.handleNewNotification);
  },
};
</script>

<style scoped>
.notification-container {
  position: relative;
  display: inline-block;
}

.notification-btn {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: black;
}

.notification-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  font-size: 0.75rem;
  padding: 0.3em 0.4em;
}

.notification-dropdown {
  position: absolute;
  right: 0;
  top: 110%;
  width: 320px;
  max-height: 400px;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  overflow-y: auto;
  z-index: 1000;
}

.dropdown-header {
  background: linear-gradient(130deg, #265991, #0d3655);
  color: #fff;
  padding: 10px 15px;
  border-top-left-radius: 6px;
  border-top-right-radius: 6px;
}

.list-group-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.list-group-item:hover {
  background-color: #f5f5f5;
}

.notification-item.read {
  background-color: #f9f9f9;
  color: #777;
}

.notification-content {
  flex: 1;
  margin-right: 10px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Animación de shake para el ícono */
@keyframes shake {
  0% {
    transform: translate(1px, 1px) rotate(0deg);
  }
  10% {
    transform: translate(-1px, -2px) rotate(-1deg);
  }
  20% {
    transform: translate(-3px, 0px) rotate(1deg);
  }
  30% {
    transform: translate(3px, 2px) rotate(0deg);
  }
  40% {
    transform: translate(1px, -1px) rotate(1deg);
  }
  50% {
    transform: translate(-1px, 2px) rotate(-1deg);
  }
  60% {
    transform: translate(-3px, 1px) rotate(0deg);
  }
  70% {
    transform: translate(3px, 1px) rotate(-1deg);
  }
  80% {
    transform: translate(-1px, -1px) rotate(1deg);
  }
  90% {
    transform: translate(1px, 2px) rotate(0deg);
  }
  100% {
    transform: translate(1px, -2px) rotate(-1deg);
  }
}

.animate-shake {
  animation: shake 0.5s;
  animation-iteration-count: 20; /* 0.5s * 20 = 10s */
}
</style>
