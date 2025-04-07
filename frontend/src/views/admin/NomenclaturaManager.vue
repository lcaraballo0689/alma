<template>
  <div class="dashboard-layout">
    <!-- Sidebar -->
    <aside :class="['sidebar', { close: isCollapsed }]">
      <!-- Encabezado (puedes agregar logo o información si lo deseas) -->

      <!-- Menú principal -->
      <div class="menu-bar">
        <ul class="menu-links">
          <li v-for="(item, index) in menu" :key="index">
            <!-- Ítem simple sin submenús -->
            <div v-if="!item.children">
              <a :href="item.link" :class="{ active: activeItem === item.name }" @click="setActive(item.name)">
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
                <i class="bx bx-chevron-down arrow" v-if="!isCollapsed" :class="{ open: item.open }"></i>
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
      <h2>{{ activeItem }}</h2>
      <clientes v-if="activeItem === 'Clientes'" />
      <TransferenciaManager v-else-if="activeItem === 'Transferencias'" />
      <Dashboard v-else-if="activeItem === 'Dashboard'" />
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
import usuarios from "./Usuarios.vue";
import bodegas from "./Bodegas.vue";
import Traccker from "./Traccker.vue";
import RealTimeRouteMap from "./RealTimeRouteMap.vue";
import TransferenciaManager from "./TransferenciasManager.vue";
import Dashboard from "./Dashboard.vue";
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
    Dashboard
  },
  data() {
    return {
      isCollapsed: false,
      activeItem: "Dashboard",
      menu: [
        { name: "Dashboard", icon: "bx bxs-dashboard", link: "#" },
        { name: "Transferencias", icon: "bx bxs-directions", link: "#" },
        {
          name: "Administrar Clientes",
          icon: "bi bi-building-fill",
          children: [
            { name: "Clientes", link: "#" },
            { name: "Direcciones", link: "#" },
            { name: "Horas Laborables", link: "#" }
          ],
          open: false
        },
        {
          name: "Administrar Usuarios",
          icon: "bx bx-group",
          children: [
            { name: "Usuarios", link: "#" },
            { name: "Roles y Permisos", link: "#" }
          ],
          open: false
        },
        {
          name: "Administrar Bodegas",
          icon: "bx bx-building-house",
          children: [
            { name: "Bodegas", link: "#" },
            { name: "Ubicaciones", link: "#" }
          ],
          open: false
        },
        {
          name: "Administrar Flotas",
          icon: "bx bxs-truck",
          children: [
            { name: "Flotas", link: "#" },
            { name: "Agregar Flota", link: "#" },
            { name: "Ubicar Flotas", link: "#" },
            { name: "Ver Flotas en Ruta", link: "#" }
          ],
          open: false
        }
      ]
    };
  },
  computed: {
    authStore() {
      return useAuthStore();
    }
  },
  methods: {
    toggleSidebar() {
      this.isCollapsed = !this.isCollapsed;
    },
    toggleDropdown(index) {
      // Primero cerrar todos los dropdowns
      this.menu.forEach((item, idx) => {
        if (item.children && idx !== index) {
          item.open = false;
        }
      });
      // Luego toggle el que se hizo clic
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
    }
  }
};
</script>

<style scoped>
@import url('https://cdn.jsdelivr.net/npm/boxicons@2.1.4/css/boxicons.min.css');

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
  background: #11101d;
  transition: width 0.3s ease;
  overflow: hidden;
}
.sidebar.close {
  width: 80px;
}

/* Menú */
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
  margin: 10px 0;
}
.menu-links a,
.menu-link {
  display: flex;
  align-items: center;
  color: #fff;
  text-decoration: none;
  padding: 10px 20px;
  transition: background 0.3s;
  cursor: pointer;
}
.menu-links a:hover,
.menu-link:hover {
  background: #1d1b31;
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
  color: #fff;
  text-decoration: none;
  transition: background 0.3s;
}
.sub-menu li a:hover {
  background: #1d1b31;
  border-radius: 4px;
}

/* Footer del sidebar: cerrar sesión en esquina inferior izquierda */
.sidebar-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 0px;
  border-top: 1px solid rgba(255, 255, 255, 0.171);
  background-color: #010102;
}
.logout {
  display: flex;
  align-items: center;
  color: #fff;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.3s;
  padding: 10px 0px;
  margin-bottom: 110px;
  margin-left: 55px;
}
.logout:hover {
  color: #c7c7c7;
}

/* Contenido principal */
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
