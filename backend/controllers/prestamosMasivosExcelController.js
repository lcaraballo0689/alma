// controllers/prestamosMasivosExcelController.js
const XLSX = require("xlsx");
const path = require("path");
const { connectDB, sql } = require("../config/db");
const logger = require("../logger");

// Services
const { getUserByEmail, getUserById } = require("../services/userService");
const { getCustodiaByReferencia2, marcarCustodiaSolicitada } = require("../services/custodiaService");
const { getOrCreateConsecutivos, incrementarUltimoPrestamo } = require("../services/consecutivoService");
const { createPrestamoCabecera, createPrestamoDetalle } = require("../services/prestamoService");
const { sendCorreo } = require("./correoController");
// Función para la transferencia interna (ajusta la ruta si es necesario)
const { procesarTransferenciaInterna } = require("./transferenciasController");

/**
 * Función auxiliar para obtener el correo del usuario.
 * @param {Object} pool - Conexión a la base de datos.
 * @param {number} usuarioId - ID del usuario.
 * @returns {Promise<string>} Correo del usuario.
 */
async function obtenerCorreoUsuario(pool, usuarioId) {
  const result = await pool.request()
    .input("usuarioId", sql.Int, usuarioId)
    .query(`
      SELECT TOP 1 email
      FROM Usuario
      WHERE id = @usuarioId
      ORDER BY id ASC
    `);
  return result.recordset.length > 0
    ? result.recordset[0].email
    : process.env.DEFAULT_EMAIL || "correo@por-defecto.com";
}

async function actualizarConsecutivo(transaction, clienteId) {
  const request = transaction.request();
  request.input("clienteId", sql.Int, clienteId);
  const result = await request.query(`
    UPDATE dbo.Consecutivos
    SET ultimoPrestamo = ultimoPrestamo + 1
    WHERE clienteId = @clienteId;
  `);
  logger.info("Consecutivo actualizado en BD", { rowsAffected: result.rowsAffected });
  return result.rowsAffected;
}



/**
 * Endpoint para carga masiva de préstamos a partir de un archivo Excel.
 * Se espera en el body:
 *   - usuarioEmail (opcional)
 *   - observacion (opcional)
 *   - usuarioId (obligatorio)
 * El Excel debe tener los encabezados: [referencia2, direccion_entrega, urgencia]
 * Para cada fila se obtiene la custodia utilizando getCustodiaByReferencia2.
 */
async function cargarPrestamosExcel(req, res) {
  logger.warn("==> INICIO cargarPrestamosExcel <==");
  if (!req.file) {
    logger.error("No se envió archivo Excel");
    return res.status(400).json({ error: "No se adjuntó ningún archivo." });
  }
  
  const { usuarioEmail, observacion, usuarioId } = req.body;
  if (!usuarioId) {
    logger.error("Falta usuarioId en body", { body: req.body });
    return res.status(400).json({ error: "Se debe proporcionar el usuarioId." });
  }
  
  let transaction;
  try {
    // Leer el Excel
    logger.debug("Leyendo archivo Excel desde buffer");
    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Validar encabezados
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    const headers = rows[0];
    const expectedHeaders = ["referencia2", "direccion_entrega", "urgencia"];
    logger.debug("Validando encabezados del Excel", { headers, expectedHeaders });
    if (!headers || headers.length < expectedHeaders.length) {
      logger.error("Encabezados insuficientes", { headers });
      return res.status(400).json({ error: "El archivo Excel no tiene los encabezados correctos." });
    }
    for (let i = 0; i < expectedHeaders.length; i++) {
      if (headers[i].trim().toUpperCase() !== expectedHeaders[i].toUpperCase()) {
        logger.error("Encabezado inválido", { header: headers[i], expected: expectedHeaders[i] });
        return res.status(400).json({ error: "Los encabezados del archivo Excel no coinciden con los requeridos." });
      }
    }
    
    // Convertir filas a array de objetos
    const data = XLSX.utils.sheet_to_json(sheet);
    logger.warn(`Se encontraron ${data.length} filas para procesar en el Excel.`);
    
    // Conectar a la BD y comenzar transacción
    logger.debug("Conectando a la base de datos");
    const poolDB = await connectDB();
    transaction = new sql.Transaction(poolDB);
    await transaction.begin();
    logger.warn("Transacción iniciada.");

    // Obtener datos del usuario
    const correoUsuario = await obtenerCorreoUsuario(poolDB, usuarioId);
    const user = { id: usuarioId, clienteId: 2, email: correoUsuario, name: "Luis Caraballo" };
    logger.warn("Usuario obtenido", { user });

    // Obtener consecutivos
    const consecutivos = await getOrCreateConsecutivos(transaction, user.clienteId);
    logger.warn("Consecutivos obtenidos", { consecutivo: consecutivos.ultimoPrestamo });

    // Crear cabecera del préstamo
    logger.debug("Creando cabecera del préstamo");
    const prestamoId = await createPrestamoCabecera(transaction, {
      usuarioId,
      consecutivo: consecutivos.ultimoPrestamo,
      fechaSolicitud: new Date(),
      fechaEstimadaEntrega: (await (async () => {
        const resultFecha = await poolDB.request()
          .input("clienteId", sql.Int, user.clienteId)
          .input("ansValue", sql.Int, 0)
          .execute("dbo.ObtenerFechaEstimadaEntrega");
        return resultFecha.recordset[0].fechaEstimadaEntrega;
      })()),
      entregadoPor: "",
      observaciones: observacion,
    });
    logger.warn("Cabecera del préstamo creada", { prestamoId });

    const createdPrestamos = [];
    const errores = [];
    
    // Procesar cada fila del Excel
    for (const [index, row] of data.entries()) {
      const filaNumero = index + 2;
      logger.debug("Procesando fila", { fila: filaNumero, row });
      
      // Validar datos obligatorios
      if (!row.referencia2 || !row.direccion_entrega) {
        logger.warn("Fila incompleta", { fila: filaNumero, row });
        errores.push({
          fila: filaNumero,
          referencia2: row.referencia2 || "",
          error: `La fila ${filaNumero} está incompleta (faltan referencia2 o dirección de entrega).`
        });
        continue;
      }
      
      // Obtener custodia mediante referencia2
      logger.debug("Consultando custodia por referencia2", { referencia2: row.referencia2 });
      const custodia = await getCustodiaByReferencia2(transaction, row.referencia2);
      if (!custodia) {
        logger.warn("Custodia no encontrada", { fila: filaNumero, referencia2: row.referencia2 });
        errores.push({
          fila: filaNumero,
          referencia2: row.referencia2,
          error: `El item con Referencia2 '${row.referencia2}' no está disponible.`
        });
        continue;
      }
      
      // Verificar estado DISPONIBLE
      if (custodia.estado.toUpperCase() !== "DISPONIBLE") {
        logger.warn("Custodia no disponible", { fila: filaNumero, estado: custodia.estado });
        errores.push({
          fila: filaNumero,
          referencia2: row.referencia2,
          error: `La custodia con Referencia2 '${row.referencia2}' no está disponible (estado: '${custodia.estado}').`
        });
        continue;
      }
      
      // Insertar detalle del préstamo
      logger.debug("Insertando detalle del préstamo", { fila: filaNumero });
      const newPrestamoDetalleId = await createPrestamoDetalle(transaction, {
        prestamoId,
        clienteId: custodia.clienteId,
        usuarioId: user.id,
        custodiaId: custodia.id,
        consecutivo: consecutivos.ultimoPrestamo + 1,
        fechaSolicitud: new Date(),
        referencia1: String(custodia.referencia1 || ""),
        referencia2: String(custodia.referencia2 || ""),
        referencia3: String(custodia.referencia3 || ""),
        direccion_entrega: String(row.direccion_entrega || ""),
        modalidad: String(row.urgencia || "Normal"),
        observaciones: String(observacion || "")
      });
      logger.warn("Detalle del préstamo creado", { fila: filaNumero, newPrestamoDetalleId });
      
      if (!newPrestamoDetalleId) {
        logger.error("No se obtuvo ID en detalle del préstamo", { fila: filaNumero });
        errores.push({
          fila: filaNumero,
          referencia2: row.referencia2,
          error: "No se pudo crear el detalle del préstamo."
        });
        continue;
      }
      
      // Marcar custodia como SOLICITADO
      await marcarCustodiaSolicitada(transaction, custodia.id);
      logger.warn("Custodia marcada como SOLICITADO", { fila: filaNumero, custodiaId: custodia.id });
      
      
      
      // Acumular el detalle creado
      createdPrestamos.push({
        prestamoDetalleId: newPrestamoDetalleId,
        referencia1: custodia.referencia1,
        referencia2: custodia.referencia2,
        referencia3: custodia.referencia3,
        direccion_entrega: row.direccion_entrega,
        prioridad: row.urgencia || "Normal"
      });
    }
    logger.warn("Actualizando consecutivo una sola vez");

//consecutivos.ultimoPrestamo += 1;
logger.warn("Consecutivo actualizado en objeto local", { ultimoPrestamo: consecutivos.ultimoPrestamo });

    
    // Si no se creó ningún detalle, revertir la transacción
    if (createdPrestamos.length === 0) {
      logger.error("No se crearon detalles de préstamo en ninguna fila", { errores });
      await transaction.rollback();
      return res.status(400).json({
        error: "No se creó ningún préstamo, se encontraron errores en todas las filas.",
        errores: errores
      });
    }
    
    // Preparar payload para transferencia interna
    const transferenciaPayload = {
      clienteId: user.clienteId,
      usuarioId,
      modulo: "Prestamo",
      observacion,
      direccion_entrega: createdPrestamos[0]?.direccion_entrega || "",
      items: createdPrestamos.map(item => ({ referencia2: item.referencia2 }))
    };
    logger.debug("Payload para transferencia interna", { transferenciaPayload });
    
    // Procesar transferencia interna
    await procesarTransferenciaInterna(transferenciaPayload, transaction);
    logger.warn("Transferencia interna procesada.");
    
    await actualizarConsecutivo(transaction, user.clienteId);
    // Confirmar la transacción
    await transaction.commit();
    logger.warn("Transacción comprometida exitosamente.");
    // Preparar y enviar correo de confirmación
    const logoPath = path.join(__dirname, "../assets/bodegapp-logo.png");
    try {
      const correoHTML = errores.length > 0
        ? `<!DOCTYPE html>
            <html>
              <head>
                <meta charset="UTF-8">
                <title>Confirmación Parcial de Solicitud de Préstamo</title>
                <style>
                  /* Estilos del correo */
                </style>
              </head>
              <body>
                <div>
                  <h2>Confirmación Parcial de Solicitud de Préstamo</h2>
                  <p>Estimado/a <strong>${user.name || "Cliente"}</strong>,</p>
                  <p>Se han creado <strong>${createdPrestamos.length}</strong> préstamo(s) con consecutivo <strong>${consecutivos.ultimoPrestamo}</strong>.</p>
                  <p>Errores encontrados: ${errores.map(e => `Fila ${e.fila}: ${e.error}`).join(" | ")}</p>
                </div>
              </body>
            </html>`
        : `<!DOCTYPE html>
            <html>
              <head>
                <meta charset="UTF-8">
                <title>Confirmación de Solicitud de Préstamo</title>
                <style>
                  /* Estilos del correo */
                </style>
              </head>
              <body>
                <div>
                  <h2>Confirmación de Solicitud de Préstamo</h2>
                  <p>Estimado/a <strong>${user.name || "Cliente"}</strong>,</p>
                  <p>Se han creado <strong>${createdPrestamos.length}</strong> préstamo(s) con consecutivo <strong>${consecutivos.ultimoPrestamo}</strong>.</p>
                </div>
              </body>
            </html>`;
      
      await sendCorreo({
        to: process.env.NODE_ENV === "development" ? "lecmbogota@gmail.com" : user.email,
        subject: errores.length > 0
          ? "Confirmación Parcial de Solicitud de Préstamo"
          : "Confirmación de Solicitud de Préstamo",
        text: errores.length > 0
          ? `Estimado/a ${user.name || "Cliente"},\n\nSe han creado ${createdPrestamos.length} préstamo(s) con consecutivo ${consecutivos.ultimoPrestamo}.\nErrores: ${errores.map(e => `Fila ${e.fila}: ${e.error}`).join(" | ")}\n\nGracias por confiar en BODEGAPP.`
          : `Estimado/a ${user.name || "Cliente"},\n\nSe han creado ${createdPrestamos.length} préstamo(s) con consecutivo ${consecutivos.ultimoPrestamo}.\n\nGracias por confiar en BODEGAPP.`,
        html: correoHTML,
        attachments: [
          {
            path: logoPath,
            cid: "bodegappLogo",
            filename: "bodegapp-logo.png"
          }
        ]
      });
      logger.warn("Correo de confirmación enviado exitosamente.");
    } catch (correoError) {
      logger.error("Error al enviar el correo de confirmación", {
        error: correoError.message,
        stack: correoError.stack
      });
      // El fallo en el envío de correo no impide la respuesta final
    }
    
    logger.warn("==> FIN cargarPrestamosExcel <==");
    return res.status(201).json({
      message: "Carga masiva realizada exitosamente.",
      data: createdPrestamos,
      errores: errores
    });
    
  } catch (error) {
    logger.error("Error en cargarPrestamosExcel", {
      error: error.message,
      stack: error.stack
    });
    try {
      if (transaction) await transaction.rollback();
      logger.warn("Transacción revertida.");
    } catch (rollbackError) {
      logger.error("Error al hacer rollback", { rollbackError: rollbackError.message });
    }
    return res.status(500).json({ error: "Error interno del servidor." });
  }
}


function descargarPlantillaExcel(req, res) {
  const tipoPlantilla = req.query.tipo || "prestamo-masivo";
  let expectedHeaders;
  let fileName;

  if (tipoPlantilla === "prestamo-masivo") {
    expectedHeaders = ["referencia2", "direccion_entrega", "urgencia"];
    fileName = "plantilla_prestamo_masivo.xlsx";
  } else if (tipoPlantilla === "devolucion-masiva") {
    expectedHeaders = ["referencia2"];
    fileName = "plantilla_devoluciones.xlsx";
  } else {
    expectedHeaders = [];
    fileName = "plantilla_prestamo.xlsx";
  }

  const worksheet = XLSX.utils.aoa_to_sheet([expectedHeaders]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Plantilla");

  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
  res.attachment(fileName);
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  return res.send(buffer);
}

/**
 * Endpoint para carga masiva de devoluciones a partir de un archivo Excel.
 * Se espera en el body:
 *  - usuarioEmail (obligatorio)
 *  - observacion (opcional)
 * Y en el archivo: encabezados [referencia2]
 */
async function cargarDevolucionesExcel(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'No se adjuntó ningún archivo.' });
  }
  const { usuarioEmail, observacion } = req.body;
  if (!usuarioEmail) {
    return res.status(400).json({ error: 'Se debe proporcionar el usuarioEmail.' });
  }

  let transaction;
  try {
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Validar encabezados (usando mayúsculas)
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    console.log("ROWS => ", rows);
    const headers = rows[0];
    const expectedHeaders = ["referencia2"];
    if (!headers || headers.length < expectedHeaders.length) {
      return res.status(400).json({ error: 'El archivo Excel no tiene los encabezados correctos.' });
    }
    for (let i = 0; i < expectedHeaders.length; i++) {
      if (headers[i].trim().toUpperCase() !== expectedHeaders[i].toUpperCase()) {
        return res.status(400).json({ error: 'Los encabezados del archivo Excel no coinciden con los requeridos.' });
      }
    }

    const data = XLSX.utils.sheet_to_json(sheet);
    const poolDB = await connectDB();
    transaction = new sql.Transaction(poolDB);
    await transaction.begin();

    // Usuario estático (idealmente se obtiene dinámicamente)
    const user = { id: 3, clienteId: 2, email: 'lecmbogota@gmail.com', name: 'Luis Caraballo' };
    console.log("Usuario:", user);

    // Actualizar consecutivo para devoluciones
    const consecutivos = await incrementarUltimaDevolucion(transaction, user.clienteId);
    console.log("Consecutivos para devoluciones:", consecutivos);

    const createdDevoluciones = [];
    const errores = []; // Errores parciales

    for (const [index, row] of data.entries()) {
      const filaNumero = index + 2; // Compensar encabezado
      if (!row.referencia2) {
        errores.push({
          fila: filaNumero,
          referencia2: row.referencia2 || '',
          error: `La fila ${filaNumero} está incompleta (faltan referencia2).`
        });
        continue;
      }

      console.log("Procesando fila:", filaNumero);
      const custodia = await getCustodiaByReferencia2(transaction, row.referencia2);
      console.log("Custodia encontrada:", custodia);
      if (!custodia) {
        errores.push({
          fila: filaNumero,
          referencia2: row.referencia2,
          error: `El item con Referencia2 '${row.referencia2}' no está disponible.`
        });
        continue;
      }
      if (custodia.estado.toUpperCase() !== 'ENTREGADO') {
        errores.push({
          fila: filaNumero,
          referencia2: row.referencia2,
          error: `La custodia con referencia2 '${row.referencia2}' no está disponible para devolución (estado: '${custodia.estado}').`
        });
        continue;
      }

      await incrementarUltimaDevolucion(transaction, user.clienteId);
      consecutivos.ultimaDevolucion += 1;

      const newDevolucionId = await createPrestamoDetalle(transaction, {
        clienteId: custodia.clienteId,
        usuarioId: user.id,
        custodiaId: custodia.id,
        consecutivo: consecutivos.ultimaDevolucion + 1,
        fechaSolicitud: new Date(),
        referencia2: String(custodia.referencia2 || ''),
        direccion_entrega: String(row.direccion_entrega || ''),
        observacion: String(observacion || '')
      });
      console.log('Nuevo ID de devolución:', newDevolucionId);
      createdDevoluciones.push(newDevolucionId);
    }

    if (createdDevoluciones.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        error: "No se creó ninguna devolución, revise todas las filas.",
        errores: errores
      });
    }

    await transaction.commit();
    console.log("Transacción para devoluciones comprometida.");

    return res.status(200).json({
      message: errores.length > 0
        ? "Carga masiva parcial completada."
        : "Carga masiva realizada exitosamente.",
      creados: createdDevoluciones,
      errores: errores
    });
  } catch (error) {
    console.error("Error en cargarDevolucionesExcel:", error);
    try {
      if (transaction) await transaction.rollback();
    } catch (rollbackError) {
      console.error("Error al hacer rollback:", rollbackError);
    }
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
}


module.exports = {
  cargarPrestamosExcel,
  descargarPlantillaExcel,
  cargarDevolucionesExcel
};
