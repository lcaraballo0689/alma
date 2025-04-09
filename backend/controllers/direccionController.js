const { connectDB, sql } = require('../config/db');

// Obtener todas las direcciones
async function getAllDirecciones(req, res) {
  try {
    const pool = await connectDB();
    const result = await pool.request().query(`
      SELECT id, direccion, clienteId, lat, lng, alias
      FROM dbo.Direccion
      ORDER BY id DESC
    `);
    return res.json(result.recordset);
  } catch (error) {
    console.error('Error en getAllDirecciones:', error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
}

// Obtener dirección por ID
async function getDireccionById(req, res) {
  const { id } = req.params;
  try {
    const pool = await connectDB();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT id, direccion, clienteId, lat, lng,alias
        FROM dbo.Direccion
        WHERE id = @id
      `);
    if (!result.recordset.length) {
      return res.status(404).json({ error: 'Dirección no encontrada.' });
    }
    return res.json(result.recordset[0]);
  } catch (error) {
    console.error('Error en getDireccionById:', error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
}

// Obtener direcciones por cliente
async function getDireccionesByClienteId(req, res) {
  const { clienteId } = req.params;
  try {
    const pool = await connectDB();
    const result = await pool.request()
      .input('clienteId', sql.Int, clienteId)
      .query(`
        SELECT id, direccion, clienteId, lat, lng
        FROM dbo.Direccion
        WHERE clienteId = @clienteId
      `);
    return res.json({ direcciones: result.recordset });
  } catch (error) {
    console.error('Error en getDireccionesByClienteId:', error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
}

// Crear nueva dirección
async function createDireccion(req, res) {
  const { direccion, clienteId, lat, lng, alias } = req.body;
  if (!direccion || !clienteId) {
    return res.status(400).json({ error: 'Faltan campos obligatorios: direccion y clienteId.' });
  }
  try {
    const pool = await connectDB();
    const result = await pool.request()
      .input('direccion', sql.NVarChar, direccion)
      .input('alias', sql.NVarChar, alias) // <--- Nuevo
      .input('clienteId', sql.Int, clienteId)
      .input('lat', sql.Float, lat)
      .input('lng', sql.Float, lng)
      .query(`
        INSERT INTO dbo.Direccion (direccion, alias, clienteId, lat, lng)
        VALUES (@direccion, @alias, @clienteId, @lat, @lng);
        SELECT SCOPE_IDENTITY() AS insertedId;
      `);
    return res.status(201).json({ message: 'Dirección creada', id: result.recordset[0].insertedId });
  } catch (error) {
    console.error('Error en createDireccion:', error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
}


// Actualizar dirección
async function updateDireccion(req, res) {
  const { id } = req.params;
  const { direccion, clienteId, lat, lng, alias } = req.body; // <--- Nuevo
  if (!direccion || !clienteId) {
    return res.status(400).json({ error: 'Faltan campos obligatorios: direccion y clienteId.' });
  }
  try {
    const pool = await connectDB();
    const check = await pool.request().input('id', sql.Int, id).query(`SELECT id FROM dbo.Direccion WHERE id = @id`);
    if (!check.recordset.length) {
      return res.status(404).json({ error: 'Dirección no encontrada.' });
    }
    await pool.request()
      .input('id', sql.Int, id)
      .input('direccion', sql.NVarChar, direccion)
      .input('alias', sql.NVarChar, alias) // <--- Nuevo
      .input('clienteId', sql.Int, clienteId)
      .input('lat', sql.Float, lat)
      .input('lng', sql.Float, lng)
      .query(`
        UPDATE dbo.Direccion
        SET direccion = @direccion,
            alias = @alias,
            clienteId = @clienteId,
            lat = @lat,
            lng = @lng
        WHERE id = @id
      `);
    return res.json({ message: 'Dirección actualizada exitosamente.' });
  } catch (error) {
    console.error('Error en updateDireccion:', error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
}


// Eliminar dirección
async function deleteDireccion(req, res) {
  const { id } = req.params;
  try {
    const pool = await connectDB();
    const check = await pool.request().input('id', sql.Int, id).query(`SELECT id FROM dbo.Direccion WHERE id = @id`);
    if (!check.recordset.length) {
      return res.status(404).json({ error: 'Dirección no encontrada.' });
    }
    await pool.request().input('id', sql.Int, id).query(`DELETE FROM dbo.Direccion WHERE id = @id`);
    return res.json({ message: 'Dirección eliminada exitosamente.' });
  } catch (error) {
    console.error('Error en deleteDireccion:', error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
}

module.exports = {
  getAllDirecciones,
  getDireccionById,
  getDireccionesByClienteId,
  createDireccion,
  updateDireccion,
  deleteDireccion,
};
