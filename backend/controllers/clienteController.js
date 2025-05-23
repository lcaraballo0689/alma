// controllers/clienteController.js
const sql = require("mssql");

module.exports = {
  // Obtener todos los registros de Cliente
  getAll: async (req, res) => {
    try {
      const pool = await sql.connect(process.env.DB_CONNECTION);
      const result = await pool.request().query(`
        SELECT TOP (1000)
          [id],
          [nombre],
          [telefono],
          [nit],
          [ansDevolucion],
          [ansEspecial],
          [ansNormal],
          [ansUrgente]
        FROM dbo.Cliente
        ORDER BY id DESC
      `);
      return res.json(result.recordset);
    } catch (error) {
      console.error("Error en getAll Cliente:", error);
      return res.status(500).json({ error: "Error interno del servidor." });
    }
  },

  // Obtener un registro de Cliente por id
  getOne: async (req, res) => {
    const { id } = req.params;
    try {
      const pool = await sql.connect(process.env.DB_CONNECTION);
      const result = await pool
        .request()
        .input("id", sql.Int, id)
        .query(`
          SELECT 
            [id],
            [nombre],
            [telefono],
            [nit],
            [ansDevolucion],
            [ansEspecial],
            [ansNormal],
            [ansUrgente]
          FROM dbo.Cliente
          WHERE id = @id
        `);
      if (result.recordset.length === 0) {
        return res.status(404).json({ error: "Cliente no encontrado." });
      }
      return res.json(result.recordset[0]);
    } catch (error) {
      console.error("Error en getOne Cliente:", error);
      return res.status(500).json({ error: "Error interno del servidor." });
    }
  },

  // Crear un nuevo registro de Cliente
  create: async (req, res) => {
    const {
      nombre,
      telefono,
      nit,
      ansDevolucion,
      ansEspecial,
      ansNormal,
      ansUrgente,
    } = req.body;

    // Validación básica
    if (!nombre || !telefono || !nit) {
      return res
        .status(400)
        .json({ error: "Faltan campos obligatorios (nombre, teléfono, nit)." });
    }

    // Convertir a enteros o asignar valor por defecto (0)
    const ansDev = parseInt(ansDevolucion, 10) || 0;
    const ansEsp = parseInt(ansEspecial, 10) || 0;
    const ansNor = parseInt(ansNormal, 10) || 0;
    const ansUrg = parseInt(ansUrgente, 10) || 0;

    try {
      const pool = await sql.connect(process.env.DB_CONNECTION);
      const result = await pool
        .request()
        .input("nombre", sql.NVarChar(1000), nombre)
        .input("telefono", sql.NVarChar(1000), telefono)
        .input("nit", sql.NVarChar(1000), nit)
        .input("ansDevolucion", sql.Int, ansDev)
        .input("ansEspecial", sql.Int, ansEsp)
        .input("ansNormal", sql.Int, ansNor)
        .input("ansUrgente", sql.Int, ansUrg)
        .query(`
          INSERT INTO dbo.Cliente
          ([nombre], [telefono], [nit], [ansDevolucion], [ansEspecial], [ansNormal], [ansUrgente])
          VALUES
          (@nombre, @telefono, @nit, @ansDevolucion, @ansEspecial, @ansNormal, @ansUrgente);
          SELECT SCOPE_IDENTITY() as insertedId;
        `);
      const newId = result.recordset[0].insertedId;
      return res.status(201).json({ message: "Cliente creado", id: newId });
    } catch (error) {
      console.error("Error en create Cliente:", error);
      return res.status(500).json({ error: "Error interno del servidor." });
    }
  },

  // Actualizar un registro de Cliente
  update: async (req, res) => {
    const { id } = req.params;
    const {
      nombre,
      telefono,
      nit,
      ansDevolucion,
      ansEspecial,
      ansNormal,
      ansUrgente,
    } = req.body;

    try {
      const pool = await sql.connect(process.env.DB_CONNECTION);
      // Verificar existencia
      const check = await pool.request()
        .input("id", sql.Int, id)
        .query(`SELECT id FROM dbo.Cliente WHERE id = @id`);

      if (check.recordset.length === 0) {
        return res.status(404).json({ error: "Cliente no encontrado." });
      }

      const ansDev = parseInt(ansDevolucion, 10) || 0;
      const ansEsp = parseInt(ansEspecial, 10) || 0;
      const ansNor = parseInt(ansNormal, 10) || 0;
      const ansUrg = parseInt(ansUrgente, 10) || 0;

      await pool.request()
        .input("id", sql.Int, id)
        .input("nombre", sql.NVarChar(1000), nombre)
        .input("telefono", sql.NVarChar(1000), telefono)
        .input("nit", sql.NVarChar(1000), nit)
        .input("ansDevolucion", sql.Int, ansDev)
        .input("ansEspecial", sql.Int, ansEsp)
        .input("ansNormal", sql.Int, ansNor)
        .input("ansUrgente", sql.Int, ansUrg)
        .query(`
          UPDATE dbo.Cliente
          SET
            nombre = @nombre,
            telefono = @telefono,
            nit = @nit,
            ansDevolucion = @ansDevolucion,
            ansEspecial = @ansEspecial,
            ansNormal = @ansNormal,
            ansUrgente = @ansUrgente
          WHERE id = @id
        `);

      return res.json({ message: "Cliente actualizado exitosamente." });
    } catch (error) {
      console.error("Error en update Cliente:", error);
      return res.status(500).json({ error: "Error interno del servidor." });
    }
  },

  // Eliminar un registro de Cliente junto con sus relaciones dependientes
  delete: async (req, res) => {
    const { id } = req.params;
    try {
      const pool = await sql.connect(process.env.DB_CONNECTION);

      // 1. Verificar existencia del cliente
      const check = await pool.request()
        .input("id", sql.Int, id)
        .query(`SELECT id FROM dbo.Cliente WHERE id = @id`);

      if (check.recordset.length === 0) {
        return res.status(404).json({ error: "Cliente no encontrado." });
      }

      // 2. Eliminar registros relacionados
      await pool.request()
        .input("clienteId", sql.Int, id)
        .query(`
        DELETE FROM dbo.Consecutivos WHERE clienteId = @clienteId;
        DELETE FROM dbo.HorasLaborales WHERE clienteId = @clienteId;
      `);

      // 3. Eliminar el cliente
      await pool.request()
        .input("id", sql.Int, id)
        .query(`DELETE FROM dbo.Cliente WHERE id = @id`);

      return res.json({ message: "Cliente eliminado exitosamente." });

    } catch (error) {
      console.error("Error en delete Cliente:", error);
      return res.status(500).json({ error: "Error interno del servidor." });
    }
  }

};
