// controllers/confirmRecepcionController.js
const { connectDB, sql } = require("../config/db");

exports.confirmRecepcion = async (req, res) => {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { recepcionId, estado } = req.body;
  if (!recepcionId || !estado) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }

  try {
    const pool = await connectDB();
    const result = await pool.request()
      .input("recepcionId", sql.Int, recepcionId)
      .input("estado", sql.NVarChar, estado)
      .query(`
        UPDATE Recepcion
        SET estado = @estado, fechaConfirmacion = GETDATE()
        WHERE id = @recepcionId
      `);
    return res.status(200).json({ message: "Recepción confirmada exitosamente", result: result.recordset });
  } catch (error) {
    console.error("Error en confirmRecepcion:", error);
    return res.status(500).json({ error: "Error interno del servidor", details: error });
  }
};
