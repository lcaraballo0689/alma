<template>
  <div class="dashboard-layout">
    <!-- Sidebar -->
    <aside :class="['sidebar', { close: isCollapsed }]">
      <!-- Menú principal -->
      <div class="menu-bar">
        <ul class="menu-links">
          <li v-for="(item, index) in menu" :key="index">
            <!-- Ítem simple sin submenús -->
            <div v-if="!item.children">
              <a
                :href="item.link"
                :class="{ active: activeItem === item.name }"
                @click="setActive(item.name)"
              >
                <i :class="item.icon"></i>
                <span class="nav-text" v-if="!isCollapsed">{{ item.name }}</span>
              </a>
            </div>
            <!-- Ítem con submenús -->
            <div v-else class="dropdown">
              <div class="menu-link" @click="toggleDropdown(index)">
                <div class="d-flex align-items-center">
                  <i :class="item.icon"></i>
                  <span class="nav-text" v-if="!isCollapsed">{{ item.name }}</span>
                </div>
                <i
                  class="bx bx-chevron-down arrow"
                  v-if="!isCollapsed"
                  :class="{ open: item.open }"
                ></i>
              </div>
              <ul class="sub-menu" v-show="item.open && !isCollapsed">
                <li
                  v-for="(child, idx) in item.children"
                  :key="idx"
                  :class="{ active: activeItem === child.name }"
                  @click.stop="setActive(child.name)"
                >
                  <a :href="child.link">{{ child.name }}</a>
                </li>
              </ul>
            </div>
          </li>
        </ul>
      </div>
      <!-- Footer (Cerrar sesión en esquina inferior izquierda) -->
      <div class="sidebar-footer">
        <a href="#" class="logout" @click="logout">
          <i class="bx bx-log-out"></i>
          <span class="nav-text" v-if="!isCollapsed">Cerrar sesión</span>
        </a>
      </div>
    </aside>

    <!-- Área de contenido principal -->
    <main class="main-content">
      <!-- Encabezado con ícono dinámico y título -->
      <h2>
        <i :class="activeIcon + ' me-2'"></i> {{ activeItem }}
      </h2>
      <!-- Contenido según la opción activa -->
      <clientes v-if="activeItem === 'Clientes'" />
      <TransferenciaManager v-else-if="activeItem === 'Transferencias'" />
      <Dashboard v-else-if="activeItem === 'Dashboard'" />
      <Direcciones v-else-if="activeItem === 'Direcciones'" />
      <HorasLaborales v-else-if="activeItem === 'Horas Laborables'" />
      <bodegas v-else-if="activeItem === 'Bodegas'" />
      <usuarios v-else-if="activeItem === 'Usuarios'" />

      <div v-else-if="activeItem === 'Administrar Usuarios'">
        <usuarios />
      </div>
      <div v-else-if="activeItem === 'Administrar Bodegas'">
        <bodegas />
      </div>
      <div v-else-if="activeItem === 'Ubicar Flotas'">
        <Traccker />
      </div>
      <div v-else-if="activeItem === 'Ver Flotas en Ruta'">
        <RealTimeRouteMap />
      </div>
    </main>
  </div>
</template>

<script>
import clientes from "./Clientes.vue";
import Direcciones from "./Direcciones.vue";
import usuarios from "./Usuarios.vue";
import bodegas from "./Bodegas.vue";
import Traccker from "./Traccker.vue";
import RealTimeRouteMap from "./RealTimeRouteMap.vue";
import TransferenciaManager from "./TransferenciasManager.vue";
import Dashboard from "./Dashboard.vue";
import HorasLaborales from "./HorasLaborales.vue";

import { useAuthStore } from "@/stores/authStore";

export default {
  name: "DashboardSidebar",
  components: {
    clientes,
    usuarios,
    bodegas,
    Traccker,
    RealTimeRouteMap,
    TransferenciaManager,
    Dashboard,
    Direcciones,
    HorasLaborales,
  },
  data() {
    return {
      isCollapsed: false,
      activeItem: "Dashboard",
      // Menú con submenús (algunos íconos se asignan tanto en el nivel principal como a los hijos)
      menu: [
        { name: "Dashboard", icon: "bx bxs-dashboard", link: "#" },
        { name: "Transferencias", icon: "bx bxs-directions", link: "#" },
        {
          name: "Administrar Clientes",
          icon: "bi bi-building-fill",
          children: [
            { name: "Clientes", icon: "bi bi-people", link: "#" },
            { name: "Direcciones", icon: "bx bx-map", link: "#" },
            { name: "Horas Laborables", icon: "bx bx-time", link: "#" },
          ],
          open: false,
        },
        {
          name: "Administrar Usuarios",
          icon: "bx bx-group",
          children: [
            { name: "Usuarios", icon: "bx bx-user", link: "#" },
            { name: "Roles y Permisos", icon: "bx bx-key", link: "#" },
          ],
          open: false,
        },
        {
          name: "Administrar Bodegas",
          icon: "bx bx-building-house",
          children: [
            { name: "Bodegas", icon: "bx bx-buildings", link: "#" },
            { name: "Ubicaciones", icon: "bx bx-map", link: "#" },
          ],
          open: false,
        },
        {
          name: "Administrar Flotas",
          icon: "bx bxs-truck",
          children: [
            { name: "Flotas", icon: "bx bx-truck", link: "#" },
            { name: "Agregar Flota", icon: "bx bx-plus", link: "#" },
            { name: "Ubicar Flotas", icon: "bx bx-map-pin", link: "#" },
            { name: "Ver Flotas en Ruta", icon: "bx bx-route", link: "#" },
          ],
          open: false,
        },
      ],
    };
  },
  computed: {
    authStore() {
      return useAuthStore();
    },
    activeIcon() {
      // Buscar en el menú el ícono correspondiente al activeItem.
      for (const item of this.menu) {
        if (item.name === this.activeItem) {
          return item.icon;
        }
        if (item.children) {
          for (const child of item.children) {
            if (child.name === this.activeItem) {
              return child.icon;
            }
          }
        }
      }
      return ""; // Valor por defecto si no se encuentra
    },
  },
  methods: {
    toggleSidebar() {
      this.isCollapsed = !this.isCollapsed;
    },
    toggleDropdown(index) {
      // Cierra todos los dropdowns excepto el que se hizo clic.
      this.menu.forEach((item, idx) => {
        if (item.children && idx !== index) {
          item.open = false;
        }
      });
      if (this.menu[index].children) {
        this.menu[index].open = !this.menu[index].open;
      }
    },
    setActive(name) {
      this.activeItem = name;
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
/* Layout general */
.dashboard-layout {
  display: flex;
  height: calc(100vh - 70px);
  position: relative;
}

/* Sidebar */
.sidebar {
  position: fixed;
  width: 250px;
  height: 100%;
  background: #303030; /* Color claro para el sidebar */
  transition: width 0.3s ease;
  overflow: hidden;
  border-right: 1px solid #dee2e6;
  box-shadow: 25px 0 15px -10px rgba(0, 0, 0, 0.3);
}
.sidebar.close {
  width: 80px;
}

/* Menú del sidebar */
.menu-bar {
  height: calc(100% - 80px);
  overflow-y: auto;
  padding: 20px 0;
}
.menu-links {
  list-style: none;
  padding: 0;
  margin: 0;
}
.menu-links li {
  margin: 5px 0;
}
.menu-links a,
.menu-link {
  display: flex;
  align-items: center;
  color: #a3a3a3;
  text-decoration: none;
  padding: 10px 10px;
  transition: background 0.3s;
  cursor: pointer;
}
.menu-links a:hover,
.menu-link:hover {
  background: #353535;
  border-radius: 4px;
}
.nav-text {
  font-size: 16px;
  font-weight: 500;
  margin-left: 10px;
}

/* Dropdown */
.dropdown .arrow {
  margin-left: auto;
  transition: transform 0.3s;
}
.dropdown .arrow.open {
  transform: rotate(180deg);
}
.sub-menu {
  list-style: none;
  padding-left: 40px;
  margin-top: 5px;
}
.sub-menu li a {
  padding: 8px 0;
  font-size: 14px;
  color: #a3a3a3;
  text-decoration: none;
  transition: background 0.3s;
}
.sub-menu li a:hover {
  background: #353535;
  border-radius: 4px;
}

/* Footer del sidebar */
.sidebar-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 0;
  border-top: 1px solid #52515171;
  background-color: #353535;
}
.logout {
  display: flex;
  align-items: center;
  color: #b9b9b9;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.3s;
  padding: 10px 0;
  justify-content: center;
  margin-bottom: 98px;
}
.logout:hover {
  background: #684141;
}

/* Área de contenido principal */
.main-content {
  margin-left: 250px;
  padding: 20px;
  width: calc(100% - 250px);
  transition: margin-left 0.3s, width 0.3s;
}
.sidebar.close ~ .main-content {
  margin-left: 80px;
  width: calc(100% - 80px);
}
</style>
