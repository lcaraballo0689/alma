// qrGenerator.js
const QRCode = require("qrcode");

/**
 * Genera un código QR a partir de un string (por ejemplo, el ID o token de la solicitud)
 * @param {string} text 
 * @returns {Promise<string>} URL de la imagen del código QR en formato Data URL
 */
async function generarQR(text) {
  try {
    const qrDataUrl = await QRCode.toDataURL(text);
    return qrDataUrl;
  } catch (error) {
    throw new Error("Error generando el código QR: " + error.message);
  }
}

module.exports = { generarQR };
