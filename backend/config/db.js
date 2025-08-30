// src/config/db.js
require('dotenv').config();
const sql = require('mssql');

const dbConfig = {
  server: process.env.DB_SERVER,
  port: parseInt(process.env.DB_PORT, 10),
  database: process.env.DB_DATABASE,
  options: {
    encrypt: true,
    trustServerCertificate: process.env.DB_TRUSTCERTIFICATE === 'true'
  },
  // Opcional: aumentar los tiempos de timeout si el servidor responde lentamente
  connectionTimeout: 60000,  // 60 segundos
  requestTimeout: 60000
};

// Configurar autenticación según las variables de entorno
if (process.env.DB_INTEGRATED_SECURITY === 'true') {
  // Usar autenticación integrada de Windows
  dbConfig.options.trustedConnection = true;
  console.log('Usando autenticación integrada de Windows');
} else {
  // Usar autenticación SQL Server
  dbConfig.user = process.env.DB_USER;
  dbConfig.password = process.env.DB_PASSWORD;
  console.log('Usando autenticación SQL Server con usuario:', process.env.DB_USER);
}

let pool;

async function connectDB() {
  if (!pool) {
    pool = await sql.connect(dbConfig);
    console.log('Conexión a la base de datos establecida.');
  }
  return pool;
}

module.exports = { connectDB, sql };
