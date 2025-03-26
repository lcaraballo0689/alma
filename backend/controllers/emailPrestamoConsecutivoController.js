// controllers/emailPrestamoConsecutivoController.js
const nodemailer = require("nodemailer");

exports.sendEmailPrestamoConsecutivo = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }
  const { to, consecutivo, details } = req.body;
  if (!to || consecutivo == null) {
    return res.status(400).json({ error: "Faltan campos obligatorios para enviar el correo." });
  }
  
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    
    const subject = "Información de Prestamo Consecutivo";
    const message = `El consecutivo de préstamo es ${consecutivo}. Detalles: ${details || "Ninguno"}.`;
    
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      text: message,
    });
    
    return res.status(200).json({ message: "Correo enviado exitosamente", info });
  } catch (error) {
    console.error("Error en sendEmailPrestamoConsecutivo:", error);
    return res.status(500).json({ error: "Error al enviar el correo", details: error });
  }
};
