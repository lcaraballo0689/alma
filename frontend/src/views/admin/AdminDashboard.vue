<template>
  <div>
    <!-- Navbar con sticky y sombra -->
    <nav
      class="navbar navbar-expand-lg fixed-top shadow-sm p-0 navbar-light bg-white"
      style="min-height: 60px"
      aria-label="Barra de navegación principal"
    >
      <div class="container-fluid">
        <!-- Sección izquierda: Logo e identificación del cliente -->
        <div class="d-flex align-items-center">
          <a class="navbar-brand d-flex align-items-center me-3" href="#" aria-label="Inicio">
            <img
              :src="Logo"
              alt="Logo"
              height="35"
              class="me-2"
            />
          </a>
          <div v-if="clienteNombre === 'HACIENDA'">
            <img :src="hacienda" alt="Hacienda" height="40" />
          </div>
        </div>

        <!-- Sección derecha: Notificaciones y perfil de usuario -->
        <div class="d-flex align-items-center">
          <NotificationsNavbar />
          <div class="d-none d-sm-flex align-items-center me-3">
            <i class="bi bi-person-circle me-1 fs-5"></i>
            <span class="fw-semibold">{{ user.nombre || "N/A" }}</span>
          </div>
        </div>
      </div>
    </nav>

    <!-- Contenido principal (ajustado para evitar que se oculte bajo el navbar) -->
    <main style="padding-top: 70px">
      <component :is="currentComponent" :key="currentTab" />
    </main>
  </div>
</template>

<script>
import breadcrumb from "../../components/breadcrumb.vue";
import { defineAsyncComponent } from "vue";
import { useAuthStore } from "@/stores/authStore";
import { useTabStore } from "@/stores/tabStore";
import { useNotificationStore } from "@/stores/notificationStore";
import { useRouter } from "vue-router";

// Carga asíncrona de componentes
const movimientosreg = defineAsyncComponent(() =>
  import("./TransferenciasManager.vue")
);
const adminPanel = defineAsyncComponent(() =>
  import("./AdminPanel.vue")
);
const usuarios = defineAsyncComponent(() =>
  import("./usuarios.vue")
);
const traccker = defineAsyncComponent(() =>
  import("./traccker.vue")
);
const RealTimeRouteMap = defineAsyncComponent(() =>
  import("./RealTimeRouteMap.vue")
);

// Si necesitas incluir más componentes, agrégalos aquí
const fallbackComponent = {
  template: `
    <div class="text-center py-4">
      <h5>Componente no disponible</h5>
      <p>La pestaña seleccionada no existe.</p>
    </div>
  `,
};

import Logo from "@/assets/img/siglo.png";
import hacienda from "@/assets/img/hacienda.png";
import NotificationsNavbar from "@/components/NotificationsNavbar.vue";

export default {
  name: "ClientHome",
  components: {
    breadcrumb,
    NotificationsNavbar,
    adminPanel,
    usuarios,
    traccker,
    RealTimeRouteMap
  },
  data() {
    return {
      Logo,
      hacienda,
      tabs: [
        { name: "movimientosreg", label: "Solicitudes", icon: "bi bi-stack" },
        { name: "adminPanel", label: "Administrar Sistema", icon: "bi bi-gear-fill" },
      ],
    };
  },
  computed: {
    authStore() {
      return useAuthStore();
    },
    tabStore() {
      return useTabStore();
    },
    notificationStore() {
      return useNotificationStore();
    },
    clienteNombre() {
      return this.authStore.clienteNombre;
    },
    user() {
      return this.authStore.user || {};
    },
    currentTab() {
      return this.tabStore.globalCurrentTab;
    },
    currentComponent() {
      const componentMap = {
        movimientosreg,
        adminPanel,
        usuarios,
        traccker,
        RealTimeRouteMap,
      };
      return componentMap[this.currentTab] || fallbackComponent;
    },
  },
  methods: {
    setTab(tabName) {
      this.tabStore.setTab(tabName);
    },
    logout() {
      this.authStore.resetAuth();
      localStorage.clear();
      this.$router.replace({ name: "Login" });
    },
    handleSocketNotification(data) {
      this.notificationStore.addNotification({
        title: data.title || "Notificación",
        message: data.mensaje || data.message,
        estado: data.estado,
      });
    },
  },
  mounted() {
    this.tabStore.setTab("adminPanel");
  },
};
</script>

<style scoped>
.dropdown-menu {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
</style>
