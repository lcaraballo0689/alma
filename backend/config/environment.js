/**
 * @fileoverview Configuración de entorno para manejar diferencias entre desarrollo y producción.
 */

const path = require('path');
const fs = require('fs');

// Determinar el entorno actual
const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production' || NODE_ENV === 'produccion';

// Configuración de rutas base para archivos
const BASE_DIR = path.resolve(__dirname, '..');
const UPLOADS_DIR = path.join(BASE_DIR, 'uploads');

// Asegurar que los directorios necesarios existen
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✅ Directorio creado: ${dirPath}`);
  }
};

// Crear directorios necesarios
ensureDirectoryExists(UPLOADS_DIR);
ensureDirectoryExists(path.join(UPLOADS_DIR, 'firmas'));
ensureDirectoryExists(path.join(UPLOADS_DIR, 'entregas'));
ensureDirectoryExists(path.join(BASE_DIR, 'public'));
ensureDirectoryExists(path.join(BASE_DIR, 'public', 'pdfs'));

// Función para resolver rutas de archivos considerando el entorno
const resolveFilePath = (relativePath) => {
  if (path.isAbsolute(relativePath)) {
    return relativePath;
  }
  
  // Si la ruta comienza con 'uploads/', asegurarse de que apunte al directorio correcto
  if (relativePath.startsWith('uploads/')) {
    return path.join(BASE_DIR, relativePath);
  }
  
  // Para otras rutas relativas, mantener comportamiento predeterminado
  return path.join(BASE_DIR, relativePath);
};

// Función para convertir rutas de archivos a base64
const filePathToBase64 = (filePath) => {
  try {
    // Si la ruta está vacía o es undefined/null, retornamos cadena vacía
    if (!filePath) {
      console.warn(`⚠️ Ruta de archivo vacía o no definida`);
      return '';
    }
    
    // Resolver la ruta absoluta
    const absolutePath = resolveFilePath(filePath);
    console.log(`🔍 Intentando leer archivo desde: ${absolutePath}`);
    
    // Verificar que el archivo existe
    if (!fs.existsSync(absolutePath)) {
      console.warn(`⚠️ Archivo no encontrado: ${absolutePath}`);
      
      // Intentar un enfoque alternativo para entornos de producción
      if (isProduction) {
        // En producción, probar diferentes rutas comunes si la original no existe
        const alternativePaths = [
          path.join(BASE_DIR, 'uploads', path.basename(filePath)),
          path.join(BASE_DIR, 'public', path.basename(filePath)),
          path.join(BASE_DIR, path.basename(filePath))
        ];
        
        for (const altPath of alternativePaths) {
          console.log(`🔍 Intentando ruta alternativa: ${altPath}`);
          if (fs.existsSync(altPath)) {
            console.log(`✅ Archivo encontrado en ruta alternativa: ${altPath}`);
            const fileBuffer = fs.readFileSync(altPath);
            return fileBuffer.toString('base64');
          }
        }
      }
      
      return '';
    }
    
    // Leer el archivo y convertir a base64
    const fileBuffer = fs.readFileSync(absolutePath);
    console.log(`✅ Archivo leído correctamente: ${absolutePath} (${fileBuffer.length} bytes)`);
    return fileBuffer.toString('base64');
  } catch (error) {
    console.error(`❌ Error al convertir archivo a base64: ${error.message}`);
    console.error(error.stack);
    return '';
  }
};

module.exports = {
  isProduction,
  NODE_ENV,
  BASE_DIR,
  UPLOADS_DIR,
  resolveFilePath,
  filePathToBase64,
  ensureDirectoryExists
};
