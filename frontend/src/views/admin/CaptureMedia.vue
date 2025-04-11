

<template>
  <div class="delivery-form container">
    <h2 class="title">Registro de Entrega de Cajas</h2>
    <form @submit.prevent="generatePDF" novalidate>
      <!-- Formulario de Información del Receptor -->
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