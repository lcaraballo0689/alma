/**
 * Script para instalar todas las dependencias necesarias tanto en el frontend como en el backend.
 * 
 * Uso: node install-deps.js
 */
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Colores para diferenciar la salida en consola
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Rutas de los directorios
const backendDir = path.join(__dirname, 'backend');
const frontendDir = path.join(__dirname, 'frontend');

// Verificar que las rutas existan
if (!fs.existsSync(backendDir)) {
  console.error(`${colors.red}Error: No se encontró la carpeta del backend en ${backendDir}${colors.reset}`);
  process.exit(1);
}

if (!fs.existsSync(frontendDir)) {
  console.error(`${colors.red}Error: No se encontró la carpeta del frontend en ${frontendDir}${colors.reset}`);
  process.exit(1);
}

// Función para instalar dependencias
function installDeps(name, directory) {
  return new Promise((resolve, reject) => {
    const isWindows = os.platform() === 'win32';
    const npmCmd = isWindows ? 'npm.cmd' : 'npm';
    
    console.log(`${colors.yellow}Instalando dependencias para ${name}...${colors.reset}`);
    
    const proc = spawn(npmCmd, ['install'], {
      cwd: directory,
      stdio: 'pipe',
      shell: true
    });
    
    const prefix = name === 'BACKEND' ? colors.cyan : colors.green;
    
    proc.stdout.on('data', (data) => {
      const lines = data.toString().trim().split('\n');
      lines.forEach(line => {
        if (line.trim()) {
          console.log(`${prefix}[${name}] ${line}${colors.reset}`);
        }
      });
    });
    
    proc.stderr.on('data', (data) => {
      const lines = data.toString().trim().split('\n');
      lines.forEach(line => {
        if (line.trim() && !line.includes('WARN')) { // Ignorar advertencias npm
          console.log(`${colors.red}[${name} ERROR] ${line}${colors.reset}`);
        }
      });
    });
    
    proc.on('close', (code) => {
      if (code !== 0) {
        console.log(`${colors.red}[${name}] Instalación finalizada con código: ${code}${colors.reset}`);
        reject(new Error(`Error instalando dependencias para ${name}`));
      } else {
        console.log(`${colors.green}[${name}] Dependencias instaladas correctamente${colors.reset}`);
        resolve();
      }
    });
  });
}

console.log(`${colors.magenta}=== Iniciando instalación de dependencias ===${colors.reset}`);

// Instalar dependencias secuencialmente
async function installAll() {
  try {
    await installDeps('BACKEND', backendDir);
    await installDeps('FRONTEND', frontendDir);
    console.log(`${colors.magenta}=== Todas las dependencias han sido instaladas correctamente ===${colors.reset}`);
    console.log(`${colors.yellow}Puedes iniciar el proyecto con: node start-dev.js${colors.reset}`);
  } catch (err) {
    console.error(`${colors.red}Error durante la instalación: ${err.message}${colors.reset}`);
    process.exit(1);
  }
}

installAll();