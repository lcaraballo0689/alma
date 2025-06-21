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
import Swal from "sweetalert2";

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
        // Mostrar loading mientras se obtiene la información
        Swal.fire({
          title: 'Generando documento',
          text: 'Por favor espere mientras se genera el PDF...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });
        
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
          // Manejo seguro de las firmas y datos personales de bodega, transportista y receptor
          // Datos de bodega (warehouse)
          warehouseAux: String(rawData.bodegaInfo?.bodegaNombre ?? ""),
          warehouseIdentificacion: String(rawData.bodegaInfo?.bodegaIdentificacion ?? ""),
          warehouseSing: this.procesarFirma(rawData.bodegaInfo?.bodegaFirma ?? ""),
          // Datos de transportista
          transportistaNombre: String(rawData.transportistaInfo?.transportistaNombre ?? ""),
          transportistaIdentificacion: String(rawData.transportistaInfo?.transportistaIdentificacion ?? ""),
          transportistaFirma: this.procesarFirma(rawData.transportistaInfo?.transportistaFirma ?? ""),
          // Datos del receptor
          receptorNombre: String(rawData.receptorInfo?.receptorNombre ?? ""),
          receptorIdentificacion: String(rawData.receptorInfo?.receptorIdentificacion ?? ""),
          receptorFirma: this.procesarFirma(rawData.receptorInfo?.receptorFirma ?? ""),
          // Compatibilidad con campos antiguos
          entregadoPor: this.procesarFirma(rawData.entregadoPor),
          recibidoPor: this.procesarFirma(rawData.recibidoPor),
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

        // Cerrar el loading
        Swal.close();

        // Generamos el PDF con la data obtenida
        this.createPDF(data);
      } catch (error) {
        console.error("❌ Error al obtener el formato de devolución:", error);
        
        // Analizar el error para mostrar un mensaje personalizado
        let errorMessage = "No se pudo generar el PDF. Por favor, intente de nuevo.";
        
        if (error.response) {
          // El servidor respondió con un código de error
          const responseData = error.response.data;
          if (responseData && responseData.message) {
            errorMessage = `Error: ${responseData.message}`;
          }
        } else if (error.request) {
          // La solicitud se realizó pero no se recibió respuesta
          errorMessage = "No se pudo conectar con el servidor. Verifique su conexión.";
        }
        
        // Mostrar mensaje de error al usuario
        Swal.fire({
          icon: 'error',
          title: 'Error al generar el documento',
          text: errorMessage,
          confirmButtonColor: '#3085d6',
        });
      }
    },
    createPDF(data) {
      try {
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
          try {
            const logoX = pageWidth - logoWidth - marginLeft;
            const logoY = 0;
            
            try {
              doc.addImage(siglo_logo, "PNG", logoX - 60, logoY + 30, logoWidth + 15, logoHeight);
            } catch (error) {
              console.error("Error al agregar logo de Siglo:", error);
            }
            
            try {
              doc.addImage(sdh_logo, "PNG", logoX, logoY + 27, logoWidth, logoHeight + 10);
            } catch (error) {
              console.error("Error al agregar logo de SDH:", error);
            }
            
            // Obtenemos las firmas de las diferentes fuentes (compatibilidad con ambos formatos de datos)
            let transportistaFirma = data.transportistaFirma || data.entregadoPor || "";
            let receptorFirma = data.receptorFirma || data.recibidoPor || "";
            let firmaBodega = data.warehouseSing || "";
            
            // Para debugging - mostrar si tenemos las firmas
            console.log("Firma transportista presente:", !!transportistaFirma);
            console.log("Firma receptor presente:", !!receptorFirma);
            console.log("Firma bodega presente:", !!firmaBodega);
            
            // Agregar firmas solo si tienen datos válidos
            try {
              if (transportistaFirma && transportistaFirma.startsWith("data:image/png;base64,")) {
                doc.addImage(transportistaFirma, "PNG", logoX, 220, logoWidth, logoHeight + 10);
              }
            } catch (error) {
              console.error("Error al añadir firma transportista al PDF:", error);
            }
            
            try {
              if (receptorFirma && receptorFirma.startsWith("data:image/png;base64,")) {
                doc.addImage(receptorFirma, "PNG", logoX - 115, 220, logoWidth, logoHeight + 10);
              }
            } catch (error) {
              console.error("Error al añadir firma receptor al PDF:", error);
            }
            
            try {
              if (firmaBodega && firmaBodega.startsWith("data:image/png;base64,")) {
                doc.addImage(firmaBodega, "PNG", logoX - 225, 220, logoWidth, logoHeight + 10);
              }
            } catch (error) {
              console.error("Error al añadir firma bodega al PDF:", error);
            }
            
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
          } catch (error) {
            console.error("Error en drawHeader:", error);
            return 30; // Retornar un valor por defecto para continuar
          }
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
          yRef -= 5;
          doc.setFont("helvetica", "bold");

          // Definir información para cada persona: etiqueta, nombre, número de documento y firma
          const persons = [
            {
              label: "ENTREGADO POR:",
              name: data.transportistaNombre || "",
              doc: data.transportistaIdentificacion || "",
              signature: data.transportistaFirma || data.entregadoPor || "",
            },
            {
              label: "VERIFICACION SALIDA CUSTODIA:",
              name: data.warehouseAux || "",
              doc: data.warehouseIdentificacion || "",
              signature: data.warehouseSing || "",
            },
            {
              label: "RECIBIDO POR:",
              name: data.receptorNombre || data.nombreVerificador || "",
              doc: data.receptorIdentificacion || data.identificacionVerificador || "",
              signature: data.receptorFirma || data.recibidoPor || "",
            },
          ];

          // Definir las posiciones en X para cada columna
          const positions = [
            marginLeft + 2,
            marginLeft + 110 + 2,
            marginLeft + 240 + 4,
          ];

          // Por cada persona, dibujar sus datos en un bloque
          // Definir dimensiones de la tabla
          const cellPadding = 2;
          const cellWidth = ((pageWidth - marginLeft * 2) / persons.length  ) - 1 ;
          const cellHeight = 30;

          // Dibujar cada celda de la tabla para cada persona
          persons.forEach((person, index) => {
            const x = marginLeft + index * cellWidth;
            const y = yRef;

            // Dibujar borde de la celda
            doc.rect(x, y, cellWidth, cellHeight);

            // Primera línea: etiqueta centrada en negrita
            doc.setFont("helvetica", "bold");
            doc.text(person.label, x + cellWidth / 2, y + 7, { align: "center" });

            // Segunda línea: nombre en texto normal, alineado a la izquierda
            doc.setFont("helvetica", "normal");
            doc.text("Nombre: " + person.name, x + cellPadding, y + 15);

            // Tercera línea: DNI en texto normal
            doc.text("DNI: " + person.doc, x + cellPadding, y + 22);

            // Cuarta línea: firma (imagen) o línea de firma
            const sigWidth = cellWidth - 2 * cellPadding;
            const sigHeight = 15;
            const sigX = x + cellPadding;
            const sigY = y ;

            
          });

          yRef += 40;

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

        // Mostrar en una nueva pestaña del navegador
        const pdfUrl = doc.output("bloburl");
        window.open(pdfUrl, "_blank");
      } catch (error) {
        console.error("Error al generar el PDF:", error);
        Swal.fire({
          icon: 'error',
          title: 'Error al generar el PDF',
          text: 'Ocurrió un problema al generar el documento. Por favor intente nuevamente.',
          confirmButtonColor: '#3085d6',
        });
      }
    },
    procesarFirma(firma) {
      if (!firma) return ""; // Si no hay firma, devuelve cadena vacía
      
      try {
        // Verificar si ya tiene el prefijo de datos
        if (typeof firma === 'string') {
          if (firma.startsWith("data:image/png;base64,")) {
            return firma;
          } else {
            // Asegurarse de que sea una cadena base64 válida antes de añadir el prefijo
            // Un simple check para ver si parece base64 (caracteres base64 válidos)
            const base64Regex = /^[A-Za-z0-9+/=]+$/;
            if (base64Regex.test(firma)) {
              return "data:image/png;base64," + firma;
            } else {
              console.warn("Firma no parece ser un base64 válido");
              return ""; // O podrías devolver una imagen por defecto
            }
          }
        } else {
          console.warn("Firma recibida pero no es una cadena");
          return "";
        }
      } catch (error) {
        console.error("Error al procesar firma:", error);
        return ""; // En caso de error, devuelve cadena vacía
      }
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
