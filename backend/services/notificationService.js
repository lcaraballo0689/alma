const { connectDB, sql } = require("../config/db");
const logger = require("../logger");

async function storeNotification(notificationData) {
  try {
    const pool = await connectDB();
    const result = await pool.request()
      .input("usuarioId", sql.Int, notificationData.usuarioId)
      .input("title", sql.VarChar, notificationData.title)
      .input("message", sql.VarChar, notificationData.message)
      .input("estado", sql.VarChar, notificationData.estado || "no leído")
      .query(`
         INSERT INTO Notificaciones (usuarioId, title, message, estado, createdAt)
         VALUES (@usuarioId, @title, @message, @estado, GETDATE());
         SELECT SCOPE_IDENTITY() as id;
      `);
    return result.recordset[0].id;
  } catch (error) {
    logger.error("Error al almacenar notificación: " + error);
    throw error;
  }
}

module.exports = { storeNotification };
