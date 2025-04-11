<template>
    <div class="container-fluid py-2">
      <!-- Sección de Búsqueda y Filtros -->
      <div class="row g-2 align-items-center mb-3">
        <!-- Buscador -->
        <div class="col-12 col-sm-5 col-md-3">
          <div class="input-group">
            <span class="input-group-text"><i class="bi bi-search"></i></span>
            <input
              v-model="search"
              type="text"
              class="form-control"
              placeholder="Buscar..."
            />
          </div>
        </div>
  
        <!-- Botones de Módulos (Transferencia, Prestamo, etc.) -->
        <div class="col-12 col-sm-7 col-md-5">
          <ul class="nav nav-pills justify-content-center">
            <li class="nav-item" v-for="mod in modules" :key="mod">
              <button
                class="btn btn-sm me-2 mb-2"
                :class="{
                  'btn-outline-secondary': activeModule !== mod,
                  'btn-secondary': activeModule === mod
                }"
                @click="activeModule = mod"
              >
                {{ mod }}
              </button>
            </li>
          </ul>
        </div>
  
        <!-- Tabs: Pendientes / Completadas -->
        <div class="col-12 col-md-4">
          <ul class="nav nav-tabs justify-content-end">
            <li class="nav-item">
              <button
                class="nav-link"
                :class="{ active: activeTab === 'pendientes' }"
                @click="activeTab = 'pendientes'"
              >
                Pendientes
              </button>
            </li>
            <li class="nav-item">
              <button
                class="nav-link"
                :class="{ active: activeTab === 'completadas' }"
                @click="activeTab = 'completadas'"
              >
                Completadas
              </button>
            </li>
          </ul>
        </div>
      </div>
  
      <!-- Listado de Transferencias en Cards -->
      <div class="row g-3 mb-4">
        <!-- Si no hay transferencias, se muestra un mensaje -->
        <div v-if="filteredTransferencias.length === 0" class="col-12 text-center mt-5">
          <i class="bi bi-exclamation-circle me-2"></i>
          <span class="text-muted">No hay solicitudes registradas.</span>
        </div>
  
        <div
          v-for="t in filteredTransferencias"
          :key="t.id"
          class="col-12 col-sm-6 col-md-4 col-lg-3"
        >
          <div class="card shadow-sm h-100">
            <div class="card-body d-flex flex-column justify-content-between">
              <div>
                <p class="mb-1">
                  <strong>ID:</strong> {{ t.id }}
                </p>
                <p class="mb-1">
                  <strong>Cliente:</strong> {{ t.clienteId }}
                </p>
                <p class="mb-1">
                  <strong>Tipo Solicitud:</strong> {{ t.modulo }}
                </p>
                <p class="mb-1">
                  <strong>Estado:</strong>
                  <span :class="getEstadoClass(t.estado)">{{ t.estado }}</span>
                </p>
                <p class="mb-1">
                  <strong>{{ direccionHeader }}:</strong> {{ t.direccion }}
                </p>
                <p class="mb-1 text-truncate" style="max-width: 100%;">
                  <strong>Observaciones:</strong> {{ t.observaciones }}
                </p>
                <p class="mb-1">
                  <strong>Fecha Solicitud:</strong> 
                  {{ formatDate(t.fechaSolicitud) }}
                  - {{ formatTime(t.fechaSolicitud) }}
                </p>
              </div>
              <div class="mt-2 text-end">
                <button
                  class="btn btn-sm btn-outline-primary"
                  @click="seleccionarTransferencia(t)"
                >
                  <i class="bi bi-eye"></i> Ver Detalle
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
  
      <!-- Modal para Detalle -->
      <div
        class="modal fade"
        id="detalleModal"
        tabindex="-1"
        aria-labelledby="detalleModalLabel"
        aria-hidden="true"
        ref="detalleModal"
      >
        <!-- Modal fullscreen para pantallas pequeñas -->
        <div class="modal-dialog modal-fullscreen-sm-down modal-dialog-centered">
          <div class="modal-content">
            <!-- Encabezado del Modal -->
            <div class="modal-header">
              <h5 class="modal-title" id="detalleModalLabel">
                Detalle de Solicitud #{{ selectedTransferencia?.id }}
              </h5>
              <button
                type="button"
                class="btn-close"
                data-bs-dismiss="modal"
                aria-label="Cerrar"
                @click="closeDetalle"
              ></button>
            </div>
            <!-- Cuerpo del Modal -->
            <div class="modal-body">
              <div v-if="detalle">
                <!-- Info General -->
                <p>
                  <strong>Cliente:</strong> {{ selectedTransferencia.clienteId }}
                </p>
                <p>
                  <strong>Módulo:</strong> {{ selectedTransferencia.modulo }}
                </p>
                <p>
                  <strong>Estado Actual:</strong> 
                  <span :class="getEstadoClass(selectedTransferencia.estado)">
                    {{ selectedTransferencia.estado }}
                  </span>
                </p>
                <p>
                  <strong>Observaciones:</strong>
                  {{ selectedTransferencia.observaciones }}
                </p>
                <p>
                  <strong>Fecha Solicitud:</strong>
                  {{ formatDate(selectedTransferencia.fechaSolicitud) }}
                  - {{ formatTime(selectedTransferencia.fechaSolicitud) }}
                </p>
                <p>
                  <strong>Última Actualización:</strong>
                  {{ formatDate(selectedTransferencia.updatedAt) }}
                  - {{ formatTime(selectedTransferencia.updatedAt) }}
                </p>
  
                <hr />
                <h6>Detalles:</h6>
                <div class="table-responsive mb-3">
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
  
                <!-- Sección para asignar transportador si aplica -->
                <div v-if="estadoPermitido === 'asignado a transportador'">
                  <div class="mb-3">
                    <label for="transportista" class="form-label">Transportador:</label>
                    <input
                      type="text"
                      id="transportista"
                      class="form-control"
                      v-model="transportista"
                      placeholder="Ingrese el nombre del transportador"
                      required
                    />
                  </div>
                  <div class="mb-3">
                    <label for="documentoIdentidad" class="form-label">
                      Documento de Identidad:
                    </label>
                    <input
                      type="text"
                      id="documentoIdentidad"
                      class="form-control"
                      v-model="documentoIdentidad"
                      placeholder="Ingrese el documento de identidad"
                      required
                    />
                  </div>
                  <div class="mb-3">
                    <label for="placa" class="form-label">Placa:</label>
                    <input
                      type="text"
                      id="placa"
                      class="form-control"
                      v-model="placa"
                      placeholder="Ingrese la placa del vehículo"
                      required
                    />
                  </div>
                  <div class="mb-3">
                    <label for="sticker" class="form-label">Sticker Seguridad:</label>
                    <input
                      type="text"
                      id="sticker"
                      class="form-control"
                      v-model="sticker"
                      placeholder="Ingrese el código del sticker"
                    />
                  </div>
                </div>
  
                <!-- Asignación de Ubicaciones (si el estado es 'completado') -->
                <div v-if="estadoPermitido === 'completado'" class="mt-3">
                  <h6>Asignación de Ubicaciones:</h6>
                  <div
                    v-for="(item, idx) in detalle"
                    :key="item.id"
                    class="mb-2"
                  >
                    <label class="form-label">
                      Detalle ID {{ item.id }} - Ref.2: {{ item.referencia2 }}
                    </label>
                    <select
                      class="form-select form-select-sm"
                      v-model.number="item.nuevaUbicacionId"
                    >
                      <option disabled value="">
                        Seleccione ubicación...
                      </option>
                      <option
                        v-for="u in availableUbicaciones.filter(
                          (u) =>
                            !detalle.some(
                              (d) =>
                                d.nuevaUbicacionId === u.id && d.id !== item.id
                            )
                        )"
                        :key="u.id"
                        :value="u.id"
                      >
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
                <button
                  class="btn btn-success"
                  :disabled="botonDisabled"
                  @click="cambiarEstado"
                >
                  <i class="bi bi-qr-code-scan me-1"></i>
                  {{ botonDisabled ? "Confirmación Cliente Pendiente" : estadoPermitido || "Cambiar Estado" }}
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
        detalleModal: false,
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
        transportista: "",
        documentoIdentidad: "",
        placa: "",
        sticker: "",
      };
    },
    computed: {
      direccionHeader() {
        if (this.filteredTransferencias.length > 0) {
          const modulo = this.filteredTransferencias[0].modulo.toLowerCase();
          if (modulo === "transferencia" || modulo === "devolucion") {
            return "Dirección de recogida";
          } else if (
            modulo === "prestamo" ||
            modulo === "desarchivo" ||
            modulo === "desarchive"
          ) {
            return "Dirección de entrega";
          }
        }
        return "";
      },
      filteredTransferencias() {
        return this.transferencias.filter((t) => {
          const estadoLower = t.estado?.toLowerCase() || "";
          const moduloLower = t.modulo?.toLowerCase() || "";
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
  
          return this.activeTab === "completadas"
            ? isCompleted && matchModule && matchEstado && matchBusqueda
            : !isCompleted && matchModule && matchEstado && matchBusqueda;
        });
      },
    },
    methods: {
      formatDate(dateString) {
        if (!dateString) return "N/A";
        const dt = DateTime.fromISO(dateString, { zone: "utc" });
        return dt.setLocale("es").toFormat("dd/MM/yyyy");
      },
      formatTime(dateString) {
        if (!dateString) return "N/A";
        const dt = DateTime.fromISO(dateString, { zone: "utc" });
        return dt.setLocale("es").toFormat("hh:mm a");
      },
      getEstadoClass(estado) {
        // Ejemplo: Retornar una clase según el estado
        if (!estado) return "";
        const lower = estado.toLowerCase();
        if (lower === "completado") return "text-success fw-bold";
        if (lower.includes("pendiente") || lower.includes("solicitud"))
          return "text-warning";
        return "";
      },
      async fetchTransferencias() {
        try {
          const body = { clienteId: 2 };
          const response = await apiClient.post(
            "/api/transferencias/consultar",
            body
          );
          this.transferencias = response.data.data || [];
        } catch (error) {
          console.error("Error fetching transferencias:", error);
        }
      },
      async fetchEstadoPermitido() {
        try {
          if (!this.selectedTransferencia) return;
          const tipoUsuarioId = this.authStore.user?.tipoUsuarioId;
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
        } catch (error) {
          console.error("Error fetching ubicaciones:", error);
        }
      },
      showDetalleModal() {
        const modalEl = this.$refs.detalleModal;
        if (!this.detalleModalInstance) {
          this.detalleModalInstance = new Modal(modalEl, {
            backdrop: "static",
            keyboard: false,
          });
        }
        this.detalleModalInstance.show();
      },
      closeDetalle() {
        if (this.detalleModalInstance) {
          this.detalleModalInstance.hide();
        }
        this.selectedTransferencia = null;
        this.detalle = null;
        this.transportista = "";
        this.placa = "";
        this.sticker = "";
        this.documentoIdentidad = "";
      },
      async cambiarEstado() {
        try {
          if (this.botonDisabled) {
            alert("No puedes avanzar de estado, otro rol debe intervenir.");
            return;
          }
  
          const accion = this.estadoPermitido?.toLowerCase() || "";
          if (accion === "asignado a transportador") {
            // Validar campos requeridos
            if (!this.transportista || !this.documentoIdentidad || !this.placa) {
              const Swal = await import("sweetalert2");
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
              return;
            }
          }
  
          // Si hay que asignar ubicaciones
          const asignaciones =
            accion === "completado"
              ? this.detalle
                  .filter((d) => d.nuevaUbicacionId)
                  .map((d) => ({
                    detalleId: d.id,
                    ubicacionId: d.nuevaUbicacionId,
                  }))
              : [];
  
          // Se prepara el cuerpo para el endpoint
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
            sticker: this.sticker || "",
          };
  
          const response = await apiClient.post("/api/transferencias/qr/scan", body);
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
  /* Espacios y márgenes generales */
  .container-fluid {
    padding: 1rem;
  }
  
  /* Separa las cards entre sí */
  .row.g-3 > [class*='col-'] {
    display: flex;
  }
  
  /* Ajustes para los cards del listado */
  .card {
    margin-bottom: 1rem;
    width: 100%;
  }
  
  .card .card-body {
    display: flex;
    flex-direction: column;
  }
  
  /* Estilo para la animación del icono de recarga */
  .spin {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0%   { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  /* Clases auxiliares para color de estado (ejemplo) */
  .text-warning {
    color: #ffc107 !important;
  }
  .text-success {
    color: #198754 !important;
  }
  .fw-bold {
    font-weight: 600 !important;
  }
  
  /* Ajustes de la tabla de detalles en el modal */
  .table-responsive {
    margin-top: 0.75rem;
  }
  
 
  /* Ajustes del modal en general */
  .modal-header {
    background-color: #f8f9fa;
  }
  </style>
  
<template>
    <div class="delivery-form container">
      <h2 class="title">Registro de Entrega de Cajas</h2>
      <form @submit.prevent="generatePDF" novalidate>
        <!-- Formulario de Información del Receptor -->
        <div class="form-section">
          <div class="form-group">
            <label for="receiverName">Nombre del Receptor</label>
            <input
              type="text"
              id="receiverName"
              v-model="form.receiverName"
              class="form-control"
              placeholder="Ingrese el nombre"
              required
            />
          </div>
          <div class="form-group">
            <label for="receiverId">Documento del Receptor</label>
            <input
              type="text"
              id="receiverId"
              v-model="form.receiverId"
              class="form-control"
              placeholder="Ingrese documento de identidad"
              required
            />
          </div>
          <div class="form-group">
            <label for="observations">Observaciones</label>
            <textarea
              id="observations"
              v-model="form.observations"
              class="form-control"
              rows="2"
              placeholder="Notas adicionales"
            ></textarea>
          </div>
        </div>
  
        <hr />
  
        <!-- Sección de Captura de Foto -->
        <div class="photo-section">
          <h3>Foto de Entrega</h3>
          <div class="video-wrapper">
            <video ref="video" autoplay playsinline class="video-camera"></video>
          </div>
          <button type="button" class="btn btn-primary" @click="capturePhoto">
            Capturar Foto
          </button>
          <div v-if="photoData" class="photo-preview">
            <img :src="photoData" alt="Foto de entrega" />
          </div>
        </div>
  
        <hr />
  
        <!-- Sección de Firma del Receptor -->
        <div class="signature-section">
          <h3>Firma del Receptor</h3>
          <div class="canvas-wrapper">
            <canvas ref="signatureCanvasReceiver" class="signature-canvas"></canvas>
          </div>
          <button type="button" class="btn btn-secondary" @click="clearSignatureReceiver">
            Limpiar Firma del Receptor
          </button>
        </div>
  
        <hr />
  
        <!-- Sección de Firma del Entregador -->
        <div class="signature-section">
          <h3>Firma del Entregador</h3>
          <div class="canvas-wrapper">
            <canvas ref="signatureCanvasDeliverer" class="signature-canvas"></canvas>
          </div>
          <button type="button" class="btn btn-secondary" @click="clearSignatureDeliverer">
            Limpiar Firma del Entregador
          </button>
        </div>
  
        <hr />
  
        <!-- Botón para generar PDF -->
        <div class="mt-4 text-center">
          <button type="submit" class="btn btn-success">
            Generar PDF de Acuse
          </button>
        </div>
      </form>
    </div>
  </template>
  
  <script>
  import SignaturePad from "signature_pad";
  import { jsPDF } from "jspdf";
  
  export default {
    name: "DeliveryPdfForm",
    data() {
      return {
        form: {
          receiverName: "",
          receiverId: "",
          observations: "",
        },
        photoData: "",
        signaturePadReceiver: null,
        signaturePadDeliverer: null,
      };
    },
    mounted() {
      this.initSignaturePads();
      this.startCamera();
    },
    methods: {
      initSignaturePads() {
        // Firma del receptor
        const canvasReceiver = this.$refs.signatureCanvasReceiver;
        // Ajustamos el ancho al contenedor (menos márgenes)
        canvasReceiver.width = this.$el.clientWidth - 40;
        canvasReceiver.height = 150; // Altura fija
        const ctxR = canvasReceiver.getContext("2d");
        ctxR.fillStyle = "rgba(0,0,0,0)";
        ctxR.fillRect(0, 0, canvasReceiver.width, canvasReceiver.height);
        this.signaturePadReceiver = new SignaturePad(canvasReceiver, {
          backgroundColor: "rgba(0,0,0,0)",
          penColor: "#000",
          throttle: 16,
          minWidth: 2,
          maxWidth: 3,
        });
  
        // Firma del entregador
        const canvasDeliverer = this.$refs.signatureCanvasDeliverer;
        canvasDeliverer.width = this.$el.clientWidth - 40;
        canvasDeliverer.height = 150;
        const ctxD = canvasDeliverer.getContext("2d");
        ctxD.fillStyle = "rgba(0,0,0,0)";
        ctxD.fillRect(0, 0, canvasDeliverer.width, canvasDeliverer.height);
        this.signaturePadDeliverer = new SignaturePad(canvasDeliverer, {
          backgroundColor: "rgba(0,0,0,0)",
          penColor: "#000",
          throttle: 16,
          minWidth: 2,
          maxWidth: 3,
        });
      },
      startCamera() {
        const video = this.$refs.video;
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          navigator.mediaDevices
            .getUserMedia({ video: { facingMode: "environment" } })
            .then((stream) => {
              video.srcObject = stream;
              video.play();
            })
            .catch((err) => {
              console.error("Error al acceder a la cámara:", err);
            });
        }
      },
      capturePhoto() {
        const video = this.$refs.video;
        if (!video) return;
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = video.videoWidth;
        tempCanvas.height = video.videoHeight;
        const ctx = tempCanvas.getContext("2d");
        ctx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
        // Convertir a Data URL en formato PNG
        this.photoData = tempCanvas.toDataURL("image/png");
      },
      clearSignatureReceiver() {
        if (this.signaturePadReceiver) {
          this.signaturePadReceiver.clear();
        }
      },
      clearSignatureDeliverer() {
        if (this.signaturePadDeliverer) {
          this.signaturePadDeliverer.clear();
        }
      },
      async generatePDF() {
        // Validaciones
        if (!this.form.receiverName || !this.form.receiverId) {
          alert("Complete la información del receptor.");
          return;
        }
        if (!this.photoData) {
          alert("Capture la foto de entrega.");
          return;
        }
        const receiverSignature = this.signaturePadReceiver && !this.signaturePadReceiver.isEmpty()
          ? this.$refs.signatureCanvasReceiver.toDataURL("image/png")
          : null;
        if (!receiverSignature) {
          alert("Capture la firma del receptor.");
          return;
        }
        const delivererSignature = this.signaturePadDeliverer && !this.signaturePadDeliverer.isEmpty()
          ? this.$refs.signatureCanvasDeliverer.toDataURL("image/png")
          : null;
        if (!delivererSignature) {
          alert("Capture la firma del entregador.");
          return;
        }
  
        // Crear el PDF
        const doc = new jsPDF("p", "mm", "a4");
        const pageWidth = doc.internal.pageSize.getWidth();
        let y = 20;
  
        // Título del Acuse
        doc.setFontSize(22);
        doc.text("Acuse de Entrega de Cajas", pageWidth / 2, y, { align: "center" });
        y += 20;
  
        // Datos del receptor (formulario)
        doc.setFontSize(12);
        doc.text(`Nombre del receptor: ${this.form.receiverName}`, 15, y);
        y += 10;
        doc.text(`Documento: ${this.form.receiverId}`, 15, y);
        y += 10;
        doc.text(`Observaciones: ${this.form.observations || "N/A"}`, 15, y, {
          maxWidth: pageWidth - 30,
        });
        y += 15;
  
        // Agregar Foto de Entrega
        doc.setFontSize(14);
        doc.text("Foto de entrega:", 15, y);
        y += 5;
        const imgWidth = pageWidth - 30;
        const imgHeight = (imgWidth * 9) / 16;
        doc.addImage(this.photoData, "PNG", 15, y, imgWidth, imgHeight);
        y += imgHeight + 15;
  
        // Agregar Firmas
        doc.setFontSize(14);
        doc.text("Firma del receptor:", 15, y);
        const signWidth = 80;
        const signHeight = 30;
        doc.addImage(receiverSignature, "PNG", 15, y + 5, signWidth, signHeight);
  
        doc.text("Firma del entregador:", pageWidth / 2 + 10, y);
        doc.addImage(delivererSignature, "PNG", pageWidth / 2 + 10, y + 5, signWidth, signHeight);
        y += signHeight + 20;
  
        // Pie de página (fecha de generación)
        doc.setFontSize(10);
        const now = new Date().toLocaleString();
        doc.text(`Acuse generado el ${now}`, 15, doc.internal.pageSize.getHeight() - 20);
  
        doc.save(`AcuseEntrega_${this.form.receiverName}.pdf`);
      }
    }
  };
  </script>
  
  <style scoped>
  .delivery-form {
    padding: 20px;
    max-width: 600px;
    margin: 20px auto;
    background-color: #fafafa;
    border-radius: 12px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }
  
  .title {
    text-align: center;
    margin-bottom: 20px;
    font-weight: bold;
  }
  
  /* Sección del formulario */
  .form-section {
    margin-bottom: 20px;
  }
  .form-group {
    margin-bottom: 15px;
  }
  .form-group label {
    font-weight: bold;
    display: block;
    margin-bottom: 5px;
  }
  .form-control {
    width: 100%;
    padding: 10px;
    font-size: 1rem;
    border: 1px solid #ccc;
    border-radius: 8px;
  }
  
  /* Foto de entrega */
  .photo-section {
    margin-bottom: 20px;
  }
  .video-wrapper {
    width: 100%;
    background-color: #000;
    border-radius: 8px;
    overflow: hidden;
    margin-bottom: 10px;
  }
  .video-camera {
    width: 100%;
    height: auto;
  }
  .photo-preview img {
    width: 100%;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }
  
  /* Sección de firma */
  .signature-section {
    margin-bottom: 20px;
  }
  .canvas-wrapper {
    border: 2px solid #ddd;
    border-radius: 8px;
    background-color: #fff;
    margin-top: 10px;
    overflow: hidden;
  }
  .signature-canvas {
    width: 100%;
    display: block;
  }
  
  /* Botones */
  .btn {
    padding: 10px 15px;
    font-size: 1rem;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.2s;
    width: 100%;
    margin-bottom: 10px;
  }
  .btn-primary {
    background-color: #007aff;
    color: #fff;
  }
  .btn-primary:hover {
    background-color: #006ae6;
  }
  .btn-secondary {
    background-color: #e0e0e0;
    color: #333;
  }
  .btn-secondary:hover {
    background-color: #d5d5d5;
  }
  </style>
  