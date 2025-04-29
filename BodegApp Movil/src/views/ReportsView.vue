<template>
  <v-app>
    <v-main>
      <v-container>
        <h1>Reports</h1>
        <v-row>
          <v-col cols="12" md="6" lg="4">
            <v-card>
              <v-card-title>Reporte 1</v-card-title>
              <v-card-text>Descripción del reporte 1</v-card-text>
              <v-card-actions>
                <v-btn color="primary">Ver Reporte</v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
          <v-col cols="12" md="6" lg="4">
            <v-card>
              <v-card-title>Reporte 2</v-card-title>
              <v-card-text>Descripción del reporte 2</v-card-text>
              <v-card-actions>
                <v-btn color="primary">Ver Reporte</v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
          <!-- Agregar más reportes según sea necesario -->
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
export default {
  name: 'ReportsView'
}
</script>