// controllers/notificacionesController.js
const { connectDB, sql } = require("../config/db");

exports.getEntregasPendientes = async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  // Obtenemos el clienteId asignado en el middleware de autenticación
  const clienteId = req.query.clienteId;

  if (!clienteId) {
    return res.status(400).json({ error: "ClienteId no proporcionado" });
  }

  try {
    const pool = await connectDB();
    const request = pool.request();
    request.input("clienteId", sql.Int, clienteId);
    // Seleccionamos las entregas pendientes
    const query = `
      SELECT id, clienteId, consecutivo, estado, fechaEntrega, observaciones
      FROM Entregas
      WHERE clienteId = @clienteId AND estado = 'PENDIENTE'
    `;
    const result = await request.query(query);
    return res.status(200).json({ pendientes: result.recordset, total: result.recordset.length });
  } catch (error) {
    console.error("Error en getEntregasPendientes:", error);
    return res.status(500).json({ error: "Error interno del servidor", details: error });
  }
};

exports.getEntregasVencidas = async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const clienteId = req.clienteId;
  if (!clienteId) {
    return res.status(400).json({ error: "ClienteId no proporcionado" });
  }

  try {
    const pool = await connectDB();
    const request = pool.request();
    request.input("clienteId", sql.Int, clienteId);
    // Seleccionamos las entregas vencidas: fechaEntrega menor a la fecha actual y estado distinto de 'ENTREGA CONFIRMADA'
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

exports.getResumen = async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const clienteId = req.clienteId;
  if (!clienteId) {
    return res.status(400).json({ error: "ClienteId no proporcionado" });
  }

  try {
    const pool = await connectDB();
    const request = pool.request();
    request.input("clienteId", sql.Int, clienteId);
    // Obtenemos un resumen con varias métricas
    const query = `
      SELECT 
        SUM(CASE WHEN estado = 'PENDIENTE' THEN 1 ELSE 0 END) AS entregasPendientes,
        SUM(CASE WHEN estado = 'ENTREGA CONFIRMADA' AND CAST(updatedAt AS date) = CAST(GETDATE() AS date) THEN 1 ELSE 0 END) AS entregasConfirmadasHoy,
        SUM(CASE WHEN estado = 'RECHAZADO' AND CAST(updatedAt AS date) = CAST(GETDATE() AS date) THEN 1 ELSE 0 END) AS entregasRechazadasHoy,
        SUM(CASE WHEN fechaEntrega < GETDATE() AND estado != 'ENTREGA CONFIRMADA' THEN 1 ELSE 0 END) AS entregasVencidas
      FROM Entregas
      WHERE clienteId = @clienteId
    `;
    const result = await request.query(query);
    return res.status(200).json({ resumen: result.recordset[0] });
  } catch (error) {
    console.error("Error en getResumen:", error);
    return res.status(500).json({ error: "Error interno del servidor", details: error });
  }
};
