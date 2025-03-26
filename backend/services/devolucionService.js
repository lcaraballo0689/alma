const { sql } = require('../config/db');
const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat');
dayjs.extend(customParseFormat);


const utc = require('dayjs/plugin/utc');
const tz = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(tz);

dayjs.tz.setDefault("America/Bogota");

const fechaBogota = dayjs().tz('America/Bogota');




/**
 * Crea la cabecera de una devolución.
 * @param {import('mssql').Transaction} transaction
 * @param {Object} data - Datos generales de la devolución
 * @returns {Promise<number>} - ID de la devolución (cabecera)
 */
async function createDevolucionCabecera(transaction, data) {
 
  console.log(`output->entro en createDevolucionCabecera `, )

  // Construimos la petición a SQL usando la transacción
  const request = transaction.request();
  request
    .input('entregadoPor', sql.Int, data.usuarioId)
    .input('consecutivo', sql.Int, data.consecutivo)

    .input('observaciones', sql.NVarChar, data.observaciones || '')
    .input('createdAt', sql.DateTime, new Date())
    .input('updatedAt', sql.DateTime, new Date());

  // Insert en la tabla "Devolucion"
  const result = await request.query(`
    INSERT INTO dbo.Devolucion
      (entregadoPor, consecutivo, observaciones, createdAt, updatedAt)
    VALUES
      (@entregadoPor, @consecutivo, @observaciones, @createdAt, @updatedAt);
    SELECT SCOPE_IDENTITY() as insertedId;
  `);
  			
  // Retornamos el ID generado
  return result.recordset[0].insertedId;
}

/**
 * Crea un detalle de la devolución.
 * @param {import('mssql').Transaction} transaction
 * @param {Object} data - Datos del detalle de la devolución
 */
async function createDevolucionDetalle(transaction, data) {
  console.log("HORA USANDO dayjs().tz('America/Bogota').toDate() ", dayjs.tz.setDefault("America/Bogota"));
  console.log(fechaBogota.format('YYYY-MM-DD HH:mm:ss'));
  const request = transaction.request();
  request
    .input('devolucionId', sql.Int, data.devolucionId)
    .input('clienteId', sql.Int, data.clienteId)
    .input('usuarioId', sql.Int, data.usuarioId)
    .input('custodiaId', sql.Int, data.custodiaId)
    .input('consecutivo', sql.Int, data.consecutivo)
    .input('fechaSolicitud', sql.DateTime, data.fechaSolicitud)
    .input('referencia1', sql.NVarChar, data.referencia1)
    .input('referencia2', sql.NVarChar, data.referencia2 || '')
    .input('referencia3', sql.NVarChar, data.referencia3 || '')
    .input('observaciones', sql.NVarChar, data.observaciones || '')
    .input('estado', sql.NVarChar, 'solicitud Creada')
    // Agrega estos si tu tabla exige createdAt y updatedAt
    .input('createdAt', sql.DateTime, new Date())
    .input('updatedAt', sql.DateTime, new Date());

  // Ajusta el INSERT según las columnas exactas de tu tabla Devoluciones
  await request.query(`
    INSERT INTO dbo.Devoluciones
      (devolucionId, clienteId, usuarioId, custodiaId, consecutivo, fechaSolicitud,
       referencia1, referencia2, referencia3, observaciones, estado,
       createdAt, updatedAt)
    VALUES
      (@devolucionId, @clienteId, @usuarioId, @custodiaId, @consecutivo, @fechaSolicitud,
       @referencia1, @referencia2, @referencia3, @observaciones, @estado,
       @createdAt, @updatedAt);
  `);
}




/**
 * Verifica y obtiene custodias ENTREGADAS por sus IDs.
 * @param {import('mssql').Transaction} transaction
 * @param {number[]} custodiaIds - IDs de custodia a buscar.
 * @returns {Promise<Object[]>} - Retorna un array de custodias disponibles.
 */
async function getCustodiasDisponibles(transaction, custodiaIds) {
  const idsStr = custodiaIds.join(',');
  const request = transaction.request();
  const result = await request.query(`
    SELECT * FROM dbo.Custodia
    WHERE id IN (${idsStr}) AND estado = 'ENTREGADO'
  `);
  return result.recordset;
}

/**
 * Actualiza la custodia a estado "SOLICITADO".
 * @param {import('mssql').Transaction} transaction
 * @param {number} custodiaId
 */
async function marcarCustodiaSolicitada(transaction, custodiaId) {
  const request = transaction.request();
  request.input('id', sql.Int, custodiaId);
  await request.query(`UPDATE dbo.Custodia SET estado = 'Solicitada' WHERE id = @id`);
}

/**
 * Obtiene una custodia por su referencia2 y que esté DISPONIBLE.
 * @param {import('mssql').Transaction} transaction
 * @param {string} referencia2
 * @returns {Promise<Object|null>}
 */
async function getCustodiaByReferencia2(transaction, referencia2) {
  const request = transaction.request();
  request.input('ref', sql.NVarChar, referencia2);
  const result = await request.query(`
    SELECT * FROM dbo.Custodia
    WHERE referencia2 = @ref AND estado = 'ENTREGADO'
  `);
  if (!result.recordset || result.recordset.length === 0) {
    return null;
  }
  return result.recordset[0];
}




module.exports = {
  createDevolucionCabecera,
  createDevolucionDetalle
};
