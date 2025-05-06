const mysql = require('mysql2/promise');
const { Pool } = require('pg');
const logger = require('../utils/logger');

const isPostgres = process.env.DB_TYPE === 'postgres';

const dbConfig = {
  host: process.env.DB_HOST || 'dpg-d0d4pl6mcj7s739rr3qg-a',
  user: process.env.DB_USER || 'victoria_kids_user',
  password: process.env.DB_PASSWORD || 'ESOS6mG12ET1bmnYRwNG7CP8javds5cG',
  database: process.env.DB_NAME || 'victoria_kids_shop',
  port: process.env.DB_PORT || 5432,
  ssl: {
    rejectUnauthorized: false // Required for Render's PostgreSQL
  }
};

logger.info('Database Configuration:', {
  ...dbConfig,
  password: '***' // Hide password in logs
});

let pool;

if (isPostgres) {
  try {
    pool = new Pool(dbConfig);
    
    // Test the connection
    pool.on('connect', () => {
      logger.info('Successfully connected to PostgreSQL database');
    });

    pool.on('error', (err) => {
      logger.error('Unexpected error on idle PostgreSQL client', err);
    });
  } catch (error) {
    logger.error('Error creating PostgreSQL pool:', error);
    throw error;
  }
} else {
  try {
    pool = mysql.createPool(dbConfig);
  } catch (error) {
    logger.error('Error creating MySQL pool:', error);
    throw error;
  }
}

const query = async (text, params) => {
  try {
    if (isPostgres) {
      const result = await pool.query(text, params);
      return result.rows;
    } else {
      const [rows] = await pool.query(text, params);
      return rows;
    }
  } catch (error) {
    logger.error('Database query error:', error);
    logger.error('Query:', text);
    logger.error('Parameters:', params);
    throw error;
  }
};

// Test database connection
const testConnection = async () => {
  try {
    logger.info('Testing database connection...');
    if (isPostgres) {
      const result = await pool.query('SELECT NOW()');
      logger.info('Database connection test successful:', result.rows[0]);
    } else {
      const [result] = await pool.query('SELECT NOW()');
      logger.info('Database connection test successful:', result[0]);
    }
    return true;
  } catch (error) {
    logger.error('Database connection test failed:', error);
    return false;
  }
};

module.exports = {
  query,
  pool,
  isPostgres,
  testConnection
}; 