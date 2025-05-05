const mysql = require("mysql2/promise")
const logger = require("../utils/logger")

// Use environment variables or defaults for database connection
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'victoria_kids_shop',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
}

const pool = mysql.createPool(dbConfig)

// Test database connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection()
    logger.info("Database connection established successfully")
    connection.release()
  } catch (error) {
    logger.error(`Database connection failed: ${error.message}`)
    // In development, continue even if DB connection fails to allow for mock data usage
    if (process.env.NODE_ENV === 'production') {
      process.exit(1)
    } else {
      logger.warn("Continuing without database in development mode")
    }
  }
}

testConnection()

module.exports = pool
