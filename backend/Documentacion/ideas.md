crear una sala por medio de ws para las notificacioes para que apenas el usuario haga login  ingrese  y al hacer logout se salga con el fin de recibir notificacioens de lso movimientos de las cajas en tiempo real 



al crear una solicitud crear un codigo qr que estara asociado a dicha solicitud para que cada vez que se escaneee segun el estado en el ue se encuentre la solicitud se pueda ir cambiando de estado y actualizando la bbdd generando notificaciones en tiempo real por medio de la sala de notiicaciones del ws usando socket.io se tiene que tener en cuenta que hay 4 tipos de solicitudes: 



    (    

    - 1 transferencia: 

        el cliente inicia una solicitud de recolecion de cajas para incluirlas en el stock de custodia o almacenaje en la bodega este tiene un flujo que cuenta con los siguientes estados o pasos:  

            - 1.1 crear solicitud (Estado: solicitud creada)  "se genera el codigo qr automaticamente al crear la solicitud"

            - 1.2 asignar transportador (Estado: asignado a tansportador) "no requiere escaneo"

            - 1.3 iniciar recoleccion (Estado: en proceso de recoleccion) "requiere escaneo de codigo qr por parte del transportador"

            - 1.4 recogido (el transportador recoge las cajas en la direccion del cliente) (Estado: recogido) "requiere escaneo del codigo qr por parte del transportador" 

            - 1.5 recepcion en bodega(momento donde la bodega le recibe la entrega las cajas al transportador) (Estado: en bodega) "requiere escane qr por parte del personal de bodega"

            - 1.6 asignacion de ubicacion en bodega (Estado: completado). "no requiere escaneo"

  

        con esto se completaria el flujo de trnasferencia,

        

    - 2 prestamo:  

        el cliente realiza una solicitud de prestamo de cajas la cual tendra los siguientes estados: 

            - 2.1 crear solicitud de prestamo (Estado: solicitud creada) "se genera el codigo qr automaticamente al crear la solicitud"

            - 2.2 asignar trnasportador para entrega (Estado: asignado a tansportador) "no requiere escaneo"

            - 2.3 inicio de porceso de entrega (Estado: en proceso de entrega) "requiere escaneo del codigo qr por parte del transportador"

            - 2.4 entrega del transportador al cliente (Estado: entregado) "requiere escaneo del codigo qr por parte del transportador" 

            - 2.5 cliente confirma recepcion de caja(s) (Estado: completado). "puede o no requiere escaneo del codigo qr por parte del transportador"

  

        con esto se completaria el flujo de prestamo.



    - 3 devolucion: 

        el cliente realiza una solicitud de devolucion para devolver las cajas que tiene en calidad de prestamo para retornarlas a la bodega la cual podra tener los siguientes estados o pasos:

            - 3.1 crear solicitud de devolucion (Estado: solicitud creada) "se genera el codigo qr automaticamente al crear la solicitud"

            - 3.2 asignar trnasportador para recoleccion (Estado: asignado a tansportador)

            - 3.3 inicio de porceso de recoleccion (Estado: en proceso de recoleccion)

            - 3.4 el transportador recoge las cajas en la direccion del cliente (Estado: recogido)

            - 3.5 recepcion en bodega(momento donde la bodega le recibe la devolucion de las cajas al transportador) (Estado: completado), 

  

        con esto se completaria el flujo de devolucion,



    - 4 desarchive: 

        el cliente realiza una solicitud de desarchive de cajas que se encuentran en bodega, este tipo de solicitud desincorpora de la bodega las cajas que se encuentran en custodias para ser devueltas al cliente sin retorno a la bodega la cual podra tener los siguientes paso:

            - 4.1 crear solicitud de desarchive (Estado: solicitud creada) "se genera el codigo qr automaticamente al crear la solicitud"

            - 4.2 asignar trnasportador para entrega (Estado: asignado a tansportador) "no requiere escaneo"

            - 2.3 inicio de porceso de entrega (Estado: en proceso de entrega) "requiere escaneo de codigo qr por parte del transportador"

            - 4.4 entrega del transportador al cliente (Estado: entregado) "requiere escaneo del codigo qr por parte del transportador" 

            - 4.5 cliente confirma recepcion de caja(s) (Estado: completado). "puede o no requiere escaneo del codigo qr por parte del transportador ya que puede confirmar manualmente desde la plataforma o escaneando el codigo qr"

        con esto se completaria el flujo de devolucion,

    )



    



 mejora este prompt  teniendo en consideracion lo siguiente ya existe este codigo  /* eslint-disable no-console */

require("dotenv").config();

const { connectDB, sql } = require("../config/db");

const emailService = require("../services/email.service");



/**

 * Función auxiliar para obtener el correo del cliente.

 * @param {Object} pool - Conexión a la base de datos

 * @param {number} clienteId - ID del cliente

 * @returns {string} Correo del cliente

 */

async function obtenerCorreoCliente(pool, clienteId) {

  const result = await pool.request().input("clienteId", sql.Int, clienteId)

    .query(`

      SELECT TOP 1 email

      FROM Usuario

      WHERE clienteId = @clienteId

      ORDER BY id ASC

    `);



  return result.recordset.length > 0

    ? result.recordset[0].email

    : process.env.DEFAULT_EMAIL || "correo@por-defecto.com";

}



/**

 * @description Crea una nueva solicitud de transferencia (POST /api/client/transferencias/crear)

 * Campos obligatorios:

 * - clienteId

 * - usuarioId

 * - items (array), en cada item se requiere al menos la propiedad referencia2

 * Se incluye referencia3 de forma opcional.

 *

 * @param {Object} req - Objeto de la petición

 * @param {Object} res - Objeto de la respuesta

 * @param {Function} next - Middleware para manejo de errores

 */

async function createTransferencia(req, res, next) {

  // Validar que se reciba clienteId, usuarioId y un array de items

  if (

    !req.body ||

    !req.body.clienteId ||

    !req.body.usuarioId ||

    !req.body.items ||

    !Array.isArray(req.body.items)

  ) {

    return res.status(400).json({

      error:

        "Se requieren los campos: clienteId, usuarioId y un array de items.",

    });

  }



  // Validar que cada item tenga la propiedad referencia2

  for (const [index, item] of req.body.items.entries()) {

    if (!item.referencia2) {

      return res.status(400).json({

        error: `El item en la posición ${index} debe incluir al menos la propiedad referencia2.`,

      });

    }

  }



  console.log("Body createTransferencia:", req.body);



  let transaction;

  try {

    // Conexión y transacción

    const pool = await connectDB();

    transaction = new sql.Transaction(pool);

    await transaction.begin();



    // Extraer campos del body

    const { clienteId, usuarioId, items, observaciones } = req.body;

    const fechaSolicitud = new Date();



    // Obtener y actualizar el consecutivo de transporte para este cliente

    const requestConsecutivos = new sql.Request(transaction);

    requestConsecutivos.input("clienteId", sql.Int, clienteId);

    const resultCons = await requestConsecutivos.query(`

      SELECT ultimoTransporte

      FROM Consecutivos

      WHERE clienteId = @clienteId

    `);

    let ultimoTransporte = 0;

    if (resultCons.recordset.length > 0) {

      ultimoTransporte = resultCons.recordset[0].ultimoTransporte;

    }

    const nuevoConsecutivo = ultimoTransporte + 1;



    const requestUpdateCons = new sql.Request(transaction);

    requestUpdateCons

      .input("nuevoTransporte", sql.Int, nuevoConsecutivo)

      .input("clienteId", sql.Int, clienteId);

    await requestUpdateCons.query(`

      UPDATE Consecutivos

      SET ultimoTransporte = @nuevoTransporte

      WHERE clienteId = @clienteId

    `);



    // Insertar en SolicitudTransporte (incluyendo createdAt y updatedAt)

    const requestInsertSolicitud = new sql.Request(transaction);

    requestInsertSolicitud

      .input("clienteId", sql.Int, clienteId)

      .input("consecutivo", sql.Int, nuevoConsecutivo)

      .input("estado", sql.VarChar, "PENDIENTE")

      .input("fechaSolicitud", sql.DateTime, fechaSolicitud)

      .input("observaciones", sql.VarChar, observaciones || "")

      .input("createdAt", sql.DateTime, fechaSolicitud)

      .input("updatedAt", sql.DateTime, fechaSolicitud);

    const insertSol = await requestInsertSolicitud.query(`

      INSERT INTO SolicitudTransporte (clienteId, consecutivo, estado, fechaSolicitud, observaciones, createdAt, updatedAt)

      VALUES (@clienteId, @consecutivo, @estado, @fechaSolicitud, @observaciones, @createdAt, @updatedAt);

      SELECT SCOPE_IDENTITY() AS solicitudId;

    `);

    const solicitudId = insertSol.recordset[0].solicitudId;



    // Insertar detalles (DetalleSolicitudTransporte) para cada ítem

    for (const item of items) {

      const requestDetalle = new sql.Request(transaction);

      requestDetalle

        .input("solicitudTransporteId", sql.Int, solicitudId)

        .input("tipo", sql.VarChar, "CAJA")

        // referencia1 es opcional, referencia2 es obligatoria y referencia3 es opcional

        .input("referencia1", sql.VarChar, item.referencia1 || "")

        .input("referencia2", sql.VarChar, item.referencia2)

        .input("referencia3", sql.VarChar, item.referencia3 || "")

        .input("descripcion", sql.VarChar, item.descripcion || "")

        .input("estado", sql.VarChar, "PENDIENTE")

        .input("createdAt", sql.DateTime, fechaSolicitud)

        .input("updatedAt", sql.DateTime, fechaSolicitud);

      await requestDetalle.query(`

        INSERT INTO DetalleSolicitudTransporte

          (solicitudTransporteId, tipo, referencia1, referencia2, referencia3, descripcion, estado, createdAt, updatedAt)

        VALUES

          (@solicitudTransporteId, @tipo, @referencia1, @referencia2, @referencia3, @descripcion, @estado, @createdAt, @updatedAt);

      `);

    }



    // Confirmar la transacción

    await transaction.commit();



    // Enviar correos de notificación

    const correoCliente = await obtenerCorreoCliente(pool, clienteId);

    const correoBodega = process.env.BODEGA_EMAIL || "bodega@tuempresa.com";



    await emailService.sendEmail({

      to: correoCliente,

      subject: `Solicitud de Transferencia #${nuevoConsecutivo}`,

      text: `Estimado cliente, se ha creado la solicitud de transferencia #${nuevoConsecutivo}. Pronto nuestro personal se pondrá en contacto.`,

    });



    await emailService.sendEmail({

      to: correoBodega,

      subject: `Nueva Solicitud de Transferencia #${nuevoConsecutivo}`,

      text: `Se ha generado una nueva solicitud de transferencia con consecutivo #${nuevoConsecutivo}. Favor gestionar la recolección.`,

    });



    return res.status(201).json({

      message: "Solicitud de transferencia creada con éxito",

      solicitudId,

      consecutivo: nuevoConsecutivo,

    });

  } catch (error) {

    if (transaction) {

      await transaction.rollback();

    }

    return next(error);

  }

}



/**

 * @description Elimina una solicitud de transferencia (DELETE /api/client/transferencias/eliminar)

 * Solo se permitirá eliminar si la solicitud se encuentra en estado "PENDIENTE".

 * Campo obligatorio:

 * - solicitudId: ID de la solicitud de transferencia a eliminar.

 *

 * @param {Object} req - Objeto de la petición.

 * @param {Object} res - Objeto de la respuesta.

 * @param {Function} next - Middleware para manejo de errores.

 */

async function eliminarTransferencia(req, res, next) {

  let transaction;

  try {

    if (!req.body || !req.body.solicitudId) {

      return res.status(400).json({

        error: "El campo solicitudId es obligatorio y no puede estar vacío.",

      });

    }



    const { solicitudId } = req.body;

    const pool = await connectDB();



    // Validar que la solicitud se encuentre en estado "PENDIENTE"

    const checkResult = await pool

      .request()

      .input("solicitudId", sql.Int, solicitudId).query(`

        SELECT estado 

        FROM SolicitudTransporte 

        WHERE id = @solicitudId

      `);



    if (checkResult.recordset.length === 0) {

      return res.status(404).json({

        error: "No se encontró la solicitud de transferencia a eliminar.",

      });

    }



    const { estado } = checkResult.recordset[0];

    if (estado !== "PENDIENTE") {

      return res.status(400).json({

        error: "Solo se puede eliminar una solicitud en estado PENDIENTE.",

      });

    }



    // Iniciar transacción para eliminar detalles y cabecera

    transaction = new sql.Transaction(pool);

    await transaction.begin();



    // Eliminar los detalles asociados a la transferencia

    const requestDeleteDetalles = new sql.Request(transaction);

    requestDeleteDetalles.input("solicitudId", sql.Int, solicitudId);

    await requestDeleteDetalles.query(`

      DELETE FROM DetalleSolicitudTransporte

      WHERE solicitudTransporteId = @solicitudId

    `);



    // Eliminar la cabecera de la transferencia

    const requestDeleteSolicitud = new sql.Request(transaction);

    requestDeleteSolicitud.input("solicitudId", sql.Int, solicitudId);

    const resultDelete = await requestDeleteSolicitud.query(`

      DELETE FROM SolicitudTransporte

      WHERE id = @solicitudId

    `);



    if (resultDelete.rowsAffected[0] === 0) {

      await transaction.rollback();

      return res.status(404).json({

        error: "No se encontró la solicitud de transferencia a eliminar.",

      });

    }



    await transaction.commit();

    return res.status(200).json({

      message: "Solicitud de transferencia eliminada exitosamente.",

      solicitudId,

    });

  } catch (error) {

    if (transaction) await transaction.rollback();

    return next(error);

  }

}



/**

 * @description Consulta las solicitudes de transferencia para un cliente (POST /api/client/transferencias/consultar)

 * Campos obligatorios:

 * - clienteId

 * Opcionales:

 * - estado

 * - fechaInicio

 * - fechaFin

 *

 * @param {Object} req - Objeto de la petición

 * @param {Object} res - Objeto de la respuesta

 * @param {Function} next - Middleware para manejo de errores

 */

async function consultarTransferencias(req, res, next) {

  try {

    // Validar que se reciba el clienteId

    if (!req.body || !req.body.clienteId) {

      return res.status(400).json({

        error: "El campo clienteId es obligatorio y no puede estar vacío.",

      });

    }



    const { clienteId, estado, fechaInicio, fechaFin } = req.body;

    const pool = await connectDB();

    const request = new sql.Request(pool);



    // Registrar el parámetro obligatorio

    request.input("clienteId", sql.Int, clienteId);



    // Construir la consulta base

    let query = `

      SELECT *

      FROM SolicitudTransporte

      WHERE clienteId = @clienteId

    `;



    // Agregar filtros opcionales, si se proporcionan

    if (estado) {

      query += " AND estado = @estado";

      request.input("estado", sql.VarChar, estado);

    }

    if (fechaInicio) {

      query += " AND fechaSolicitud >= @fechaInicio";

      request.input("fechaInicio", sql.DateTime, fechaInicio);

    }

    if (fechaFin) {

      query += " AND fechaSolicitud <= @fechaFin";

      request.input("fechaFin", sql.DateTime, fechaFin);

    }



    // Ordenar resultados por fecha de solicitud descendente

    query += " ORDER BY fechaSolicitud DESC";



    const result = await request.query(query);

    return res.status(200).json({

      message: "Transferencias consultadas exitosamente",

      data: result.recordset,

    });

  } catch (error) {

    return next(error);

  }

}



/**

 * @description Consulta el detalle de una transferencia, retornando

 * la información de la solicitud y el detalle (nodos separados).

 *

 * Campos obligatorios:

 * - solicitudId: ID de la solicitud de transferencia.

 *

 * @param {Object} req - Objeto de la petición.

 * @param {Object} res - Objeto de la respuesta.

 * @param {Function} next - Middleware para manejo de errores.

 */

async function consultarDetalleTransferencia(req, res, next) {

  try {

    // Validar que se reciba el solicitudId en el body

    if (!req.body || !req.body.solicitudId) {

      return res.status(400).json({

        error: "El campo solicitudId es obligatorio y no puede estar vacío.",

      });

    }



    const { solicitudId } = req.body;

    const pool = await connectDB();



    // Consulta la cabecera (información de la solicitud)

    const requestHeader = new sql.Request(pool);

    requestHeader.input("solicitudId", sql.Int, solicitudId);

    const headerResult = await requestHeader.query(`

      SELECT *

      FROM SolicitudTransporte

      WHERE id = @solicitudId

    `);



    if (headerResult.recordset.length === 0) {

      return res.status(404).json({

        error: "No se encontró una solicitud con el ID proporcionado.",

      });

    }



    const solicitud = headerResult.recordset[0];



    // Consulta el detalle de la solicitud

    const requestDetalle = new sql.Request(pool);

    requestDetalle.input("solicitudId", sql.Int, solicitudId);

    const detailResult = await requestDetalle.query(`

      SELECT *

      FROM DetalleSolicitudTransporte

      WHERE solicitudTransporteId = @solicitudId

      ORDER BY id ASC

    `);



    const detalle = detailResult.recordset;



    return res.status(200).json({

      message: "Consulta exitosa",

      solicitud,

      detalle,

    });

  } catch (error) {

    return next(error);

  }

}



/**

 * @description Asigna un transportador a la solicitud de transferencia.

 * Actualiza la solicitud a estado "ASIGNADO" y registra el usuario (transportador) que recoge la carga.

 * Se espera en el body:

 * {

 *   "solicitudId": 14,

 *   "usuarioCarga": 5

 * }

 *

 * @param {Object} req - Objeto de la petición.

 * @param {Object} res - Objeto de la respuesta.

 * @param {Function} next - Middleware para manejo de errores.

 */

async function asignarTransportador(req, res, next) {

  if (!req.body || !req.body.solicitudId || !req.body.usuarioCarga) {

    return res.status(400).json({

      error: "Se requieren los campos: solicitudId y usuarioCarga.",

    });

  }



  const { solicitudId, usuarioCarga } = req.body;

  const fechaAsignacion = new Date();



  try {

    const pool = await connectDB();



    // Consultar el nombre del usuario (transportador) usando el usuarioCarga

    const userResult = await pool

      .request()

      .input("usuarioId", sql.Int, usuarioCarga).query(`

        SELECT nombre

        FROM [bodegapp2_bk].[dbo].[Usuario]

        WHERE id = @usuarioId

      `);



    if (userResult.recordset.length === 0) {

      return res.status(404).json({ error: "Usuario no encontrado." });

    }

    const usuarioNombre = userResult.recordset[0].nombre;



    // Verificar que la solicitud exista y esté en un estado adecuado para la asignación.

    const checkResult = await pool

      .request()

      .input("solicitudId", sql.Int, solicitudId).query(`

        SELECT id, estado, usuarioCarga, fechaAsignacion

        FROM SolicitudTransporte 

        WHERE id = @solicitudId

      `);



    if (checkResult.recordset.length === 0) {

      return res.status(404).json({ error: "Solicitud no encontrada." });

    }



    const solicitud = checkResult.recordset[0];



    // Si la solicitud ya está asignada, informar con el nombre del transportador asignado.

    if (solicitud.estado === "ASIGNADO") {

      // Usar la función escalar dbo.GetNombreUsuario para obtener el nombre del usuario asignado.

      const userAssignedResult = await pool

        .request()

        .input("usuarioId", sql.Int, solicitud.usuarioCarga).query(`

          SELECT dbo.GetNombreUsuario(@usuarioId) AS nombre

        `);



      const nombreAsignado =

        userAssignedResult.recordset.length > 0

          ? userAssignedResult.recordset[0].nombre

          : "desconocido";



      return res.status(400).json({

        error: `La solicitud con id ${solicitudId} ya se encuentra asignada al transportador ${nombreAsignado} (ID: ${solicitud.usuarioCarga}) desde ${solicitud.fechaAsignacion}.`,

      });

    }



    // Solo se permite asignar transportador si la solicitud está en estado PENDIENTE

    if (solicitud.estado !== "PENDIENTE") {

      return res.status(400).json({

        error:

          "La solicitud debe estar en estado PENDIENTE para asignar un transportador.",

      });

    }



    // Actualizar la solicitud: asignar transportador y cambiar estado a "ASIGNADO"

    const result = await pool

      .request()

      .input("solicitudId", sql.Int, solicitudId)

      .input("usuarioCarga", sql.Int, usuarioCarga)

      .input("nuevoEstado", sql.VarChar, "ASIGNADO").query(`

        UPDATE SolicitudTransporte

        SET usuarioCarga = @usuarioCarga,

            fechaAsignacion = GETDATE(),

            estado = @nuevoEstado,

            updatedAt = GETDATE()

        WHERE id = @solicitudId

      `);



    if (result.rowsAffected[0] === 0) {

      return res

        .status(404)

        .json({ error: "No se pudo actualizar la solicitud." });

    }



    return res.status(200).json({

      message: `Solicitud asignada a transportador ${usuarioNombre} correctamente.`,

      solicitudId,

      usuarioCarga,

      usuarioNombre,

      fechaAsignacion,

      estado: "ASIGNADO",

    });

  } catch (error) {

    return next(error);

  }

}



/**

 * @description Registra que el transportador ha recogido las cajas en la ubicación del cliente.

 * Actualiza el estado de la solicitud de transferencia a "RECOGIDO" y registra la fecha de recogida.

 * Se espera en el body:

 * {

 *   "solicitudId": 123

 * }

 *

 * @param {Object} req - Objeto de la petición.

 * @param {Object} res - Objeto de la respuesta.

 * @param {Function} next - Middleware para manejo de errores.

 */

async function recoger(req, res, next) {

  const { solicitudId } = req.body;

  if (!solicitudId) {

    return res.status(400).json({ error: "Se requiere el campo solicitudId." });

  }



  try {

    const pool = await connectDB();



    // Verificar que la solicitud exista y esté en estado "ASIGNADO"

    const checkResult = await pool

      .request()

      .input("solicitudId", sql.Int, solicitudId).query(`

        SELECT id, estado 

        FROM SolicitudTransporte 

        WHERE id = @solicitudId

      `);



    if (checkResult.recordset.length === 0) {

      return res.status(404).json({ error: "Solicitud no encontrada." });

    }



    const solicitud = checkResult.recordset[0];

    if (solicitud.estado !== "ASIGNADO") {

      return res.status(400).json({

        error:

          "La solicitud debe estar en estado ASIGNADO para registrar la recogida.",

      });

    }



    const fechaRecogida = new Date();



    // Actualizar la solicitud: cambiar el estado a "RECOGIDO" y registrar la fecha de recogida

    const result = await pool

      .request()

      .input("solicitudId", sql.Int, solicitudId)

      .input("nuevoEstado", sql.VarChar, "RECOGIDO").query(`

        UPDATE SolicitudTransporte

        SET estado = @nuevoEstado,

            fechaRecogida = GETDATE(),

            updatedAt = GETDATE()

        WHERE id = @solicitudId

      `);



    if (result.rowsAffected[0] === 0) {

      return res

        .status(404)

        .json({ error: "No se pudo actualizar la solicitud." });

    }



    return res.status(200).json({

      message: "Solicitud marcada como RECOGIDO.",

      solicitudId,

      fechaRecogida,

      estado: "RECOGIDO",

    });

  } catch (error) {

    return next(error);

  }

}



/**

 * PUT /api/transferencias/recepcionar

 * Body de ejemplo:

 * {

 *   "solicitudId": 123

 * }

 */

async function recepcionar(req, res, next) {

  const { solicitudId, usuarioId } = req.body;

  if (!solicitudId || !usuarioId) {

    return res

      .status(400)

      .json({ message: "Falta el campo solicitudId o usuarioId en el body." });

  }



  try {

    const pool = await connectDB();



    // Verificar si la solicitud existe y está en RECIBIDO

    const checkResult = await pool

      .request()

      .input("id", sql.Int, solicitudId)

      .query(`SELECT id, estado FROM SolicitudTransporte WHERE id = @id`);



    if (checkResult.recordset.length === 0) {

      return res.status(404).json({ message: "Solicitud no encontrada" });

    }



    const solicitud = checkResult.recordset[0];

    if (solicitud.estado === "RECIBIDO") {

      return res

        .status(400)

        .json({ message: "La solicitud ya fue RECIBIDa" });

    }



    // Actualizamos estado a "RECIBIDO"

    await pool

      .request()

      .input("solicitudId", sql.Int, solicitudId)

      .input("usuarioId", sql.Int, usuarioId)

      .input("nuevoEstado", sql.VarChar, "RECIBIDO").query(`

        UPDATE SolicitudTransporte

        SET estado = @nuevoEstado,

            fechaVerificacion = GETDATE(),

            usuarioVerifica = @usuarioId,

            updatedAt = GETDATE()

        WHERE id = @solicitudId

      `);



    res.json({ message: "Solicitud de transferencia marcada como RECIBIDO" });

  } catch (error) {

    next(error);

  }

}



/**

 * @description Asigna ubicaciones a los items de una solicitud de transferencia.

 * Se espera en el body:

 * {

 *   "solicitudId": 123,

 *   "asignaciones": [

 *     { "detalleId": 10, "ubicacionId": 5 },

 *     { "detalleId": 11, "ubicacionId": 6 }

 *   ]

 * }

 *

 * Flujo resumido:

 *  1. Validar que la solicitud exista y esté en estado "RECIBIDO" (o el que corresponda).

 *  2. Por cada asignación:

 *     a) Obtener el DetalleSolicitudTransporte (estado "PENDIENTE", etc.).

 *     b) Verificar que la Ubicacion esté DISPONIBLE.

 *     c) Buscar la Custodia por `referencia2`.

 *        - Si no existe, crearla, generando `referencia1` a partir de la ubicación.

 *        - Si existe, podrías decidir si sobreescribir `referencia1` o no.

 *     d) Actualizar la Custodia con `ubicacionId`.

 *     e) Marcar la Ubicacion como ocupada.

 *     f) Marcar el detalle como "ASIGNADO".

 */

async function asignarUbicaciones(req, res, next) {

  if (

    !req.body ||

    !req.body.solicitudId ||

    !req.body.asignaciones ||

    !Array.isArray(req.body.asignaciones)

  ) {

    return res.status(400).json({

      error: "Se requieren los campos: solicitudId y un array de asignaciones.",

    });

  }



  const { solicitudId, asignaciones } = req.body;



  try {

    const pool = await connectDB();



    // 1) Verificar que la solicitud exista y obtener clienteId

    const solResult = await pool

      .request()

      .input("solicitudId", sql.Int, solicitudId).query(`

        SELECT id, estado, clienteId

        FROM SolicitudTransporte

        WHERE id = @solicitudId

      `);



    if (solResult.recordset.length === 0) {

      return res.status(404).json({ error: "No se encontró la solicitud." });

    }



    const solicitud = solResult.recordset[0];

    if (solicitud.estado !== "RECIBIDO") {

      return res.status(400).json({

        error:

          "La solicitud no está en un estado adecuado para asignar ubicaciones.",

      });

    }



    // Iniciar transacción

    const transaction = new sql.Transaction(pool);

    await transaction.begin();



    try {

      for (const asign of asignaciones) {

        const { detalleId, ubicacionId } = asign;



        // 2a) Obtener el detalle y validar su estado

        const detalleResult = await transaction

          .request()

          .input("detalleId", sql.Int, detalleId).query(`

            SELECT id, referencia1, referencia2, referencia3, estado, tipo

            FROM DetalleSolicitudTransporte

            WHERE id = @detalleId

          `);



        if (detalleResult.recordset.length === 0) {

          throw new Error(`El detalle con ID=${detalleId} no existe.`);

        }

        const detalle = detalleResult.recordset[0];

        if (detalle.estado !== "PENDIENTE") {

          throw new Error(

            `Detalle ID=${detalleId} no está en estado PENDIENTE.`

          );

        }



        // 2b) Verificar la Ubicacion (disponible)

        const ubicacionResult = await transaction

          .request()

          .input("ubicacionId", sql.Int, ubicacionId).query(`

    SELECT *

    FROM Ubicacion

    WHERE id = @ubicacionId

  `);

  console.log('todoooooooooo', ubicacionResult );

  



        if (ubicacionResult.recordset.length === 0) {

          throw new Error(`Ubicacion ID=${ubicacionId} no existe.`);

        }

        const ubicacion = ubicacionResult.recordset[0];

        if (ubicacion.ocupado === true || ubicacion.estado !== "DISPONIBLE") {

          throw new Error(`Ubicacion ID=${ubicacionId} no está disponible.`);

        }

        console.log("ubicacion", ubicacion);



        // 2c) Buscar la Custodia por referencia2

        const custodiaResult = await transaction

          .request()

          .input("referencia2", sql.VarChar, detalle.referencia2).query(`

            SELECT id, referencia1

            FROM Custodia

            WHERE referencia2 = @referencia2

          `);



        let custodia;

        if (custodiaResult.recordset.length === 0) {

          // No existe -> Insertar la Custodia

          const clienteId = solicitud.clienteId;

          // Determinar item (por ejemplo, el campo `tipo` del detalle, o "CAJA" por defecto)

          const item = detalle.tipo || "CAJA";



          console.log("aaaaaaaaaaaaaaaaaaaaaaa", ubicacion.codigo);

          

          // Insertar la nueva Custodia

          const insertResult = await transaction

            .request()

            .input("clienteId", sql.Int, clienteId)

            .input("bodegaId", sql.Int, ubicacion.bodega_id)

            .input("ubicacionId", sql.Int, ubicacionId)

            .input("item", sql.VarChar, item)

            .input("referencia1", sql.VarChar, ubicacion.codigo) // <-- Generada

            .input("referencia2", sql.VarChar, detalle.referencia2)

            .input("referencia3", sql.VarChar, detalle.referencia3 || "")

            .query(`

              INSERT INTO Custodia

              (clienteId, bodega_id, ubicacionId, item, referencia1, referencia2, referencia3, estado, baja )

              VALUES

              (@clienteId, @bodegaId, @ubicacionId, @item, @referencia1, @referencia2, @referencia3, 'DISPONIBLE', 0);



              SELECT SCOPE_IDENTITY() AS custodiaId;

            `);



          const newId = insertResult.recordset[0].custodiaId;

          custodia = { id: newId, referencia1: ubicacion.codigo };

        } else {

          // Si la custodia ya existe, la cargamos

          custodia = custodiaResult.recordset[0];



          // (Opcional) Si quisieras actualizar la referencia1 cada vez que se reasigna ubicación:

          // const newRef1 = `B${...}...`;

          // await transaction.request()

          //   .input("custodiaId", sql.Int, custodia.id)

          //   .input("newRef1", sql.VarChar, newRef1)

          //   .query(`UPDATE Custodia SET referencia1 = @newRef1 WHERE id = @custodiaId`);

        }



        // 2d) Actualizar la Custodia con la nueva ubicacionId

        await transaction

          .request()

          .input("custodiaId", sql.Int, custodia.id)

          .input("ubicacionId", sql.Int, ubicacionId).query(`

            UPDATE Custodia

            SET ubicacionId = @ubicacionId

            WHERE id = @custodiaId

          `);



        // 2e) Marcar la Ubicacion como ocupada

        await transaction.request().input("ubicacionId", sql.Int, ubicacionId)

          .query(`

            UPDATE Ubicacion

            SET ocupado = 1, estado = 'OCUPADO'

            WHERE id = @ubicacionId

          `);



        // 2f) Actualizar el detalle a "ASIGNADO"

        await transaction.request().input("detalleId", sql.Int, detalleId)

          .query(`

            UPDATE DetalleSolicitudTransporte

            SET estado = 'ASIGNADO'

            WHERE id = @detalleId

          `);

      }



      // Commit

      await transaction.commit();

      return res

        .status(200)

        .json({ message: "Ubicaciones asignadas correctamente." });

    } catch (err) {

      await transaction.rollback();

      return next(err);

    }

  } catch (error) {

    return next(error);

  }

}



/**

 * @description Actualiza el estado de una transferencia (PUT /api/client/transferencias/actualizarEstado)

 * Campos obligatorios:

 * - solicitudId: ID de la solicitud de transferencia.

 * - estado: Nuevo estado de la transferencia (por ejemplo, "COMPLETADO", "CANCELADO", etc.).

 * Opcional:

 * - observaciones: Observaciones adicionales.

 *

 * @param {Object} req - Objeto de la petición.

 * @param {Object} res - Objeto de la respuesta.

 * @param {Function} next - Middleware para manejo de errores.

 */

async function actualizarEstadoTransferencia(req, res, next) {

  try {

    // Validar que se envíen los campos obligatorios

    if (!req.body || !req.body.solicitudId || !req.body.estado) {

      return res.status(400).json({

        error: "Se requieren los campos: solicitudId y estado.",

      });

    }



    const { solicitudId, estado, observaciones } = req.body;

    const pool = await connectDB();

    const request = new sql.Request(pool);



    request.input("solicitudId", sql.Int, solicitudId);

    request.input("estado", sql.VarChar, estado);

    request.input("observaciones", sql.VarChar, observaciones || "");



    // Actualiza la cabecera de la transferencia

    const result = await request.query(`

      UPDATE SolicitudTransporte

      SET estado = @estado,

          observaciones = @observaciones,

          updatedAt = GETDATE()

      WHERE id = @solicitudId

    `);



    if (result.rowsAffected[0] === 0) {

      return res.status(404).json({

        error: "No se encontró una solicitud con el ID proporcionado.",

      });

    }



    return res.status(200).json({

      message: "Estado de la transferencia actualizado exitosamente.",

      solicitudId,

      estado,

    });

  } catch (error) {

    return next(error);

  }

}



module.exports = {

  createTransferencia,

  consultarTransferencias,

  consultarDetalleTransferencia,

  actualizarEstadoTransferencia,

  eliminarTransferencia,

  asignarUbicaciones,

  recepcionar,

  asignarTransportador,

  recoger,

};
 




