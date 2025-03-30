<template>
  <div class="inventario-container px-3 py-0 mt-0">
    <!-- Encabezado con filtro de estado, búsqueda y exportación a Excel -->
    <div class="card shadow">
      <div class="card-header px-0 py-0">
        <div class="row align-items-center m-0 p-0 py-3 d-flex justify-content-between">
          <!-- Selector de Estado -->
          <div class="col-auto">
            <div class="custom-select">
              <select v-model="selectedEstado" @change="fetchtransferencias">
                <option value="TODOS">TODOS</option>
                <option v-for="estado in estadosDisponibles" :key="estado" :value="estado">
                  {{ estado }}
                </option>
              </select>
            </div>
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
          <table class="table table-sm table-bordered table-hover sticky-content">
            <thead class="sticky-header">
              <tr>
                <th>ID</th>
                <th>Estado</th>
                <th>Fecha Solicitud</th>
                <th>Usuario</th>
                <th>Observaciones</th>
                <th>Creado</th>
                <th>Actualizado</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in filteredtransferencias" :key="item.id || index" @click="showDetalle(item.id)"
                style="cursor: pointer">
                <td>{{ item.id }}</td>
                <td class="text-uppercase">
                  <span :class="getEstadoClass(item.estado)">
                    {{ item.estado }}
                  </span>
                </td>
                <td>{{ formatDate(item.fechaSolicitud) }}</td>
                <td>{{ item.usuarioCarga || item.usuarioVerifica }}</td>
                <td>{{ item.observaciones }}</td>
                <td>{{ formatDate(item.createdAt) }} - {{ formatTime(item.createdAt) }}</td>
                <td>{{ formatDate(item.updatedAt) }} - {{ formatTime(item.updatedAt) }}</td>
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
            <i class="bi bi-truck me-2"></i>Detalle de Transporte
          </h5>
        </div>
        <div class="modal-body p-2 m-2">
          <div v-if="loadingDetalle">
            <p>Cargando detalle...</p>
          </div>
          <div v-else>
            <div class="card-modal p-3 mb-3">
              <h6 class="mb-2">Solicitud</h6>
              <div class="row">
                <!-- Columna 1 -->
                <div class="col-md-6">
                  <p class="mb-1">
                    <strong>ID:</strong> {{ detalle.solicitud.id }}
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
            <hr />
            <h6>Detalle de la Transferencia</h6>
            <div class="scroll-container">
              <table class="table table-bordered table-sm">
                <thead>
                  <tr class="text-center">
                    <th>ID</th>
                    <th>Tipo</th>
                    <th>Referencia 2</th>
                    <th>Referencia 3</th>
                    <th>Estado</th>
                    <th>Descripción</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in detalle.detalle" :key="item.id" class="text-center">
                    <td>{{ item.id }}</td>
                    <td>{{ item.tipo }}</td>
                    <td>{{ item.referencia2 }}</td>
                    <td>{{ item.referencia3 }}</td>
                    <td>{{ item.estado }}</td>
                    <td>{{ item.descripcion }}</td>
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
import solicitarTransferencia from "./solicitarTransferencia.vue";
import * as XLSX from "xlsx";
import { useClientStore } from "@/stores/clientStore";
import { DateTime } from "luxon";



export default {
  name: "transferenciasTable",
  components: {
    solicitarTransferencia,
  },
  data() {
    return {
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
    filteredtransferencias() {
      const term = this.searchTerm.toLowerCase();
      return this.transferencias.filter((item) => {
        return (
          (item.referencia1 || "").toLowerCase().includes(term) ||
          (item.referencia2 || "").toLowerCase().includes(term) ||
          (item.referencia3 || "").toLowerCase().includes(term) ||
          (item.cliente_nombre || "").toLowerCase().includes(term) ||
          (item.usuario_nombre || "").toLowerCase().includes(term) ||
          String(item.id).toLowerCase().includes(term)
        );
      });
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
      // Muestra el modal y consulta el detalle de la transferencia
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
      // Reiniciamos el detalle si es necesario
      this.detalle = { solicitud: {}, detalle: [] };
    },
    showSolicitarTransferencia() {
      this.clientStore.setShowSolicitudTransporte(
        !this.clientStore.getShowSolicitudTransporte
      );
      console.log("Mostrar Solicitud:", this.clientStore.getShowSolicitudTransporte);
    },
    async fetchEstados() {
      try {
        const payload = {
          tipo: "Desarchivo",
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
    // Filtrar las transferencias que tengan modulo igual a "transferencia"
    this.transferencias = (response.data.data || []).filter(item => 
      item.modulo && item.modulo.toLowerCase() === "devolucion"
    );
    console.log(response);
    useLoaderStore().hideLoader();
  } catch (error) {
    console.error("Error al obtener datos de transferencias:", error);
  }
},

    handleReloadData() {
      this.fetchtransferencias();
    },
    getEstadoClass(estado) {
      if (!estado) return "text-secondary";
      const estadoLower = estado.toLowerCase();
      if (estadoLower.includes("disponible")) return "fw-bold text-success";
      if (estadoLower.includes("solicitado")) return "fw-bold text-warning";
      if (estadoLower.includes("entrega")) return "fw-bold text-primary";
      if (estadoLower.includes("progreso")) return "fw-bold text-info";
      if (estadoLower.includes("devuelto")) return "fw-bold text-success";
      if (estadoLower.includes("rechazado")) return "fw-bold text-danger";
      if (estadoLower.includes("anulado")) return "fw-bold text-muted";
      return "text-secondary fw-bold";
    },
    // Retorna la fecha formateada "dd/MM/yyyy" en la zona de Bogotá
    formatDate(dateString) {
      if (!dateString) return "N/A";
      const dt = DateTime.fromISO(dateString, { zone: "utc" });
      return dt.setLocale("es").toFormat("dd/MM/yyyy");
    },
    // Retorna la hora formateada "HH:mm" en la zona de Bogotá
    formatTime(dateString) {
      if (!dateString) return "N/A";
      const dt = DateTime.fromISO(dateString, { zone: "utc" });
      return dt.setLocale("es").toFormat("hh:mm a");
    },



    exportToExcel() {
      const dataToExport = this.filteredtransferencias.map((item) => ({
        ID: item.id,
        Cliente: item.cliente_nombre,
        Usuario: item.usuario_nombre || (item.usuarioCarga || item.usuarioVerifica),
        Objeto: item.objeto,
        Bodega: item.bodega,
        "Referencia 1": item.referencia1,
        "Referencia 2": item.referencia2,
        "Referencia 3": item.referencia3,
        Estado: item.estado,
        Modalidad: item.modalidad,
        "Dirección Entrega": item.direccion_entrega,
        Observaciones: item.observaciones,
        "Fecha Estimada": this.formatDate(item.fechaEstimada),
        "URL PDF": item.urlPdf || "N/A",
      }));
      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "transferencias");
      XLSX.writeFile(wb, `Bodegapp_transferencias_${dayjs().format("YYYY-MM-DD")}.xlsx`);
    },
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
</style>
