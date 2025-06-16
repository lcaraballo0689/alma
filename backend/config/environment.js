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
    const absolutePath = resolveFilePath(filePath);
    
    if (!fs.existsSync(absolutePath)) {
      console.warn(`⚠️ Archivo no encontrado: ${absolutePath}`);
      return '';
    }
    
    const fileBuffer = fs.readFileSync(absolutePath);
    return fileBuffer.toString('base64');
  } catch (error) {
    console.error(`❌ Error al convertir archivo a base64: ${error.message}`);
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
