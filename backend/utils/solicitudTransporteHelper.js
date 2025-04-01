// utils/solicitudTransporteHelper.js

const { connectDB, sql } = require('../config/db');

// Lista blanca de columnas permitidas para evitar inyección SQL
const ALLOWED_COLUMNS = [
  'id',
  'clienteId',
  'consecutivo',
  'estado',
  'fechaSolicitud',
  'fechaVerificacion',
  'fechaCarga',
  'usuarioVerifica',
  'usuarioCarga',
  'observaciones',
  'createdAt',
  'updatedAt',
  'fechaAsignacion',
  'fechaRecogida',
  'qrToken',
  'modulo',
  'direccion',
  'placa',
  'documento de identidad',
  'documentoIdentidad',
  'transportista',
  'usuarioSolicitante'
];

/**
 * Obtiene el consecutivo (y opcionalmente columnas adicionales) de una solicitud de transporte.
 *
 * @async
 * @param {number} solicitudTransporteId - El ID de la solicitud de transporte.
 * @param {string[]} [additionalColumns=[]] - Array de columnas adicionales (permitidas) a traer.
 * @returns {Promise<Object>} Objeto con la propiedad consecutivo y, opcionalmente, adicionales con el resto de columnas.
 * @throws {Error} Si no se proporciona el ID o si no se encuentra la solicitud.
 */
async function getSolicitudTransporteDetails(solicitudTransporteId, additionalColumns = []) {
  if (!solicitudTransporteId) {
    throw new Error('El ID de la solicitud de transporte es obligatorio.');
  }
  
  // Filtrar las columnas adicionales para que solo se incluyan las permitidas y distintas de "consecutivo"
  const columnasAdicionales = additionalColumns
    .filter(col => col !== 'consecutivo' && ALLOWED_COLUMNS.includes(col));

  // Construir la lista de columnas a seleccionar: siempre consecutivo y, si se requieren, las adicionales
  const columnasSeleccionadas = ['consecutivo', ...columnasAdicionales];
  const columnasSQL = columnasSeleccionadas.join(', ');

  const pool = await connectDB();
  const query = `
    SELECT ${columnasSQL}
    FROM SolicitudTransporte
    WHERE id = @solicitudTransporteId
  `;
  
  const result = await pool.request()
    .input('solicitudTransporteId', sql.Int, solicitudTransporteId)
    .query(query);

  if (!result.recordset || result.recordset.length === 0) {
    throw new Error('No se encontró la solicitud de transporte con el ID proporcionado.');
  }

  const row = result.recordset[0];

  // Armar el objeto de resultado: siempre incluir consecutivo
  const salida = { consecutivo: row.consecutivo };

  // Si se pidieron columnas adicionales, agregarlas en el nodo "adicionales"
  if (columnasAdicionales.length) {
    salida.adicionales = {};
    columnasAdicionales.forEach(col => {
      salida.adicionales[col] = row[col];
    });
  }

  return salida;
}

module.exports = { getSolicitudTransporteDetails };
