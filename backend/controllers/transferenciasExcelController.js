// controllers/transferenciasExcelController.js
const XLSX = require("xlsx");
const { connectDB, sql } = require("../config/db");
const logger = require("../logger");

/**
 * Genera y descarga una plantilla Excel para asignación masiva de ubicaciones
 * La plantilla incluye las columnas: referencia2, referencia3, codigo
 * Y está pre-poblada con los datos de los registros que necesitan asignación de ubicación
 */
async function descargarPlantillaUbicaciones(req, res) {
  try {
    const { solicitudId } = req.query;
    
    if (!solicitudId) {
      return res.status(400).json({ error: "El parámetro solicitudId es obligatorio." });
    }

    const pool = await connectDB();
    
    // Obtener los detalles de la solicitud que necesitan asignación de ubicación
    const result = await pool
      .request()
      .input("solicitudId", sql.Int, solicitudId)
      .query(`
        SELECT 
          d.id as detalleId,
          d.referencia2,
          d.referencia3
        FROM DetalleSolicitudTransporte d
        INNER JOIN SolicitudTransporte s ON d.solicitudId = s.id
        WHERE s.id = @solicitudId 
        AND s.estado = 'completado'
        AND d.estado = 'completado'
        ORDER BY d.id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ 
        error: "No se encontraron registros para asignar ubicaciones en esta solicitud." 
      });
    }

    // Crear la plantilla Excel con los datos
    const headers = ["referencia2", "referencia3", "codigo"];
    const data = [headers];
    
    // Agregar las filas con referencia2 y referencia3, dejando codigo vacío para llenar
    result.recordset.forEach(row => {
      data.push([
        row.referencia2 || "",
        row.referencia3 || "",
        "" // Campo codigo vacío para que el usuario lo llene
      ]);
    });

    // Crear el workbook y worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Asignacion_Ubicaciones");

    // Configurar el ancho de las columnas
    worksheet['!cols'] = [
      { width: 20 }, // referencia2
      { width: 20 }, // referencia3
      { width: 15 }  // codigo
    ];

    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
    const fileName = `plantilla_ubicaciones_solicitud_${solicitudId}.xlsx`;
    
    res.attachment(fileName);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    
    logger.info(`Plantilla de ubicaciones generada para solicitud ${solicitudId}`);
    return res.send(buffer);
    
  } catch (error) {
    logger.error("Error en descargarPlantillaUbicaciones", {
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json({ error: "Error interno del servidor." });
  }
}

/**
 * Procesa la carga masiva de ubicaciones desde un archivo Excel
 * Valida y crea ubicaciones si no existen, luego procesa las asignaciones
 */
async function cargarUbicacionesExcel(req, res) {
  logger.info("==> INICIO cargarUbicacionesExcel <==");
  
  if (!req.file) {
    logger.error("No se envió archivo Excel");
    return res.status(400).json({ error: "No se adjuntó ningún archivo." });
  }

  const { solicitudId, usuarioId } = req.body;
  
  if (!solicitudId || !usuarioId) {
    logger.error("Faltan parámetros obligatorios", { solicitudId, usuarioId });
    return res.status(400).json({ 
      error: "Se deben proporcionar solicitudId y usuarioId." 
    });
  }

  let transaction;
  try {
    // Leer el archivo Excel
    logger.debug("Leyendo archivo Excel desde buffer");
    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Validar encabezados
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    const headers = rows[0];
    const expectedHeaders = ["referencia2", "referencia3", "codigo"];
    
    logger.debug("Validando encabezados del Excel", { headers, expectedHeaders });
    
    if (!headers || headers.length < expectedHeaders.length) {
      logger.error("Encabezados insuficientes", { headers });
      return res.status(400).json({ 
        error: "El archivo Excel no tiene los encabezados correctos." 
      });
    }
    
    for (let i = 0; i < expectedHeaders.length; i++) {
      if (headers[i].trim().toLowerCase() !== expectedHeaders[i].toLowerCase()) {
        logger.error("Encabezado inválido", { 
          header: headers[i], 
          expected: expectedHeaders[i] 
        });
        return res.status(400).json({ 
          error: `Los encabezados del archivo Excel no coinciden. Se esperaba: ${expectedHeaders.join(', ')}` 
        });
      }
    }
    
    // Convertir filas a array de objetos
    const data = XLSX.utils.sheet_to_json(sheet);
    logger.info(`Se encontraron ${data.length} filas para procesar en el Excel.`);
    
    if (data.length === 0) {
      return res.status(400).json({ 
        error: "El archivo Excel no contiene datos para procesar." 
      });
    }

    // Conectar a la BD y comenzar transacción
    logger.debug("Conectando a la base de datos");
    const pool = await connectDB();
    transaction = new sql.Transaction(pool);
    await transaction.begin();
    logger.info("Transacción iniciada.");

    // Validar que la solicitud existe y está en estado correcto
    const solicitudResult = await transaction
      .request()
      .input("solicitudId", sql.Int, solicitudId)
      .query(`
        SELECT id, estado, clienteId 
        FROM SolicitudTransporte 
        WHERE id = @solicitudId
      `);
    
    if (solicitudResult.recordset.length === 0) {
      await transaction.rollback();
      return res.status(404).json({ error: "Solicitud no encontrada." });
    }
    
    const solicitud = solicitudResult.recordset[0];
    
    if (solicitud.estado.toLowerCase().trim() !== "completado") {
      await transaction.rollback();
      return res.status(400).json({
        error: "La solicitud no está en un estado adecuado para asignar ubicaciones."
      });
    }

    const asignacionesExitosas = [];
    const errores = [];
    
    // Procesar cada fila del Excel
    for (const [index, row] of data.entries()) {
      const filaNumero = index + 2; // +2 porque empezamos en fila 2 (después del header)
      logger.debug("Procesando fila", { fila: filaNumero, row });
      
      // Validar datos obligatorios
      if (!row.referencia2 || !row.codigo) {
        logger.warn("Fila incompleta", { fila: filaNumero, row });
        errores.push({
          fila: filaNumero,
          referencia2: row.referencia2 || "",
          referencia3: row.referencia3 || "",
          codigo: row.codigo || "",
          error: `La fila ${filaNumero} está incompleta (faltan referencia2 o código).`
        });
        continue;
      }
      
      try {
        // 1. Buscar el detalle de la solicitud por referencia2 y referencia3
        const detalleResult = await transaction
          .request()
          .input("solicitudId", sql.Int, solicitudId)
          .input("referencia2", sql.VarChar, row.referencia2)
          .input("referencia3", sql.VarChar, row.referencia3 || "")
          .query(`
            SELECT id, referencia1, referencia2, referencia3, estado, tipo
            FROM DetalleSolicitudTransporte
            WHERE solicitudId = @solicitudId 
            AND referencia2 = @referencia2
            AND (referencia3 = @referencia3 OR (@referencia3 = '' AND (referencia3 IS NULL OR referencia3 = '')))
            AND estado = 'completado'
          `);
        
        if (detalleResult.recordset.length === 0) {
          errores.push({
            fila: filaNumero,
            referencia2: row.referencia2,
            referencia3: row.referencia3 || "",
            codigo: row.codigo,
            error: `No se encontró un detalle válido para referencia2: '${row.referencia2}' y referencia3: '${row.referencia3 || ""}'.`
          });
          continue;
        }
        
        const detalle = detalleResult.recordset[0];
        
        // 2. Verificar si la ubicación existe por código
        let ubicacionId;
        const ubicacionExistente = await transaction
          .request()
          .input("codigo", sql.VarChar, row.codigo)
          .query(`
            SELECT id, ocupado, estado, bodega_id
            FROM Ubicacion 
            WHERE codigo = @codigo
          `);
        
        if (ubicacionExistente.recordset.length > 0) {
          // La ubicación existe, verificar si está disponible
          const ubicacion = ubicacionExistente.recordset[0];
          
          if (ubicacion.ocupado === 1 || ubicacion.estado.toUpperCase() !== "DISPONIBLE") {
            errores.push({
              fila: filaNumero,
              referencia2: row.referencia2,
              referencia3: row.referencia3 || "",
              codigo: row.codigo,
              error: `La ubicación con código '${row.codigo}' no está disponible (estado: ${ubicacion.estado}, ocupado: ${ubicacion.ocupado}).`
            });
            continue;
          }
          
          ubicacionId = ubicacion.id;
          logger.debug(`Ubicación existente encontrada: ${ubicacionId}`);
          
        } else {
          // La ubicación no existe, crearla
          logger.debug(`Creando nueva ubicación con código: ${row.codigo}`);
          
          const insertUbicacion = await transaction
            .request()
            .input("bodega_id", sql.Int, 2) // bodega_id = 2 según requerimientos
            .input("modulo", sql.Int, 1)
            .input("entrepano", sql.Int, 1)
            .input("cara", sql.Int, 1)
            .input("piso", sql.Int, 1)
            .input("coordenadaX", sql.Int, 1)
            .input("coordenadaY", sql.Int, 1)
            .input("coordenadaZ", sql.Int, 1)
            .input("ocupado", sql.Int, 0) // 0 = disponible
            .input("estado", sql.VarChar, "DISPONIBLE")
            .input("codigo", sql.VarChar, row.codigo)
            .query(`
              INSERT INTO Ubicacion (
                bodega_id, modulo, entrepano, cara, piso,
                coordenadaX, coordenadaY, coordenadaZ,
                ocupado, estado, codigo
              ) VALUES (
                @bodega_id, @modulo, @entrepano, @cara, @piso,
                @coordenadaX, @coordenadaY, @coordenadaZ,
                @ocupado, @estado, @codigo
              );
              SELECT SCOPE_IDENTITY() AS id;
            `);
          
          ubicacionId = insertUbicacion.recordset[0].id;
          logger.info(`Nueva ubicación creada con ID: ${ubicacionId}`);
        }
        
        // 3. Generar la nomenclatura usando el SP_GenerarReferencia1
        const spResult = await transaction
          .request()
          .input("modulo", sql.NVarChar, "transferencia")
          .input("ubicacionId", sql.Int, ubicacionId)
          .input("clienteId", sql.Int, solicitud.clienteId)
          .output("nuevaReferencia", sql.NVarChar(255))
          .query(
            "EXEC SP_GenerarReferencia1 @modulo, @ubicacionId, @clienteId, @nuevaReferencia OUTPUT"
          );
        
        const nuevaReferencia = spResult.output.nuevaReferencia;
        logger.debug(`Nueva referencia generada: ${nuevaReferencia}`);
        
        if (!nuevaReferencia) {
          errores.push({
            fila: filaNumero,
            referencia2: row.referencia2,
            referencia3: row.referencia3 || "",
            codigo: row.codigo,
            error: "No se pudo generar una nueva referencia."
          });
          continue;
        }
        
        // 4. Insertar un nuevo registro en Custodia
        const clienteId = solicitud.clienteId;
        const item = detalle.tipo || "CAJA";
        
        const insertCustodia = await transaction
          .request()
          .input("clienteId", sql.Int, clienteId)
          .input("bodegaId", sql.Int, 2) // bodega_id = 2
          .input("ubicacionId", sql.Int, ubicacionId)
          .input("item", sql.VarChar, item)
          .input("nuevaReferencia", sql.NVarChar, nuevaReferencia)
          .input("referencia2", sql.VarChar, detalle.referencia2)
          .input("referencia3", sql.VarChar, detalle.referencia3 || "")
          .query(`
            INSERT INTO Custodia (
              clienteId, bodega_id, ubicacionId, item, 
              referencia1, referencia2, referencia3, 
              estado, baja
            )
            VALUES (
              @clienteId, @bodegaId, @ubicacionId, @item, 
              @nuevaReferencia, @referencia2, @referencia3, 
              'DISPONIBLE', 0
            );
            SELECT SCOPE_IDENTITY() AS custodiaId;
          `);
        
        const custodiaId = insertCustodia.recordset[0].custodiaId;
        logger.debug(`Registro insertado en Custodia con ID: ${custodiaId}`);
        
        // 5. Actualizar la Ubicación a ocupado
        await transaction
          .request()
          .input("ubicacionId", sql.Int, ubicacionId)
          .query(`
            UPDATE Ubicacion 
            SET ocupado = 1, estado = 'OCUPADO' 
            WHERE id = @ubicacionId
          `);
        
        // 6. Actualizar el detalle a 'ASIGNADO'
        await transaction
          .request()
          .input("detalleId", sql.Int, detalle.id)
          .query(`
            UPDATE DetalleSolicitudTransporte 
            SET estado = 'ASIGNADO' 
            WHERE id = @detalleId
          `);
        
        asignacionesExitosas.push({
          fila: filaNumero,
          detalleId: detalle.id,
          ubicacionId: ubicacionId,
          custodiaId: custodiaId,
          codigo: row.codigo,
          referencia1: nuevaReferencia,
          referencia2: row.referencia2,
          referencia3: row.referencia3 || "",
          mensaje: `Ubicación ${row.codigo} asignada correctamente con referencia ${nuevaReferencia}`
        });
        
        logger.debug(`Asignación exitosa para fila ${filaNumero}`);
        
      } catch (filaError) {
        logger.error(`Error procesando fila ${filaNumero}`, {
          error: filaError.message,
          fila: filaNumero,
          row
        });
        
        errores.push({
          fila: filaNumero,
          referencia2: row.referencia2,
          referencia3: row.referencia3 || "",
          codigo: row.codigo,
          error: `Error procesando la fila: ${filaError.message}`
        });
      }
    }
    
    // Si no hay asignaciones exitosas, hacer rollback
    if (asignacionesExitosas.length === 0) {
      logger.error("No se procesaron asignaciones exitosas", { errores });
      await transaction.rollback();
      
      // Generar Excel con errores si es posible
      const excelErrores = await generarExcelErrores(errores);
      
      return res.status(400).json({
        error: "No se pudo procesar ninguna asignación. Se encontraron errores en todas las filas.",
        errores: errores,
        archivoErrores: excelErrores ? {
          nombre: `errores_ubicaciones_solicitud_${solicitudId}.xlsx`,
          contenido: excelErrores
        } : null
      });
    }
    
    // Confirmar la transacción
    await transaction.commit();
    logger.info("Transacción confirmada exitosamente.");
    
    // Preparar respuesta
    const respuesta = {
      message: "Carga masiva de ubicaciones realizada exitosamente.",
      resumen: {
        totalProcesadas: data.length,
        exitosas: asignacionesExitosas.length,
        errores: errores.length
      },
      asignaciones: asignacionesExitosas
    };
    
    // Si hay errores, incluir el archivo de errores
    if (errores.length > 0) {
      const excelErrores = await generarExcelErrores(errores);
      if (excelErrores) {
        respuesta.archivoErrores = {
          nombre: `errores_ubicaciones_solicitud_${solicitudId}.xlsx`,
          contenido: excelErrores
        };
      }
      respuesta.errores = errores;
    }
    
    logger.info("==> FIN cargarUbicacionesExcel <==");
    return res.status(201).json(respuesta);
    
  } catch (error) {
    logger.error("Error en cargarUbicacionesExcel", {
      error: error.message,
      stack: error.stack
    });
    
    try {
      if (transaction) {
        await transaction.rollback();
        logger.info("Transacción revertida.");
      }
    } catch (rollbackError) {
      logger.error("Error al hacer rollback", { 
        rollbackError: rollbackError.message 
      });
    }
    
    return res.status(500).json({ error: "Error interno del servidor." });
  }
}

/**
 * Genera un archivo Excel con los errores encontrados durante el procesamiento
 */
async function generarExcelErrores(errores) {
  try {
    if (!errores || errores.length === 0) {
      return null;
    }
    
    const headers = ["Fila", "Referencia2", "Referencia3", "Código", "Error"];
    const data = [headers];
    
    errores.forEach(error => {
      data.push([
        error.fila,
        error.referencia2,
        error.referencia3,
        error.codigo,
        error.error
      ]);
    });
    
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Errores");
    
    // Configurar el ancho de las columnas
    worksheet['!cols'] = [
      { width: 8 },  // Fila
      { width: 20 }, // Referencia2
      { width: 20 }, // Referencia3
      { width: 15 }, // Código
      { width: 50 }  // Error
    ];
    
    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
    return buffer.toString('base64');
    
  } catch (error) {
    logger.error("Error generando Excel de errores", {
      error: error.message
    });
    return null;
  }
}

/**
 * Genera y descarga una plantilla Excel para asignación masiva de ubicaciones en transferencias
 */
async function descargarPlantillaTransferencias(req, res) {
  try {
    const { transferenciaId } = req.params;
    
    if (!transferenciaId) {
      return res.status(400).json({ error: "El parámetro transferenciaId es obligatorio." });
    }

    const pool = await connectDB();
    
    // Obtener los detalles de la transferencia que necesitan asignación de ubicación
    const result = await pool
      .request()
      .input("transferenciaId", sql.Int, transferenciaId)
      .query(`
        SELECT 
          d.id as detalleId,
          d.referencia2,
          d.referencia3
        FROM DetalleSolicitudTransporte d
        INNER JOIN SolicitudTransporte s ON d.solicitudTransporteId = s.id
        WHERE s.id = @transferenciaId 
        AND s.estado = 'completado'
        ORDER BY d.id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ 
        error: "No se encontraron registros para asignar ubicaciones en esta transferencia." 
      });
    }

    // Crear la plantilla Excel con los datos
    const headers = ["referencia2", "referencia3", "codigo"];
    const data = [headers];
    
    // Agregar las filas con referencia2 y referencia3, dejando codigo vacío para llenar
    result.recordset.forEach(row => {
      data.push([
        row.referencia2 || "",
        row.referencia3 || "",
        "" // Campo codigo vacío para que el usuario lo llene
      ]);
    });

    // Crear el workbook y worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Asignacion_Ubicaciones");

    // Configurar el ancho de las columnas
    worksheet['!cols'] = [
      { width: 20 }, // referencia2
      { width: 20 }, // referencia3
      { width: 15 }  // codigo
    ];

    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
    const fileName = `plantilla_ubicaciones_transferencia_${transferenciaId}.xlsx`;
    
    res.attachment(fileName);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    
    logger.info(`Plantilla de ubicaciones generada para transferencia ${transferenciaId}`);
    return res.send(buffer);
    
  } catch (error) {
    logger.error("Error en descargarPlantillaTransferencias", {
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json({ error: "Error interno del servidor." });
  }
}

/**
 * Procesa asignaciones masivas de ubicaciones para transferencias desde Excel
 */
async function procesarAsignacionesTransferencias(req, res) {
  let transaction;
  
  try {
    logger.info('📊 Iniciando procesamiento de asignaciones masivas desde Excel');
    
    const { transferenciaId, asignaciones } = req.body;
    
    if (!transferenciaId || !asignaciones || !Array.isArray(asignaciones)) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos. Se requiere transferenciaId y array de asignaciones.'
      });
    }
    
    const pool = await connectDB();
    transaction = new sql.Transaction(pool);
    await transaction.begin();
    
    const resultados = {
      exitosas: [],
      errores: [],
      ubicacionesCreadas: [],
      totalProcesadas: asignaciones.length
    };
    
    for (const asignacion of asignaciones) {
      try {
        const { ubicacionId, detalleId, codigo, esNueva } = asignacion;
        
        let ubicacionFinalId = ubicacionId;
        
        // Obtener el detalle de la solicitud
        const detalleQuery = `
          SELECT d.*, s.clienteId 
          FROM DetalleSolicitudTransporte d
          INNER JOIN SolicitudTransporte s ON d.solicitudTransporteId = s.id
          WHERE d.id = @detalleId
        `;
        
        const detalleRequest = new sql.Request(transaction);
        detalleRequest.input('detalleId', sql.Int, detalleId);
        const detalleResult = await detalleRequest.query(detalleQuery);
        
        if (detalleResult.recordset.length === 0) {
          throw new Error(`No se encontró el detalle con ID ${detalleId}`);
        }
        
        const detalle = detalleResult.recordset[0];
        
        // Si es una ubicación nueva, crearla primero
        if (esNueva) {
          logger.info(`🆕 Creando nueva ubicación: ${codigo}`);
          
          const createUbicacionQuery = `
            INSERT INTO Ubicacion (codigo, estado, ocupado, bodega_id, createdAt, updatedAt)
            OUTPUT INSERTED.id
            VALUES (@codigo, 'DISPONIBLE', 0, 2, GETDATE(), GETDATE())
          `;
          
          const createRequest = new sql.Request(transaction);
          createRequest.input('codigo', sql.VarChar(50), codigo);
          
          const createResult = await createRequest.query(createUbicacionQuery);
          ubicacionFinalId = createResult.recordset[0].id;
          
          resultados.ubicacionesCreadas.push({
            id: ubicacionFinalId,
            codigo: codigo
          });
          
          logger.info(`✅ Ubicación creada: ${codigo} con ID ${ubicacionFinalId}`);
        }
        
        // Verificar que la ubicación esté disponible
        const ubicacionQuery = `
          SELECT * FROM Ubicacion WHERE id = @ubicacionId
        `;
        
        const ubicacionRequest = new sql.Request(transaction);
        ubicacionRequest.input('ubicacionId', sql.Int, ubicacionFinalId);
        const ubicacionResult = await ubicacionRequest.query(ubicacionQuery);
        
        if (ubicacionResult.recordset.length === 0) {
          throw new Error(`Ubicación con ID ${ubicacionFinalId} no encontrada`);
        }
        
        const ubicacion = ubicacionResult.recordset[0];
        
        if (ubicacion.ocupado === true || ubicacion.estado.toUpperCase() !== 'DISPONIBLE') {
          throw new Error(`Ubicación ${codigo} no está disponible`);
        }
        
        // Generar la nomenclatura usando el SP_GenerarReferencia1
        const spResult = await transaction
          .request()
          .input('modulo', sql.NVarChar, 'transferencia')
          .input('ubicacionId', sql.Int, ubicacionFinalId)
          .input('clienteId', sql.Int, detalle.clienteId)
          .output('nuevaReferencia', sql.NVarChar(255))
          .query('EXEC SP_GenerarReferencia1 @modulo, @ubicacionId, @clienteId, @nuevaReferencia OUTPUT');
        
        const nuevaReferencia = spResult.output.nuevaReferencia;
        
        if (!nuevaReferencia) {
          throw new Error('No se pudo generar una nueva referencia');
        }
        
        // Insertar un nuevo registro en Custodia
        const insertCustodiaQuery = `
          INSERT INTO Custodia (clienteId, bodega_id, ubicacionId, item, referencia1, referencia2, referencia3, estado, baja, createdAt, updatedAt)
          OUTPUT INSERTED.id
          VALUES (@clienteId, @bodegaId, @ubicacionId, @item, @referencia1, @referencia2, @referencia3, 'DISPONIBLE', 0, GETDATE(), GETDATE())
        `;
        
        const custodiaRequest = new sql.Request(transaction);
        custodiaRequest.input('clienteId', sql.Int, detalle.clienteId);
        custodiaRequest.input('bodegaId', sql.Int, ubicacion.bodega_id);
        custodiaRequest.input('ubicacionId', sql.Int, ubicacionFinalId);
        custodiaRequest.input('item', sql.VarChar, detalle.tipo || 'CAJA');
        custodiaRequest.input('referencia1', sql.NVarChar, nuevaReferencia);
        custodiaRequest.input('referencia2', sql.VarChar, detalle.referencia2);
        custodiaRequest.input('referencia3', sql.VarChar, detalle.referencia3);
        
        const custodiaResult = await custodiaRequest.query(insertCustodiaQuery);
        const custodiaId = custodiaResult.recordset[0].id;
        
        // Actualizar la Ubicación a ocupado
        const updateUbicacionQuery = `
          UPDATE Ubicacion 
          SET ocupado = 1, estado = 'OCUPADO' 
          WHERE id = @ubicacionId
        `;
        
        const updateUbicacionRequest = new sql.Request(transaction);
        updateUbicacionRequest.input('ubicacionId', sql.Int, ubicacionFinalId);
        await updateUbicacionRequest.query(updateUbicacionQuery);
        
        // Actualizar el detalle a 'ASIGNADO'
        const updateDetalleQuery = `
          UPDATE DetalleSolicitudTransporte 
          SET estado = 'ASIGNADO' 
          WHERE id = @detalleId
        `;
        
        const updateDetalleRequest = new sql.Request(transaction);
        updateDetalleRequest.input('detalleId', sql.Int, detalleId);
        await updateDetalleRequest.query(updateDetalleQuery);
        
        resultados.exitosas.push({
          detalleId: detalleId,
          ubicacionId: ubicacionFinalId,
          custodiaId: custodiaId,
          codigo: codigo,
          referencia1: nuevaReferencia,
          esNueva: esNueva,
          mensaje: `Ubicación ${codigo} asignada correctamente con referencia ${nuevaReferencia}`
        });
        
        logger.info(`✅ Asignación exitosa: detalle ${detalleId} -> ubicación ${codigo} (${ubicacionFinalId})`);
        
      } catch (error) {
        logger.error(`❌ Error procesando asignación:`, error);
        resultados.errores.push({
          asignacion: asignacion,
          error: error.message
        });
      }
    }
    
    // Si hay asignaciones exitosas, actualizar el estado de la transferencia
    if (resultados.exitosas.length > 0) {
      logger.info('🔄 Actualizando estado de transferencia a "completado"');
      
      const updateTransferenciaQuery = `
        UPDATE SolicitudTransporte 
        SET estado = 'completado', updatedAt = GETDATE()
        WHERE id = @transferenciaId
      `;
      
      const updateTransRequest = new sql.Request(transaction);
      updateTransRequest.input('transferenciaId', sql.Int, transferenciaId);
      
      await updateTransRequest.query(updateTransferenciaQuery);
      
      // Registrar en el timeline de observaciones
      const observacionTexto = `Asignación masiva de ubicaciones completada. ${resultados.exitosas.length} asignaciones exitosas${resultados.ubicacionesCreadas.length > 0 ? `, ${resultados.ubicacionesCreadas.length} ubicaciones creadas` : ''}.`;
      
      const insertObservacionQuery = `
        UPDATE SolicitudTransporte 
        SET observacionesUsuario = JSON_MODIFY(
          ISNULL(observacionesUsuario, '[]'),
          'append $',
          JSON_OBJECT(
            'fecha', FORMAT(GETDATE(), 'yyyy-MM-ddTHH:mm:ss'),
            'usuario', @usuarioId,
            'estadoAnterior', 'en transito',
            'estadoNuevo', 'completado',
            'observacion', @observacion
          )
        )
        WHERE id = @transferenciaId
      `;
      
      const obsRequest = new sql.Request(transaction);
      obsRequest.input('transferenciaId', sql.Int, transferenciaId);
      obsRequest.input('usuarioId', sql.Int, req.user?.id || 1); // Usuario del token o sistema
      obsRequest.input('observacion', sql.Text, observacionTexto);
      
      await obsRequest.query(insertObservacionQuery);
    }
    
    await transaction.commit();
    
    logger.info('✅ Procesamiento de asignaciones masivas completado:', {
      exitosas: resultados.exitosas.length,
      errores: resultados.errores.length,
      ubicacionesCreadas: resultados.ubicacionesCreadas.length
    });
    
    res.json({
      success: true,
      message: 'Asignaciones procesadas exitosamente',
      data: resultados
    });
    
  } catch (error) {
    logger.error('❌ Error en procesarAsignacionesTransferencias:', error);
    
    if (transaction && transaction._aborted === false) {
      await transaction.rollback();
    }
    
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al procesar asignaciones',
      error: error.message
    });
  }
}

/**
 * Valida códigos de ubicación del Excel y retorna IDs para el payload de scanQR
 * Endpoint simple que solo valida y crea ubicaciones si no existen
 */
async function validarCodigosUbicacion(req, res) {
  logger.info("==> INICIO validarCodigosUbicacion <==");
  
  try {
    const { codigos } = req.body;
    
    if (!codigos || !Array.isArray(codigos) || codigos.length === 0) {
      return res.status(400).json({ 
        error: "Se debe proporcionar un array de códigos de ubicación." 
      });
    }

    const pool = await connectDB();
    const resultados = [];
    
    for (const codigo of codigos) {
      if (!codigo || typeof codigo !== 'string') {
        resultados.push({
          codigo: codigo,
          existe: false,
          disponible: false,
          ubicacionId: null,
          error: "Código inválido"
        });
        continue;
      }
      
      // Verificar si la ubicación existe
      const ubicacionExistente = await pool
        .request()
        .input("codigo", sql.VarChar, codigo)
        .query(`
          SELECT id, ocupado, estado, bodega_id
          FROM Ubicacion 
          WHERE codigo = @codigo
        `);
      
      if (ubicacionExistente.recordset.length > 0) {
        // La ubicación existe
        const ubicacion = ubicacionExistente.recordset[0];
        const disponible = ubicacion.ocupado === 0 && ubicacion.estado.toUpperCase() === "DISPONIBLE";
        
        resultados.push({
          codigo: codigo,
          existe: true,
          disponible: disponible,
          ubicacionId: ubicacion.id,
          estado: ubicacion.estado,
          ocupado: ubicacion.ocupado
        });
        
      } else {
        // La ubicación no existe, crearla
        try {
          const insertUbicacion = await pool
            .request()
            .input("bodega_id", sql.Int, 2) // bodega_id = 2 según requerimientos
            .input("modulo", sql.Int, 1)
            .input("entrepano", sql.Int, 1)
            .input("cara", sql.Int, 1)
            .input("piso", sql.Int, 1)
            .input("coordenadaX", sql.Int, 1)
            .input("coordenadaY", sql.Int, 1)
            .input("coordenadaZ", sql.Int, 1)
            .input("ocupado", sql.Int, 1) // 0 = disponible
            .input("estado", sql.VarChar, "OCUPADO")
            .input("codigo", sql.VarChar, codigo)
            .query(`
              INSERT INTO Ubicacion (
                bodega_id, modulo, entrepano, cara, piso,
                coordenadaX, coordenadaY, coordenadaZ,
                ocupado, estado, codigo
              ) VALUES (
                @bodega_id, @modulo, @entrepano, @cara, @piso,
                @coordenadaX, @coordenadaY, @coordenadaZ,
                @ocupado, @estado, @codigo
              );
              SELECT SCOPE_IDENTITY() AS id;
            `);
          
          const nuevaUbicacionId = insertUbicacion.recordset[0].id;
          
          resultados.push({
            codigo: codigo,
            existe: false,
            disponible: true,
            ubicacionId: nuevaUbicacionId,
            creada: true,
            estado: "DISPONIBLE",
            ocupado: 0
          });
          
          logger.info(`Nueva ubicación creada: ${codigo} con ID: ${nuevaUbicacionId}`);
          
        } catch (createError) {
          logger.error(`Error creando ubicación ${codigo}`, { error: createError.message });
          resultados.push({
            codigo: codigo,
            existe: false,
            disponible: false,
            ubicacionId: null,
            error: `Error al crear ubicación: ${createError.message}`
          });
        }
      }
    }
    
    logger.info(`Validación completada para ${codigos.length} códigos`);
    
    return res.status(200).json({
      success: true,
      message: "Validación de códigos completada",
      resultados: resultados
    });
    
  } catch (error) {
    logger.error("Error en validarCodigosUbicacion", {
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json({ error: "Error interno del servidor." });
  }
}

module.exports = {
  descargarPlantillaUbicaciones,
  cargarUbicacionesExcel,
  descargarPlantillaTransferencias,
  procesarAsignacionesTransferencias,
  validarCodigosUbicacion
};