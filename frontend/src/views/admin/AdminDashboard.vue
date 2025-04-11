<template>
  <div>
    <!-- Navbar con sticky y sombra -->
    <nav
      class="navbar navbar-expand-lg fixed-top shadow-sm p-0"
      :class="themeStore.isDarkTheme ? 'navbar-dark bg-dark' : 'navbar-light bg-white'"
      style="min-height: 60px"
      aria-label="Barra de navegación principal"
    >
      <div class="container-fluid">
        <!-- Sección izquierda: Logo e identificación del cliente -->
        <div class="d-flex align-items-center">
          <a class="navbar-brand d-flex align-items-center me-3" href="#" aria-label="Inicio">
            <img
              :src="themeStore.isDarkTheme ? Logolight : Logo"
              alt="Siglo"
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
import { useThemeStore } from "@/stores/themeStore";
import { useNotificationStore } from "@/stores/notificationStore";


// Carga asíncrona de componentes
const movimientosreg = defineAsyncComponent(() =>
  import("./TransferenciasManager.vue")
);
const adminPanel = defineAsyncComponent(() =>
  import("./adminPanel.vue")
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
import Logolight from "@/assets/img/logolight.svg";
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
      Logolight,
      hacienda,
      tabs: [
        { name: "movimientosreg", label: "Solicitudes", icon: "bi bi-stack" },
        { name: "adminPanel", label: "Administrar Sistema", icon: "bi bi-gear-fill" },
        // { name: "usuarios", label: "Usuarios", icon: "bi bi-people-fill" },
        // { name: "traccker", label: "traccker", icon: "bi bi-pin-map" },
        // { name: "RealTimeRouteMap", label: "Ruta en tiempo real", icon: "bi bi-map" },
        // Puedes agregar más pestañas según lo necesites
      ],
    };
  },
  computed: {
    themeStore() {
      return useThemeStore();
    },
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
        // Si agregas más pestañas, asigna aquí el componente correspondiente.
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
      // Agregar la notificación al store; ajusta las propiedades según la estructura de 'data'
      this.notificationStore.addNotification({
        title: data.title || "Notificación",
        message: data.mensaje || data.message,
        estado: data.estado,
      });
    },
  },
  mounted() {
    // Establece la pestaña inicial
    this.tabStore.setTab("adminPanel");
    // Si usas socket, puedes suscribirte aquí:
    // socket.on("notify", this.handleSocketNotification);
  },
  beforeUnmount() {
    // Desuscribirse del socket si es necesario:
    // socket.off("notify", this.handleSocketNotification);
  },
};
</script>

<style scoped>
/* Ajuste del dropdown */
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

/* Transiciones suaves */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Variables de color para personalización */
:root {
  --primary-color: #cc1417;
  --active-border-color: #cc1417;
}

/* Estilo para el tema oscuro */
.dark-mode {
  background-color: #121212;
  color: #f0f0f0;
}
.dark-mode .navbar-dark.bg-dark {
  background-color: #2c2c2c !important;
}
.dark-mode .navbar-toggler-icon {
  filter: invert(1);
}
.dark-mode .nav-link-profile,
.dark-mode .nav-link,
.dark-mode .dropdown-item-text {
  color: #f0f0f0 !important;
}
.dark-mode .dropdown-menu-dark {
  background-color: #3a3a3a;
  color: #f0f0f0;
}

/* Botones de navegación con transición y foco */
.nav-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;
  font-size: 1rem;
}
.nav-btn:hover,
.nav-btn:focus {
  color: #b1b1b1;
}
.nav-btn.active {
  font-weight: bold;
  border-bottom: 2px solid var(--active-border-color);
  color: #cc1417 !important;
}

/* Enlaces de perfil con transición */
.nav-link-profile {
  transition: color 0.2s ease;
}
.nav-link-profile:hover,
.nav-link-profile:focus {
  color: var(--primary-color);
}

/* Remover subrayado en enlaces */
a {
  text-decoration: none;
}
.custom-mt {
  margin-top: 60px !important;
}
.navegacion {
  z-index: 10000;
}
/* Ajusta el estilo del navbar para que se mantenga coherente con el look and feel */
.navegacion {
  min-height: 60px;
  padding: 0 15px;
}

.navbar-brand img {
  /* Puedes ajustar el tamaño del logo según necesites */
  height: 40px;
}

.dropdown-menu {
  font-size: 14px;
}

/* Asegura que el contenido principal no quede oculto tras el navbar */
main {
  padding-top: 60px !important;
}
</style>
