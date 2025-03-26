const path = require("path");
const fs = require("fs");

exports.downloadPDF = (req, res) => {
  const { filename } = req.body; // Obtener el nombre del archivo desde el body

  if (!filename) {
    return res.status(400).json({ error: "El nombre del archivo es obligatorio." });
  }

  // Extraer solo el nombre del archivo (evitar rutas completas)
  const cleanFilename = path.basename(filename);

  // Ruta base donde se encuentran los archivos PDF
  const pdfDirectory = path.join(__dirname, "../../public/pdfs");

  // Construir la ruta completa del archivo
  const filePath = path.join(pdfDirectory, cleanFilename);

  console.log("📂 Intentando descargar:", filePath);

  // Verificar si el archivo existe
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Archivo no encontrado." });
  }

  // Establecer los encabezados para la descarga
  res.setHeader("Content-Disposition", `attachment; filename="${cleanFilename}"`);
  res.setHeader("Content-Type", "application/pdf");

  // Enviar el archivo al cliente
  res.download(filePath, cleanFilename, (err) => {
    if (err) {
      console.error("❌ Error al descargar el archivo:", err);
      res.status(500).json({ error: "Error al descargar el archivo." });
    }
  });
};
