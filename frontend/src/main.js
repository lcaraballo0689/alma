import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { useAuthStore } from '@/stores/authStore';
import VueGridLayout from 'vue-grid-layout-v3';
import i18n from './i18n';
import 'particles.js';

// Importa vue-sweetalert2 y su estilo
import VueSweetalert2 from 'vue-sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

// Importa vue-toast-notification y su estilo (puedes elegir el tema que prefieras)
import VueToast from 'vue-toast-notification';
import 'vue-toast-notification/dist/theme-default.css'; // También puedes usar 'theme-sugar.css', etc.

import 'leaflet/dist/leaflet.css'; // importante para que el mapa se vea
import './plugins/leaflet-config'; // 👈 esta es la línea clave

// Importa Bootstrap y Bootstrap Icons
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'boxicons/css/boxicons.min.css';

import './style.css';
import './assets/main.css';

const app = createApp(App);
app.use(VueSweetalert2);
app.use(VueGridLayout);
// Configurar Toast (opciones: posición y duración)
app.use(VueToast, {
  position: 'bottom-right',
  duration: 5000,
  dismissible: true,
  pauseOnHover: true,
  maxToasts: 10,
  rtl: false,
});

const pinia = createPinia();
app.use(pinia);
app.use(router);
app.use(i18n);

app.mount('#app');

// Limpiar token y resetear el store antes de recargar la página
window.addEventListener('beforeunload', () => {
  localStorage.removeItem('token');
  const authStore = useAuthStore();
  authStore.$reset();
});
