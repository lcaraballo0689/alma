const fs = require('fs');
const path = require('path');

/**
 * Procesa un archivo de firma, retornando el string en base64.
 * @param {Object} file - Objeto file (por ejemplo, de multer)
 * @returns {string} Firma en formato base64.
 */
function processFirma(file) {
  if (!file) return '';
  const firmaPath = file.path;
  // Leer archivo y convertir a base64
  const firmaBuffer = fs.readFileSync(firmaPath);
  const firmaBase64 = firmaBuffer.toString('base64');
  // Eliminar el archivo temporal
  fs.unlinkSync(firmaPath);
  return firmaBase64;
}

module.exports = {
  processFirma,
};
