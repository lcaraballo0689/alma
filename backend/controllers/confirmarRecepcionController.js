
/**
 * Confirma la recepción de una entrega actualizando varias tablas en la base de datos.
 * 
 * Este controlador maneja la confirmación de recepción de una entrega, asegurándose de que se utilice el método HTTP PUT.
 * Realiza varias actualizaciones en las tablas de la base de datos relacionadas con la entrega, los préstamos y la custodia.
 * 
 * @param {Object} req - Objeto de solicitud HTTP.
 * @param {string} req.method - Método HTTP de la solicitud.
 * @param {Object} req.body - Cuerpo de la solicitud HTTP.
 * @param {number} req.body.entregaId - ID de la entrega.
 * @param {string} req.body.estado - Estado de la entrega.
 * @param {string} req.body.usuario - Usuario que confirma la recepción.
 * @param {Object} res - Objeto de respuesta HTTP.
 * 
 * @returns {Promise<void>} - Respuesta HTTP con el resultado de la operación.
 * 
 * @throws {Error} - Error general del servidor o durante la transacción.
 * 
 * @description
 * Este controlador realiza las siguientes operaciones:
 * 1. Valida que el método HTTP utilizado sea PUT.
 * 2. Extrae los datos necesarios del cuerpo de la solicitud.
 * 3. Realiza validaciones básicas para asegurarse de que los campos obligatorios estén presentes.
 * 4. Conecta a la base de datos y comienza una transacción.
 * 5. Actualiza la tabla Devolucion registrando el estado en el campo observaciones.
 * 6. Actualiza la tabla Prestamos con el estado, el usuario de recolección y la fecha de recolección.
 * 7. Obtiene los custodiaIds de todos los préstamos asociados a la entrega.
 * 8. Actualiza la tabla Custodia para los custodiaIds obtenidos.
 * 9. Confirma la transacción si todas las operaciones son exitosas.
 * 10. Realiza un rollback de la transacción en caso de que alguna operación falle.
 * 
 * @example
 * // Ejemplo de solicitud HTTP para confirmar la recepción de una entrega
 * const request = {
 *   method: "PUT",
 *   body: {
 *     entregaId: 123,
 *     estado: "Recibido",
 *     usuario: "usuario123"
 *   }
 * };
 * 
 * // Ejemplo de uso del controlador
 * confirmarRecepcion(request, response)
 *   .then(() => console.log("Operación completada"))
 *   .catch(error => console.error("Error:", error));
 */

//FIXME: REVISAR ESTE CÓDIGO PARA SABER A QUE MOMENTO DEL FLUJO DE LA APLICACIÓN PERTENECE
const { connectDB, sql } = require("../config/db");

exports.confirmarRecepcion = async (req, res) => {
  // Validar que se use el método PUT
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  // Extraer datos del cuerpo de la solicitud
  const { entregaId, estado, usuario } = req.body;


  // Validaciones básicas
  if (!entregaId || !estado) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }

  try {
    const pool = await connectDB();

    // Iniciar transacción
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // 1. Actualizar la tabla Devolucion: se registra el estado en el campo observaciones
      const txRequest1 = transaction.request();
      await txRequest1
        .input("entregaId", sql.Int, entregaId)
        .input("estado", sql.NVarChar, estado)
        .query(`
          UPDATE Devolucion
          SET observaciones = @estado
          WHERE id = @entregaId
        `);

      // 2. Actualizar la tabla Prestamos: estado, usuario de recolección y fecha de recolección
      const txRequest2 = transaction.request();
      await txRequest2
        .input("estado", sql.NVarChar, estado)
        .input("usuario", sql.NVarChar, usuario)
        .input("entregaId", sql.Int, entregaId)
        .query(`
          UPDATE Prestamos
          SET estado = @estado,
              usuarioRecoleccion = @usuario,
              FechaRecoleccion = GETDATE()
          WHERE entregaId = @entregaId
        `);

      // 3. Obtener los custodiaIds de todos los préstamos asociados a la entrega
      const txRequest3 = transaction.request();
      const prestamoCustResult = await txRequest3
        .input("entregaId", sql.Int, entregaId)
        .query(`
          SELECT custodiaId FROM Prestamos
          WHERE entregaId = @entregaId
        `);
      const custodiaIds = prestamoCustResult.recordset.map(row => row.custodiaId);

      // 4. Actualizar la tabla Custodia para esos custodiaIds (si se encontraron)
      if (custodiaIds.length > 0) {
        const idList = custodiaIds.join(",");
        const txRequest4 = transaction.request();
        await txRequest4
          .input("estado", sql.NVarChar, estado)
          .query(`
            UPDATE Custodia
            SET estado = @estado
            WHERE id IN (${idList})
          `);
      }

      // Confirmar la transacción
      await transaction.commit();

      return res.status(200).json({
        message: "Entrega confirmada exitosamente"
      });
    } catch (txError) {
      // Si algo falla en las consultas, hacemos rollback
      await transaction.rollback();
      console.error("Error en transacción:", txError);
      return res.status(500).json({ error: "Error interno durante la transacción" });
    }
  } catch (error) {
    // Manejo de errores generales de conexión o de la transacción
    console.error("Error:", error);
    return res.status(500).json({ error: "Error interno del servidor", details: error });
  }
};
