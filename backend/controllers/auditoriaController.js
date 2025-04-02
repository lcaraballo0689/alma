const { connectDB, sql } = require("../config/db");

async function obtenerHistorialSolicitudes(req, res) {
  console.log("Llegó al controlador de historial");

  const { clienteId, filtroTipo } = req.body;

  if (!clienteId) {
    return res.status(400).json({ error: "clienteId es requerido en el cuerpo de la solicitud." });
  }

  try {
    const pool = await sql.connect(process.env.DB_CONNECTION);

    const result = await pool.request()
      .input("ClienteId", sql.Int, clienteId)
      .input("FiltroTipo", sql.VarChar(10), filtroTipo || 'diario')
      .execute("sp_HistorialMovimientos");

    res.json(result.recordset);
  } catch (error) {
    console.error("Error al obtener el historial de solicitudes:", error.message);
    res.status(500).json({ error: "Error interno del servidor." });
  }
}

module.exports = {
  obtenerHistorialSolicitudes,
};
