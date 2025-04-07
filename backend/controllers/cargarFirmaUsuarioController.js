const fs = require("fs");
const path = require("path");
const { connectDB, sql } = require("../config/db");

async function cargarFirmaUsuarioArchivo(req, res) {
  const { usuarioId } = req.body;

  if (!usuarioId || !req.file) {
    return res.status(400).json({ error: "Se requieren 'usuarioId' y el archivo de firma." });
  }

  try {
    const firmaPath = req.file.path;

    // ✅ Crear el directorio si no existe
    const dir = path.dirname(firmaPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // ✅ Leer el archivo y convertir a base64
    const firmaBuffer = fs.readFileSync(firmaPath);
    const firmaBase64 = firmaBuffer.toString("base64");

    const pool = await connectDB();

    await pool.request()
      .input("id", sql.Int, usuarioId)
      .input("firma", sql.VarChar(sql.MAX), firmaBase64)
      .query(`
        UPDATE [bodegapp2_bk].[dbo].[Usuario]
        SET firma = @firma
        WHERE id = @id
      `);

    // ✅ Eliminar archivo temporal después de guardar
    fs.unlinkSync(firmaPath);

    console.log(`✅ Firma cargada por archivo para usuario ${usuarioId}`);
    res.json({ message: "Firma cargada exitosamente desde archivo." });
  } catch (error) {
    console.error("❗ Error al subir la firma desde archivo:", error.message);
    res.status(500).json({ error: "Error interno del servidor." });
  }
}

module.exports = {
  cargarFirmaUsuarioArchivo,
};
