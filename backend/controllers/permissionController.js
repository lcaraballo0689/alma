// controllers/permissionController.js
const { connectDB, sql } = require("../config/db");

/**
 * Obtiene todos los permisos.
 */
async function getAllPermissions(req, res) {
  try {
    const pool = await connectDB();
    const result = await pool.request().query("SELECT * FROM dbo.Permiso");
    return res.json(result.recordset);
  } catch (error) {
    console.error("Error en getAllPermissions:", error);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
}

/**
 * Obtiene un permiso por ID.
 */
async function getPermissionById(req, res) {
  const { id } = req.params;
  try {
    const pool = await connectDB();
    const result = await pool.request()
      .input("id", sql.Int, id)
      .query("SELECT * FROM dbo.Permiso WHERE id = @id");
    if (!result.recordset || result.recordset.length === 0) {
      return res.status(404).json({ error: "Permiso no encontrado." });
    }
    return res.json(result.recordset[0]);
  } catch (error) {
    console.error("Error en getPermissionById:", error);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
}

/**
 * Crea un nuevo permiso.
 */
async function createPermission(req, res) {
  const { nombre, descripcion, parentId } = req.body;
  if (!nombre) {
    return res.status(400).json({ error: "El nombre del permiso es obligatorio." });
  }
  try {
    const pool = await connectDB();
    const result = await pool.request()
      .input("nombre", sql.NVarChar, nombre)
      .input("descripcion", sql.NVarChar, descripcion || "")
      .input("parentId", sql.Int, parentId || null)
      .query(`
        INSERT INTO dbo.Permiso (nombre, descripcion, parentId)
        VALUES (@nombre, @descripcion, @parentId);
        SELECT SCOPE_IDENTITY() as insertedId;
      `);
    const newId = result.recordset[0].insertedId;
    return res.status(201).json({ message: "Permiso creado exitosamente.", id: newId });
  } catch (error) {
    console.error("Error en createPermission:", error);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
}

/**
 * Actualiza un permiso.
 */
async function updatePermission(req, res) {
  const { id } = req.params;
  const { nombre, descripcion, parentId } = req.body;
  if (!nombre) {
    return res.status(400).json({ error: "El nombre del permiso es obligatorio." });
  }
  try {
    const pool = await connectDB();
    const check = await pool.request()
      .input("id", sql.Int, id)
      .query("SELECT id FROM dbo.Permiso WHERE id = @id");
    if (!check.recordset || check.recordset.length === 0) {
      return res.status(404).json({ error: "Permiso no encontrado." });
    }
    await pool.request()
      .input("id", sql.Int, id)
      .input("nombre", sql.NVarChar, nombre)
      .input("descripcion", sql.NVarChar, descripcion || "")
      .input("parentId", sql.Int, parentId || null)
      .query(`
        UPDATE dbo.Permiso
        SET nombre = @nombre,
            descripcion = @descripcion,
            parentId = @parentId
        WHERE id = @id
      `);
    return res.json({ message: "Permiso actualizado exitosamente." });
  } catch (error) {
    console.error("Error en updatePermission:", error);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
}

/**
 * Elimina un permiso.
 */
async function deletePermission(req, res) {
  const { id } = req.params;
  try {
    const pool = await connectDB();
    const check = await pool.request()
      .input("id", sql.Int, id)
      .query("SELECT id FROM dbo.Permiso WHERE id = @id");
    if (!check.recordset || check.recordset.length === 0) {
      return res.status(404).json({ error: "Permiso no encontrado." });
    }
    await pool.request()
      .input("id", sql.Int, id)
      .query("DELETE FROM dbo.Permiso WHERE id = @id");
    return res.json({ message: "Permiso eliminado exitosamente." });
  } catch (error) {
    console.error("Error en deletePermission:", error);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
}

module.exports = {
  getAllPermissions,
  getPermissionById,
  createPermission,
  updatePermission,
  deletePermission,
};
