
const { connectDB, sql } = require('../config/db');

/**
 * Obtiene los IDs de la tabla Custodia filtrando por un array de valores de referencia2.
 * @async
 * @param {string[]} referencias2 - Array de valores para la columna referencia2.
 * @returns {Promise<number[]>} Array de IDs.
 * @throws Error si el array no es válido.
 */
async function getIdsByReferencia2(referencias2) {
  if (!Array.isArray(referencias2) || referencias2.length === 0) {
    throw new Error('Se debe enviar un array de referencia2.');
  }

  const pool = await connectDB();

  // Genera placeholders para cada valor del array (e.g. @param0, @param1, ...)
  const placeholders = referencias2
    .map((_, index) => `@param${index}`)
    .join(', ');

  const query = `SELECT id FROM Custodia WHERE referencia2 IN (${placeholders})`;
  const request = pool.request();

  // Asigna cada valor al placeholder correspondiente
  referencias2.forEach((valor, index) => {
    request.input(`param${index}`, sql.NVarChar, valor);
  });

  const result = await request.query(query);
  return result.recordset.map(row => row.id);
}

module.exports = {
  getIdsByReferencia2,
};