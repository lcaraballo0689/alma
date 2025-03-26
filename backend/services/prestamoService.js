// services/prestamoService.js
const { sql } = require('../config/db');
const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat');
dayjs.extend(customParseFormat);

/**
 * Crea la cabecera de un préstamo.
 * @param {import('mssql').Transaction} transaction
 * @param {Object} data - Datos generales del préstamo
 * @returns {Promise<number>} - ID del préstamo (cabecera)
 */
async function createPrestamoCabecera(transaction, data) {
  let fechaEstimadaEntrega = new Date(data.fechaEstimadaEntrega);
  if (typeof data.fechaEstimadaEntrega === 'string') {
    fechaEstimadaEntrega = dayjs(data.fechaEstimadaEntrega, 'MMM D YYYY  h:mmA').toDate();
  }

  if (isNaN(fechaEstimadaEntrega)) {
    throw new Error(`Fecha estimada inválida: ${data.fechaEstimadaEntrega}`);
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
    .input('updatedAt', sql.DateTime, new Date());

  const result = await request.query(`
    INSERT INTO dbo.Prestamo
      (usuarioId, consecutivo, fechaPrestamo, fechaEstimadaEntrega, entregadoPor, observaciones, createdAt, updatedAt)
    VALUES
      (@usuarioId, @consecutivo, @fechaPrestamo, @fechaEstimadaEntrega, @entregadoPor, @observaciones, @createdAt, @updatedAt);
    SELECT SCOPE_IDENTITY() as insertedId;
  `);

  return result.recordset[0].insertedId;
}



function parseDate(value) {
  if (!value) {
    // Si no se proporciona, puedes decidir usar la fecha actual o lanzar error.
    return new Date(); // o throw new Error("Fecha no proporcionada");
  }
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    // Si parece ser un string en formato ISO:
    if (trimmed.includes('T')) {
      const isoDate = new Date(trimmed);
      if (!isNaN(isoDate.getTime())) {
        return isoDate;
      }
    }
    // Normaliza espacios y usa el formato esperado (ajusta el formato si es necesario)
    const normalized = trimmed.replace(/\s+/g, ' ');
    const parsed = dayjs(normalized, 'MMM D YYYY h:mmA');
    if (parsed.isValid()) {
      return parsed.toDate();
    }
  }
  throw new Error(`Invalid date: ${value}`);
}

/**
 * Crea un detalle del préstamo por custodia.
 * @param {import('mssql').Transaction} transaction
 * @param {Object} data - Datos del detalle del préstamo
 */
async function createPrestamoDetalle(transaction, data) {
  console.log(" function createPrestamoDetalle", data);
  const fechaEstimadaEntrega = parseDate(data.fechaEstimadaEntrega);

  const request = transaction.request();
  request
    .input('prestamoId', sql.Int, data.prestamoId)
    .input('clienteId', sql.Int, data.clienteId)
    .input('usuarioId', sql.Int, data.usuarioId)
    .input('custodiaId', sql.Int, data.custodiaId)
    .input('consecutivo', sql.Int, data.consecutivo)
    .input('fechaSolicitud', sql.DateTime, data.fechaSolicitud)
    .input('referencia1', sql.NVarChar, data.referencia1 || '')
    .input('referencia2', sql.NVarChar, data.referencia2 || '')
    .input('referencia3', sql.NVarChar, data.referencia3 || '')
    .input('direccion_entrega', sql.NVarChar, data.direccion_entrega)
    .input('modalidad', sql.NVarChar, data.modalidad)
    .input('observaciones', sql.NVarChar, data.observaciones || '')
    .input('estado', sql.NVarChar, 'SOLICITUD DE PRESTAMO CREADA')
    .input('fechaEstimadaEntrega', sql.DateTime, fechaEstimadaEntrega || new Date() );

  await request.query(`
    INSERT INTO dbo.Prestamos
      (prestamoId, clienteId, usuarioId, custodiaId, consecutivo, fechaSolicitud, 
       referencia1, referencia2, referencia3, direccion_entrega, modalidad, 
       observaciones, estado, fechaEstimada)
    VALUES
      (@prestamoId, @clienteId, @usuarioId, @custodiaId, @consecutivo, @fechaSolicitud,
       @referencia1, @referencia2, @referencia3, @direccion_entrega, @modalidad,
       @observaciones, @estado, @fechaEstimadaEntrega);
  `);
}

module.exports = {
  createPrestamoCabecera,
  createPrestamoDetalle
};