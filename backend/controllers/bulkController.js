const { connectDB, sql } = require("../config/db");
const csv = require("csv-parser");
const fs = require("fs");
const path = require("path");

/**
 * Transforma el estado original según la lógica de negocio.
 */
const transformarEstado = (estadoOriginal) => {
  const estado = estadoOriginal?.trim().toUpperCase();
  if (estado === "CUSTODIA") return "DISPONIBLE";
  if (estado === "PRESTAMO") return "ENTREGADO";
  return estadoOriginal;
};

/**
 * Limpia todas las tablas involucradas en la carga de custodias.
 */
const limpiarTablas = async (pool) => {
  const tablas = [
    "Custodia_Staging",
    "Ubicacion",
    "DetalleSolicitudTransporte",
    "QR_Solicitudes",
    "SolicitudTransporte",
    "Prestamos",
    "Entregas",
    "SolicitudTransporte_Audit",
    "Notificaciones",
    "Devoluciones",
    "Devolucion",
    "Custodia",
  ];

  for (const tabla of tablas) {
    try {
      await pool.request().query(`DELETE FROM ${tabla}`);
      await pool
        .request()
        .query(
          `IF EXISTS (SELECT * FROM sys.identity_columns WHERE OBJECT_NAME(object_id) = '${tabla}') DBCC CHECKIDENT ('${tabla}', RESEED, 0);`
        );
    } catch (error) {
      console.warn(
        `⚠️ Error al limpiar/reiniciar la tabla ${tabla}:`,
        error.message
      );
    }
  }
};

/**
 * Inserta una ubicación si no existe y retorna su ID.
 */
const obtenerOInsertarUbicacion = async (
  pool,
  nombreBodega,
  codigoUbicacion
) => {
  const bodegaResult = await pool
    .request()
    .input("nombreBodega", sql.NVarChar, nombreBodega)
    .query("SELECT id FROM Bodega WHERE nombre = @nombreBodega");

  if (bodegaResult.recordset.length === 0) {
    throw new Error(`Bodega con nombre "${nombreBodega}" no encontrada.`);
  }

  const bodegaId = bodegaResult.recordset[0].id;

  const ubicacionResult = await pool
    .request()
    .input("codigo", sql.NVarChar, codigoUbicacion)
    .query("SELECT id FROM Ubicacion WHERE codigo = @codigo");

  if (ubicacionResult.recordset.length > 0) {
    return { ubicacionId: ubicacionResult.recordset[0].id, bodegaId };
  }

  const insert = await pool
    .request()
    .input("bodega_id", sql.Int, bodegaId)
    .input("modulo", sql.Int, 1)
    .input("entrepano", sql.Int, 1)
    .input("cara", sql.Int, 1)
    .input("piso", sql.Int, 1)
    .input("coordenadaX", sql.Int, 1)
    .input("coordenadaY", sql.Int, 1)
    .input("coordenadaZ", sql.Int, 1)
    .input("ocupado", sql.Int, 1)
    .input("estado", sql.NVarChar, "CUSTODIA")
    .input("codigo", sql.NVarChar, codigoUbicacion).query(`
        INSERT INTO Ubicacion (
          bodega_id, modulo, entrepano, cara, piso,
          coordenadaX, coordenadaY, coordenadaZ,
          ocupado, estado, codigo
        ) VALUES (
          @bodega_id, @modulo, @entrepano, @cara, @piso,
          @coordenadaX, @coordenadaY, @coordenadaZ,
          @ocupado, @estado, @codigo
        );
        SELECT SCOPE_IDENTITY() AS id;
      `);

  return { ubicacionId: insert.recordset[0].id, bodegaId };
};

/**
 * Procesa e inserta cada fila del archivo CSV.
 */
const procesarCSV = async (filePath, pool) => {
  const filas = [];
  const antes = await pool
    .request()
    .query("SELECT COUNT(*) AS total FROM dbo.Custodia");
  console.log(
    "Registros en Custodia antes de carga:",
    antes.recordset[0].total
  );

  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(
        csv({
          separator: ";",
          mapHeaders: ({ header }) =>
            header
              .replace(/^\uFEFF/, "")
              .trim()
              .toUpperCase(),
        })
      )
      .on("data", (data) => filas.push(data))
      .on("end", async () => {
        try {
          for (const fila of filas) {
            if (!fila.ITEM || fila.ITEM.trim() === "") {
              console.warn(`Fila ignorada por falta de ITEM:`, fila);
              continue;
            }

            const { ubicacionId, bodegaId } = await obtenerOInsertarUbicacion(
              pool,
              fila.BODEGA,
              fila["UBICACIÓN"]
            );

            const estadoTransformado = transformarEstado(fila.ESTADO);

            await pool
              .request()
              .input("bodega_id", sql.Int, bodegaId)
              .input("item", sql.NVarChar, fila.ITEM)
              .input("referencia1", sql.NVarChar, fila.REFERENCIA1)
              .input("referencia2", sql.NVarChar, fila.REFERENCIA2)
              .input("referencia3", sql.NVarChar, fila.REFERENCIA3 || "")
              .input("estado", sql.NVarChar, estadoTransformado)
              .input("ubicacionId", sql.Int, ubicacionId).query(`
                    INSERT INTO Custodia (
                    bodega_id, item, ubicacionId, clienteId,
                    referencia1, referencia2, referencia3,
                    estado, baja, pdfPath, updatedAt
                    ) VALUES (
                    @bodega_id, @item, @ubicacionId, 2,
                    @referencia1, @referencia2, @referencia3,
                    @estado, 0, NULL, GETDATE()
                    )
                `);
          }

          const result = await pool
            .request()
            .query("SELECT COUNT(*) AS total FROM dbo.Custodia");
          console.log(
            "Total registros Custodia después de insertar:",
            result.recordset[0].total
          );
          resolve(filas.length);
        } catch (err) {
          reject(err);
        }
      })
      .on("error", (error) => reject(error));
  });
};

/**
 * Endpoint para carga masiva de custodias.
 */
const cargarCustodias = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Archivo no proporcionado." });
  }

  const filePath = path.resolve(req.file.path);

  try {
    const pool = await connectDB();

    await limpiarTablas(pool);
    const total = await procesarCSV(filePath, pool);

    // fs.unlinkSync(filePath); // limpiar archivo si quieres
    return res.status(200).json({
      message: `Carga exitosa de ${total} registros.`,
      type: "success",
    });
  } catch (error) {
    console.error("Error al cargar custodias:", error);
    return res.status(500).json({ error: "Error en la carga masiva." });
  }
};

module.exports = {
  cargarCustodias,
};
