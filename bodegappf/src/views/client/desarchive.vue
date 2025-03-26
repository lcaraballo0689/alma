<template>
  <div>
    <h2>Listado de Entregas</h2>
    <!-- Campo de búsqueda global -->
    <input
      type="text"
      v-model="searchTerm"
      placeholder="Buscar..."
      class="form-control mb-3"
    />
    <div class="table-container">
      <table class="table table-sm table-bordered table-hover sticky-content">
        <thead class="sticky-header">
          <tr>
            <!-- Genera dinámicamente los encabezados usando el mapa de columnas -->
            <th v-for="col in displayedColumns" :key="col">
              {{ getMappedHeader(col) }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, rowIndex) in filteredData" :key="rowIndex">
            <td v-for="col in displayedColumns" :key="col">
              {{ formatCell(row[col]) }}
            </td>
          </tr>
          <tr v-if="filteredData.length === 0">
            <td :colspan="displayedColumns.length" class="text-center text-muted">
              No hay datos para mostrar.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import apiClient from "@/services/api";
import dayjs from "dayjs";
import "dayjs/locale/es";

export default {
  name: "EntregasView",
  data() {
    return {
      entregas: [],
      searchTerm: "",
      // Mapeo para estandarizar los encabezados
      headerMapping: {
        desarchivoId: "ID Desarchivo",
        custodiaId: "ID Caja",
        clienteId: "ID Cliente",
        fechaDesarchivo: "Fecha Desarchivo",
        year: "Año",
        month: "Mes",
        day: "Día",
        pdfFileName: "Nombre PDF",
        pdfFullPath: "Ruta PDF",
        observaciones: "Observaciones",
        custodiaItem: "Objeto",
        custodiaRef1: "Referencia 1",
        custodiaRef2: "Referencia 2",
        custodiaRef3: "Referencia 3",
        custodiaEstado: "Estado",
        // Puedes agregar más mapeos según lo necesites
        cliente_nombre: "Cliente",
        usuario_nombre: "Usuario",
        objeto: "Objeto",
        bodega: "Bodega",
        referencia1: "Referencia 1",
        referencia2: "Referencia 2",
        referencia3: "Referencia 3",
        estado: "Estado",
        modalidad: "Modalidad",
        direccion_entrega: "Dirección Entrega",
        fechaEstimada: "Fecha Estimada",
        urlPdf: "URL PDF"
      },
    };
  },
  computed: {
    // Extrae dinámicamente las columnas (keys) de la data recibida, sin excluir ninguna (puedes agregar lógica para excluir)
    displayedColumns() {
      const cols = new Set();
      this.entregas.forEach((obj) => {
        Object.keys(obj).forEach((key) => {
          cols.add(key);
        });
      });
      return Array.from(cols);
    },
    // Filtra la data en función del término de búsqueda sobre todas las columnas
    filteredData() {
      if (!this.searchTerm) return this.entregas;
      const term = this.searchTerm.toLowerCase();
      return this.entregas.filter((row) => {
        return this.displayedColumns.some((col) => {
          const cell = row[col] || "";
          return String(cell).toLowerCase().includes(term);
        });
      });
    },
  },
  methods: {
    // Devuelve el encabezado mapeado si existe en headerMapping, o la key original en caso contrario
    getMappedHeader(key) {
      return this.headerMapping[key] || key;
    },
    // Formatea el valor de una celda; si es una fecha válida se formatea, de lo contrario se muestra "N/A" o el valor
    formatCell(value) {
      if (value === null || value === undefined) return "N/A";
      // Si el valor es una cadena que puede interpretarse como fecha, formatearla
      if (typeof value === "string" && !isNaN(Date.parse(value))) {
        return dayjs(value).locale("es").format("DD/MM/YYYY HH:mm");
      }
      return String(value);
    },
    async fetchEntregas() {
      try {
        // Ajusta la llamada a tu endpoint según sea necesario
        const response = await apiClient.post("/api/entregas/listar", { clienteId: 2 });
        // Se asume que la respuesta tiene la forma { data: [ { ... }, { ... } ] }
        this.entregas = response.data.data || [];
      } catch (error) {
        console.error("Error al obtener entregas:", error);
      }
    },
  },
  async mounted() {
    await this.fetchEntregas();
  },
};
</script>

<style scoped>
.table-container {
  max-height: calc(100vh - 195px);
  overflow-y: auto;
  border: 1px solid #dddddd;
  position: relative;
}
table {
  width: 100%;
  border-collapse: collapse;
}
thead {
  position: sticky;
  top: 0;
  background-color: #e5e5e5;
  z-index: 100;
  box-shadow: 0 2px 2px -1px rgba(0, 0, 0, 0.2);
}
</style>
