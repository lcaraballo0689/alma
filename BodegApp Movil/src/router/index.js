// src/router/index.js
import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router';

// Importa tus componentes de vista (los crearás en el paso siguiente)
// Es buena práctica sufijarlos con 'View' o 'Page'
import LoginView from '../views/LoginView.vue';
import AdminDashboardView from '../views/AdminDashboardView.vue';
import ClientHomeView from '../views/ClientHomeView.vue';
import NotFoundView from '../views/NotFoundView.vue'; // Para rutas no encontradas
import ResetPasswordView from '@/views/ResetPasswordView.vue';

const routes = [
  {
    path: '/login',
    name: 'Login', // Nombre de la ruta (útil para navegación programática)
    component: LoginView,
    // Opcional: Añadir meta información, por ej. si la ruta es pública
    meta: { requiresAuth: false }
  },
  {
    path: '/admin/dashboard', // Ruta para el dashboard de admin
    name: 'AdminDashboard',
    component: AdminDashboardView,
    meta: { requiresAuth: true } // Esta ruta requerirá autenticación
  },
  {
    path: '/cliente/inicio', // Ruta para la home del cliente
    name: 'ClientHome',
    component: ClientHomeView,
    meta: { requiresAuth: true } // Esta ruta también requerirá autenticación
  },
  {
    path: '/reset-password',
    name: 'ResetPassword',
    component: ResetPasswordView
  },
  // Redirección inicial: ¿A dónde ir cuando se entra a '/'?
  // Podrías redirigir a Login o verificar si ya está logueado (esto se hace con Guardias de Navegación)
  {
    path: '/',
    redirect: '/login' // Por ahora, redirigimos a login
  },
  // Ruta Catch-all para 404 Not Found (siempre al final)
  {
    path: '/:pathMatch(.*)*', // Expresión regular que captura cualquier cosa
    name: 'NotFound',
    component: NotFoundView,
  }
];

const router = createRouter({
  // History Mode:
  // 1. createWebHistory(): URLs limpias (ej: /login). Requiere configuración del servidor
  //    para que funcione correctamente al recargar la página en rutas anidadas.
  // 2. createWebHashHistory(): URLs con hash (ej: /#/login). Funciona sin configuración
  //    del servidor, a menudo más simple para PWAs desplegadas estáticamente.
  history: createWebHistory(import.meta.env.BASE_URL), // O usa createWebHashHistory()
  routes, // Array de rutas definido arriba
});

export default router;