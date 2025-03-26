// controllers/estadoTransicionesController.js
const { connectDB, sql } = require('../config/db');

/**
 * Devuelve un objeto que indica si hay un estadoPermitido y si el botón está habilitado.
 * Ejemplo de respuesta:
 * {
 *   estadoPermitido: "asignado a transportador",
 *   disabled: false
 * }
 * Si no encuentra transiciones, retornará:
 * {
 *   estadoPermitido: null,
 *   disabled: true
 * }
 */
async function getTransicionesPermitidas(req, res) {
  const { modulo, estadoActual, clienteId, tipoUsuarioId } = req.body;

  if (!modulo) {
    return res.status(400).json({ error: 'Falta parámetro "modulo".' });
  }
  if (!estadoActual) {
    return res.status(400).json({ error: 'Falta parámetro "estadoActual".' });
  }
  if (!clienteId) {
    return res.status(400).json({ error: 'Falta parámetro "clienteId".' });
  }
  if (!tipoUsuarioId) {
    return res.status(400).json({ error: 'Falta parámetro "tipoUsuarioId".' });
  }

  try {
    const pool = await connectDB();
    const result = await pool.request()
      .input('modulo', sql.NVarChar, modulo)
      .input('estadoActual', sql.NVarChar, estadoActual)
      .input('clienteId', sql.Int, clienteId)
      .input('tipoUsuarioId', sql.Int, tipoUsuarioId)
      .query(`
        SELECT 
          modulo,
          estadoActual,
          estadoPermitido,
          tipoUsuarioId
        FROM EstadoTransiciones
        WHERE modulo = @modulo
          AND estadoActual = @estadoActual
          AND tipoUsuarioId = @tipoUsuarioId
      `);

    // Si la consulta encuentra al menos una transición,
    // asumimos que el usuario puede avanzar y devolvemos la primera.
    if (result.recordset.length > 0) {
      const row = result.recordset[0];
      // Con esta lógica simple, retornamos un único estadoPermitido
      // y "disabled: false" para indicar que el botón está habilitado.
      return res.json({
        estadoPermitido: row.estadoPermitido,
        disabled: false,
      });
    } else {
      // Si no hay registros, el usuario NO puede avanzar
      return res.json({
        estadoPermitido: null,
        disabled: true,
      });
    }
  } catch (error) {
    console.error('Error en getTransicionesPermitidas:', error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
}

module.exports = {
  getTransicionesPermitidas,
};
