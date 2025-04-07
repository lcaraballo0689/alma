<template>
  <div class="data-download">
    <!-- Botón PDF -->
    <button
      class="custom-btn pdf me-2"
      @click="downloadPDFHandler"
      @mouseover="hoveredButton = 'pdf'"
      @mouseleave="hoveredButton = ''"
    >
      <i
        :class="
          hoveredButton === 'pdf'
            ? 'bi bi-arrow-down-circle-fill'
            : 'bi bi-file-earmark-pdf-fill'
        "
      ></i>
      <span v-if="hoveredButton !== 'pdf'">PDF</span>
      <span v-else>Descargar</span>
    </button>

    <!-- Botón Excel -->
    <button
      class="custom-btn excel "
      @click="downloadExcel"
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
      <span v-if="hoveredButton !== 'excel'">Excel</span>
      <span v-else>Descargar</span>
    </button>
  </div>
</template>

<script>
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import Logo from "@/assets/img/logo.png"; // Logo en formato PNG

// Función para convertir una imagen a Base64 a partir de su URL
async function getBase64Image(url) {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export default {
  name: "DataDownload",
  props: {
    // Data a exportar (array de objetos)
    dataToDownload: {
      type: Array,
      required: true,
    },
    // Nombre de la pestaña actual (para el nombre del archivo)
    currentTab: {
      type: String,
      required: true,
    },
    // Encabezados de las columnas del archivo a exportar (array de strings)
    headers: {
      type: Array,
      required: true,
    },
    // Información adicional (opcional)
    extraInfo: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      hoveredButton: "", // Estado para controlar el hover dinámico
    };
  },
  methods: {
    async formatDate(date) {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      const seconds = date.getSeconds().toString().padStart(2, "0");
      return `${year}-${month}-${day}_${hours}-${minutes}`;
    },

    async downloadExcel() {
      // Filtrar los datos para solo incluir las columnas seleccionadas
      const filteredData = this.dataToDownload.map((item) => {
        const filteredItem = {};
        this.headers.forEach((col) => {
          if (item.hasOwnProperty(col)) {
            filteredItem[col] = item[col];
          }
        });
        return filteredItem;
      });

      // Convertir la data filtrada a hoja de cálculo
      const ws = XLSX.utils.json_to_sheet(filteredData);

      // Ajustar automáticamente el ancho de las columnas en función del contenido
      const colWidths = this.headers.map((col) => {
        const maxLength = Math.max(
          ...filteredData.map((item) =>
            item[col] ? item[col].toString().length : 0
          ), // Encuentra el largo máximo del contenido
          col.length // También incluye el largo del nombre de la columna
        );
        return { wch: maxLength }; // `wch` es la unidad de medida para el ancho de las columnas
      });

      // Asignar el ancho calculado a las columnas
      ws["!cols"] = colWidths;

      // Convertir los encabezados a mayúsculas y aplicar color de fondo
      this.headers.forEach((col, index) => {
        const headerCell = ws[XLSX.utils.encode_cell({ r: 0, c: index })];

        if (headerCell) {
          headerCell.v = headerCell.v.toString().toUpperCase();
          headerCell.s = {
            fill: {
              fgColor: { rgb: "D1D1D1" }, // Color de fondo (gris claro)
            },
            font: {
              bold: true, // Negrita
            },
            alignment: {
              horizontal: "center", // Alinear texto al centro
            },
          };
        }
      });

      // Crear el libro y agregar la hoja
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Datos");

      const filename = `BODEGAPP-${this.currentTab}-${await this.formatDate(
        new Date()
      )}.xlsx`;

      // Escribir el archivo Excel
      XLSX.writeFile(wb, filename);
    },

    async downloadPDFHandler() {
      await this.downloadPDF();
    },

    async downloadPDF() {
      // Crear el documento en formato landscape, unidad mm, tamaño A4
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      // Obtener el logo en formato base64
      let logoData = "";
      try {
        logoData = await getBase64Image(Logo);
      } catch (error) {
        console.error("Error al cargar el logo:", error);
        logoData = "data:image/png;base64,...."; // Logo de fallback
      }

      // Agregar el logo a la izquierda (posición fija)
      if (logoData) {
        doc.addImage(logoData, "PNG", 13, 5, 70, 15);
      }

      // Calcular el ancho de la página para justificar el texto a la derecha
      const pageWidth = doc.internal.pageSize.getWidth();

      // Preparar título y fecha (en mayúsculas para el título)
      const title = `${this.currentTab.toUpperCase()}`;
      const exportDate = new Date().toLocaleString();

      // Agregar el título justificado a la derecha
      doc.setFontSize(18);
      doc.text(title, pageWidth - 20, 12, { align: "right" });

      // Agregar fecha de exportación y usuario (si está definido) también justificados a la derecha
      doc.setFontSize(10);
      doc.text(`Exportado el: ${exportDate}`, pageWidth - 13, 17, {
        align: "right",
      });

      // Definir filas para la tabla
      const rows = this.dataToDownload.map(
        (item) => this.headers.map((col) => item[col]) // Mapear los datos de acuerdo con los encabezados
      );

      // Crear la tabla con autoTable, iniciando en Y = 40 para dejar espacio para el encabezado
      autoTable(doc, {
        head: [this.headers.map((col) => col.toUpperCase())],
        body: rows,
        startY: 30, // Primera página: comienza en Y = 30
        margin: { top: 10 }, // Páginas siguientes: se usará un margen superior de 10 mm
        didDrawPage: (data) => {
          // Agregar numeración de páginas en el pie
          const pageCount = doc.internal.getNumberOfPages();
          const pageStr = `Página ${data.pageNumber} de ${pageCount}`;
          doc.setFontSize(10);
          const textWidth = doc.getTextWidth(pageStr);
          const x = pageWidth - textWidth - 10; // margen derecho
          const y = doc.internal.pageSize.getHeight() - 10; // margen inferior
          doc.text(pageStr, x, y);
        },
      });

      const filename = `BODEGAPP-${this.currentTab}-${await this.formatDate(
        new Date()
      )}.pdf`;

      doc.save(filename);
    },
  },
};
</script>

<style scoped>
.data-download {
  margin-bottom: 1rem;
}
</style>
