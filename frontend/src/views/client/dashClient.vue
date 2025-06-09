<template>
  <div class="dashboard-container">
    <div class="container">
      <!-- Encabezado: mensaje de bienvenida y hora actual -->
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
        <!-- Cards1: primera columna, por ejemplo, muestra el total de inventario -->
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

        <!-- Cards2: segunda columna, se organiza en dos filas -->
        <div class="col-8">
          <div class="row">
            <div class="col-6 mb-3" v-for="(card, index) in cards2" :key="index">
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

      <!-- Resto del contenido del Dashboard... -->
    </div>
  </div>
</template>

<script>
import DashboardCard from "@/components/monitorCard.vue";
import EmptyState from "@/components/EmptyState.vue";
import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "vue-router";
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
      // Propiedades de visualización y tarjetas
      maximized: true,
      filtroTipo: "diario",
      loaderStore: useLoaderStore(),
      authStore: useAuthStore(),
      router: useRouter(),
      tabStore: useTabStore(),
      notificationStore: useNotificationStore(),
      currentDate: dayjs().format("dddd, DD/MM/YYYY").toUpperCase(),
      currentTime: dayjs().format("HH:mm:ss"),
      cards1: [],
      cards2: [],
      // Propiedades que almacenan la data procesada recibida del endpoint
      totalCustodias: 0,
      totalDisponible: 0,
      totalDevolucionProgress: 0,
      totalrecogidaProgress: 0,
      totalPrestamo: 0,
      // Otras propiedades para historial, transferencias, etc.
      solicitudesHistorial: [],
    };
  },
  computed: {
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
    // En lugar de fetchCustodias, consumimos el endpoint que retorna los counts procesados
    this.fetchCountsByCliente();
    this.fetchHistorial(); 
    this.updateCards();
    this.updateDateTime();
  },
  methods: {
    // Método para obtener la data preprocesada desde el backend (endpoint countsByCliente)
    async fetchCountsByCliente() {
      try {
        const clienteId = this.authStore.clienteId;
        console.log("Cliente ID:", clienteId);  // Verificamos el clienteId
        const response = await apiClient.post(`/api/custodias/countsByCliente`, {
          clienteId,
        });
        console.log("Response:", response.data);  // Verificamos la respuesta del servidor
        // Asignamos la data directamente a nuestras propiedades
        this.totalCustodias = response.data.CUSTODIAS;
        this.totalDisponible = response.data.DISPONIBLE;
        this.totalDevolucionProgress = response.data.DEVOLUCIONES;
        this.totalrecogidaProgress = response.data.SOLICITADA;
        this.totalPrestamo = response.data.ENTREGADO;
        // Actualizamos las tarjetas con los nuevos valores
        this.updateCards();
      } catch (error) {
        console.error("Error al obtener datos de Custodia:", error);
      }
    },

    updateCards() {
      // Tarjeta principal (Cards1): Total en Inventario
      this.cards1 = [
        {
          title: "Total en Inventario",
          value: this.totalCustodias,
          subtitle: "Cajas totales en el sistema",
          backgroundIcon: "bi bi-safe-fill",
          type: 1,
          color: "linear-gradient(135deg, #898989, #2a2a2a)",
        },
      ];

      // Tarjetas secundarias (Cards2): Detalle por estado
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
          title: "Solicitudes de Devolución en Proceso",
          value: this.totalDevolucionProgress,
          subtitle: "Devoluciones pendientes",
          backgroundIcon: "bi bi-arrow-up-right-circle-fill",
          type: 2,
          color: "linear-gradient(135deg, #235ca4, #041e40)",
        },
        {
          title: "Solicitudes de Préstamo Pendientes",
          value: this.totalrecogidaProgress,
          subtitle: "Préstamos solicitados",
          backgroundIcon: "bi bi-truck",
          type: 2,
          color: "linear-gradient(135deg, #235ca4, #041e40)",
        },
      ];
    },

    updateDateTime() {
      setInterval(() => {
        this.currentDate = dayjs().locale("es").format("dddd, DD/MM/YYYY").toUpperCase();
        this.currentTime = dayjs().locale("es").format("HH:mm:ss");
      }, 1000);
    },

    async fetchHistorial() {
      console.log("Fetching historial...");
      
      try {
        const clienteId = this.authStore.clienteId;
        console.log("Cliente ID:", clienteId);  // Verificamos el clienteId
        // Llamamos al endpoint para obtener el historial de solicitudes
        // y lo asignamos a la propiedad solicitudesHistorial
        const response = await apiClient.post("/api/auditoria", {
          clienteId,
          filtroTipo: "semanal",
        });
        console.log("Historial de solicitudes:", response.data);  // Verificamos la respuesta del servidor
        
        this.solicitudesHistorial = response.data.map((item) => ({
          id: item.solicitudTransporte,
          tipo: item.ModuloConsecutivo,
          estado: item.EstadoSolicitud,
          fecha: item.Fecha,
          hora: item.Hora,
          usuario: item.NombreUsuario,
        }));
      } catch (err) {
        console.error("Error al obtener historial:", err);
      }
    },
    
    // Otros métodos (por ejemplo, para notificaciones, reporte PDF, etc.) se mantienen sin cambios...
  },
};
</script>


<style scoped>
/* Transiciones y estilos generales */
.expand-enter-active,
.expand-leave-active {
  transition: all 1s ease;
}
.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  transform: scaleY(0.95);
}

/* Dashboard Container */
.dashboard-container {
  padding: 2rem 0;
}

/* Cards y estilos personalizados */
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

/* Estilos para la tabla en modo oscuro */
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

/* Estilos para las notificaciones */
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
