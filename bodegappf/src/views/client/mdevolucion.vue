<template>
  <div class="inventario-container px-3 py-0 mt-0">
    <!-- Encabezado con filtro, búsqueda y exportación a Excel -->
    <div class="card shadow">
      <div class="card-header px-0 py-0">
        <div class="row align-items-center m-0 p-0 py-3 d-flex justify-content-between">
          <div class="col-auto">
            <strong>REPORTE DE DEVOLUCIONES</strong>
          </div>
          <div class="col-auto d-flex align-items-center gap-2">
            <button class="custom-btn excel me-2" @click="exportToExcel" @mouseover="hoveredButton = 'excel'"
              @mouseleave="hoveredButton = ''">
              <i :class="hoveredButton === 'excel' ? 'bi bi-arrow-down-circle-fill' : 'bi bi-file-excel-fill'"></i>
              <span v-if="hoveredButton !== 'excel'">Excel</span>
              <span v-else>Descargar</span>
            </button>
            <div class="custom-search">
              <i class="bi bi-search search-icon"></i>
              <input type="text" class="form-control form-control-sm" placeholder="Buscar" v-model="searchTerm" />
            </div>
          </div>
        </div>
      </div>

      <!-- Tabla principal -->
      <div class="card-body m-0 p-0">
        <div class="table-container">
          <table class="table-compact table table-hover">
            <thead>
              <tr>
                <th>ID</th>
                <th>Traslado N°</th>
                <th>Estado</th>
                <th>Ultima Actualizacion</th>
                <th>Fecha Solicitud</th>
                <th>Transportista</th>
                <th>Documento de Identidad</th>
                <th>Placa Vehiculo</th>
                <th>Fecha Asignación</th>
                <th>Fecha Recogida</th>
                <th>Observaciones</th>
                <th>Dirección</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in registrosFiltrados" :key="item.id || index"
                @click="showDetalle(item.id, item.transportista, item.documentoIdentidad, item.placa, item.consecutivo)"
                style="cursor: pointer;">
                <td>{{ item.consecutivo }}</td>
                <td>{{ item.id }}</td>
                <td>{{ item.estado }}</td>
                <td>
                  {{ item.updatedAt !== item.createdAt
                    ? formatDate(item.updatedAt) + ' - ' + formatTime(item.updatedAt)
                    : 'Sin Actualizacion' }}
                </td>
                <td>{{ formatDate(item.createdAt) }} - {{ formatTime(item.createdAt) }}</td>
                <td>{{ item.transportista || 'Sin Asignar' }}</td>
                <td>{{ item.documentoIdentidad }}</td>
                <td>{{ item.placa }}</td>
                <td>{{ item.fechaAsignacion ? formatDate(item.fechaAsignacion) : 'Pendiente' }}</td>
                <td>{{ item.fechaCarga ? formatDate(item.fechaCarga) : 'Pendiente' }}</td>
                <td>{{ item.observaciones }}</td>
                <td>{{ item.direccion }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal integrado para el detalle de transporte -->
    <div v-if="detalleVisible" class="modal-wrapper">
      <div class="modal-content">
        <div class="modal-header card">
          <div class=" w-100 d-flex justify-content-between">

            <h5 class="modal-title">
              <strong class="text-muted">Detalles de Solicitud</strong>
              
            </h5>
            <button class="custom-btn me-2" @click="closeDetalleModal">
              <span>Cerrar</span>
            </button>
          </div>
        </div>
        <div class="modal-body px-2 pt-0 mx-2 mt-0 mb-2">
          <div v-if="loadingDetalle">
            <p>Cargando detalle...</p>
          </div>
          <div v-else>
            <!-- Información básica de la solicitud en dos columnas -->
            <div class="info-basica row my-1">
              <div class="col-md-6">
                <p class="my-1"><strong>Devolucion N°:</strong> {{ detalle.solicitud.consecutivo || 'N/A' }}</p>
              <p class="my-1"><strong>Traslado N°:</strong> {{ detalle.solicitud.id || 'N/A' }}</p>
              <p class="my-1"><strong>Observaciones:</strong> {{ detalle.solicitud.observaciones || 'Sin observaciones' }}</p>
            </div>
            <div class="col-md-6">
              <p class="my-1"><strong>Fecha Solicitud:</strong> {{ formatDate(detalle.solicitud.fechaSolicitud) || 'N/A' }}</p>
              <p class="my-1"><strong>Última Actualización:</strong> {{ formatDate(detalle.solicitud.updatedAt) || 'N/A' }}</p>
              <p class="my-1"><strong>Dirección:</strong> {{ detalle.solicitud.direccion || 'No disponible' }}</p>
              </div>
            </div>
     
<hr class="my-0 ">

            <!-- Tabs -->
            <div class="tabs-container mt-0">
              <ul class="tab-nav">
                <li :class="{ active: activeTab === 'progreso' }" @click="activeTab = 'progreso'">Progreso</li>
                <li :class="{ active: activeTab === 'detalle' }" @click="activeTab = 'detalle'">Detalle</li>
                <li :class="{ active: activeTab === 'historial' }" @click="activeTab = 'historial'">Historial</li>
                <li :class="{ active: activeTab === 'Transportista' }" @click="activeTab = 'Transportista'">
                  Transportista</li>
                <li :class="{ active: activeTab === 'acciones' }" @click="activeTab = 'acciones'">Acciones y Comentarios
                </li>
              </ul>
              <div class="tab-content">
                <!-- Tab Detalle: Timeline y resumen de progreso -->
                <div v-if="activeTab === 'progreso'">
                  <div ref="timelineRef" class="timeline-container">
                    <div class="base-line"></div>
                    <div class="progress-line" :style="{ width: animatedProgress + '%' }"></div>
                    <div class="progress-summary">
                    </div>
                    <div v-for="(step, index) in timelineSteps" :key="index" class="timeline-step">
                      <div class="icon-wrapper" :class="{ active: animatedProgress >= circleRelativePosition(index) }"
                        :title="step.label">
                        <i :class="step.icon"></i>
                      </div>
                      <div class="label">{{ step.label }}</div>
                    </div>
                  </div>
                </div>
                <!-- Tab Historial -->
                <div v-if="activeTab === 'historial'">
                  <div class="historial-section">
                    <h6>Historial de Estados</h6>
                    <table class="table table-bordered table-sm">
                      <thead>
                        <tr class="text-center">
                          <th>Estado</th>
                          <th>Fecha</th>
                          <th>Usuario</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(item, index) in detalle.historial" :key="index">
                          <td>{{ item.estado }}</td>
                          <td>{{ formatDate(item.fecha) }} - {{ formatTime(item.fecha) }}</td>
                          <td>{{ item.usuario }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <!-- Tab Contacto -->
                <div v-if="activeTab === 'Transportista'">
                  <div class="contacto-section">
                    <h6>Datos del Transportista</h6>
                    <table class="table table-bordered table-sm">
                      <thead>
                        <tr>
                          <th>Campo</th>
                          <th>Información</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td><strong>Transportista</strong></td>
                          <td>{{ detalle.solicitud.transportista || 'Sin asignar' }}</td>
                        </tr>
                        <tr>
                          <td><strong>Documento de Identidad</strong></td>
                          <td>{{ detalle.solicitud.documentoIdentidad || 'Sin asignar' }}</td>
                        </tr>
                        <tr>
                          <td><strong>Placa Vehiculo</strong></td>
                          <td>{{ detalle.solicitud.placa || 'Sin asignar' }}</td>
                        </tr>
                        <!-- Puedes agregar más filas si hay más datos disponibles -->
                      </tbody>
                    </table>
                  </div>
                </div>
                <!-- Tab Acciones y Comentarios -->
                <div v-if="activeTab === 'acciones'">
                  <div class="acciones-section">
                    <button class="btn btn-sm btn-primary me-2" @click="reprogramarEntrega">Reprogramar Entrega</button>
                    <button class="btn btn-sm btn-success me-2" @click="confirmarRecepcion">Confirmar Recepción</button>
                    <button class="btn btn-sm btn-secondary" @click="generarReportePDF">Generar Reporte</button>
                  </div>
                  <div class="comentarios-section mt-3">
                    <h6>Comentarios / Notas</h6>
                    <textarea v-model="comentario" class="form-control" rows="3"
                      placeholder="Ingrese sus comentarios..."></textarea>
                    <button class="btn btn-sm btn-info mt-2" @click="guardarComentario">Guardar Comentario</button>
                  </div>
                </div>
                <div v-if="activeTab === 'detalle'">
                  <div class="scroll-container mt-3">
                    <table class="table table-bordered table-sm m-0 p-0">
                      <thead>
                        <tr class="text-center">
                          <th>Tipo</th>
                          <th>Referencia 2</th>
                          <th>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="item in detalle.detalle" :key="item.id" class="text-center">
                          <td>{{ item.tipo }}</td>
                          <td>{{ item.referencia2 }}</td>
                          <td>{{ item.estado }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            <!-- Fin Tabs -->

          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script>
import Logo from "@/assets/img/siglo.png";
import apiClient from "@/services/api";
import { useAuthStore } from "@/stores/authStore";
import { useLoaderStore } from "@/stores/loaderStore";
import { useClientStore } from "@/stores/clientStore";
import { DateTime } from "luxon";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import QRCode from "qrcode";

const timelineMap = {
  Prestamo: [
    { label: "solicitud creada", icon: "bi bi-file-earmark-plus" },
    { label: "asignado a transportador", icon: "bi bi-truck" },
    { label: "en proceso de entrega", icon: "bi bi-hourglass-split" },
    { label: "entregado por transportador", icon: "bi bi-check2-circle" },
    { label: "entrega confirmada", icon: "bi bi-check-all" }
  ],
  Transferencia: [
    { label: "solicitud creada", icon: "bi bi-file-earmark-plus" },
    { label: "asignado a transportador", icon: "bi bi-truck" },
    { label: "en proceso de recolección", icon: "bi bi-hourglass-split" },
    { label: "recogido", icon: "bi bi-check2-circle" },
    { label: "en bodega", icon: "bi bi-box-seam" },
    { label: "completado", icon: "bi bi-check-all" }
  ],
  Devolucion: [
    { label: "solicitud creada", icon: "bi bi-file-earmark-plus" },
    { label: "asignado a transportador", icon: "bi bi-truck" },
    { label: "en proceso de recolección", icon: "bi bi-hourglass-split" },
    { label: "recogido", icon: "bi bi-check2-circle" },
    { label: "devolucion completada", icon: "bi bi-check-all" }
  ],
  Desarchive: [
    { label: "solicitud creada", icon: "bi bi-file-earmark-plus" },
    { label: "asignado a transportador", icon: "bi bi-truck" },
    { label: "en proceso de entrega", icon: "bi bi-hourglass-split" },
    { label: "entregado", icon: "bi bi-check2-circle" },
    { label: "desarchivado", icon: "bi bi-check-all" }
  ]
};

export default {
  name: "devoluciones",
  data() {
    const today = new Date().toISOString().split("T")[0];
    return {
      Logo,
      animatedProgress: 0,
      activeTab: "progreso", // Tab activo por defecto
      totalRegistros: null,
      fechaDesde: today,
      fechaHasta: today,
      selectedEstado: "TODOS",
      estadosDisponibles: [],
      transferencias: [],
      searchTerm: "",
      hoveredButton: "",
      comentario: "",
      detalleVisible: false,
      loadingDetalle: false,
      // Se espera que la API devuelva historial; de lo contrario, se simula
      detalle: {
        solicitud: {},
        detalle: [],
        historial: []
      }
    };
  },
  computed: {
    progressTarget() {
      const totalSteps = this.timelineSteps.length;
      if (totalSteps <= 1) return 0;
      const fraction = this.currentStepIndex / (totalSteps - 1);
      return fraction * 80;
    },
    progressLineWidth() {
      return this.animatedProgress + "%";
    },
    timelineSteps() {
      const moduloActual = this.detalle.solicitud.modulo || "Devoluciones";
      return timelineMap[moduloActual] || [];
    },
    currentStepIndex() {
      if (!this.detalle.solicitud.estado) return 0;
      const estadoActual = this.detalle.solicitud.estado.toLowerCase();
      const index = this.timelineSteps.findIndex(
        step => step.label.toLowerCase() === estadoActual
      );
      return index !== -1 ? index : 0;
    },
    clientStore() {
      return useClientStore();
    },
    maxDate() {
      return new Date().toISOString().split("T")[0];
    },
    registrosFiltrados() {
      if (!this.searchTerm) return this.transferencias;
      const termino = this.searchTerm.toLowerCase();
      return this.transferencias.filter(registro => {
        return (
          String(registro.id).toLowerCase().includes(termino) ||
          (registro.referencia1 || "").toLowerCase().includes(termino) ||
          (this.formatDate(registro.fechaSolicitud) || "").toLowerCase().includes(termino)
        );
      });
    },
    formatDate() {
      return dateString => {
        if (!dateString) return "N/A";
        const dt = DateTime.fromISO(dateString, { zone: "utc" });
        return dt.setLocale("es").toFormat("dd/MM/yyyy");
      };
    },
    formatTime() {
      return dateString => {
        if (!dateString) return "N/A";
        const dt = DateTime.fromISO(dateString, { zone: "utc" });
        return dt.setLocale("es").toFormat("hh:mm a");
      };
    }
  },
  mounted() {
    //this.fetchEstados();
    this.fetchtransferencias();
  },
  methods: {
    async generarHashUnico() {
      const sol = this.detalle.solicitud || {};
      const dataToHash = `solicitud_${sol.id || "N/A"}_${new Date().toISOString()}`;
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(dataToHash);
      const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return hashHex;
    },
    async generarReportePDF() {
    // Forzar que la pestaña de Progreso esté activa para que el timeline se renderice
    this.activeTab = "progreso";
    await this.$nextTick();

    // Crea el documento PDF en formato A4 vertical
    const doc = new jsPDF("p", "mm", "a4");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);

    const marginLeft = 15;
    let currentY = 20;
    const pageWidth = doc.internal.pageSize.getWidth();

    // 1. Agrega el logo en la parte superior izquierda
    doc.addImage(Logo, "PNG", 10, 10, 30, 15);

    // Genera el QR code (opcional) en la esquina superior derecha
    const sol = this.detalle.solicitud || {};
    const qrContent = "solicitud_" + (sol.id || "N/A");
    let qrDataUrl = "";
    try {
      const QRCode = (await import("qrcode")).default;
      qrDataUrl = await QRCode.toDataURL(qrContent);
    } catch (error) {
      console.error("Error generando QR:", error);
    }
    const qrWidth = 30;
    const qrHeight = 30;
    const qrX = pageWidth - marginLeft - qrWidth;
    const qrY = 10;
    if (qrDataUrl) {
      doc.addImage(qrDataUrl, "PNG", qrX, qrY, qrWidth, qrHeight);
    }

    // 2. Título y fecha
    currentY = 30; // debajo del logo
    doc.setTextColor(204, 20, 23); // color #cc1417
    doc.setFontSize(18);
    doc.text("Reporte de Prestamos", marginLeft, currentY);
    currentY += 10;
    doc.setFontSize(11);
    doc.setTextColor(0);
    const fechaHoy = new Date().toLocaleDateString();
    doc.text(`Fecha: ${fechaHoy}`, marginLeft, currentY);
    currentY += 10;

    // 3. Sección: Detalle de Prestamo
    doc.setFontSize(14);
    doc.setTextColor(204, 20, 23);
    doc.text("Detalle de Prestamo", marginLeft, currentY);
    currentY += 7;
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text(`Traslado N°: ${sol.id || ""}`, marginLeft, currentY);
    currentY += 6;
    doc.text(`Estado: ${sol.estado || ""}`, marginLeft, currentY);
    currentY += 6;
    doc.text(`Observaciones: ${sol.observaciones || ""}`, marginLeft, currentY);
    currentY += 6;
    doc.text(`Fecha Solicitud: ${this.formatDate(sol.fechaSolicitud) || ""}`, marginLeft, currentY);
    currentY += 10;

    // 4. Sección: Timeline capturado como imagen
    const timelineElement = this.$refs.timelineRef;
    if (timelineElement) {
      const canvas = await html2canvas(timelineElement);
      const timelineImage = canvas.toDataURL("image/png");
      const pdfWidth = pageWidth - marginLeft * 2;
      const imgProps = doc.getImageProperties(timelineImage);
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      currentY += 5;
      doc.addImage(timelineImage, "PNG", marginLeft, currentY, pdfWidth, pdfHeight);
      currentY += pdfHeight + 10;
    } else {
      doc.text("Timeline no disponible.", marginLeft, currentY);
      currentY += 10;
    }

    // 5. Sección: Historial de Estados
    doc.setFontSize(14);
    doc.setTextColor(204, 20, 23);
    doc.text("Historial de Estados", marginLeft, currentY);
    currentY += 7;
    if (this.detalle.historial && this.detalle.historial.length > 0) {
      const historialData = this.detalle.historial.map(item => [
        item.estado,
        `${this.formatDate(item.fecha)} - ${this.formatTime(item.fecha)}`,
        item.usuario
      ]);
      autoTable(doc, {
        head: [["Estado", "Fecha", "Usuario"]],
        body: historialData,
        startY: currentY,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [204, 20, 23], textColor: 255 }
      });
      currentY = doc.lastAutoTable.finalY + 10;
    } else {
      doc.setTextColor(0);
      doc.text("No hay historial disponible.", marginLeft, currentY);
      currentY += 10;
    }

    // 6. Sección: Datos de Contacto
    doc.setFontSize(14);
    doc.setTextColor(204, 20, 23);
    doc.text("Datos de Contacto", marginLeft, currentY);
    currentY += 7;
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text(`Transportista: ${sol.transportista || "Sin asignar"}`, marginLeft, currentY);
    currentY += 6;
    doc.text(`Documento de Identidad: ${sol.documentoIdentidad || "Sin asignar"}`, marginLeft, currentY);
    currentY += 6;
    doc.text(`Placa Vehiculo: ${sol.placa || "Sin asignar"}`, marginLeft, currentY);
    currentY += 6;
    if (sol.telefono) {
      doc.text(`Teléfono: ${sol.telefono}`, marginLeft, currentY);
      currentY += 6;
    }
    if (sol.email) {
      doc.text(`Email: ${sol.email}`, marginLeft, currentY);
      currentY += 6;
    }
    currentY += 10;

    // 7. Sección: Comentarios / Notas
    doc.setFontSize(14);
    doc.setTextColor(204, 20, 23);
    doc.text("Comentarios / Notas", marginLeft, currentY);
    currentY += 7;
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text(this.comentario || "Sin comentarios.", marginLeft, currentY);
    currentY += 10;

    // 8. Footer: Información de la Empresa y Hash Único
    // Genera el hash único (Identificador de Autenticidad)
    const hashUnico = await this.generarHashUnico();

    // Posición del footer (por ejemplo, 20 mm desde el final de la página)
    const pageHeight = doc.internal.pageSize.getHeight();
    const footerY = pageHeight - 20;

    // Dibuja una línea horizontal para separar el contenido del footer
    doc.setLineWidth(0.5);
    doc.setDrawColor(204, 20, 23);
    doc.line(marginLeft, footerY - 5, pageWidth - marginLeft, footerY - 5);

    doc.setFontSize(9);
    doc.setTextColor(100);
    // Información de la empresa (ajusta los datos según tu empresa)
    doc.text(
      "Siglo21 Documental | Dirección: Av. Principal 123, Bogota, Colombia | documental@siglo21.com.co | siglo21.com.co",
      marginLeft,
      footerY
    );
    doc.text(
      "SECUREID: " + hashUnico,
      marginLeft,
      footerY + 5
    );

    // 9. Guarda el PDF
    doc.save(`Solicitud de Devolucion Nro- ${sol.id}.pdf`);
  },
    circleRelativePosition(index) {
      const totalSteps = this.timelineSteps.length;
      if (totalSteps <= 1) return 0;
      return (index / (totalSteps - 1)) * 80;
    },
    animateProgress() {
      const target = this.progressTarget;
      const speed = 40; // % por segundo
      const startTime = performance.now();
      const initial = this.animatedProgress;
      const distance = target - initial;
      const duration = Math.abs(distance) / speed * 1000;
      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        if (elapsed < duration) {
          this.animatedProgress = initial + distance * (elapsed / duration);
          requestAnimationFrame(animate);
        } else {
          this.animatedProgress = target;
        }
      };
      requestAnimationFrame(animate);
    },
    showDetalle(solicitudId, transportista, documentoIdentidad, placa, idDevolucion) {
      console.log("ID solicitud transferencia:", solicitudId, transportista, documentoIdentidad, placa, idDevolucion);
      this.loadingDetalle = true;
      this.detalleVisible = true;
      apiClient
        .post("/api/transferencias/detalle", { solicitudId })
        .then(response => {
          const data = response.data;
          this.detalle.solicitud = data.solicitud || {};
          this.detalle.detalle = data.detalle || [];
          this.detalle.historial = data.historial || [
            { estado: "solicitud creada", fecha: data.solicitud.createdAt, usuario: "Usuario A" },
            { estado: "asignado a transportador", fecha: data.solicitud.updatedAt, usuario: "Usuario B" }
          ];
          this.detalle.solicitud.transportista = transportista || 'Sin Asignar';
          this.detalle.solicitud.documentoIdentidad = documentoIdentidad || '';
          this.detalle.solicitud.placa = placa || '';
          this.detalle.solicitud.devolucionId = idDevolucion || '';
          // Reinicia y anima el progreso
          this.animatedProgress = 0;
          this.$nextTick(() => {
            this.animateProgress();
          });
        })
        .catch(error => {
          console.error("Error al obtener el detalle de transferencia:", error);
        })
        .finally(() => {
          this.loadingDetalle = false;
        });
    },

    closeDetalleModal() {
      this.detalleVisible = false;
      this.detalle = { solicitud: {}, detalle: [], historial: [] };
    },
    reprogramarEntrega() {
      console.log("Reprogramar entrega");
      alert("Función de reprogramación en desarrollo.");
    },
    confirmarRecepcion() {
      console.log("Confirmar recepción");
      alert("Función de confirmación en desarrollo.");
    },
    generarReporte() {
      console.log("Generar reporte");
      alert("Función de reporte en desarrollo.");
    },
    guardarComentario() {
      console.log("Comentario guardado:", this.comentario);
      alert("Comentario guardado.");
      this.comentario = "";
    },
    async fetchEstados() {
      try {
        const payload = {
          tipo: "devolucion",
          clienteId: useAuthStore().clienteId
        };
        console.log("Payload listar estados:", payload);
        const response = await apiClient.post("/api/estados/listar", payload);
        this.estadosDisponibles = response.data.data || ["TODOS"];
        console.log("Estados:", this.estadosDisponibles);
      } catch (error) {
        console.error("Error al obtener los estados:", error);
      }
    },
    async fetchtransferencias() {
      try {
        const clienteId = useAuthStore().clienteId;
        if (!clienteId) {
          console.error("❌ Error: Cliente ID no encontrado.");
          return;
        }
        const requestBody = { clienteId };
        const response = await apiClient.post("/api/transferencias/consultar", requestBody);
        this.transferencias = (response.data.data || []).filter(item =>
          item.modulo && item.modulo.toLowerCase() === "devolucion"
        );
        this.totalRegistros = response.data.data.length;
        console.info(response.data.data);
        console.info(this.totalRegistros);
        useLoaderStore().hideLoader();
      } catch (error) {
        console.error("Error al obtener datos de transferencias:", error);
      }
    },
    handleReloadData() {
      this.fetchtransferencias();
    },
    exportToExcel() {
      const dataToExport = this.transferencias.map(item => ({
        "Consecutivo": item.consecutivo,
        "Traslado N°": item.id,
        "Estado": item.estado,
        "Ultima Actualizacion": item.updatedAt !== item.createdAt
          ? this.formatDate(item.updatedAt) + " - " + this.formatTime(item.updatedAt)
          : "Sin Actualizacion",
        "Fecha Solicitud": this.formatDate(item.createdAt) + " - " + this.formatTime(item.createdAt),
        "Transportista": item.transportista || "Sin Asignar",
        "Documento de Identidad": item.documentoIdentidad,
        "Placa Vehiculo": item.placa,
        "Fecha Asignación": item.fechaAsignacion ? this.formatDate(item.fechaAsignacion) : "Pendiente",
        "Fecha Entrega": item.fechaCarga ? this.formatDate(item.fechaCarga) : "Pendiente",
        "Confirmo Entrega": item.usuarioVerifica || "Sin Confirmar",
        "Fecha de Confirmacion": item.fechaVerificacion ? this.formatDate(item.fechaVerificacion) : "Pendiente",
        "Observaciones": item.observaciones,
        "Dirección": item.direccion
      }));
      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "transferencias");
      XLSX.writeFile(wb, `Bodegapp_transferencias_${new Date().toISOString().split("T")[0]}.xlsx`);
    }
  }
};
</script>

<style scoped>
/* ----- Modal y Tabla ----- */
.modal-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 999;
  background-color: rgba(0, 0, 0, 0.5);
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
  max-width: 80%;
  height: 80vh;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
}

.modal-header,
.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.scroll-container {
  max-height: 200px;
  overflow-y: auto;
}

/* ----- Tabla ----- */
.table-compact {
  font-size: 0.8rem;
  width: 100%;
  border-collapse: collapse;
}

.table-compact thead th {
  position: sticky;
  top: 0;
  background-color: #f2f2f2;
  z-index: 2;
}

.table-compact tbody td:first-child,
.table-compact thead th:first-child {
  position: sticky;
  left: 0;
  margin-left: -10px;
  background-color: #c5c5c5;
  z-index: 1;
}

.table-compact thead th:first-child {
  z-index: 3;
}

.table-compact th,
.table-compact td {
  padding: 0.4rem;
  border: 1px solid #ddd;
  white-space: nowrap;
}

.table-compact thead {
  background-color: #f2f2f2;
}

/* ----- TIMELINE ----- */
.timeline-container {
  position: relative;
  width: 100%;
  padding: 40px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
}

.base-line {
  position: absolute;
  top: 50%;
  left: 10%;
  width: 80%;
  height: 6px;
  background-color: #ddd;
  border-radius: 3px;
  transform: translateY(20%);
  z-index: 1;
}

.progress-line {
  position: absolute;
  top: 50%;
  left: 10%;
  height: 6px;
  background-color: #cc1417;
  border-radius: 3px;
  transform: translateY(20%);
  z-index: 2;
  width: 0;
}

.progress-summary {
  position: absolute;
  top: 0;
  left: 10%;
  font-size: 0.9rem;
  font-weight: bold;
  color: #555;
  z-index: 3;
}

/* Cada paso del timeline */
.timeline-step {
  position: relative;
  z-index: 3;
  text-align: center;
  flex: 1;
  transform: translateY(30%);
  margin-top: 10px;
}

.icon-wrapper {
  width: 30px;
  height: 30px;
  background-color: #ddd;
  border-radius: 50%;
  margin: 0 auto 5px auto;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.5s;
  cursor: default;
}

.icon-wrapper i {
  color: #fff;
  font-size: 16px;
}

.icon-wrapper.active {
  background-color: #cc1417;
}

.label {
  min-height: 32px;
  font-size: x-small;
  display: inline-block;
  text-align: center;
}

/* ----- TABS ----- */
.tabs-container {
  margin-top: 20px;
}

.tab-nav {
  list-style: none;
  padding: 0;
  margin: 0 0 10px 0;
  display: flex;
  border-bottom: 1px solid #ddd;
}

.tab-nav li {
  padding: 8px 16px;
  cursor: pointer;
  margin-right: 5px;
  font-weight: bold;
  color: #555;
}

.tab-nav li.active {
  border-bottom: 3px solid #cc1417;
  color: #000;
}

.tab-content {
  padding: 0 0;
}

.tab-pane {
  /* Espacio interno para cada tab */
}

/* ----- Secciones adicionales ----- */
.historial-section,
.contacto-section,
.acciones-section,
.comentarios-section {
  margin: 0px 0;
}

.historial-section h6,
.contacto-section h6,
.comentarios-section h6 {
  margin-bottom: 10px;
  font-weight: bold;
}

.acciones-section button,
.comentarios-section button {
  margin-right: 10px;
}

.comentarios-section textarea {
  width: 100%;
  resize: vertical;
}
</style>
