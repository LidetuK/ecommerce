/**
 * Database Migration Runner
 * 
 * This script runs database migrations to:
 * 1. Set up initial database schema
 * 2. Apply schema changes
 * 3. Add seed data if needed
 * 
 * Usage:
 *   node migrate.js                  - Run all pending migrations
 *   node migrate.js up               - Run all pending migrations
 *   node migrate.js down             - Rollback the last applied migration
 *   node migrate.js down --all       - Rollback all migrations
 *   node migrate.js create <name>    - Create a new migration file
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const readline = require('readline');

// Load environment variables
dotenv.config();

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'victoria_kids_shop',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// Ensure migrations directory exists
const migrationsDir = path.join(__dirname, 'migrations');
if (!fs.existsSync(migrationsDir)) {
  fs.mkdirSync(migrationsDir);
}

// Get all migration files
const getMigrationFiles = () => {
  return fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.js'))
    .sort();
};

// Connect to database
const connectDatabase = async () => {
  try {
    // First try to connect to the specific database
    return await mysql.createConnection(dbConfig);
  } catch (error) {
    // If database doesn't exist, connect to MySQL without database
    if (error.code === 'ER_BAD_DB_ERROR') {
      console.log(`Database '${dbConfig.database}' does not exist. Creating it...`);
      const rootConnection = await mysql.createConnection({
        host: dbConfig.host,
        user: dbConfig.user,
        password: dbConfig.password,
        port: dbConfig.port
      });
      
      // Create database
      await rootConnection.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
      console.log(`Database '${dbConfig.database}' created successfully.`);
      
      // Connect to the newly created database
      await rootConnection.end();
      return await mysql.createConnection(dbConfig);
    } else {
      throw error;
    }
  }
};

// Create the migrations table if it doesn't exist
const ensureMigrationsTable = async (connection) => {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

// Get applied migrations from database
const getAppliedMigrations = async (connection) => {
  const [rows] = await connection.query('SELECT name FROM migrations ORDER BY id');
  return rows.map(row => row.name);
};

// Run pending migrations
const runMigrations = async (connection, direction = 'up') => {
  try {
    // Get migration files
    const migrationFiles = getMigrationFiles();
    
    // Get applied migrations
    const appliedMigrations = await getAppliedMigrations(connection);
    
    if (direction === 'up') {
      // Get pending migrations
      const pendingMigrations = migrationFiles.filter(file => !appliedMigrations.includes(file));
      
      if (pendingMigrations.length === 0) {
        console.log('No pending migrations to apply.');
        return;
      }
      
      console.log(`Found ${pendingMigrations.length} pending migrations.`);
      
      // Apply each pending migration
      for (const file of pendingMigrations) {
        console.log(`Applying migration: ${file}`);
        const migration = require(path.join(migrationsDir, file));
        
        // Apply the up migration
        await migration.up(connection);
        
        // Record the migration
        await connection.query('INSERT INTO migrations (name) VALUES (?)', [file]);
        
        console.log(`Migration applied: ${file}`);
      }
      
      console.log('All migrations have been applied.');
    } else if (direction === 'down') {
      // Check if we want to rollback all migrations
      const rollbackAll = process.argv.includes('--all');
      
      if (appliedMigrations.length === 0) {
        console.log('No migrations to rollback.');
        return;
      }
      
      if (rollbackAll) {
        console.log(`Rolling back all migrations (${appliedMigrations.length})...`);
        
        // Rollback in reverse order
        const reversedMigrations = [...appliedMigrations].reverse();
        
        for (const file of reversedMigrations) {
          console.log(`Rolling back migration: ${file}`);
          const migration = require(path.join(migrationsDir, file));
          
          // Apply the down migration
          await migration.down(connection);
          
          // Remove the migration record
          await connection.query('DELETE FROM migrations WHERE name = ?', [file]);
          
          console.log(`Migration rolled back: ${file}`);
        }
        
        console.log('All migrations have been rolled back.');
      } else {
        // Get the last applied migration
        const lastMigration = appliedMigrations[appliedMigrations.length - 1];
        
        console.log(`Rolling back the last migration: ${lastMigration}`);
        const migration = require(path.join(migrationsDir, lastMigration));
        
        // Apply the down migration
        await migration.down(connection);
        
        // Remove the migration record
        await connection.query('DELETE FROM migrations WHERE name = ?', [lastMigration]);
        
        console.log(`Migration rolled back: ${lastMigration}`);
      }
    }
  } catch (error) {
    console.error('Error running migrations:', error);
    throw error;
  }
};

// Create a new migration file
const createMigration = (name) => {
  if (!name) {
    console.error('Migration name is required.');
    process.exit(1);
  }
  
  // Format the name to snake_case
  const formattedName = name.toLowerCase().replace(/\s+/g, '_');
  
  // Generate a timestamp
  const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, '').substring(0, 14);
  
  // Create the file name
  const fileName = `${timestamp}_${formattedName}.js`;
  
  // Create the file content
  const fileContent = `/**
 * Migration: ${timestamp}_${formattedName}
 * Description: 
 */

const up = async (connection) => {
  // Add your migration code here
};

const down = async (connection) => {
  // Add your rollback code here
};

module.exports = {
  up,
  down
};`;
  
  // Write the file
  fs.writeFileSync(path.join(migrationsDir, fileName), fileContent);
  
  console.log(`Migration file created: ${fileName}`);
};

// Main function
const main = async () => {
  const command = process.argv[2] || 'up';
  
  if (command === 'create') {
    const name = process.argv[3];
    createMigration(name);
    process.exit(0);
  }
  
  let connection;
  
  try {
    // Connect to database
    connection = await connectDatabase();
    
    // Ensure migrations table exists
    await ensureMigrationsTable(connection);
    
    // Run migrations
    if (command === 'up' || command === 'down') {
      await runMigrations(connection, command);
    } else {
      console.error('Invalid command. Use "up", "down", or "create".');
      process.exit(1);
    }
    
    // Close connection
    await connection.end();
    console.log('Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    
    if (connection) {
      await connection.end();
    }
    
    process.exit(1);
  }
};

// Run the main function
main(); 