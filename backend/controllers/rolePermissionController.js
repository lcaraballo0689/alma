// controllers/rolePermissionController.js
const { connectDB, sql } = require("../config/db");

/**
 * Asigna un permiso a un rol.
 * Se espera recibir en el body: { tipoUsuarioId, permisoId }
 */
async function assignPermission(req, res) {
  const { tipoUsuarioId, permisoId } = req.body;
  if (!tipoUsuarioId || !permisoId) {
    return res.status(400).json({ error: "tipoUsuarioId y permisoId son obligatorios." });
  }
  try {
    const pool = await connectDB();

    // Verificar si la asignación ya existe para evitar duplicados.
    const checkResult = await pool.request()
      .input("tipoUsuarioId", sql.Int, tipoUsuarioId)
      .input("permisoId", sql.Int, permisoId)
      .query(`
        SELECT * FROM dbo.TipoUsuario_Permiso
        WHERE tipoUsuarioId = @tipoUsuarioId AND permisoId = @permisoId
      `);

    if (checkResult.recordset.length > 0) {
      return res.status(409).json({ error: "El permiso ya ha sido asignado a este rol." });
    }

    // Insertar la asignación ya validada.
    await pool.request()
      .input("tipoUsuarioId", sql.Int, tipoUsuarioId)
      .input("permisoId", sql.Int, permisoId)
      .query(`
        INSERT INTO dbo.TipoUsuario_Permiso (tipoUsuarioId, permisoId, asignadoEn)
        VALUES (@tipoUsuarioId, @permisoId, GETDATE());
      `);

    return res.status(201).json({ message: "Permiso asignado al rol exitosamente." });
  } catch (error) {
    console.error("Error en assignPermission:", error);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
}

/**
 * Elimina la asignación de un permiso de un rol.
 * Se espera recibir en el body: { tipoUsuarioId, permisoId }
 */
async function removePermission(req, res) {
  const { tipoUsuarioId, permisoId } = req.body;
  if (!tipoUsuarioId || !permisoId) {
    return res.status(400).json({ error: "tipoUsuarioId y permisoId son obligatorios." });
  }
  try {
    const pool = await connectDB();
    await pool.request()
      .input("tipoUsuarioId", sql.Int, tipoUsuarioId)
      .input("permisoId", sql.Int, permisoId)
      .query(`
        DELETE FROM dbo.TipoUsuario_Permiso
        WHERE tipoUsuarioId = @tipoUsuarioId AND permisoId = @permisoId;
      `);
    return res.json({ message: "Permiso removido del rol exitosamente." });
  } catch (error) {
    console.error("Error en removePermission:", error);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
}

/**
 * Obtiene todos los permisos asignados a un rol.
 * Se espera el id del rol en req.params.tipoUsuarioId.
 */
async function getPermissionsByRole(req, res) {
  const { tipoUsuarioId } = req.body;
  console.log("tipoUsuarioId (body):", tipoUsuarioId);

  if (!tipoUsuarioId) {
    return res.status(400).json({ error: "El campo tipoUsuarioId es obligatorio." });
  }

  try {
    const pool = await connectDB();
    const result = await pool.request()
      .input("tipoUsuarioId", sql.Int, tipoUsuarioId)
      .query(`
        SELECT p.id, p.nombre, p.descripcion, tup.asignadoEn
        FROM dbo.TipoUsuario_Permiso tup
        JOIN dbo.Permiso p ON tup.permisoId = p.id
        WHERE tup.tipoUsuarioId = @tipoUsuarioId
      `);
    return res.json(result.recordset);
  } catch (error) {
    console.error("Error en getPermissionsByRole:", error);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
}

/**
 * Actualiza la asignación de permisos para un rol.
 * Se espera el id del rol en req.params.id y en el body { permisos: [permisoId1, permisoId2, ...] }.
 */
async function updatePermissions(req, res) {
  const { tipoUsuarioId, permisos } = req.body;
  console.log("tipoUsuarioId (body):", tipoUsuarioId);
  console.log("permisos (body):", permisos);

  // Validamos que tipoUsuarioId sea un número válido y que permisos sea un array.
  if (typeof tipoUsuarioId !== 'number' || isNaN(tipoUsuarioId) || !Array.isArray(permisos)) {
    return res.status(400).json({ error: "Se requiere un tipoUsuarioId numérico y una lista de permisos." });
  }
  
  try {
    const pool = await connectDB();

    // Eliminar las asignaciones actuales para el rol indicado
    await pool.request()
      .input("tipoUsuarioId", sql.Int, tipoUsuarioId)
      .query(`
        DELETE FROM dbo.TipoUsuario_Permiso
        WHERE tipoUsuarioId = @tipoUsuarioId;
      `);

    // Insertar cada nuevo permiso recibido
    for (const permisoId of permisos) {
      await pool.request()
        .input("tipoUsuarioId", sql.Int, tipoUsuarioId)
        .input("permisoId", sql.Int, permisoId)
        .query(`
          INSERT INTO dbo.TipoUsuario_Permiso (tipoUsuarioId, permisoId, asignadoEn)
          VALUES (@tipoUsuarioId, @permisoId, GETDATE());
        `);
    }

    return res.json({ message: "Permisos actualizados exitosamente." });
  } catch (error) {
    console.error("Error en updatePermissions:", error);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
}




module.exports = {
  assignPermission,
  removePermission,
  getPermissionsByRole,
  updatePermissions,
};
