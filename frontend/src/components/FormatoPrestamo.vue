<template>
  <!-- Botón que al hacer clic descarga el PDF -->
  <button class="btn buttons-actions text-white " style="height: 25px !important; background-color:firebrick !important;" @click.stop="handleClick">
    
    <i class="bi bi-file-pdf me-2"></i>
    Descargar
  </button>
</template>

<script>
import { jsPDF } from "jspdf";
import sdh_logo from "@/assets/img/sdh_logo.png";
import siglo_logo from "@/assets/img/siglo.png";
import apiClient from "@/services/api";
import SHA256 from "crypto-js/sha256";
import stringify from "json-stable-stringify";

export default {
  name: "FormatoPrestamo",
  props: {
    consecutivo: {
      type: [String, Number],
      required: true,
    },
  },
  data() {
    return {
      pdfPreviewUrl: null,
    };
  },
  methods: {
    async handleClick(event) {
      // Detenemos la propagación para que no se active el clic del <tr>
      event.stopPropagation();
      try {
        // Obtenemos la data del detalle usando el consecutivo
        const response = await apiClient.post("/api/detalleSolicitud/prestamo", {
          id: this.consecutivo,
        });
        const rawData = response.data;
        console.log("Datos obtenidos del servidor:", rawData);

        // Convertir los campos a strings de forma segura
        const data = {
          ...rawData,
          noSolicitud: String(rawData.noSolicitud ?? ""),
          solicitudId: String(rawData.solicitudId ?? ""),
          entidad: String(rawData.entidad ?? ""),
          solicitadoPor: String(rawData.solicitadoPor ?? ""),
          direccion: String(rawData.direccion ?? ""),
          prioridad: String(rawData.prioridad ?? ""),
          contacto: String(rawData.contacto ?? ""),
          fechaElaboracion: String(rawData.fechaElaboracion ?? ""),
          horaSolicitud: String(rawData.horaSolicitud ?? ""),
          horaEntrega: String(rawData.horaEntrega ?? ""),
          stickerSeguridad: String(rawData.stickerSeguridad ?? ""),
          // Se asume que las firmas pueden venir sin el prefijo, por lo que se corrige:
          entregadoPor: rawData.entregadoPor
            ? rawData.entregadoPor.startsWith("data:image/png;base64,")
              ? rawData.entregadoPor
              : "data:image/png;base64," + rawData.entregadoPor
            : "",
          recibidoPor: rawData.recibidoPor
            ? rawData.recibidoPor.startsWith("data:image/png;base64,")
              ? rawData.recibidoPor
              : "data:image/png;base64," + rawData.recibidoPor
            : "",
          items: Array.isArray(rawData.items)
            ? rawData.items.map((item) => ({
                item: String(item.item ?? ""),
                caja: String(item.caja ?? ""),
                codigoXXI: String(item.codigoXXI ?? ""),
                observacion: String(item.observacion ?? ""),
              }))
            : [],
        };
console.log("Data obtenida para el PDF:", data);

        // Generamos el PDF con la data obtenida
        this.createPDF(data);
      } catch (error) {
        console.error("❌ Error al obtener el formato de devolución:", error);
      }
    },
    createPDF(data) {
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [373, 288],
      });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);

      const marginLeft = 20;
      const logoWidth = 40;
      const logoHeight = 20;
      const pageWidth = doc.internal.pageSize.getWidth();

      // Función para dibujar el encabezado
      const drawHeader = () => {
        const logoX = pageWidth - logoWidth - marginLeft;
        const logoY = 0;
        doc.addImage(siglo_logo, "PNG", logoX - 60, logoY + 30, logoWidth + 15, logoHeight);
        doc.addImage(sdh_logo, "PNG", logoX, logoY + 27, logoWidth, logoHeight + 10);

        // Verificar y agregar el prefijo a las firmas si no lo tienen
        let firmaA = data.entregadoPor || "";
        let firmaB = data.recibidoPor || "";
        if (firmaA && !firmaA.startsWith("data:image/png;base64,")) {
          firmaA = "data:image/png;base64," + firmaA;
        }
        if (firmaB && !firmaB.startsWith("data:image/png;base64,")) {
          firmaB = "data:image/png;base64," + firmaB;
        }

        if (firmaA) {
          doc.addImage(firmaA, "PNG", logoX - 15, 210, logoWidth, logoHeight + 10);
        }
        if (firmaB) {
          doc.addImage(firmaB, "PNG", logoX - 250, 210, logoWidth, logoHeight + 10);
          doc.addImage(firmaB, "PNG", logoX - 115, 210, logoWidth, logoHeight + 10);
        }
        //console.info("Firmas A:", firmaA);
        //console.info("Firmas B:", firmaB);

        let x = marginLeft;
        let y = 20;
        const boxWidth = 220;
        const boxHeight = 10;
        doc.setFont("helvetica", "bold");
        doc.rect(x, y, boxWidth, boxHeight);
        doc.text(
          "FORMATO DE SALIDA SECRETARIA DE HACIENDA DISTRITAL",
          x + boxWidth / 2,
          y + 6,
          { align: "center" }
        );
        doc.setFont("helvetica", "normal");
        return y + boxHeight;
      };

      // Función genérica para dibujar filas
      const drawRow = (texts, widths, styles = [], aligns = [], yRef) => {
        const rowHeight = 7;
        let cursorX = marginLeft;
        texts.forEach((text, i) => {
          const width = widths[i];
          doc.setFont("helvetica", styles[i] || "normal");
          doc.rect(cursorX, yRef, width, rowHeight);
          let textX = cursorX + 2;
          if (aligns[i] === "center") textX = cursorX + width / 2;
          if (aligns[i] === "right") textX = cursorX + width - 2;
          doc.text(text, textX, yRef + 5, { align: aligns[i] || "left" });
          cursorX += width;
        });
        return yRef + rowHeight;
      };

      // Función para dibujar el pie de página
      const drawFooter = (yRef, paginaActual, totalPaginas) => {
        yRef += 5;
        doc.setFont("helvetica", "bold");

        // Definir información para cada persona: etiqueta, nombre, número de documento y firma
        const persons = [
          {
            label: "ENTREGADO POR:",
            name: data.solicitadoPor || "",
            doc: data.contacto || "",
            signature: data.verificadoPor || "",
          },
          {
            label: "VERIFICACION SALIDA CUSTODIA:",
            name: data.solicitadoPor || "",
            doc: data.contacto || "",
            signature: data.verificadoPor || "",
          },
          {
            label: "RECIBIDO POR:",
            name: data.nombreVerificador || "",
            doc: data.identificacionVerificador || "",
            signature: data.entregadoPor || "",
          },
        ];

        // Definir las posiciones en X para cada columna
        const positions = [
          marginLeft + 2,
          marginLeft + 110 + 2,
          marginLeft + 240 + 4,
        ];

        // Por cada persona, dibujar sus datos en un bloque
        persons.forEach((person, index) => {
          const posX = positions[index];
          // Primera línea: etiqueta en negrita
          doc.text(person.label, posX, yRef);
          // Segunda línea: Nombre
          doc.setFont("helvetica", "normal");
          doc.text("Nombre: " + person.name, posX, yRef + 5);
          // Tercera línea: Número de documento
          doc.text("DNI: " + person.doc, posX, yRef + 10);
          // Cuarta línea: Firma (imagen) o línea de firma
          const sigWidth = 50;
          const sigHeight = 15;
          const sigX = posX;
          const sigY = yRef + 12;
          
          // Resetear la fuente a negrita para el siguiente bloque
          doc.setFont("helvetica", "bold");
        });

        yRef += 20;

        yRef = drawRow(
          ["HORA DE SOLICITUD:", data.horaSolicitud || ""],
          [60, 50],
          ["bold"],
          [],
          yRef
        );
        yRef = drawRow(
          ["HORA DE ENTREGA:", data.horaEntrega || ""],
          [60, 50],
          ["bold"],
          [],
          yRef
        );
        yRef = drawRow(
          ["STICKER DE SEGURIDAD:", data.stickerSeguridad || ""],
          [60, 280],
          ["bold"],
          [],
          yRef
        );

        // Pie de página con indicador de página y hash
        const hash = this.generateHash(data);
        doc.setFontSize(9);
        doc.text(`Página ${paginaActual} de ${totalPaginas}`, pageWidth - 70, 282);
        doc.text(`VerifyID: ${hash}`, marginLeft, 282);
        doc.setFontSize(11);
      };

      // Función para dibujar la información estática
      const drawStaticInfo = (yStart) => {
        let y = yStart;
        y = drawRow(
          ["FB-04", "VR-01", "FECHA DE ELABORACION:", data.fechaElaboracion || ""],
          [40, 30, 60, 90],
          ["bold", "bold", "bold"],
          [],
          y
        );
        y = drawRow(["No. SOLICITUD:", data.noSolicitud || "", "No. Recorrido:", data.solicitudId || ""], [40, 70, 40,70], ["bold", "normal","bold","normal"], [], y);
        y = drawRow(
          ["ENTIDAD:", data.entidad || "", "PRIORIDAD:", data.prioridad || ""],
          [40, 100, 30, 50],
          ["bold", "", "bold"],
          [],
          y
        );
        y = drawRow(
          ["SOLICITADO POR:", data.solicitadoPor || "", "CONTACTO:", data.contacto || ""],
          [40, 100, 30, 50],
          ["bold", "", "bold"],
          [],
          y
        );
        y = drawRow(["DIRECCION:", data.direccion || ""], [40, 180], ["bold"], [], y);
        y = drawRow(
          ["ITEM", "CAJA", "CODIGO XXI", "OBSERVACION"],
          [20, 100, 100, 110],
          ["bold", "bold", "bold", "bold"],
          ["center", "center", "center", "center"],
          y
        );
        return y;
      };

      const items = data.items || [];
      const itemsPorPagina = 20;
      const totalPaginas = Math.ceil(items.length / itemsPorPagina) || 1;
      let pagina = 0;

      for (let i = 0; i < items.length; i += itemsPorPagina) {
        if (pagina > 0) doc.addPage();
        let y = drawHeader();
        y = drawStaticInfo(y);

        const currentItems = items.slice(i, i + itemsPorPagina);
        currentItems.forEach((item) => {
          y = drawRow(
            [item.item || "", item.caja || "", item.codigoXXI || "", item.observacion || ""],
            [20, 100, 100, 110],
            [],
            [],
            y
          );
        });

        // Rellenar filas vacías si no se completan todos los ítems en la página
        for (let j = currentItems.length; j < itemsPorPagina; j++) {
          y = drawRow(["", "", "", ""], [20, 100, 100, 110], [], [], y);
        }

        y += 10;
        drawFooter(y, pagina + 1, totalPaginas);
        pagina++;
      }

      // Generar el nombre del archivo basado en la información
      const fileName = `Devolucion_Nro_${data.noSolicitud || ""}.pdf`
        .replace(/\s+/g, "_");

      // Descarga inmediata del PDF
      //doc.save(fileName);
      // Mostrar en una nueva pestaña del navegador
const pdfUrl = doc.output("bloburl");
window.open(pdfUrl, "_blank");
    },

    generateHash(data) {
      // Define un salt seguro; se puede obtener de variables de entorno o definirlo estáticamente.
      const salt =
        import.meta.env.VITE_SALT || "7f5e3a2b9d4c6e8a1b2c3d4e5f6a7b8c";

      // Extraer únicamente la información relevante para el hash.
      const relevantData = {
        noSolicitud: data.noSolicitud,
        fechaElaboracion: data.fechaElaboracion,
        solicitudId: data.solicitudId,
        entidad: data.entidad,
        solicitadoPor: data.solicitadoPor,
        items: Array.isArray(data.items)
          ? data.items.map(item => ({
              item: item.item,
              caja: item.caja,
              codigoXXI: item.codigoXXI,
              observacion: item.observacion,
            }))
          : [],
      };

      // Serializamos los datos de forma estable
      const jsonString = stringify(relevantData);
      const stringToHash = jsonString + salt;
      return SHA256(stringToHash).toString().toUpperCase();
    },
  },
};
</script>

<style scoped>
button {
  padding: 8px 12px;
  background-color: #3498db;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #2980b9;
}
</style>
