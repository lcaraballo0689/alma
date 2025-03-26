const { connectDB, sql } = require('../../config/db');

// Obtener devoluciones por clienteId y estado opcional
async function getDevoluciones(req, res) {
  try {
    const { clienteId, estado } = req.body;

    // Validaciones
    if (!clienteId || isNaN(clienteId)) {
      return res.status(400).json({ error: "El campo 'clienteId' es obligatorio y debe ser un número válido." });
    }

    // Conectar a la base de datos
    const pool = await connectDB();
    let query = `
      SELECT d.*, 
             c.nombre AS cliente_nombre, 
             cu.item AS custodia_item
      FROM Devoluciones d
      LEFT JOIN Cliente c ON d.clienteId = c.id
      LEFT JOIN Custodia cu ON d.custodiaId = cu.id
      WHERE d.clienteId = @clienteId
    `;

    const request = pool.request();
    request.input('clienteId', sql.Int, clienteId);

    // Aplicar filtro por estado solo si no es "TODOS"
    if (estado && estado.toUpperCase() !== "TODOS") {
      query += ` AND d.estado = @estado`;
      request.input('estado', sql.VarChar, estado);
    }

    query += " ORDER BY d.FechaDevolucion DESC"; // Ordenamos por fecha de devolución

    // Ejecutar la consulta
    const result = await request.query(query);
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("❌ Error en getDevoluciones:", error);
    res.status(500).json({ error: "Error interno del servidor.", details: error.message });
  }
}

// Obtener todos los estados únicos de las tablas relevantes
async function getEstados(req, res) {
    try {
      const pool = await connectDB();
  
      const query = `
        SELECT estado FROM Prestamos
        UNION
        SELECT estado FROM Devoluciones
        UNION
        SELECT estado FROM Custodia
        UNION
        SELECT estado FROM SolicitudTransporte
        UNION
        SELECT estado FROM DetalleSolicitudTransporte
        UNION
        SELECT estado FROM DetallePunteoRecogida
      `;
  
      const result = await pool.request().query(query);
  
      const estadosUnicos = [...new Set(result.recordset.map(row => row.estado))]; // Evitar duplicados
  
      res.status(200).json(estadosUnicos);
    } catch (error) {
      console.error("❌ Error al obtener estados:", error);
      res.status(500).json({ error: "Error interno del servidor.", details: error.message });
    }
  }
module.exports = { getDevoluciones, getEstados };
