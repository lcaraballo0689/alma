const { connectDB, sql } = require('../config/db');

class DatabaseService {
  constructor() {
    this.pool = null;
  }

  async getPool() {
    if (!this.pool) {
      this.pool = await connectDB();
    }
    return this.pool;
  }

  // Ejecutar una consulta simple
  async query(sqlQuery, params = {}) {
    try {
      const pool = await this.getPool();
      let request = pool.request();

      // Agregar parámetros a la consulta
      for (const [key, value] of Object.entries(params)) {
        request.input(key, this.getSqlType(value), value);
      }

      const result = await request.query(sqlQuery);
      return result;
    } catch (error) {
      console.error('Error en la consulta:', error);
      throw error;
    }
  }

  // Ejecutar una consulta dentro de una transacción
  async executeInTransaction(callback) {
    const pool = await this.getPool();
    const transaction = new sql.Transaction(pool);

    try {
      await transaction.begin();
      const result = await callback(transaction);
      await transaction.commit();
      return result;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // Obtener el tipo SQL adecuado basado en el valor JavaScript
  getSqlType(value) {
    if (value === null || value === undefined) return sql.VarChar;
    
    switch (typeof value) {
      case 'number':
        return Number.isInteger(value) ? sql.Int : sql.Float;
      case 'boolean':
        return sql.Bit;
      case 'string':
        return sql.NVarChar;
      case 'object':
        if (value instanceof Date) return sql.DateTime;
        if (Buffer.isBuffer(value)) return sql.VarBinary;
        return sql.NVarChar;
      default:
        return sql.VarChar;
    }
  }

  // Métodos de ayuda para operaciones comunes
  async findOne(table, conditions = {}, fields = '*') {
    const whereClause = Object.keys(conditions).length > 0
      ? `WHERE ${Object.keys(conditions).map(key => `${key} = @${key}`).join(' AND ')}`
      : '';

    const query = `SELECT ${fields} FROM ${table} ${whereClause}`;
    const result = await this.query(query, conditions);
    return result.recordset[0];
  }

  async findAll(table, conditions = {}, fields = '*', orderBy = '') {
    const whereClause = Object.keys(conditions).length > 0
      ? `WHERE ${Object.keys(conditions).map(key => `${key} = @${key}`).join(' AND ')}`
      : '';

    const orderByClause = orderBy ? `ORDER BY ${orderBy}` : '';
    const query = `SELECT ${fields} FROM ${table} ${whereClause} ${orderByClause}`;
    const result = await this.query(query, conditions);
    return result.recordset;
  }

  async insert(table, data) {
    const columns = Object.keys(data);
    const values = columns.map(col => `@${col}`);
    
    const query = `
      INSERT INTO ${table} (${columns.join(', ')})
      OUTPUT INSERTED.*
      VALUES (${values.join(', ')})
    `;

    const result = await this.query(query, data);
    return result.recordset[0];
  }

  async update(table, data, conditions) {
    const setClause = Object.keys(data)
      .map(key => `${key} = @${key}`)
      .join(', ');

    const whereClause = Object.keys(conditions)
      .map(key => `${key} = @where_${key}`)
      .join(' AND ');

    const params = {
      ...data,
      ...Object.keys(conditions).reduce((acc, key) => {
        acc[`where_${key}`] = conditions[key];
        return acc;
      }, {})
    };

    const query = `
      UPDATE ${table}
      SET ${setClause}
      OUTPUT INSERTED.*
      WHERE ${whereClause}
    `;

    const result = await this.query(query, params);
    return result.recordset[0];
  }

  async delete(table, conditions) {
    const whereClause = Object.keys(conditions)
      .map(key => `${key} = @${key}`)
      .join(' AND ');

    const query = `
      DELETE FROM ${table}
      OUTPUT DELETED.*
      WHERE ${whereClause}
    `;

    const result = await this.query(query, conditions);
    return result.recordset[0];
  }

  // Método para ejecutar procedimientos almacenados
  async executeProcedure(procedureName, params = {}) {
    try {
      const pool = await this.getPool();
      let request = pool.request();

      for (const [key, value] of Object.entries(params)) {
        request.input(key, this.getSqlType(value), value);
      }

      const result = await request.execute(procedureName);
      return result;
    } catch (error) {
      console.error(`Error al ejecutar el procedimiento ${procedureName}:`, error);
      throw error;
    }
  }

  // Método para paginación
  async paginate(table, page = 1, pageSize = 10, conditions = {}, fields = '*', orderBy = '') {
    const offset = (page - 1) * pageSize;
    
    const whereClause = Object.keys(conditions).length > 0
      ? `WHERE ${Object.keys(conditions).map(key => `${key} = @${key}`).join(' AND ')}`
      : '';

    const orderByClause = orderBy ? `ORDER BY ${orderBy}` : '';
    
    const countQuery = `
      SELECT COUNT(*) as total
      FROM ${table}
      ${whereClause}
    `;

    const dataQuery = `
      SELECT ${fields}
      FROM ${table}
      ${whereClause}
      ${orderByClause}
      OFFSET ${offset} ROWS
      FETCH NEXT ${pageSize} ROWS ONLY
    `;

    const [countResult, dataResult] = await Promise.all([
      this.query(countQuery, conditions),
      this.query(dataQuery, conditions)
    ]);

    const total = countResult.recordset[0].total;

    return {
      data: dataResult.recordset,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        hasMore: offset + pageSize < total
      }
    };
  }
}

// Exportar una instancia única del servicio
module.exports = new DatabaseService(); 