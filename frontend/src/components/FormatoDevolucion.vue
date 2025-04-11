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
  name: "FormatoDevolucionManual",
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
        const response = await apiClient.post("/api/detalleSolicitud", {
          id: this.consecutivo,
        });
        const rawData = response.data;

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
          doc.addImage(firmaA, "PNG", logoX - 25, 220, logoWidth, logoHeight + 10);
        }
        if (firmaB) {
          doc.addImage(firmaB, "PNG", logoX - 240, 220, logoWidth, logoHeight + 10);
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
          "FORMATO DE INGRESO SECRETARIA DE HACIENDA DISTRITAL",
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
        yRef += 20;
        doc.setFont("helvetica", "bold");
        doc.text("ENTREGADO POR ____________________________________", marginLeft + 2, yRef);
        doc.text("RECIBIDO POR ______________________________________", marginLeft + 215 + 4, yRef);
        doc.setFont("helvetica", "normal");
        yRef += 8;

        yRef = drawRow(
          ["HORA DE SOLICITUD:", data.horaSolicitud || ""],
          [50, 50],
          ["bold"],
          [],
          yRef
        );
        yRef = drawRow(
          ["HORA DE ENTREGA:", data.horaEntrega || ""],
          [50, 50],
          ["bold"],
          [],
          yRef
        );
        yRef = drawRow(
          ["STICKER:", data.stickerSeguridad || ""],
          [50, 280],
          ["bold"],
          [],
          yRef
        );

        // Pie de página con indicador de página y hash
        const hash = this.generateHash(data);
        doc.setFontSize(9);
        doc.text(`Página ${paginaActual} de ${totalPaginas}`, pageWidth - 70, 282);
        doc.text(`HASH: ${hash}`, marginLeft, 282);
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
      doc.save(fileName);
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
