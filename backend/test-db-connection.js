// Script para diagnosticar la conexión a la base de datos
// Ejecutar: node test-db-connection.js

require('dotenv').config();
const sql = require('mssql');
const path = require('path');

console.log('🔍 Diagnóstico de Conexión a Base de Datos');
console.log('==========================================');

// Verificar archivo .env
const envPath = path.join(__dirname, '.env');
const fs = require('fs');

console.log('\n1. Verificando archivo .env...');
if (fs.existsSync(envPath)) {
  console.log('✅ Archivo .env encontrado');
} else {
  console.log('❌ Archivo .env NO encontrado');
  console.log('💡 Solución: Crear archivo .env basado en .env.example');
  process.exit(1);
}

// Verificar variables de entorno
console.log('\n2. Verificando variables de entorno...');
const requiredVars = ['DB_SERVER', 'DB_DATABASE', 'DB_USER', 'DB_PASSWORD'];
const missingVars = [];

requiredVars.forEach(varName => {
  if (process.env[varName]) {
    console.log(`✅ ${varName}: ${varName === 'DB_PASSWORD' ? '***' : process.env[varName]}`);
  } else {
    console.log(`❌ ${varName}: NO DEFINIDA`);
    missingVars.push(varName);
  }
});

if (missingVars.length > 0) {
  console.log(`💡 Faltan variables: ${missingVars.join(', ')}`);
  process.exit(1);
}

// Configuración de conexión
const dbConfig = {
  server: process.env.DB_SERVER,
  port: parseInt(process.env.DB_PORT, 10) || 1433,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: true,
    trustServerCertificate: process.env.DB_TRUSTCERTIFICATE === 'true'
  },
  connectionTimeout: 30000,
  requestTimeout: 30000
};

console.log('\n3. Configuración de conexión:');
console.log(`   Servidor: ${dbConfig.server}`);
console.log(`   Puerto: ${dbConfig.port}`);
console.log(`   Base de datos: ${dbConfig.database}`);
console.log(`   Usuario: ${dbConfig.user}`);
console.log(`   Encrypt: ${dbConfig.options.encrypt}`);
console.log(`   Trust Certificate: ${dbConfig.options.trustServerCertificate}`);

// Intentar conexión
console.log('\n4. Intentando conexión...');
async function testConnection() {
  try {
    console.log('⏳ Conectando...');
    const pool = await sql.connect(dbConfig);
    console.log('✅ ¡Conexión exitosa!');
    
    // Probar una consulta simple
    console.log('\n5. Probando consulta...');
    const result = await pool.request().query('SELECT @@VERSION as version');
    console.log('✅ Consulta exitosa:');
    console.log(result.recordset[0].version);
    
    // Verificar tabla SolicitudTransporte
    console.log('\n6. Verificando tabla SolicitudTransporte...');
    try {
      const tableCheck = await pool.request().query(`
        SELECT COUNT(*) as count 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_NAME = 'SolicitudTransporte'
      `);
      
      if (tableCheck.recordset[0].count > 0) {
        console.log('✅ Tabla SolicitudTransporte existe');
        
        // Verificar columna observacionesUsuario
        const columnCheck = await pool.request().query(`
          SELECT COUNT(*) as count 
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_NAME = 'SolicitudTransporte' 
          AND COLUMN_NAME = 'observacionesUsuario'
        `);
        
        if (columnCheck.recordset[0].count > 0) {
          console.log('✅ Columna observacionesUsuario existe');
        } else {
          console.log('⚠️ Columna observacionesUsuario NO existe');
          console.log('💡 Ejecutar: backend/sql/ADD_observacionesUsuario_Column.sql');
        }
      } else {
        console.log('❌ Tabla SolicitudTransporte NO existe');
      }
    } catch (tableError) {
      console.log('⚠️ Error verificando tabla:', tableError.message);
    }
    
    await pool.close();
    console.log('\n✅ Diagnóstico completado - Base de datos OK');
    
  } catch (error) {
    console.error('\n❌ Error de conexión:', error.message);
    console.log('\n💡 Posibles soluciones:');
    console.log('   1. Verificar que SQL Server esté ejecutándose');
    console.log('   2. Verificar usuario y contraseña');
    console.log('   3. Verificar que TCP/IP esté habilitado');
    console.log('   4. Verificar firewall (puerto 1433)');
    console.log('   5. Ver archivo SOLUCION_BaseDatos.md para más detalles');
  }
}

testConnection();
