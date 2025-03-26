/**
 * Controlador para la gestión de Entregas.
 * 
 * Este controlador incluye:
 *  - confirmEntrega: Confirma una entrega actualizando el campo 'estado' y el 'timestamp'
 *    en la tabla Entrega, filtrando por 'clienteId'.
 *  - listarEntregas: Lista las entregas registradas para un cliente, permitiendo filtros opcionales.
 *
 * Se asume que la tabla Entrega tiene los campos 'estado' y 'clienteId'.
 */

const { connectDB, sql } = require("../config/db");

/**
 * Confirma la entrega actualizando el campo 'estado' y el 'timestamp' en la base de datos.
 * 
 * Se espera que el body contenga:
 *   - entregaId: number
 *   - estado: string (nuevo estado, por ejemplo, "ENTREGADO")
 *   - clienteId: number
 *
 * Método HTTP: PUT
 */
exports.confirmEntrega = async (req, res) => {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { entregaId, estado, clienteId } = req.body;
  
  if (!entregaId || !estado || !clienteId) {
    return res.status(400).json({ error: "Faltan campos obligatorios (entregaId, estado, clienteId)" });
  }
  
  console.log("Nuevo estado recibido:", estado);

  try {
    const pool = await connectDB();
    // Actualizamos el registro en la tabla Entrega
    const result = await pool.request()
      .input("entregaId", sql.Int, entregaId)
      .input("estado", sql.NVarChar, estado)
      .input("clienteId", sql.Int, clienteId)
      .query(`
        UPDATE Entrega
        SET estado = @estado,
            timestamp = GETDATE()
        WHERE id = @entregaId
          AND clienteId = @clienteId
      `);

    return res.status(200).json({ 
      message: "Entrega confirmada exitosamente", 
      result: result.recordset 
    });
  } catch (error) {
    console.error("Error en confirmEntrega:", error);
    return res.status(500).json({ 
      error: "Error interno del servidor", 
      details: error 
    });
  }
};

/**
 * Lista las entregas registradas para un cliente.
 * 
 * Se espera que el body contenga:
 *   - clienteId: number
 *   - filtros (opcional): { fechaDesde?: string, fechaHasta?: string }
 *
 * Método HTTP: POST
 */
exports.listarEntregas = async (req, res, next) => {
  try {
    const { clienteId, filtros } = req.body;
    if (!clienteId) {
      return res.status(400).json({ error: 'El campo "clienteId" es obligatorio.' });
    }

    const pool = await connectDB();
    const requestDb = pool.request();

    // Consulta para obtener las entregas filtradas por clienteId directamente desde la tabla Entrega
    let query = `
      SELECT *
      FROM Entrega
      WHERE clienteId = @clienteId
    `;

    if (filtros) {
      if (filtros.fechaDesde) {
        query += " AND fechaEntrega >= @fechaDesde";
        requestDb.input('fechaDesde', sql.DateTime, filtros.fechaDesde);
      }
      if (filtros.fechaHasta) {
        query += " AND fechaEntrega <= @fechaHasta";
        requestDb.input('fechaHasta', sql.DateTime, filtros.fechaHasta);
      }
    }

    requestDb.input('clienteId', sql.Int, clienteId);

    const result = await requestDb.query(query);
    return res.status(200).json({ data: result.recordset });
  } catch (error) {
    console.error("Error en listarEntregas:", error);
    return res.status(500).json({ error: "Error interno del servidor", details: error });
  }
};
