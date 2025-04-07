<template>
  <div class="inventario-container px-3 py-0 mt-0">
    <div class="card shadow">
      <div class="card-header px-0 py-0">
        <div class="row align-items-center m-0 p-0 py-3 d-flex justify-content-between">
          
          <div class="col">
            <button class="tab-button me-2" :class="['tab-button', { active: activeTab === 'entregado' }]"
              @click="activeTab = 'entregado'">
              <strong>Pendientes</strong>
            </button>
            <button class="tab-button" :class="['tab-button', { active: activeTab === 'completado' }]"
              @click="activeTab = 'completado'">
              <strong>Confirmadas</strong>
            </button>
          </div>

          <div class="col d-flex justify-content-end">
            <div class="custom-search">
              <i class="bi bi-search search-icon"></i>
              <input type="text" class="form-control form-control-sm" placeholder="Buscar" v-model="searchTerm" />
            </div>
          </div>
          
        </div>
      </div>

      <!-- Pestañas para filtrar por estado -->
      <div class="card-body p-0">


        <div class="table-container">
          <table class="table table-sm table-bordered table-hover sticky-content">
            <thead class="sticky-header">
              <tr>
                <th>ID</th>
                <th>Estado</th>
                <th v-if="activeTab !== 'entregado'">Recibido por</th>
                <th>Direccion de Entrega</th>
                <th>Fecha Solicitud</th>
                <th v-if="activeTab !== 'entregado'">Fecha Confirmacion</th>
                <th v-if="activeTab === 'entregado'">Acciones</th>
              </tr>
            </thead>
            <tbody class="sticky-body">
              <tr v-for="(t, index) in filteredTransferencias" :key="t.id || index" class="text-center">
                <td>{{ t.id }}</td>

                <td>{{ t.estado}}</td>
                <td v-if="activeTab !== 'entregado'">{{ t.usuarioVerifica }}</td>
                <td>{{ t.direccion }}</td>
                <td>{{ formatDate(t.fechaSolicitud) }} {{ formatTime(t.fechaSolicitud) }}</td>
                <td>{{ formatDate(t.fechaVerificacion) }} {{ formatTime(t.fechaVerificacion) }}</td>
                <td v-if="activeTab === 'entregado'">
                  <button class="btn btn-sm btn-outline-success" @click="confirmarEntrega(t.id)">Confirmar</button>
                </td>
              </tr>
              <tr v-if="!filteredTransferencias.length">
                <td colspan="7" class="text-center py-3">
                  <i class="bi bi-exclamation-circle me-2"></i>
                  No hay solicitudes registradas.
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
import dayjs from "dayjs";
import "dayjs/locale/es";
import Swal from "sweetalert2";
import { DateTime } from "luxon";

export default {
  name: "TransferenciasPorConfirmar",
  data() {
    return {
      transferencias: [],
      searchTerm: "",
      activeTab: "entregado", // Valor inicial: 'entregado' o 'completado'
      modalVisible: false,
      loadingDetalle: false,
      detalle: {},
      solicitudIdActual: null,
    };
  },
  computed: {
    filteredTransferencias() {
      // Filtrar en función de activeTab y el término de búsqueda
      return this.transferencias.filter((item) => {
        const estado = (item.estado || "").toLowerCase();
        const search = this.searchTerm.toLowerCase();
        if (this.activeTab === "entregado") {
          return item.estado === "entregado por transportador" && (item.observaciones || "").toLowerCase().includes(search);
        } else if (this.activeTab === "completado") {
          return  item.estado === "entrega Confirmada";
        }
        return true;
      });
    },
  },
  mounted() {
    this.obtenerTransferencias();
  },
  methods: {
    async confirmarEntrega(idSolicitud) {
      try {
        if (!idSolicitud) {
          console.error("No hay ID de solicitud actual.");
          return;
        }
        const body = {
          qrToken: `solicitud_${idSolicitud}`,
          accion: "entrega Confirmada",
          usuarioId: 1,
          clienteId: 2,
        };
        console.log("body: ", body);
        const response = await apiClient.post("/api/transferencias/qr/scan", body);
        console.log('qr', response);
        
        await this.obtenerTransferencias();
        this.cerrarModal();
        Swal.fire({
          toast: true,
          position: "bottom-end",
          icon: "success",
          title: `Entrega Confirmada`,
          timer: 10000,
          timerProgressBar: true,
          showConfirmButton: false,
        });
      } catch (error) {
        console.error("Error al cambiar estado:", error);
      }
    },
    async obtenerTransferencias() {
      try {
        const clienteId = 2; // Ajusta según corresponda
        const response = await apiClient.post("/api/transferencias/consultar", { clienteId });
        this.transferencias = response.data.data;
        console.log("tranferencias: ", this.transferencias);
        
      } catch (error) {
        console.error("Error al obtener transferencias:", error);
      }
    },
    async abrirConfirmacion(item) {
      this.modalVisible = true;
      this.loadingDetalle = true;
      this.solicitudIdActual = item.id;
      try {
        const response = await apiClient.post("/api/transferencias/detalle", { solicitudId: item.id });
        this.detalle = response.data.solicitud || {};
      } catch (error) {
        console.error("Error al obtener detalle:", error);
      } finally {
        this.loadingDetalle = false;
      }
    },
    cerrarModal() {
      this.modalVisible = false;
      this.detalle = {};
      this.solicitudIdActual = null;
    },
    // Retorna la fecha formateada "dd/MM/yyyy" en la zona de Bogotá
    formatDate(dateString) {
      if (!dateString) return "N/A";
      const dt = DateTime.fromISO(dateString, { zone: "utc" });
      return dt.setLocale("es").toFormat("dd/MM/yyyy");
    },
    // Retorna la hora formateada "HH:mm" en la zona de Bogotá
    formatTime(dateString) {
      if (!dateString) return "";
      const dt = DateTime.fromISO(dateString, { zone: "utc" });
      return dt.setLocale("es").toFormat("hh:mm a");
    },
    seleccionarTransferencia(item) {
      // Método para abrir el modal de confirmación para el ítem seleccionado
      this.abrirConfirmacion(item);
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

/* Botón con apariencia moderna */
.tab-button {

  align-items: center;
  justify-content: space-between;
  background: #e5e5e5;
  border-radius: 50px;
  padding: 5px 15px;
  font-size: 14px;
  font-weight: bold;
  color: #333;
  text-transform: uppercase;
  border: none;
  cursor: pointer;
  position: relative;
  height: 31px;
  min-width: 150px;
  transition: background 0.3s ease-in-out, transform 0.2s ease-in-out;
  box-shadow: 1px 1px 3px rgba(0, 0, 0, 0.1);
}

.tab-button:hover {
  background: #d4d4d4;
  transform: translateY(-1px);
}

/* Estado activo */
.tab-button.active {
  background: #c9c9c9 !important;
  box-shadow: inset 2px 2px 4px rgba(0, 0, 0, 0.2);
}

.tab-button i {
  margin-right: 8px;
  font-size: 16px;
}


.modal-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-content {
  background: white;
  border-radius: 10px;
  width: 90%;
  max-width: 600px;
  padding: 20px;
}

.modal-header,
.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
