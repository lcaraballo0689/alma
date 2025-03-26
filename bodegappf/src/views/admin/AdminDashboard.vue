<template>
  <div :class="{ 'dark-mode': themeStore.isDarkTheme }">
    <!-- Navbar con transición y sticky -->
    <div>
      <nav
        class="navbar navbar-expand-lg shadow fixed-top p-0 m-0 navegacion"
        :class="themeStore.isDarkTheme ? 'navbar-dark bg-dark' : 'navbar-light bg-white'"
        style="min-height: 60px"
        aria-label="Barra de navegación principal"
      >
        <div class="container-fluid">
          <!-- Logo e Identificación del cliente -->
          <a
            class="navbar-brand d-flex align-items-center"
            href="#"
            aria-label="Inicio"
          >
            <img
              :src="themeStore.isDarkTheme ? Logolight : Logo"
              alt="Siglo"
              height="35"
              class="me-2"
            />
          </a>
          <img v-if="clienteNombre === 'HACIENDA'"
              :src="themeStore.isDarkTheme ? hacienda : hacienda"
              alt="hacienda"
              height="40"
              class="me-2"
            />
            
          <strong
            v-if="clienteNombre"
            class="ms-2 pe-none d-none d-sm-inline-block text-uppercase"
            aria-label="Nombre del cliente"
          >
            <i class="bi bi-building me-1"></i>{{ clienteNombre }}
          </strong>

          <!-- Botón toggler para móviles -->
          <button
            class="navbar-toggler border-0"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarContent"
            aria-controls="navbarContent"
            aria-expanded="false"
            aria-label="Alternar navegación"
          >
            <span class="navbar-toggler-icon"></span>
          </button>

          <!-- Contenido colapsable -->
          <div class="collapse navbar-collapse" id="navbarContent">
            <!-- Pestañas de navegación con roles y transiciones -->
            <ul class="navbar-nav mx-auto my-2 my-lg-0" role="tablist">
              <li
                class="nav-item"
                v-for="tabItem in tabs"
                :key="tabItem.name"
                role="presentation"
              >
                <button
                  class="nav-link nav-btn"
                  :class="{ active: currentTab === tabItem.name }"
                  @click.prevent="setTab(tabItem.name)"
                  role="tab"
                  :aria-selected="currentTab === tabItem.name"
                >
                  <i :class="tabItem.icon + ' me-1'"></i>
                  <span class="d-none d-sm-inline">{{ tabItem.label }}</span>
                </button>
              </li>
            </ul>

            <!-- Sección de usuario con dropdown -->
            <div class="d-flex align-items-center">
              <NotificationsNavbar />
              <div class="me-3 pe-none d-none d-sm-flex align-items-center me-4">
                <i class="bi bi-person-circle me-1 fs-5"></i>
                <span class="fw-semibold"></span>
              </div>
              <div class="nav-item dropdown">
                <a
                  class="nav-link dropdown-toggle nav-link-profile"
                  href="#"
                  id="userDropdown"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  Perfil
                </a>
                <ul
                  class="dropdown-menu dropdown-menu-end"
                  style="min-width: 300px;"
                  :class="themeStore.isDarkTheme ? 'dropdown-menu-dark' : ''"
                  aria-labelledby="userDropdown"
                >
                  <li>
                    <span class="dropdown-item-text" style="width: fit-content">
                      <i class="bi bi-person-circle me-1 fs-5"></i>
                      {{ user.nombre || "N/A" }}
                    </span>
                  </li>
                  <li>
                    <span class="dropdown-item-text">
                      <i class="bi bi-envelope me-1 fs-5"></i>
                      {{ user.email || "N/A" }}
                    </span>
                  </li>
                  <li>
                    <hr class="dropdown-divider" />
                  </li>
                  <li>
                    <a class="dropdown-item" href="#" @click.prevent="logout"
                      ><i class="bi bi-power me-2"></i>Cerrar sesión</a
                    >
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </div>

    <!-- Contenido de la pestaña actual -->
    <main>
      <div class="custom-mt" style="height: calc(100vh - 90px)">
        <!-- <breadcrumb :path="breadcrumbPath" /> -->
        <component :is="currentComponent" :key="currentTab" />
      </div>
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
  import("../admin/TransferenciasManager.vue")
);
const NomenclaturaManager = defineAsyncComponent(() =>
  import("../admin/NomenclaturaManager.vue")
);

const fallbackComponent = {
  template: `
    <div class="text-center py-4">
      <h5>Componente no disponible</h5>
      <p>La pestaña seleccionada no existe.</p>
    </div>
  `,
};

// Importar assets del logo
import Logo from "@/assets/img/siglo.png";
import hacienda from "@/assets/img/hacienda.png";
import Logolight from "@/assets/img/logolight.svg";
import NotificationsNavbar from "@/components/NotificationsNavbar.vue";

export default {
  name: "ClientHome",
  components: {
    breadcrumb,
    NotificationsNavbar,
    // Se registra el componente si se utiliza directamente en el template.
    NomenclaturaManager,
  },
  data() {
    return {
      Logo,
      Logolight,
      hacienda,
      tabs: [
        { name: "movimientosreg", label: "Solicitudes", icon: "bi bi-stack" },
        { name: "NomenclaturaManager", label: "Configuraciones", icon: "bi bi-gear-fill" },
      ],
      tabs2: [],
      movimientosTabs: [],
      informesTabs: [],
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
        movimientosreg: movimientosreg,
        NomenclaturaManager: NomenclaturaManager,
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
    // Establecemos la pestaña inicial usando el store.
    this.tabStore.setTab("movimientosreg");
    // socket.on("notify", this.handleSocketNotification);
  },
  beforeUnmount() {
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
</style>
