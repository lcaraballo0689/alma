// controllers/roleController.js
const { connectDB, sql } = require("../config/db");

/**
 * Obtiene todos los roles.
 */
async function getAllRoles(req, res) {
  try {
    const pool = await connectDB();
    const result = await pool.request().query("SELECT * FROM dbo.TipoUsuario");
    return res.json(result.recordset);
  } catch (error) {
    console.error("Error en getAllRoles:", error);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
}

/**
 * Obtiene un rol por ID.
 */
async function getRoleById(req, res) {
  const { id } = req.params;
  try {
    const pool = await connectDB();
    const result = await pool.request()
      .input("id", sql.Int, id)
      .query("SELECT * FROM dbo.TipoUsuario WHERE id = @id");
    if (!result.recordset || result.recordset.length === 0) {
      return res.status(404).json({ error: "Rol no encontrado." });
    }
    return res.json(result.recordset[0]);
  } catch (error) {
    console.error("Error en getRoleById:", error);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
}

/**
 * Crea un nuevo rol.
 */
async function createRole(req, res) {
  const { tipo } = req.body;
  if (!tipo) {
    return res.status(400).json({ error: "El nombre del rol (tipo) es obligatorio." });
  }
  try {
    const pool = await connectDB();
    const result = await pool.request()
      .input("tipo", sql.NVarChar, tipo)
      .query(`
        INSERT INTO dbo.TipoUsuario (tipo)
        VALUES (@tipo);
        SELECT SCOPE_IDENTITY() as insertedId;
      `);
    const newId = result.recordset[0].insertedId;
    return res.status(201).json({ message: "Rol creado exitosamente.", id: newId });
  } catch (error) {
    console.error("Error en createRole:", error);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
}

/**
 * Actualiza un rol existente.
 */
async function updateRole(req, res) {
  const { id } = req.params;
  const { tipo } = req.body;
  if (!tipo) {
    return res.status(400).json({ error: "El nombre del rol (tipo) es obligatorio." });
  }
  try {
    const pool = await connectDB();
    // Verificar si existe el rol
    const check = await pool.request()
      .input("id", sql.Int, id)
      .query("SELECT id FROM dbo.TipoUsuario WHERE id = @id");
    if (!check.recordset || check.recordset.length === 0) {
      return res.status(404).json({ error: "Rol no encontrado." });
    }
    await pool.request()
      .input("id", sql.Int, id)
      .input("tipo", sql.NVarChar, tipo)
      .query(`
        UPDATE dbo.TipoUsuario
        SET tipo = @tipo
        WHERE id = @id
      `);
    return res.json({ message: "Rol actualizado exitosamente." });
  } catch (error) {
    console.error("Error en updateRole:", error);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
}

/**
 * Elimina un rol.
 */
async function deleteRole(req, res) {
  const { id } = req.params;
  try {
    const pool = await connectDB();
    const check = await pool.request()
      .input("id", sql.Int, id)
      .query("SELECT id FROM dbo.TipoUsuario WHERE id = @id");
    if (!check.recordset || check.recordset.length === 0) {
      return res.status(404).json({ error: "Rol no encontrado." });
    }
    await pool.request()
      .input("id", sql.Int, id)
      .query("DELETE FROM dbo.TipoUsuario WHERE id = @id");
    return res.json({ message: "Rol eliminado exitosamente." });
  } catch (error) {
    console.error("Error en deleteRole:", error);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
}

module.exports = {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
};
