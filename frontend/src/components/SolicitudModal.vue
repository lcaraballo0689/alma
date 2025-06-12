<template>
  <div v-if="visible" class="modal-wrapper">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">{{ modalTitle }}</h5>
        <button class="btn-close" @click="$emit('close')">&times;</button>
      </div>
      <div class="modal-body p-2 m-2">
        <p>
          <strong>{{ validItems.length }} Items seleccionados:</strong>
        </p>
        <div class="scroll-container">
          <table class="table table-bordered table-sm">
            <thead>
              <tr class="text-center">
                <th class="fs-6">Objeto</th>
                <th class="fs-6">Referencia</th>
              </tr>
            </thead>
            <tbody>
              <tr class="text-center" v-for="item in validItems" :key="item.id">
                <td class="fs-6">{{ item.objeto }}</td>
                <td class="fs-6">{{ item.referencia1 }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Prioridad -->
        <div class="mb-3 mt-3">
          <label class="form-label">Prioridad</label>
          <div class="input-group mb-3">
            <span
              :class="selectedPriority === 'Normal'
                ? 'text-success'
                : selectedPriority === 'Urgente'
                ? 'text-danger'
                : 'text-warning'"
              class="input-group-text"
              id="basic-addon1"
            >
              <i class="bi bi-exclamation-diamond"></i>
            </span>
            <select
              aria-describedby="basic-addon1"
              :class="selectedPriority === 'Normal'
                ? 'text-success'
                : selectedPriority === 'Urgente'
                ? 'text-danger'
                : 'text-warning'"
              class="form-select"
              v-model="selectedPriority"
              required
            >
              <option value="" disabled>Seleccionar</option>
              <option class="text-success strong" value="Normal">Normal</option>
              <option class="text-danger strong" value="Urgente">Urgente</option>
              <option class="text-warning strong" value="Especial">Especial</option>
            </select>
          </div>
        </div>

        <div v-if="actionType.toLowerCase() !== 'devolver'" class="mb-3">
          <label class="form-label">Dirección de envío</label>
          <div class="input-group mb-3">
            <span class="input-group-text" id="basic-addon1">
              <i class="bi bi-map"></i>
            </span>
            <select class="form-select" v-model="selectedAddress">
              <option value="" disabled selected>Seleccionar</option>
              <option v-for="dir in direcciones" :key="dir.id" :value="dir.direccion">
                {{ dir.direccion }}
              </option>
            </select>
          </div>
        </div>

        <!-- Para devolución se muestran el datepicker y observaciones -->
        <div v-if="actionType.toLowerCase() === 'devolver'" class="mb-3">
          <label class="form-label">Dirección de Recoleccion</label>
          <div class="input-group mb-3">
            <span class="input-group-text" id="basic-addon1">
              <i class="bi bi-map"></i>
            </span>
            <select class="form-select" v-model="selectedAddress">
              <option value="" disabled selected>Seleccionar</option>
              <option v-for="dir in direcciones" :key="dir.id" :value="dir.direccion">
                {{ dir.direccion }}
              </option>
            </select>
          </div>
          <label class="form-label">Fecha de Recolección</label>
          <input type="date" class="form-control mb-3" v-model="fechaRecoleccion" :min="minDate" />

          <label class="form-label">Observaciones (Devolución)</label>
          <textarea
            class="form-control"
            rows="4"
            v-model="observations"
            placeholder="Escribe tus observaciones para la devolución aquí."
          ></textarea>
        </div>

        <!-- Para acciones que no son devolución, se muestran las observaciones generales -->
        <div v-if="actionType.toLowerCase() !== 'devolver'" class="mb-3">
          <label class="form-label">Observaciones (Opcional)</label>
          <textarea
            class="form-control"
            rows="5"
            v-model="observations"
            placeholder="Escribe tus observaciones aquí."
          ></textarea>
        </div>
      </div>
      <div class="modal-footer d-flex justify-content-between m-0 p-0 pt-3">
        <button 
          class="btn btn-primary d-flex align-items-center gap-2" 
          @click="confirm"
          :disabled="isLoading || !isFormValid"
        >
          <span v-if="!isLoading">{{ actionType }}</span>
          <div v-else class="spinner-wrapper d-flex align-items-center">
            <div class="spinner-border spinner-border-sm text-light" role="status">
              <span class="visually-hidden">Cargando...</span>
            </div>
            <span class="ms-2">Procesando...</span>
          </div>
        </button>
        <button 
          class="btn btn-secondary" 
          @click="$emit('close')"
          :disabled="isLoading"
        >
          Cancelar
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import apiClient from "@/services/api";
import { useAuthStore } from "@/stores/authStore";
import { useLoaderStore } from "@/stores/loaderStore";
import EmptyState from "@/components/EmptyState.vue";
import Swal from "sweetalert2";

export default {
  name: "SolicitudModal",
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    selectedItems: {
      type: Array,
      required: true,
      default: () => []
    },
    modalTitle: {
      type: String,
      default: "Confirmar Solicitud",
    },
    actionType: {
      type: String,
      default: "Confirmar",
    },
  },
  components: {
    EmptyState,
  },
  computed: {
    validItems() {
      return this.selectedItems.filter(item => item && item.id);
    },
    showModal() {
      return this.$props.visible && this.clientStore.getShowSolicitudTransporte;
    },
    minDate() {
      return new Date().toISOString().split("T")[0];
    },
    isFormValid() {
      if (!this.selectedPriority) return false;
      if (!this.selectedAddress) return false;
      if (this.actionType.toLowerCase() === 'devolver' && !this.fechaRecoleccion) return false;
      return true;
    }
  },
  data() {
    return {
      selectedPriority: "",
      selectedAddress: "",
      observations: "",
      fechaRecoleccion: "",
      direcciones: [],
      isLoading: false,
      loaderStore: useLoaderStore(),
    };
  },
  watch: {
    visible(newVal) {
      if (newVal && this.validItems.length === 0) {
        console.warn('Modal abierto sin items válidos');
        this.$emit('close');
      }
    }
  },
  created() {
    this.clientStore = useLoaderStore(); // O usa el store correspondiente, según tu arquitectura
  },
  async mounted() {
    const authStore = useAuthStore();
    if (authStore.user && authStore.user.clienteId) {
      try {
        const response = await this.getDirecctionsClient(authStore.user.clienteId);
        this.direcciones = response.direcciones || [];
      } catch (error) {
        console.error("Error al obtener direcciones del cliente:", error);
        Swal.fire({
          toast: true,
          position: "bottom-end",
          icon: "error",
          title: "Error al obtener direcciones del cliente.",
          timer: 10000,
          timerProgressBar: true,
          showConfirmButton: false,
        });
      }
    }
  },
  methods: {
    async confirm() {
      if (!this.isFormValid) return;
      
      try {
        this.isLoading = true;
        const authStore = useAuthStore();
        
        // Validar que tengamos todos los datos necesarios
        if (!authStore.user?.id) {
          throw new Error('Usuario no autenticado');
        }

        if (!this.validItems.length) {
          throw new Error('No hay items seleccionados');
        }

        // Validar que todos los items tengan los datos necesarios
        const itemsInvalidos = this.validItems.filter(item => !item.id || !item.ubicacionId);
        if (itemsInvalidos.length > 0) {
          throw new Error('Algunos items no tienen todos los datos necesarios');
        }

        // Preparar los datos según el tipo de acción
        let endpoint = "";
        let payload = {};

        // Preparar los datos comunes
        const commonData = {
          usuarioId: authStore.user.id,
          clienteId: authStore.user.clienteId,
          observaciones: this.observations?.trim() || '',
          urgencia: this.selectedPriority,
          items: this.validItems.map(item => ({
            custodiaId: item.id,
            ubicacionId: item.ubicacionId,
            objeto: item.objeto,
            bodega: item.bodega,
            referencia1: item.referencia1,
            referencia2: item.referencia2,
            referencia3: item.referencia3
          }))
        };

        if (this.actionType.toLowerCase() === "devolver") {
          endpoint = "/api/devoluciones/crear";
          payload = {
            ...commonData,
            direccion_recoleccion: this.selectedAddress.trim(),
            fecha_recoleccion: this.fechaRecoleccion,
            tipo: 'devolucion',
            estado: 'solicitud creada',
            custodiaIds: this.validItems.map(item => item.id)
          };
        } else {
          endpoint = "/api/prestamos/crear";
          payload = {
            custodiaIds: this.validItems.map(item => item.id),
            usuarioId: authStore.user.id,
            direccion_entrega: this.selectedAddress.trim(),
            urgencia: this.selectedPriority,
            observaciones: this.observations?.trim() || ''
          };
        }

        console.log('Enviando solicitud:', {
          endpoint,
          payload,
          prioridad: this.selectedPriority,
          itemsSeleccionados: this.validItems
        });

        try {
          const response = await apiClient.post(endpoint, payload);
          console.log('Respuesta del servidor:', response.data);

          // Mostrar mensaje de éxito
          Swal.fire({
            toast: true,
            position: 'bottom-end',
            icon: 'success',
            title: `${this.actionType} realizado con éxito`,
            showConfirmButton: false,
            timer: 3000
          });

          // Emitir el evento con los datos actualizados
          this.$emit('confirm', {
            selectedItems: this.validItems,
            response: response.data,
            prioridad: this.selectedPriority,
            direccion: this.selectedAddress,
            observaciones: this.observations,
            ...(this.actionType.toLowerCase() === 'devolver' && {
              fechaRecoleccion: this.fechaRecoleccion
            })
          });

          // Limpiar el formulario y cerrar el modal
          this.resetForm();
          this.$emit('close');

        } catch (error) {
          console.error('Error detallado de la solicitud:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            message: error.message,
            payload: payload
          });

          let errorMessage = 'Error al procesar la solicitud';
          
          // Intentar obtener un mensaje de error más específico
          if (error.response?.data?.mensaje) {
            errorMessage = error.response.data.mensaje;
            
            // Si hay errores específicos, agregarlos al mensaje
            if (error.response.data.errores && Array.isArray(error.response.data.errores)) {
              errorMessage += '\n' + error.response.data.errores.join('\n');
            }
          } else if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
          } else if (error.response?.data?.error) {
            errorMessage = error.response.data.error;
          }

          Swal.fire({
            toast: false,
            position: 'center',
            icon: 'error',
            title: 'Error al procesar la solicitud',
            text: errorMessage,
            showConfirmButton: true,
            confirmButtonText: 'Entendido',
            timer: null
          });
        }
      } catch (error) {
        console.error('Error general:', error);
        Swal.fire({
          toast: true,
          position: 'bottom-end',
          icon: 'error',
          title: 'Error inesperado',
          text: error.message,
          showConfirmButton: true,
          timer: 5000
        });
      } finally {
        this.isLoading = false;
      }
    },

    resetForm() {
      this.selectedPriority = "";
      this.selectedAddress = "";
      this.observations = "";
      this.fechaRecoleccion = "";
    },

    async getDirecctionsClient(clienteId) {
      try {
        const response = await apiClient.get(`api/direcciones/cliente/${clienteId}`);
        return response.data;
      } catch (error) {
        console.error("Error al obtener direcciones:", error);
        throw error;
      }
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
  z-index: 9999;
}
.modal-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #fff;
  padding: 1rem;
  border-radius: 4px;
  max-width: 500px;
  width: 90%;
  z-index: 10000;
}
.modal-header,
.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
}
.scroll-container {
  max-height: 200px;
  overflow-y: auto;
}

.spinner-wrapper {
  min-width: 120px;
  justify-content: center;
}

.btn:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.btn-primary:disabled {
  background-color: var(--bs-primary);
  border-color: var(--bs-primary);
}

.modal-footer .btn {
  min-width: 120px;
}
</style>
