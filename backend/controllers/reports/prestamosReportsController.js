const { connectDB, sql } = require("../../config/db");

/**
 * Obtiene los préstamos según cliente y, opcionalmente, un arreglo de estados.
 * Si en el arreglo de estados se incluye "TODOS", no se filtra por estado.
 */
async function getPrestamos(req, res) {
  const { estado, idCliente } = req.body;

  // Validar que idCliente sea obligatorio y numérico
  if (!idCliente || isNaN(Number(idCliente))) {
    return res.status(400).json({
      error: "El campo 'idCliente' es obligatorio y debe ser un número válido.",
    });
  }

  try {
    const pool = await connectDB();
    const request = pool.request();
    request.input("idCliente", sql.Int, idCliente);

    // Iniciamos el WHERE con clienteId
    // Alias 'p' para la tabla Prestamos
    let whereClauses = ["clienteId = @idCliente"];

    // Filtrar por estado si no incluye "TODOS" y es un array con contenido
    if (Array.isArray(estado) && estado.length > 0 && !estado.includes("TODOS")) {
      // Generar placeholders (@estado0, @estado1, etc.)
      const estadoPlaceholders = estado.map((_, i) => `@estado${i}`).join(", ");
      whereClauses.push(`estado IN (${estadoPlaceholders})`);

      // Agregar inputs para cada estado
      estado.forEach((value, i) => {
        request.input(`estado${i}`, sql.VarChar, value);
      });
    }

    // Construir la query final
    let query = `
      SELECT * FROM Prestamos 
    `;

    // Agregar cláusula WHERE si existen filtros
    if (whereClauses.length > 0) {
      query += " WHERE " + whereClauses.join(" AND ");
    }

    // Ordenar por consecutivo (o la columna que prefieras)
    query += " ORDER BY consecutivo ASC;";

    // Ejecutar la consulta
    const result = await request.query(query);
    return res.status(200).json(result.recordset);
  } catch (error) {
    console.error("❌ Error en getPrestamos:", error);
    return res.status(500).json({
      error: "Error interno del servidor.",
      details: error.message,
    });
  }
}


// Obtener todos los estados únicos de la tabla Prestamos
async function getEstadosPrestamos(req, res) {
  try {
    const pool = await connectDB();
    const result = await pool.request().query(`
      SELECT DISTINCT estado FROM Prestamos
    `);

    const estados = result.recordset.map((row) => row.estado).filter(Boolean);

    res.status(200).json(estados);
  } catch (error) {
    console.error("❌ Error en getEstadosPrestamos:", error);
    res.status(500).json({ error: "Error interno del servidor.", details: error.message });
  }
}
module.exports = { getPrestamos, getEstadosPrestamos  };
