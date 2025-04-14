<template>
  <div class="dashboard-layout">
    <!-- Sidebar -->
    <aside :class="['sidebar', { close: isCollapsed }]">
      <!-- Menú principal -->
      <div class="menu-bar">
        <ul class="menu-links">
          <li v-for="(item, index) in filteredMenu" :key="index">
            <!-- Ítem simple sin submenús -->
            <div v-if="!item.children">
              <a :href="item.link"
                 :class="{ active: activeItem === item.name }"
                 @click="setActive(item.name)">
                <i :class="item.icon"></i>
                <span class="nav-text" v-if="!isCollapsed">{{ item.name }}</span>
              </a>
            </div>
            <!-- Ítem con submenús -->
            <div v-else class="dropdown">
              <div class="menu-link"
                   @click="toggleDropdown(index)"
                   :class="{ active: isActiveParent(item) }">
                <div class="d-flex align-items-center">
                  <i :class="item.icon"></i>
                  <span class="nav-text" v-if="!isCollapsed">{{ item.name }}</span>
                </div>
                <i class="bx bx-chevron-down arrow"
                   v-if="!isCollapsed"
                   :class="{ open: item.open }"></i>
              </div>
              <ul class="sub-menu" v-show="item.open && !isCollapsed">
                <li v-for="(child, idx) in item.children"
                    :key="idx"
                    :class="{ active: activeItem === child.name }"
                    @click.stop="setActive(child.name)">
                  <a :href="child.link">{{ child.name }}</a>
                </li>
              </ul>
            </div>
          </li>
        </ul>
      </div>
      <!-- Footer: Cerrar sesión -->
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
      <clientes v-if="activeItem === 'Clientes'" :permissions="userPermissions" />
      <TransferenciaManager v-else-if="activeItem === 'Transferencias'" :permissions="userPermissions" />
      <Dashboard v-else-if="activeItem === 'Dashboard'" :permissions="userPermissions" />
      <Direcciones v-else-if="activeItem === 'Direcciones'" :permissions="userPermissions" />
      <HorasLaborales v-else-if="activeItem === 'Horas Laborables'" :permissions="userPermissions" />
      <bodegas v-else-if="activeItem === 'Bodegas'" :permissions="userPermissions" />
      <usuarios v-else-if="activeItem === 'Usuarios'" :permissions="userPermissions" />
      <PermissionsManagement v-else-if="activeItem === 'Administrar Permisos'" :permissions="userPermissions" />
      <RolesManagement v-else-if="activeItem === 'Administrar Roles'" :permissions="userPermissions" />
      <RolePermissionsAssignment v-else-if="activeItem === 'Asignar Permisos a Roles'" :permissions="userPermissions" />
      <Traccker v-else-if="activeItem === 'Flotas'" :permissions="userPermissions" />
      <RealTimeRouteMap v-else-if="activeItem === 'Ver Flotas en Ruta'" :permissions="userPermissions" />
      <CaptureMedia v-else-if="activeItem === 'CaptureMedia'"  />
      <!-- Agrega otros componentes según sea necesario -->
    </main>
  </div>
</template>

<script>
import clientes from "./Clientes.vue";
import Direcciones from "./Direcciones.vue";
import usuarios from "./usuarios.vue";
import bodegas from "./Bodegas.vue";
import Traccker from "./traccker.vue";
import RealTimeRouteMap from "./RealTimeRouteMap.vue";
import TransferenciaManager from "./TransferenciasManager.vue";
import Dashboard from "./Dashboard.vue";
import HorasLaborales from "./HorasLaborales.vue";
import PermissionsManagement from "./PermissionsManagement.vue";
import RolesManagement from "./RolesManagement.vue";
import RolePermissionsAssignment from "./RolePermissionsAssignment.vue";
import CaptureMedia from "./CaptureMedia.vue";

import { useAuthStore } from "@/stores/authStore";

export default {
  name: "DashboardSidebar",
  components: {
    clientes,
    Direcciones,
    usuarios,
    bodegas,
    Traccker,
    RealTimeRouteMap,
    TransferenciaManager,
    Dashboard,
    HorasLaborales,
    PermissionsManagement,
    RolesManagement,
    RolePermissionsAssignment,
    CaptureMedia
  },
  data() {
    return {
      isCollapsed: false,
      activeItem: "Dashboard",
      menu: [
        {
          name: "Dashboard",
          icon: "bx bxs-dashboard",
          link: "#",
          requiredPermission: "Acceso Panel Administrativo"
        },
        {
          name: "Transferencias",
          icon: "bx bxs-directions",
          link: "#",
          requiredPermission: "Administrar Transferencias"
        },
        {
          name: "Administrar Clientes",
          icon: "bi bi-building-fill",
          requiredPermission: "Acceso Administracion de Clientes",
          children: [
            {
              name: "Clientes",
              icon: "bi bi-people",
              link: "#",
              requiredPermission: "Visualizar Clientes"
            },
            {
              name: "Direcciones",
              icon: "bx bx-map",
              link: "#",
              requiredPermission: "Visualizar Direcciones de Clientes"
            },
            {
              name: "Horas Laborables",
              icon: "bx bx-time",
              link: "#",
              requiredPermission: "Visualizar Horas Laborables de Clientes"
            }
          ],
          open: false
        },
        {
          name: "Administrar Usuarios",
          icon: "bx bx-group",
          requiredPermission: "Acceso Administracion de Usuarios",
          children: [
            {
              name: "Usuarios",
              icon: "bx bx-user",
              link: "#",
              requiredPermission: "Visualizar Usuarios"
            },
            {
              name: "Administrar Permisos",
              icon: "bx bxs-key",
              link: "#",
              requiredPermission: "Administrar Permisos"
            },
            {
              name: "Administrar Roles",
              icon: "bx bxs-user-check",
              link: "#",
              requiredPermission: "Acceso Administracion de Roles"
            },
            {
              name: "Asignar Permisos a Roles",
              icon: "bx bxs-user-check",
              link: "#",
              requiredPermission: "Asignar Permisos a Roles"
            }
          ],
          open: false
        },
        {
          name: "Administrar Bodegas",
          icon: "bx bx-building-house",
          requiredPermission: "Acceso Administracion de Bodegas",
          children: [
            {
              name: "Bodegas",
              icon: "bx bx-buildings",
              link: "#",
              requiredPermission: "Visualizar Bodegas"
            },
            {
              name: "Ubicaciones",
              icon: "bx bx-map",
              link: "#",
              requiredPermission: "Visualizar Ubicaciones en Bodegas"
            }
          ],
          open: false
        },
        {
          name: "Administrar Flotas",
          icon: "bx bxs-truck",
          requiredPermission: "Acceso Administracion de Flotas",
          children: [
            {
              name: "Flotas",
              icon: "bx bx-truck",
              link: "#",
              requiredPermission: "Visualizar Flotas"
            },
            {
              name: "Agregar Flota",
              icon: "bx bx-plus",
              link: "#",
              requiredPermission: "Crear Flota"
            },
            {
              name: "Ubicar Flotas",
              icon: "bx bx-map-pin",
              link: "#",
              requiredPermission: "Visualizar Ubicación de Flotas"
            },
            {
              name: "Ver Flotas en Ruta",
              icon: "bx bx-route",
              link: "#",
              requiredPermission: "Visualizar Rutas de Flotas"
            }
          ],
          open: false
        }
      ]
    };
  },
  computed: {
    authStore() {
      return useAuthStore();
    },
    userPermissions() {
      return this.authStore.userPermissions;
    },
    canAccess() {
      return (permissionName) =>
        this.userPermissions.some((p) => p.nombre === permissionName);
    },
    filteredMenu() {
      return this.menu.filter(item => {
        if (item.requiredPermission && !this.canAccess(item.requiredPermission)) {
          return false;
        }
        if (item.children && Array.isArray(item.children)) {
          item.children = item.children.filter(child => {
            if (child.requiredPermission) {
              return this.canAccess(child.requiredPermission);
            }
            return true;
          });
          return item.children.length > 0;
        }
        return true;
      });
    },
    activeIcon() {
      for (const item of this.filteredMenu) {
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
      return "";
    }
  },
  methods: {
    toggleSidebar() {
      this.isCollapsed = !this.isCollapsed;
    },
    toggleDropdown(index) {
      this.filteredMenu.forEach((item, idx) => {
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
    isActiveParent(item) {
      if (item.children) {
        return item.children.some(child => child.name === this.activeItem);
      }
      return false;
    }
  }
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
  background: #303030;
  transition: width 0.3s ease;
  overflow: hidden;
  border-right: 1px solid #dee2e6;
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
  border-radius: 4px;
}

.menu-links a:hover,
.menu-link:hover {
  background: #353535;
}

.menu-links a.active,
.menu-link.active {
  background: #5c5c5c;
  color: #fff;
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
