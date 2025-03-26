// controllers/correoController.js
const nodemailer = require("nodemailer");
const validator = require("validator");

/**
 * Envía un correo utilizando los datos proporcionados.
 *
 * @param {Object} mailData - Objeto que contiene los datos del correo.
 * @param {string|string[]} mailData.to - Destinatario(s) del correo.
 * @param {string} mailData.subject - Asunto del correo.
 * @param {string} [mailData.text] - Contenido en texto plano.
 * @param {string} [mailData.html] - Contenido en HTML.
 * @param {Array} [mailData.attachments] - Archivos adjuntos (opcional). Se permite cada attachment con:
 *   - { filename, path } para adjuntar archivos desde disco, o
 *   - { filename, content } donde content puede ser una cadena en Base64 o un Buffer.
 *   Opcionalmente, se puede agregar la propiedad `cid` para imágenes inline.
 * @returns {Promise<Object>} Resolviendo con la información del envío (info).
 * @throws {Error} Si faltan campos obligatorios o ocurre un error durante el envío.
 */
async function sendCorreo(mailData) {
  // Validar campos obligatorios
  if (!mailData.to || !mailData.subject || (!mailData.text && !mailData.html)) {
    throw new Error("Faltan campos obligatorios. Se requiere 'to', 'subject' y al menos 'text' o 'html'.");
  }

  // Procesar y validar destinatarios: se acepta cadena separada por comas o arreglo
  let recipients = [];
  if (typeof mailData.to === "string") {
    recipients = mailData.to.split(",").map(email => email.trim()).filter(email => email.length > 0);
  } else if (Array.isArray(mailData.to)) {
    recipients = mailData.to;
  } else {
    throw new Error("El campo 'to' debe ser una cadena o un arreglo de emails.");
  }
  // Validar cada dirección de correo
  for (const email of recipients) {
    if (!validator.isEmail(email)) {
      throw new Error(`Email inválido: ${email}`);
    }
  }
  // Validar longitud del asunto
  if (mailData.subject.length > 255) {
    throw new Error("El asunto no puede superar los 255 caracteres.");
  }

  // Procesar attachments (opcional)
  let processedAttachments = [];
  if (mailData.attachments) {
    if (!Array.isArray(mailData.attachments)) {
      throw new Error("El campo 'attachments' debe ser un arreglo.");
    }
    processedAttachments = mailData.attachments.map(att => {
      if (!att.filename) {
        throw new Error("Cada attachment debe tener 'filename'.");
      }
      // Si se proporciona una ruta, se utiliza ese attachment directamente.
      if (att.path) {
        return { filename: att.filename, path: att.path, cid: att.cid };
      }
      // Si se proporciona contenido, puede ser Buffer o cadena en Base64.
      if (!att.content) {
        throw new Error("Cada attachment debe tener 'content' en Base64 si no se proporciona 'path'.");
      }
      // Si el contenido es un Buffer, lo dejamos como está.
      if (Buffer.isBuffer(att.content)) {
        return { filename: att.filename, content: att.content, cid: att.cid };
      }
      // Si es una cadena, validamos que sea Base64 válida.
      if (typeof att.content === "string") {
        if (!/^(?:[A-Za-z0-9+\/]{4})*(?:[A-Za-z0-9+\/]{2}==|[A-Za-z0-9+\/]{3}=)?$/.test(att.content)) {
          throw new Error(`El attachment ${att.filename} no contiene una cadena Base64 válida.`);
        }
        return { filename: att.filename, content: att.content, encoding: "base64", cid: att.cid };
      }
      throw new Error(`El attachment ${att.filename} tiene un formato de contenido no soportado.`);
    });
  }

  // Configurar el transportador SMTP con nodemailer
  let transporter;
  try {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10),
      secure: process.env.SMTP_SECURE === "true", // true para puerto 465
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      pool: true,
      logger: true,
      debug: true,
      connectionTimeout: 10000
    });
    console.log("Transporter creado:", transporter.options);
  } catch (error) {
    throw new Error("Error al configurar el transporte de correo: " + error.message);
  }

  // Construir el objeto de opciones del correo
  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: recipients.join(", "),
    subject: mailData.subject,
    text: mailData.text,
    html: mailData.html,
    attachments: processedAttachments
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Correo enviado exitosamente. MessageId:", info.messageId);
    return info;
  } catch (error) {
    throw new Error("Error al enviar el correo: " + error.message);
  }
}

module.exports = { sendCorreo };
