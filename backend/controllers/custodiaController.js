/**
 * Controlador para la gestión de la tabla dbo.Custodia.
 * Proporciona métodos CRUD para interactuar con los registros de Custodia.
 * 
 * @module controllers/custodiaController
 */

// controllers/custodiaController.js
const sql = require('mssql');
// Asegúrate de tener un archivo de config db, o variables de entorno para la conexión
// Ejemplo: const dbConfig = require('../config/db'); // si usas un dbConfig exportado

// Métodos CRUD para la tabla dbo.Custodia
module.exports = {

  /**
  * Obtener todos los registros de la tabla Custodia.
  * Realiza una consulta SQL para obtener todos los registros, incluyendo un LEFT JOIN con la tabla Bodega para obtener el nombre de la bodega.
  * 
  * @async
  * @function getAll
  * @param {Object} req - Objeto de solicitud HTTP.
  * @param {Object} res - Objeto de respuesta HTTP.
  * @returns {Promise<void>} Devuelve una respuesta JSON con todos los registros de Custodia.
  * @throws {Error} Devuelve un error 500 si ocurre un error en la consulta SQL.
  */
  getAll: async (req, res) => {
    try {
      const pool = await sql.connect(process.env.DB_CONNECTION);

      // Se obtienen los parámetros de paginación desde el body
      const page = parseInt(req.body.page) || 1;
      const pageSize = parseInt(req.body.pageSize) || 100;
      const offset = (page - 1) * pageSize;

      // Consulta para obtener los registros paginados
      const result = await pool.request()
        .input('Offset', sql.Int, offset)
        .input('PageSize', sql.Int, pageSize)
        .query(`
          SELECT 
            c.[id],
            c.[bodega_id],
            b.[nombre] AS bodega, 
            c.[item],
            c.[ubicacionId],
            c.[clienteId],
            c.[referencia1],
            c.[referencia2],
            c.[referencia3],
            c.[estado],
            c.[baja]
          FROM dbo.Custodia c
          LEFT JOIN dbo.Bodega b ON c.bodega_id = b.id
          ORDER BY c.id DESC
          OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
        `);

      // Consulta para obtener el total de registros
      // const countResult = await pool.request()
      //   .query(`SELECT COUNT(*) AS TotalCount FROM dbo.Custodia;`);

      return res.json({
        data: result.recordset,
        // totalCount: countResult.recordset[0].TotalCount,
        page,
        pageSize
      });
    } catch (error) {
      console.error('Error en getAll Custodia:', error);
      return res.status(500).json({ error: 'Error interno del servidor.' });
    }
  },




  /**
 * Obtener un registro de Custodia por su ID.
 * Realiza una consulta SQL para obtener un registro específico, incluyendo un LEFT JOIN con la tabla Bodega para obtener el nombre de la bodega.
 * 
 * @async
 * @function getOne
 * @param {Object} req - Objeto de solicitud HTTP.
 * @param {Object} res - Objeto de respuesta HTTP.
 * @returns {Promise<void>} Devuelve una respuesta JSON con el registro de Custodia encontrado.
 * @throws {Error} Devuelve un error 404 si no se encuentra el registro, o un error 500 si ocurre un error en la consulta SQL.
 */
  getOne: async (req, res) => {
    const { id } = req.params;
    try {
      const pool = await sql.connect(process.env.DB_CONNECTION);
      const result = await pool.request()
        .input('id', sql.Int, id)
        .query(`
          SELECT 
            c.[id],
            c.[bodega_id],
            b.[nombre] AS bodega,   -- Nombre de la bodega
            c.[item],
            c.[ubicacionId],
            c.[clienteId],
            c.[referencia1],
            c.[referencia2],
            c.[referencia3],
            c.[estado],
            c.[baja]
          FROM dbo.Custodia c
          LEFT JOIN dbo.Bodega b ON c.bodega_id = b.id
          WHERE c.id = @id
        `);

      if (result.recordset.length === 0) {
        return res.status(404).json({ error: 'No se encontró el registro de Custodia.' });
      }
      return res.json(result.recordset[0]);
    } catch (error) {
      console.error('Error en getOne Custodia:', error);
      return res.status(500).json({ error: 'Error interno del servidor.' });
    }
  },

  /**
   * Crear un nuevo registro en la tabla Custodia.
   * Realiza una inserción SQL con los datos proporcionados en el cuerpo de la solicitud.
   * 
   * @async
   * @function create
   * @param {Object} req - Objeto de solicitud HTTP.
   * @param {Object} res - Objeto de respuesta HTTP.
   * @returns {Promise<void>} Devuelve una respuesta JSON con el ID del nuevo registro creado.
   * @throws {Error} Devuelve un error 400 si faltan campos obligatorios, o un error 500 si ocurre un error en la consulta SQL.
   */
  create: async (req, res) => {
    const {
      bodega_id,
      item,
      ubicacionId,
      clienteId,
      referencia1,
      referencia2,
      referencia3,
      estado,
      baja
    } = req.body;

    // Validaciones mínimas (ajusta según tu lógica)
    if (!bodega_id || !item) {
      return res.status(400).json({ error: 'Faltan campos obligatorios (bodega_id, item).' });
    }

    try {
      const pool = await sql.connect(process.env.DB_CONNECTION);
      const result = await pool.request()
        .input('bodega_id', sql.Int, bodega_id)
        .input('item', sql.VarChar, item)
        .input('ubicacionId', sql.Int, ubicacionId || null)
        .input('clienteId', sql.Int, clienteId || null)
        .input('referencia1', sql.VarChar, referencia1 || '')
        .input('referencia2', sql.VarChar, referencia2 || '')
        .input('referencia3', sql.VarChar, referencia3 || '')
        .input('estado', sql.VarChar, estado || 'disponible')
        .input('baja', sql.Bit, baja || false)
        .query(`INSERT INTO dbo.Custodia 
                (bodega_id, item, ubicacionId, clienteId, referencia1, referencia2, referencia3, estado, baja)
                VALUES (@bodega_id, @item, @ubicacionId, @clienteId, @referencia1, @referencia2, @referencia3, @estado, @baja);
                SELECT SCOPE_IDENTITY() as insertedId;`);

      const newId = result.recordset[0].insertedId;
      return res.status(201).json({ message: 'Registro de Custodia creado', id: newId });
    } catch (error) {
      console.error('Error en create Custodia:', error);
      return res.status(500).json({ error: 'Error interno del servidor.' });
    }
  },


  /**
 * Actualizar un registro existente en la tabla Custodia.
 * Realiza una actualización SQL con los datos proporcionados en el cuerpo de la solicitud.
 * 
 * @async
 * @function update
 * @param {Object} req - Objeto de solicitud HTTP.
 * @param {Object} res - Objeto de respuesta HTTP.
 * @returns {Promise<void>} Devuelve una respuesta JSON indicando que el registro fue actualizado exitosamente.
 * @throws {Error} Devuelve un error 404 si no se encuentra el registro, o un error 500 si ocurre un error en la consulta SQL.
 */
  update: async (req, res) => {
    const { id } = req.params;
    const {
      bodega_id,
      item,
      ubicacionId,
      clienteId,
      referencia1,
      referencia2,
      referencia3,
      estado,
      baja
    } = req.body;

    try {
      const pool = await sql.connect(process.env.DB_CONNECTION);
      // Verificar si existe
      const check = await pool.request()
        .input('id', sql.Int, id)
        .query(`SELECT id FROM dbo.Custodia WHERE id = @id`);
      if (check.recordset.length === 0) {
        return res.status(404).json({ error: 'Registro de Custodia no encontrado.' });
      }

      // Actualizar
      await pool.request()
        .input('id', sql.Int, id)
        .input('bodega_id', sql.Int, bodega_id)
        .input('item', sql.VarChar, item)
        .input('ubicacionId', sql.Int, ubicacionId)
        .input('clienteId', sql.Int, clienteId)
        .input('referencia1', sql.VarChar, referencia1)
        .input('referencia2', sql.VarChar, referencia2)
        .input('referencia3', sql.VarChar, referencia3)
        .input('estado', sql.VarChar, estado)
        .input('baja', sql.Bit, baja)
        .query(`UPDATE dbo.Custodia
                SET bodega_id = @bodega_id,
                    item = @item,
                    ubicacionId = @ubicacionId,
                    clienteId = @clienteId,
                    referencia1 = @referencia1,
                    referencia2 = @referencia2,
                    referencia3 = @referencia3,
                    estado = @estado,
                    baja = @baja
                WHERE id = @id`);

      return res.json({ message: 'Registro de Custodia actualizado exitosamente.' });
    } catch (error) {
      console.error('Error en update Custodia:', error);
      return res.status(500).json({ error: 'Error interno del servidor.' });
    }
  },

  /**
 * Obtener todos los registros de la tabla Custodia filtrados por clienteId.
 * Realiza una consulta SQL para obtener los registros asociados a un cliente específico.
 * 
 * @async
 * @function getByClienteId
 * @param {Object} req - Objeto de solicitud HTTP.
 * @param {Object} res - Objeto de respuesta HTTP.
 * @returns {Promise<void>} Devuelve una respuesta JSON con los registros filtrados por clienteId.
 * @throws {Error} Devuelve un error 400 si no se proporciona clienteId, un error 404 si no hay registros, o un error 500 si ocurre un error en la consulta SQL.
 */
  getByClienteId: async (req, res) => {
    const { clienteId, tipo, page, pageSize } = req.body; // Se espera clienteId, tipo (filtro), page y pageSize

    if (!clienteId) {
      return res.status(400).json({ error: 'El clienteId es obligatorio.' });
    }

    // Valores por defecto para la paginación
    const pageNumber = parseInt(page, 10) || 1;
    const size = parseInt(pageSize, 10) || 100;
    const offset = (pageNumber - 1) * size;

    try {
      const pool = await sql.connect(process.env.DB_CONNECTION);

      // Construir la cláusula WHERE.
      // Si se recibe el parámetro 'tipo', se filtra por estado:
      // - "Disponible para Prestar" => estado = 'disponible'
      // - "Disponible para Devolver" => estado = 'entregado'
      // Si no se pasa 'tipo' o es "Inventario", se muestra todo.
      let whereClause = 'WHERE c.clienteId = @clienteId';
      if (tipo === 'disponible') {
        whereClause += " AND c.estado = 'DISPONIBLE'";
      } else if (tipo === 'entregado') {
        whereClause += " AND c.estado = 'ENTREGADO'";
      }


      // Consulta para obtener los registros paginados
      const query = `
        SELECT 
          c.[id],
          c.[bodega_id],
          b.[nombre] AS bodega,
          c.[item],
          c.[ubicacionId],
          c.[clienteId],
          c.[referencia1],
          c.[referencia2],
          c.[referencia3],
          c.[estado],
          c.[baja]
        FROM dbo.Custodia c
        LEFT JOIN dbo.Bodega b ON c.bodega_id = b.id
        ${whereClause}
        ORDER BY c.id DESC
        OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY;
      `;
      const result = await pool.request()
        .input('clienteId', sql.Int, clienteId)
        .input('offset', sql.Int, offset)
        .input('pageSize', sql.Int, size)
        .query(query);

      // Consulta para obtener el total de registros con el filtro aplicado.
      const countQuery = `
        SELECT COUNT(*) AS TotalCount 
        FROM dbo.Custodia c 
        ${whereClause};
      `;
      const countResult = await pool.request()
        .input('clienteId', sql.Int, clienteId)
        .query(countQuery);

      if (result.recordset.length === 0) {
        return res.status(404).json({ error: 'No se encontraron registros de Custodia para este cliente.' });
      }

      return res.json({
        totalCount: countResult.recordset[0].TotalCount,
        data: result.recordset,
        page: pageNumber,
        pageSize: size
      });
    } catch (error) {
      console.error('Error en getByClienteId Custodia:', error);
      return res.status(500).json({ error: 'Error interno del servidor.' });
    }
  },


  /**
 * Obtener los conteos de Custodia por clienteId y estado (con estados en mayúsculas).
 * Se agrupa directamente en el query convirtiendo el valor de "estado" a mayúsculas,
 * lo que permite que el front-end reciba ya los datos consolidados sin hacer procesamiento adicional.
 *
 * @async
 * @function getCountsByCliente
 * @param {Object} req - Objeto de solicitud HTTP, espera que en el body se incluya el clienteId.
 * @param {Object} res - Objeto de respuesta HTTP.
 * @returns {Promise<void>} Devuelve un JSON con el total de custodias y los conteos por cada estado.
 * @throws {Error} Devuelve un error 400 si no se proporciona el clienteId o un error 500 en caso de fallo interno.
 */
getCountsByCliente: async (req, res) => {
  try {
    const { clienteId } = req.body;

    // Validamos que se envíe el clienteId
    if (!clienteId) {
      return res.status(400).json({ error: 'El clienteId es obligatorio.' });
    }

    const pool = await sql.connect(process.env.DB_CONNECTION);

    // La consulta convierte el campo estado a mayúsculas y lo agrupa para obtener el conteo.
    const result = await pool.request()
      .input('clienteId', sql.Int, clienteId)
      .query(`
        SELECT 
          UPPER(c.estado) AS estado,
          COUNT(*) AS count
        FROM dbo.Custodia c
        WHERE c.clienteId = @clienteId
        GROUP BY UPPER(c.estado);
      `);

    // Variables para almacenar los conteos según estado.
    let CUSTODIAS = 0;
    let DISPONIBLE = 0;
    let DEVOLUCIONES = 0;
    let SOLICITADA = 0;
    let ENTREGADO = 0;

    // Recorremos los resultados y asignamos los valores.
    result.recordset.forEach((row) => {
      CUSTODIAS += row.count;
      switch (row.estado) {
        case 'DISPONIBLE':
          DISPONIBLE = row.count;
          break;
        case 'DEVOLUCION EN PROCESO':
          DEVOLUCIONES = row.count;
          break;
        case 'SOLICITADA':
          SOLICITADA = row.count;
          break;
        case 'ENTREGADO':
          ENTREGADO = row.count;
          break;
        default:
          // Si hay algún estado no contemplado, se ignora o puedes agregar un manejo especial.
          break;
      }
    });

    // Se retorna un objeto JSON con la información procesada.
    return res.json({
      CUSTODIAS,
      DISPONIBLE,
      DEVOLUCIONES,
      SOLICITADA,
      ENTREGADO,
    });
  } catch (error) {
    console.error('Error en getCountsByCliente Custodia:', error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
},



  /**
   * Eliminar un registro de la tabla Custodia.
   * Realiza una eliminación física del registro en la base de datos.
   * 
   * @async
   * @function delete
   * @param {Object} req - Objeto de solicitud HTTP.
   * @param {Object} res - Objeto de respuesta HTTP.
   * @returns {Promise<void>} Devuelve una respuesta JSON indicando que el registro fue eliminado exitosamente.
   * @throws {Error} Devuelve un error 404 si no se encuentra el registro, o un error 500 si ocurre un error en la consulta SQL.
   */
  delete: async (req, res) => {
    const { id } = req.params;
    try {
      const pool = await sql.connect(process.env.DB_CONNECTION);
      // Verificar si existe
      const check = await pool.request()
        .input('id', sql.Int, id)
        .query(`SELECT id FROM dbo.Custodia WHERE id = @id`);
      if (check.recordset.length === 0) {
        return res.status(404).json({ error: 'Registro de Custodia no encontrado.' });
      }

      // Eliminar físicamente o actualizar el campo baja
      await pool.request()
        .input('id', sql.Int, id)
        .query(`DELETE FROM dbo.Custodia WHERE id = @id`);

      // Si en vez de borrar físicamente deseas una "baja lógica", podrías hacer:
      // .query(`UPDATE dbo.Custodia SET baja = 1 WHERE id = @id`);

      return res.json({ message: 'Registro de Custodia eliminado exitosamente.' });
    } catch (error) {
      console.error('Error en delete Custodia:', error);
      return res.status(500).json({ error: 'Error interno del servidor.' });
    }
  },
};
