const { connectDB, sql } = require('../config/db');

/**
 * Obtiene todas las configuraciones de nomenclatura para un cliente.
 * Se espera recibir en el body: { "clienteId": 2 }
 */
async function getAllNomenclaturas(req, res) {
  try {
    const { clienteId } = req.body;
    if (!clienteId) {
      return res.status(400).json({ error: 'Se requiere el campo clienteId.' });
    }
    const pool = await connectDB();
    const result = await pool.request()
      .input('clienteId', sql.Int, clienteId)
      .query('SELECT * FROM NomenclaturaComponentes WHERE clienteId = @clienteId ORDER BY orden ASC');
    return res.json(result.recordset);
  } catch (error) {
    console.error('Error en getAllNomenclaturas:', error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
}

/**
 * Obtiene una configuración de nomenclatura por su ID para un cliente.
 * Se espera recibir en el body: { "id": 5, "clienteId": 2 }
 */
async function getNomenclaturaById(req, res) {
  const { id, clienteId } = req.body;
  if (!id || !clienteId) {
    return res.status(400).json({ error: 'Se requieren los campos id y clienteId.' });
  }
  try {
    const pool = await connectDB();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('clienteId', sql.Int, clienteId)
      .query('SELECT * FROM NomenclaturaComponentes WHERE id = @id AND clienteId = @clienteId');
    if (!result.recordset || result.recordset.length === 0) {
      return res.status(404).json({ error: 'Configuración no encontrada.' });
    }
    return res.json(result.recordset[0]);
  } catch (error) {
    console.error('Error en getNomenclaturaById:', error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
}

/**
 * Crea una nueva configuración de nomenclatura para un cliente.
 * Se espera recibir en el body:
 * {
 *   "clienteId": 2,
 *   "modulo": "transferencia",
 *   "componente": "prefijo",
 *   "orden": 1,
 *   "separador": "-",
 *   "valorFijo": "TR",         // Opcional si es valor fijo
 *   "esPlaceholder": false      // false = valor fijo, true = placeholder
 * }
 */
async function createNomenclatura(req, res) {
  const { clienteId, modulo, componente, orden, separador, valorFijo, esPlaceholder } = req.body;
  if (!clienteId || !modulo || !componente || typeof orden === 'undefined' || typeof separador === 'undefined' || typeof esPlaceholder === 'undefined') {
    return res.status(400).json({ error: 'Se requieren los campos: clienteId, modulo, componente, orden, separador y esPlaceholder.' });
  }
  try {
    const pool = await connectDB();
    const result = await pool.request()
      .input('clienteId', sql.Int, clienteId)
      .input('modulo', sql.NVarChar, modulo)
      .input('componente', sql.NVarChar, componente)
      .input('orden', sql.Int, orden)
      .input('separador', sql.NVarChar, separador)
      .input('valorFijo', sql.NVarChar, valorFijo || '')
      .input('esPlaceholder', sql.Bit, esPlaceholder)
      .query(`
        INSERT INTO NomenclaturaComponentes (clienteId, modulo, componente, orden, separador, valorFijo, esPlaceholder)
        VALUES (@clienteId, @modulo, @componente, @orden, @separador, @valorFijo, @esPlaceholder);
        SELECT SCOPE_IDENTITY() as insertedId;
      `);
    const insertedId = result.recordset[0].insertedId;
    return res.status(201).json({ message: 'Configuración creada', id: insertedId });
  } catch (error) {
    console.error('Error en createNomenclatura:', error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
}

/**
 * Actualiza una configuración de nomenclatura existente para un cliente.
 * Se espera recibir en el body:
 * {
 *   "id": 5,
 *   "clienteId": 2,
 *   "modulo": "transferencia",
 *   "componente": "prefijo",
 *   "orden": 1,
 *   "separador": "-",
 *   "valorFijo": "TR",
 *   "esPlaceholder": false
 * }
 */
async function updateNomenclatura(req, res) {
  const { id, clienteId, modulo, componente, orden, separador, valorFijo, esPlaceholder } = req.body;
  if (!id || !clienteId) {
    return res.status(400).json({ error: 'Se requieren los campos id y clienteId.' });
  }
  try {
    const pool = await connectDB();
    const check = await pool.request()
      .input('id', sql.Int, id)
      .input('clienteId', sql.Int, clienteId)
      .query('SELECT id FROM NomenclaturaComponentes WHERE id = @id AND clienteId = @clienteId');
    if (!check.recordset || check.recordset.length === 0) {
      return res.status(404).json({ error: 'Configuración no encontrada.' });
    }
    await pool.request()
      .input('id', sql.Int, id)
      .input('clienteId', sql.Int, clienteId)
      .input('modulo', sql.NVarChar, modulo)
      .input('componente', sql.NVarChar, componente)
      .input('orden', sql.Int, orden)
      .input('separador', sql.NVarChar, separador)
      .input('valorFijo', sql.NVarChar, valorFijo || '')
      .input('esPlaceholder', sql.Bit, esPlaceholder)
      .query(`
        UPDATE NomenclaturaComponentes
        SET modulo = @modulo,
            componente = @componente,
            orden = @orden,
            separador = @separador,
            valorFijo = @valorFijo,
            esPlaceholder = @esPlaceholder
        WHERE id = @id AND clienteId = @clienteId
      `);
    return res.json({ message: 'Configuración actualizada exitosamente.' });
  } catch (error) {
    console.error('Error en updateNomenclatura:', error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
}

/**
 * Elimina una configuración de nomenclatura para un cliente.
 * Se espera recibir en el body:
 * {
 *   "id": 5,
 *   "clienteId": 2
 * }
 */
async function deleteNomenclatura(req, res) {
  const { id, clienteId } = req.body;
  if (!id || !clienteId) {
    return res.status(400).json({ error: 'Se requieren los campos id y clienteId.' });
  }
  try {
    const pool = await connectDB();
    const check = await pool.request()
      .input('id', sql.Int, id)
      .input('clienteId', sql.Int, clienteId)
      .query('SELECT id FROM NomenclaturaComponentes WHERE id = @id AND clienteId = @clienteId');
    if (!check.recordset || check.recordset.length === 0) {
      return res.status(404).json({ error: 'Configuración no encontrada.' });
    }
    await pool.request()
      .input('id', sql.Int, id)
      .input('clienteId', sql.Int, clienteId)
      .query('DELETE FROM NomenclaturaComponentes WHERE id = @id AND clienteId = @clienteId');
    return res.json({ message: 'Configuración eliminada exitosamente.' });
  } catch (error) {
    console.error('Error en deleteNomenclatura:', error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
}

/**
 * Crea múltiples configuraciones de nomenclatura para un cliente.
 * Se espera recibir en el body:
 * {
 *   "nomenclaturas": [
 *     { "clienteId": 2, "modulo": "transferencia", "componente": "prefijo", "orden": 1, "separador": "-", "valorFijo": "TR", "esPlaceholder": false },
 *     { "clienteId": 2, "modulo": "transferencia", "componente": "ubicacionId", "orden": 2, "separador": "-", "esPlaceholder": true },
 *     { "clienteId": 2, "modulo": "transferencia", "componente": "anio", "orden": 3, "separador": "", "esPlaceholder": true },
 *     { "clienteId": 2, "modulo": "transferencia", "componente": "mes", "orden": 4, "separador": "", "esPlaceholder": true },
 *     { "clienteId": 2, "modulo": "transferencia", "componente": "dia", "orden": 5, "separador": "-", "esPlaceholder": true },
 *     { "clienteId": 2, "modulo": "transferencia", "componente": "secuencia", "orden": 6, "separador": "", "esPlaceholder": true }
 *   ]
 * }
 */
async function bulkCreateNomenclaturas(req, res) {
  try {
    const { nomenclaturas } = req.body;
    if (!nomenclaturas || !Array.isArray(nomenclaturas) || nomenclaturas.length === 0) {
      return res.status(400).json({ error: 'Se requiere un array de nomenclaturas.' });
    }
    const pool = await connectDB();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    try {
      const results = [];
      for (const nom of nomenclaturas) {
        const { clienteId, modulo, componente, orden, separador, valorFijo, esPlaceholder } = nom;
        if (!clienteId || !modulo || !componente || typeof orden === 'undefined' || typeof separador === 'undefined' || typeof esPlaceholder === 'undefined') {
          throw new Error('Faltan campos obligatorios en uno de los registros.');
        }
        const result = await transaction.request()
          .input('clienteId', sql.Int, clienteId)
          .input('modulo', sql.NVarChar, modulo)
          .input('componente', sql.NVarChar, componente)
          .input('orden', sql.Int, orden)
          .input('separador', sql.NVarChar, separador)
          .input('valorFijo', sql.NVarChar, valorFijo || '')
          .input('esPlaceholder', sql.Bit, esPlaceholder)
          .query(`
            INSERT INTO NomenclaturaComponentes (clienteId, modulo, componente, orden, separador, valorFijo, esPlaceholder)
            VALUES (@clienteId, @modulo, @componente, @orden, @separador, @valorFijo, @esPlaceholder);
            SELECT SCOPE_IDENTITY() AS insertedId;
          `);
        results.push({ ...nom, insertedId: result.recordset[0].insertedId });
      }
      await transaction.commit();
      return res.status(201).json({ message: 'Nomenclaturas creadas exitosamente.', results });
    } catch (err) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error("Error al hacer rollback:", rollbackError.message);
      }
      console.error("Error en bulkCreateNomenclaturas:", err.message);
      return res.status(500).json({ error: 'Error al crear nomenclaturas: ' + err.message });
    }
  } catch (error) {
    console.error("Error interno en bulkCreateNomenclaturas:", error.message);
    return res.status(500).json({ error: 'Error interno del servidor: ' + error.message });
  }
}

/**
 * Genera la plantilla de referencia a partir de la configuración en la tabla NomenclaturaComponentes.
 * Se espera recibir en el body:
 * {
 *   "modulo": "transferencia",
 *   "datos": {
 *     "ubicacionId": "501",
 *     "anio": "2025",
 *     "mes": "03",
 *     "dia": "21",
 *     "secuencia": "001"
 *     // Otros valores pueden incluirse si se definieron en la configuración.
 *   }
 * }
 */
async function generarReferencia(req, res, next) {
  try {
    const { modulo, datos } = req.body;
    if (!modulo || !datos) {
      return res.status(400).json({ error: "Se requieren los campos 'modulo' y 'datos'." });
    }
    
    const pool = await connectDB();
    // Consultar la configuración para el módulo
    const result = await pool.request()
      .input('modulo', sql.NVarChar, modulo)
      .query(`
        SELECT componente, orden, separador, valorFijo, esPlaceholder
        FROM NomenclaturaComponentes
        WHERE modulo = @modulo
        ORDER BY orden ASC
      `);
      
    if (!result.recordset || result.recordset.length === 0) {
      return res.status(404).json({ error: "No se encontró configuración para el módulo especificado." });
    }
    
    let plantillaGenerada = "";
    result.recordset.forEach((comp) => {
      let valor = "";
      if (comp.esPlaceholder === 1) {
        // Si es placeholder, se busca el valor en 'datos'
        valor = datos[comp.componente] || "";
      } else {
        // Si es un valor fijo, se utiliza el valorFijo
        valor = comp.valorFijo;
      }
      plantillaGenerada += valor + comp.separador;
    });
    
    // Remover el separador final, si existe (asumiendo que se usa '-' como separador)
    if (plantillaGenerada.endsWith("-")) {
      plantillaGenerada = plantillaGenerada.slice(0, -1);
    }
    
    return res.status(200).json({ plantilla: plantillaGenerada });
  } catch (error) {
    console.error('Error en generarReferencia:', error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
}

module.exports = {
  getAllNomenclaturas,
  getNomenclaturaById,
  createNomenclatura,
  updateNomenclatura,
  deleteNomenclatura,
  bulkCreateNomenclaturas,
  generarReferencia
};
