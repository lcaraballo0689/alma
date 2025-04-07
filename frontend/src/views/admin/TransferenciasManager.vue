<template>
  <div class="container-fluid p-0 pt-2">
    <!-- Card de Filtros -->
    <div class="card shadow-sm mb-4">
      <div class="card-header  ">
        <div class="row align-items-center justify-content-between">
          <div class="col-md-3">
            <div class="input-group">
              <span class="input-group-text"><i class="bi bi-search"></i></span>
              <input v-model="search" type="text" class="form-control" placeholder="Buscar..." />
            </div>
          </div>
          <!-- <div class="col-md-2">
            <select class="form-select" v-model="selectedEstado">
              <option value="">Todos los estados</option>
              <option value="solicitud creada">Solicitud creada</option>
              <option value="asignado a transportador">Asignado a transportador</option>
              <option value="en proceso de recolección">En proceso de recolección</option>
              <option value="recogido">Recogido</option>
              <option value="en bodega">En bodega</option>
              <option value="completado">Completado</option>
            </select>
          </div> -->
          <div class="col-md-4">
            <ul class="nav nav-pills justify-content-center">
              <li class="nav-item" v-for="mod in modules" :key="mod">
                <button class="btn btn-sm me-2"  :class="{
                  'btn-outline-secondary': activeModule !== mod,
                  'btn-secondary': activeModule === mod
                }" @click="activeModule = mod">
                    {{ mod }}
                </button>
              </li>
            </ul>
          </div>
          <div class="col-md-3">
            <ul class="nav nav-tabs justify-content-end">
              <li class="nav-item">
                <button class="nav-link" :class="{ active: activeTab === 'pendientes' }"
                  @click="activeTab = 'pendientes'"  >
                  Pendientes
                </button>
              </li>
              <li class="nav-item">
                <button class="nav-link" :class="{ active: activeTab === 'completadas' }"
                  @click="activeTab = 'completadas'"  >
                  Completadas
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div class="card-body p-0">
        <hr class="m-0" />
        <div class="table-responsive">
          <table class="table table-striped mb-0">
            <thead class="table-light">
              <tr>
                <th>ID</th>
                <th>Cliente</th>
                <th>Tipo Solicitud</th>
                <th>Estado</th>
                <th>{{ direccionHeader }}</th>
                <th>Observaciones</th>
                <th>Fecha Solicitud</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="t in filteredTransferencias" :key="t.id">
                <td>{{ t.id }}</td>
                <td>{{ t.clienteId }}</td>
                <td>{{ t.modulo }}</td>
                <td>{{ t.estado }}</td>
                <td>{{ t.direccion }}</td>
                <td>{{ t.observaciones }}</td>
                <td>{{ formatDate(t.fechaSolicitud) }} - {{ formatTime(t.fechaSolicitud) }}</td>

                <td>
                  <button class="btn btn-sm btn-outline-primary" @click="seleccionarTransferencia(t)">
                    <i class="bi bi-eye"></i> Ver Detalle
                  </button>
                </td>
              </tr>
              <tr v-if="!filteredTransferencias.length">
                <td colspan="6" class="text-center py-3">
                  <i class="bi bi-exclamation-circle me-2"></i>
                  No hay solicitudes registradas.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal para Detalle -->
    <div class="modal fade" id="detalleModal" tabindex="-1" aria-labelledby="detalleModalLabel" aria-hidden="true"
      ref="detalleModal">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content">
          <!-- Encabezado del Modal -->
          <div class="modal-header ">
            <h5 class="modal-title" id="detalleModalLabel">
              Detalle de Solicitud #{{ selectedTransferencia?.id }}
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"
              @click="closeDetalle"></button>
          </div>
          <!-- Cuerpo del Modal -->
          <div class="modal-body">
            <div v-if="detalle">
              <p>
                <strong>Cliente:</strong>
                {{ selectedTransferencia.clienteId }}
              </p>
              <p>
                <strong>Modulo:</strong>
                {{ selectedTransferencia.modulo }}
              </p>
              <p>
                <strong>Estado Actual:</strong>
                {{ selectedTransferencia.estado }}
              </p>

              <p>
                <strong>Observacion:</strong>
                {{ selectedTransferencia.observaciones }}
              </p>
              <p>
                <strong>Frech Solicitud:</strong>
                {{ formatDate(selectedTransferencia.fechaSolicitud) }} - {{
                  formatTime(selectedTransferencia.fechaSolicitud) }}
              </p>
              <p>
                <strong>Ultima Actualizacion:</strong>
                {{ formatDate(selectedTransferencia.updatedAt) }} - {{ formatTime(selectedTransferencia.updatedAt) }}
              </p>
              <hr />
              <h6>Detalles:</h6>
              <div class="table-responsive">
                <table class="table table-bordered">
                  <thead class="table-light">
                    <tr>
                      <th>ID</th>
                      <th>Referencia2</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in detalle" :key="item.id">
                      <td>{{ item.id }}</td>
                      <td>{{ item.referencia2 }}</td>
                      <td>{{ item.estado }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div v-if="estadoPermitido === 'asignado a transportador'">
                <div class="mb-3">
                  <label for="transportista" class="form-label">Transportador:</label>
                  <input type="text" id="transportista" class="form-control" v-model="transportista"
                    placeholder="Ingrese el nombre del transportador" required />
                </div>
                <div class="mb-3">
                  <label for="documentoIdentidad" class="form-label">Documento de Identidad:</label>
                  <input type="text" id="documentoIdentidad" class="form-control" v-model="documentoIdentidad"
                    placeholder="Ingrese el documento de identidad" required />
                </div>
                <div class="mb-3">
                  <label for="placa" class="form-label">Placa:</label>
                  <input type="text" id="placa" class="form-control" v-model="placa"
                    placeholder="Ingrese la placa del vehículo" required />
                </div>
                <div class="mb-3">
                  <label for="sticker" class="form-label">Sticker Seguridad:</label>
                  <input type="text" id="sticker" class="form-control" v-model="sticker"
                    placeholder="Ingrese el codigo del sticker"  />
                </div>
              </div>

              <!-- Asignación de Ubicaciones (solo si el estado permitido es 'completado') -->
              <div v-if="estadoPermitido === 'completado'" class="mt-3">
                <h6>Asignación de Ubicaciones:</h6>
                <div v-for="(item, idx) in detalle" :key="item.id" class="mb-2">
                  <label class="form-label">
                    Detalle ID {{ item.id }} - Ref.2: {{ item.referencia2 }}
                  </label>
                  <select class="form-select form-select-sm" v-model.number="item.nuevaUbicacionId">
                    <option disabled value="">Seleccione ubicación...</option>
                    <option v-for="u in availableUbicaciones.filter(
                      (u) =>
                        !detalle.some(
                          (d) =>
                            d.nuevaUbicacionId === u.id &&
                            d.id !== item.id
                        )
                    )" :key="u.id" :value="u.id">
                      {{ u.codigo }} - {{ u.estado }}
                    </option>
                  </select>
                </div>
              </div>
            </div>
            <div v-else class="text-center py-3">
              <i class="bi bi-arrow-repeat spin me-2"></i>
              Cargando detalle...
            </div>
          </div>
          <!-- Pie del Modal -->
          <div v-if="!botonDisabled" class="modal-footer">
            <div class="d-flex align-items-center w-100 justify-content-end">
              <h6 class="me-2 mb-0">Actualizar estado a:</h6>
              <button class="btn btn-success" :disabled="botonDisabled" @click="cambiarEstado">
                <i class="bi bi-qr-code-scan me-1"></i>
                {{
                  botonDisabled
                    ? "Confirmación Cliente Pendiente"
                    : estadoPermitido || "Cambiar Estado"
                }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import apiClient from "@/services/api";
import { Modal } from "bootstrap";
import { useAuthStore } from "@/stores/authStore";
import { DateTime } from "luxon";




export default {
  name: "TransferenciaManager",
  data() {
    return {
      transferencias: [],
      selectedTransferencia: null,
      detalle: null,
      detalleModalInstance: null,
      availableUbicaciones: [],
      search: "",
      selectedEstado: "",
      activeTab: "pendientes",
      modules: ["Transferencia", "Prestamo", "Devolucion", "Desarchive"],
      activeModule: "Transferencia",
      estadoPermitido: null,
      botonDisabled: true,
      authStore: useAuthStore(),
      transportista: '',
      documentoIdentidad: '',
      placa: '',
      sticker: '',
    };
  },
  computed: {
    direccionHeader() {
      if (this.filteredTransferencias && this.filteredTransferencias.length > 0) {
        // Convertir a minúsculas para evitar problemas de mayúsculas/minúsculas
        const modulo = this.filteredTransferencias[0].modulo.toLowerCase();
        if (modulo === "transferencia" || modulo === "devolucion") {
          return "Dirección de recogida";
        } else if (modulo === "prestamo" || modulo === "desarchivo" || modulo === "desarchive") {
          return "Dirección de entrega";
        }
      }
      return "";
    },
    filteredTransferencias() {
      return this.transferencias.filter((t) => {
        const estadoLower = t.estado.toLowerCase();
        const moduloLower = t.modulo ? t.modulo.toLowerCase() : "";
        const matchModule = this.activeModule
          ? moduloLower === this.activeModule.toLowerCase()
          : true;
        const matchEstado = this.selectedEstado
          ? estadoLower === this.selectedEstado.toLowerCase()
          : true;
        const matchBusqueda = this.search
          ? t.clienteId.toString().includes(this.search) ||
          estadoLower.includes(this.search.toLowerCase())
          : true;
        const isCompleted = estadoLower === "completado";
        if (this.activeTab === "completadas") {
          return isCompleted && matchModule && matchEstado && matchBusqueda;
        } else {
          return !isCompleted && matchModule && matchEstado && matchBusqueda;
        }
      });
    },
  },
  methods: {
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
    async fetchTransferencias() {
      try {
        const body = { clienteId: 2 };
        const response = await apiClient.post(
          "/api/transferencias/consultar",
          body
        );
        this.transferencias = response.data.data || [];
        console.log("Transferencias:", this.transferencias);
      } catch (error) {
        console.error("Error fetching transferencias:", error);
      }
    },
    async fetchEstadoPermitido() {
      try {
        const tipoUsuarioId = this.authStore.user?.tipoUsuarioId;
        if (!this.selectedTransferencia) return;
        const body = {
          clienteId: this.selectedTransferencia.clienteId,
          tipoUsuarioId,
          modulo: this.selectedTransferencia.modulo,
          estadoActual: this.selectedTransferencia.estado,
        };
        const response = await apiClient.post(
          "/api/estados/transiciones",
          body
        );
        const data = response.data;
        this.estadoPermitido = data.estadoPermitido;
        this.botonDisabled = data.disabled;
        console.log("EstadoPermitido:", this.estadoPermitido, "Disabled:", this.botonDisabled);
      } catch (error) {
        console.error("Error fetching estadoPermitido:", error);
        this.estadoPermitido = null;
        this.botonDisabled = true;
      }
    },
    async seleccionarTransferencia(t) {
      try {
        this.selectedTransferencia = t;
        await this.fetchDetalle(t.id);
        await this.fetchUbicacionesDisponibles();
        await this.fetchEstadoPermitido();
        this.showDetalleModal();
      } catch (error) {
        console.error("Error al seleccionar transferencia:", error);
      }
    },
    async fetchDetalle(solicitudId) {
      try {
        const body = { solicitudId };
        const response = await apiClient.post(
          "/api/transferencias/detalle",
          body
        );
        this.detalle = response.data.detalle || [];
        console.log("Detalle:", this.detalle);
      } catch (error) {
        console.error("Error fetching detalle:", error);
      }
    },
    async fetchUbicacionesDisponibles() {
      try {
        const response = await apiClient.get("/api/transferencias/ubicaciones");
        this.availableUbicaciones = response.data.data.filter(
          (u) => !u.ocupado && u.estado.toUpperCase() === "DISPONIBLE"
        );
        console.log("Ubicaciones:", this.availableUbicaciones);
      } catch (error) {
        console.error("Error fetching ubicaciones:", error);
      }
    },
    showDetalleModal() {
      const modalEl = this.$refs.detalleModal;
      if (!this.detalleModalInstance) {
        this.detalleModalInstance = new Modal(modalEl, {});
      }
      this.detalleModalInstance.show();
    },
    closeDetalle() {
      if (this.detalleModalInstance) {
        this.detalleModalInstance.hide();
      }
      this.selectedTransferencia = null;
      this.detalle = null;
      this.transportista = '';
      this.placa = '';
      this.sticker = '';
      this.documentoIdentidad = '';
    },
    async cambiarEstado() {
      try {
        if (this.botonDisabled) {
          alert("No puedes avanzar de estado, otro rol debe intervenir.");
          return;
        }

        const accion = this.estadoPermitido?.toLowerCase() || "";

        // Si la acción es asignar a transportador, validamos que los campos requeridos estén completos.
        if (accion === "asignado a transportador") {
          if (!this.transportista || !this.documentoIdentidad || !this.placa) {
            await import("sweetalert2").then((Swal) => {
              Swal.default.fire({
                toast: true,
                position: "bottom-right",
                icon: "warning",
                title: "Campos incompletos",
                text: "Por favor, complete los campos: transportista, documento de identidad y placa.",
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
              });
            });

            return;
          }
        }

        const asignaciones =
          accion === "completado"
            ? this.detalle
              .filter((d) => d.nuevaUbicacionId)
              .map((d) => ({
                detalleId: d.id,
                ubicacionId: d.nuevaUbicacionId,
              }))
            : [];
            const idUsuario = this.authStore.user?.id;
        const body = {
          qrToken: `solicitud_${this.selectedTransferencia.id}`,
          accion,
          modulo: this.selectedTransferencia.modulo,
          usuarioId: idUsuario,
          clienteId: this.selectedTransferencia.clienteId,
          asignaciones,
          transportista: this.transportista,
          documentoIdentidad: this.documentoIdentidad,
          placa: this.placa,
          sticker: this.sticker || '',
        };

        console.log("Cambio de estado antes:", body);
        const response = await apiClient.post("/api/transferencias/qr/scan", body);
        console.log("Cambio de estado después:", response.data);
        this.selectedTransferencia.estado = response.data.NuevoEstado || accion;
        await this.fetchTransferencias();
        this.closeDetalle();
      } catch (error) {
        console.error("Error al cambiar estado:", error);
      }
    },

  },
  mounted() {
    this.fetchTransferencias();
  },
};
</script>

<style scoped>
.container-fluid {
  padding: 1rem;
}

.card {
  margin-bottom: 1.5rem;
}

.table th,
.table td {
  vertical-align: middle;
}

.nav-tabs .nav-link.active,
.nav-pills .nav-link.active {
  font-weight: 600;
}

.btn {
  transition: all 0.2s ease;
}

.btn:hover {
  transform: scale(1.02);
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}
</style>
