<template>
  <v-app class="m-0 p-0" style="background-color: #f5f5f5; height: calc(100vh - 56px);">
    <!-- Capa de introducción que se muestra solo una vez -->
    <div v-if="showIntro" class="intro-overlay">
      <div class="intro-content">
        <Icon
          icon="fluent-emoji:hand-with-fingers-splayed"
          width="100"
          height="100"
          class="intro-icon"
          style="vertical-align: middle;"
          
        />
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
            <v-col
              cols="12"
              sm="6"
              v-for="metric in metrics"
              :key="metric.label"
            >
              <v-hover v-slot="{ hover }" class="">
                <v-card
                  class="pa-4 rounded-lg overflow-hidden position-relative"
                  outlined
                  :elevation="hover ? 12 : 2"
                  :style="{
                    /* Degradado de 45° del color original a un negro semitransparente para oscurecer */
                    backgroundImage: `linear-gradient(125deg, #235ca4, #041e40)`
                  }"
                
                >
                  <!-- Icon partially overflowing but clipped by the card -->
                  <Icon
                    :icon="metric.icon"
                    style="position: absolute; top: 5px; right: 0px; font-size: 75px; color: white; opacity: 0.05"
                  />
                  <v-row align="center"  no-gutters>
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
          
          <v-col cols="12" md="8" class="mt-4">
            <v-card height="auto" outlined >
              <chartjs-line :chart-data="chartData" :options="chartOptions" />
            </v-card>
          </v-col>

          <!-- Lista de tareas pendientes -->
          <v-col cols="12" md="4">
            <v-card class="pa-4" outlined>
              <div class="subtitle-1 font-weight-medium mb-2">Tareas pendientes</div>
              <v-list dense>
                <v-list-item v-for="task in pendingTasks" :key="task.id" @click="navigateToTask(task)">
                  <v-list-item-content>
                    <v-list-item-title>{{ task.type }}</v-list-item-title>
                    <v-list-item-subtitle>{{ task.details }}</v-list-item-subtitle>
                  </v-list-item-content>
                  <v-list-item-action>
                    <v-chip small>{{ task.status }}</v-chip>
                  </v-list-item-action>
                </v-list-item>
              </v-list>
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

export default {
  name: 'DashboardView',
  components: { ChartjsLine },
  data() {
    return {
      CardInfo,
      tab: 'home',
      dark: false,
      showIntro: true, // controla la visibilidad de la animación de introducción
      metrics: [
        { icon: 'mdi-archive-marker', color: 'blue', value: '12', label: 'Transferencias' },
        { icon: 'mdi-archive-arrow-up', color: 'green', value: '5', label: 'Prestamos' },
        { icon: 'mdi-archive-refresh', color: 'orange', value: '3', label: 'Devoluciones' },
        { icon: 'mdi-archive-remove-outline', color: 'red', value: '2', label: 'Desarchives' }
      ],
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
      pendingTasks: [
        { id: 1, type: 'Préstamo', details: 'Caja #123', status: 'Pendiente' },
        { id: 2, type: 'Devolución', details: 'Caja #456', status: 'En proceso' },
        { id: 3, type: 'Transferencia', details: 'Caja #789', status: 'Pendiente' }
      ]
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
    animation:   fadeIn 2s forwards, fadeOut 2s forwards;
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