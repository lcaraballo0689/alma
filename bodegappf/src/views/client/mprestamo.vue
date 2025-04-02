<template>
  <div class="inventario-container px-3 py-0 mt-0">
    <!-- Encabezado con filtro de estado, búsqueda y exportación a Excel -->
    <div class="card shadow">
      <div class="card-header px-0 py-0">
        <div class="row align-items-center m-0 p-0 py-3 d-flex justify-content-between">
          <!-- Selector de Estado -->
          <div class="col-auto">
            <!-- <div class="custom-select">
              <select v-model="selectedEstado" @change="fetchtransferencias">
                <option value="TODOS">TODOS</option>
                <option v-for="estado in estadosDisponibles" :key="estado" :value="estado">
                  {{ estado }}
                </option>
              </select>
            </div> -->
            <strong>REPORTE DE PRESTAMOS</strong> 
          </div>

          <!-- Botones de Solicitar Transferencia, Excel y Búsqueda -->
          <div class="col-auto d-flex align-items-center gap-2">
            <button class="custom-btn excel me-2" @click="exportToExcel" @mouseover="hoveredButton = 'excel'"
              @mouseleave="hoveredButton = ''">
              <i :class="hoveredButton === 'excel' ? 'bi bi-arrow-down-circle-fill' : 'bi bi-file-excel-fill'"></i>
              <span v-if="hoveredButton !== 'excel'">Excel</span>
              <span v-else>Descargar</span>
            </button>
            <div class="custom-search">
              <i class="bi bi-search search-icon"></i>
              <input type="text" class="form-control form-control-sm" placeholder="Buscar" v-model="searchTerm" />
            </div>
          </div>
        </div>
      </div>

      <!-- Tabla principal -->
      <div class="card-body m-0 p-0">
        <div class="table-container">
          <table class="table-compact table table-hover">
            <thead>
              <tr>
                <th>ID</th>
                <th>Traslado N°</th>
                <th>Estado</th>
                <th>Ultima Actualizacion</th>
                <th>Fecha Solicitud</th>
                <th>Transportista</th>
                <th>Documento de Identidad</th>
                <th>Placa Vehiculo</th>
                <th>Fecha Asignación</th>
                <th>Fecha Entrega</th>
                <th>Confirmo Entrega</th>
                <th>Fecha de Confirmacion</th>
                <th>Observaciones</th>
                <th>Dirección</th>
              </tr>
            </thead>
            <tbody>
              <!-- Se itera sobre la propiedad computada registrosFiltrados -->
              <tr v-for="(item, index) in registrosFiltrados" :key="item.id || index" @click="showDetalle(item.id)" style="cursor: pointer;">
                <td>{{ item.consecutivo }}</td>
                <td>{{ item.id }}</td>
                <td>{{ item.estado }}</td>
                <td>
                  {{ item.updatedAt !== item.createdAt
                    ? formatDate(item.updatedAt) + ' - ' + formatTime(item.updatedAt)
                    : 'Sin Actualizacion' }}
                </td>
                <td>{{ formatDate(item.createdAt) }} - {{ formatTime(item.createdAt) }}</td>
                <td>{{ item.transportista || 'Sin Asignar'}}</td>
                <td>{{ item.documentoIdentidad }}</td> 
                <td>{{ item.placa }}</td> 
                <td>{{ item.fechaAsignacion ? formatDate(item.fechaAsignacion) : 'Pendiente' }}</td>
                <td>{{ item.fechaCarga ? formatDate(item.fechaCarga) : 'Pendiente' }}</td>
                <td>{{ item.usuarioVerifica || 'Sin Confirmar' }}</td>
                <td>{{ item.fechaVerificacion ? formatDate(item.fechaVerificacion) : 'Pendiente' }}</td>
                <td>{{ item.observaciones }}</td>
                <td>{{ item.direccion }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal integrado para el detalle de transporte -->
    <div v-if="detalleVisible" class="modal-wrapper">
      <div class="modal-content">
        <div class="modal-header card d-flex justify-content-start">
          <h5 class="modal-title">
            <i class="bi bi-truck me-2"></i>Detalle de Prestamo
          </h5>
        </div>
        <div class="modal-body p-2 m-2">
          <div v-if="loadingDetalle">
            <p>Cargando detalle...</p>
          </div>
          <div v-else>
            <div class="card-modal p-3 mb-3">
              <div class="row">
                <!-- Columna 1 -->
                <div class="col-md-6">
                  <p class="mb-1">
                    <strong>Traslado N°:</strong> {{ detalle.solicitud.id }}
                  </p>
                  <p class="mb-1">
                    <strong>Estado:</strong> {{ detalle.solicitud.estado }}
                  </p>
                </div>
                <!-- Columna 2 -->
                <div class="col-md-6">
                  <p class="mb-1">
                    <strong>Observaciones:</strong> {{ detalle.solicitud.observaciones }}
                  </p>
                  <p class="mb-1">
                    <strong>Fecha Solicitud:</strong>
                    {{ formatDate(detalle.solicitud.fechaSolicitud) }}
                  </p>
                </div>
              </div>
            </div>
            <div class="scroll-container">
              <table class="table table-bordered table-sm">
                <thead>
                  <tr class="text-center">
                    <th>Tipo</th>
                    <th>Referencia 2</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in detalle.detalle" :key="item.id" class="text-center">
                    <td>{{ item.tipo }}</td>
                    <td>{{ item.referencia2 }}</td>
                    <td>{{ item.estado }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="custom-btn me-2" @click="closeDetalleModal">
            <span>Cerrar</span>
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
import apiClient from "@/services/api";
import { useAuthStore } from "@/stores/authStore";
import { useLoaderStore } from "@/stores/loaderStore";
import * as XLSX from "xlsx";
import { useClientStore } from "@/stores/clientStore";
import { DateTime } from "luxon";

export default {
  name: "Prestamos",
  data() {
    const today = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"
    return {
      totalRegistros: null,
      fechaDesde: today,
      fechaHasta: today,
      selectedEstado: "TODOS",
      estadosDisponibles: [],
      transferencias: [],
      searchTerm: "",
      hoveredButton: "",
      // Variables para el detalle integrado
      detalleVisible: false,
      loadingDetalle: false,
      detalle: {
        solicitud: {},
        detalle: [],
      },
    };
  },
  computed: {
    clientStore() {
      return useClientStore();
    },
    // Computed property para formatear fechas
    maxDate() {
      return new Date().toISOString().split("T")[0];
    },
    // Nueva propiedad computada de filtrado (basada en el ejemplo)
    registrosFiltrados() {
      if (!this.searchTerm) return this.transferencias;
      const termino = this.searchTerm.toLowerCase();
      return this.transferencias.filter(registro => {
        return (
          String(registro.id).toLowerCase().includes(termino) ||
          (registro.referencia1 || "").toLowerCase().includes(termino) ||
          (this.formatDate(registro.fechaSolicitud) || "").toLowerCase().includes(termino)
        );
      });
    },
    // Funciones de formateo utilizando Luxon
    formatDate() {
      return (dateString) => {
        if (!dateString) return "N/A";
        const dt = DateTime.fromISO(dateString, { zone: "utc" });
        return dt.setLocale("es").toFormat("dd/MM/yyyy");
      };
    },
    formatTime() {
      return (dateString) => {
        if (!dateString) return "N/A";
        const dt = DateTime.fromISO(dateString, { zone: "utc" });
        return dt.setLocale("es").toFormat("hh:mm a");
      };
    },
  },
  mounted() {
    this.fetchEstados();
    this.fetchtransferencias();
  },
  methods: {
    showDetalle(solicitudId) {
      console.log("ID solicitud transferencia:", solicitudId);
      this.loadingDetalle = true;
      this.detalleVisible = true;
      apiClient
        .post("/api/transferencias/detalle", { solicitudId })
        .then((response) => {
          const data = response.data;
          this.detalle.solicitud = data.solicitud || {};
          this.detalle.detalle = data.detalle || [];
        })
        .catch((error) => {
          console.error("Error al obtener el detalle de transferencia:", error);
        })
        .finally(() => {
          this.loadingDetalle = false;
        });
    },
    closeDetalleModal() {
      this.detalleVisible = false;
      this.detalle = { solicitud: {}, detalle: [] };
    },
    async fetchEstados() {
      try {
        const payload = {
          tipo: "prestamo",
          clienteId: useAuthStore().clienteId,
        };
        console.log("Payload listar estados:", payload);
        const response = await apiClient.post("/api/estados/listar", payload);
        this.estadosDisponibles = response.data.data || ["TODOS"];
        console.log("Estados:", this.estadosDisponibles);
      } catch (error) {
        console.error("Error al obtener los estados:", error);
      }
    },
    async fetchtransferencias() {
      try {
        const clienteId = useAuthStore().clienteId;
        if (!clienteId) {
          console.error("❌ Error: Cliente ID no encontrado.");
          return;
        }
        const requestBody = { clienteId };
        const response = await apiClient.post("/api/transferencias/consultar", requestBody);
        // Filtrar las transferencias que tengan modulo igual a "prestamo"
        this.transferencias = (response.data.data || []).filter(item =>
          item.modulo && item.modulo.toLowerCase() === "prestamo"
        );
        this.totalRegistros = response.data.data.length;
        console.info(response.data.data);
        console.info(this.totalRegistros);
        useLoaderStore().hideLoader();
      } catch (error) {
        console.error("Error al obtener datos de transferencias:", error);
      }
    },
    handleReloadData() {
      this.fetchtransferencias();
    },
    exportToExcel() {
  const dataToExport = this.transferencias.map(item => ({
    "Consecutivo": item.consecutivo,
    "Traslado N°": item.id,
    "Estado": item.estado,
    "Ultima Actualizacion": item.updatedAt !== item.createdAt 
      ? this.formatDate(item.updatedAt) + ' - ' + this.formatTime(item.updatedAt)
      : 'Sin Actualizacion',
    "Fecha Solicitud": this.formatDate(item.createdAt) + ' - ' + this.formatTime(item.createdAt),
    "Transportista": item.transportista || 'Sin Asignar',
    "Documento de Identidad": item.documentoIdentidad,
    "Placa Vehiculo": item.placa,
    "Fecha Asignación": item.fechaAsignacion ? this.formatDate(item.fechaAsignacion) : 'Pendiente',
    "Fecha Entrega": item.fechaCarga ? this.formatDate(item.fechaCarga) : 'Pendiente',
    "Confirmo Entrega": item.usuarioVerifica || 'Sin Confirmar',
    "Fecha de Confirmacion": item.fechaVerificacion ? this.formatDate(item.fechaVerificacion) : 'Pendiente',
    "Observaciones": item.observaciones,
    "Dirección": item.direccion
  }));
  
  const ws = XLSX.utils.json_to_sheet(dataToExport);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "transferencias");
  XLSX.writeFile(wb, `Bodegapp_transferencias_${new Date().toISOString().split("T")[0]}.xlsx`);
}

  },
};
</script>

<style scoped>
.modal-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 999;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.modal-content {
  background: #fff;
  border-radius: 20px;
  width: 100%;
  max-width: 800px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
}

.modal-header,
.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
}

.card-modal {
  background-color: #f4f4f5;
  border-radius: 15px;
}

.modal-footer {
  border-top: 1px solid #dee2e6;
}

.modal-body {
  padding: 1rem;
  overflow: auto;
}

.scroll-container {
  max-height: 200px;
  overflow-y: auto;
}

.table-compact {
  font-size: 0.8rem;
  width: 100%;
  border-collapse: collapse;
}

.table-compact thead th {
  position: sticky;
  top: 0;
  background-color: #f2f2f2;
  z-index: 2;
}

.table-compact tbody td:first-child,
.table-compact thead th:first-child {
  position: sticky;
  left: 0;
  margin-left: -10px;
  background-color: #c5c5c5;
  z-index: 1;
}

.table-compact thead th:first-child {
  z-index: 3;
}

.table-compact th,
.table-compact td {
  padding: 0.4rem;
  border: 1px solid #ddd;
  white-space: nowrap;
}

.table-compact thead {
  background-color: #f2f2f2;
}
</style>
