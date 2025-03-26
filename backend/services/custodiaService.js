// services/custodiaService.js
const { sql } = require('../config/db');

/**
 * Verifica y obtiene custodias disponibles por sus IDs.
 * @param {import('mssql').Transaction} transaction
 * @param {number[]} custodiaIds - IDs de custodia a buscar.
 * @returns {Promise<Object[]>} - Retorna un array de custodias disponibles.
 */
async function getCustodiasDisponibles(transaction, custodiaIds) {
  const idsStr = custodiaIds.join(',');
  const request = transaction.request();
  const result = await request.query(`
    SELECT * FROM dbo.Custodia
    WHERE id IN (${idsStr}) AND estado = 'DISPONIBLE'
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
console.log("referencia2referencia2referencia2", referencia2);

  const request = transaction.request();
  request.input('referencia2', sql.NVarChar, String(referencia2 || ''));
  const result = await request.query(`
    SELECT * FROM dbo.Custodia
    WHERE referencia1 = @referencia2 AND estado = 'DISPONIBLE'
  `);
  if (!result.recordset || result.recordset.length === 0) {
    return null;
  }
  return result.recordset[0];
}



async function getCustodiasPrestadas(transaction, custodiaIds) {
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
async function marcarCustodiaEnDevolucion(transaction, custodiaId) {
  const request = transaction.request();
  request.input('id', sql.Int, custodiaId);
  await request.query(`UPDATE dbo.Custodia SET estado = 'Devolucion En Proceso' WHERE id = @id`);
}

/**
 * Obtiene una custodia por su referencia2 y que esté DISPONIBLE.
 * @param {import('mssql').Transaction} transaction
 * @param {string} referencia2
 * @returns {Promise<Object|null>}
 */
console.log("referencia2referencia2");

async function getCustodiaByReferencia2Devoluccion(transaction, referencia2) {
  const request = transaction.request();
  request.input('referencia2', sql.NVarChar, referencia2);
  const result = await request.query(`
    SELECT * FROM dbo.Custodia
    WHERE referencia2 = @referencia2 AND estado = 'ENTREGADO'
  `);
  if (!result.recordset || result.recordset.length === 0) {
    return null;
  }
  return result.recordset[0];
}





module.exports = {
  getCustodiasDisponibles,
  marcarCustodiaSolicitada,
  getCustodiaByReferencia2,
  getCustodiaByReferencia2Devoluccion,
  marcarCustodiaEnDevolucion,
  getCustodiasPrestadas
};
