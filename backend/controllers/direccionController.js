/**
 * @fileoverview Controlador para la entidad Direccion.
 * Maneja operaciones CRUD y la consulta de direcciones por clienteId.
 */

const { connectDB, sql } = require('../config/db');

/**
 * Obtiene los TOP 1000 registros de Direccion.
 * @async
 * @param {Object} req - Request.
 * @param {Object} res - Response.
 * @returns {Promise<Object[]>} Lista de direcciones.
 */
async function getAllDirecciones(req, res) {
  try {
    const pool = await connectDB();
    const result = await pool.request().query(`
      SELECT TOP (1000) [id],
             [direccion],
             [clienteId]
      FROM dbo.Direccion
      ORDER BY id DESC
    `);
    return res.json(result.recordset);
  } catch (error) {
    console.error('Error en getAllDirecciones:', error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
}

/**
 * Obtiene una dirección por su ID.
 * @async
 * @param {Object} req - Request con req.params.id.
 * @param {Object} res - Response.
 * @returns {Promise<Object>} Registro de dirección.
 */
async function getDireccionById(req, res) {
  const { id } = req.params;
  try {
    const pool = await connectDB();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT [id],
               [direccion],
               [clienteId]
        FROM dbo.Direccion
        WHERE id = @id
      `);
    if (!result.recordset || result.recordset.length === 0) {
      return res.status(404).json({ error: 'Dirección no encontrada.' });
    }
    return res.json(result.recordset[0]);
  } catch (error) {
    console.error('Error en getDireccionById:', error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
}

/**
 * Obtiene todas las direcciones para un cliente dado.
 * @async
 * @param {Object} req - Request con req.params.clienteId.
 * @param {Object} res - Response.
 * @returns {Promise<Object>} Objeto con las direcciones asociadas al cliente.
 */
async function getDireccionesByClienteId(req, res) {
  const { clienteId } = req.params;
  try {
    const pool = await connectDB();
    const result = await pool.request()
      .input('clienteId', sql.Int, clienteId)
      .query(`
        SELECT [id],
               [direccion],
               [clienteId]
        FROM dbo.Direccion
        WHERE clienteId = @clienteId
      `);
    return res.json({ direcciones: result.recordset });
  } catch (error) {
    console.error('Error en getDireccionesByClienteId:', error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
}

/**
 * Crea una nueva dirección.
 * @async
 * @param {Object} req - Request con datos en req.body.
 * @param {Object} res - Response.
 * @returns {Promise<Object>} Objeto JSON con el ID del registro creado.
 */
async function createDireccion(req, res) {
  const { direccion, clienteId } = req.body;
  if (!direccion || !clienteId) {
    return res.status(400).json({ error: 'Faltan campos obligatorios: direccion y clienteId.' });
  }
  try {
    const pool = await connectDB();
    const result = await pool.request()
      .input('direccion', sql.NVarChar, direccion)
      .input('clienteId', sql.Int, clienteId)
      .query(`
        INSERT INTO dbo.Direccion (direccion, clienteId)
        VALUES (@direccion, @clienteId);
        SELECT SCOPE_IDENTITY() as insertedId;
      `);
    const newId = result.recordset[0].insertedId;
    return res.status(201).json({ message: 'Dirección creada', id: newId });
  } catch (error) {
    console.error('Error en createDireccion:', error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
}

/**
 * Actualiza una dirección existente.
 * @async
 * @param {Object} req - Request con req.params.id y datos en req.body.
 * @param {Object} res - Response.
 * @returns {Promise<Object>} Objeto JSON con mensaje de confirmación.
 */
async function updateDireccion(req, res) {
  const { id } = req.params;
  const { direccion, clienteId } = req.body;
  if (!direccion || !clienteId) {
    return res.status(400).json({ error: 'Faltan campos obligatorios: direccion y clienteId.' });
  }
  try {
    const pool = await connectDB();
    // Verificar si la dirección existe
    const check = await pool.request()
      .input('id', sql.Int, id)
      .query(`SELECT id FROM dbo.Direccion WHERE id = @id`);
    if (!check.recordset || check.recordset.length === 0) {
      return res.status(404).json({ error: 'Dirección no encontrada.' });
    }
    await pool.request()
      .input('id', sql.Int, id)
      .input('direccion', sql.NVarChar, direccion)
      .input('clienteId', sql.Int, clienteId)
      .query(`
        UPDATE dbo.Direccion
        SET direccion = @direccion,
            clienteId = @clienteId
        WHERE id = @id
      `);
    return res.json({ message: 'Dirección actualizada exitosamente.' });
  } catch (error) {
    console.error('Error en updateDireccion:', error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
}

/**
 * Elimina una dirección (baja física).
 * @async
 * @param {Object} req - Request con req.params.id.
 * @param {Object} res - Response.
 * @returns {Promise<Object>} Objeto JSON con mensaje de confirmación.
 */
async function deleteDireccion(req, res) {
  const { id } = req.params;
  try {
    const pool = await connectDB();
    // Verificar si la dirección existe
    const check = await pool.request()
      .input('id', sql.Int, id)
      .query(`SELECT id FROM dbo.Direccion WHERE id = @id`);
    if (!check.recordset || check.recordset.length === 0) {
      return res.status(404).json({ error: 'Dirección no encontrada.' });
    }
    await pool.request()
      .input('id', sql.Int, id)
      .query(`DELETE FROM dbo.Direccion WHERE id = @id`);
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
