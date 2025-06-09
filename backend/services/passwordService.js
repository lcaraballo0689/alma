const { connectDB, sql } = require('../config/db');
const bcrypt = require('bcryptjs');

const passwordService = {
  // Buscar usuario por email
  findUserByEmail: async (email) => {
    try {
      const pool = await connectDB();
      const result = await pool.request()
        .input('email', sql.VarChar(255), email)
        .query(`
          SELECT id, email, nombre, clienteId
          FROM dbo.Usuario
          WHERE email = @email
        `);
      
      return result.recordset[0];
    } catch (error) {
      console.error('Error al buscar usuario por email:', error);
      throw error;
    }
  },

  // Actualizar contraseña
  updatePassword: async (userId, newPassword) => {
    try {
      const pool = await connectDB();
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      const result = await pool.request()
        .input('userId', sql.Int, userId)
        .input('password', sql.VarChar(255), hashedPassword)
        .query(`
          UPDATE dbo.Usuario
          SET password = @password
          WHERE id = @userId
        `);
      
      return result.rowsAffected[0] > 0;
    } catch (error) {
      console.error('Error al actualizar contraseña:', error);
      throw error;
    }
  }
};

module.exports = passwordService; 