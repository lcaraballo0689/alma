require('dotenv').config();
const { connectDB } = require('../config/db');
const fs = require('fs').promises;
const path = require('path');

async function createPasswordResetsTable() {
  try {
    const pool = await connectDB();
    
    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, '..', 'sql', 'create_password_resets_table.sql');
    const sqlScript = await fs.readFile(sqlPath, 'utf8');
    
    // Ejecutar el script
    await pool.request().query(sqlScript);
    
    console.log('Tabla PasswordResets creada exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('Error al crear la tabla PasswordResets:', error);
    process.exit(1);
  }
}

createPasswordResetsTable(); 