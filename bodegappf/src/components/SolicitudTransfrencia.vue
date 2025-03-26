<template>
  <div v-if="visible" class="modal-wrapper">
    
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">{{ modalTitle }}</h5>
        <button class="btn-close" @click="$emit('close')">&times;</button>
      </div>
      <div class="modal-body p-2 m-2">
        <p>
          <strong>{{ selectedItems.length }} Items seleccionados:</strong>
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
              <tr
                class="text-center"
                v-for="item in selectedItems"
                :key="item.id"
              >
                <td class="fs-6">{{ item.objeto }}</td>
                <td class="fs-6">{{ item.referencia1 }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="actionType !== 'Devolver'" class="mb-3 mt-3">
          <label class="form-label">Prioridad</label>
          <div class="input-group mb-3">
            <span
              :class="
                selectedPriority === 'Normal'
                  ? 'text-success'
                  : selectedPriority === 'Urgente'
                  ? 'text-danger'
                  : 'text-warning'
              "
              class="input-group-text"
              id="basic-addon1"
              ><i class="bi bi-exclamation-diamond"></i
            ></span>
            <select
              aria-describedby="basic-addon1"
              :class="
                selectedPriority === 'Normal'
                  ? 'text-success'
                  : selectedPriority === 'Urgente'
                  ? 'text-danger'
                  : 'text-warning'
              "
              class="form-select"
              v-model="selectedPriority"
            >
              <option value="" disabled selected>Seleccionar</option>
              <option class="text-success strong" value="Normal">Normal</option>
              <option class="text-danger strong" value="Urgente">
                Urgente
              </option>
              <option class="text-warning strong" value="Especial">
                Especial
              </option>
            </select>
          </div>
        </div>

        <div v-if="actionType !== 'Devolver'" class="mb-3">
          <label class="form-label">{{
            actionType === "Devolver"
              ? "Dirección de Devolucion"
              : "Dirección de envío"
          }}</label>
          <div class="input-group mb-3">
            <span class="input-group-text" id="basic-addon1"
              ><i class="bi bi-map"></i
            ></span>
            <select class="form-select" v-model="selectedAddress">
              <option value="" disabled selected>Seleccionar</option>
              <option
                v-for="dir in direcciones"
                :key="dir.id"
                :value="dir.direccion"
              >
                {{ dir.direccion }}
              </option>
            </select>
          </div>
        </div>
        <div v-if="actionType !== 'Devolver'" class="mb-3">
          <label class="form-label">Observaciones</label>
          <textarea
            class="form-control"
            rows="4"
            v-model="observations"
            placeholder="Escribe tus observaciones aquí."
          ></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary" @click="confirm">
          {{ actionType }}
        </button>
        <button class="btn btn-secondary" @click="$emit('close')">
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

import Swal from "sweetalert2";

export default {
  name: "SolicitudModal",
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    // Esta prop debe contener la data completa (no solo IDs)
    selectedItems: {
      type: Array,
      required: true,
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
  data() {
    return {
      selectedPriority: "",
      selectedAddress: "",
      observations: "",
      direcciones: [],
      urgencia: "Normal", // valor por defecto
      loaderStore: useLoaderStore(), // obtenemos el store del loader
    };
  },
  async mounted() {
    const authStore = useAuthStore();
    if (authStore.user && authStore.user.clienteId) {
      try {
        const response = await this.getDirecctionsClient(
          authStore.user.clienteId
        );
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
    async getDirecctionsClient(clienteId) {
      try {
        const response = await apiClient.get(
          `api/direcciones/cliente/${clienteId}`
        );
        return response.data;
      } catch (error) {
        console.error("Error al obtener direcciones del cliente:", error);
        throw error;
      }
    },
    async confirm() {
      //this.loaderStore.showLoader();
      if (!this.selectedAddress && this.actionType !== "Devolver") {
        setTimeout(() => {
          this.loaderStore.hideLoader();
        }, 1500);

        Swal.fire({
          toast: true,
          position: "bottom-end",
          icon: "error",
          title: "Por favor, seleccione una dirección de envío.",
          timer: 10000,
          timerProgressBar: true,
          showConfirmButton: false,
        });
        return;
      }

      const authStore = useAuthStore();
      // Extraemos los IDs de los ítems seleccionados
      const selectedIds = this.selectedItems.map((item) => item.id);

      let endpoint = "";
      let requestMethod = null;
      let payload = {};

      if (this.actionType.toLowerCase() === "devolver") {
        // Para devolver, el payload debe tener:
        // { ids: [...], estado: "Devolución en Progreso", nombre: "Juan Pérez", usuarioEmail: "a@a.com" }
        endpoint = "/devoluciones";
        requestMethod = apiClient.put;
        payload = {
          ids: selectedIds,
          estado: "Devolución en Progreso", // o usa this.selectedPriority si ese valor es el que se requiere
          //FIXME: ajusta según la propiedad que tengas en tu usuario
          nombre: authStore.user.name || "Sin Nombre", // ajusta según la propiedad que tengas en tu usuario
          usuarioEmail: authStore.user.email,
        };
      } else {
        // Para otra acción (por ejemplo, prestar) se usa el payload actual:
        endpoint = "/api/prestamos/crear";
        requestMethod = apiClient.post;
        payload = {
          custodiaIds: selectedIds,
          usuarioId: authStore.user.email, // o el ID que corresponda
          direccion_entrega: this.selectedAddress,
          urgencia: this.urgencia,
          observaciones: this.observations,
        };
      }

      try {
        const response = await requestMethod(endpoint, payload);
        setTimeout(() => {
          this.loaderStore.hideLoader();
        }, 1500);
        Swal.fire({
          toast: true,
          position: "bottom-end",
          icon: "success",
          title: "Solicitud creada exitosamente.",
          timer: 10000,
          timerProgressBar: true,
          showConfirmButton: false,
        });

        this.$emit("confirm", {
          prestamos: response.data, // Respuesta de la API
          selectedItems: this.selectedItems,
          address: this.selectedAddress,
          observations: this.observations,
        });

        // Limpiar campos y cerrar modal
        this.selectedAddress = "";
        this.observations = "";
        this.$emit("close");
      } catch (error) {
        console.error("Error al crear la solicitud:", error);
        this.loaderStore.hideLoader();
        Swal.fire({
          toast: true,
          position: "bottom-end",
          icon: "error",
          title:
            "Error al crear la solicitud. Por favor, inténtelo nuevamente.",
          timer: 10000,
          timerProgressBar: true,
          showConfirmButton: false,
        });
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
.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
}
.modal-header,
.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.scroll-container {
  max-height: 200px;
  overflow-y: auto;
}
</style>
