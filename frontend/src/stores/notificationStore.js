import { defineStore } from 'pinia';
import { v4 as uuidv4 } from 'uuid';

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    notifications: []
  }),
  getters: {
    // Cuenta las notificaciones cuyo estado no sea "leído"
    unreadCount: (state) => state.notifications.filter(n => n.estado !== 'leído').length,
    // Devuelve la lista de notificaciones no leídas
    unreadNotifications: (state) => state.notifications.filter(n => n.estado !== 'leído'),
    // Devuelve todas las notificaciones (opcional)
    allNotifications: (state) => state.notifications
  },
  actions: {
    addNotification(notification) {
      console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>: ", notification);
      
      // Agrega una notificación al store; se genera un ID único con uuidv4
      // Se espera que el objeto "notification" incluya la propiedad "estado"
      this.notifications.push({
        id: notification.id,
        ...notification
      });
    },
    setNotifications(notifs) {
      // Establece el array de notificaciones (por ejemplo, al recuperar del backend)
      this.notifications = notifs;
    },
    // Actualiza el estado de la notificación a "leído"
    markAsRead(id) {
      const notif = this.notifications.find(n => n.id === id);
      if (notif) {
        notif.estado = 'leído';
      }
    },
    removeNotification(id) {
      // Elimina la notificación del array filtrando por ID
      this.notifications = this.notifications.filter(n => n.id !== id);
    },
    clearNotifications() {
      // Limpia todas las notificaciones del store
      this.notifications = [];
    }
  }
});
