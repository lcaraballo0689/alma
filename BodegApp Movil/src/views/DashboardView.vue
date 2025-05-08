<template>
  <v-app class="m-0 p-0" style="background-color: #f5f5f5; height: calc(100vh - 56px);">
    <!-- Capa de introducción que se muestra solo una vez -->
    <div v-if="showIntro" class="intro-overlay">
      <div class="intro-content">
        <Icon icon="fluent-emoji:hand-with-fingers-splayed" width="100" height="100" class="intro-icon"
          style="vertical-align: middle;" />
        <span class="intro-content"> Hola, {{ transportistaNombre }}</span>
      </div>
    </div>

    <!-- APP BAR -->

    <!-- MAIN CONTENT -->
    <v-main>
      <v-container fluid class="pa-4">
        <v-row dense>
          <!-- Métricas principales -->
          <v-row dense>
            <v-col cols="6" sm="6" v-for="metric in metrics" :key="metric.label">
              <v-hover v-slot="{ hover }" class="">
                <v-card class="pa-4 rounded-lg overflow-hidden position-relative" outlined :elevation="hover ? 12 : 2"
                  :style="{
                    /* Degradado de 45° del color original a un negro semitransparente para oscurecer */
                    backgroundImage: `linear-gradient(125deg, #235ca4, #041e40)`
                  }">
                  <!-- Icon partially overflowing but clipped by the card -->
                  <Icon :icon="metric.icon"
                    style="position: absolute; top: 5px; right: 0px; font-size: 75px; color: white; opacity: 0.05" />
                  <v-row align="center" no-gutters>
                    <v-col>
                      <div class="text-h5 font-weight-bold text-white">{{ metric.value }}</div>
                      <div class="subtitle-2 text-white">{{ metric.label }}</div>
                    </v-col>
                  </v-row>
                </v-card>
              </v-hover>
            </v-col>
          </v-row>

          <!-- Gráfico de actividad -->

          <!-- <v-col cols="12" md="8" class="mt-4">
            <v-card height="auto" outlined >
              <chartjs-line :chart-data="chartData" :options="chartOptions" />
            </v-card>
          </v-col> -->

          <!-- Lista de tareas pendientes -->
          <v-col cols="12" md="4" class="mt-4">
            <v-card class="pa-0" outlined>
              <v-card-title class="d-flex align-center pa-0 ma-0 elevation-6 mb-4"
                style="background-color: #E0E0E0; border-top-left-radius: 8px; border-top-right-radius: 8px;">
                <v-col cols="12">
                      <div class="d-flex align-center justify-space-between mb-4">
                        <span class="text-h6 font-weight-medium" style="color: #333;">Tareas Pendientes</span>
                        <v-btn text small style="color: #235ca4; border-radius: 25px 25px 25px 25px;" @click="getTransfers">
                          <Icon icon="line-md:rotate-270" width="24" height="24" />
                          Actualizar
                        </v-btn>
                      </div>
                    </v-col>
              </v-card-title>
              <div class="py-2" style="height:calc(100vh - 42vh); overflow-y:auto;">
                <v-container fluid class="py-0">
                  <v-row dense>
                    <v-col v-for="task in pendingTasks" :key="task.id" cols="12" sm="6" md="4" lg="3" class="d-flex">
                      <v-hover v-slot="{ hover }">
                        <v-card outlined class="d-flex flex-column justify-space-between" :elevation="hover ? 10 : 2" @click="navigateToTask(task)" style="">
                          <v-card-text class="py-4 px-0">
                          <v-row align="center" class="mb-2  px-2" style="background: #EEEEEE; border-radius: 25px 25px 0 0;">
                            
                            <v-col cols="10" class="d-flex align-center">
                              
                            <div style="display: inline-flex; align-items: center;">
                              <Icon icon="line-md:account" width="24" height="24" style="margin-right: 4px;" />
                              <span class="text-subtitle-1 font-weight-semibold" style="color:#333; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; display:inline-block; width:80%;">
                                {{ task.cliente  }}
                              </span>
                            </div>
                            </v-col>
                            <v-col cols="2" class="d-flex align-center" style="text-align: right;">
                            
                            <Icon icon="line-md:arrow-right" width="28" height="28" style="margin-left: 4px;" />
                              <span> {{ task.id }}</span>
                            </v-col>
                          </v-row>

                          <v-row align="center" class="my-0 py-0 px-6">
                            <v-col cols="auto">
                            <Icon icon="line-md:clipboard-arrow-twotone" width="28" height="28" />
                            </v-col>
                            <v-col>
                            <span class="text-subtitle-1 font-weight-semibold" style="color:#333;">{{ task.type }}</span>
                            </v-col>
                          </v-row>
                          <v-divider class="my-0"></v-divider>
                          <v-row align="center" class="my-0 py-0 px-6">
                            <v-col cols="auto">
                            <Icon icon="line-md:compass-filled-loop" width="28" height="28" />
                            </v-col>
                            <v-col>
                            <span class="text-subtitle-1" style="color:#555;">{{ task.details }}</span>
                            </v-col>
                          </v-row>
                          </v-card-text>
                          <v-divider class="my-0"></v-divider>
                          <v-card-actions class="p2-0 py-0 justify-center" style="background: #f7f7f7;">
                          <v-chip small outlined style="font-weight:500; text-transform:uppercase; letter-spacing:0.5px; color:#235ca4;">
                            {{ task.status }}
                          </v-chip>
                          </v-card-actions>
                        </v-card>
                      </v-hover>
                    </v-col>
                  </v-row>
                </v-container>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import { useTheme } from 'vuetify'
import { useAuthStore } from '@/stores/auth'
import ChartjsLine from '@/components/ChartjsLine.vue'
import CardInfo from '@/components/cardInfo.vue'
import apiClient from '@/services/api' // Importación del cliente API

export default {
  name: 'DashboardView',
  components: { ChartjsLine },
  data() {
    return {
      CardInfo,
      tab: 'home',
      dark: false,
      showIntro: true, // controla la visibilidad de la animación de introducción
      metrics: [],
      chartData: {
        labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
        datasets: [
          {
            label: 'Tareas completadas',
            backgroundColor: 'rgba(33,150,243,0.2)',
            borderColor: '#2196F3',
            data: [5, 8, 6, 10, 12, 9, 7],
            fill: true
          }
        ]
      },
      chartOptions: {
        responsive: true,
        maintainAspectRatio: false
      },
      pendingTasks: [],
      loadTranfers: false // Estado de carga
    }
  },
  computed: {
    transportistaNombre() {
      return this.authStore.user?.nombre || 'Transportista'
    }
  },
  methods: {
    navigateToTask(task) {
      console.log('Navegando a la tarea:', task)
      // Lógica de navegación...
    },
    logout() {
      this.authStore.resetAuth()
      localStorage.clear()
      window.location.reload()
    },
    endIntro() {
      this.showIntro = false
    },
    async getTransfers() {
      this.loadTranfers = true;
      try {
        const payload = {
          clienteId: null,
          estado: ""
        };
        const response = await apiClient.post('/api/transferencias/consultar', payload);
        this.loadTranfers = false;

        // Validar que la respuesta tenga el formato esperado
        const transferencias = response.data?.data || [];

        // Actualizar pendingTasks con las transferencias obtenidas
        this.pendingTasks = transferencias.map(t => ({
          cliente: t.clienteNombre || 'Sin cliente',
          id: t.id,
          type: t.modulo,
          details: t.direccion || t.alias || 'Sin dirección',
          status: t.estado
        }));

        // Actualizar metrics con datos resumidos de las transferencias
        const resumen = {
          Devolucion: transferencias.filter(t => t.modulo === 'Devolucion').length || 0,
          Prestamos: transferencias.filter(t => t.modulo === 'Prestamo').length || 0,
          Transferencias: transferencias.filter(t => t.estado === 'Transferencias').length || 0,
          Desarchive: transferencias.filter(t => t.estado === 'Desarchive').length || 0,
        };
        console.log('Resumen de transferencias:', resumen);


        this.metrics = [
          { icon: 'mdi-archive-marker', color: 'blue', value: resumen.Devolucion, label: 'Devoluciones' },
          { icon: 'mdi-archive-arrow-up', color: 'green', value: resumen.Prestamos, label: 'Préstamos' },
          { icon: 'mdi-check-circle', color: 'orange', value: resumen.Transferencias, label: 'Transferencia' },
          { icon: 'mdi-truck-delivery', color: 'red', value: resumen.Desarchive, label: 'Desarchive' }
        ];
      } catch (error) {
        this.loadTranfers = false;
        console.error('Error al obtener las transferencias:', error);
        this.error = 'No se pudo cargar la información de transferencias.';
      }
    }
  },
  created() {
    this.authStore = useAuthStore()
    this.theme = useTheme()
    // Inicializamos el tema
    this.theme.global.name.value = this.dark ? 'dark' : 'light'
  },
  mounted() {
    // Después de 3 segundos, se inicia la transición de la animación de introducción.
    setTimeout(() => {
      this.endIntro()
    }, 3000)
    this.getTransfers(); // Llamada al método para obtener transferencias
  },
  watch: {
    dark(newVal) {
      this.theme.global.name.value = newVal ? 'dark' : 'light'
    }
  }
}
</script>

<style scoped>
.v-application {
  background-color: whitesmoke !important;
}

/* Capa de introducción: fondo estático */
.intro-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #fff;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.9;
  animation: fadeOut 2s forwards;
  /* Se elimina la animación aquí */
}

@keyframes fadeOut {
  0% {
    opacity: 1;
  }

  100% {
    opacity: 0;
  }
}

/* Contenido de introducción que se mueve y luego se desvanece */
.intro-content {
  display: flex;
  align-items: center;
  font-size: 2rem;
  font-weight: bold;
  color: #333;
  animation: fadeIn 2s forwards, fadeOut 2s forwards;
}



/* Animación para desvanecer el contenido */
@keyframes fadeOut {
  0% {
    opacity: 1;
  }

  50% {
    opacity: 1;
  }

  100% {
    opacity: 0;
  }
}
</style>