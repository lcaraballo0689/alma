const { connectDB, sql } = require('../../config/db');

const PasswordReset = {
  // Crear un nuevo token de recuperación
  create: async (userId, email, token, expiresAt) => {
    try {
      const pool = await connectDB();
      const result = await pool.request()
        .input('userId', sql.Int, userId)
        .input('email', sql.VarChar(255), email)
        .input('token', sql.VarChar(255), token)
        .input('expiresAt', sql.DateTime, expiresAt)
        .query(`
          INSERT INTO password_resets (user_id, email, token, expires_at, created_at)
          VALUES (@userId, @email, @token, @expiresAt, GETDATE());
          SELECT SCOPE_IDENTITY() AS id;
        `);
      
      return result.recordset[0].id;
    } catch (error) {
      console.error('Error al crear token de recuperación:', error);
      throw error;
    }
  },

  // Buscar un token válido
  findValidToken: async (token) => {
    try {
      const pool = await connectDB();
      const result = await pool.request()
        .input('token', sql.VarChar(255), token)
        .query(`
          SELECT TOP 1 * FROM password_resets 
          WHERE token = @token 
          AND expires_at > GETDATE() 
          AND used = 0
          ORDER BY created_at DESC
        `);
      
      return result.recordset[0];
    } catch (error) {
      console.error('Error al buscar token:', error);
      throw error;
    }
  },

  // Marcar un token como usado
  markAsUsed: async (token) => {
    try {
      const pool = await connectDB();
      const result = await pool.request()
        .input('token', sql.VarChar(255), token)
        .query(`
          UPDATE password_resets 
          SET used = 1, updated_at = GETDATE() 
          WHERE token = @token
        `);
      
      return result.rowsAffected[0] > 0;
    } catch (error) {
      console.error('Error al marcar token como usado:', error);
      throw error;
    }
  },

  // Invalidar tokens anteriores del usuario
  invalidateUserTokens: async (userId) => {
    try {
      const pool = await connectDB();
      const result = await pool.request()
        .input('userId', sql.Int, userId)
        .query(`
          UPDATE password_resets 
          SET used = 1, updated_at = GETDATE() 
          WHERE user_id = @userId AND used = 0
        `);
      
      return result.rowsAffected[0];
    } catch (error) {
      console.error('Error al invalidar tokens:', error);
      throw error;
    }
  }
};

module.exports = PasswordReset; 