#!/usr/bin/env node

const vorpal = require('vorpal')();
const { spawn } = require('child_process');
const path = require('path');

function runProcess(command, args, cwd, label, vorpalInstance) {
  const proc = spawn(command, args, { cwd, shell: true });
  proc.stdout.on('data', (data) => {
    vorpalInstance.log(`[${label}] ${data.toString()}`);
  });
  proc.stderr.on('data', (data) => {
    vorpalInstance.log(`[${label}][ERROR] ${data.toString()}`);
  });
  proc.on('close', (code) => {
    vorpalInstance.log(`[${label}] proceso finalizado con código ${code}`);
  });
  return proc;
}

vorpal
  .delimiter('alma-cli$')
  .show();

vorpal
  .command('start', 'Inicia el backend y el frontend')
  .action(function(args, callback) {
    this.log('Iniciando backend y frontend...');
    // Iniciar backend
    const backendPath = path.join(__dirname, 'backend');
    runProcess('npm', ['run', 'start'], backendPath, 'BACKEND', this);
    // Iniciar frontend
    const frontendPath = path.join(__dirname, 'frontend');
    runProcess('npm', ['run', 'dev'], frontendPath, 'FRONTEND', this);
    this.log('Ambos procesos han sido lanzados.');
    callback();
  });

vorpal
  .command('test', 'Ejecuta las pruebas unitarias')
  .action(function(args, callback) {
    this.log('Ejecutando pruebas...');
    // Aquí puedes invocar tu runner de pruebas
    callback();
  });

vorpal
  .command('build', 'Compila el frontend')
  .action(function(args, callback) {
    this.log('Compilando el frontend...');
    // Aquí puedes invocar tu script de build
    callback();
  });

vorpal
  .command('deploy', 'Despliega la aplicación')
  .action(function(args, callback) {
    this.log('Desplegando la aplicación...');
    // Aquí puedes invocar tu script de despliegue
    callback();
  });

// Puedes agregar más comandos personalizados aquí

