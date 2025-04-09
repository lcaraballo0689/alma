/**
 * @fileoverview Controlador para la gestión de bodegas.
 * @module controllers/bodegaController
 */

const db = require('../database'); // Módulo de conexión a la base de datos

// Obtiene todas las bodegas.
exports.getAllBodegas = async (req, res) => {
  try {
    // Consulta para obtener todas las bodegas
    const result = await db.query('SELECT * FROM Bodega');
    res.json(result.recordset);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener bodegas' });
  }
};

// Obtiene una bodega por su ID.
exports.getBodegaById = async (req, res) => {
  try {
    const { id } = req.params;
    // Consulta parametrizada
    const result = await db.query('SELECT * FROM Bodega WHERE id = @id', { 
      replacements: { id }
    });
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Bodega no encontrada' });
    }
    res.json(result.recordset[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener bodega' });
  }
};

// Crea una nueva bodega.
exports.createBodega = async (req, res) => {
  try {
    const {
      nombre,
      codigoUbicacion,
      cantidadModulos,
      cantidadEntrepanos,
      cantidadCaras,
      cantidadPisos,
      dimensionX,
      dimensionY,
      dimensionZ,
      espacios
    } = req.body;
    
    // Inserta la nueva bodega en la base de datos. Se utiliza GETDATE() para 'fechaCreacion'
    const result = await db.query(
      `INSERT INTO Bodega
        (nombre, codigoUbicacion, cantidadModulos, cantidadEntrepanos, cantidadCaras, cantidadPisos, dimensionX, dimensionY, dimensionZ, fechaCreacion, espacios)
      VALUES
        (@nombre, @codigoUbicacion, @cantidadModulos, @cantidadEntrepanos, @cantidadCaras, @cantidadPisos, @dimensionX, @dimensionY, @dimensionZ, GETDATE(), @espacios);
       SELECT SCOPE_IDENTITY() AS id;`,
      {
        replacements: {
          nombre,
          codigoUbicacion,
          cantidadModulos,
          cantidadEntrepanos,
          cantidadCaras,
          cantidadPisos,
          dimensionX,
          dimensionY,
          dimensionZ,
          espacios
        }
      }
    );

    const newId = result.recordset[0].id;
    res.status(201).json({ id: newId, ...req.body, fechaCreacion: new Date() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear bodega' });
  }
};

// Actualiza una bodega existente.
exports.updateBodega = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre,
      codigoUbicacion,
      cantidadModulos,
      cantidadEntrepanos,
      cantidadCaras,
      cantidadPisos,
      dimensionX,
      dimensionY,
      dimensionZ,
      espacios
    } = req.body;
    
    await db.query(
      `UPDATE Bodega SET 
         nombre = @nombre,
         codigoUbicacion = @codigoUbicacion,
         cantidadModulos = @cantidadModulos,
         cantidadEntrepanos = @cantidadEntrepanos,
         cantidadCaras = @cantidadCaras,
         cantidadPisos = @cantidadPisos,
         dimensionX = @dimensionX,
         dimensionY = @dimensionY,
         dimensionZ = @dimensionZ,
         espacios = @espacios
       WHERE id = @id;`,
      {
        replacements: { id, nombre, codigoUbicacion, cantidadModulos, cantidadEntrepanos, cantidadCaras, cantidadPisos, dimensionX, dimensionY, dimensionZ, espacios }
      }
    );
    res.json({ message: 'Bodega actualizada exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar bodega' });
  }
};

// Elimina una bodega.
exports.deleteBodega = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM Bodega WHERE id = @id', { replacements: { id } });
    res.json({ message: 'Bodega eliminada exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar bodega' });
  }
};
