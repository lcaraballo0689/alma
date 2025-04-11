// controllers/dashboardController.js

const { connectDB, sql } = require('../config/db');

/**
 * Obtiene información relevante para el dashboard del administrador.
 * Se incluyen:
 *   - Totales generales: número de usuarios, clientes y solicitudes.
 *   - Solicitudes agrupadas por módulo y estado.
 *   - Tiempo promedio de procesamiento de solicitudes completadas (en minutos).
 *   - Utilización del inventario: total de custodias vs. total de ubicaciones y su porcentaje.
 *   - Número de notificaciones no leídas.
 *   - Los 10 eventos (audit) más recientes.
 *
 * @async
 * @param {Object} req - Objeto de solicitud (podrías incluir filtros, por ejemplo clienteId).
 * @param {Object} res - Objeto de respuesta.
 * @returns {Promise<void>} Respuesta JSON con el objeto dashboardData.
 */
async function getDashboardData(req, res) {
  try {
    const pool = await connectDB();

    // Consulta de totales generales
    const totalsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM dbo.Usuario) AS totalUsers,
        (SELECT COUNT(*) FROM dbo.Cliente) AS totalClients,
        (SELECT COUNT(*) FROM dbo.SolicitudTransporte) AS totalSolicitudes
    `;
    
    // Solicitudes agrupadas por módulo y estado
    const requestsByModuleQuery = `
      SELECT modulo, estado, COUNT(*) AS total
      FROM dbo.SolicitudTransporte
      GROUP BY modulo, estado
    `;
    
    // Tiempo promedio de procesamiento de solicitudes completadas (en minutos)
    const avgProcessingQuery = `
      SELECT AVG(DATEDIFF(MINUTE, fechaSolicitud, updatedAt)) AS avgProcessingTime
      FROM dbo.SolicitudTransporte
      WHERE estado = 'completado'
    `;
    
    // Utilización del inventario: total de custodias, total de ubicaciones y porcentaje
    const inventoryUsageQuery = `
      SELECT 
        (SELECT COUNT(*) FROM dbo.Custodia) AS totalCustodias,
        (SELECT COUNT(*) FROM dbo.Ubicacion) AS totalUbicaciones,
        (SELECT CAST(COUNT(*) AS FLOAT) * 100.0 / (SELECT COUNT(*) FROM dbo.Ubicacion)
         FROM dbo.Custodia) AS percentageUsed
      FROM dbo.Custodia
    `;
    
    // Número de notificaciones no leídas
    const unreadNotificationsQuery = `
      SELECT COUNT(*) AS unreadNotifications
      FROM dbo.Notificaciones
      WHERE estado = 'no leído'
    `;
    
    // Últimos 10 eventos de auditoría (transiciones de solicitud)
    const recentAuditsQuery = `
      SELECT TOP 10 
        SolicitudID,
        EstadoAnterior,
        NuevoEstado,
        FechaEvento,
        Usuario,
        Comentarios
      FROM dbo.SolicitudTransporte_Audit
      ORDER BY FechaEvento DESC
    `;
    
    // Ejecutar las consultas en paralelo
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
    
    // Construir el objeto de respuesta
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
    console.error('Error en getDashboardData:', error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
}

module.exports = {
  getDashboardData,
};
