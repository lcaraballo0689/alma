<template>
  <div class="client-home-container" role="application" aria-label="Panel de Control">
    <div 
      class="background-image"
      :style="{ backgroundImage: `url(${backgroundImage})` }"
    ></div>
    <div class="background-overlay"></div>
    
    <!-- Navbar moderno con efecto glassmorphism -->
    <TopNavbar 
      :logo="Logo"
      :cliente-nombre="clienteNombre"
      :current-tab="currentTab"
      :user="user"
      :tabs1="tabs1"
      :tabs2="tabs2"
      :movimientos-tabs="movimientosTabs"
      :informes-tabs="informesTabs"
      @set-tab="setTab"
      @show-password-modal="showPasswordModal = true"
      @logout="logout"
      class="mt-2"
    />

    <!-- Contenido principal -->
    <main class="main-content" role="main">
      <div class="content-container">
        
        <div class="content-body">
          <component 
            :is="currentComponent" 
            :key="currentTab"
            v-slot="{ Component }"
          >
            <transition 
              name="fade" 
              mode="out-in"
              @before-leave="beforeLeave"
              @enter="enter"
              @after-enter="afterEnter"
            >
              <component :is="Component" />
            </transition>
          </component>
        </div>
      </div>
    </main>

    <!-- Modal cambiar contraseña -->
    <PasswordChangeModal 
      :visible="showPasswordModal"
      @close="showPasswordModal = false"
    />
  </div>
</template>

<script>
import breadcrumb from "../../components/breadcrumb.vue";
import TopNavbar from "@/components/TopNavbar.vue";
import PasswordChangeModal from "@/components/PasswordChangeModal.vue";
import { defineAsyncComponent } from "vue";
import { useAuthStore } from "@/stores/authStore";
import { useTabStore } from "@/stores/tabStore";
import { useNotificationStore } from "@/stores/notificationStore";
import apiClient from "@/services/api";
import Swal from "sweetalert2";
import { useRouter } from "vue-router";


// Carga asíncrona de componentes
const dashClient = defineAsyncComponent(() => import("./dashClient.vue"));
const movimientosreg = defineAsyncComponent(() => import("../admin/TransferenciasManager.vue"));
const Inventario = defineAsyncComponent(() => import("./inventario.vue"));
const prestamos = defineAsyncComponent(() => import("./prestamos.vue"));
const devoluciones = defineAsyncComponent(() => import("./devoluciones.vue"));
const Transferencia = defineAsyncComponent(() => import("./transferencias.vue"));
const devolucion = defineAsyncComponent(() => import("./mdevolucion.vue"));
const prestamo = defineAsyncComponent(() => import("./mprestamo.vue"));
const MassUpload = defineAsyncComponent(() => import("./MassUpload.vue"));
const solicitarTransferencia = defineAsyncComponent(() => import("./solicitarTransferencia.vue"));
const confirmarRecepcion = defineAsyncComponent(() =>
  import("./confirmarRecepcion.vue")
);
const Desarchives = defineAsyncComponent(() => import("./desarchive.vue"));
const Desarchive = defineAsyncComponent(() => import("./solicitudDesarchive.vue"));

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
import Logolight from "@/assets/img/logolight.svg";
import NotificationsNavbar from "@/components/NotificationsNavbar.vue";

export default {
  name: "ClientHome",
  components: {
    breadcrumb,
    TopNavbar,
    solicitarTransferencia,
    PasswordChangeModal
  },
  data() {
    return {
      Logo,
      Logolight,
      backgroundImage: '/images/backgrounds/milad-fakurian-tGTa40GKSRI-unsplash.jpg',
      tabs1: [
        { name: "Dashboard", label: "Dashboard", icon: "bi bi-grid-1x2" },
        { name: "Inventario", label: "Inventario", icon: "bi bi-boxes" },

      ],
      tabs2: [{
          name: "confirmarRecepcion",
          label: "Confirmar Entrega",
          icon: "bi bi-building-fill-check",
        },
        ],
      movimientosTabs: [
        {
          name: "Transferencia",
          label: "Transferencias",
          icon: "",
        },
        {
          name: "prestamo",
          label: "Prestamos",
          icon: "",
        },
        {
          name: "devolucion",
          label: "Devoluciones",
          icon: "",
        },
        {
          name: "Desarchives",
          label: "Desarchives",
          icon: "",
        }
      ],
      informesTabs: [
        
         { name: "Desarchive",
          label: "Desarchive",
          icon: "bi bi-building-fill-check",
        },
        {
          name: "solicitarTransferencia",
          label: "Transferencia",
          icon: "bi bi-building-fill-check",
        }, 
      
      ],
      showPasswordModal: false,
      dropdownOpen: {
        reportes: false,
        solicitudes: false,
        user: false
      },
      mobileMenuOpen: false,
      isTransitioning: false,
      lastScrollPosition: 0
    };
  },
  computed: {
    breadcrumbPath() {
      if (this.currentTab === "Transferencia") {
        return [{ menu: "Reportes", submenu: this.currentTab + 's' }];
      } else if (this.currentTab === "prestamo") {
        return [{ menu: "Reportes", submenu: this.currentTab + 's' }];
      } else if (this.currentTab === "devolucion") {
        return [{ menu: "Reportes", submenu: this.currentTab + 'es' }];
      } else if (this.currentTab === "Desincorporacion") {
        return [{ menu: "Reportes", submenu: this.currentTab }];
      } else if (this.currentTab === "Desarchives") {
        return [{ menu: "Reportes", submenu: this.currentTab }];
      } else if (this.currentTab === "confirmarRecepcion") {
        return [{ menu: "Confirmar Entrega"}];
      } else {
        return [{ menu: this.currentTab, submenu: "" }];
      }
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
        Dashboard: dashClient,
        Inventario: Inventario,
        Prestamo: prestamos,
        Devolucion: devoluciones,
        Transferencia: Transferencia,
        Desarchives: Desarchives,
        confirmarRecepcion: confirmarRecepcion,
        MassUpload: MassUpload,
        movimientosreg: movimientosreg,
        devolucion: devolucion,
        prestamo: prestamo,
        solicitarTransferencia: solicitarTransferencia,
        Desarchive: Desarchive

      };
      return componentMap[this.currentTab] || fallbackComponent;
    },
  },
  methods: {
    handleDropdownLeave(dropdownName, event) {
      // Verificar si el cursor está sobre el menú o el botón
      const dropdown = event.currentTarget;
      const relatedTarget = event.relatedTarget;
      
      // Si el elemento relacionado está dentro del dropdown, no lo cerramos
      if (dropdown.contains(relatedTarget)) {
        return;
      }
      
      // Si el cursor salió completamente del dropdown, lo cerramos
      this.dropdownOpen[dropdownName] = false;
    },
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
    beforeLeave(el) {
      this.lastScrollPosition = window.scrollY;
      this.isTransitioning = true;
    },
    enter(el) {
      el.style.transform = 'translateY(20px)';
      el.style.opacity = '0';
    },
    afterEnter(el) {
      this.isTransitioning = false;
      window.scrollTo(0, this.lastScrollPosition);
    },
    modalEnter(el) {
      el.style.opacity = '0';
      el.style.transform = 'scale(0.9)';
    },
    modalLeave(el) {
      el.style.opacity = '0';
      el.style.transform = 'scale(0.9)';
    }
  },
  watch: {
    currentTab() {
      // Scroll suave al cambiar de pestaña
      if (!this.isTransitioning) {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }
    }
  },
  mounted() {
    //socket.on("notify", this.handleSocketNotification);
  },
  beforeUnmount() {
    //socket.off("notify", this.handleNewNotification);
  }
};
</script>

<style scoped>
/* Variables globales */
:root {
  --primary-color: #4CAF50;
  --primary-hover: #45a049;
  --primary-light: rgba(76, 175, 80, 0.1);
  --secondary-color: #6c757d;
  --background: #f8f9fa;
  --surface: #ffffff;
  --text-primary: #1a1a1a;
  --text-secondary: #6c757d;
  --border-color: #e9ecef;
  --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 15px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 30px rgba(0, 0, 0, 0.15);
  --navbar-height: 60px;
  --transition: all 0.3s ease;
}

/* Container principal */
.client-home-container {
  min-height: 100vh;
  width: 100%;
  position: relative;
  overflow: hidden;
}

.background-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  transition: opacity 0.5s ease;
  z-index: 1;
}

.background-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(109, 108, 108, 0.041);
  z-index: 2;
}

/* Asegurar que el contenido esté por encima del fondo */
.main-content {
  position: relative;
  z-index: 3;
}

/* Main content */
.main-content {
  margin-top: calc(var(--navbar-height) + 80px);
  min-height: calc(100vh - var(--navbar-height) - 80px);
  padding-top: 100px;
  background: transparent;
  position: relative;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

.content-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.content-header {
  background: rgba(255, 255, 255, 0.171);
  backdrop-filter: blur(10px);
  padding: 0.75rem 2rem;
  border-bottom: none;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: calc(var(--navbar-height) + 10px);
  z-index: 100;
  border-radius: 1rem;
  margin: 0 10px 12px 10px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.content-body {
  flex: 1;
  padding: 0.5rem;
  overflow-y: auto;
  animation: contentFade 0.6s ease;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

/* Contenedor para componentes hijos con diseño de tarjeta */
.content-body > * {
  background: rgba(255, 255, 255, 0.116);
  backdrop-filter: blur(10px);
  border-radius: 1rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  height: 100%;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

@keyframes contentFade {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Transiciones para contenido */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

/* Responsive */
@media (max-width: 768px) {
  .main-content {
    margin-top: calc(var(--navbar-height) + 15px);
    padding: 0;
  }

  .content-header {
    margin: 0 5px 10px 5px;
    padding: 0.75rem 1rem;
    border-radius: 0.75rem;
  }

  .content-body {
    padding: 0.25rem;
  }

  .content-body > * {
    padding: 1rem;
    border-radius: 0.75rem;
  }
}

/* Animaciones adicionales */
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

/* Mejoras de accesibilidad */
*:focus {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

button:focus,
a:focus {
  outline-offset: 4px;
}

/* Scrollbar personalizada */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--background);
}

::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--text-secondary);
}

/* Mejoras en las transiciones */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

/* Mejoras en el modo oscuro */
@media (prefers-color-scheme: dark) {
  .content-header,
  .content-body > * {
    background: rgba(255, 255, 255, 0.95);
    color: #1a1a1a;
  }
}

/* Mejoras en el contraste */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
</style>
