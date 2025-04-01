<template>
  <div class="inventario-container px-3 py-0 mt-0">
    <!-- Encabezado con filtro de estado, búsqueda y exportación a Excel -->
    <div class="card shadow">
      <div class="card-header px-0 py-0">
        <div
          class="row align-items-center m-0 p-0 py-3 d-flex justify-content-between"
        >
          <!-- Alineación izquierda (Selector de Estado) -->
          <div class="col-auto">
            <div class="custom-select">
              <select v-model="selectedEstado" @change="fetchDevoluciones">
                <option value="TODOS">TODOS</option>
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

          <!-- Alineación derecha (Exportar a Excel y Búsqueda) -->
          <div class="col-auto d-flex align-items-center gap-2">
            <!-- Botón para exportar a Excel -->
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

            <!-- Campo de búsqueda -->
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

      <!-- Tabla de devoluciones -->
      <div class="card-body m-0 p-0">
        <SkeletonLoader v-if="isLoading" :columns="10" :rows="18"/>
        <div  v-else class="table-container">
          <table
            class="table table-sm table-bordered table-hover sticky-content"
          >
            <thead class="sticky-header">
              <tr>
                <th class="text-center">Custodia</th>
                <th class="text-center">Referencia 2</th>
                <th class="text-center">Referencia 3</th>
                <th class="text-center">Estado</th>
                <th class="text-center">Fecha Solicitud</th>
              </tr>
            </thead>
            
            <tbody>
              <tr v-for="item in filteredDevoluciones" :key="item.id">
                <td class="text-center">{{ item.custodia_item }}</td>
                <td class="text-center">{{ item.referencia2 }}</td>
                <td class="text-center">{{ item.referencia3 }}</td>
                <td class="text-center text-uppercase">
                  <span>{{ item.estado }}</span>
                </td>
                <td class="text-center">
                  {{ formatDate(item.fechaSolicitud) }}
                </td>

                <!-- <td class="text-center">
                  <button
                    class="custom-btn pdf"
                    style="height: 22px !important"
                    @click="downloadFile(item.urlPdf)"
                    @mouseover="hoveredId = item.id"
                    @mouseleave="hoveredId = null"
                  >
                    <i
                      :class="
                        hoveredId === item.id
                          ? 'bi bi-arrow-down-circle-fill'
                          : 'bi bi-file-earmark-pdf-fill'
                      "
                    ></i>
                    <span v-if="hoveredId !== item.id">PDF</span>
                    <span v-else>Descargar</span>
                  </button>
                </td> -->
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
import SkeletonLoader from '@/components/skeletonLoader.vue';
import dayjs from "dayjs";
import "dayjs/locale/es";
import * as XLSX from "xlsx";

export default {
  name: "DevolucionesTable",
  data() {
    return {
      authStore: useAuthStore(),
      selectedEstado: "TODOS",
      estadosDisponibles: [],
      devoluciones: [],
      searchTerm: "",
      hoveredButton: "",
      hoveredId: null,
      loaderStore: useLoaderStore(),
      isLoading: true,
    };
  },
  components:{
    SkeletonLoader
  },
  computed: {
    filteredDevoluciones() {
      return this.devoluciones.filter((item) =>
        [
          item.referencia1,
          item.referencia2,
          item.referencia3,
          item.cliente_nombre,
          item.usuario_nombre,
        ]
          .filter(Boolean) // Filtra valores `null` o `undefined`
          .some((campo) =>
            campo.toLowerCase().includes(this.searchTerm.toLowerCase())
          )
      );
    },
  },
  async mounted() {
    await this.fetchEstados();
    await this.fetchDevoluciones();
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

    async fetchDevoluciones() {
      try {
        const clienteId = this.authStore.clienteId;
        if (!clienteId) {
          console.error("❌ Error: Cliente ID no encontrado.");
          return;
        }

        const requestBody = {
          clienteId,
          estado: this.selectedEstado,
        };

        this.loaderStore.showLoader();
        const response = await apiClient.post(
          "/api/devolucionesReports",
          requestBody
        );
        this.devoluciones = response.data;
          this.isLoading = false
        this.loaderStore.hideLoader();
      } catch (error) {
        
        console.error("❌ Error al obtener datos de devoluciones:", error);
        

        setTimeout(() => {
          
          this.isLoading = false
        }, 1500);

        this.loaderStore.hideLoader();
      }
    },

    async downloadFile(filename) {
      try {
        const token = this.authStore.token;

        const response = await apiClient.post(
          "/api/downloadReportsPdf",
          { filename: "1233827.pdf" },
          {
            responseType: "blob",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log(
          "🚀 ~ file: devoluciones.vue ~ line 138 ~ DevolucionesTable ~ downloadFile ~ response",
          response
        );

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.error("❌ Error al descargar el PDF:", error);
      }
    },
    exportToExcel() {
      const ws = XLSX.utils.json_to_sheet(
        this.filteredDevoluciones.map((item) => ({
          ID: item.id,
          Cliente: item.cliente_nombre,
          Usuario: item.usuario_nombre,
          Custodia: item.custodia_item,
          "Referencia 1": item.referencia1,
          "Referencia 2": item.referencia2,
          "Referencia 3": item.referencia3,
          Estado: item.estado,
          Modalidad: item.modalidad,
          "Dirección Entrega": item.direccion_entrega,
          Observaciones: item.observaciones,
          "Fecha Solicitud": this.formatDate(item.fechaSolicitud),
          "Fecha Devolución": this.formatDate(item.FechaDevolucion),
          "Firma A": item.signatureA ? "Firmado" : "No Firmado",
          "Firma B": item.signatureB ? "Firmado" : "No Firmado",
          "URL PDF": item.urlPdf ? "Disponible" : "No disponible",
        }))
      );

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Devoluciones");

      XLSX.writeFile(
        wb,
        `Bodegapp_Devoluciones_${dayjs().format("YYYY-MM-DD")}.xlsx`
      );
    },

    formatDate(date) {
      return date ? dayjs(date).locale("es").format("DD/MM/YYYY HH:mm") : "N/A";
    },
  },
};
</script>

<style>
.firma-img {
  width: 40px;
  height: auto;
}
</style>
