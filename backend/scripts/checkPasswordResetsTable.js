require('dotenv').config();
const { connectDB } = require('../config/db');

async function checkPasswordResetsTable() {
  try {
    const pool = await connectDB();
    const result = await pool.request().query(`
      SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        CHARACTER_MAXIMUM_LENGTH,
        IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'PasswordResets'
      ORDER BY ORDINAL_POSITION;
    `);
    
    console.log('Estructura de la tabla PasswordResets:');
    console.log(result.recordset);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkPasswordResetsTable(); 