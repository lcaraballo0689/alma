// controllers/notificacionesController.js
const { connectDB, sql } = require("../config/db");

const getEntregasPendientes = async (req, res) => {
  const clienteId = req.user.clienteId;
  try {
    const pool = await connectDB();
    const request = pool.request();
    request.input("clienteId", sql.Int, clienteId);
    const query = `
      SELECT id, clienteId, consecutivo, estado, fechaEntrega, observaciones
      FROM Entrega
      WHERE clienteId = @clienteId AND estado = 'PENDIENTE'
    `;
    const result = await request.query(query);
    return res.status(200).json({ pendientes: result.recordset, total: result.recordset.length });
  } catch (error) {
    console.error("Error en getEntregasPendientes:", error);
    return res.status(500).json({ error: "Error interno del servidor", details: error });
  }
};

const getEntregasVencidas = async (req, res) => {
  const clienteId = req.clienteId;
  if (!clienteId) {
    return res.status(400).json({ error: "ClienteId no proporcionado" });
  }
  try {
    const pool = await connectDB();
    const request = pool.request();
    request.input("clienteId", sql.Int, clienteId);
    const query = `
      SELECT id, clienteId, consecutivo, estado, fechaEntrega, observaciones
      FROM Entregas
      WHERE clienteId = @clienteId 
        AND fechaEntrega < GETDATE() 
        AND estado != 'ENTREGA CONFIRMADA'
    `;
    const result = await request.query(query);
    return res.status(200).json({ vencidas: result.recordset, total: result.recordset.length });
  } catch (error) {
    console.error("Error en getEntregasVencidas:", error);
    return res.status(500).json({ error: "Error interno del servidor", details: error });
  }
};

const getResumen = async (req, res) => {
  const clienteId = req.clienteId;
  if (!clienteId) {
    return res.status(400).json({ error: "ClienteId no proporcionado" });
  }
  try {
    const pool = await connectDB();
    const request = pool.request();
    request.input("clienteId", sql.Int, clienteId);
    const query = `
      SELECT 
        SUM(CASE WHEN estado = 'PENDIENTE' THEN 1 ELSE 0 END) AS entregasPendientes,
        SUM(CASE WHEN estado = 'ENTREGA CONFIRMADA' AND CAST(updatedAt AS date) = CAST(GETDATE() AS date) THEN 1 ELSE 0 END) AS entregasConfirmadasHoy,
        SUM(CASE WHEN estado = 'RECHAZADO' AND CAST(updatedAt AS date) = CAST(GETDATE() AS date) THEN 1 ELSE 0 END) AS entregasRechazadasHoy,
        SUM(CASE WHEN fechaEntrega < GETDATE() AND estado != 'ENTREGA CONFIRMADA' THEN 1 ELSE 0 END) AS entregasVencidas
      FROM Entrega
      WHERE clienteId = @clienteId
    `;
    const result = await request.query(query);
    return res.status(200).json({ resumen: result.recordset[0] });
  } catch (error) {
    console.error("Error en getResumen:", error);
    return res.status(500).json({ error: "Error interno del servidor", details: error });
  }
};

// NUEVO: Obtener todas las notificaciones históricas de un usuario
const getNotificacionesHistoricas = async (req, res) => {
  // Se asume que el middleware de autenticación agrega el usuario en req.user
  const usuarioId = req.user.id;
  try {
    const pool = await connectDB();
    const request = pool.request();
    request.input("usuarioId", sql.Int, usuarioId);
    const query = `
      SELECT id, usuarioId, title, message, estado, createdAt, updatedAt
      FROM Notificaciones
      WHERE usuarioId = @usuarioId
      ORDER BY createdAt DESC
    `;
    const result = await request.query(query);
    return res.status(200).json({ notifications: result.recordset });
  } catch (error) {
    console.error("Error en getNotificacionesHistoricas:", error);
    return res.status(500).json({ error: "Error interno del servidor", details: error });
  }
};

// NUEVO: Actualizar el estado de una notificación (por ejemplo, marcarla como leído)
const updateNotificacion = async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body; // por ejemplo, "leído"
  try {
    const pool = await connectDB();
    await pool.request()
      .input("id", sql.Int, id)
      .input("estado", sql.VarChar, estado)
      .query(`
        UPDATE Notificaciones 
        SET estado = @estado, updatedAt = GETDATE()
        WHERE id = @id
      `);
    return res.status(200).json({ message: "Notificación actualizada" });
  } catch (error) {
    console.error("Error en updateNotificacion:", error);
    return res.status(500).json({ error: "Error interno del servidor", details: error });
  }
};

module.exports = {
  getEntregasPendientes,
  getEntregasVencidas,
  getResumen,
  getNotificacionesHistoricas,
  updateNotificacion,
};
