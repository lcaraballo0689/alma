<template>
  <div
    v-if="isVisible"
    class="modal-wrapper"
    style="border-radius: 50px 50x 0px 0px !important"
  >
    <div
      class="modal-content"
      style="border-radius: 50px 50x 0px 0px !important"
    >
      <div
        class="modal-header card d-flex justify-content-start"
        style="border-radius: 50px 50x 0px 0px !important"
      >
        <h5 class="modal-title">
          <i class="bi bi-truck me-2"></i>Detalle de Transporte
        </h5>
      </div>
      <div class="modal-body p-2 m-2">
        <div v-if="loading">
          <p>Cargando detalle...</p>
        </div>
        <div v-else>
          <div class="card-modal p-3 mb-3">
            <h6 class="mb-2">Solicitud</h6>
            <div class="row">
              <!-- Columna 1 -->
              <div class="col-md-6">
                <p class="mb-1"><strong>ID:</strong> {{ solicitud.id }}</p>
                <p class="mb-1">
                  <strong>Estado:</strong> {{ solicitud.estado }}
                </p>
              </div>
              <!-- Columna 2 -->
              <div class="col-md-6">
                <p class="mb-1">
                  <strong>Observaciones:</strong> {{ solicitud.observaciones }}
                </p>
                <p class="mb-1">
                  <strong>Fecha Solicitud:</strong>
                  {{ formatDate(solicitud.fechaSolicitud) }}
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
                <tr v-for="item in detalle" :key="item.id" class="text-center">
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
        <button class="custom-btn me-2" @click="closeModal">
          <span>Cerrar</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import apiClient from "@/services/api";
import { useClientStore } from "@/stores/clientStore";

export default {
  name: "DetalleTransporte",
  props: {
    solicitudId: {
      type: Number,
      required: true,
    },
  },
  data() {
    return {
      isVisible: true,
      loading: false,
      solicitud: {},
      detalle: [],
      clientStore: null,
      solicitudId: solicitudId,
    };
  },
  created() {
    this.clientStore = useClientStore();
  },
  methods: {
    formatDate(dateStr) {
      if (!dateStr) return "";
      return new Date(dateStr).toLocaleString();
    },
    fetchDetalle() {
      this.loading = true;
      apiClient
        .post("/api/transferencias/detalle", {
          solicitudId: this.solicitudId, // Usamos this.solicitudId para acceder al valor de la prop
        })
        .then((response) => {
          const data = response.data;
          this.solicitud = data.solicitud;
          this.detalle = data.detalle;
        })
        .catch((error) => {
          console.error("Error al obtener el detalle de transferencia:", error);
        })
        .finally(() => {
          this.loading = false;
        });
    },

    closeModal() {
      this.isVisible = false;
      //this.clientStore.clearsolicitudIdTransporte();
      this.$emit("close");
    },
  },
  mounted() {
    this.fetchDetalle();
  },
  watch: {
    solicitudId(newVal) {
      if (newVal) {
        this.fetchDetalle();
      }
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
  z-index: 9999;
  background-color: rgba(
    0,
    0,
    0,
    0.5
  ); /* Semitransparente si quieres oscurecer */
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
  max-width: 800px; /* Ajusta el ancho según tus necesidades */
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
}

.modal-header,
.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: start;
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

/* Botón de cierre */
.btn-close {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
}

/* Contenedor que aplica scroll vertical a la tabla */
.scroll-container {
  max-height: 200px;
  overflow-y: auto;
}
</style>
