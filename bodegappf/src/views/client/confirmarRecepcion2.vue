<template>
  <div class="inventario-container px-3 py-0 mt-0">
    <div class="card shadow">
      <div class="card-header px-0 py-0">
        <div class="row align-items-center m-0 p-0 py-3 d-flex justify-content-between">
          <div class="col-auto">
            <div class="custom-select">
              <select v-model="selectedEstado" @change="fetchPrestamos">
                <option value="TODOS">Todos</option>
                <option v-for="estado in estadosDisponibles" :key="estado" :value="estado">
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
          <table class="table table-sm table-bordered table-hover sticky-content">
            <thead class="sticky-header">
  <tr>
    <th>ID</th>
    <th>Cliente ID</th>
    <th>Consecutivo</th>
    <th>Creado</th>
    <th>Entregado Por</th>
    <th>Estado</th>
    <th>Fecha Entrega</th>
    <th>Observaciones</th>
    <th>PDF</th>
    <th>Prescinto</th>
    <th>Firma A</th>
    <th>Firma B</th>
    <th>Sticker</th>
    <th>Timestamp</th>
    <th>Actualizado</th>
    <!-- Nueva columna Acciones -->
    <th>Acciones</th>
  </tr>
</thead>
<tbody>
  <tr v-for="item in filteredPrestamos" :key="item.id">
    <td>{{ item.id }}</td>
    <td>{{ item.clienteId }}</td>
    <td>{{ item.consecutivo }}</td>
    <td>{{ formatDate(item.createdAt) }}</td>
    <td>{{ item.entregadoPor }}</td>
    <td class="text-uppercase">
      <span :class="getEstadoClass(item.estado)">{{ item.estado }}</span>
    </td>
    <td>{{ formatDate(item.fechaEntrega) }}</td>
    <td>{{ item.observaciones }}</td>
    <td>
      <button
        v-if="item.pdfPath"
        class="custom-btn pdf"
        style="height: 22px !important"
        @click="downloadFile(item.pdfPath)"
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
      <span v-else>N/A</span>
    </td>
    <td>{{ item.prescinto || 'N/A' }}</td>
    <td>
      <img
        v-if="item.signatureA"
        :src="item.signatureA"
        alt="Firma A"
        style="max-width: 100px; max-height: 50px;"
      />
      <span v-else>N/A</span>
    </td>
    <td>
      <img
        v-if="item.signatureB"
        :src="item.signatureB"
        alt="Firma B"
        style="max-width: 100px; max-height: 50px;"
      />
      <span v-else>N/A</span>
    </td>
    <td>{{ item.sticker || 'N/A' }}</td>
    <td>{{ item.timestamp }}</td>
    <td>{{ formatDate(item.updatedAt) }}</td>

    <!-- Botón Confirmar -->
    <td>
      <!-- Mostrar el botón sólo si el estado no es 'ENTREGA CONFIRMADA' -->
      <button
        v-if="item.estado !== 'ENTREGA CONFIRMADA'"
        class="custom-btn"
        @click="confirmEntrega(item)"
      >
        Confirmar
      </button>
      <!-- Si ya está confirmada, podrías mostrar un texto o nada -->
      <span v-else class="text-success fw-bold">Confirmada</span>
    </td>
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
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
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
      const searchTermLower = this.searchTerm.toLowerCase();
      return this.prestamos.filter((item) => {
        return (
          String(item.id).toLowerCase().includes(searchTermLower) ||
          String(item.clienteId).toLowerCase().includes(searchTermLower) ||
          String(item.consecutivo).toLowerCase().includes(searchTermLower) ||
          (item.entregadoPor &&
            item.entregadoPor.toLowerCase().includes(searchTermLower)) ||
          (item.estado && item.estado.toLowerCase().includes(searchTermLower)) ||
          (item.observaciones &&
            item.observaciones.toLowerCase().includes(searchTermLower))
        );
      });
    },
  },
  async mounted() {
    await this.fetchEstados();
    await this.fetchPrestamos();
  },
  methods: {
    getEstadoClass(estado) {
      if (!estado) return "text-secondary";
      const estadoLower = estado.toLowerCase();
      if (estadoLower.includes("pendiente")) return "text-warning fw-bold";
      if (estadoLower.includes("entregado")) return "text-success fw-bold";
      if (estadoLower.includes("rechazado")) return "text-danger fw-bold";
      if (estadoLower.includes("anulado")) return "text-muted fw-bold";
      return "text-secondary fw-bold";
    },

    async fetchEstados() {
      try {
        const response = await apiClient.post("/api/estados/listar", {
          tipo: "devolucion",
        });
        this.estadosDisponibles = response.data.data || ["TODOS"];
      } catch (error) {
        console.error("Error al obtener los estados:", error);
      }
    },

    async fetchPrestamos() {
      this.loaderStore.showLoader();
      try {
        const clienteId = this.authStore.clienteId;
        if (!clienteId) {
          console.error("Error: Cliente ID no encontrado.");
          this.loaderStore.hideLoader();
          return;
        }

        const requestBody = { clienteId: clienteId };
        const response = await apiClient.post("/api/entregas/listar", requestBody);

        this.prestamos = response.data.data.map((entrega) => ({
          id: entrega.id,
          clienteId: entrega.clienteId,
          consecutivo: entrega.consecutivo,
          createdAt: entrega.createdAt,
          entregadoPor: entrega.entregadoPor,
          estado: entrega.estado,
          fechaEntrega: entrega.fechaEntrega,
          observaciones: entrega.observaciones,
          pdfPath: entrega.pdfPath,
          prescinto: entrega.prescinto,
          signatureA: entrega.signatureA,
          signatureB: entrega.signatureB,
          sticker: entrega.sticker,
          timestamp: entrega.timestamp,
          updatedAt: entrega.updatedAt,
        }));
      } catch (error) {
        console.error("Error al obtener datos de entregas:", error);
      } finally {
        this.loaderStore.hideLoader();
      }
    },

    formatDate(date) {
      return date ? dayjs(date).locale("es").format("DD/MM/YYYY HH:mm") : "N/A";
    },

    downloadFile(url) {
      if (url) {
        window.open(url, "_blank");
      } else {
        console.warn("URL del archivo no disponible.");
      }
    },

    exportToExcel() {
      const ws = XLSX.utils.json_to_sheet(
        this.filteredPrestamos.map((item) => ({
          ID: item.id,
          "Cliente ID": item.clienteId,
          Consecutivo: item.consecutivo,
          Creado: this.formatDate(item.createdAt),
          "Entregado Por": item.entregadoPor,
          Estado: item.estado,
          "Fecha Entrega": this.formatDate(item.fechaEntrega),
          Observaciones: item.observaciones,
          "Ruta PDF": item.pdfPath || "N/A",
          Prescinto: item.prescinto || "N/A",
          "Firma A": item.signatureA || "N/A",
          "Firma B": item.signatureB || "N/A",
          Sticker: item.sticker || "N/A",
          Timestamp: item.timestamp,
          Actualizado: this.formatDate(item.updatedAt),
        }))
      );

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Entregas");
      XLSX.writeFile(wb, `Bodegapp_Entregas_${dayjs().format("YYYY-MM-DD")}.xlsx`);
    },

    /**
     * Método para confirmar la entrega de un registro específico.
     * - Muestra SweetAlert con info relevante.
     * - Si se confirma, llama al endpoint PUT /api/entregas/confirmar.
     * - Muestra un toast con el resultado y actualiza el estado.
     */
    async confirmEntrega(item) {
      // Prepara la información a mostrar en el SweetAlert
      const htmlInfo = `
        <div style="text-align:left;">
          <p><strong>ID:</strong> ${item.id}</p>
          <p><strong>Cliente ID:</strong> ${item.clienteId}</p>
          <p><strong>Consecutivo:</strong> ${item.consecutivo}</p>
          <p><strong>Observaciones:</strong> ${item.observaciones || "N/A"}</p>
        </div>
      `;

      const result = await Swal.fire({
        title: "Confirmar entrega",
        html: htmlInfo,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Sí, confirmar",
        cancelButtonText: "Cancelar",
      });

      if (result.isConfirmed) {
        try {
          this.loaderStore.showLoader();

          // Objeto que requiere tu endpoint
          const requestBody = {
            entregaId: item.id,
            estado: "ENTREGA CONFIRMADA",
            clienteId: item.clienteId,
          };

          // Llamada al endpoint PUT
          const response = await apiClient.put("/api/entregas/confirmar", requestBody);

          // Si el endpoint retorna un mensaje, úsalo en el toast
          const mensaje = response.data.message || "Entrega confirmada exitosamente";

          // Actualiza el estado en la tabla (para reflejar el cambio sin recargar)
          item.estado = "ENTREGA CONFIRMADA";

          // Muestra un SweetAlert tipo toast de éxito
          Swal.fire({
            icon: "success",
            title: mensaje,
            toast: true,
            position: "bottom-end",
            showConfirmButton: false,
            timer: 3000,
          });
        } catch (error) {
          console.error("Error al confirmar entrega:", error);

          // Muestra un toast de error
          Swal.fire({
            icon: "error",
            title: "Error al confirmar",
            text: error.response?.data?.message || "Ocurrió un error",
            toast: true,
            position: "bottom-end",
            showConfirmButton: false,
            timer: 3000,
          });
        } finally {
          this.loaderStore.hideLoader();
        }
      }
    },
  },
};

</script>

<style scoped>
/* Estilos para la tabla (mantenidos) */
.table-container {
  max-height: calc(100vh - 195px); /* Ajusta según la altura deseada */
  overflow-y: auto; /* Agrega scroll vertical */
  border: 1px solid #dddddd;
  position: relative; /* Mantiene la posición de la tabla */
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  position: sticky;
  top: 0;
  background-color: #e5e5e5; /* Fondo fijo */
  z-index: 100; /* Asegura que esté por encima de los datos */
  box-shadow: 0 2px 2px -1px rgba(0, 0, 0, 0.2);
}
/* Estilos para los botones personalizados (si los tienes) */
.custom-btn {
  /* ... tus estilos ... */
}
</style>