<template>
    <footer class="footer" v-if="$route.name !== 'Login'">
      <div class="container-fluid text-end">
        <small>&copy; {{ new Date().getFullYear() }} BODEGAPP - Todos los derechos reservados</small>
      </div>
    </footer>
  </template>
  
  <script>
  export default {
    name: "FooterComponent",
  };
  </script>
  
  <style scoped>
  .footer {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    background-color: #2b2b2b;
    color: #bebebe;
    padding: 8px 0;
    font-size: 14px;
    text-align: center;
    box-shadow: 0 -2px 5px rgba(0, 0, 0, 0.05);
    transition: background 0.3s ease-in-out;
  }
  
  /* Modo oscuro */
  .dark-mode .footer {
    background-color: #222;
    color: #bbb;
  }
  </style>
  