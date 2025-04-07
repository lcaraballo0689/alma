<template>
    <div class="notification-chat-container">
      <div
        v-for="notif in notificationStore.allNotifications"
        :key="notif.id"
        class="notification-bubble"
        :class="notif.estado !== 'leído' ? 'unread' : 'read'"
      >
        <div class="notification-icon">
          <i
            class="bi bi-check-all"
            :class="notif.estado !== 'leído' ? 'text-muted' : 'text-success'"
          ></i>
        </div>
        <div class="notification-message">
          {{ notif.message }}
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { useNotificationStore } from "@/stores/notificationStore";
  
  export default {
    name: "NotificationBubbles",
    computed: {
      notificationStore() {
        return useNotificationStore();
      }
    }
  };
  </script>
  
  <style scoped>
  .notification-chat-container {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 10px;
  }
  
  /* Burbujas de notificaciones */
  .notification-bubble {
    display: flex;
    align-items: center;
    max-width: 70%;
    padding: 10px 15px;
    border-radius: 15px;
    background-color: #f1f0f0;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    word-wrap: break-word;
    transition: background-color 0.3s ease;
  }
  
  /* Notificaciones no leídas: burbuja alineada a la izquierda */
  .notification-bubble.unread {
    align-self: flex-start;
    background-color: #fff;
  }
  
  /* Notificaciones leídas: burbuja alineada a la derecha */
  .notification-bubble.read {
    align-self: flex-end;
    background-color: #e0ffe0;
  }
  
  /* Icono dentro de la burbuja */
  .notification-icon {
    margin-right: 8px;
    font-size: 1.2rem;
  }
  
  /* Mensaje */
  .notification-message {
    font-size: 0.9rem;
  }
  
  /* Opcional: Animación de entrada para cada burbuja */
  @keyframes bubbleIn {
    0% {
      transform: scale(0.95);
      opacity: 0;
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }
  
  .notification-bubble {
    animation: bubbleIn 0.3s ease-out;
  }
  </style>
  