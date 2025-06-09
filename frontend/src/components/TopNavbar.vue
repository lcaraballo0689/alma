<template>
  <nav class="navbar-modern" role="navigation" aria-label="Navegación principal">
    <div class="navbar-inner">
      <!-- Logo y branding -->
      <div class="navbar-brand-section">
        <a class="brand-link" href="#" aria-label="Inicio" @click.prevent="$emit('setTab', 'Dashboard')">
          <img :src="logo" alt="BODEGAPP" class="brand-logo" width="40" height="40" loading="eager" />
        </a>
        <div v-if="clienteNombre" class="client-info" role="status" aria-label="Cliente actual">
          <i class="bi bi-building-fill" aria-hidden="true"></i>
          <span>{{ clienteNombre }}</span>
        </div>
      </div>

      <!-- Botón toggler para móviles -->
      <button 
        class="mobile-toggle" 
        type="button" 
        @click="toggleMobileMenu"
        :aria-expanded="mobileMenuOpen"
        aria-label="Alternar menú de navegación"
        aria-controls="navbar-content"
      >
        <span class="toggle-line" aria-hidden="true"></span>
        <span class="toggle-line" aria-hidden="true"></span>
        <span class="toggle-line" aria-hidden="true"></span>
      </button>

      <!-- Contenido de navegación -->
      <div 
        id="navbar-content"
        class="navbar-content" 
        :class="{ 'mobile-open': mobileMenuOpen }"
        role="menubar"
      >
        <!-- Pestañas de navegación principales -->
        <div class="nav-tabs-container" role="menubar">
          <button 
            v-for="tabItem in tabs1" 
            :key="tabItem.name"
            class="nav-tab"
            :class="{ active: currentTab === tabItem.name }"
            @click="$emit('setTab', tabItem.name)"
            role="menuitem"
            :aria-current="currentTab === tabItem.name ? 'page' : undefined"
            :aria-label="`Ir a ${tabItem.label}`"
          >
            <i :class="tabItem.icon" aria-hidden="true"></i>
            <span>{{ tabItem.label }}</span>
          </button>

          <!-- Dropdown Reportes -->
          <div 
            class="nav-dropdown" 
            @mouseover="dropdownOpen.reportes = true"
            @mouseout="handleDropdownLeave('reportes', $event)"
            role="menuitem"
            aria-haspopup="true"
            :aria-expanded="dropdownOpen.reportes"
          >
            <button 
              class="nav-tab dropdown-trigger"
              :aria-label="`Menú de ${dropdownOpen.reportes ? 'cerrar' : 'abrir'} reportes`"
            >
              <i class="bi bi-arrow-left-right" aria-hidden="true"></i>
              <span>Reportes</span>
              <i 
                class="bi bi-chevron-down dropdown-arrow" 
                :class="{ 'rotate': dropdownOpen.reportes }"
                aria-hidden="true"
              ></i>
            </button>
            <div 
              class="dropdown-menu-wrapper" 
              v-show="dropdownOpen.reportes"
              role="menu"
              aria-label="Submenú de reportes"
            >
              <div class="dropdown-menu-modern">
                <a 
                  v-for="tabItem in movimientosTabs" 
                  :key="tabItem.name"
                  class="dropdown-item-modern"
                  :class="{ active: currentTab === tabItem.name }"
                  @click="$emit('setTab', tabItem.name)"
                  role="menuitem"
                  :aria-current="currentTab === tabItem.name ? 'page' : undefined"
                >
                  <i :class="tabItem.icon || 'bi bi-circle'" aria-hidden="true"></i>
                  {{ tabItem.label }}
                </a>
              </div>
            </div>
          </div>

          <!-- Dropdown Solicitudes -->
          <div class="nav-dropdown"
               @mouseover="dropdownOpen.solicitudes = true"
               @mouseout="handleDropdownLeave('solicitudes', $event)">
            <button class="nav-tab dropdown-trigger">
              <i class="bi bi-file-earmark-text"></i>
              <span>Solicitudes</span>
              <i class="bi bi-chevron-down dropdown-arrow"
                 :class="{ 'rotate': dropdownOpen.solicitudes }"></i>
            </button>
            <div class="dropdown-menu-wrapper" v-if="dropdownOpen.solicitudes">
              <div class="dropdown-menu-modern">
                <a 
                  v-for="tabItem in informesTabs" 
                  :key="tabItem.name"
                  class="dropdown-item-modern"
                  :class="{ active: currentTab === tabItem.name }"
                  @click="$emit('setTab', tabItem.name)"
                >
                  <i :class="tabItem.icon"></i>
                  {{ tabItem.label }}
                </a>
              </div>
            </div>
          </div>

          <button 
            v-for="tabItem in tabs2" 
            :key="tabItem.name"
            class="nav-tab"
            :class="{ active: currentTab === tabItem.name }"
            @click="$emit('setTab', tabItem.name)"
            role="tab"
          >
            <i :class="tabItem.icon"></i>
            <span>{{ tabItem.label }}</span>
          </button>
        </div>

        <!-- Sección de usuario -->
        <div class="user-section">
          <NotificationsNavbar />
          
          <div class="user-dropdown"
               @mouseover="dropdownOpen.user = true"
               @mouseout="handleDropdownLeave('user', $event)">
            <button class="user-button">
              <i class="bi bi-person-circle"></i>
              <span>{{ user.nombre || 'Perfil' }}</span>
              <i class="bi bi-chevron-down"
                 :class="{ 'rotate': dropdownOpen.user }"></i>
            </button>
            
            <div class="dropdown-menu-wrapper" v-if="dropdownOpen.user">
              <div class="dropdown-menu-modern user-menu">
                <div class="user-info-header">
                  <i class="bi bi-person-circle"></i>
                  <div>
                    <div class="user-name">{{ user.nombre || "N/A" }}</div>
                    <div class="user-email">{{ user.email || "N/A" }}</div>
                  </div>
                </div>
                <div class="dropdown-divider"></div>
                <a class="dropdown-item-modern" @click="$emit('showPasswordModal')">
                  <i class="bi bi-key"></i>
                  Cambiar Contraseña
                </a>
                <a class="dropdown-item-modern logout" @click="$emit('logout')">
                  <i class="bi bi-power"></i>
                  Cerrar sesión
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<script>
import NotificationsNavbar from "@/components/NotificationsNavbar.vue";

export default {
  name: "TopNavbar",
  components: {
    NotificationsNavbar
  },
  props: {
    logo: {
      type: String,
      required: true
    },
    clienteNombre: {
      type: String,
      default: ""
    },
    currentTab: {
      type: String,
      required: true
    },
    user: {
      type: Object,
      required: true
    },
    tabs1: {
      type: Array,
      required: true
    },
    tabs2: {
      type: Array,
      required: true
    },
    movimientosTabs: {
      type: Array,
      required: true
    },
    informesTabs: {
      type: Array,
      required: true
    }
  },
  data() {
    return {
      mobileMenuOpen: false,
      dropdownOpen: {
        reportes: false,
        solicitudes: false,
        user: false
      }
    };
  },
  methods: {
    toggleMobileMenu() {
      this.mobileMenuOpen = !this.mobileMenuOpen;
    },
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
    }
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

/* Navbar moderno */
.navbar-modern {
  position: fixed;
  top: 8px;
  left: 10px;
  right: 10px;
  height: var(--navbar-height);
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  z-index: 10000;
  transition: var(--transition);
  will-change: transform;
  contain: layout style;
  border-radius: 1rem;
  margin: 0 auto;
  max-width: calc(100vw - 20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.navbar-inner {
  height: 100%;
  padding: 0 3%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: none;
  background: transparent;
}

/* Brand section */
.navbar-brand-section {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.brand-link {
  display: flex;
  align-items: center;
  text-decoration: none;
  transition: transform 0.3s ease;
}

.brand-link:hover {
  transform: translateY(-2px);
}

.brand-logo {
  height: 40px;
  width: auto;
}

.client-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--primary-light);
  border-radius: 0.75rem;
  color: var(--primary-color);
  font-weight: 600;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.client-info i {
  font-size: 1.1rem;
}

/* Mobile toggle */
.mobile-toggle {
  display: none;
  flex-direction: column;
  gap: 4px;
  padding: 0.5rem;
  background: none;
  border: none;
  cursor: pointer;
}

.toggle-line {
  width: 24px;
  height: 2px;
  background: var(--text-primary);
  transition: var(--transition);
}

.mobile-toggle:hover .toggle-line {
  background: var(--primary-color);
}

/* Navbar content */
.navbar-content {
  display: flex;
  align-items: center;
  gap: 2rem;
  flex: 1;
  justify-content: space-between;
  margin-left: 2rem;
}

/* Nav tabs container */
.nav-tabs-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Nav tab buttons */
.nav-tab {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.2rem;
  background: none;
  border: none;
  border-radius: 0.75rem;
  color: var(--text-primary);
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
  position: relative;
  white-space: nowrap;
}

.nav-tab:hover {
  color: var(--primary-color);
  background: var(--primary-light);
}

.nav-tab.active {
  color: var(--primary-color);
  background: var(--primary-light);
  font-weight: 600;
}

.nav-tab.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 50%;
  transform: translateX(-50%);
  width: 30px;
  height: 3px;
  background: var(--primary-color);
  border-radius: 3px 3px 0 0;
}

.nav-tab i {
  font-size: 1.1rem;
}

/* Dropdowns */
.nav-dropdown {
  position: relative;
  display: inline-block;
}

.dropdown-trigger {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  position: relative;
  z-index: 1002;
}

.dropdown-menu-wrapper {
  position: absolute;
  top: 100%;
  right: 0;
  padding-top: 5px; /* Reducido el espacio para evitar gap */
  z-index: 1001;
}

.dropdown-menu-modern {
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
  border-radius: 0.75rem;
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border-color);
  padding: 0.5rem;
  min-width: 220px;
  max-height: calc(100vh - 100px);
  overflow-y: auto;
  margin-top: -5px; /* Compensar el padding-top */
}

@keyframes dropdownFade {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dropdown-item-modern {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  color: var(--text-primary);
  text-decoration: none;
  font-size: 0.95rem;
  font-weight: 500;
  transition: var(--transition);
  cursor: pointer;
  white-space: nowrap;
}

.dropdown-item-modern:hover {
  background: var(--primary-light);
  color: var(--primary-color);
}

.dropdown-item-modern.active {
  background: var(--primary-light);
  color: var(--primary-color);
  font-weight: 600;
}

/* Rotación de flechas en dropdowns */
.dropdown-arrow {
  transition: transform 0.3s ease;
}

.dropdown-arrow.rotate {
  transform: rotate(180deg);
}

/* User section */
.user-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-dropdown {
  position: relative;
}

.user-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  background: var(--background);
  border: 2px solid transparent;
  border-radius: 0.75rem;
  color: var(--text-primary);
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
}

.user-button:hover {
  border-color: var(--primary-color);
  background: var(--primary-light);
}

.user-button i {
  font-size: 1.2rem;
}

.user-menu {
  right: 0;
  min-width: 280px;
}

.user-info-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
  background: var(--primary-light);
}

.user-info-header i {
  font-size: 2.5rem;
  color: var(--primary-color);
}

.user-name {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 1rem;
}

.user-email {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.dropdown-divider {
  height: 1px;
  background: var(--border-color);
  margin: 0.5rem 0;
}

.dropdown-item-modern.logout {
  color: #dc3545;
}

.dropdown-item-modern.logout:hover {
  background: #fee;
  color: #dc3545;
}

/* Responsive */
@media (max-width: 768px) {
  .navbar-inner {
    padding: 0 1rem;
  }

  .navbar-modern {
    top: 5px;
    left: 5px;
    right: 5px;
    max-width: calc(100vw - 10px);
    border-radius: 0.75rem;
  }

  .mobile-toggle {
    display: flex;
  }

  .navbar-content {
    position: fixed;
    top: var(--navbar-height);
    left: 5px;
    right: 5px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    box-shadow: var(--shadow-lg);
    flex-direction: column;
    padding: 1rem;
    transform: translateY(-100%);
    transition: transform 0.3s ease;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
    border-radius: 0 0 0.75rem 0.75rem;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-top: none;
  }

  .navbar-content.mobile-open {
    transform: translateY(0);
  }

  .nav-tabs-container {
    flex-direction: column;
    width: 100%;
    gap: 0.5rem;
  }

  .nav-tab {
    width: 100%;
    justify-content: flex-start;
  }

  .dropdown-menu-modern {
    position: static;
    width: 100%;
    box-shadow: none;
    border: none;
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: none;
  }

  .user-section {
    width: 100%;
    flex-direction: column;
    gap: 1rem;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--border-color);
  }

  .user-button {
    width: 100%;
    justify-content: center;
  }

  .client-info {
    display: none;
  }
}
</style> 