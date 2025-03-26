const { connectDB, sql } = require("../config/db");

/**
 * Controlador que lista los estados en función de:
 *   - tipo: "Prestamo", "Devolucion", "desarchivo", "Traslado", etc.
 *   - clienteId
 *
 * Se asume que en tu tabla de estados (EstadoTransiciones o similar) tienes
 * un campo 'modulo' o 'tipo' que indica el tipo de movimiento, y
 * un campo 'estadoActual' (o 'estado') que define cada estado posible.
 *
 * Opcionalmente, podrías filtrar también por 'clienteId' si tu modelo lo soporta
 * (por ejemplo, si la tabla de transiciones tiene una columna 'clienteId').
 */
exports.globalStates = async (req, res) => {
  try {
    const { tipo} = req.body;
    if (!tipo ) {
      return res.status(400).json({
        error: "Faltan campos obligatorios: tipo",
      });
    }

    const pool = await connectDB();
    const request = pool.request();
    request.input("tipo", sql.NVarChar, tipo);
  
    const query = `
      SELECT DISTINCT estadoActual AS estado
      FROM EstadoTransiciones
      WHERE modulo = @tipo
    `;

    const result = await request.query(query);

    // Retornamos la lista de estados como array simple
    const estados = result.recordset.map((row) => row.estado);

    return res.status(200).json({ data: estados });
  } catch (error) {
    console.error("Error en listarEstadosPorTipo:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};
