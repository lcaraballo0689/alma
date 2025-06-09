require('dotenv').config();
const { connectDB } = require('../config/db');

async function checkTables() {
  try {
    const pool = await connectDB();
    const result = await pool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
    `);
    
    console.log('Tablas en la base de datos:');
    console.log(result.recordset);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkTables(); 