// services/prestamoService.js
const { sql } = require('../config/db');
const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat');
dayjs.extend(customParseFormat);
dayjs.locale('es'); // Configuramos el locale en español

// Suponiendo que ya tienes un logger global configurado
const logger = require('../logger');

/**
 * Intenta parsear la fecha usando varios formatos.
 * @param {string|Date|number} value
 * @returns {Date}
 * @throws {Error} Si no se puede parsear la fecha
 */
function parseDate(value) {
  if (!value) {
    logger.debug("parseDate - Valor no proporcionado, se usará la fecha actual");
    return new Date(); // O lanzar un error si es necesario
  }
  if (value instanceof Date) {
    logger.debug("parseDate - Valor ya es una fecha", { value });
    return value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    logger.debug("parseDate - Intentando parsear cadena", { trimmed });

    // Si es formato ISO, intentamos primero
    if (trimmed.includes('T')) {
      const isoDate = new Date(trimmed);
      if (!isNaN(isoDate.getTime())) {
        logger.debug("parseDate - Formato ISO reconocido", { isoDate });
        return isoDate;
      }
    }
    // Definir los formatos a intentar
    const formats = [
      'MMM D YYYY h:mmA',  // Ejemplo: "Abr 1 2025 4:00PM"
      'DD:MM:YYYY HH:mm',  // Ejemplo: "01:04:2025 04:00"
    ];
    for (const fmt of formats) {
      const parsed = dayjs(trimmed, fmt, 'es', true);
      logger.debug("parseDate - Probando formato", { formato: fmt, isValid: parsed.isValid() });
      if (parsed.isValid()) {
        logger.info("parseDate - Fecha parseada exitosamente", { formato: fmt, fecha: parsed.toDate() });
        return parsed.toDate();
      }
    }
  }
  const errorMsg = `Invalid date: ${value}`;
  logger.error("parseDate - Error al parsear la fecha", { value, errorMsg });
  throw new Error(errorMsg);
}

/**
 * Crea la cabecera de un préstamo.
 * @param {import('mssql').Transaction} transaction
 * @param {Object} data - Datos generales del préstamo
 * @returns {Promise<number>} - ID del préstamo (cabecera)
 */
async function createPrestamoCabecera(transaction, data) {
  let fechaEstimadaEntrega;
  logger.warn("createPrestamoCabecera - Datos recibidos:\n" + JSON.stringify(data, null, 2));
  try {
    fechaEstimadaEntrega = parseDate(data.fechaEstimadaEntrega);
    logger.info("createPrestamoCabecera - Fecha estimada parseada", { fechaEstimadaEntrega });
  } catch (err) {
    logger.error("createPrestamoCabecera - Fecha estimada inválida", { fecha: data.fechaEstimadaEntrega, error: err.message });
    throw err;
  }

  const request = transaction.request();
  request
    .input('usuarioId', sql.Int, data.usuarioId)
    .input('consecutivo', sql.Int, data.consecutivo)
    .input('fechaPrestamo', sql.DateTime, data.fechaSolicitud)
    .input('fechaEstimadaEntrega', sql.DateTime, fechaEstimadaEntrega)
    .input('entregadoPor', sql.NVarChar, data.entregadoPor || '')
    .input('observaciones', sql.NVarChar, data.observaciones || '')
    .input('createdAt', sql.DateTime, new Date())
    .input('updatedAt', sql.DateTime, new Date())
    .input('prioridad', sql.NVarChar, data.urgencia || ''); // Asumiendo que prioridad es un campo opcional

  logger.info("createPrestamoCabecera - Ejecutando query de inserción", { data });
  const result = await request.query(`
    INSERT INTO dbo.Prestamo
      (usuarioId, consecutivo, fechaPrestamo, fechaEstimadaEntrega, entregadoPor, observaciones, createdAt, updatedAt)
    VALUES
      (@usuarioId, @consecutivo, @fechaPrestamo, @fechaEstimadaEntrega, @entregadoPor, @observaciones, @createdAt, @updatedAt);
    SELECT SCOPE_IDENTITY() as insertedId;
  `);

  const insertedId = result.recordset[0].insertedId;
  logger.info("createPrestamoCabecera - Préstamo creado exitosamente", { insertedId });
  return insertedId;
}

/**
 * Crea un detalle del préstamo y retorna el ID insertado.
 * Se utiliza SCOPE_IDENTITY() para obtener el valor generado.
 * Nota: Asegúrate de que la tabla de detalles sea la correcta. En este ejemplo se usa "dbo.Prestamos"
 * pero si la estructura de tu BD separa cabecera y detalle (por ejemplo, "DetallePrestamo") deberás ajustarlo.
 * @param {import('mssql').Transaction} transaction
 * @param {Object} data - Datos del detalle del préstamo.
 * @returns {Promise<number>} El ID insertado.
 */
async function createPrestamoDetalle(transaction, data) {
  logger.debug("createPrestamoDetalle - Datos recibidos", { data });
  // Parsear la fecha estimada de entrega (asegúrate de que data.fechaEstimadaEntrega tenga un formato válido)
  const fechaEstimadaEntrega = parseDate(data.fechaEstimadaEntrega);
  logger.info("createPrestamoDetalle - Fecha estimada parseada", { fechaEstimadaEntrega });

  const request = transaction.request();
  request
    .input("prestamoId", sql.Int, data.prestamoId)
    .input("clienteId", sql.Int, data.clienteId)
    .input("usuarioId", sql.Int, data.usuarioId)
    .input("custodiaId", sql.Int, data.custodiaId)
    .input("consecutivo", sql.Int, data.consecutivo)
    .input("fechaSolicitud", sql.DateTime, data.fechaSolicitud)
    .input("referencia1", sql.NVarChar, data.referencia1 || "")
    .input("referencia2", sql.NVarChar, data.referencia2 || "")
    .input("referencia3", sql.NVarChar, data.referencia3 || "")
    .input("direccion_entrega", sql.NVarChar, data.direccion_entrega)
    .input("modalidad", sql.NVarChar, data.modalidad)
    .input("observaciones", sql.NVarChar, data.observaciones || "")
    .input("estado", sql.NVarChar, "SOLICITUD DE PRESTAMO CREADA")
    .input("fechaEstimadaEntrega", sql.DateTime, fechaEstimadaEntrega);

  logger.info("createPrestamoDetalle - Ejecutando query de inserción");
  const result = await request.query(`
    INSERT INTO dbo.Prestamos
      (prestamoId, clienteId, usuarioId, custodiaId, consecutivo, fechaSolicitud, 
       referencia1, referencia2, referencia3, direccion_entrega, modalidad, 
       observaciones, estado, fechaEstimada)
    VALUES
      (@prestamoId, @clienteId, @usuarioId, @custodiaId, @consecutivo, @fechaSolicitud,
       @referencia1, @referencia2, @referencia3, @direccion_entrega, @modalidad,
       @observaciones, @estado, @fechaEstimadaEntrega);
    SELECT SCOPE_IDENTITY() as insertedId;
  `);

  const insertedId = result.recordset[0]?.insertedId;
  if (!insertedId) {
    logger.error("createPrestamoDetalle - No se obtuvo el ID insertado.", { result });
  }
  return insertedId;
}

module.exports = {
  createPrestamoCabecera,
  createPrestamoDetalle
};
