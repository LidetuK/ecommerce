const mysql = require('mysql2/promise');
const { Pool } = require('pg');

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

console.log('Database Configuration:', {
  ...dbConfig,
  password: '***' // Hide password in logs
});

let pool;

if (isPostgres) {
  pool = new Pool(dbConfig);
  
  // Test the connection
  pool.on('connect', () => {
    console.log('Successfully connected to PostgreSQL database');
  });

  pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client', err);
  });
} else {
  pool = mysql.createPool(dbConfig);
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
    console.error('Database query error:', error);
    console.error('Query:', text);
    console.error('Parameters:', params);
    throw error;
  }
};

// Test database connection
const testConnection = async () => {
  try {
    if (isPostgres) {
      const result = await pool.query('SELECT NOW()');
      console.log('Database connection test successful:', result.rows[0]);
    } else {
      const [result] = await pool.query('SELECT NOW()');
      console.log('Database connection test successful:', result[0]);
    }
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
};

module.exports = {
  query,
  pool,
  isPostgres,
  testConnection
}; 