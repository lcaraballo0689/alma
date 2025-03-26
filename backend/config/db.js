// src/config/db.js
require('dotenv').config();
const sql = require('mssql');

const dbConfig = {
  server: process.env.DB_SERVER,
  port: parseInt(process.env.DB_PORT, 10),
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: true,
    trustServerCertificate: process.env.DB_TRUSTCERTIFICATE === 'true'
  }
};

let pool;

async function connectDB() {
  if (!pool) {
    pool = await sql.connect(dbConfig);
    console.log('Conexión a la base de datos establecida.');
  }
  return pool;
}

module.exports = { connectDB, sql };
