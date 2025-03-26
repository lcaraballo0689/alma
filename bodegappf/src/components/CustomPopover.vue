<template>
    <div class="notification-container">
      <button
        @click="togglePopover"
        class="notification-btn position-relative me-4"
        aria-label="Notificaciones"
      >
        <i class="bi bi-bell"></i>
        <span v-if="unreadCount" class="badge bg-danger notification-badge">
          {{ unreadCount }}
        </span>
      </button>
      <transition name="fade">
        <div v-if="showPopover" class="custom-popover">
          <slot>{{ popoverMessage }}</slot>
        </div>
      </transition>
    </div>
  </template>
  
  <script>
  export default {
    name: "CustomPopover",
    props: {
      showPopover: {
        type: Boolean,
        default: false,
      },
      popoverMessage: {
        type: String,
        default: "Sin Mensajes",
      },
    },
  };
  </script>
  
  <style scoped>
  .custom-popover {
    position: absolute;
    top: 110%;
    right: 0;
    width: 250px;
    background: #fff;
    border: 1px solid #ccc;
    padding: 0.75rem 1rem;
    border-radius: 4px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    z-index: 1000;
  }
  </style>
  