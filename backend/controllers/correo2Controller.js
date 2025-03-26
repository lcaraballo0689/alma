// controllers/correo2Controller.js
const nodemailer = require("nodemailer");

exports.sendCorreo2 = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }
  const { to, subject, message } = req.body;
  if (!to || !subject || !message) {
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
    
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      text: message,
    });
    
    return res.status(200).json({ message: "Correo enviado exitosamente", info });
  } catch (error) {
    console.error("Error en sendCorreo2:", error);
    return res.status(500).json({ error: "Error al enviar el correo", details: error });
  }
};
