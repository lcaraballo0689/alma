<template>
  <div class="inventario-container px-3 py-0 mt-0">
    <div class="card shadow">
      <div class="card-header px-0 py-0">
        <div class="row align-items-center m-0 p-0 py-3 d-flex justify-content-between">
          <div class="col-auto d-flex align-items-center gap-2">
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
                <th>Estado</th>
                <th>Fecha Solicitud</th>
                <th>Observaciones</th>
                <th>Creado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody class="sticky-body">
              <tr
                v-for="(item, index) in filteredTransferencias"
                :key="item.id || index"
              >
                <td>{{ item.id }}</td>
                <td class="text-uppercase">
                  <span class="fw-bold text-danger">PEDIENTE POR CONFIRMAR </span>
                </td>
                <td>{{ formatDate(item.fechaSolicitud) }}</td>
                <td>{{ item.observaciones || "N/A" }}</td>
                <td>{{ formatDate(item.createdAt) }}</td>
                <td>
                  <button class="btn btn-sm btn-dark" @click="abrirConfirmacion(item.id)">
                    Confirmar
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-if="modalVisible" class="modal-wrapper">
      <div class="modal-content">
        <div class="modal-header card d-flex justify-content-between">
          <h5 class="modal-title">
            <i class="bi bi-info-circle me-2"></i>Detalle de la Entrega
          </h5>
          <button class="btn-close" @click="cerrarModal"></button>
        </div>
        <div class="modal-body">
          <div v-if="loadingDetalle">
            <p>Cargando...</p>
          </div>
          <div v-else>
            <p><strong>ID:</strong> {{ detalle.id }}</p>
            <p><strong>Estado:</strong> {{ detalle.estado }}</p>
            <p><strong>Observaciones:</strong> {{ detalle.observaciones || 'N/A' }}</p>
            <p><strong>Fecha Solicitud:</strong> {{ formatDate(detalle.fechaSolicitud) }}</p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="cerrarModal">Cerrar</button>
          <button class="btn btn-success" @click="confirmarEntrega">Confirmar Entrega</button>
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

export default {
  name: "TransferenciasPorConfirmar",
  data() {
    return {
      transferencias:[],
      searchTerm: "",
      modalVisible: false,
      loadingDetalle: false,
      detalle: {},
      solicitudIdActual: null,
    };
  },
  computed: {
    filteredTransferencias() {
      return this.transferencias.filter(
        (item) =>
          item.estado.toLowerCase() === "entregado por transportador" &&
          (item.observaciones || "").toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    },
  },
  mounted() {
    this.obtenerTransferencias();
  },
  methods: {
    async confirmarEntrega() {
      try {
        if (!this.solicitudIdActual) {
          console.error("No hay ID de solicitud actual.");
          return; // Salir de la función si no hay ID
        }

        const body = {
          qrToken: `solicitud_${this.solicitudIdActual}`,
          accion: "entrega Confirmada",
          usuarioId: 1,
          clienteId: 2,
        };
        console.log("body: ", body);

        const response = await apiClient.post("/api/transferencias/qr/scan", body);
        //this.selectedTransferencia.estado = response.data.NuevoEstado || accion;
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
        const clienteId = 2; // Ajustar según authStore si lo usas
        const response = await apiClient.post("/api/transferencias/consultar", { clienteId });
        this.transferencias = response.data.data;
      } catch (error) {
        console.error("Error al obtener transferencias:", error);
      }
    },
    async abrirConfirmacion(id) {
      this.modalVisible = true;
      this.loadingDetalle = true;
      this.solicitudIdActual = id;

      try {
        const response = await apiClient.post("/api/transferencias/detalle", { solicitudId: id });
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
    formatDate(date) {
      return date ? dayjs(date).locale("es").format("DD/MM/YYYY HH:mm") : "N/A";
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