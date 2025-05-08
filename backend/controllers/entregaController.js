// entregaController.js
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { connectDB, sql } = require("../config/db");
const logger = require("../logger");

// Asegura que exista el directorio de uploads
const UPLOAD_DIR = path.join(__dirname, "../uploads/entregas");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  logger.info(`Directorio creado: ${UPLOAD_DIR}`);
}

/**
 * POST /api/client/entregas/realizar
 * - Valida que cada detalleId pertenezca a la solicitud y no esté procesado
 * - Para cada detalleId nuevo:
 *    • Valida la transición de estado según EstadoTransiciones y tipoUsuario
 * - Procesa solo los no procesados:
 *    • Guarda firma/fotos
 *    • Inserta un registro en entregas por cada grupo
 *    • Marca detalleId.entregaId, procesado = 1 y actualiza estado al siguiente permitido
 * - Si al final todos los detalles de la solicitud están procesados:
 *    • Avanza el estado de la solicitud en SolicitudTransporte al siguiente permitido
 * - Devuelve listas de detalles nuevos procesados y ya procesados
 */
async function realizarEntrega(req, res, next) {
  const { solicitudId, usuarioId, entregas } = req.body;

  // Validaciones detalladas de los parámetros de entrada
  if (!solicitudId) {
    return res.status(400).json({ error: "El parámetro 'solicitudId' es requerido." });
  }
  if (!usuarioId) {
    return res.status(400).json({ error: "El parámetro 'usuarioId' es requerido." });
  }
  if (!Array.isArray(entregas)) {
    return res.status(400).json({ error: "El parámetro 'entregas' debe ser un arreglo." });
  }
  if (entregas.length === 0) {
    return res.status(400).json({ error: "El arreglo 'entregas' no puede estar vacío." });
  }

  let pool, transaction;
  try {
    pool = await connectDB();

    // 0) Obtener tipoUsuarioId del usuario
    const userRes = await pool
      .request()
      .input("usuarioId", sql.Int, usuarioId)
      .query(`SELECT tipoUsuarioId FROM Usuario WHERE id = @usuarioId`);
    if (!userRes.recordset.length) {
      return res.status(404).json({ error: `Usuario ${usuarioId} no encontrado.` });
    }
    const tipoUsuarioId = userRes.recordset[0].tipoUsuarioId;

    // 1) Aplanar y obtener IDs únicos
    const allDetalleIds = entregas.flatMap(g =>
      Array.isArray(g.detalleIds) ? g.detalleIds : []
    );
    const uniqueDetalleIds = Array.from(new Set(allDetalleIds));
    if (!uniqueDetalleIds.length) {
      return res.status(400).json({ error: "No hay detalleIds válidos." });
    }

    // 2) Validar que todos los detalleIds existen y pertenecen a la solicitud
    let belongReq = pool.request().input("solicitudId", sql.Int, solicitudId);
    uniqueDetalleIds.forEach((id, i) => belongReq.input(`id${i}`, sql.Int, id));
    const inParams = uniqueDetalleIds.map((_, i) => `@id${i}`).join(", ");
    const belongRes = await belongReq.query(`
      SELECT id
      FROM DetalleSolicitudTransporte
      WHERE solicitudTransporteId = @solicitudId
        AND id IN (${inParams})
    `);
    const belongIds = belongRes.recordset.map(r => r.id);
    const invalid = uniqueDetalleIds.filter(id => !belongIds.includes(id));
    if (invalid.length) {
      return res.status(400).json({
        error: "Algunos detalleIds no pertenecen a la solicitud o no existen.",
        detalleIdsInvalidos: invalid
      });
    }

    // 3) Consultar cuáles ya están procesados
    let checkReq = pool.request().input("solicitudId", sql.Int, solicitudId);
    uniqueDetalleIds.forEach((id, i) => checkReq.input(`id${i}`, sql.Int, id));
    const checkRes = await checkReq.query(`
      SELECT id
      FROM DetalleSolicitudTransporte
      WHERE solicitudTransporteId = @solicitudId
        AND procesado = 1
        AND id IN (${inParams})
    `);
    const yaProcesados = checkRes.recordset.map(r => r.id);
    const yaProcesadosSet = new Set(yaProcesados);

    // 4) Filtrar los que faltan por procesar
    const faltantes = uniqueDetalleIds.filter(id => !yaProcesadosSet.has(id));
    if (!faltantes.length) {
      return res.status(400).json({
        message: "Todas las referencias ya fueron procesadas anteriormente.",
        detallesYaProcesados: yaProcesados
      });
    }

    // 5) Iniciar transacción
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    const procesadosAhora = new Set();

    // 6) Procesar cada grupo
    for (const grupo of entregas) {
      const { detalleIds, receptor, firma, fotos } = grupo;
      const nuevos = Array.isArray(detalleIds)
        ? detalleIds.filter(id => !yaProcesadosSet.has(id))
        : [];
      if (!nuevos.length) continue;

      // Validaciones de receptor/firma/fotos
      const erroresValidacion = [];
      if (!receptor || typeof receptor !== "object") {
        erroresValidacion.push("El grupo debe incluir un objeto 'receptor' con las propiedades 'nombre' e 'identificacion'.");
      } else {
        if (!receptor.nombre || typeof receptor.nombre !== "string") {
          erroresValidacion.push("No se diligenció el campo Nombre y Apellido del Receptor");
        }
        if (!receptor.identificacion || typeof receptor.identificacion !== "string") {
          erroresValidacion.push("No se diligenció el campo Identificación del Receptor");
        }
      }
      if (typeof firma !== "string" || !firma.trim()) {
        erroresValidacion.push("No se tomó la firma del Receptor");
      }
      if (!Array.isArray(fotos) || fotos.length === 0) {
        erroresValidacion.push("No se tomaron fotos de evidencia de entrega al Receptor");
      }
      if (erroresValidacion.length) {
        throw new Error("- " + erroresValidacion.join("\n- "));
      }

      // Guardar firma
      const firmaData = firma.replace(/^data:image\/png;base64,/, "");
      const firmaFile = `firma_${solicitudId}_${Date.now()}.png`;
      const firmaPath = path.join(UPLOAD_DIR, firmaFile);
      fs.writeFileSync(firmaPath, Buffer.from(firmaData, "base64"));

      // Guardar fotos
      const fotosPaths = fotos.map((b64, idx) => {
        const ext = b64.startsWith("data:image/jpeg") ? "jpg" : "png";
        const data = b64.replace(/^data:image\/\w+;base64,/, "");
        const fname = `foto_${solicitudId}_${Date.now()}_${idx}.${ext}`;
        const fpath = path.join(UPLOAD_DIR, fname);
        fs.writeFileSync(fpath, Buffer.from(data, "base64"));
        return fpath;
      });

      // Insert en entregas
      const insertRes = await transaction
        .request()
        .input("solicitudId", sql.Int, solicitudId)
        .input("receptorNombre", sql.VarChar, receptor.nombre)
        .input("receptorIdentificacion", sql.VarChar, receptor.identificacion)
        .input("firmaPath", sql.VarChar, firmaPath)
        .input("fotosPaths", sql.VarChar, JSON.stringify(fotosPaths))
        .input("usuarioId", sql.Int, usuarioId)
        .query(`
          INSERT INTO entregas
            (solicitudId, receptorNombre, receptorIdentificacion, firmaPath, fotosPaths, fechaEntrega, usuarioId)
          VALUES
            (@solicitudId, @receptorNombre, @receptorIdentificacion, @firmaPath, @fotosPaths, GETDATE(), @usuarioId);
          SELECT SCOPE_IDENTITY() AS entregaId;
        `);
      const entregaId = insertRes.recordset[0].entregaId;

      // Para cada detalle nuevo, validar transición y actualizar
      for (const detalleId of nuevos) {
        // Obtener estadoActual y solicitudTransporteId
        const detRes = await transaction
          .request()
          .input("detalleId", sql.Int, detalleId)
          .query(`
            SELECT estado AS estadoActual, solicitudTransporteId
            FROM DetalleSolicitudTransporte
            WHERE id = @detalleId
          `);
        const { estadoActual, solicitudTransporteId } = detRes.recordset[0];

        // Obtener módulo desde SolicitudTransporte
        const solRes = await transaction
          .request()
          .input("solicitudTransporteId", sql.Int, solicitudTransporteId)
          .query(`
            SELECT modulo
            FROM SolicitudTransporte
            WHERE id = @solicitudTransporteId
          `);
        const modulo = solRes.recordset[0].modulo;

        // Buscar transición permitida
        const transRes = await transaction
          .request()
          .input("modulo", sql.VarChar, modulo)
          .input("estadoActual", sql.VarChar, estadoActual)
          .input("tipoUsuarioId", sql.Int, tipoUsuarioId)
          .query(`
            SELECT estadoPermitido
            FROM EstadoTransiciones
            WHERE modulo = @modulo
              AND estadoActual = @estadoActual
              
          `);
        if (!transRes.recordset.length) {
          throw new Error(
            `Sin permiso para transicionar detalle ${detalleId} de "${estadoActual}".`
          );
        }
        const estadoPermitido = transRes.recordset[0].estadoPermitido;

        // Actualizar detalle
        await transaction
          .request()
          .input("detalleId", sql.Int, detalleId)
          .input("entregaId", sql.Int, entregaId)
          .input("nuevoEstado", sql.VarChar, estadoPermitido)
          .query(`
            UPDATE DetalleSolicitudTransporte
            SET entregaId = @entregaId,
                procesado = 1,
                estado = @nuevoEstado
            WHERE id = @detalleId;
          `);

        procesadosAhora.add(detalleId);
      }
    }

    // 7) Verificar si todos los detalles de la solicitud están procesados
    const totalRes = await transaction
      .request()
      .input("solicitudId", sql.Int, solicitudId)
      .query(`
        SELECT COUNT(*) AS total
        FROM DetalleSolicitudTransporte
        WHERE solicitudTransporteId = @solicitudId
      `);
    const procRes = await transaction
      .request()
      .input("solicitudId", sql.Int, solicitudId)
      .query(`
        SELECT COUNT(*) AS procesados
        FROM DetalleSolicitudTransporte
        WHERE solicitudTransporteId = @solicitudId
          AND procesado = 1
      `);
    const total = totalRes.recordset[0].total;
    const procesados = procRes.recordset[0].procesados;

    if (total === procesados) {
      // Obtener estado actual de la solicitud
      const solStateRes = await transaction
        .request()
        .input("solicitudId", sql.Int, solicitudId)
        .query(`
          SELECT estado AS estadoActual
          FROM SolicitudTransporte
          WHERE id = @solicitudId
        `);
      const estadoActualSol = solStateRes.recordset[0].estadoActual;

      // Obtener módulo de la solicitud
      const solModRes = await transaction
        .request()
        .input("solicitudId", sql.Int, solicitudId)
        .query(`
          SELECT modulo
          FROM SolicitudTransporte
          WHERE id = @solicitudId
        `);
      const modSolicitud = solModRes.recordset[0].modulo;

      // Buscar transición para la solicitud
      const solTransRes = await transaction
        .request()
        .input("modulo", sql.VarChar, modSolicitud)
        .input("estadoActual", sql.VarChar, estadoActualSol)
        .input("tipoUsuarioId", sql.Int, tipoUsuarioId)
        .query(`
          SELECT estadoPermitido
          FROM EstadoTransiciones
          WHERE modulo = @modulo
            AND estadoActual = @estadoActual
            
        `);
      if (solTransRes.recordset.length) {
        const nuevoEstadoSol = solTransRes.recordset[0].estadoPermitido;
        await transaction
          .request()
          .input("solicitudId", sql.Int, solicitudId)
          .input("nuevoEstadoSol", sql.VarChar, nuevoEstadoSol)
          .query(`
            UPDATE SolicitudTransporte
            SET estado = @nuevoEstadoSol
            WHERE id = @solicitudId
          `);
      }
    }

    // Commit
    await transaction.commit();

    return res.status(200).json({
      message: "Proceso de entrega completado",
      solicitudId,
      detallesProcesados: Array.from(procesadosAhora),
      detallesYaProcesados: yaProcesados
    });
  } catch (err) {
    if (transaction) {
      try { await transaction.rollback(); } catch (_) {}
    }
    logger.error("Error en realizarEntrega:", err);
    return next(err);
  }
}

module.exports = { realizarEntrega };
