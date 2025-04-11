// controllers/dashboardController.js

const { connectDB, sql } = require('../config/db');

/**
 * Endpoint para obtener datos relevantes para el Dashboard del Administrador.
 * Se obtienen:
 *  - Totales generales (Usuarios, Clientes, Solicitudes)
 *  - Solicitudes agrupadas por módulo y estado
 *  - Tiempo promedio de procesamiento para solicitudes completadas (minutos)
 *  - Utilización del inventario (Custodia vs. Ubicacion)
 *  - Número de notificaciones no leídas
 *  - Los 10 eventos (audit) más recientes
 *
 * @async
 * @param {Object} req - Objeto de solicitud. Se puede extender para incluir filtros (por ejemplo, clienteId).
 * @param {Object} res - Objeto de respuesta.
 */
async function getDashboardData(req, res) {
  try {
    const pool = await connectDB();

    // 1. Totales generales: usuarios, clientes y solicitudes
    const totalsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM dbo.Usuario) AS totalUsers,
        (SELECT COUNT(*) FROM dbo.Cliente) AS totalClients,
        (SELECT COUNT(*) FROM dbo.SolicitudTransporte) AS totalSolicitudes;
    `;

    // 2. Solicitudes agrupadas por módulo y estado
    const requestsByModuleQuery = `
      SELECT modulo, estado, COUNT(*) AS total
      FROM dbo.SolicitudTransporte
      GROUP BY modulo, estado;
    `;

    // 3. Tiempo promedio de procesamiento (en minutos) para solicitudes completadas
    const avgProcessingQuery = `
      SELECT AVG(DATEDIFF(MINUTE, fechaSolicitud, updatedAt)) AS avgProcessingTime
      FROM dbo.SolicitudTransporte
      WHERE estado = 'completado';
    `;

    // 4. Utilización del inventario:
    //    - totalCustodias: registros en Custodia
    //    - totalUbicaciones: registros en Ubicacion
    //    - percentageUsed: (custodias/ubicaciones) * 100
    const inventoryUsageQuery = `
      SELECT 
        (SELECT COUNT(*) FROM dbo.Custodia) AS totalCustodias,
        (SELECT COUNT(*) FROM dbo.Ubicacion) AS totalUbicaciones,
        (
          SELECT CAST(COUNT(*) AS FLOAT) * 100.0 / 
          (SELECT COUNT(*) FROM dbo.Ubicacion)
          FROM dbo.Custodia
        ) AS percentageUsed
      FROM dbo.Custodia;
    `;

    // 5. Notificaciones no leídas
    const unreadNotificationsQuery = `
      SELECT COUNT(*) AS unreadNotifications
      FROM dbo.Notificaciones
      WHERE estado = 'no leído';
    `;

    // 6. Eventos recientes (historial de transiciones)
    const recentAuditsQuery = `
      SELECT TOP 10 
        SolicitudID,
        EstadoAnterior,
        NuevoEstado,
        FechaEvento,
        Usuario,
        Comentarios
      FROM dbo.SolicitudTransporte_Audit
      ORDER BY FechaEvento DESC;
    `;

    // Ejecutar todas las consultas en paralelo
    const [
      totalsResult,
      moduleResult,
      avgProcessingResult,
      inventoryResult,
      unreadNotificationsResult,
      recentAuditsResult
    ] = await Promise.all([
      pool.request().query(totalsQuery),
      pool.request().query(requestsByModuleQuery),
      pool.request().query(avgProcessingQuery),
      pool.request().query(inventoryUsageQuery),
      pool.request().query(unreadNotificationsQuery),
      pool.request().query(recentAuditsQuery)
    ]);

    const dashboardData = {
      totals: totalsResult.recordset[0],
      requestsByModule: moduleResult.recordset,
      avgProcessingTime: avgProcessingResult.recordset[0].avgProcessingTime,
      inventoryUsage: inventoryResult.recordset[0],
      unreadNotifications: unreadNotificationsResult.recordset[0].unreadNotifications,
      recentAudits: recentAuditsResult.recordset
    };

    return res.status(200).json({ dashboardData });
  } catch (error) {
    console.error("Error en getDashboardData:", error.stack || error);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
}

module.exports = {
  getDashboardData,
};
