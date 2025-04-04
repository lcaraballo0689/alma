<template>
    <div class="row align-items-center m-0 p-0 py-3 d-flex justify-content-between">
      <!-- Sección izquierda (Selector de estado) -->
      <div class="col-auto">
        <div class="custom-select">
          <select v-model="selectedEstado" @change="$emit('estado-changed', selectedEstado)">
            <option value="TODOS">Todos</option>
            <option
              v-for="estado in estadosDisponibles"
              :key="estado"
              :value="estado"
            >
              {{ estado }}
            </option>
          </select>
        </div>
      </div>
      <!-- Sección derecha (Exportar a Excel y Búsqueda) -->
      <div class="col-auto d-flex align-items-center gap-2">
        <button
          class="custom-btn excel me-2"
          @click="$emit('export-excel')"
          @mouseover="hoveredButton = 'excel'"
          @mouseleave="hoveredButton = ''"
        >
          <i
            :class="
              hoveredButton === 'excel'
                ? 'bi bi-arrow-down-circle-fill'
                : 'bi bi-file-excel-fill'
            "
          ></i>
          <span v-if="hoveredButton !== 'excel'">Excel</span>
          <span v-else>Descargar</span>
        </button>
        <!-- Campo de búsqueda -->
        <div class="custom-search">
          <i class="bi bi-search search-icon"></i>
          <input
            type="text"
            class="form-control form-control-sm"
            placeholder="Buscar"
            v-model="searchTerm"
            @input="$emit('search-term-changed', searchTerm)"
          />
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: "DataFilters",
    props: {
      estadosDisponibles: {
        type: Array,
        default: () => ["TODOS"],
      },
      defaultEstado: {
        type: String,
        default: "TODOS",
      },
    },
    data() {
      return {
        hoveredButton: "",
        selectedEstado: this.defaultEstado,
        searchTerm: "",
      };
    },
  };
  </script>
  
  <style scoped>
  .custom-select select {
    padding: 4px 8px;
    font-size: 0.875rem;
  }
  .custom-search {
    position: relative;
    display: inline-block;
  }
  .search-icon {
    position: absolute;
    left: 8px;
    top: 6px;
    pointer-events: none;
    color: #777;
  }
  .custom-search input {
    padding-left: 28px !important;
    font-size: 0.875rem;
  }
  </style>
  