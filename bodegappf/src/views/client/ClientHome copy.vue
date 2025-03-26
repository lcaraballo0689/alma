<template>
  <div :class="{ 'dark-mode': themeStore.isDarkTheme }">
    <!-- Navbar con transición y sticky -->
    <div>
      <nav
        class="navbar navbar-expand-lg shadow fixed-top p-0 m-0 navegacion"
        :class="
          themeStore.isDarkTheme
            ? 'navbar-dark bg-dark'
            : 'navbar-light bg-white'
        "
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
              :src="themeStore.isDarkTheme ? LogoLight : Logo"
              alt="BODEGAPP"
              height="35"
              class="me-2"
            />
          </a>
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
                v-for="tabItem in filteredTabs"
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

              <!-- Dropdown para "Informes" -->
              <li class="nav-item dropdown">
                <button
                  class="nav-link nav-btn dropdown-toggle"
                  id="informesDropdown"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <i class="bi bi-file-earmark-bar-graph-fill me-1"></i>
                  <span class="d-none d-sm-inline">Informes</span>
                </button>
                <ul class="dropdown-menu" aria-labelledby="informesDropdown">
                  <li v-for="tabItem in informesTabs" :key="tabItem.name">
                    <a
                      class="dropdown-item"
                      href="#"
                      :class="{ active: currentTab === tabItem.name }"
                      @click.prevent="setTab(tabItem.name)"
                    >
                      <i :class="tabItem.icon + ' me-2'"></i>
                      {{ tabItem.label }}
                    </a>
                  </li>
                </ul>
              </li>
            </ul>

            <!-- Sección de usuario con dropdown -->
            <div class="d-flex align-items-center">
              <div class="me-3 pe-none d-none d-sm-flex align-items-center">
                <i class="bi bi-person-circle me-1 fs-5"></i>
                <span class="fw-semibold">{{ user.nombre || "N/A" }}</span>
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
                  :class="isDarkTheme ? 'dropdown-menu-dark' : ''"
                  aria-labelledby="userDropdown"
                >
                  <li>
                    <span class="dropdown-item-text">
                      <i class="bi bi-envelope-at me-2"></i>
                      {{ user.email || "N/A" }}
                    </span>
                  </li>
                  <li>
                    <hr class="dropdown-divider" />
                  </li>
                  <li>
                    <a class="dropdown-item" href="#" @click.prevent="logout"
                      >Cerrar sesión</a
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
        <component :is="currentComponent" :key="currentTab" />
      </div>
    </main>
  </div>
</template>

<script>
import { defineAsyncComponent } from "vue";
import { useAuthStore } from "@/stores/authStore";
import { useTabStore } from "@/stores/tabStore";
import { useThemeStore } from "@/stores/themeStore";

// Carga asíncrona de componentes
const dashClient = defineAsyncComponent(() => import("./dashClient.vue"));
const Inventario = defineAsyncComponent(() => import("./inventario.vue"));
const prestamos = defineAsyncComponent(() => import("./prestamos.vue"));
const devoluciones = defineAsyncComponent(() => import("./devoluciones.vue"));
const transferencias = defineAsyncComponent(() =>
  import("./transferencias.vue")
);

const MassUpload = defineAsyncComponent(() => import("./MassUpload.vue"));
const devoluciones = defineAsyncComponent(() => import("./devoluciones.vue"));
const confirmarRecepcion = defineAsyncComponent(() =>
  import("./confirmarRecepcion.vue")
);
const transferencias = defineAsyncComponent(() =>
  import("./transferencias.vue")
);
const desarchive = defineAsyncComponent(() => import("./desarchive.vue"));

// Componente fallback en caso de que no se encuentre la pestaña
const fallbackComponent = {
  template: `
    <div class="text-center py-4">
      <h5>Componente no disponible</h5>
      <p>La pestaña seleccionada no existe.</p>
    </div>
  `,
};

// Importar asset del logo
import Logo from "@/assets/img/logo.svg";
import Logolight from "@/assets/img/logolight.svg";

export default {
  name: "ClientHome",
  data() {
    return {
      Logo,
      Logolight,
      tabs: [
        { name: "Dashboard", label: "Dashboard", icon: "bi bi-grid-1x2-fill" },
        {
          name: "Inventario",
          label: "Inventario",
          icon: "bi bi-box-seam-fill",
        },
        {
          name: "Transferencias",
          label: "Transferencias",
          icon: "bi bi-truck-front-fill",
        },
        {
          name: "Transferencias",
          label: "Transferencias",
          icon: "bi bi-truck-front-fill",
        },
        {
          name: "desarchivo",
          label: "desarchivo",
          icon: "bi bi-archive-fill",
        },
        {
          name: "confirmarRecepcion",
          label: "Confirmar Recepción",
          icon: "bi bi-archive-fill",
        },
      ],
      informesTabs: [
        {
          name: "Prestamos",
          label: "Préstamos",
          icon: "bi bi-hand-index-thumb-fill",
        },
        {
          name: "Devoluciones",
          label: "Devoluciones",
          icon: "bi bi-arrow-return-left",
        },
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
        Dashboard: dashClient,
        Inventario: Inventario,
        Prestamos: prestamos,
        Devoluciones: devoluciones,
        Transferencias: transferencias,
        desarchivo: desarchive,
        confirmarRecepcion: confirmarRecepcion,
      };
      return componentMap[this.currentTab] || null;
    },
    filteredTabs() {
      return this.tabs.filter(
        (tab) => tab.name !== "Prestamos" && tab.name !== "Devoluciones"
      );
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
  --primary-color: #df8c0d;
  --active-border-color: #eaa052;
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
  color: #e08c3d !important;
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
  margin-top: 80px;
}
.navegacion {
  z-index: 10000;
}
</style>
