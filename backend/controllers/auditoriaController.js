const { connectDB, sql } = require("../config/db"); // Asegúrate que sql esté exportado

async function obtenerHistorialSolicitudes(req, res) {
  console.log("Llegó al controlador de historial");

  const { clienteId } = req.body;

  if (!clienteId) {
    return res.status(400).json({ error: "clienteId es requerido en el cuerpo de la solicitud." });
  }

  try {
    const pool = await sql.connect(process.env.DB_CONNECTION);

    const result = await pool.request()
    .input("clienteId", sql.Int, clienteId)
      .query(`
        SELECT 
          sta.SolicitudID,
          st.modulo as tipo,
          sta.NuevoEstado AS estado,
          FORMAT(sta.FechaEvento, 'dd-MM-yyyy') AS Fecha,
          RIGHT('0' + CAST(DATEPART(HOUR, sta.FechaEvento) % 12 AS VARCHAR), 2) + ':' +
          RIGHT('0' + CAST(DATEPART(MINUTE, sta.FechaEvento) AS VARCHAR), 2) + ' ' +
          CASE WHEN DATEPART(HOUR, sta.FechaEvento) >= 12 THEN 'PM' ELSE 'AM' END AS Hora,
          u.nombre AS NombreUsuario
        FROM dbo.SolicitudTransporte_Audit sta
        JOIN dbo.SolicitudTransporte st ON sta.SolicitudID = st.consecutivo
        LEFT JOIN dbo.Usuario u ON sta.Usuario = u.id
        WHERE st.clienteId = @clienteId
        ORDER BY sta.FechaEvento DESC
      `);

    res.json(result.recordset);
  } catch (error) {
    console.error("Error al obtener el historial de solicitudes:", error.message);
    res.status(500).json({ error: "Error interno del servidor." });
  }
}

module.exports = {
  obtenerHistorialSolicitudes,
};
