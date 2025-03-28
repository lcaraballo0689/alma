// controllers/DevolucionesMasivasExcelController.js
const XLSX = require("xlsx");
const path = require("path");
const { connectDB, sql } = require("../config/db");

// Services
const { getUserById } = require("../services/userService");
const { getCustodiaByReferencia2, marcarCustodiaEnDevolucion } = require("../services/custodiaService");
const { getOrCreateConsecutivos, incrementarUltimaDevolucion } = require("../services/consecutivoService");
const { createDevolucionCabecera, createDevolucionDetalle } = require("../services/devolucionService");
const { procesarTransferenciaInterna } = require("./transferenciasController");
// Usar el servicio de correo, el cual debe exportar sendEmailTemplate
const emailService = require("../services/email.service");

async function cargarDevolucionesMasivasExcel(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'No se adjuntó ningún archivo.' });
  }
  
  const { usuarioId, observaciones } = req.body;
  if (!usuarioId) {
    return res.status(400).json({ error: 'No se ha proporcionado el ID del usuario.' });
  }
  
  // Leer el archivo Excel y validar el encabezado
  const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  const headers = rows[0];
  const expectedHeaders = ["referencia2"];
  if (!headers || headers.length < expectedHeaders.length) {
    return res.status(400).json({ error: 'El archivo Excel no tiene los encabezados correctos.' });
  }
  for (let i = 0; i < expectedHeaders.length; i++) {
    if (headers[i].trim().toLowerCase() !== expectedHeaders[i].toLowerCase()) {
      return res.status(400).json({ error: 'Los encabezados del archivo Excel no coinciden con los requeridos.' });
    }
  }
  
  // Convertir el Excel a array de objetos (omitiendo la primera fila)
  const data = XLSX.utils.sheet_to_json(sheet);
  
  const pool = await connectDB();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  
  try {
    // Obtener el usuario
    const user = await getUserById(transaction, usuarioId);
    if (!user) {
      await transaction.rollback();
      return res.status(404).json({ error: "Usuario no encontrado." });
    }
    
    // Recolectar las custodias válidas según "referencia2"
    const custodias = [];
    const errores = [];
    for (const [index, row] of data.entries()) {
      const filaNumero = index + 2;
      if (!row.referencia2) {
        errores.push(`La fila ${filaNumero} está incompleta (faltan referencia2).`);
        continue;
      }
      
      const custodia = await getCustodiaByReferencia2(transaction, row.referencia2);
      if (!custodia) {
        errores.push(`Fila ${filaNumero}: El item con Referencia2 '${row.referencia2}' no se encontró.`);
        continue;
      }
      // Verificar que la custodia esté en un estado válido para devolución (por ejemplo, "PRESTADA" o "ENTREGADO")
      if (custodia.estado !== 'PRESTADA' && custodia.estado !== 'ENTREGADO') {
        errores.push(`Fila ${filaNumero}: La custodia con Referencia2 '${row.referencia2}' no se encuentra en un estado válido (estado: '${custodia.estado}').`);
        continue;
      }
      custodias.push(custodia);
    }
    
    if (custodias.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ error: "No se encontraron custodias válidas para devolución.", errores });
    }
    
    // Obtener o crear el registro de consecutivos para el cliente
    const consecutivos = await getOrCreateConsecutivos(transaction, user.clienteId);
    
    // Crear la cabecera de devolución usando el consecutivo actual
    const devolucionHeaderPayload = {
      usuarioId,
      consecutivo: consecutivos.ultimaDevolucion, // Se utiliza el valor actual para la cabecera
      fechaSolicitud: new Date(),
      entregadoPor: "",
      observaciones
    };
    const devolucionId = await createDevolucionCabecera(transaction, devolucionHeaderPayload);
    
    const createdDevolucion = [];
    
    // Para cada custodia válida, se crea el detalle de la devolución y se marca la custodia como en devolución
    for (const custodia of custodias) {
      const payloadDetalle = {
        devolucionId,
        clienteId: custodia.clienteId,
        usuarioId,
        custodiaId: custodia.id,
        consecutivo: consecutivos.ultimaDevolucion,
        fechaSolicitud: new Date(),
        referencia1: custodia.referencia1,
        referencia2: custodia.referencia2,
        referencia3: custodia.referencia3,
        observaciones
      };
      
      await createDevolucionDetalle(transaction, payloadDetalle);
      await marcarCustodiaEnDevolucion(transaction, custodia.id);
      
      createdDevolucion.push({
        devolucionId,
        referencia1: custodia.referencia1,
        referencia2: custodia.referencia2,
        referencia3: custodia.referencia3,
      });
    }
    
    // Procesar la transferencia interna (si aplica)
    const transferenciaPayload = {
      clienteId: user.clienteId,
      usuarioId,
      modulo: "Devolucion",
      items: custodias.map(custodia => ({ referencia2: custodia.referencia2 }))
    };
    await procesarTransferenciaInterna(transferenciaPayload, transaction);
    
    // Incrementar el consecutivo de devoluciones
    await incrementarUltimaDevolucion(transaction, user.clienteId);
    
    await transaction.commit();
    
    // Enviar correo de notificación utilizando la misma forma que en el controlador de préstamos
    try {
      const logoPath = path.join(__dirname, "../assets/siglo.png");
      // En este ejemplo se obtiene el destinatario usando el email del usuario,
      // o puedes definirlo de otra forma (por ejemplo, un correo por defecto)
      const destinatario = process.env.NODE_ENV === 'development' ? 'lecmbogota@gmail.com' : user.email;
      
      // Construir el objeto de datos para la plantilla del correo
      const spResponse = {
        SolicitudId: devolucionId,
        EstadoAnterior: "Prestado",
        NuevoEstado: "Solicitado",
        FechaActualizacion: new Date(),
        Observaciones: observaciones || "Sin observaciones",
        Modulo: "Devolucion"
      };
      
      const emailData = {
        solicitudId: spResponse.SolicitudId,
        estadoAnterior: spResponse.EstadoAnterior,
        estadoActual: spResponse.NuevoEstado,
        fechaActualizacion: spResponse.FechaActualizacion,
        observaciones: spResponse.Observaciones,
        modulo: spResponse.Modulo,
      };
      
      const emailResponse = await emailService.sendEmailTemplate({
        to: destinatario,
        subject: `Acuse de Movimiento - Solicitud ${spResponse.SolicitudId} - ESTADO: ${spResponse.NuevoEstado}`,
        template: "acuseMovimiento",
        data: emailData,
        attachments: [{
          path: logoPath,
          cid: "bodegappLogo",
          filename: "bodegapp-logo.png"
        }]
      });
      
      console.log(`Correo enviado exitosamente. Respuesta: ${JSON.stringify(emailResponse)}`);
    } catch (emailErr) {
      console.error("Error al enviar correo:", emailErr);
    }
    
    return res.status(201).json({
      message: "Devoluciones creadas exitosamente.",
      data: createdDevolucion,
      errores
    });
    
  } catch (error) {
    console.error("Error en cargarDevolucionesMasivasExcel:", error);
    try {
      await transaction.rollback();
    } catch (rollbackError) {
      console.error("Error al hacer rollback:", rollbackError);
    }
    return res.status(500).json({ error: "Error interno del servidor." });
  }
}

module.exports = {
  cargarDevolucionesMasivasExcel
};
