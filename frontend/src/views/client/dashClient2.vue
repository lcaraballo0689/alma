<template>
  <div class="dashboard-container modern-bg">
    <div class="container">
      <!-- Encabezado con mensaje de Bienvenida, fecha y hora actual -->
      <div class="row mb-4">
        <div class="col-12 text-center">
          <h2 class="modern-title" >Bienvenido, {{ clienteNombre }}! {{ timeIcon }} </h2>
          <p class="modern-subtitle">
            <span class="time-icon "  :class="timeIcon !== 'bi bi-sun-fill'?'animated-sun': 'animated-moon' ">
              <i :class="timeIcon" ></i>
            </span>
            {{ currentDateTime }}
          </p>
        </div>
      </div>

      <!-- Tarjetas de métricas -->
      <div class="row mb-4">
        <div class="col-md-4 mb-3" v-for="(card, index) in cards" :key="index">
          <DashboardCard
            :name="card.title"
            :total="card.value"
            :color="card.color"
            :ancho="card.ancho"
            :backgroundIcon="card.backgroundIcon"
          >
            <!-- Slot para un ícono principal (opcional) -->
            <i :class="card.iconClass"></i>
          </DashboardCard>
        </div>
      </div>

      <!-- Panel principal con dos columnas -->
      <div class="row">
        <!-- Columna Izquierda: Transacciones, Calendario y Notas -->
        <div class="col-md-6">
          <!-- Tabla de Últimas Transacciones -->
          <div class="card modern-card mb-4">
            <div class="card-header modern-card-header">Últimas Transacciones</div>
            <div class="card-body p-0">
              <table class="table table-sm table-striped mb-0">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Empresa</th>
                    <th>Tipo</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(trans, index) in transactions" :key="index">
                    <td>{{ trans.id }}</td>
                    <td>{{ trans.company }}</td>
                    <td>{{ trans.type }}</td>
                    <td>{{ trans.date }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Calendario (Placeholder usando Vue Cal) -->
          <div class="card modern-card mb-4">
            <div class="card-header modern-card-header">Calendario</div>
            <div class="card-body">
              <!-- Componente de calendario -->
              <vue-cal style="height: 300px;" :time="false" />
            </div>
          </div>

          <!-- Panel de Notas -->
          <div class="card modern-card mb-4">
            <div class="card-header modern-card-header">Notas</div>
            <div class="card-body">
              <textarea class="form-control modern-textarea" rows="4"
                        v-model="notes"
                        placeholder="Escribe tus notas aquí..."></textarea>
              <button class="btn btn-primary mt-2 modern-btn" @click="saveNotes">
                Guardar Notas
              </button>
            </div>
          </div>
        </div>

        <!-- Columna Derecha: Gráfico, Notificaciones y Actividad Reciente -->
        <div class="col-md-6">
          <!-- Gráfico de Estadísticas -->
          <div class="card modern-card mb-4">
            <div class="card-header modern-card-header">Estadísticas</div>
            <div class="card-body">
              <canvas id="myChart" width="400" height="200"></canvas>
            </div>
          </div>

          <!-- Panel de Notificaciones -->
          <div class="card modern-card mb-4">
            <div class="card-header modern-card-header">Notificaciones</div>
            <div class="card-body">
              <ul class="list-group">
                <li class="list-group-item modern-list-item"
                    v-for="(notification, index) in notifications" :key="index">
                  {{ notification }}
                </li>
              </ul>
            </div>
          </div>

          <!-- Registro de Actividad Reciente -->
          <div class="card modern-card mb-4">
            <div class="card-header modern-card-header">Actividad Reciente</div>
            <div class="card-body">
              <ul class="list-group">
                <li class="list-group-item modern-list-item"
                    v-for="(activity, index) in activityLog" :key="index">
                  {{ activity }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import DashboardCard from "@/components/monitorCard.vue";
import { useAuthStore } from "@/stores/authStore";
import apiClient from "@/services/api";
import Chart from "chart.js/auto";
import dayjs from "dayjs";
import VueCal from "vue-cal";
import "vue-cal/dist/vuecal.css";
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";

export default {
  name: "DashboardClient2",
  components: {
    DashboardCard,
    VueCal,
  },
  setup() {
    const authStore = useAuthStore();
    const router = useRouter();
    const i18n = useI18n();

    return {
      authStore,
      router,
      i18n
    };
  },
  data() {
    return {
      currentDateTime: dayjs().format("DD/MM/YYYY HH:mm:ss"),
      notes: "",
      cards: [],
      transactions: [
        { id: 1, company: "Empresa A", type: "Préstamo", date: "12/03/2025" },
        { id: 2, company: "Empresa B", type: "Devolución", date: "12/03/2025" },
        { id: 3, company: "Empresa C", type: "Transferencia", date: "11/03/2025" },
        { id: 4, company: "Empresa D", type: "Préstamo", date: "10/03/2025" },
      ],
      notifications: [
        "Notificación 1: Tarea pendiente.",
        "Notificación 2: Nueva solicitud recibida.",
        "Notificación 3: Inventario actualizado.",
      ],
      activityLog: [
        "Usuario X inició sesión.",
        "Se actualizó el inventario.",
        "Nueva transacción registrada.",
      ],
      inventarios: [],
      totalCustodias: 0,
      totalDisponible: 0,
      totalPrestamo: 0,
      chart: null,
    };
  },
  computed: {
    clienteNombre() {
      return (
        this.authStore.user?.nombre ||
        localStorage.getItem("clienteNombre") ||
        "Cliente"
      );
    },
    // Computed para elegir el icono según la hora actual
    timeIcon() {
      const hour = dayjs().hour();
      // Si la hora es entre 6:00 y 18:00, es de día; de lo contrario, es de noche
      return hour >= 6 && hour < 18
        ? "bi bi-sun-fill animated-sun"
        : "bi bi-moon-fill animated-moon";
    },
  },
  mounted() {
    this.fetchCustodias();
    this.updateCards();
    this.initChart();
    this.updateDateTime();
  },
  methods: {
    async fetchCustodias() {
      try {
        const response = await apiClient.get("/api/custodias");
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
        this.totalCustodias = this.inventarios.length;
        this.totalDisponible = this.inventarios.filter(
          (item) => item.estado.toLowerCase() === "disponible"
        ).length;
        this.totalPrestamo = this.inventarios.filter((item) => {
          const estado = item.estado.toLowerCase();
          return estado === "solicitado" || estado === "entrega confirmada";
        }).length;
      } catch (error) {
        console.error("Error al obtener datos de Custodia:", error);
      }
    },
    updateCards() {
      this.cards = [
        {
          title: "Total de Cajas",
          value: this.totalCustodias,
          subtitle: "Cajas totales en el sistema",
          backgroundIcon: "bi bi-box-seam-fill",
        },
        {
          title: "Cajas en Bodega",
          value: this.totalDisponible,
          subtitle: "Disponibles en bodega",
          backgroundIcon: "bi bi-archive-fill",
        },
        {
          title: "Cajas Prestadas",
          value: this.totalPrestamo,
          subtitle: "En préstamo actualmente",
          backgroundIcon: "bi bi-arrow-up-right-circle-fill",
        },
      ];
    },
    updateDateTime() {
      setInterval(() => {
        this.currentDateTime = dayjs().format("DD/MM/YYYY HH:mm:ss");
      }, 1000);
    },
    initChart() {
      const ctx = document.getElementById("myChart").getContext("2d");
      this.chart = new Chart(ctx, {
        type: "bar",
        data: {
          labels: ["Enero", "Febrero", "Marzo", "Abril", "Mayo"],
          datasets: [
            {
              label: "Ventas",
              data: [12, 19, 3, 5, 2],
              backgroundColor: "#007bff",
              borderColor: "#007bff",
              borderWidth: 1,
            },
          ],
        },
        options: {
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                color: "#000",
              },
            },
            x: {
              ticks: {
                color: "#000",
              },
            },
          },
          plugins: {
            legend: {
              labels: {
                color: "#000",
              },
            },
          },
        },
      });
    },
    saveNotes() {
      localStorage.setItem("dashboardNotes", this.notes);
      alert("Notas guardadas!");
    },
  },
};
</script>

<style scoped>
/* Fuentes y colores generales modernos */
.dashboard-container {
  padding: 2rem 0;
  font-family: 'Poppins', sans-serif;
}
.modern-bg {
  background-color: #f8f9fa;
}
.modern-title {
  font-weight: bold;
  color: #333;
}
.modern-subtitle {
  color: #555;
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

/* Iconos animados */
.animated-sun {
  color: #f1c40f;
  animation: spin 4s linear infinite;
}
.animated-moon {
  color: #f0f0f0;
  animation: pulse 2s infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
@keyframes pulse {
  0% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(1); opacity: 0.8; }
}

/* Modern Cards */
.modern-card {
  border: none;
  border-radius: 10px;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  margin-bottom: 1rem;
}
.modern-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
}
.modern-card-header {
  font-weight: bold;
  background-color: #ffffff;
  color: #333;
  border: none;
  padding: 1rem;
}

/* Textarea y Botón modernos para el panel de notas */
.modern-textarea {
  border-radius: 5px;
  border: 1px solid #ced4da;
}
.modern-btn {
  border-radius: 5px;
}

/* Clase oscura para la tarjeta */
.card-dark-custom {
  background-color: #1e1e1e;
  color: #f0f0f0;
  border: none !important;
}
.card-dark-custom .card-header {
  background-color: #272727;
  color: #f0f0f0;
  border: none !important;
}

/* Estilos para la tabla en tema oscuro */
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

/* List-group en modo oscuro */
.list-group-item-dark {
  background-color: #1e1e1e;
  color: #f0f0f0;
  border: none !important;
}

/* Ajustes responsivos */
@media (max-width: 768px) {
  .modern-title {
    font-size: 1.5rem;
  }
  .modern-subtitle {
    font-size: 1rem;
  }
}
</style>
