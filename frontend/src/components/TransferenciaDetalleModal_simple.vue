<template>
  <div class="modal fade" id="detalleModal" tabindex="-1" aria-labelledby="detalleModalLabel" aria-hidden="true"
    ref="detalleModal">
    <div class="modal-dialog modal-xl modal-dialog-centered">
      <div class="modal-content">
        <!-- Header del Modal -->
        <div class="modal-header">
          <h5 class="modal-title" id="detalleModalLabel">
            Detalle de Solicitud #{{ selectedTransferencia?.id }}
          </h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"
            @click="$emit('close')"></button>
        </div>

        <!-- Body del Modal -->
        <div class="modal-body">
          <!-- Loader cuando está cargando -->
          <div v-if="isLoading" class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Cargando...</span>
            </div>
            <p class="mt-3">Cargando información de la solicitud...</p>
          </div>

          <!-- Contenido principal -->
          <div v-else-if="selectedTransferencia">
            <!-- Información básica -->
            <div class="row mb-4">
              <div class="col-md-6">
                <h6>Información General</h6>
                <p><strong>Cliente:</strong> {{ selectedTransferencia.clienteNombre || 'N/A' }}</p>
                <p><strong>Estado:</strong> 
                  <span class="badge bg-primary">{{ selectedTransferencia.estado }}</span>
                </p>
                <p><strong>Fecha Solicitud:</strong> {{ formatDate(selectedTransferencia.fechaSolicitud) }}</p>
              </div>
              <div class="col-md-6">
                <h6>Observaciones</h6>
                <div v-if="selectedTransferencia.observaciones">
                  <p class="text-muted">{{ selectedTransferencia.observaciones }}</p>
                </div>
                <div v-else>
                  <p class="text-muted font-italic">Sin observaciones registradas</p>
                </div>
              </div>
            </div>

            <!-- Lista de ítems -->
            <div class="mb-4">
              <h6>Ítems de la Solicitud ({{ detalle?.length || 0 }})</h6>
              <div v-if="detalle && detalle.length > 0">
                <div class="row">
                  <div v-for="(item, index) in detalle" :key="item.id" class="col-md-6 mb-3">
                    <div class="card">
                      <div class="card-body">
                        <h6 class="card-title">Ítem #{{ item.id }}</h6>
                        <p class="card-text">
                          <strong>Referencia:</strong> {{ item.referencia2 || 'N/A' }}<br>
                          <strong>Ubicación:</strong> {{ item.ubicacionCodigo || 'N/A' }}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="text-center py-4">
                <p class="text-muted">No hay ítems para mostrar</p>
              </div>
            </div>

            <!-- Sección de acciones según el estado -->
            <div v-if="estadoPermitido">
              <hr>
              <h6>Acciones Disponibles</h6>
              
              <!-- Asignación de transportador -->
              <div v-if="estadoPermitido === 'asignado a transportador'" class="mb-4">
                <div class="row">
                  <div class="col-md-6">
                    <label class="form-label">Transportador *</label>
                    <select class="form-select" v-model="selectedTransportistaId" @change="onTransportistaChange" required>
                      <option value="" disabled>Seleccione un transportador</option>
                      <option v-for="transportista in transportistas" :key="transportista.id" :value="transportista.id">
                        {{ transportista.nombre }}
                      </option>
                    </select>
                  </div>
                  <div class="col-md-6" v-if="selectedTransportistaId">
                    <label class="form-label">Documento de Identidad</label>
                    <input type="text" class="form-control" v-model="documentoIdentidad" readonly />
                  </div>
                </div>
                <div class="row mt-3">
                  <div class="col-md-6">
                    <label class="form-label">Placa del Vehículo *</label>
                    <input type="text" class="form-control" v-model="placa" placeholder="Ej: ABC-123" required />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label">Sticker de Seguridad</label>
                    <input type="text" class="form-control" v-model="sticker" placeholder="Opcional" />
                  </div>
                </div>
              </div>

              <!-- Asignación de ubicaciones -->
              <div v-if="estadoPermitido === 'completado'" class="mb-4">
                <div v-for="(item, idx) in detalle" :key="item.id" class="row mb-3">
                  <div class="col-md-4">
                    <label class="form-label">Ítem #{{ item.id }}</label>
                    <p class="text-muted small">{{ item.referencia2 || 'Sin referencia' }}</p>
                  </div>
                  <div class="col-md-8">
                    <select class="form-select" v-model.number="item.nuevaUbicacionId">
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

              <!-- Observaciones -->
              <div class="mb-4">
                <label class="form-label">Observaciones del cambio de estado</label>
                <textarea class="form-control" v-model="observaciones" placeholder="Observaciones opcionales..." rows="3"></textarea>
              </div>
            </div>
          </div>

          <!-- Estado de error -->
          <div v-else-if="hasError" class="text-center py-5">
            <div class="alert alert-danger">
              <h6>Error al cargar los datos</h6>
              <p>{{ errorMessage }}</p>
              <button type="button" class="btn btn-outline-primary" @click="$emit('retry')">
                Reintentar
              </button>
            </div>
          </div>

          <!-- Estado vacío -->
          <div v-else class="text-center py-5">
            <p class="text-muted">No hay datos para mostrar</p>
          </div>
        </div>

        <!-- Footer del Modal -->
        <div v-if="estadoPermitido && selectedTransferencia" class="modal-footer">
          <button class="btn btn-secondary" data-bs-dismiss="modal" @click="$emit('close')">
            Cancelar
          </button>
          <button class="btn btn-primary" :disabled="botonDisabled || isLoading" @click="$emit('cambiar-estado')">
            {{
              botonDisabled
                ? "Confirmación Cliente Pendiente"
                : "Cambiar Estado"
            }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Modal } from "bootstrap";
import { DateTime } from "luxon";

export default {
  name: "TransferenciaDetalleModal",
  props: {
    selectedTransferencia: {
      type: Object,
      default: null
    },
    detalle: {
      type: Array,
      default: () => []
    },
    estadoPermitido: {
      type: String,
      default: null
    },
    botonDisabled: {
      type: Boolean,
      default: true
    },
    transportistas: {
      type: Array,
      default: () => []
    },
    availableUbicaciones: {
      type: Array,
      default: () => []
    },
    hasError: {
      type: Boolean,
      default: false
    },
    errorMessage: {
      type: String,
      default: 'Ha ocurrido un error al cargar los datos'
    },
    isLoading: {
      type: Boolean,
      default: false
    }
  },
  
  data() {
    return {
      detalleModalInstance: null,
      selectedTransportistaId: null,
      transportista: '',
      documentoIdentidad: '',
      placa: '',
      sticker: '',
      observaciones: ''
    };
  },
  
  emits: ['close', 'cambiar-estado', 'retry', 'update:selectedTransportistaId', 'update:transportista', 'update:documentoIdentidad', 'update:placa', 'update:sticker', 'update:observaciones'],
  
  methods: {
    show() {
      const modalEl = this.$refs.detalleModal;
      if (!this.detalleModalInstance) {
        this.detalleModalInstance = new Modal(modalEl, {
          backdrop: 'static',
          keyboard: true
        });
      }
      this.detalleModalInstance.show();
    },
    
    hide() {
      if (this.detalleModalInstance) {
        this.detalleModalInstance.hide();
      }
    },
    
    onTransportistaChange() {
      if (this.selectedTransportistaId) {
        const transportista = this.transportistas.find(t => t.id === this.selectedTransportistaId);
        if (transportista) {
          this.transportista = transportista.nombre;
          this.documentoIdentidad = transportista.cc;
          
          this.$emit('update:selectedTransportistaId', this.selectedTransportistaId);
          this.$emit('update:transportista', this.transportista);
          this.$emit('update:documentoIdentidad', this.documentoIdentidad);
        }
      } else {
        this.transportista = '';
        this.documentoIdentidad = '';
        this.$emit('update:selectedTransportistaId', null);
        this.$emit('update:transportista', '');
        this.$emit('update:documentoIdentidad', '');
      }
    },
    
    formatDate(dateString) {
      if (!dateString) return "";
      return DateTime.fromISO(dateString).toFormat("dd/MM/yyyy");
    },
    
    resetFields() {
      this.selectedTransportistaId = null;
      this.transportista = '';
      this.documentoIdentidad = '';
      this.placa = '';
      this.sticker = '';
      this.observaciones = '';
    }
  },
  
  watch: {
    selectedTransferencia: {
      handler(newVal, oldVal) {
        if (newVal?.id !== oldVal?.id) {
          this.resetFields();
        }
      },
      immediate: false
    },
    
    observaciones(newVal) {
      this.$emit('update:observaciones', newVal);
    },
    
    placa(newVal) {
      this.$emit('update:placa', newVal);
    },
    
    sticker(newVal) {
      this.$emit('update:sticker', newVal);
    }
  },
  
  beforeUnmount() {
    if (this.detalleModalInstance) {
      this.detalleModalInstance.dispose();
    }
  }
};
</script>

<style scoped>
/* Estilos básicos para el modal */
.modal-header {
  border-bottom: 1px solid #dee2e6;
}

.modal-footer {
  border-top: 1px solid #dee2e6;
}

.card {
  border: 1px solid rgba(0,0,0,.125);
  border-radius: 0.25rem;
}

.card-body {
  padding: 1rem;
}

.badge {
  font-size: 75%;
  font-weight: 700;
}

.bg-primary { background-color: #0d6efd !important; }

.text-muted {
  color: #6c757d !important;
}

.font-italic {
  font-style: italic;
}

.spinner-border {
  width: 2rem;
  height: 2rem;
  border: 0.25em solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spinner-border 0.75s linear infinite;
}

@keyframes spinner-border {
  to {
    transform: rotate(360deg);
  }
}

.alert {
  padding: 0.75rem 1.25rem;
  margin-bottom: 1rem;
  border: 1px solid transparent;
  border-radius: 0.25rem;
}

.alert-danger {
  color: #721c24;
  background-color: #f8d7da;
  border-color: #f5c6cb;
}

.btn {
  padding: 0.375rem 0.75rem;
  font-size: 1rem;
  border-radius: 0.25rem;
  border: 1px solid transparent;
  cursor: pointer;
  text-decoration: none;
  transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out, border-color 0.15s ease-in-out;
}

.btn-primary {
  color: #fff;
  background-color: #0d6efd;
  border-color: #0d6efd;
}

.btn-primary:hover {
  background-color: #0b5ed7;
  border-color: #0a58ca;
}

.btn-secondary {
  color: #fff;
  background-color: #6c757d;
  border-color: #6c757d;
}

.btn-secondary:hover {
  background-color: #5c636a;
  border-color: #565e64;
}

.btn-outline-primary {
  color: #0d6efd;
  border-color: #0d6efd;
  background-color: transparent;
}

.btn-outline-primary:hover {
  color: #fff;
  background-color: #0d6efd;
  border-color: #0d6efd;
}

.btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.form-control, .form-select {
  padding: 0.375rem 0.75rem;
  font-size: 1rem;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.form-control:focus, .form-select:focus {
  border-color: #86b7fe;
  outline: 0;
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
}

.form-label {
  margin-bottom: 0.5rem;
  font-weight: 500;
}

/* Responsive */
@media (max-width: 768px) {
  .modal-dialog {
    margin: 1rem;
  }
  
  .row {
    margin-left: 0;
    margin-right: 0;
  }
  
  .col-md-6, .col-md-4, .col-md-8 {
    padding-left: 0;
    padding-right: 0;
    margin-bottom: 1rem;
  }
}
</style>
