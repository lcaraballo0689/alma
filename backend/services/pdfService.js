// services/pdfService.js
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * @description Genera un PDF de "Acta de Entrega de desarchivo" en formato horizontal (landscape).
 * El PDF incluirá:
 *  - Logo (desde assets/img/logo.png, si existe)
 *  - Título, subtítulo (Acta de Entrega) y datos de la entrega
 *  - Una tabla con detalles (si se proporciona)
 *  - Una sección de firmas (firma de Bodegapp y del cliente, lado a lado) si existen
 *  - Pie de página
 *
 * @param {Object} data - Objeto de configuración con las siguientes propiedades:
 *    - title: Título principal (ej. "Constancia de Entrega de desarchivo").
 *    - subtitle: Subtítulo (ej. "Acta de Entrega").
 *    - info: Texto adicional o descripción (opcional).
 *    - table: Objeto con la definición de la tabla, que incluye:
 *          - headers: Array de strings (encabezados de las columnas).
 *          - rows: Array de filas (cada fila puede ser un objeto o un array).
 *    - bodegappSignaturePath: Ruta a la firma digital de Bodegapp (opcional).
 *    - bodegappSignatureLabel: Texto a mostrar debajo de la firma de Bodegapp (opcional).
 *    - clienteSignaturePath: Ruta a la firma digital del cliente (opcional).
 *    - clienteSignatureLabel: Texto a mostrar debajo de la firma del cliente (opcional).
 *    - footer: Texto para el pie de página (opcional).
 *
 * @returns {Promise<Buffer>} Buffer con el contenido del PDF.
 */
function generatePDF(data) {
  return new Promise((resolve, reject) => {
    // Crear el documento en modo "landscape" (horizontal)
    const doc = new PDFDocument({
      margin: 50,
      layout: 'landscape', // <-- Aquí definimos el formato horizontal
    });

    // Escuchar eventos del documento
    const buffers = [];
    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(buffers);
      resolve(pdfBuffer);
    });
    doc.on('error', (err) => {
      reject(err);
    });

    // 1. Logo
    const logoPath = path.resolve(process.cwd(), 'assets', 'img', 'bodegapp-logo.png');
    if (fs.existsSync(logoPath)) {
      try {
        doc.image(logoPath, 50, 30, { width: 80 });
      } catch (err) {
        console.error("Error al cargar el logo:", err);
      }
    }

    // 2. Título Principal
    doc.fontSize(18).font('Helvetica-Bold')
       .text(data.title || 'Constancia de Entrega de desarchivo', {
         align: 'center',
         underline: true,
       });
    doc.moveDown(0.5);

    // 3. Subtítulo (opcional)
    if (data.subtitle) {
      doc.fontSize(14).font('Helvetica-Bold')
         .text(data.subtitle, { align: 'center' });
      doc.moveDown(1);
    }

    // 4. Información Adicional
    if (data.info) {
      doc.fontSize(12).font('Helvetica').text(data.info, { align: 'left' });
      doc.moveDown(1);
    }

    // Dibujar una línea horizontal para separar secciones
    drawLine(doc);

    // 5. Tabla (si se proporciona)
    if (data.table && data.table.headers && data.table.rows) {
      drawTable(doc, data.table.headers, data.table.rows);
    } else {
      doc.moveDown(1);
      doc.fontSize(12).text("No se proporcionaron detalles de tabla.", { align: 'left' });
    }

    drawLine(doc);

    // 6. Sección de Firmas (lado a lado)
    if ((data.bodegappSignaturePath && fs.existsSync(data.bodegappSignaturePath)) ||
        (data.clienteSignaturePath && fs.existsSync(data.clienteSignaturePath))) {
      drawDualSignatures(
        doc,
        data.bodegappSignaturePath,
        data.clienteSignaturePath,
        data.bodegappSignatureLabel,
        data.clienteSignatureLabel
      );
    }

    // 7. Pie de Página
    doc.moveDown(1);
    doc.fontSize(10)
       .text(data.footer || `Fecha: ${new Date().toLocaleString()}`, { align: 'right' });

    // Finalizar
    doc.end();
  });
}

/**
 * Dibuja una línea horizontal para separar secciones.
 * @param {PDFDocument} doc
 */
function drawLine(doc) {
  doc.moveDown(0.5);
  const currentY = doc.y;
  doc.strokeColor('#000000')
     .lineWidth(1)
     .moveTo(doc.page.margins.left, currentY)
     .lineTo(doc.page.width - doc.page.margins.right, currentY)
     .stroke();
  doc.moveDown(1);
}

/**
 * Dibuja una tabla en el PDF.
 * @param {PDFDocument} doc
 * @param {Array<string>} headers
 * @param {Array<Object|Array>} rows
 */
function drawTable(doc, headers, rows) {
  const startX = doc.page.margins.left;
  let startY = doc.y;
  const tableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const columnCount = headers.length;
  const columnWidth = tableWidth / columnCount;
  const rowHeight = 20;

  // Encabezados
  doc.font('Helvetica-Bold').fontSize(12);
  headers.forEach((header, i) => {
    doc.text(header, startX + i * columnWidth, startY, {
      width: columnWidth,
      align: 'center',
      underline: true
    });
  });
  startY += rowHeight;
  doc.moveDown(0.5);

  // Filas
  doc.font('Helvetica').fontSize(10);
  rows.forEach(row => {
    headers.forEach((header, i) => {
      let cellText = "";
      if (Array.isArray(row)) {
        cellText = row[i] !== undefined ? String(row[i]) : "";
      } else if (typeof row === 'object' && row !== null) {
        cellText = row[header] !== undefined ? String(row[header]) : "";
      }
      doc.text(cellText, startX + i * columnWidth, startY, {
        width: columnWidth,
        align: 'center'
      });
    });
    startY += rowHeight;
  });

  doc.moveDown(1);
}

/**
 * Dibuja dos firmas de forma paralela en el PDF (Bodegapp y Cliente).
 * @param {PDFDocument} doc
 * @param {string} bodegappSignaturePath
 * @param {string} clienteSignaturePath
 * @param {string} bodegappLabel
 * @param {string} clienteLabel
 */
function drawDualSignatures(doc, bodegappSignaturePath, clienteSignaturePath, bodegappLabel, clienteLabel) {
  doc.moveDown();
  doc.fontSize(14).font('Helvetica-Bold').text("Firmas:", { align: 'left' });
  doc.moveDown(0.5);

  const pageWidth = doc.page.width;
  const margin = doc.page.margins.left;
  const availableWidth = pageWidth - margin * 2;
  const columnWidth = (availableWidth - 50) / 2; // espacio entre columnas = 50
  const currentY = doc.y;

  // Firma Bodegapp
  if (bodegappSignaturePath && fs.existsSync(bodegappSignaturePath)) {
    doc.image(bodegappSignaturePath, margin, currentY, { width: columnWidth / 2 });
  }
  // Firma Cliente
  if (clienteSignaturePath && fs.existsSync(clienteSignaturePath)) {
    doc.image(clienteSignaturePath, margin + columnWidth + 50, currentY, { width: columnWidth / 2 });
  }

  doc.moveDown(4);
  doc.fontSize(10).font('Helvetica');
  if (bodegappLabel) {
    doc.text(bodegappLabel, margin, doc.y, {
      width: columnWidth,
      align: 'center'
    });
  }
  if (clienteLabel) {
    doc.text(clienteLabel, margin + columnWidth + 50, doc.y, {
      width: columnWidth,
      align: 'center'
    });
  }
}

module.exports = {
  generatePDF,
};
