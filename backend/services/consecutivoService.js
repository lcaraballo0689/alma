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
 * Incrementa en 1 el valor de ultimoEnvio para un cliente.
 * @param {import('mssql').Transaction} transaction
 * @param {number} clienteId
 */
async function incrementarUltimoDesarchive(transaction, clienteId) {
  const request = transaction.request();
  request.input('clienteId', sql.Int, clienteId);

  // Incrementa el valor de ultimoEnvio
  await request.query(`
    UPDATE dbo.Consecutivos
    SET ultimoEnvio = ultimoEnvio + 1
    WHERE clienteId = @clienteId
  `);

  // Consulta el registro actualizado
  const updatedResult = await request.query(`
    SELECT ultimoEnvio
    FROM dbo.Consecutivos
    WHERE clienteId = @clienteId
  `);

  // Retorna el registro actualizado
  if (updatedResult.recordset.length > 0) {
    return updatedResult.recordset[0]; // { ultimoEnvio: <nuevo valor> }
  } else {
    return null;
  }
}

/**
 * Incrementa en 1 el valor de ultimaDevolucion para un cliente.
 * @param {import('mssql').Transaction} transaction
 * @param {number} clienteId
 */
// services/consecutivoService.js
async function incrementarUltimaDevolucion(transaction, clienteId) {
  console.log("inicio de incrementarUltimaDevolucion:", { transaction, clienteId });

  const request = transaction.request();
  request.input("clienteId", sql.Int, clienteId);

  // Primero incrementas el valor
  await request.query(`
    UPDATE dbo.Consecutivos
    SET ultimaDevolucion = ultimaDevolucion + 1
    WHERE clienteId = @clienteId
  `);

  // Luego lo consultas
  const newResult = await request.query(`
    SELECT ultimaDevolucion
    FROM dbo.Consecutivos
    WHERE clienteId = @clienteId
  `);

  // Retornas el registro
  if (newResult.recordset.length > 0) {
    return newResult.recordset[0]; // { ultimaDevolucion: <nuevo valor> }
  } else {
    // Puedes retornar null o lanzar un error si no existe
    return null;
  }
}


module.exports = {
  getOrCreateConsecutivos,
  incrementarUltimoPrestamo,
  incrementarUltimaDevolucion,
  incrementarUltimoDesarchive
};
