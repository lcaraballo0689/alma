<template>
  <div class="table-container">
    <table class="table table-sm table-bordered table-hover sticky-content">
      <thead class="sticky-header">
        <tr>
          <th v-for="col in displayedColumns" :key="col">
            {{ col }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, rowIndex) in dataToDisplay" :key="rowIndex">
          <td v-for="col in displayedColumns" :key="col">
            {{ formatCell(row[col]) }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
export default {
  name: "DataTable",
  props: {
    data: {
      type: Array,
      required: true,
    },
    excludeColumns: {
      type: Array,
      default: () => [],
    },
  },
  computed: {
    displayedColumns() {
      const setOfCols = new Set();
      this.data.forEach((obj) => {
        Object.keys(obj).forEach((key) => {
          if (!this.excludeColumns.includes(key)) {
            setOfCols.add(key);
          }
        });
      });
      return Array.from(setOfCols);
    },
  },
  methods: {
    // Si deseas formatear celdas por tipo (fechas, pdf, etc.), se hace aquí.
    formatCell(value) {
      if (value === null || value === undefined) return "N/A";
      return String(value);
    },
  },
  // dataToDisplay se pasará como prop o computed en el padre
  // Para mayor flexibilidad, el padre filtra y pasa los datos finales a "data"
  // Sin embargo, si quieres filtrar aquí, podrías hacerlo en un computed local.
  computed: {
    dataToDisplay() {
      return this.data;
    },
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
