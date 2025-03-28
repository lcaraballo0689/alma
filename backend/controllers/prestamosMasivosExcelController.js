// controllers/prestamosMasivosExcelController.js
const XLSX = require("xlsx");
const path = require("path");
const { connectDB, sql } = require("../config/db");

// Services
const { getUserByEmail } = require("../services/userService");
const {
  getCustodiaByReferencia2,
  marcarCustodiaSolicitada,
} = require("../services/custodiaService");
const {
  getOrCreateConsecutivos,
  incrementarUltimoPrestamo,
} = require("../services/consecutivoService");
const { createPrestamoCabecera,
  createPrestamoDetalle } = require("../services/prestamoService");
// Importamos el controlador de correos (servicio)
const { sendCorreo } = require("./correoController");

/**
 * Carga masiva de préstamos desde un archivo Excel.
 * Se esperan en el body:
 *  - usuarioEmail (string)
 *  - observacion (string, opcional)
 *  - file (archivo Excel con encabezados [referencia2, direccion_entrega, urgencia])
 */
async function cargarPrestamosExcel(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'No se adjuntó ningún archivo.' });
  }

  const { usuarioEmail, observacion } = req.body;
  if (!usuarioEmail) {
    return res.status(400).json({ error: 'Se debe proporcionar el usuarioEmail.' });
  }

  let transaction;
  try {
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Validar encabezados
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    const headers = rows[0];
    const expectedHeaders = ["referencia2", "direccion_entrega", "urgencia"];
    if (!headers || headers.length < expectedHeaders.length) {
      return res.status(400).json({ error: 'El archivo Excel no tiene los encabezados correctos.' });
    }
    for (let i = 0; i < expectedHeaders.length; i++) {
      if (headers[i].trim().toLowerCase() !== expectedHeaders[i].toLowerCase()) {
        return res.status(400).json({ error: 'Los encabezados del archivo Excel no coinciden con los requeridos.' });
      }
    }

    // Convertir la hoja a un array de objetos (omitiendo la primera fila)
    const data = XLSX.utils.sheet_to_json(sheet);

    const pool = await connectDB();
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    // Obtener el usuario y consecutivos una sola vez
    //fixme: se debe obtener el usuario ya que esta estatico 
    const user = { id: 3, clienteId: 2, email: 'lecmbogota@gmail.com', name: 'luis Caraballo' }
    console.log("esto es user", user);

    console.log("aqui 1");

    const consecutivos = await getOrCreateConsecutivos(transaction, user.clienteId);
    console.log("aqui 2");

    const createdPrestamos = [];
    const errores = []; // Acumula errores parciales

    // Recorrer cada fila del Excel
    for (const [index, row] of data.entries()) {
      // Para el número de fila se suma 2 (1 para encabezado y 1 por índice 0)
      const filaNumero = index + 2;

      // Validar datos obligatorios
      if (!row.referencia2 || !row.direccion_entrega) {
        errores.push({
          fila: filaNumero,
          referencia2: row.referencia2 || '',
          error: `La fila ${filaNumero} está incompleta (faltan referencia2 o dirección de entrega).`
        });
        continue;
      }

      console.log("aqui 3");
      // Buscar custodia por referencia2
      const custodia = await getCustodiaByReferencia2(transaction, row.referencia2);
      if (!custodia) {
        errores.push({
          fila: filaNumero,
          referencia2: row.referencia2,
          error: `El Item con Referencia2 '${row.referencia2} No Disponible.'.`
        });
        continue;
      }
      console.log("aqui 4");

      // Verificar estado de la custodia
      if (custodia.estado !== 'DISPONIBLE') {
        errores.push({
          fila: filaNumero,
          referencia2: row.referencia2,
          error: `La custodia con referencia2 '${row.referencia2}' no está disponible (estado: '${custodia.estado}').`
        });
        continue;
      }

      // Crear préstamo y actualizar consecutivo
      const newPrestamoId = await createDevolucionDetalle(transaction, {
        clienteId: custodia.clienteId,
        usuarioId: user.id,
        custodiaId: custodia.id,
        consecutivo: consecutivos.ultimoPrestamo + 1,
        fechaSolicitud: new Date(),
        referencia1: String(custodia.referencia1 || ''),
        referencia2: String(custodia.referencia2 || ''),
        referencia3: String(custodia.referencia3 || ''),
        direccion_entrega: String(row.direccion_entrega || ''),
        modalidad: String(row.urgencia || 'Normal'),
        observaciones: String(observacion || '')
      });

      console.log('Valor de referencia1:', newPrestamoId);




      // Marcar custodia como SOLICITADO
      await marcarCustodiaSolicitada(transaction, custodia.id);

      // Incrementar consecutivo y actualizar objeto
      await incrementarUltimoPrestamo(transaction, user.clienteId);
      consecutivos.ultimoPrestamo += 1;

      createdPrestamos.push({
        prestamoId: newPrestamoId,
        referencia1: custodia.referencia1,
        referencia2: custodia.referencia2,
        referencia3: custodia.referencia3,
        direccion_entrega: row.direccion_entrega,
        prioridad: row.urgencia || 'Normal'
      });
    }

    // Si ninguno de los registros fue creado, se hace rollback y se retorna error total
    if (createdPrestamos.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        error: "No se creó ningún préstamo, se encontraron errores en todas las filas.",
        errores: errores
      });
    }

    // Confirmar la transacción
    await transaction.commit();

    // Enviar correo de confirmación solo si se crearon registros
    const logoPath = path.join(__dirname, "../assets/bodegapp-logo.png");
    try {
      // Si la carga es parcial, se agrega en el cuerpo del correo el detalle de los errores
      const correoHTML = errores.length > 0
        ? `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <title>Confirmación Parcial de Solicitud de Préstamo</title>
              <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 20px auto; background: #ffffff; padding: 20px; border: 1px solid #dddddd; }
                .header { text-align: center; border-bottom: 1px solid #dddddd; padding-bottom: 10px; margin-bottom: 20px; }
                .header h2 { margin: 0; color: #333; }
                .content { font-size: 16px; color: #555; line-height: 1.5; }
                .content p { margin: 10px 0; }
                .table-container { margin-top: 20px; }
                table { width: 100%; border-collapse: collapse; }
                table, th, td { border: 1px solid #cccccc; }
                th, td { padding: 8px; text-align: center; font-size: 14px; }
                th { background-color: #efefef; }
                .error-list { text-align: left; margin-top: 20px; }
                .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #888; }
                .footer img { display: block; margin: 10px auto; width: 150px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h2>Confirmación Parcial de Solicitud de Préstamo</h2>
                </div>
                <div class="content">
                  <p>Estimado/a <strong>${user.name || 'Cliente'}</strong>,</p>
                  <p>Hemos recibido su solicitud de préstamo. Se han creado <strong>${createdPrestamos.length}</strong> préstamo(s) con el consecutivo <strong>${consecutivos.ultimoPrestamo}</strong>.</p>
                  <p>A continuación se detalla el resumen de los ítems creados:</p>
                  <div class="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>N° Ítem</th>
                          <th>Referencia 1</th>
                          <th>Referencia 2</th>
                          <th>Referencia 3</th>
                          <th>Dirección de Entrega</th>
                          <th>Prioridad</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${createdPrestamos.map((item, index) => `
                          <tr>
                            <td>${index + 1}</td>
                            <td>${item.referencia1 || "-"}</td>
                            <td>${item.referencia2 || "-"}</td>
                            <td>${item.referencia3 || "-"}</td>
                            <td>${item.direccion_entrega}</td>
                            <td>${item.prioridad}</td>
                          </tr>
                        `).join('')}
                      </tbody>
                    </table>
                  </div>
                  <p>Le agradecemos por confiar en BODEGAPP.</p>
                </div>
                <div class="footer">
                  <p>Atentamente,</p>
                  <p>El equipo de BODEGAPP</p>
                  <img src="cid:bodegappLogo" alt="Logo de BODEGAPP" />
                </div>
              </div>
            </body>
          </html>
        `
        : // Si no hubo errores, se envía el correo con el detalle de los préstamos creados
        `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <title>Confirmación de Solicitud de Préstamo</title>
              <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 20px auto; background: #ffffff; padding: 20px; border: 1px solid #dddddd; }
                .header { text-align: center; border-bottom: 1px solid #dddddd; padding-bottom: 10px; margin-bottom: 20px; }
                .header h2 { margin: 0; color: #333; }
                .content { font-size: 16px; color: #555; line-height: 1.5; }
                .content p { margin: 10px 0; }
                .table-container { margin-top: 20px; }
                table { width: 100%; border-collapse: collapse; }
                table, th, td { border: 1px solid #cccccc; }
                th, td { padding: 8px; text-align: center; font-size: 14px; }
                th { background-color: #efefef; }
                .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #888; }
                .footer img { display: block; margin: 10px auto; width: 150px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h2>Confirmación de Solicitud de Préstamo</h2>
                </div>
                <div class="content">
                  <p>Estimado/a <strong>${user.name || 'Cliente'}</strong>,</p>
                  <p>Hemos recibido su solicitud de préstamo. Se han creado <strong>${createdPrestamos.length}</strong> préstamo(s) con el consecutivo <strong>${consecutivos.ultimoPrestamo}</strong>.</p>
                  <p>A continuación, se detalla el resumen de los ítems solicitados:</p>
                  <div class="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>N° Ítem</th>
                          <th>Referencia 1</th>
                          <th>Referencia 2</th>
                          <th>Referencia 3</th>
                          <th>Dirección de Entrega</th>
                          <th>Prioridad</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${createdPrestamos.map((item, index) => `
                          <tr>
                            <td>${index + 1}</td>
                            <td>${item.referencia1 || "-"}</td>
                            <td>${item.referencia2 || "-"}</td>
                            <td>${item.referencia3 || "-"}</td>
                            <td>${item.direccion_entrega}</td>
                            <td>${item.prioridad}</td>
                          </tr>
                        `).join('')}
                      </tbody>
                    </table>
                  </div>
                  <p>Le agradecemos por confiar en BODEGAPP.</p>
                </div>
                <div class="footer">
                  <p>Atentamente,</p>
                  <p>El equipo de BODEGAPP</p>
                  <img src="cid:bodegappLogo" alt="Logo de BODEGAPP" />
                </div>
              </div>
            </body>
          </html>
        `;

      await sendCorreo({
        to: process.env.NODE_ENV === 'development' ? 'lecmbogota@gmail.com' : user.email,
        subject: errores.length > 0
          ? "Confirmación Parcial de Solicitud de Préstamo"
          : "Confirmación de Solicitud de Préstamo",
        text: errores.length > 0
          ? `Estimado/a ${user.name || 'Cliente'},
          
Hemos recibido su solicitud de préstamo. Se han creado ${createdPrestamos.length} préstamo(s) con el consecutivo ${consecutivos.ultimoPrestamo}.
Sin embargo, se presentaron errores en algunas filas: ${errores.map(e => `Fila ${e.fila}: ${e.error}`).join(' | ')}
          
Gracias por confiar en BODEGAPP.
          
Atentamente,
El equipo de BODEGAPP`
          : `Estimado/a ${user.name || 'Cliente'},
          
Hemos recibido su solicitud de préstamo. Se han creado ${createdPrestamos.length} préstamo(s) con el consecutivo ${consecutivos.ultimoPrestamo}.
          
Gracias por confiar en BODEGAPP.
          
Atentamente,
El equipo de BODEGAPP`,
        html: correoHTML,
        attachments: [
          {
            path: logoPath,
            cid: "bodegappLogo",
            filename: "bodegapp-logo.png"
          }
        ]
      });
    } catch (correoError) {
      console.error("Error al enviar el correo de confirmación:", correoError);
      // No se bloquea la respuesta principal si falla el envío de correo
    }

    // Retornar respuesta final
    const responseMessage = errores.length > 0
      ? "Carga masiva parcial completada."
      : "Carga masiva realizada exitosamente.";
    return res.status(200).json({
      message: responseMessage,
      creados: createdPrestamos,
      errores: errores
    });
  } catch (error) {
    console.error("Error en cargarPrestamosExcel:", error);
    try {
      if (transaction) await transaction.rollback();
    } catch (rollbackError) {
      console.error("Error al hacer rollback:", rollbackError);
    }
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
}

async function cargarDevolucionesExcel(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'No se adjuntó ningún archivo.' });
  }

  //fixme: falta el incluir usuarioId, email, clienteId, nombre del usuario 
  const { usuarioEmail, observacion } = req.body;
  if (!usuarioEmail) {
    return res.status(400).json({ error: 'Se debe proporcionar el usuarioEmail.' });
  }

  let transaction;
  try {
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Validar encabezados
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    console.log("ROWS => ", rows);

    const headers = rows[0];
    const expectedHeaders = ["referencia2"];
    if (!headers || headers.length < expectedHeaders.length) {
      return res.status(400).json({ error: 'El archivo Excel no tiene los encabezados correctos.' });
    }
    for (let i = 0; i < expectedHeaders.length; i++) {
      if (headers[i].trim().toLowerCase() !== expectedHeaders[i].toLowerCase()) {
        return res.status(400).json({ error: 'Los encabezados del archivo Excel no coinciden con los requeridos.' });
      }
    }

    // Convertir la hoja a un array de objetos (omitiendo la primera fila)
    const data = XLSX.utils.sheet_to_json(sheet);

    const pool = await connectDB();
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    // Obtener el usuario y consecutivos una sola vez
    //fixme: se debe obtener el usuario ya que esta estatico 
    const user = { id: 3, clienteId: 2, email: 'lecmbogota@gmail.com', name: 'luis Caraballo' }
    console.log("esto es user", user);

    console.log("aqui 1");
    const consecutivos = await incrementarUltimaDevolucion(transaction, user.clienteId);
    console.log("aqui 2");


    const createdPrestamos = [];
    const errores = []; // Acumula errores parciales

    // Recorrer cada fila del Excel
    for (const [index, row] of data.entries()) {
      // Para el número de fila se suma 2 (1 para encabezado y 1 por índice 0)
      const filaNumero = index + 2;

      // Validar datos obligatorios
      if (!row.referencia2) {
        errores.push({
          fila: filaNumero,
          referencia2: row.referencia2 || '',
          error: `La fila ${filaNumero} está incompleta (faltan referencia2).`
        });
        continue;
      }

      console.log("aqui 3");
      // Buscar custodia por referencia2
      const custodia = await getCustodiaByReferencia2(transaction, row.referencia2);
      console.log(">>>>>CUSTODIA<<<<:  ", custodia);

      if (!custodia) {
        errores.push({
          fila: filaNumero,
          referencia2: row.referencia2,
          error: `El Item con Referencia2 '${row.referencia2} No Disponible.'.`
        });
        continue;
      }
      console.log("aqui 4");

      // Verificar estado de la custodia
      if (custodia.estado !== 'ENTREGADO') {
        errores.push({
          fila: filaNumero,
          referencia2: row.referencia2,
          error: `La custodia con referencia2 '${row.referencia2}' no está disponible (estado: '${custodia.estado}').`
        });
        continue;
      }


      // Incrementar consecutivo y actualizar objeto
      await incrementarUltimaDevolucion(transaction, user.clienteId);
      consecutivos.ultimaDevolucion += 1;

      // Crear devolucion y actualizar consecutivo
      const newDevolucionId = await createPrestamoDetalle(transaction, {
        clienteId: custodia.clienteId,
        usuarioId: user.id,
        custodiaId: custodia.id,
        consecutivo: consecutivos.ultimaDevolucion + 1,
        fechaSolicitud: new Date(),
        referencia2: String(custodia.referencia2 || ''),
        direccion_entrega: String(row.direccion_entrega || ''),
        observaciones: String(observacion || '')
      });

      console.log('Valor de referencia1:', newDevolucionId);

      createdDevoluciones.push(
        newDevolucionId
      );
    }

    // Si ninguno de los registros fue creado, se hace rollback y se retorna error total
    if (createdDevoluciones.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        error: "No se creó ningúna Devolucion, revise todas las filas.",
        errores: errores
      });
    }

    // Confirmar la transacción
    await transaction.commit();

    //todo: aqui va lo del envio del correo

    // Retornar respuesta final
    const responseMessage = errores.length > 0
      ? "Carga masiva parcial completada."
      : "Carga masiva realizada exitosamente.";
    return res.status(200).json({
      message: responseMessage,
      creados: createdDevoluciones,
      errores: errores
    });
  } catch (error) {
    console.error("Error en cargarDevolucionesExcel:", error);
    try {
      if (transaction) await transaction.rollback();
    } catch (rollbackError) {
      console.error("Error al hacer rollback:", rollbackError);
    }
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
}


/**
 * Descarga plantilla de Excel para carga masiva.
 * Recibe en query el parámetro "tipo" que determina la plantilla a generar.
 */
function descargarPlantillaExcel(req, res) {
  // Obtener el tipo de plantilla de la query string, por defecto se usa "prestamo-masivo"
  const tipoPlantilla = req.query.tipo || "prestamo-masivo";
  let expectedHeaders;
  let fileName;

  if (tipoPlantilla === "prestamo-masivo") {
    expectedHeaders = ["referencia2", "direccion_entrega", "urgencia"];
    fileName = "plantilla_prestamo_masivo.xlsx";
  } else if (tipoPlantilla === "devolucion-masiva") {
    expectedHeaders = ["referencia2"];
    fileName = "plantilla_devoluciones.xlsx";
  } else {
    expectedHeaders = [];
    fileName = "plantilla_prestamo.xlsx";
  }

  const worksheet = XLSX.utils.aoa_to_sheet([expectedHeaders]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Plantilla");

  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });

  // Establecer el nombre del archivo usando el método attachment de Express
  res.attachment(fileName);
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  return res.send(buffer);
}

module.exports = {
  cargarPrestamosExcel,
  descargarPlantillaExcel,
  cargarDevolucionesExcel
};
