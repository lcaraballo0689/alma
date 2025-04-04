<template>
  <div class="dynamic-table-container">
    <div class="table-responsive">
      <table class="table table-sm table-bordered table-hover sticky-content">
        <thead class="sticky-header">
          <tr>
            <th v-for="col in displayedColumns" :key="col">
              {{ col }}
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
export default {
  name: "DynamicTable",
  props: {
    // Data que viene del endpoint, debe ser un array de objetos
    data: {
      type: Array,
      required: true,
    },
    // Opcional: columnas en las que aplicar el filtro de búsqueda
    searchableColumns: {
      type: Array,
      default: () => [],
    },
    // Opcional: término de búsqueda
    searchTerm: {
      type: String,
      default: "",
    },
    // Opcional: lista de columnas a excluir de la tabla
    excludeColumns: {
      type: Array,
      default: () => [],
    },
  },
  computed: {
    // Extrae de forma dinámica los encabezados (keys) de los objetos, excluyendo los definidos en excludeColumns.
    displayedColumns() {
      const cols = new Set();
      this.data.forEach((obj) => {
        Object.keys(obj).forEach((key) => {
          if (!this.excludeColumns.includes(key)) {
            cols.add(key);
          }
        });
      });
      return Array.from(cols);
    },
    // Filtra la data según el searchTerm sobre las columnas definidas en searchableColumns (o todas si no se especifica)
    filteredData() {
      if (!this.searchTerm) return this.data;
      const term = this.searchTerm.toLowerCase();
      const cols = this.searchableColumns.length > 0
        ? this.searchableColumns
        : this.displayedColumns;
      return this.data.filter((row) =>
        cols.some((col) => String(row[col] || "").toLowerCase().includes(term))
      );
    },
  },
  methods: {
    // Formatea la celda; si no hay valor, muestra "N/A"
    formatCell(value) {
      if (value === null || value === undefined) return "N/A";
      return String(value);
    },
  },
};
</script>

<style scoped>
.dynamic-table-container {
  margin: 1rem 0;
}
.table-responsive {
  max-height: 400px; /* Ajusta según tus necesidades */
  overflow-y: auto;
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
