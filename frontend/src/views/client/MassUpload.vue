<template>
  <div class="container-fluid m-0 p-0">
    <div class="mass-upload-container m-0 p-0">
      <div class="row p-0 m-0">
        <!-- Card izquierda: Formulario de Carga Masiva (4 columnas) -->
        <div class="col-md-4 mb-3">
          <div class="card shadow-sm">
            <div
              class="card-header d-flex justify-content-between align-items-center"
            >
              <div>
                <i class="bi bi-files-alt me-2"></i>
                <strong class="text-uppercase"
                  >Carga masiva de {{ actionLabel }}</strong
                >
              </div>

              <button
                class="custom-btn excel"
                @click="descargarPlantilla"
                @mouseover="hoveredButton = 'excel'"
                @mouseleave="hoveredButton = ''"
              >
                <i
                  :class="
                    hoveredButton === 'excel'
                      ? 'bi bi-arrow-down-circle-fill'
                      : 'bi bi-file-excel-fill'
                  "
                ></i>
                <span v-if="hoveredButton !== 'excel'">Plantilla</span>
                <span v-else>Descargar</span>
              </button>
            </div>
            <div class="card-body">
              <!-- Botón para descargar plantilla -->

              <!-- Seleccionar Archivo Excel -->
              <div class="mb-3">
                <label for="fileInput" class="form-label"
                  >Selecciona el archivo Excel</label
                >
                <input
                  ref="fileInput"
                  id="fileInput"
                  type="file"
                  accept=".xlsx"
                  class="form-control"
                  @change="handleFileChange"
                />
              </div>

              <!-- Observación Global -->
              <div class="mb-3">
                <label for="observacionInput" class="form-label"
                  >Observación</label
                >
                <input
                  id="observacionInput"
                  type="text"
                  v-model="observacion"
                  class="form-control"
                  placeholder="Ingrese observación global"
                />
              </div>
              <div class="d-flex justify-content-between">
                <!-- Botón para enviar el archivo -->
                <button class="custom-btn" style="background-color: black; color: white;" @click="uploadFile"
                :disabled="!selectedFile">
                  <i class="'bi bi-cloud-arrow-up-fill text-white'"></i>
                  <span>Cargar archivo</span>
                </button>

                <button class="custom-btn" @click="volver">
                  <i class="'bi bi-arrow-down-left-circle text-dark'"></i>
                  <span>Cancelar y regresar </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Card derecha: Preview de registros del archivo (8 columnas) -->
        <div class="col-md-8 mb-3">
          <div class="card shadow-sm">
            <div
              class="card-header d-flex justify-content-between align-items-center"
            >
              <div>
                <i class="bi bi-eye-fill me-2"></i
                ><strong>PREVISUALIZACIÓN</strong>
              </div>
                <strong v-if="fileRecords.length > 0" >Registros: {{ fileRecords.length }}</strong>
  
            </div>
            <div class="card-body m-0 p-0">
              <div v-if="fileRecords.length > 0">
                <table class="table table-bordered m-0 p-0">
                  <thead>
                    <tr>
                      <th
                        class="text-uppercase text-center"
                        v-for="(header, index) in expectedHeaders"
                        :key="index"
                      >
                        {{
                          header === "referencia2"
                            ? "Referencia"
                            : header === "direccion_entrega"
                            ? "Dirección"
                            : header === "urgencia"
                            ? "Urgencia"
                            : header
                        }}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(record, index) in paginatedFileRecords"
                      :key="index"
                    >
                      <td
                        class="text-center"
                        v-for="(value, idx) in record"
                        :key="idx"
                      >
                        {{ value }}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <button
                  class="btn btn-sm btn-outline-secondary"
                  v-if="hasMoreFileRecords"
                  @click="loadMoreFileRecords"
                >
                  Cargar más registros
                </button>
              </div>
              <EmptyState v-else />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import apiClient from "@/services/api"; // Configurado, por ejemplo, con Axios
import * as XLSX from "xlsx"; // Importación para entornos ESM (Vite)
import Swal from "sweetalert2";
import { useAuthStore } from "@/stores/authStore";
import { useUserStore } from "@/stores/userStore";
import { useTabStore } from "@/stores/tabStore";
import { useLoaderStore } from "@/stores/loaderStore";
import EmptyState from "../../components/EmptyState.vue";

export default {
  name: "MassUpload",
  components: {
    EmptyState,
  },
  data() {
    return {
      selectedFile: null,
      observacion: "",
      uploadMessage: "",
      uploadData: [],
      selectedHeaders: [], // Guarda la primera fila (encabezados) del Excel
      fileRecords: [], // Almacenará todas las filas del Excel (sin encabezado)
      currentPageFileRecords: 1,
      recordsPerPageFile: 20000, // Número de registros a cargar de a poco
      localMassAction: "",
      loaderStore: useLoaderStore(), // obtenemos el store del loader
      hoveredButton: "", // Estado para controlar el hover dinámico
    };
  },

  computed: {
    // Etiqueta según la acción almacenada en el store
    actionLabel() {
      if (this.localMassAction === "prestamo-masivo") {
        return "Préstamos Masivos";
      } else if (this.localMassAction === "devolucion-masiva") {
        return "Devoluciones Masivas";
      }
      return "Acción Masiva";
    },
    // Endpoints según la acción (usando localMassAction)
    endpointUpload() {
      if (this.localMassAction === "prestamo-masivo") {
        return "/api/excel/cargar";
      } else if (this.localMassAction === "devolucion-masiva") {
        return "/api/devoluciones/cargueMasivo";
      }
      return "";
    },
    endpointPlantilla() {
      if (this.localMassAction === "prestamo-masivo") {
        return "/api/excel/plantilla";
      } else if (this.localMassAction === "devolucion-masiva") {
        return "/api/excel/plantilla";
      }
      return "";
    },
    //TODO: Encabezados esperados: para "prestamo-masivo" se espera ["referencia2", "direccion_entrega", "urgencia"]
    expectedHeaders() {
      if (this.localMassAction === "prestamo-masivo") {
        return ["referencia2", "direccion_entrega", "urgencia"];
      } else if (this.localMassAction === "devolucion-masiva") {
        return ["referencia2"];
      }
      return [];
    },
    // Email del cliente se obtiene del store de autenticación
    emailCliente() {
      const authStore = useAuthStore();
      return authStore.user?.email || "";
    },
    idUsuario() {
      const authStore = useAuthStore();
      const result = authStore.user.id || ""
      console.log("<<<<<asalsdkaslaskdldkasld>>>>>>>>: ",result );
      
      return result;
    },
    // Computed para el preview de registros (lazy load)
    paginatedFileRecords() {
      const start = 0;
      const end = this.currentPageFileRecords * this.recordsPerPageFile;
      return this.fileRecords.slice(start, end);
    },
    hasMoreFileRecords() {
      return this.fileRecords.length > this.paginatedFileRecords.length;
    },
  },
  mounted() {
    // Obtener la acción de masa desde el store de usuario y asignarla a localMassAction
    const userStore = useUserStore();
    this.localMassAction = userStore.getMassAction;
    console.log("Local massAction:", this.localMassAction);
  },
  methods: {
    volver() {
      const tabStore = useTabStore();
      console.log("Antes de revertir, tabStore:", tabStore);
      tabStore.revertTab();
    },
    async descargarPlantilla() {
      if (!this.endpointPlantilla) {
        // Ocultar el loader siempre al finalizar
        this.loaderStore.hideLoader();
        Swal.fire({
          icon: "warning",
          title: "Plantilla no disponible",
          text: "No se ha configurado una plantilla para esta acción masiva.",
        });
        return;
      }

      // Obtener el token del store de autenticación
      const authStore = useAuthStore();
      const token = authStore.token;

      // Definir el tipo de plantilla según la acción masiva (por ejemplo, "prestamo-masivo" o "devolucion-masiva")
      // Puedes usar this.localMassAction directamente o definir una lógica adicional si es necesario.
      const tipo = this.localMassAction || "prestamo-masivo";

      // Construir la URL con el tipo y el token como parámetros
      const baseUrl = this.endpointPlantilla;
      const url =
        baseUrl +
        (baseUrl.includes("?") ? "&" : "?") +
        `tipo=${encodeURIComponent(tipo)}&token=${encodeURIComponent(token)}`;

      try {
        // Realizar la petición para obtener la plantilla como blob
        const response = await apiClient.get(url, { responseType: "blob" });
        // Crear un objeto URL para el blob y generar un enlace de descarga
        const blob = new Blob([response.data]);
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        // Intentar extraer el nombre de archivo de los headers, o usar un valor por defecto
        //fixme: se debe corregir el nombre del archivo en funcion del tipo de plantilla si devolucion o prestamo masivo 
        let fileName = "plantilla.xlsx";
        if (response.headers["content-disposition"]) {
          const fileNameMatch =
            response.headers["content-disposition"].match(/filename="(.+)"/);
          if (fileNameMatch && fileNameMatch.length === 2) {
            fileName = fileNameMatch[1];
          }
        }
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        // Liberar el objeto URL creado
        window.URL.revokeObjectURL(downloadUrl);
      } catch (error) {
        console.error("Error descargando la plantilla:", error);
        // Ocultar el loader siempre al finalizar
        this.loaderStore.hideLoader();
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Error al descargar la plantilla.",
        });
      }
    },

    handleFileChange(event) {
      const file = event.target.files[0];
      this.selectedFile = file;
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const data = e.target.result;
          const workbook = XLSX.read(data, { type: "binary" });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          // Extraer todas las filas: la primera se usa como encabezado
          const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          this.selectedHeaders = rows[0] || [];
          this.fileRecords = rows.slice(1);
          this.currentPageFileRecords = 1;
          if (this.fileRecords.length === 0) {
            // Ocultar el loader siempre al finalizar
            this.loaderStore.hideLoader();
            Swal.fire({
              icon: "warning",
              title: "Sin registros",
              text: "El archivo Excel seleccionado no contiene registros.",
              timer: 3000,
              showConfirmButton: false,
            }).then(() => {
              // Limpiar el input y reiniciar variables
              this.selectedFile = null;
              this.selectedHeaders = [];
              this.fileRecords = [];
              this.$refs.fileInput.value = "";
            });
          }
        };
        reader.readAsBinaryString(file);
      }
    },
    loadMoreFileRecords() {
      this.currentPageFileRecords++;
    },
    async uploadFile() {
      if (!this.selectedFile) {
        // Ocultar el loader siempre al finalizar
        this.loaderStore.hideLoader();
        Swal.fire({
          icon: "warning",
          title: "Archivo no seleccionado",
          text: "Por favor, seleccione un archivo Excel.",
        });
        return;
      }
      // Validar encabezados: comparar en orden sin distinguir mayúsculas/minúsculas
      const headers = this.selectedHeaders.map((h) => h.trim().toLowerCase());
      const expected = this.expectedHeaders.map((h) => h.trim().toLowerCase());

      // Armar mensaje de error para encabezados incorrectos
      let mismatches = [];
      for (let i = 0; i < expected.length; i++) {
        if (headers[i] !== expected[i]) {
          mismatches.push(
            `Posición ${i + 1}: se esperaba "${
              expected[i]
            }", pero se encontró "${headers[i] || "vacío"}"`
          );
        }
      }
      if (mismatches.length > 0) {
        // Ocultar el loader siempre al finalizar
        this.loaderStore.hideLoader();
        Swal.fire({
          icon: "error",
          title: "Error en encabezados",
          timer: 5000,
          html: `
        <div style="text-align: left; font-size: 14px; line-height: 1.4;">
          <p style="margin-bottom: 10px;">Los encabezados del archivo Excel no coinciden con los requeridos:</p>
          <ul style="margin: 0; padding-left: 20px;">
            ${mismatches.map((msg) => `<li>${msg}</li>`).join("")}
          </ul>
        </div>
      `,
        }).then(() => {
          // Ocultar el loader siempre al finalizar
          this.loaderStore.hideLoader();
          Swal.fire({
            toast: true,
            position: "bottom-end",
            icon: "error",
            title: "Encabezados incorrectos",
            text: "Verifique los encabezados del archivo Excel.",
            timer: 10000,
            timerProgressBar: true,
            showConfirmButton: false,
          });
        });
        return;
      }

      // Activar el loader antes de iniciar la petición
      this.loaderStore.showLoader();

      const formData = new FormData();
      formData.append("file", this.selectedFile);
      formData.append("usuarioId", this.idUsuario);
      formData.append("observacion", this.observacion);
console.log(formData.get("file"));
      console.log(formData.get("usuarioId")); 
      console.log(formData.get("observacion"));
console.log(this.endpointUpload);

      try {
        const response = await apiClient.post(this.endpointUpload, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        // Si la respuesta tiene errores parciales, se muestran en un alert de advertencia
        if (response.data.errores && response.data.errores.length > 0) {
          const numCreados = response.data.creados.length;
          const numErrores = response.data.errores.length;
          const total = numCreados + numErrores;
          // Ocultar el loader siempre al finalizar
          this.loaderStore.hideLoader();
          Swal.fire({
            icon: "warning",
            width: "700px",
            title: "Carga parcial completada",
            html: `<p>Se cargaron ${numCreados} de ${total} registros.</p>
               <p><strong>Errores encontrados:</strong></p>
                <div style="max-height: 200px; overflow-y: auto; text-align: left;">
               <ul style="text-align: left;">
                 ${response.data.errores
                   .map((err) => `<li>${err.error} (fila ${err.fila})</li>`)
                   .join("")}
               </ul>
                </div>`,
            showConfirmButton: true,
          });
        } else {
          // Ocultar el loader siempre al finalizar
          this.loaderStore.hideLoader();
          Swal.fire({
            icon: "success",
            title: "Éxito",
            text:
              response.data.message || "Carga masiva realizada exitosamente.",
            timer: 1500,
            showConfirmButton: false,
          });
        }
        this.uploadMessage =
          response.data.message || "Carga masiva realizada exitosamente.";
        this.uploadData = response.data.data || [];
        this.volver();
      } catch (error) {
        console.error("Error en la carga masiva:", error);
        if (
          error.response &&
          error.response.data &&
          (error.response.data.errores || error.response.data.error)
        ) {
          const errorsHTML = error.response.data.errores
            ? `<ul style="text-align: left;">${error.response.data.errores
                .map((err) => `<li>${err.error} (fila ${err.fila})</li>`)
                .join("")}</ul>`
            : "";

          // Ocultar el loader siempre al finalizar
          this.loaderStore.hideLoader();
          Swal.fire({
            icon: "error",
            width: "700px",
            title: "Error en la carga masiva",
            html: `<p>${
              error.response.data.error ||
              "Se encontraron errores al procesar la carga."
            }</p>
         <div style="max-height: 200px; overflow-y: auto; text-align: left;">
        ${errorsHTML}
         </div>`,
            showConfirmButton: true,
          });
        } else {
          // Ocultar el loader siempre al finalizar
          this.loaderStore.hideLoader();
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Error al realizar la carga masiva. Inténtelo nuevamente.",
          });
        }
        this.uploadMessage =
          "Error al realizar la carga masiva. Inténtelo nuevamente.";
      }
    },
  },
};
</script>

<style scoped>
.mass-upload-container {
  padding: 1rem;
}
</style>
