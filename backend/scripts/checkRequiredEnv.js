require('dotenv').config();

const requiredEnvVars = [
  'DB_USER',
  'DB_PASSWORD',
  'DB_SERVER',
  'DB_DATABASE',
  'PORT',
  'JWT_SECRET',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'FRONTEND_URL'
];

console.log('Verificando variables de entorno requeridas:');
let missingVars = false;

requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    console.log(`❌ ${varName}: No configurado`);
    missingVars = true;
  } else {
    console.log(`✓ ${varName}: Configurado`);
  }
});

if (missingVars) {
  console.log('\n⚠️ Algunas variables de entorno requeridas no están configuradas.');
  console.log('Por favor, crea un archivo .env con las siguientes variables:');
  console.log(`
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña
DB_SERVER=tu_servidor
DB_DATABASE=tu_base_de_datos
PORT=3001
JWT_SECRET=tu_clave_secreta
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_correo@gmail.com
SMTP_PASS=tu_contraseña_de_aplicacion
FRONTEND_URL=http://localhost:3000
`);
} else {
  console.log('\n✅ Todas las variables de entorno requeridas están configuradas.');
} 