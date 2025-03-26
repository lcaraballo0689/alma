// services/consecutivoService.js
const { sql } = require('../config/db');

/**
 * Obtiene o crea el registro de consecutivos para un cliente.
 * @param {import('mssql').Transaction} transaction
 * @param {number} clienteId
 * @returns {Promise<Object>} - Retorna el registro de consecutivos.
 */
async function getOrCreateConsecutivos(transaction, clienteId) {
  const request = transaction.request();
  request.input('clienteId', sql.Int, clienteId);

  let consResult = await request.query('SELECT * FROM dbo.Consecutivos WHERE clienteId = @clienteId');
  if (!consResult.recordset || consResult.recordset.length === 0) {
    // Crear el registro
    await request.query(`
      INSERT INTO dbo.Consecutivos (clienteId, ultimoPrestamo)
      VALUES (@clienteId, 0)
    `);
    // Volver a consultar
    consResult = await request.query('SELECT * FROM dbo.Consecutivos WHERE clienteId = @clienteId');
  }
  return consResult.recordset[0];
}

/**
 * Incrementa en 1 el valor de ultimoPrestamo para un cliente.
 * @param {import('mssql').Transaction} transaction
 * @param {number} clienteId
 */
async function incrementarUltimoPrestamo(transaction, clienteId) {
  const request = transaction.request();
  request.input('clienteId', sql.Int, clienteId);
  await request.query(`
    UPDATE dbo.Consecutivos
    SET ultimoPrestamo = ultimoPrestamo + 1
    WHERE clienteId = @clienteId
  `);
}

/**
 * Incrementa en 1 el valor de ultimaDevolucion para un cliente.
 * @param {import('mssql').Transaction} transaction
 * @param {number} clienteId
 */
async function incrementarUltimaDevolucion(transaction, clienteId) {
  const request = transaction.request();
  request.input('clienteId', sql.Int, clienteId);
  await request.query(`
    UPDATE dbo.Consecutivos
    SET ultimaDevolucion = ultimaDevolucion + 1
    WHERE clienteId = @clienteId
  `);
}
module.exports = {
  getOrCreateConsecutivos,
  incrementarUltimoPrestamo,
  incrementarUltimaDevolucion
};
