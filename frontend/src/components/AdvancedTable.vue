<template>
    <div style="width: 100%; height: 600px;" class="ag-theme-alpine">
      <ag-grid-vue
        class="ag-theme-alpine"
        :columnDefs="columnDefs"
        :rowData="rowData"
        :defaultColDef="defaultColDef"
        :animateRows="true"
        :rowSelection="'multiple'"
        @grid-ready="onGridReady"
      >
      </ag-grid-vue>
    </div>
  </template>
  
  <script>
  import { AgGridVue } from "ag-grid-vue";
  import "ag-grid-community/styles/ag-grid.css";       // Estilos base
  import "ag-grid-community/styles/ag-theme-alpine.css"; // Tema Alpine
  
  export default {
    name: "AdvancedTable",
    components: {
      AgGridVue
    },
    data() {
      return {
        columnDefs: [
          {
            field: "ciudad",
            filter: "agSetColumnFilter",     // Filtrado estilo Excel (checkboxes)
            sortable: true,                  // Permite ordenar
            resizable: true,                 // Permite redimensionar
          },
          {
            field: "pais",
            filter: "agTextColumnFilter",    // Filtro de texto
            sortable: true,
            resizable: true,
          },
          {
            field: "poblacion",
            filter: "agNumberColumnFilter",  // Filtro numérico
            sortable: true,
            resizable: true,
          },
        ],
        defaultColDef: {
          flex: 1,                // Ajusta ancho automáticamente
          minWidth: 100,          // Ancho mínimo de cada columna
          filter: true,           // Habilita filtrado por defecto
          floatingFilter: true,   // Muestra el filtro flotante bajo el encabezado
          enableRowGroup: true,
        },
        rowData: null,
      };
    },
    mounted() {
      // Ejemplo de datos
      this.rowData = [
        { ciudad: "Barranquilla", pais: "Colombia", poblacion: 1200000 },
        { ciudad: "Bogotá", pais: "Colombia", poblacion: 8000000 },
        { ciudad: "Medellín", pais: "Colombia", poblacion: 2500000 },
        { ciudad: "Cali", pais: "Colombia", poblacion: 2200000 },
        { ciudad: "Buenos Aires", pais: "Argentina", poblacion: 15000000 },
      ];
    },
    methods: {
      onGridReady(params) {
        // Ajusta el grid al contenedor
        params.api.sizeColumnsToFit();
      },
    },
  };
  </script>
  
  <style scoped>
  .ag-theme-alpine {
    width: 100%;
    height: 100%;
  }
  </style>
  