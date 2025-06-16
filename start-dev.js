/**
 * Script para iniciar tanto el backend como el frontend en modo desarrollo.
 * Utiliza concurrently para ejecutar ambos servidores paralelamente.
 * 
 * Uso: node start-dev.js
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

// Función para iniciar un proceso
function startProcess(name, directory, command, args = []) {
  const isWindows = os.platform() === 'win32';
  const npmCmd = isWindows ? 'npm.cmd' : 'npm';
  const nodeCmd = isWindows ? 'node.exe' : 'node';
  
  const cmd = command === 'npm' ? npmCmd : nodeCmd;
  
  console.log(`${colors.yellow}Iniciando ${name}...${colors.reset}`);
  
  const proc = spawn(cmd, args, {
    cwd: directory,
    stdio: 'pipe',
    shell: true
  });
  
  // Prefijo para los logs
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
      if (line.trim()) {
        console.log(`${colors.red}[${name} ERROR] ${line}${colors.reset}`);
      }
    });
  });
  
  proc.on('close', (code) => {
    if (code !== 0) {
      console.log(`${colors.red}[${name}] Proceso finalizado con código: ${code}${colors.reset}`);
    } else {
      console.log(`${colors.yellow}[${name}] Proceso finalizado correctamente${colors.reset}`);
    }
  });
  
  return proc;
}

console.log(`${colors.magenta}=== Iniciando servidores de desarrollo ===${colors.reset}`);

// Iniciar backend primero
const backendProcess = startProcess('BACKEND', backendDir, 'npm', ['run', 'start']);

// Esperar un momento para que el backend inicie antes de lanzar el frontend
setTimeout(() => {
  const frontendProcess = startProcess('FRONTEND', frontendDir, 'npm', ['run', 'dev']);
  
  // Manejo de cierre limpio con Ctrl+C
  process.on('SIGINT', () => {
    console.log(`${colors.magenta}\nDeteniendo servidores...${colors.reset}`);
    backendProcess.kill();
    frontendProcess.kill();
    process.exit(0);
  });
}, 3000);

console.log(`${colors.magenta}Presiona Ctrl+C para detener ambos servidores${colors.reset}`);