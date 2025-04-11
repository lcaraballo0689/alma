<template>
  <div class="container-fluid my-4" >
    <!-- Spinner mientras carga la información -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
    </div>

    <div v-else>
      <!-- Cuadrícula de Cards -->
      <div class="row g-3">
        <!-- Card Total Usuarios -->
        <div class="col-12 col-md-6 col-lg-4" v-if="dashboardData.totals">
          <div class="dashboard-card1 type1" :style="cardStyle">
            <div class="card-content">
              <div class="card-text">
                <h1 class="card-value1">{{ dashboardData.totals.totalUsers }}</h1>
                <h6 class="card-title">Usuarios</h6>
              </div>
              <div class="card-icon1">
                <i class="bi bi-people"></i>
              </div>
            </div>
          </div>
        </div>
        <!-- Card Total Clientes -->
        <div class="col-12 col-md-6 col-lg-4" v-if="dashboardData.totals">
          <div class="dashboard-card1 type1" :style="cardStyle">
            <div class="card-content">
              <div class="card-text">
                <h1 class="card-value1">{{ dashboardData.totals.totalClients }}</h1>
                <h6 class="card-title">Clientes</h6>
              </div>
              <div class="card-icon1">
                <i class="bi bi-building"></i>
              </div>
            </div>
          </div>
        </div>
        <!-- Card Total Solicitudes -->
        <div class="col-12 col-md-6 col-lg-4" v-if="dashboardData.totals">
          <div class="dashboard-card1 type1" :style="cardStyle">
            <div class="card-content">
              <div class="card-text">
                <h1 class="card-value1">{{ dashboardData.totals.totalSolicitudes }}</h1>
                <h6 class="card-title">Solicitudes</h6>
              </div>
              <div class="card-icon1">
                <i class="bi bi-inbox"></i>
              </div>
            </div>
          </div>
        </div>
        <!-- Card Tiempo Promedio Procesamiento -->
        <div class="col-12 col-md-6 col-lg-4" v-if="dashboardData.avgProcessingTime">
          <div class="dashboard-card2 type2" :style="cardStyle">
            <div class="card-content">
              <div class="card-text">
                <h1 class="card-value2">{{ dashboardData.avgProcessingTime }} min</h1>
                <h6 class="card-title">Tiempo Promedio</h6>
              </div>
              <div class="card-icon2">
                <i class="bi bi-clock"></i>
              </div>
            </div>
          </div>
        </div>
        <!-- Card Inventario: Utilización -->
        <div class="col-12 col-md-6 col-lg-4" v-if="dashboardData.inventoryUsage">
          <div class="dashboard-card2 type2" :style="cardStyle">
            <div class="card-content">
              <div class="card-text">
                <h1 class="card-value2">
                  {{ dashboardData.inventoryUsage.percentageUsed.toFixed(1) }}%
                </h1>
                <h6 class="card-title">Inventario Utilizado</h6>
              </div>
              <div class="card-icon2">
                <i class="bi bi-bar-chart-line"></i>
              </div>
            </div>
          </div>
        </div>
        <!-- Card Notificaciones No Leídas -->
        <div class="col-12 col-md-6 col-lg-4" v-if="dashboardData.unreadNotifications !== null">
          <div class="dashboard-card2 type2" :style="cardStyle">
            <div class="card-content">
              <div class="card-text">
                <h1 class="card-value2">{{ dashboardData.unreadNotifications }}</h1>
                <h6 class="card-title">Notificaciones sin Leer</h6>
              </div>
              <div class="card-icon2">
                <i class="bi bi-bell"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Eventos Recientes (Audit) -->
      <div class="row mt-4">
        <div class="col-12">
          <h5>Eventos Recientes</h5>
          <div class="table-responsive">
            <table class="table table-bordered">
              <thead>
                <tr>
                  <th>Solicitud</th>
                  <th>Estado Anterior</th>
                  <th>Nuevo Estado</th>
                  <th>Fecha</th>
                  <th>Usuario</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="audit in dashboardData.recentAudits" :key="audit.SolicitudID + audit.FechaEvento">
                  <td>{{ audit.SolicitudID }}</td>
                  <td>{{ audit.EstadoAnterior }}</td>
                  <td>{{ audit.NuevoEstado }}</td>
                  <td>{{ formatDate(audit.FechaEvento) }}<br />{{ formatTime(audit.FechaEvento) }}</td>
                  <td>{{ audit.Usuario }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Mensaje de error si existe -->
    <div v-if="error" class="alert alert-danger mt-3">
      {{ error }}
    </div>
  </div>
</template>

<script>
import apiClient from "@/services/api";
import { DateTime } from "luxon";

export default {
  name: "Dashboard",
  data() {
    return {
      dashboardData: {},
      loading: true,
      error: ""
    };
  },
  computed: {
    cardStyle() {
      return {
        background: "linear-gradient(135deg, #235ca4, #041e40)",
        minWidth: "250px",
      };
    }
  },
  methods: {
    async fetchDashboardData() {
      try {
        const response = await apiClient.get("/api/dashboard");
        this.dashboardData = response.data.dashboardData;
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        this.error = err.message || "Error al obtener la información del dashboard.";
      } finally {
        this.loading = false;
      }
    },
    formatDate(dateStr) {
      if (!dateStr) return "";
      return DateTime.fromISO(dateStr).toFormat("dd/MM/yyyy");
    },
    formatTime(dateStr) {
      if (!dateStr) return "";
      return DateTime.fromISO(dateStr).toFormat("hh:mm a");
    }
  },
  mounted() {
    this.fetchDashboardData();
  }
};
</script>

<style scoped>
.dashboard-card1,
.dashboard-card2 {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  padding: 20px;
  color: #fff;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.type1 {
  height: 216px !important;
}

.type2 {
  height: 100px !important;
}

.card-content {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.card-value1 {
  font-size: clamp(80px, 2.5rem, 90px);
  margin: 0;
  font-weight: bold;
}

.card-value2 {
  font-size: clamp(24px, 2.5rem, 90px);
  margin: 0;
  font-weight: bold;
}

.card-title {
  font-size: 1rem;
  margin: 0;
  font-weight: 400;
}

.card-icon1 {
  font-size: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.1;
  position: absolute;
  top: -60px;
  right: 10px;
  z-index: 10;
}

.card-icon2 {
  font-size: 75px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.1;
  position: absolute;
  top: -20px;
  right: 0;
  z-index: 10;
}
</style>
