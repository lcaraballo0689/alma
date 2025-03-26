<template>
  <div class="dashboard-container">
    <div class="container">
      <!-- Encabezado con mensaje de Bienvenida y hora actual -->
      <div class="row mb-2 px-3 d-flex align-items-center">
        <div class="col d-flex align-items-center">
          <h1 class="modern-title shimmer-text display-4 text-primary mb-0">
            {{ greeting }}, {{ clienteNombre.split(" ")[0] }}!
          </h1>
        </div>
        <div class="col d-flex justify-content-end align-items-baseline mt-4">
          <span class="modern-subtitle fs-4" style="color: #d9d9d9">
            {{ currentDate }} <i class="bi bi-clock ms-3"></i> {{ currentTime }}
          </span>
        </div>
        <hr class="mt-2" />
      </div>

      <!-- Tarjetas de métricas -->
      <div class="row mb-4">
        <!-- Cards1 - Ocupa 4 columnas -->
        <div class="col-4">
          <div class="mb-3" v-for="(card, index) in cards1" :key="index">
            <DashboardCard
              :name="card.title"
              :total="card.value"
              :color="card.color"
              :ancho="card.ancho"
              :backgroundIcon="card.backgroundIcon"
              :typeCard="card.type"
            >
              <i :class="card.iconClass"></i>
            </DashboardCard>
          </div>
        </div>

        <!-- Cards2 - Ocupa 8 columnas y se organiza en dos filas -->
        <div class="col-8">
          <div class="row">
            {{}}
            <div
              class="col-6 mb-3"
              v-for="(card, index) in cards2"
              :key="index"
            >
              <DashboardCard
                :name="card.title"
                :total="card.value"
                :color="card.color"
                :ancho="card.ancho"
                :backgroundIcon="card.backgroundIcon"
                :typeCard="card.type"
              >
                <i :class="card.iconClass"></i>
              </DashboardCard>
            </div>
          </div>
        </div>
      </div>

      <!-- Panel principal: Actividad Reciente y Notificaciones -->
      <div class="row">
        <!-- Panel de Actividad Reciente con transición expandida -->
        <transition name="slide-enter-active">
          <div :class="maximized ? 'col-md-12' : 'col-md-8'" key="activity">
            <div class="card mb-4">
              <!-- Panel de Historial de Solicitudes -->
              <div
                class="card mb-4"
                :class="{ 'card-dark-custom': themeStore.theme === 'dark' }"
              >
                <div class="card-header">
                  <i class="bi bi-journal-text me-2"></i>Historial de
                  Solicitudes
                </div>
                <div
                  class="card-body p-0"
                  style="max-height: 350px; overflow-y: auto"
                >
                  <table
                    class="table table-sm table-striped mb-0 table-header"
                    :class="{
                      'table-dark-custom': themeStore.theme === 'dark',
                    }"
                  >
                    <thead>
                      <tr>
                        <th class="text-start">ID Solicitud</th>
                        <th class="text-start">Tipo</th>
                        <th class="text-start">Estado</th>
                        <th class="text-start">Fecha</th>
                        <th class="text-start">Hora</th>
                        <th class="text-start">Usuario</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="(s, index) in solicitudesHistorial"
                        :key="index"
                      >
                        <td class="text-start">{{ s.id }}</td>
                        <td class="text-start text-uppercase">{{ s.tipo }}</td>
                        <td class="text-start text-uppercase">
                          {{ s.estado }}
                        </td>
                        <td class="text-start">{{ s.fecha }}</td>
                        <td class="text-start">{{ s.hora }}</td>
                        <td class="text-start text-uppercase">
                          {{ s.usuario }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </transition>

        <!-- Panel de Notificaciones, se oculta si está maximizado -->
        <transition name="expand">
          <div v-if="!maximized" class="col-md-4" key="notifications">
            <div
              class="card mb-4"
              :class="{ 'card-dark-custom': themeStore.theme === 'dark' }"
            >
              <div class="card-header" style="height: fit-content !important">
                <i class="bi bi-megaphone me-2"></i>Historial Notificaciones
              </div>
              <div
                class="card-body m-0 p-0"
                style="height: fit-content !important"
              >
                <div class="notification-bubbles-container">
                  <EmptyState
                    v-if="notificationStore.allNotifications.length === 0"
                    message="No hay Mensajes"
                  />
                  <div
                    v-for="notif in notificationStore.allNotifications"
                    :key="notif.id"
                    class="bubble"
                    :class="{ read: notif.estado === 'leído' }"
                  >
                    <div class="bubble-content">
                      <div class="bubble-message">{{ notif.message }}</div>
                    </div>
                    <div class="bubble-footer">
                      <i
                        class="bi bi-check-all me-1"
                        :class="
                          notif.estado === 'leído'
                            ? 'text-success'
                            : 'text-muted'
                        "
                      ></i>
                      <div class="bubble-date">
                        {{ formatDate(notif.createdAt) }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script>
import DashboardCard from "@/components/monitorCard.vue";
import EmptyState from "@/components/EmptyState.vue";
import { useThemeStore } from "@/stores/themeStore";
import { useAuthStore } from "@/stores/authStore";
import { useLoaderStore } from "@/stores/loaderStore";
import { useTabStore } from "@/stores/tabStore";
import { useNotificationStore } from "@/stores/notificationStore";
import apiClient from "@/services/api";
import dayjs from "dayjs";
import "dayjs/locale/es";

export default {
  name: "Dashboard",
  components: {
    DashboardCard,
    EmptyState,
  },
  data() {
    return {
      maximized: true,
      loaderStore: useLoaderStore(),
      themeStore: useThemeStore(),
      authStore: useAuthStore(),
      tabStore: useTabStore(),
      notificationStore: useNotificationStore(),
      currentDate: dayjs().format("dddd,DD/MM/YYYY"),
      currentTime: dayjs().format("HH:mm:ss"),
      notes: "",
      cards1: [],
      cards2: [],
      transactions: [],
      inventarios: [],
      totalCustodias: 0,
      totalDisponible: 0,
      totalDevolucionProgress: 0,
      totalrecogidaProgress: 0,
      totalPrestamo: 0,
      solicitudesHistorial: [],
    };
  },
  computed: {
    currentTab() {
      return this.tabStore.globalCurrentTab;
    },
    greeting() {
      const hour = dayjs().hour();
      if (hour >= 6 && hour < 12) return "Buenos días";
      else if (hour >= 12 && hour < 18) return "Buenas tardes";
      else return "Buenas noches";
    },
    clienteNombre() {
      return (
        this.authStore.user?.nombre ||
        localStorage.getItem("clienteNombre") ||
        "Cliente"
      );
    },
  },
  mounted() {
    this.fetchCustodias();
    this.updateCards();
    this.updateDateTime();
    this.fetchHistorial(); // 👈 Llama aquí el nuevo método
  },
  methods: {
    async fetchHistorial() {
      try {
        const response = await apiClient.post("/api/auditoria", {
          clienteId: 2,
        });
        console.log(response);

        this.solicitudesHistorial = response.data.map((item) => ({
          id: item.SolicitudID,
          tipo: item.tipo,
          estado: item.estado,
          fecha: item.Fecha,
          hora: item.Hora,
          usuario: item.NombreUsuario,
        }));
      } catch (err) {
        console.error("Error al obtener historial:", err);
      }
    },
    formatDate(dateStr) {
      return dayjs(dateStr).format("DD/MM/YYYY HH:mm");
    },
    toggleMaximize() {
      this.maximized = !this.maximized;
    },
    updateDateTime() {
      setInterval(() => {
        this.currentDate = dayjs()
          .locale("es")
          .format("dddd, DD/MM/YYYY")
          .toUpperCase();
        this.currentTime = dayjs().locale("es").format("h:mm A");
      }, 1000);
    },
    updateCards() {
      this.cards1 = [
        {
          title: "Total en Inventario",
          value: this.inventarios.length,
          subtitle: "Cajas totales en el sistema",
          backgroundIcon: "bi bi-safe-fill",
          type: 1,
          color: "linear-gradient(135deg, #898989, #2a2a2a)",
        },
      ];
      this.cards2 = [
        {
          title: "Cajas en Bodega",
          value: this.totalDisponible,
          subtitle: "Disponibles en bodega",
          backgroundIcon: "bi bi-archive-fill",
          type: 2,
          color: "linear-gradient(135deg, #235ca4, #041e40)",
        },
        {
          title: "Cajas Prestadas",
          value: this.totalPrestamo,
          subtitle: "En préstamo actualmente",
          backgroundIcon: "bi bi-buildings",
          type: 2,
          color: "linear-gradient(135deg, #235ca4, #041e40)",
        },
        {
          title: "Solicitides de Devolucion Pendientes",
          value: this.totalDevolucionProgress,
          subtitle: "Devoluciones",
          backgroundIcon: "bi bi-arrow-up-right-circle-fill",
          type: 2,
          color: "linear-gradient(135deg, #235ca4, #041e40)",
        },
        {
          title: "Solicitides de Prestamo Pendientes",
          value: this.totalrecogidaProgress,
          subtitle: "Prestamos Solicitados",
          backgroundIcon: "bi bi-truck",
          type: 2,
          color: "linear-gradient(135deg, #235ca4, #041e40)",
        },
      ];
    },
    async fetchCustodias() {
      try {
        const clienteId = this.authStore.clienteId;
        const response = await apiClient.post(`/api/custodias/cliente`, {
          clienteId,
        });

        // Mapear los datos a inventarios
        this.inventarios = response.data.map((custodia) => ({
          id: custodia.id,
          objeto: custodia.item,
          bodega: custodia.bodega,
          ubicacionId: custodia.ubicacionId,
          clienteId: custodia.clienteId,
          referencia1: custodia.referencia1,
          referencia2: custodia.referencia2,
          referencia3: custodia.referencia3,
          estado: custodia.estado,
          baja: custodia.baja,
        }));

        // Calcular totales con base en el estado
        this.totalCustodias = this.inventarios.length;
        const normalize = (text) => (text || "").trim().toLowerCase();

        this.totalDisponible = this.inventarios.filter(
          (item) => normalize(item.estado) === "disponible"
        ).length;

        this.totalDevolucionProgress = this.inventarios.filter(
          (item) => normalize(item.estado) === "devolucion en proceso"
        ).length;

        this.totalrecogidaProgress = this.inventarios.filter(
          (item) => normalize(item.estado) === "solicitada"
        ).length;

        this.totalPrestamo = this.inventarios.filter(
          (item) => normalize(item.estado) === "entregado"
        ).length;

        // Actualiza las tarjetas con los nuevos valores
        this.updateCards();
      } catch (error) {
        console.error("Error al obtener datos de Custodia:", error);
      }
    },

    setTab(tabName) {
      const tabMap = {
        Recepcion: "confirmarRecepcion",
        Devoluciones: "Devoluciones",
        Transferencias: "Transferencias",
      };

      const transferTab = Object.keys(tabMap).find((key) =>
        tabName.includes(key)
      );

      if (transferTab) {
        this.tabStore.setTab(tabMap[transferTab]);
        console.log(`Cambiando a la pestaña: ${tabMap[transferTab]}`);
      } else {
        console.warn("Pestaña no reconocida:", tabName);
      }
    },
  },
};
</script>

<style scoped>
/* Transición para expansión/contracción (más lenta y suave) */
.expand-enter-active,
.expand-leave-active {
  transition: all 1s ease;
}
.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  transform: scaleY(0.95);
}

/* Resto de estilos (ajustados según sea necesario) */
.dashboard-container {
  padding: 2rem 0;
}

.card {
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  margin-bottom: 1rem;
}

.card .card-body .display-4 {
  font-size: 2.5rem;
  font-weight: 700;
}

.card-dark-custom {
  background-color: #1e1e1e;
  color: #f0f0f0;
  border: none !important;
}
.card-dark-custom .card-header {
  background-color: #272727;
  color: #f0f0f0;
  border: none !important;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
  height: 350px;
  overflow-y: auto;
}

.table-dark-custom {
  background-color: #1e1e1e;
  color: #f0f0f0;
  border: none !important;
}
.table-dark-custom thead {
  background-color: #272727;
  color: #f0f0f0;
  border: none !important;
}
.table-dark-custom tbody tr:nth-of-type(odd) {
  background-color: #1e1e1e;
}
.table-dark-custom tbody tr:nth-of-type(even) {
  background-color: #202020;
}
.table-dark-custom tbody tr:hover {
  background-color: #2c2c2c;
}
.table-dark-custom,
.table-dark-custom thead,
.table-dark-custom tbody,
.table-dark-custom tfoot,
.table-dark-custom th,
.table-dark-custom td,
.table-dark-custom tr {
  border: none !important;
}

.list-group-item-dark {
  background-color: #1e1e1e;
  color: #f0f0f0;
  border: none !important;
}

.shimmer-text {
  text-shadow: 2px 2px 6px #686868bf;
  background: linear-gradient(75deg, #000000 20%, #a3a3a3bf 30%, #000000 50%);
  background-size: 1100% 50%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-fill-color: transparent;
  animation: shimmer 4s linear infinite;
}

@keyframes shimmer {
  0% {
    background-position: 45% 0;
  }
  100% {
    background-position: -50% 0;
  }
}

.hand-pointer {
  cursor: pointer;
}

.icon-container {
  display: inline-block;
  width: 30px;
  text-align: center;
}

.animated-icon {
  display: inline-block;
  position: relative;
  transform-origin: center;
  font-size: 1.2em;
}

.animated-sun {
  color: #ffd12c;
  animation: spin 8s linear infinite, glowPulse 2s ease-in-out infinite;
}

.animated-moon {
  color: #d4d4d4;
  animation: pulse 2s infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.1);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0.8;
  }
}

.greeting-section {
  border-radius: 15px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.notification-bubbles-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
  height: 350px;
  overflow-y: auto;
}

.bubble {
  display: flex;
  flex-direction: column;
  max-width: 100%;
  padding: 10px 15px;
  border-radius: 10px;
  background-color: #edf5f8;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  word-wrap: break-word;
  transition: background-color 0.3s ease;
}

.bubble-content {
  display: flex;
  flex-direction: column;
}

.bubble-message {
  font-size: 0.9rem;
  margin-bottom: 5px;
}

.bubble-date {
  display: flex;
  font-size: 0.75rem;
  color: #777;
  text-align: right;
  justify-content: flex-end;
}

.bubble-footer {
  display: flex;
  justify-content: flex-start;
  margin-top: 5px;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.5s ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}
.slide-enter-to,
.slide-leave-from {
  transform: translateX(0);
}
</style>
