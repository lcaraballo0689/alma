// services/userService.js
const { sql } = require('../config/db');

/**
 * Obtiene un usuario por ID.
 * @param {import('mssql').Transaction} transaction - Transacción activa de MSSQL.
 * @param {number} id - ID del usuario a buscar.
 * @returns {Promise<Object|null>} - Retorna el usuario o null si no existe.
 */
async function getUserById(transaction, id) {
  const request = transaction.request();
  request.input('id', sql.Int, id);

  const userResult = await request.query(`
    SELECT id, email, nombre, clienteId
    FROM dbo.Usuario
    WHERE id = @id
  `);

  if (!userResult.recordset || userResult.recordset.length === 0) {
    return null;
  }

  return userResult.recordset[0];
}

module.exports = {
  getUserById
};
