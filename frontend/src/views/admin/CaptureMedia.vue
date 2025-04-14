<template>
  <div class="delivery-form container">
    <h2 class="title">Registro de Entrega de Cajas</h2>
    <!-- Formulario de Información del Receptor y evidencia -->
    <form @submit.prevent="generatePDF" novalidate>
      <!-- Datos del receptor -->
      <div class="form-section">
        <div class="form-group">
          <label for="receiverName">Nombre del Receptor</label>
          <input type="text" id="receiverName" v-model="form.receiverName" class="form-control"
            placeholder="Ingrese el nombre" required />
        </div>
        <div class="form-group">
          <label for="receiverId">Documento del Receptor</label>
          <input type="text" id="receiverId" v-model="form.receiverId" class="form-control"
            placeholder="Ingrese documento de identidad" required />
        </div>
        <div class="form-group">
          <label for="observations">Observaciones</label>
          <textarea id="observations" v-model="form.observations" class="form-control" rows="2"
            placeholder="Notas adicionales"></textarea>
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

      <!-- Sección para escanear QR -->
      <div class="qr-section">
        <h3>Escanear Código QR</h3>
        <div class="video-wrapper">
          <video ref="qrVideo" autoplay playsinline class="video-camera"></video>
        </div>
        <button type="button" class="btn btn-primary" @click="scanQR">
          Escanear QR
        </button>
        <div v-if="qrToken" class="qr-result">
          <p><strong>QR Token:</strong> {{ qrToken }}</p>
        </div>
      </div>

      <hr />

      <!-- Sección para seleccionar Módulo y Acción -->
      <div class="select-section">
        <div class="form-group">
          <label for="moduleSelect">Módulo</label>
          <select id="moduleSelect" v-model="selectedModule" class="form-control">
            <option disabled value="">Seleccione un Módulo</option>
            <option value="transferencia">Transferencia</option>
            <option value="prestamo">Préstamo</option>
            <option value="devolucion">Devolución</option>
            <option value="desarchive">Desarchive</option>
          </select>
        </div>
        <div class="form-group" v-if="selectedModule">
          <label for="actionSelect">Acción</label>
          <select id="actionSelect" v-model="selectedAction" class="form-control">
            <option disabled value="">Seleccione la Acción</option>
            <option v-for="accion in availableActions" :key="accion" :value="accion">{{ accion }}</option>
          </select>
        </div>
      </div>

      <hr />

      <!-- Botón para generar PDF -->
      <div class="mt-4 text-center">
        <button type="submit" class="btn btn-success">
          Generar PDF de Acuse
        </button>
      </div>

      <!-- Botón para enviar QR Scan (payload al endpoint de transferencias QR) -->
      <div class="mt-2 text-center">
        <button type="button" class="btn btn-info" @click="sendQRScan">
          Enviar QR Scan
        </button>
      </div>

    </form>
  </div>
</template>

<script>
import SignaturePad from "signature_pad";
import { jsPDF } from "jspdf";
import axios from "axios";
import jsQR from "jsqr";  // Importar la librería para decodificar QR

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
      qrToken: "",
      selectedModule: "",
      selectedAction: "",
      // Definición de acciones disponibles según módulo.
      moduleActions: {
        transferencia: ["asignado a transportador", "en proceso de recolección", "recogido", "en bodega", "completado"],
        prestamo: ["asignado a transportador", "en proceso de entrega", "entregado por transportador", "entrega confirmada"],
        devolucion: ["asignado a transportador", "en proceso de recolección", "recogido", "devolucion completada"],
        desarchive: ["asignado a transportador", "en proceso de entrega", "entregado", "desarchivado"],
      },
      signaturePadReceiver: null,
      signaturePadDeliverer: null,
      // Token fijo de autorización para el endpoint de QR scan:
      authToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiY2xpZW50ZUlkIjoyLCJ0aXBvVXN1YXJpb0lkIjoyLCJub21icmUiOiJMdWlzIENhcmFiYWxsbyIsImRpcmVjY2lvbiI6IkF2LiBQcmluY2lwYWwgIzEyMyIsInRlbGVmb25vIjoiNTU1LTEyMzQiLCJjYyI6IjEyMzM4MjciLCJlbWFpbCI6ImxlY21ib2dvdGFAZ21haWwuY29tIiwiYWN0aXZvIjp0cnVlLCJjbGllbnRlTm9tYnJlIjoiSGFjaWVuZGEiLCJwZXJtaXNvcyI6W3siaWQiOjMsIm5vbWJyZSI6IkNPTlNVTFRBX1JFUE9SVEVTIiwiZGVzY3JpcGNpb24iOiJQZXJtaXRlIGNvbnN1bHRhciByZXBvcnRlcyBkZWwgc2lzdGVtYSJ9LHsiaWQiOjQsIm5vbWJyZSI6IkdFU1RJT05fVFJBTlNGRVJFTkNJQVMiLCJkZXNjcmlwY2lvbiI6IlBlcm1pdGUgZ2VzdGlvbmFyIHRyYW5zZmVyZW5jaWFzIGRlIGNhamFzIHkgY3VzdG9kaWFzIn1dLCJpYXQiOjE3NDM0MjkyODgsImV4cCI6MTc0NjAyMTI4OH0.8eR1IRpPiVsY0SF_tFGfgF_Pqf9O2OYUAGuUb10U_G0",
    };
  },
  computed: {
    // Obtiene las acciones disponibles en función del módulo seleccionado
    availableActions() {
      return this.selectedModule ? this.moduleActions[this.selectedModule] : [];
    },
  },
  mounted() {
    this.initSignaturePads();
    this.startCamera();
    this.startQRCamera();
  },
  methods: {
    initSignaturePads() {
      // Inicializar pad de firma del receptor
      const canvasReceiver = this.$refs.signatureCanvasReceiver;
      canvasReceiver.width = this.$el.clientWidth - 40;
      canvasReceiver.height = 150;
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
      // Inicializar pad de firma del entregador
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
    // Inicia cámara para el QR (elemento video qrVideo)
    startQRCamera() {
      const qrVideo = this.$refs.qrVideo;
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({ video: { facingMode: "environment" } })
          .then((stream) => {
            qrVideo.srcObject = stream;
            qrVideo.play();
          })
          .catch((err) => {
            console.error("Error al acceder a la cámara para QR:", err);
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
      this.photoData = tempCanvas.toDataURL("image/png");
    },
    clearSignatureReceiver() {
      if (this.signaturePadReceiver) this.signaturePadReceiver.clear();
    },
    clearSignatureDeliverer() {
      if (this.signaturePadDeliverer) this.signaturePadDeliverer.clear();
    },
    // Método para decodificar el QR de forma dinámica usando jsQR
    scanQR() {
      const qrVideo = this.$refs.qrVideo;
      if (!qrVideo) return;
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = qrVideo.videoWidth;
      tempCanvas.height = qrVideo.videoHeight;
      const ctx = tempCanvas.getContext("2d");
      ctx.drawImage(qrVideo, 0, 0, tempCanvas.width, tempCanvas.height);
      const imageData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (code) {
        this.qrToken = code.data;
        alert(`QR leído: ${code.data}`);
      } else {
        alert("No se detectó código QR. Intente nuevamente.");
      }
    },
    async generatePDF() {
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
      
      const doc = new jsPDF("p", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();
      let y = 20;
      
      doc.setFontSize(22);
      doc.text("Acuse de Entrega de Cajas", pageWidth / 2, y, { align: "center" });
      y += 20;
      
      doc.setFontSize(12);
      doc.text(`Nombre del receptor: ${this.form.receiverName}`, 15, y);
      y += 10;
      doc.text(`Documento: ${this.form.receiverId}`, 15, y);
      y += 10;
      doc.text(`Observaciones: ${this.form.observations || "N/A"}`, 15, y, { maxWidth: pageWidth - 30 });
      y += 15;
      
      doc.setFontSize(14);
      doc.text("Foto de entrega:", 15, y);
      y += 5;
      const imgWidth = pageWidth - 30;
      const imgHeight = (imgWidth * 9) / 16;
      doc.addImage(this.photoData, "PNG", 15, y, imgWidth, imgHeight);
      y += imgHeight + 15;
      
      doc.setFontSize(14);
      doc.text("Firma del receptor:", 15, y);
      const signWidth = 80;
      const signHeight = 30;
      doc.addImage(receiverSignature, "PNG", 15, y + 5, signWidth, signHeight);
      
      doc.text("Firma del entregador:", pageWidth / 2 + 10, y);
      doc.addImage(delivererSignature, "PNG", pageWidth / 2 + 10, y + 5, signWidth, signHeight);
      y += signHeight + 20;
      
      doc.setFontSize(10);
      const now = new Date().toLocaleString();
      doc.text(`Acuse generado el ${now}`, 15, doc.internal.pageSize.getHeight() - 20);
      
      doc.save(`AcuseEntrega_${this.form.receiverName}.pdf`);
    },
    async sendQRScan() {
      if (!this.qrToken) {
        alert("No se ha leído ningún QR. Por favor, escanee un código.");
        return;
      }
      if (!this.selectedModule || !this.selectedAction) {
        alert("Seleccione un Módulo y una Acción.");
        return;
      }
      
      const payload = {
        qrToken: this.qrToken,
        accion: this.selectedAction,
        modulo: this.selectedModule,
        usuarioId: 1,   // Ajusta estos valores según tu contexto
        clienteId: 2
      };
      
      try {
        const response = await axios.post(
          "/api/transferencias/qr/scan",
          payload,
          {
            headers: {
              Authorization: this.authToken
            }
          }
        );
        alert("QR scan enviado. Respuesta: " + JSON.stringify(response.data));
      } catch (error) {
        console.error("Error enviando QR scan:", error);
        alert("Error al enviar QR scan: " + error.message);
      }
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

/* Sección de foto y QR */
.photo-section,
.qr-section {
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
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
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

/* Sección de select */
.select-section {
  margin-bottom: 20px;
}
.select-section .form-group {
  margin-bottom: 15px;
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

.btn-success {
  background-color: #28a745;
  color: #fff;
}

.btn-success:hover {
  background-color: #218838;
}

.btn-info {
  background-color: #17a2b8;
  color: #fff;
}

.btn-info:hover {
  background-color: #138496;
}

/* Estilos para la sección QR */
.qr-result {
  background-color: #f4f4f4;
  padding: 10px;
  border-radius: 8px;
  text-align: center;
  font-weight: bold;
}
</style>
