require('dotenv').config();
const { connectDB } = require('../config/db');

async function checkUser() {
  try {
    const pool = await connectDB();
    const result = await pool.request().query(`
      SELECT TOP 1 id, email, nombre 
      FROM Usuario 
      WHERE email IS NOT NULL
    `);
    
    console.log('Usuario de prueba encontrado:');
    console.log(result.recordset);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUser(); 