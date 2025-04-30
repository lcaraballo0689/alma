<template>
  <v-app>
    <v-main>
      <v-container class="pa-0 m-0" fluid fill-height>
        <v-app-bar app color="red" dark class="mb-2" style="position: fixed; top: 0; width: 100%; z-index: 10;">

          <v-tabs v-model="tab" bg-color="grey-lighten-2" dark color="black" slider-color="red" class="mb-2"
            style="position: fixed; top: 56px; width: 100%; z-index: 10; overflow: hidden;">

            <v-tab value="Scan">
              <Icon icon="ri:qr-scan-line" color="red" width="32" height="32" />
            </v-tab>
            <v-tab value="Pendientes">Asignadas</v-tab>
            <v-tab value="Completadas">Completadas</v-tab>

          </v-tabs>


          <v-tabs-window v-model="tab"
            style="position: fixed; top: 120px; height: calc(100vh - 110px); width: 100vw; overflow-y: auto; background-color: whitesmoke;">
            <v-divider class="mt-0" style="color: black;" />
            <v-tabs-window-item value="Pendientes">
              <v-list style="background-color: whitesmoke;">
                <v-list-item v-for="report in reports.filter(r => r.tipo === 'Prestamo')" :key="report.id">



                  <v-list-item-content class="pa-0">
                    <v-card class="ma-2 pa-3" outlined elevation="2">
                      <v-row no-gutters align="center">
                        <!-- Icono o avatar -->

                        <v-col cols="10" class="d-flex align-center justify-start ">
                          <v-avatar size="28" color="red lighten-1">
                            <Icon icon="hugeicons:permanent-job" width="18" height="18" color="white" />
                          </v-avatar>
                          <span class=" font-weight-medium text-uppercase mx-2" style="font-size: 0.8rem;">
                            {{ report.description }}
                          </span>
                        </v-col>
                        <v-col cols="2" class="d-flex align-center justify-center">
                          <v-chip small outlined color="grey lighten-2">
                            <span class="caption p-0 m-0">{{ report.title }}</span>
                          </v-chip>
                        </v-col>
                        <v-divider class="text-red"></v-divider>
                      </v-row>
                      <!-- Detalles adicionales -->
                      <v-row class="m-0 p-0" no-gutters>
                        <v-col cols="12">
                          <strong>Tipo:</strong> {{ report.tipo }}
                        </v-col>
                        <v-col cols="12">
                          <strong>Prioridad:</strong> {{ report.priority }}
                        </v-col>
                        <v-col cols="12">
                          <strong>Fecha:</strong> {{ report.date }}
                        </v-col>
                        <v-divider class="my-1"></v-divider>
                        <v-col cols="12">
                          <strong>Estado:</strong> {{ report.estado }}
                        </v-col>
                      </v-row>

                      <v-card-actions>
                        <v-spacer />
                        <v-btn small color="info" text @click="navigateToReport(report.id)">
                          Ver Detalles
                          <v-icon right small>mdi-chevron-right</v-icon>
                        </v-btn>
                      </v-card-actions>
                    </v-card>
                  </v-list-item-content>
                </v-list-item>
              </v-list>
            </v-tabs-window-item>

            <v-tabs-window-item value="Completadas">
              <v-list>
                <v-list-item v-for="report in reports.filter(r => r.tipo === 'Completado')" :key="report.id">
                  <v-list-item-content>
                    <v-list-item-title>{{ report.title }}</v-list-item-title>
                    <v-list-item-subtitle>{{ report.description }}</v-list-item-subtitle>
                    <v-list-item-subtitle>{{ report.date }}</v-list-item-subtitle>
                  </v-list-item-content>
                </v-list-item>
              </v-list>
            </v-tabs-window-item>

            <v-tabs-window-item value="Scan">
              <div class="d-flex flex-column align-center pa-4 text-black">
                
                <h2 v-if="showScan" class="text-center"> Escanear QR</h2>
                
                <QrScan v-if="showScan" @qr-detected="onQrDetected" />
                <p v-if="showScan" class="text-center mt-2">El código QR esté bien iluminado y enfocado.</p>
                <TransferDetail v-else :solicitudId="solicitudQr" @close="showScan = true" />
                <v-btn  color="red" @click="showScan = true" class="mt-4">Escanear otro QR</v-btn>

              </div>
            </v-tabs-window-item>
          </v-tabs-window>

          <v-row>



            <v-col cols="12" class="text-center">
              <v-btn color="green" @click="refreshReports" class="mt-4">Actualizar Reportes</v-btn>
            </v-col>
          </v-row>
        </v-app-bar>
      </v-container>

    </v-main>
  </v-app>
</template>

<script>

import QrScan from '@/components/scanQr.vue'
import TransferDetail from '@/components/TransferDetail.vue';
export default {
  name: 'ReportsView',
  components: {
    QrScan,
    TransferDetail, // Aquí puedes importar otros componentes si es necesario
  },
  data() {
    return {
      tab: 'Pendientes',
      showScan: true,
      // Variable para controlar la visibilidad del escáner QR

      solicitudQr: 'nada',  // Variable para almacenar el contenido escaneado
      reports: [
        {
          id: 1,
          title: '134',
          description: 'Secretaria distrital de hacienda',
          date: '2023-10-01',
          tipo: 'Prestamo',
          priority: 'Baja',
          estado: 'Asignado a transportador'
        },
        {
          id: 2,
          title: 'Reporte 2',
          description: 'Descripción del reporte 2',
          date: '2023-10-02',
          tipo: 'Completado',
          priority: 'Media'
        },
        {
          id: 3,
          title: 'Nuevo Reporte',
          description: 'Descripción del nuevo reporte',
          date: '2023-10-03',
          tipo: 'Reporte',
          priority: 'Baja'
        },
        {
          id: 4,
          title: '135',
          description: 'Secretaria distrital de hacienda',
          date: '2023-10-04',
          tipo: 'Prestamo',
          priority: 'Alta',
          estado: 'En proceso de entrega'
        },
        {
          id: 5,
          title: 'Reporte 3',
          description: 'Descripción del reporte 3',
          date: '2023-10-05',
          tipo: 'Completado',
          priority: 'Media'
        },
        {
          id: 6,
          title: '136',
          description: 'Secretaria distrital de hacienda',
          date: '2023-10-06',
          tipo: 'Prestamo',
          priority: 'Alta',
          estado: 'Entregado por transportador'
        },
        {
          id: 7,
          title: 'Reporte 4',
          description: 'Descripción del reporte 4',
          date: '2023-10-07',
          tipo: 'Completado',
          priority: 'Media'
        },
        {
          id: 8,
          title: '137',
          description: 'Secretaria distrital de hacienda',
          date: '2023-10-08',
          tipo: 'Prestamo',
          priority: 'Alta',
          estado: 'Asignado a transportador'
        },
        {
          id: 9,
          title: 'Reporte 5',
          description: 'Descripción del reporte 5',
          date: '2023-10-09',
          tipo: 'Completado',
          priority: 'Media'
        },
        {
          id: 10,
          title: '138',
          description: 'Secretaria distrital de hacienda',
          date: '2023-10-10',
          tipo: 'Prestamo',
          priority: 'Alta',
          estado: 'En proceso de entrega'
        }
      ],


    }
  },
  methods: {
    onQrDetected(code) {
      // code viene como solicitud_27 necesito dejar solo el numero 
      // Extraer solo el número de, por ejemplo, "solicitud_27"
      const match = code.match(/\d+$/);
      const numero = match ? match[0] : '';
      this.solicitudQr = numero;
      this.showScan = false;
    // buscar y mostrar tu reporte...
  }
  }
}
</script>
