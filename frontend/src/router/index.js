import { createRouter, createWebHistory } from 'vue-router';
import Login from '@/views/Login.vue';
import AdminDashboard from '@/views/admin/AdminDashboard.vue';
import ClientHome from '@/views/client/ClientHome.vue';
import mobileApp from '@/views/admin/CaptureMedia.vue';
import { useAuthStore } from '@/stores/authStore';
import PWA from '../views/admin/CaptureMedia.vue';

const routes = [
  { path: '/login', name: 'Login', component: Login },
  { path: '/Admin', name: 'AdminDashboard', component: AdminDashboard, meta: { requiresAuth: true } },
  { path: '/User', name: 'ClientHome', component: ClientHome, meta: { requiresAuth: true } },
  { path: '/mobileApp', name: 'mobileApp', component: mobileApp, meta: { requiresAuth: false } },
  { path: '/', redirect: '/login' }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  if (to.meta.requiresAuth && !authStore.token) {
    next({ name: 'Login' });
  } else {
    next();
  }
});

export default router;
