<template>
  <div class="inventario-container px-3 py-0 mt-0">
    <div class="card shadow">
      <div class="card-header px-0 py-0">
        <div
          class="row align-items-center m-0 p-0 py-3 d-flex justify-content-between"
        >
          <div class="col-auto">
            <div class="custom-select">
              <select v-model="selectedEstado" @change="fetchPrestamos">
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
          <div class="col-auto d-flex align-items-center gap-2">
            <button
              class="custom-btn excel me-2"
              @click="exportToExcel"
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
            <div class="custom-search">
              <i class="bi bi-search search-icon"></i>
              <input
                type="text"
                class="form-control form-control-sm"
                placeholder="Buscar"
                v-model="searchTerm"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="card-body m-0 p-0">
        <div class="table-container">
          <table
            class="table table-sm table-bordered table-hover sticky-content"
          >
            <thead class="sticky-header">
              <tr>
                <th>ID</th>
                <th>Consecutivo</th>
                <th>Fecha Devolución</th>
                <th>Entregado Por</th>
                <th>Observaciones</th>
                <th>Creado</th>
                <th>Actualizado</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in filteredPrestamos" :key="item.id">
                <td>{{ item.id }}</td>
                <td>{{ item.consecutivo }}</td>
                <td>{{ formatDate(item.fechaDevolucion) }}</td>
                <td>{{ item.entregadoPor }}</td>
                <td>{{ item.observaciones || "N/A" }}</td>
                <td>{{ formatDate(item.createdAt) }}</td>
                <td>{{ formatDate(item.updatedAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import apiClient from "@/services/api";
import { useAuthStore } from "@/stores/authStore";
import { useLoaderStore } from "@/stores/loaderStore";
import dayjs from "dayjs";
import "dayjs/locale/es";
import * as XLSX from "xlsx";

export default {
  name: "PrestamosTable",
  data() {
    return {
      authStore: useAuthStore(),
      selectedEstado: "TODOS",
      estadosDisponibles: [],
      prestamos: [],
      searchTerm: "",
      hoveredButton: "",
      hoveredId: null,
      loaderStore: useLoaderStore(),
    };
  },
  computed: {
    filteredPrestamos() {
      return this.prestamos.filter((item) => {
        const term = this.searchTerm.toLowerCase();
        return (
          (item.usuario_nombre || "").toLowerCase().includes(term) ||
          (item.entregadoPor || "").toLowerCase().includes(term) ||
          String(item.consecutivo || "").includes(term)
        );
      });
    },
  },
  async mounted() {
    await this.fetchEstados();
    await this.fetchPrestamos();
  },
  methods: {
    async fetchEstados() {
      try {
        const response = await apiClient.post("/api/estados/listar", {
          tipo: "devolucion",
        });
        this.estadosDisponibles = response.data.data || ["TODOS"];
      } catch (error) {
        console.error("Error al obtener los estados de préstamos:", error);
      }
    },
    async fetchPrestamos() {
      try {
        const clienteId = this.authStore.clienteId;
        if (!clienteId) {
          console.error("❌ Error: Cliente ID no encontrado.");
          return;
        }

        const requestBody = {
          estado:
            this.selectedEstado === "TODOS" ? ["TODOS"] : [this.selectedEstado],
          idCliente: clienteId,
        };

        const response = await apiClient.post(
          "/api/prestamosReports",
          requestBody
        );

        this.prestamos = response.data.map((p) => ({
          id: p.id,
          consecutivo: p.consecutivo,

          entregadoPor: p.entregadoPor,
          observaciones: p.observaciones,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        }));
      } catch (error) {
        console.error("Error al obtener datos de préstamos:", error);
      }
    },

    formatDate(date) {
      return date ? dayjs(date).locale("es").format("DD/MM/YYYY HH:mm") : "N/A";
    },
    exportToExcel() {
      const ws = XLSX.utils.json_to_sheet(
        this.filteredPrestamos.map((item) => ({
          ID: item.id,
          Consecutivo: item.consecutivo,
          "Fecha Devolución": this.formatDate(item.fechaDevolucion),
          "Entregado Por": item.entregadoPor,
          Observaciones: item.observaciones || "N/A",
          "Creado el": this.formatDate(item.createdAt),
          "Actualizado el": this.formatDate(item.updatedAt),
        }))
      );
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Prestamos");
      XLSX.writeFile(wb, `Prestamos_${dayjs().format("YYYY-MM-DD")}.xlsx`);
    },
  },
};
</script>

<style>
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
