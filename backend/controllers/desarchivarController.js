/***********************************/
/* controllers/desarchivarController.js */
/***********************************/

const fs = require('fs');
const path = require('path');
require("dotenv").config();
const { connectDB, sql } = require("../config/db");
const emailService = require("../services/email.service");
const { generatePDF } = require("../services/pdfService");

/**
 * Función auxiliar para obtener el correo del cliente.
 * @param {Object} pool - Conexión a la base de datos.
 * @param {number} clienteId - ID del cliente.
 * @returns {string} Correo del cliente o un correo por defecto.
 */
async function obtenerCorreoCliente(pool, clienteId) {
  const result = await pool
    .request()
    .input("clienteId", sql.Int, clienteId)
    .query(`
      SELECT TOP 1 email
      FROM Usuario
      WHERE clienteId = @clienteId
      ORDER BY id ASC
    `);

  return result.recordset.length > 0
    ? result.recordset[0].email
    : process.env.DEFAULT_EMAIL || "correo@por-defecto.com";
}

/**
 * @description Obtiene un archivo PDF basado en la estructura de carpetas:
 * public/pdfs/{clienteId}/{year}/{month}/{day}/{filename}
 * Campos obligatorios en el body: clienteId, filename, year, month, day.
 */
async function getPdfFile(req, res, next) {
  try {
    const { clienteId, filename, year, month, day } = req.body;
    if (!clienteId || !filename || !year || !month || !day) {
      return res.status(400).json({
        error: "Se requieren los campos: clienteId, filename, year, month y day."
      });
    }

    console.log("Body recibido:", req.body);

    const pdfPath = path.resolve(
      process.cwd(),
      'public',
      'pdfs',
      String(clienteId),
      String(year).padStart(2, '0'),
      String(month).padStart(2, '0'),
      String(day).padStart(2, '0'),
      filename
    );
    console.log("pdfPath que se busca:", pdfPath);

    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({ error: "Archivo no encontrado." });
    }

    return res.sendFile(pdfPath);
  } catch (error) {
    return next(error);
  }
}

/**
 * @description Inicia el proceso de desarchivo: actualiza el estado de la caja (Custodia) a "EN CAMINO"
 * para indicar que se ha despachado desde la bodega hacia la dirección del cliente.
 * Campos obligatorios en el body: clienteId, custodiaId.
 */
async function iniciarDesarchivar(req, res, next) {
  try {
    if (!req.body || !req.body.clienteId || !req.body.custodiaId) {
      return res.status(400).json({
        error: "Se requieren los campos: clienteId y custodiaId."
      });
    }

    const { clienteId, custodiaId } = req.body;
    const pool = await connectDB(); // No cerramos el pool al final

    // Actualizar estado a "EN CAMINO" en Custodia
    await pool.request()
      .input("custodiaId", sql.Int, custodiaId)
      .query(`
        UPDATE Custodia
        SET estado = 'EN CAMINO'
        WHERE id = @custodiaId
      `);

    // Enviar notificaciones
    const correoCliente = await obtenerCorreoCliente(pool, clienteId);
    const correoBodega = process.env.BODEGAPP_EMAIL || "bodega@tuempresa.com";

    await emailService.sendEmail({
      to: correoCliente,
      subject: "Inicio de desarchivo",
      text: `Su caja con ID ${custodiaId} ha sido despachada desde la bodega hacia su dirección.`
    });
    await emailService.sendEmail({
      to: correoBodega,
      subject: "Despacho de desarchivo",
      text: `La caja con ID ${custodiaId} ha sido despachada hacia la dirección del cliente ${clienteId}.`
    });

    return res.status(200).json({
      message: "Proceso de desarchivo iniciado; la caja está en camino a su destino.",
      custodiaId
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * @description Confirma la recepción de la caja desarchivada.
 * Actualiza el estado de la caja a "ENTREGADO", genera un PDF de constancia,
 * lo almacena en una ruta estructurada según cliente y fecha, 
 * e inserta un registro en la tabla Desarchivos.
 * Campos obligatorios: clienteId, custodiaId.
 */
async function confirmarDesarchivar(req, res, next) {
  try {
    if (!req.body || !req.body.clienteId || !req.body.custodiaId) {
      return res.status(400).json({
        error: "Se requieren los campos: clienteId y custodiaId."
      });
    }

    const { clienteId, custodiaId } = req.body;
    const pool = await connectDB();

    // Actualizar el estado de la caja a "ENTREGADO" en Custodia
    await pool.request()
      .input("custodiaId", sql.Int, custodiaId)
      .query(`
        UPDATE Custodia
        SET estado = 'ENTREGADO'
        WHERE id = @custodiaId
      `);

    // Generar el PDF de constancia de entrega utilizando el servicio PDF
    const now = new Date();
    const pdfData = {
      title: "Constancia de Entrega de desarchivo",
      info: `Se confirma la entrega de la caja desarchivada con ID ${custodiaId} para el cliente ${clienteId}.`,
      table: {
        headers: ["Concepto", "Valor"],
        rows: [
          { "Concepto": "ID Caja", "Valor": custodiaId },
          { "Concepto": "Cliente ID", "Valor": clienteId },
          { "Concepto": "Fecha de Entrega", "Valor": now.toLocaleString() }
        ]
      },
      bodegappSignaturePath: process.env.BODEGAPP_SIGNATURE_PATH || "",
      bodegappSignatureLabel: "Firma Bodegapp",
      clienteSignaturePath: process.env.CLIENTE_SIGNATURE_PATH || "",
      clienteSignatureLabel: "Firma Cliente",
      footer: `Entrega confirmada el ${now.toLocaleString()}`
    };

    const pdfBuffer = await generatePDF(pdfData);

    // Construir la ruta para guardar el PDF
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const day = now.getDate().toString().padStart(2, "0");
    const folderPath = path.resolve(
      process.cwd(),
      "public",
      "pdfs",
      String(clienteId),
      year,
      month,
      day
    );

    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    const pdfFileName = `desarchivo_${custodiaId}_${Date.now()}.pdf`;
    const pdfFullPath = path.join(folderPath, pdfFileName);
    fs.writeFileSync(pdfFullPath, pdfBuffer);

    // Insertar un registro en la tabla Desarchivos
    await pool.request()
      .input("custodiaId", sql.Int, custodiaId)
      .input("clienteId", sql.Int, clienteId)
      .input("fechaDesarchivo", sql.DateTime, now)
      .input("year", sql.VarChar, year)
      .input("month", sql.VarChar, month)
      .input("day", sql.VarChar, day)
      .input("pdfFileName", sql.VarChar, pdfFileName)
      .input("pdfFullPath", sql.VarChar, pdfFullPath)
      .input("observaciones", sql.VarChar, "desarchivo confirmado")
      .query(`
        INSERT INTO Desarchivos (
          custodiaId,
          clienteId,
          fechaDesarchivo,
          year,
          month,
          day,
          pdfFileName,
          pdfFullPath,
          observaciones
        )
        VALUES (
          @custodiaId,
          @clienteId,
          @fechaDesarchivo,
          @year,
          @month,
          @day,
          @pdfFileName,
          @pdfFullPath,
          @observaciones
        )
      `);

    // Enviar notificaciones
    const correoCliente = await obtenerCorreoCliente(pool, clienteId);
    const correoBodega = process.env.BODEGAPP_EMAIL || "bodega@tuempresa.com";

    await emailService.sendEmail({
      to: correoCliente,
      subject: "Confirmación de desarchivo",
      text: `Se ha confirmado la entrega de su caja con ID ${custodiaId}. La constancia de entrega ha sido generada.`
    });
    await emailService.sendEmail({
      to: correoBodega,
      subject: "Entrega de desarchivo Confirmada",
      text: `La entrega de la caja con ID ${custodiaId} ha sido confirmada por el cliente ${clienteId}.`
    });

    return res.status(200).json({
      message: "Entrega confirmada y constancia generada.",
      custodiaId,
      pdfPath: pdfFullPath
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * @description Confirma la recepción de múltiples cajas desarchivadas (masivo).
 * Recibe un array de IDs de custodia en el body y el clienteId.
 * Actualiza el estado de cada caja a "ENTREGADO", genera un PDF **por cada caja** 
 * y además un PDF masivo con todas las cajas, guarda los PDFs en la ruta estructurada,
 * e inserta un registro en la tabla Desarchivos por cada caja.
 *
 * Campos obligatorios en el body:
 *   - clienteId: ID del cliente.
 *   - custodiaIds: Array de IDs de Custodia.
 */
async function confirmarDesarchivarMasivo(req, res, next) {
  let transaction;
  try {
    const { clienteId, custodiaIds } = req.body;

    if (!clienteId || !Array.isArray(custodiaIds) || custodiaIds.length === 0) {
      return res.status(400).json({
        error: "Se requieren los campos: clienteId y un array no vacío de custodiaIds."
      });
    }

    const pool = await connectDB();
    transaction = new sql.Transaction(pool);

    await transaction.begin();

    const now = new Date();
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const day = now.getDate().toString().padStart(2, "0");

    // Bloqueo pesimista del registro de Cliente
    const requestCliente = new sql.Request(transaction);
    requestCliente.input('clienteId_lock', sql.Int, clienteId);
    const clienteLockResult = await requestCliente.query(`
      SELECT id
      FROM Cliente WITH (UPDLOCK, ROWLOCK)
      WHERE id = @clienteId_lock
    `);
    if (clienteLockResult.recordset.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ error: `El cliente con ID ${clienteId} no existe.` });
    }

    const rows = [];
    const insertedDesarchivos = [];

    // Procesamos cada custodiaId
    for (const custodiaId of custodiaIds) {
      // 1) Bloqueo pesimista del registro de Custodia
      const requestLockCustodia = new sql.Request(transaction);
      requestLockCustodia.input("lockCustodiaId", sql.Int, custodiaId);
      const custodiaLockResult = await requestLockCustodia.query(`
        SELECT id, estado
        FROM Custodia WITH (UPDLOCK, ROWLOCK)
        WHERE id = @lockCustodiaId
      `);

      if (custodiaLockResult.recordset.length === 0) {
        await transaction.rollback();
        return res.status(400).json({ error: `La custodia con ID ${custodiaId} no existe.` });
      }

      const custodia = custodiaLockResult.recordset[0];

      if (custodia.estado === 'ENTREGADO') {
        console.warn(`La custodia con ID ${custodiaId} ya está marcada como ENTREGADO.`);
        rows.push({ "ID Caja": custodiaId, "Cliente ID": clienteId, "Estado": "Ya Entregado" });
        continue;
      }

      // 2) Actualizar Custodia -> ENTREGADO
      const requestUpdateCustodia = new sql.Request(transaction);
      requestUpdateCustodia.input("custodiaId", sql.Int, custodiaId);
      await requestUpdateCustodia.query(`
        UPDATE Custodia
        SET estado = 'ENTREGADO'
        WHERE id = @custodiaId
      `);

      rows.push({
        "ID Caja": custodiaId,
        "Cliente ID": clienteId,
        "Estado": "ENTREGADO"
      });

      // 3) Generar PDF individual para esa caja
      const pdfFileName = `desarchivo_${custodiaId}_${Date.now()}.pdf`;
      const folderPath = path.resolve(
        process.cwd(),
        "public",
        "pdfs",
        String(clienteId),
        year,
        month,
        day
      );
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }
      const pdfFullPath = path.join(folderPath, pdfFileName);
      console.log("Guardando PDF para custodia", custodiaId, "en:", pdfFullPath);

      const pdfDataIndividual = {
        title: `Constancia de Entrega de desarchivo (Caja ${custodiaId})`,
        info: `Se confirma la entrega de la caja con ID ${custodiaId} para el cliente ${clienteId}.`,
        table: {
          headers: ["ID Caja", "Cliente ID"],
          rows: [
            { "ID Caja": custodiaId, "Cliente ID": clienteId }
          ]
        },
        bodegappSignaturePath: process.env.BODEGAPP_SIGNATURE_PATH || "",
        bodegappSignatureLabel: "Firma Bodegapp",
        clienteSignaturePath: process.env.CLIENTE_SIGNATURE_PATH || "",
        clienteSignatureLabel: "Firma Cliente",
        footer: `Entrega confirmada el ${now.toLocaleString()}`
      };

      const pdfBufferIndividual = await generatePDF(pdfDataIndividual);
      fs.writeFileSync(pdfFullPath, pdfBufferIndividual);

      // 4) Insertar registro en Desarchivos
      const requestInsertDesarchivo = new sql.Request(transaction);
      requestInsertDesarchivo
        .input("custodiaId", sql.Int, custodiaId)
        .input("clienteId", sql.Int, clienteId)
        .input("fechaDesarchivo", sql.DateTime, now)
        .input("year", sql.VarChar, year)
        .input("month", sql.VarChar, month)
        .input("day", sql.VarChar, day)
        .input("pdfFileName", sql.VarChar, pdfFileName)
        .input("pdfFullPath", sql.VarChar, pdfFullPath)
        .input("observaciones", sql.VarChar, "desarchivo confirmado");

      const resultDesarchivo = await requestInsertDesarchivo.query(`
        INSERT INTO Desarchivos (
          custodiaId,
          clienteId,
          fechaDesarchivo,
          year,
          month,
          day,
          pdfFileName,
          pdfFullPath,
          observaciones
        )
        OUTPUT INSERTED.id
        VALUES (
          @custodiaId,
          @clienteId,
          @fechaDesarchivo,
          @year,
          @month,
          @day,
          @pdfFileName,
          @pdfFullPath,
          @observaciones
        )
      `);
      insertedDesarchivos.push(resultDesarchivo.recordset[0].id);
    }

    // Generar un PDF de constancia masiva
    const pdfDataMasivo = {
      title: "Constancia de Entrega de desarchivo (Masivo)",
      info: `Se confirma la entrega masiva de cajas para el cliente ${clienteId}.`,
      table: {
        headers: ["ID Caja", "Cliente ID", "Estado"],
        rows
      },
      bodegappSignaturePath: process.env.BODEGAPP_SIGNATURE_PATH || "",
      bodegappSignatureLabel: "Firma Bodegapp",
      clienteSignaturePath: process.env.CLIENTE_SIGNATURE_PATH || "",
      clienteSignatureLabel: "Firma Cliente",
      footer: `Entrega confirmada el ${now.toLocaleString()}`
    };

    const pdfBufferMasivo = await generatePDF(pdfDataMasivo);
    const pdfFileNameMasivo = `desarchivoMasivo_${Date.now()}.pdf`;
    const folderPathMasivo = path.resolve(
      process.cwd(),
      "public",
      "pdfs",
      String(clienteId),
      year,
      month,
      day
    );
    if (!fs.existsSync(folderPathMasivo)) {
      fs.mkdirSync(folderPathMasivo, { recursive: true });
    }
    const pdfFullPathMasivo = path.join(folderPathMasivo, pdfFileNameMasivo);
    console.log("Guardando PDF masivo en:", pdfFullPathMasivo);
    fs.writeFileSync(pdfFullPathMasivo, pdfBufferMasivo);

    // Finalizamos la transacción
    await transaction.commit();

    // Enviar correos
    const correoCliente = await obtenerCorreoCliente(pool, clienteId);
    const correoBodega = process.env.BODEGAPP_EMAIL || "bodega@tuempresa.com";

    if (correoCliente) {
      await emailService.sendEmail({
        to: correoCliente,
        subject: "Confirmación de desarchivo Masivo",
        text: `Se ha confirmado la entrega masiva de sus cajas. Se generó la constancia masiva con el nombre: ${pdfFileNameMasivo}`
      });
    } else {
      console.warn(`No se encontró correo electrónico para el cliente ID ${clienteId}.`);
    }

    await emailService.sendEmail({
      to: correoBodega,
      subject: "Entrega de desarchivo Masivo Confirmada",
      text: `Se ha confirmado la entrega masiva de cajas para el cliente ${clienteId}. Constancia generada: ${pdfFileNameMasivo}`
    });

    return res.status(200).json({
      message: "Entrega masiva confirmada y constancia generada.",
      custodiaIds,
      pdfPath: pdfFullPathMasivo
    });
  } catch (error) {
    console.error("Error durante la transacción:", error);
    if (transaction) {
      await transaction.rollback();
    }
    return next(error);
  }
}

/**
 * @description 
 * Obtiene el detalle de un registro de desarchivo (en la tabla `Desarchivos`),
 * haciendo JOIN con Custodia, Bodega y Ubicacion para mostrar información ampliada.
 * 
 * Requisitos (en el body de la petición, usando POST):
 *  - clienteId (number) [Obligatorio]
 *  - desarchivoId (number) [Obligatorio]
 *
 * Ejemplo de body:
 * {
 *   "clienteId": 2,
 *   "desarchivoId": 10
 * }
 */
async function consultarDetalleDesarchivo(req, res, next) {
  try {
    const { clienteId, desarchivoId } = req.body;

    // Validar campos obligatorios
    if (!clienteId) {
      return res.status(400).json({
        error: 'El campo "clienteId" es obligatorio.',
      });
    }
    if (!desarchivoId) {
      return res.status(400).json({
        error: 'El campo "desarchivoId" es obligatorio para el detalle.',
      });
    }

    // Conexión al pool de MSSQL
    const pool = await connectDB();
    const request = pool.request();

    // Asignación de parámetros para evitar inyección SQL
    request.input('clienteId', sql.Int, clienteId);
    request.input('desarchivoId', sql.Int, desarchivoId);

    // Consulta con JOIN a las tablas relacionadas
    // Ajusta los campos y nombres de columnas/tabla según tu BD real
    const query = `
      SELECT 
        -- Campos de la tabla Desarchivos
        D.id AS desarchivoId,
        D.custodiaId,
        D.clienteId,
        D.fechaDesarchivo,
        D.year,
        D.month,
        D.day,
        D.pdfFileName,
        D.pdfFullPath,
        D.observaciones,

        -- Campos de la tabla Custodia
        C.item AS custodiaItem,
        C.referencia1 AS custodiaRef1,
        C.referencia2 AS custodiaRef2,
        C.referencia3 AS custodiaRef3,
        C.estado AS custodiaEstado,
        C.bodega_id AS bodegaIdReal,
        C.ubicacionId AS ubicacionIdReal,

        -- Campos de la tabla Bodega
        B.nombre AS bodegaNombre,
        B.codigoUbicacion AS bodegaCodigo,

        -- Campos de la tabla Ubicacion
        U.modulo,
        U.entrepano,
        U.cara,
        U.piso,
        U.estado AS ubicacionEstado

      FROM Desarchivos D
      INNER JOIN Custodia C 
        ON D.custodiaId = C.id
      INNER JOIN Bodega B 
        ON C.bodega_id = B.id
      INNER JOIN Ubicacion U 
        ON C.ubicacionId = U.id

      WHERE D.id = @desarchivoId
        AND D.clienteId = @clienteId
    `;

    const result = await request.query(query);

    // Si no se encuentra ningún registro, retornamos 404
    if (result.recordset.length === 0) {
      return res.status(404).json({
        error: 'No se encontró el desarchivo con los datos provistos.'
      });
    }

    // Asumimos que habrá un único registro que coincida con (clienteId, desarchivoId)
    const detalle = result.recordset[0];

    // Retornamos la data en formato JSON
    return res.status(200).json({
      data: detalle,
    });

  } catch (error) {
    return next(error);
  }
}
/**
 * @description
 * Lista todos los registros de desarchivo para un cliente,
 * con la posibilidad de aplicar filtros opcionales como:
 *  - fechaDesde (YYYY-MM-DD)
 *  - fechaHasta (YYYY-MM-DD)
 *  - referencia1 (para filtrar por Custodia.referencia1)
 * 
 * Requisitos (en el body de la petición):
 *   - clienteId: number (obligatorio)
 * 
 * Ejemplo de body:
 * {
 *   "clienteId": 2,
 *   "fechaDesde": "2025-01-01",
 *   "fechaHasta": "2025-12-31",
 *   "referencia1": "ABC123"
 * }
 * 
 * Se devolverá un array de objetos (cada uno es un desarchivo con info básica de la custodia).
 */
async function listarDesarchivos(req, res, next) {
  try {
    const {
      clienteId,
      fechaDesde,
      fechaHasta,
      referencia1,
    } = req.body;

    // Validar que venga el clienteId
    if (!clienteId) {
      return res.status(400).json({
        error: 'El campo "clienteId" es obligatorio para listar los desarchivos.',
      });
    }

    // Conexión al pool de MSSQL
    const pool = await connectDB();
    const request = pool.request();

    // Asignación de parámetros base
    request.input('clienteId', sql.Int, clienteId);

    // Construimos la consulta base con JOIN a Custodia (para obtener datos de la caja)
    let query = `
      SELECT
        D.id AS desarchivoId,
        D.custodiaId,
        D.clienteId,
        D.fechaDesarchivo,
        D.year,
        D.month,
        D.day,
        D.pdfFileName,
        D.pdfFullPath,
        D.observaciones,

        -- Opcional: Mostrar información básica de la custodia
        C.item AS custodiaItem,
        C.referencia1 AS custodiaRef1,
        C.referencia2 AS custodiaRef2,
        C.referencia3 AS custodiaRef3,
        C.estado AS custodiaEstado

      FROM Desarchivos D
      INNER JOIN Custodia C 
        ON D.custodiaId = C.id
      WHERE D.clienteId = @clienteId
    `;

    // Filtro opcional por rango de fechas
    if (fechaDesde) {
      query += ' AND D.fechaDesarchivo >= @fechaDesde';
      request.input('fechaDesde', sql.DateTime, new Date(fechaDesde));
    }
    if (fechaHasta) {
      query += ' AND D.fechaDesarchivo <= @fechaHasta';
      request.input('fechaHasta', sql.DateTime, new Date(fechaHasta));
    }

    // Filtro opcional por referencia1 de Custodia
    if (referencia1) {
      query += ' AND C.referencia1 = @referencia1';
      request.input('referencia1', sql.NVarChar, referencia1);
    }

    // Ordenar por fechaDesarchivo DESC (o como prefieras)
    query += ' ORDER BY D.fechaDesarchivo DESC';

    const result = await request.query(query);

    // Devolvemos el listado
    return res.status(200).json({
      data: result.recordset,
      count: result.recordset.length,
    });
  } catch (error) {
    return next(error);
  }
}


/**
 * Cancela una solicitud de desarchivo.
 *
 * Requisitos en el body (en una petición POST):
 *  - clienteId (number): Obligatorio.
 *  - desarchivoId (number): Obligatorio.
 *
 * Flujo:
 * 1. Se valida que se envíen ambos campos.
 * 2. Se consulta el registro de Desarchivos para verificar que exista y su estado.
 * 3. Si el registro existe y su estado permite la cancelación (no está "ENTREGADO" ni ya "CANCELADO"),
 *    se actualiza el estado a "CANCELADO".
 * 4. Se puede enviar un correo de notificación.
 * 5. Se retorna una respuesta exitosa.
 */
async function cancelarDesarchivar(req, res, next) {
  try {
    const { clienteId, desarchivoId } = req.body;

    // Validar que se envíen los campos obligatorios
    if (!clienteId || !desarchivoId) {
      return res.status(400).json({
        error: 'Se requieren los campos "clienteId" y "desarchivoId".',
      });
    }

    const pool = await connectDB();
    const request = pool.request();

    // Asignar parámetros para evitar inyección SQL
    request.input('clienteId', sql.Int, clienteId);
    request.input('desarchivoId', sql.Int, desarchivoId);

    // Verificar que exista el registro y obtener su estado
    const selectQuery = `
      SELECT id, estado
      FROM Desarchivos
      WHERE id = @desarchivoId AND clienteId = @clienteId
    `;
    const result = await request.query(selectQuery);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'No se encontró el desarchivo con los datos proporcionados.' });
    }

    const { estado } = result.recordset[0];

    // Validar que el registro no se encuentre en un estado final
    if (estado === 'ENTREGADO') {
      return res.status(400).json({
        error: 'No se puede cancelar un desarchivo que ya fue ENTREGADO.',
      });
    }
    if (estado === 'CANCELADO') {
      return res.status(400).json({
        error: 'El desarchivo ya se encuentra cancelado.',
      });
    }

    // Actualizar el estado a "CANCELADO"
    const updateQuery = `
      UPDATE Desarchivos
      SET estado = 'CANCELADO'
      WHERE id = @desarchivoId AND clienteId = @clienteId
    `;
    await request.query(updateQuery);

    // (Opcional) Enviar notificación por correo
     await emailService.sendEmail({
      to: 'lecmbogota@gmail.com.com', // Se debe obtener el correo del cliente
      subject: 'Cancelación de desarchivo',
     text: `La solicitud de desarchivo con ID ${desarchivoId} ha sido cancelada.`,
     });

    return res.status(200).json({
      message: `El desarchivo ${desarchivoId} ha sido cancelado exitosamente.`,
    });
  } catch (error) {
    return next(error);
  }
}
async function actualizarEstadoDesarchivo(req, res, next) {
  try {
    const { clienteId, desarchivoId, nuevoEstado } = req.body;
    if (!clienteId || !desarchivoId || !nuevoEstado) {
      return res.status(400).json({ error: 'Se requieren "clienteId", "desarchivoId" y "nuevoEstado".' });
    }

    // Se asume que el middleware de autenticación asigna en req.user el objeto con { id, tipoUsuarioId, rol, ... }
    const usuario = req.user;
    if (!usuario || !usuario.tipoUsuarioId) {
      return res.status(401).json({ error: 'No autorizado: falta información del usuario.' });
    }
    const tipoUsuarioId = usuario.tipoUsuarioId; // por ejemplo, 1 para admin, 2 para cliente

    const pool = await connectDB();
    const requestDb = pool.request();
    requestDb.input('clienteId', sql.Int, clienteId);
    requestDb.input('desarchivoId', sql.Int, desarchivoId);

    // Obtener el estado actual del registro de Desarchivos
    const selectQuery = `
      SELECT estado
      FROM Desarchivos
      WHERE id = @desarchivoId AND clienteId = @clienteId
    `;
    const result = await requestDb.query(selectQuery);
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'No se encontró el desarchivo.' });
    }
    const { estado: estadoActual } = result.recordset[0];

    // Consultar la tabla de transiciones para obtener los estados permitidos según:
    // - El módulo 'desarchivo'
    // - El estado actual obtenido
    // - El tipoUsuarioId del usuario actual
    const requestTrans = pool.request();
    requestTrans.input('modulo', sql.NVarChar, 'desarchivo');
    requestTrans.input('estadoActual', sql.NVarChar, estadoActual);
    requestTrans.input('tipoUsuarioId', sql.Int, tipoUsuarioId);
    const transQuery = `
      SELECT estadoPermitido
      FROM EstadoTransiciones
      WHERE modulo = @modulo 
        AND estadoActual = @estadoActual 
        AND tipoUsuarioId = @tipoUsuarioId
    `;
    const transResult = await requestTrans.query(transQuery);
    const allowedTransitions = transResult.recordset
      .map(r => r.estadoPermitido)
      .filter(ep => ep !== null);

    // Validar la transición: el nuevo estado deseado debe estar en la lista permitida
    if (!allowedTransitions.includes(nuevoEstado)) {
      return res.status(400).json({
        error: `Transición no permitida: desde el estado "${estadoActual}" el usuario (tipo ${tipoUsuarioId}) solo puede cambiar a: ${allowedTransitions.join(', ')}.`
      });
    }

    // Actualizar el estado en la tabla Desarchivos
    const updateRequest = pool.request();
    updateRequest.input('nuevoEstado', sql.NVarChar, nuevoEstado);
    updateRequest.input('desarchivoId', sql.Int, desarchivoId);
    updateRequest.input('clienteId', sql.Int, clienteId);
    const updateQuery = `
      UPDATE Desarchivos
      SET estado = @nuevoEstado
      WHERE id = @desarchivoId AND clienteId = @clienteId
    `;
    await updateRequest.query(updateQuery);

    return res.status(200).json({
      message: `El estado del desarchivo ${desarchivoId} se actualizó a "${nuevoEstado}".`
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getPdfFile,
  iniciarDesarchivar,
  confirmarDesarchivar,
  confirmarDesarchivarMasivo,
  consultarDetalleDesarchivo,
  listarDesarchivos,
  cancelarDesarchivar,
  actualizarEstadoDesarchivo
};
