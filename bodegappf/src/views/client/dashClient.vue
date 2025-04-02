<template>
  <div class="dashboard-container">
    <div class="container">
      <!-- Encabezado con mensaje de Bienvenida y hora actual -->
      <div class="row mb-2 px-3 d-flex align-items-center">
        <div class="col d-flex align-items-center">
          <h1 class="modern-title shimmer-text display-4 text-primary mb-0">
            {{ greeting }}, {{ clienteNombre.split(" ")[0] }}!
          </h1>
        </div>
        <div class="col d-flex justify-content-end align-items-baseline mt-4">
          <span class="modern-subtitle fs-4" style="color: #d9d9d9">
            {{ currentDate }} <i class="bi bi-clock ms-3"></i> {{ currentTime }}
          </span>
        </div>
        <hr class="mt-2" />
      </div>

      <!-- Tarjetas de métricas -->
      <div class="row mb-4">
        <!-- Cards1 - Ocupa 4 columnas -->
        <div class="col-4">
          <div class="mb-3" v-for="(card, index) in cards1" :key="index">
            <DashboardCard
              :name="card.title"
              :total="card.value"
              :color="card.color"
              :ancho="card.ancho"
              :backgroundIcon="card.backgroundIcon"
              :typeCard="card.type"
            >
              <i :class="card.iconClass"></i>
            </DashboardCard>
          </div>
        </div>

        <!-- Cards2 - Ocupa 8 columnas y se organiza en dos filas -->
        <div class="col-8">
          <div class="row">
            <div class="col-6 mb-3" v-for="(card, index) in cards2" :key="index">
              <DashboardCard
                :name="card.title"
                :total="card.value"
                :color="card.color"
                :ancho="card.ancho"
                :backgroundIcon="card.backgroundIcon"
                :typeCard="card.type"
              >
                <i :class="card.iconClass"></i>
              </DashboardCard>
            </div>
          </div>
        </div>
      </div>

      <!-- Panel principal: Actividad Reciente y Notificaciones -->
      <div class="row">
        <!-- Panel de Actividad Reciente con transición expandida -->
        <transition name="slide-enter-active">
          <div :class="maximized ? 'col-md-12' : 'col-md-8'" key="activity">
            <div class="card mb-4">
              <!-- Panel de Historial de Solicitudes -->
              <div class="card mb-4" :class="{ 'card-dark-custom': themeStore.theme === 'dark' }">
                <div class="card-header d-flex flex-column">
                  <div class="d-flex align-items-center mb-2">
                    <i class="bi bi-journal-text me-2"></i>
                    <span>Historial de Solicitudes</span>
                  </div>
                  <!-- Grupo de botones para filtro de fecha -->
                  <!-- <div class="btn-group" role="group" aria-label="Filtro por fecha">
                    <button
                      type="button"
                      class="btn btn-outline-primary"
                      :class="{ active: filtroTipo === 'diario' }"
                      @click="setFiltro('diario')"
                    >
                      Diario
                    </button>
                    <button
                      type="button"
                      class="btn btn-outline-primary"
                      :class="{ active: filtroTipo === 'semanal' }"
                      @click="setFiltro('semanal')"
                    >
                      Semanal
                    </button>
                    <button
                      type="button"
                      class="btn btn-outline-primary"
                      :class="{ active: filtroTipo === 'mensual' }"
                      @click="setFiltro('mensual')"
                    >
                      Mensual
                    </button>
                  </div> -->
                </div>
                <div class="card-body p-0" style="max-height: 350px; overflow-y: auto">
                  <table class="table table-sm table-striped mb-0 table-header" :class="{ 'table-dark-custom': themeStore.theme === 'dark' }">
                    <thead>
                      <tr>
                        <th class="text-start">ID Solicitud</th>
                        <th class="text-start">Tipo</th>
                        <th class="text-start">Estado</th>
                        <th class="text-start">Fecha</th>
                        <th class="text-start">Hora</th>
                        <th class="text-start">Usuario</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(s, index) in solicitudesHistorial" :key="index">
                        <td class="text-start">{{ s.id }}</td>
                        <td class="text-start text-uppercase">{{ s.tipo }}</td>
                        <td class="text-start text-uppercase">{{ s.estado }}</td>
                        <td class="text-start">{{ s.fecha }}</td>
                        <td class="text-start">{{ s.hora }}</td>
                        <td class="text-start text-uppercase">{{ s.usuario }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </transition>

        <!-- Panel de Notificaciones, se oculta si está maximizado -->
        <transition name="expand">
          <div v-if="!maximized" class="col-md-4" key="notifications">
            <div class="card mb-4" :class="{ 'card-dark-custom': themeStore.theme === 'dark' }">
              <div class="card-header" style="height: fit-content !important">
                <i class="bi bi-megaphone me-2"></i>Historial Notificaciones
              </div>
              <div class="card-body m-0 p-0" style="height: fit-content !important">
                <div class="notification-bubbles-container">
                  <EmptyState v-if="notificationStore.allNotifications.length === 0" message="No hay Mensajes" />
                  <div v-for="notif in notificationStore.allNotifications" :key="notif.id" class="bubble" :class="{ read: notif.estado === 'leído' }">
                    <div class="bubble-content">
                      <div class="bubble-message">{{ notif.message }}</div>
                    </div>
                    <div class="bubble-footer">
                      <i class="bi bi-check-all me-1" :class="notif.estado === 'leído' ? 'text-success' : 'text-muted'"></i>
                      <div class="bubble-date">{{ formatDate(notif.createdAt) }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script>
import DashboardCard from "@/components/monitorCard.vue";
import EmptyState from "@/components/EmptyState.vue";
import { useThemeStore } from "@/stores/themeStore";
import { useAuthStore } from "@/stores/authStore";
import { useLoaderStore } from "@/stores/loaderStore";
import { useTabStore } from "@/stores/tabStore";
import { useNotificationStore } from "@/stores/notificationStore";
import apiClient from "@/services/api";
import dayjs from "dayjs";
import "dayjs/locale/es";

export default {
  name: "Dashboard",
  components: {
    DashboardCard,
    EmptyState,
  },
  data() {
    return {
      maximized: true,
      filtroTipo: "diario",
      loaderStore: useLoaderStore(),
      themeStore: useThemeStore(),
      authStore: useAuthStore(),
      tabStore: useTabStore(),
      notificationStore: useNotificationStore(),
      currentDate: dayjs().format("dddd,DD/MM/YYYY"),
      currentTime: dayjs().format("HH:mm:ss"),
      notes: "",
      cards1: [],
      cards2: [],
      transactions: [],
      inventarios: [],
      totalCustodias: 0,
      totalDisponible: 0,
      totalDevolucionProgress: 0,
      totalrecogidaProgress: 0,
      totalPrestamo: 0,
      solicitudesHistorial: [],
    };
  },
  computed: {
    currentTab() {
      return this.tabStore.globalCurrentTab;
    },
    greeting() {
      const hour = dayjs().hour();
      if (hour >= 6 && hour < 12) return "Buenos días";
      else if (hour >= 12 && hour < 18) return "Buenas tardes";
      else return "Buenas noches";
    },
    clienteNombre() {
      return (
        this.authStore.user?.nombre ||
        localStorage.getItem("clienteNombre") ||
        "Cliente"
      );
    },
  },
  mounted() {
    this.fetchCustodias();
    this.updateCards();
    this.updateDateTime();
    this.fetchHistorial();
  },
  methods: {
    async fetchHistorial() {
      try {
        const response = await apiClient.post("/api/auditoria", {
          clienteId: this.authStore.clienteId,
          filtroTipo: 'semanal',
        });
        //console.log(response);
        this.solicitudesHistorial = response.data.map((item) => ({
          id: item.solicitudTransporte,
          tipo: item.ModuloConsecutivo,
          estado: item.EstadoSolicitud,
          fecha: item.Fecha,
          hora: item.Hora,
          usuario: item.NombreUsuario,
        }));
      } catch (err) {
        console.error("Error al obtener historial:", err);
      }
    },
    setFiltro(tipo) {
      this.filtroTipo = tipo;
      this.fetchHistorial();
    },
    formatDate(dateStr) {
      return dayjs(dateStr).format("DD/MM/YYYY HH:mm");
    },
    toggleMaximize() {
      this.maximized = !this.maximized;
    },
    updateDateTime() {
      setInterval(() => {
        this.currentDate = dayjs()
          .locale("es")
          .format("dddd, DD/MM/YYYY")
          .toUpperCase();
        this.currentTime = dayjs().locale("es").format("h:mm A");
      }, 1000);
    },
    updateCards() {
      this.cards1 = [
        {
          title: "Total en Inventario",
          value: this.inventarios.length,
          subtitle: "Cajas totales en el sistema",
          backgroundIcon: "bi bi-safe-fill",
          type: 1,
          color: "linear-gradient(135deg, #898989, #2a2a2a)",
        },
      ];
      this.cards2 = [
        {
          title: "Cajas en Bodega",
          value: this.totalDisponible,
          subtitle: "Disponibles en bodega",
          backgroundIcon: "bi bi-archive-fill",
          type: 2,
          color: "linear-gradient(135deg, #235ca4, #041e40)",
        },
        {
          title: "Cajas Prestadas",
          value: this.totalPrestamo,
          subtitle: "En préstamo actualmente",
          backgroundIcon: "bi bi-buildings",
          type: 2,
          color: "linear-gradient(135deg, #235ca4, #041e40)",
        },
        {
          title: "Solicitides de Devolucion Pendientes",
          value: this.totalDevolucionProgress,
          subtitle: "Devoluciones",
          backgroundIcon: "bi bi-arrow-up-right-circle-fill",
          type: 2,
          color: "linear-gradient(135deg, #235ca4, #041e40)",
        },
        {
          title: "Solicitides de Prestamo Pendientes",
          value: this.totalrecogidaProgress,
          subtitle: "Prestamos Solicitados",
          backgroundIcon: "bi bi-truck",
          type: 2,
          color: "linear-gradient(135deg, #235ca4, #041e40)",
        },
      ];
    },
    async fetchCustodias() {
      try {
        const clienteId = this.authStore.clienteId;
        const response = await apiClient.post(`/api/custodias/cliente`, {
          clienteId,
        });

        this.inventarios = response.data.map((custodia) => ({
          id: custodia.id,
          objeto: custodia.item,
          bodega: custodia.bodega,
          ubicacionId: custodia.ubicacionId,
          clienteId: custodia.clienteId,
          referencia1: custodia.referencia1,
          referencia2: custodia.referencia2,
          referencia3: custodia.referencia3,
          estado: custodia.estado,
          baja: custodia.baja,
        }));

        this.totalCustodias = this.inventarios.length;
        const normalize = (text) => (text || "").trim().toLowerCase();

        this.totalDisponible = this.inventarios.filter(
          (item) => normalize(item.estado) === "disponible"
        ).length;

        this.totalDevolucionProgress = this.inventarios.filter(
          (item) => normalize(item.estado) === "devolucion en proceso"
        ).length;

        this.totalrecogidaProgress = this.inventarios.filter(
          (item) => normalize(item.estado) === "solicitada"
        ).length;

        this.totalPrestamo = this.inventarios.filter(
          (item) => normalize(item.estado) === "entregado"
        ).length;

        this.updateCards();
      } catch (error) {
        console.error("Error al obtener datos de Custodia:", error);
      }
    },
    async generarReportePDF() {
      // Forzar que la pestaña de Progreso esté activa para que se renderice el timeline
      this.activeTab = "progreso";
      await this.$nextTick();

      const doc = new jsPDF("p", "mm", "a4");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);

      const marginLeft = 15;
      let currentY = 20;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // 1. Agregar logo en la esquina superior izquierda
      doc.addImage(this.Logo, "PNG", 10, 10, 30, 15);

      // 2. Agregar Código QR en la esquina superior derecha con "solicitud_<id>"
      const sol = this.detalle.solicitud || {};
      const qrContent = "solicitud_" + (sol.id || "N/A");
      let qrDataUrl = "";
      try {
        const QRCode = (await import("qrcode")).default;
        qrDataUrl = await QRCode.toDataURL(qrContent);
      } catch (error) {
        console.error("Error generando QR:", error);
      }
      const qrWidth = 30, qrHeight = 30;
      const qrX = pageWidth - marginLeft - qrWidth, qrY = 10;
      if (qrDataUrl) {
        doc.addImage(qrDataUrl, "PNG", qrX, qrY, qrWidth, qrHeight);
      }

      // 3. Título y fecha
      currentY = 30;
      doc.setTextColor(204, 20, 23); // Color #cc1417
      doc.setFontSize(18);
      doc.text("Reporte de Prestamos", marginLeft, currentY);
      currentY += 10;
      doc.setFontSize(11);
      doc.setTextColor(0);
      const fechaHoy = new Date().toLocaleDateString();
      doc.text(`Fecha: ${fechaHoy}`, marginLeft, currentY);
      currentY += 10;

      // 4. Detalle de Prestamo
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

      // 5. Timeline como imagen
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

      // 6. Historial de Estados
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

      // 7. Datos de Contacto
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

      // 8. Comentarios / Notas
      doc.setFontSize(14);
      doc.setTextColor(204, 20, 23);
      doc.text("Comentarios / Notas", marginLeft, currentY);
      currentY += 7;
      doc.setFontSize(11);
      doc.setTextColor(0);
      doc.text(this.comentario || "Sin comentarios.", marginLeft, currentY);
      currentY += 10;

      // 9. Footer: Firma, Información de la Empresa e Identificador Único
      const hashUnico = await this.generarHashUnico();
      const footerY = pageHeight - 25;
      doc.setLineWidth(0.5);
      doc.setDrawColor(204, 20, 23);
      doc.line(marginLeft, footerY - 5, pageWidth - marginLeft, footerY - 5);

      doc.setFontSize(9);
      doc.setTextColor(100);
      const empresaInfo = "Compañía XYZ | Dirección: Av. Principal 123, Ciudad, País | Tel: +123456789 | Email: info@company.com | Web: www.company.com";
      doc.text(empresaInfo, marginLeft, footerY);

      // Firma digital (imagen) en el lado derecho del footer
      const firmaWidth = 30, firmaHeight = 15;
      const firmaX = pageWidth - marginLeft - firmaWidth;
      doc.addImage(FirmaDigital, "PNG", firmaX, footerY - firmaHeight, firmaWidth, firmaHeight);

      // Agrega el identificador único con un título profesional
      doc.text("ID de Autenticidad: " + hashUnico, marginLeft, footerY + 5);

      doc.save("Reporte_Prestamos.pdf");
    },
    circleRelativePosition(index) {
      const totalSteps = this.timelineSteps.length;
      if (totalSteps <= 1) return 0;
      return (index / (totalSteps - 1)) * 80;
    },
    animateProgress() {
      const target = this.progressTarget;
      const speed = 40;
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
          tipo: "prestamo",
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
/* Transiciones y estilos generales */
.expand-enter-active,
.expand-leave-active {
  transition: all 1s ease;
}
.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  transform: scaleY(0.95);
}

/* Dashboard Container */
.dashboard-container {
  padding: 2rem 0;
}

/* Cards y estilos personalizados */
.card {
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  margin-bottom: 1rem;
}

.card .card-body .display-4 {
  font-size: 2.5rem;
  font-weight: 700;
}

.card-dark-custom {
  background-color: #1e1e1e;
  color: #f0f0f0;
  border: none !important;
}
.card-dark-custom .card-header {
  background-color: #272727;
  color: #f0f0f0;
  border: none !important;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
  height: 350px;
  overflow-y: auto;
}

/* Estilos para la tabla en modo oscuro */
.table-dark-custom {
  background-color: #1e1e1e;
  color: #f0f0f0;
  border: none !important;
}
.table-dark-custom thead {
  background-color: #272727;
  color: #f0f0f0;
  border: none !important;
}
.table-dark-custom tbody tr:nth-of-type(odd) {
  background-color: #1e1e1e;
}
.table-dark-custom tbody tr:nth-of-type(even) {
  background-color: #202020;
}
.table-dark-custom tbody tr:hover {
  background-color: #2c2c2c;
}
.table-dark-custom,
.table-dark-custom thead,
.table-dark-custom tbody,
.table-dark-custom tfoot,
.table-dark-custom th,
.table-dark-custom td,
.table-dark-custom tr {
  border: none !important;
}

/* Estilos para las notificaciones */
.list-group-item-dark {
  background-color: #1e1e1e;
  color: #f0f0f0;
  border: none !important;
}

.shimmer-text {
  text-shadow: 2px 2px 6px #686868bf;
  background: linear-gradient(75deg, #000000 20%, #a3a3a3bf 30%, #000000 50%);
  background-size: 1100% 50%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-fill-color: transparent;
  animation: shimmer 4s linear infinite;
}

@keyframes shimmer {
  0% {
    background-position: 45% 0;
  }
  100% {
    background-position: -50% 0;
  }
}

.hand-pointer {
  cursor: pointer;
}

.icon-container {
  display: inline-block;
  width: 30px;
  text-align: center;
}

.animated-icon {
  display: inline-block;
  position: relative;
  transform-origin: center;
  font-size: 1.2em;
}

.animated-sun {
  color: #ffd12c;
  animation: spin 8s linear infinite, glowPulse 2s ease-in-out infinite;
}

.animated-moon {
  color: #d4d4d4;
  animation: pulse 2s infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.1);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0.8;
  }
}

.greeting-section {
  border-radius: 15px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.notification-bubbles-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
  height: 350px;
  overflow-y: auto;
}

.bubble {
  display: flex;
  flex-direction: column;
  max-width: 100%;
  padding: 10px 15px;
  border-radius: 10px;
  background-color: #edf5f8;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  word-wrap: break-word;
  transition: background-color 0.3s ease;
}

.bubble-content {
  display: flex;
  flex-direction: column;
}

.bubble-message {
  font-size: 0.9rem;
  margin-bottom: 5px;
}

.bubble-date {
  display: flex;
  font-size: 0.75rem;
  color: #777;
  text-align: right;
  justify-content: flex-end;
}

.bubble-footer {
  display: flex;
  justify-content: flex-start;
  margin-top: 5px;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.5s ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}
.slide-enter-to,
.slide-leave-from {
  transform: translateX(0);
}
</style>
