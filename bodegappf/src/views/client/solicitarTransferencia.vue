<template>
  <!-- Muestra el modal solo si showModal es true -->
  <div v-if="showModal" class="modal-wrapper">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">{{ modalTitle }}</h5>
        <button class="btn-close" @click="closeModal">&times;</button>
      </div>
      
      <div class="modal-body p-2 m-2">
        <form @submit.prevent="confirm">
          <!-- Sección para agregar ítems manualmente -->
          <div class="mb-3">
            <label class="form-label">Agregar Ítem</label>
            <div class="input-group">
              <input 
                type="text" 
                class="form-control" 
                placeholder="Ingrese Referencia" 
                v-model="newItemReferencia"
              />
              <button type="button" class="btn btn-outline-secondary" @click="addItem">
                Agregar
              </button>
            </div>
          </div>
          
          <!-- Lista de ítems a enviar -->
          <div class="mb-3" v-if="itemsForm.length">
            <label class="form-label">Ítems a enviar</label>
            <div class="scroll-container">
              <table class="table table-bordered table-sm">
                <thead>
                  <tr class="text-center">
                    <th>#</th>
                    <th>Referencia</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, index) in itemsForm" :key="index" class="text-center">
                    <td>{{ index + 1 }}</td>
                    <td>{{ item.referencia2 }}</td>
                    <td>
                      <button type="button" class="btn btn-sm btn-danger" @click="removeItem(index)">
                        Eliminar
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Sección opcional para carga masiva desde Excel -->
          <div class="mb-3">
            <label class="form-label">Cargar Excel (opcional)</label>
            <input type="file" @change="handleFileUpload" accept=".xlsx, .xls" class="form-control" />
          </div>

          <!-- Observaciones -->
          <div class="mb-3">
            <label class="form-label">Observaciones (Opcional)</label>
            <textarea class="form-control" rows="2" v-model="observations" placeholder="Escribe tus observaciones aquí."></textarea>
          </div>

          <!-- Botón para confirmar -->
          <div class="modal-footer">
            <button type="submit" class="btn btn-primary">{{ actionType }}</button>
            <button type="button" class="btn btn-secondary" @click="closeModal">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import apiClient from "@/services/api";
import { useLoaderStore } from "@/stores/loaderStore";
import { useAuthStore } from "@/stores/authStore";
import { useClientStore } from "@/stores/clientStore";
import Swal from "sweetalert2";

export default {
  name: "TransferenciaModal",
  props: {
    modalTitle: {
      type: String,
      default: "Confirmar Transferencia",
    },
    actionType: {
      type: String,
      default: "Confirmar",
    },
  },
  data() {
    return {
      loaderStore: useLoaderStore(),
      newItemReferencia: "",
      itemsForm: [],
      observations: "",
      excelFile: null,
      clientStore: null, // Para guardar la referencia del store
    };
  },
  computed: {
    showModal() {
      // Retornamos el getter del store
      return this.clientStore.getShowSolicitudTransporte;
    },
  },
  created() {
    // Inicializamos el store en created (o setup, si usas Composition API)
    this.clientStore = useClientStore();
  },
  methods: {
    addItem() {
      if (this.newItemReferencia.trim() !== "") {
        this.itemsForm.push({ referencia2: this.newItemReferencia.trim() });
        this.newItemReferencia = "";
      } else {
        Swal.fire({
          icon: "warning",
          title: "Atención",
          text: "Ingrese un valor para la referencia.",
          timer: 3000,
          toast: true,
          position: "top-end",
          showConfirmButton: false,
        });
      }
    },
    removeItem(index) {
      this.itemsForm.splice(index, 1);
    },
    handleFileUpload(event) {
      const file = event.target.files[0];
      if (file) {
        this.excelFile = file;
        // Aquí podrías leer el archivo y extraer datos para itemsForm (usando SheetJS, etc.)
      }
    },
    async confirm() {
      const authStore = useAuthStore();
      const clienteId = authStore.user.clienteId || 2;
      const usuarioId = authStore.user.id || 3;

      // Verificar que al menos haya un ítem
      if (!this.itemsForm.length) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Debe agregar al menos un ítem.",
          toast: true,
          position: "top-end",
          timer: 3000,
          showConfirmButton: false,
        });
        return;
      }

      // Construir payload
      const payload = {
        clienteId,
        usuarioId,
        items: this.itemsForm, // Cada item tiene { referencia2: ... }
        // observaciones: this.observations, // si lo requieres
      };

      try {
        this.loaderStore.showLoader();
        const response = await apiClient.post("/api/transferencias/crear", payload);
        
        Swal.fire({
          icon: "success",
          title: "Transferencia Creada",
          text: `Solicitud #${response.data.solicitudId} - Consecutivo: ${response.data.consecutivo}`,
          footer: response.data.message,
          toast: true,
          position: "bottom-end",
          timer: 5000,
          showConfirmButton: false,
        });
        this.$emit("confirm", response.data);
        this.$emit('reloadData');
        this.resetForm();
        // Ocultar modal
        this.clientStore.clearShowSolicitudTransporte();
      } catch (error) {
        console.error("Error al crear la transferencia:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo crear la transferencia. Por favor, inténtelo nuevamente.",
          toast: true,
          position: "bottom-end",
          timer: 5000,
          showConfirmButton: false,
        });
      }
    },
    resetForm() {
      this.newItemReferencia = "";
      this.itemsForm = [];
      this.observations = "";
      this.excelFile = null;
    },
    closeModal() {
      this.resetForm();
      // Ocultar modal desde el store
      this.clientStore.clearShowSolicitudTransporte();
      this.$emit("close");
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
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.modal-content {
  background: #fff;
  border-radius: 4px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #dee2e6;
}

.modal-body {
  padding: 1rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 0.75rem 1rem;
  border-top: 1px solid #dee2e6;
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
</style>
