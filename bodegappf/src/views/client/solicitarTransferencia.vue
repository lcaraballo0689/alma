<template>
  <!-- Mostrar el modal solo si showModal es true -->
  <div v-if="showModal" class="modal-wrapper">
    <div class="modal-content">
      <div class="card-header">
        <div class="row d-flex justify-content-between align-items-center">
          <div class="col">
            <h5 class="m-0 p-0 ms-3 py-3">{{ modalTitle }}</h5>
          </div>
          <div class="col d-flex justify-content-end align-items-center me-3">
            <button class="custom-btn excel" @click="downloadTemplate" @mouseover="hoveredButton = 'excel'"
              @mouseleave="hoveredButton = ''">
              <i :class="hoveredButton === 'excel' ? 'bi bi-arrow-down-circle-fill' : 'bi bi-file-excel-fill'"></i>
              <span v-if="hoveredButton !== 'excel'">Plantilla</span>
              <span v-else>Descargar</span>
            </button>
          </div>
        </div>
      </div>


      <div class="modal-body p-2 m-2 modal-body-flex">
        <!-- Controles para elegir el modo de cargue -->
        <!-- Columna Izquierda: Formulario -->
        <div class="modal-form">
          <div>
            <div class="btn-group mb-2">
              <button type="button" class="btn btn-sm btn-outline-dark" :class="{ active: uploadMode === 'manual' }"
                @click="uploadMode = 'manual'">
                Manual
              </button>
              <button type="button" class="btn btn-sm btn-outline-dark" :class="{ active: uploadMode === 'massive' }"
                @click="uploadMode = 'massive'">
                Masivo
              </button>
            </div>
          </div>
          <hr class="mt-1">
          <form @submit.prevent="confirm">
            <!-- Sección para agregar ítems manualmente -->
            <div v-if="uploadMode === 'manual'" class="mb-3">
              <label class="form-label">Agregar Referencia:</label>
              <div class="input-group">
                <input type="text" class="form-control" v-model="newItemReferencia"
                  @keydown.enter.stop.prevent="addItem" />
                <button type="button" class="btn btn-dark" @click="addItem">
                  <i class="bi bi-plus-circle"></i>
                </button>
              </div>
            </div>

            <!-- Cargar Excel (opcional) -->
            <div v-if="uploadMode === 'massive'">

              <label class="form-label">Cargar Archivo Excel</label>
              <div class="mb-3 d-flex justify-content-between align-items-center">
                <div class="d-flex">
                  <div class="input-group">
                    <!-- El input real se oculta visualmente en el botón pero sigue mostrando el nombre del archivo -->
                    <input id="fileUpload" type="file" @change="handleFileUpload" accept=".xlsx, .xls"
                      class="file-input form-control" style="width:max-content !important;" />
                    <!-- Label que funcionará como disparador para abrir el diálogo de archivos -->
                    <label for="fileUpload" class="btn btn-dark d-flex align-items-center" style="cursor: pointer;">
                      <i class="bi bi-upload"></i>
                      <span></span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <!-- Dirección de Recolección (requerida) -->
            <div class="mb-3">
              <label class="form-label">Dirección de Recolección:</label>
              <div class="input-group">
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

            <!-- Observaciones (opcional) -->
            <div class="mb-3">
              <label class="form-label">Observaciones (Opcional)</label>
              <textarea class="form-control" rows="5" v-model="observations"
                placeholder="Escribe tus observaciones aquí."></textarea>
            </div>

            <!-- Botones de acción -->
            <div class="modal-footer d-flex justify-content-between m-0 p-0 pt-3">
              <button type="submit" class="btn btn-success">{{ actionType }}</button>
              <button type="button" class="btn btn-secondary" @click="closeModal">
                Cancelar
              </button>
            </div>
          </form>
        </div>

        <!-- Columna Derecha: Lista de ítems cargados -->
        <div class="modal-items">
          <div class="mb-3" v-if="itemsForm.length">
            <div class="d-flex justify-content-between">

              <label class="form-label"> <strong> Referencias a Transferir</strong></label>
              <label class="form-label me-3"><strong>Total de Referencias:</strong> {{ itemsForm.length }}</label>
            </div>
            <div class="scroll-container me-3">
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
          <!-- Mensaje en caso de no tener ítems -->
          <EmptyState v-if="itemsForm.length === 0" message="No hay Referencias Cargadas" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// Asegúrate de instalar SheetJS: npm install xlsx
import * as XLSX from "xlsx";

import apiClient from "@/services/api";
import { useLoaderStore } from "@/stores/loaderStore";
import { useAuthStore } from "@/stores/authStore";
import { useClientStore } from "@/stores/clientStore";
import EmptyState from "@/components/EmptyState.vue";
import Swal from "sweetalert2";

export default {
  name: "TransferenciaModal",
  props: {
    modalTitle: {
      type: String,
      default: "Solicitar Transferencia",
    },
    actionType: {
      type: String,
      default: "Confirmar",
    },
  },
  components: {
    EmptyState,
  },
  data() {
    return {
      loaderStore: useLoaderStore(),
      newItemReferencia: "",
      itemsForm: [],
      observations: "",
      excelFile: null,
      clientStore: null, // Referencia al store
      direcciones: [],
      selectedAddress: "",
      hoveredButton: "",
      uploadMode: "manual", // "manual" o "massive"
    };
  },
  computed: {
    showModal() {
      // Retornamos el getter del store
      return this.clientStore.getShowSolicitudTransporte;
    },
  },
  created() {
    this.clientStore = useClientStore();
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
    async getDirecctionsClient(clienteId) {
      try {
        const response = await apiClient.get(`api/direcciones/cliente/${clienteId}`);
        return response.data;
      } catch (error) {
        console.error("Error al obtener direcciones del cliente:", error);
        throw error;
      }
    },
    addItem() {
      const ref = this.newItemReferencia.trim();
      if (ref === "") {
        Swal.fire({
          icon: "warning",
          title: "Atención",
          text: "Ingrese un valor para la referencia.",
          timer: 3000,
          toast: true,
          position: "top-end",
          showConfirmButton: false,
        });
        return;
      }
      // Agregar el ítem si no está duplicado
      if (this.itemsForm.some(item => item.referencia2 === ref)) {
        Swal.fire({
          icon: "warning",
          title: "Atención",
          text: "La referencia ya existe en la lista.",
          timer: 3000,
          toast: true,
          position: "bottom-end",
          showConfirmButton: false,
        });
        return;
      }
      this.itemsForm.push({ referencia2: ref });
      this.newItemReferencia = "";
    },
    removeItem(index) {
      this.itemsForm.splice(index, 1);
    },
    handleFileUpload(event) {
      // Reinicia la lista para evitar acumulados de cargas previas
      this.itemsForm = [];

      const file = event.target.files[0];
      if (!file) return;

      // Validar extensión (sólo .xlsx y .xls)
      if (!file.name.match(/\.(xlsx|xls)$/i)) {
        Swal.fire({
          icon: "error",
          title: "Tipo de archivo inválido",
          text: "Por favor, sube un archivo Excel (.xlsx o .xls).",
          toast: true,
          position: "bottom-end",
          timer: 3000,
          showConfirmButton: false,
        });
        return;
      }

      // Validar tamaño del archivo (máximo 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        Swal.fire({
          icon: "error",
          title: "Archivo muy grande",
          text: "El tamaño del archivo supera el límite permitido (5MB).",
          toast: true,
          position: "bottom-end",
          timer: 3000,
          showConfirmButton: false,
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          // Validar que el archivo tenga al menos dos filas (encabezado + registros)
          if (!jsonData || jsonData.length <= 1) {
            Swal.fire({
              icon: "warning",
              title: "Archivo vacío",
              text: "El archivo solo contiene el encabezado o no tiene registros para procesar.",
              toast: true,
              position: "bottom-end",
              timer: 3000,
              showConfirmButton: false,
            });
            return;
          }

          // Se asume que la primera fila es el encabezado "referencia2"
          const header = jsonData[0];
          const indiceReferencia = header.findIndex(
            (col) => typeof col === "string" && col.toLowerCase() === "referencia2"
          );
          if (indiceReferencia === -1) {
            Swal.fire({
              icon: "error",
              title: "Error",
              text: "El archivo no contiene el encabezado 'referencia2'.",
              toast: true,
              position: "bottom-end",
              timer: 3000,
              showConfirmButton: false,
            });
            return;
          }

          // Arreglo para detectar duplicados dentro del mismo archivo
          const refsFile = [];
          const duplicateInFile = [];
          // Validación de formato: por ejemplo, referencia alfanumérica de al menos 5 caracteres
          const refRegex = /^[A-Za-z0-9]{5,}$/;

          // Recorrer las filas a partir de la segunda fila
          jsonData.slice(1).forEach((row) => {
            const ref = row[indiceReferencia];
            if (ref && typeof ref === "string" && ref.trim() !== "") {
              const trimmedRef = ref.trim();
              // Validar el formato de la referencia
              if (!refRegex.test(trimmedRef)) {
                Swal.fire({
                  icon: "warning",
                  title: "Formato de referencia inválido",
                  text: `La referencia "${trimmedRef}" no cumple con el formato esperado.`,
                  toast: true,
                  position: "bottom-end",
                  timer: 3000,
                  showConfirmButton: false,
                });
                // Se omite esta referencia
                return;
              }
              // Validar duplicados en el archivo
              if (refsFile.includes(trimmedRef)) {
                duplicateInFile.push(trimmedRef);
              } else {
                refsFile.push(trimmedRef);
                this.itemsForm.push({ referencia2: trimmedRef });
              }
            }
          });

          // Validar si se agregaron registros válidos
          if (this.itemsForm.length === 0) {
            Swal.fire({
              icon: "warning",
              title: "Sin registros válidos",
              text: "El archivo no contiene registros válidos para procesar.",
              toast: true,
              position: "bottom-end",
              timer: 3000,
              showConfirmButton: false,
            });
            return;
          }

          // Mostrar alerta si se detectaron duplicados en el archivo
          if (duplicateInFile.length > 0) {
            Swal.fire({
              icon: "warning",
              title: "Referencias duplicadas",
              text:
                "Las siguientes referencias se encontraron duplicadas y solo se cargó una vez: " +
                duplicateInFile.join(", "),
              toast: true,
              position: "bottom-end",
              timer: 3000,
              showConfirmButton: false,
            });
          } else {
            Swal.fire({
              icon: "success",
              title: "Carga exitosa",
              text: "Las referencias se agregaron correctamente a la lista.",
              toast: true,
              position: "bottom-end",
              timer: 3000,
              showConfirmButton: false,
            });
          }
        } catch (error) {
          console.error("Error al procesar el archivo Excel:", error);
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "No se pudo procesar el archivo Excel.",
            toast: true,
            position: "bottom-end",
            timer: 3000,
            showConfirmButton: false,
          });
        }
      };

      reader.readAsArrayBuffer(file);
    },
    downloadTemplate() {
      // Generar un libro de Excel con una hoja que contenga la columna "referencia2"
      const wb = XLSX.utils.book_new();
      const wsData = [["referencia2"]]; // Encabezado
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      XLSX.utils.book_append_sheet(wb, ws, "Template");
      // Generar archivo y descargar
      XLSX.writeFile(wb, "template_referencias.xlsx");
    },
    async confirm() {
      // Validar duplicados antes de enviar
      const refs = this.itemsForm.map(item => item.referencia2);
      const duplicates = refs.filter((ref, index) => refs.indexOf(ref) !== index);
      if (duplicates.length > 0) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Existen referencias duplicadas.",
          toast: true,
          position: "bottom-end",
          timer: 3000,
          showConfirmButton: false,
        });
        return; // Evitamos enviar el payload
      }

      // Validar que se hayan agregado ítems
      if (!this.itemsForm.length) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Debe agregar al menos una Referencia2.",
          toast: true,
          position: "bottom-end",
          timer: 3000,
          showConfirmButton: false,
        });
        return;
      }

      // Validar que se haya seleccionado una dirección de recolección
      if (!this.selectedAddress) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Debe seleccionar una Dirección de Recolección.",
          toast: true,
          position: "bottom-end",
          timer: 3000,
          showConfirmButton: false,
        });
        return;
      }

      const authStore = useAuthStore();
      const clienteId = authStore.user.clienteId || 2;
      const usuarioId = authStore.user.id || 3;

      const payload = {
        clienteId,
        usuarioId,
        items: this.itemsForm,
        observaciones: this.observations,
        direccionRecoleccion: this.selectedAddress
      };

      try {
        this.loaderStore.showLoader();
        const response = await apiClient.post("/api/transferencias/crear", payload);
        console.log(response);
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
        this.$emit("reloadData");
        this.resetForm();
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
      this.clientStore.clearShowSolicitudTransporte();
      this.$emit("close");
    },
  },
};
</script>

<style scoped>
.modal-content {
  background: #fff;
  border-radius: 4px;
  width: 90%;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

/* Encabezado y botones */
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

/* Contenedor flex para dos columnas */
.modal-body-flex {
  display: grid;
  grid-template-columns: 35% 65%;
  gap: 1rem;
}

.modal-form {
  flex: 0 0 35%;
}

.modal-items {
  flex: 0 0 65%;
  border-left: 1px solid #dee2e6;
  padding-left: 1rem;
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
  max-height: 300px;
  overflow-y: auto;
}

.file-input::file-selector-button {
  /* Quita estilos por defecto */
  border: none;
  background: none;
  padding: 0;
  margin-right: 0;
  cursor: pointer;


  /* Oculta el texto predeterminado */
  color: transparent;

  /* Inserta el ícono usando una imagen de fondo (SVG inline de Bootstrap Icons bi-upload) */
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='currentColor' class='bi bi-upload' viewBox='0 0 16 16'%3E%3Cpath d='M.5 9.9a.5.5 0 0 1 .5-.5h4V1.5a.5.5 0 0 1 1 0v8.9h4a.5.5 0 0 1 .354.854l-5 5a.5.5 0 0 1-.708 0l-5-5A.5.5 0 0 1 .5 9.9zM5 10.5v4h1v-4H5z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: center;
  background-size: 1.5em 1.5em;

  /* Establece dimensiones para el botón */
  width: 10px;
  height: 0px;
}
</style>
