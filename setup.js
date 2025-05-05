/**
 * Victoria Kids Shop - Setup Script
 * 
 * This script helps set up the application by:
 * 1. Creating a .env file if it doesn't exist
 * 2. Creating the database and tables if they don't exist
 * 3. Adding sample data for development mode
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const readline = require('readline');
const crypto = require('crypto');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Default environment values
const defaultEnv = {
  NODE_ENV: 'development',
  PORT: 5000,
  DB_HOST: 'localhost',
  DB_USER: 'root',
  DB_PASSWORD: '',
  DB_NAME: 'victoria_kids_shop',
  DB_PORT: 3306,
  JWT_SECRET: crypto.randomBytes(32).toString('hex'),
  JWT_EXPIRES_IN: '30d',
  STRIPE_SECRET_KEY: 'sk_test_your_stripe_key_here',
  STRIPE_WEBHOOK_SECRET: 'whsec_your_webhook_secret_here'
};

// Function to create .env file
const createEnvFile = async () => {
  const envPath = path.join(__dirname, '.env');
  
  if (fs.existsSync(envPath)) {
    console.log('.env file already exists');
    return;
  }
  
  // Create .env content
  let envContent = '';
  for (const [key, value] of Object.entries(defaultEnv)) {
    envContent += `${key}=${value}\n`;
  }
  
  // Write .env file
  fs.writeFileSync(envPath, envContent);
  console.log('.env file created successfully');
};

// Function to create database and tables
const setupDatabase = async () => {
  try {
    console.log('Attempting to connect to MySQL server...');
    
    // Connect to MySQL server (without database)
    const connection = await mysql.createConnection({
      host: defaultEnv.DB_HOST,
      user: defaultEnv.DB_USER,
      password: defaultEnv.DB_PASSWORD,
      port: defaultEnv.DB_PORT
    });
    
    // Create database if it doesn't exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${defaultEnv.DB_NAME}`);
    console.log(`Database '${defaultEnv.DB_NAME}' created or already exists`);
    
    // Connect to the database
    await connection.query(`USE ${defaultEnv.DB_NAME}`);
    
    // Create users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        role ENUM('customer', 'admin') DEFAULT 'customer',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // Create categories table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        image VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // Create products table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        original_price DECIMAL(10, 2),
        image VARCHAR(255),
        category_id INT,
        stock INT DEFAULT 0,
        rating DECIMAL(3, 1) DEFAULT 0,
        reviews INT DEFAULT 0,
        featured BOOLEAN DEFAULT FALSE,
        is_new BOOLEAN DEFAULT FALSE,
        is_budget BOOLEAN DEFAULT FALSE,
        is_luxury BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
      )
    `);
    
    // Create shipping_addresses table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS shipping_addresses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        address_line1 VARCHAR(255) NOT NULL,
        address_line2 VARCHAR(255),
        city VARCHAR(100) NOT NULL,
        state VARCHAR(100) NOT NULL,
        zip_code VARCHAR(20) NOT NULL,
        country VARCHAR(100) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    // Create orders table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        shipping_address_id INT NOT NULL,
        payment_method ENUM('credit_card', 'paypal', 'cash_on_delivery') NOT NULL,
        payment_status ENUM('pending', 'paid', 'failed') NOT NULL,
        order_status ENUM('processing', 'shipped', 'delivered', 'cancelled') NOT NULL,
        subtotal DECIMAL(10, 2) NOT NULL,
        tax DECIMAL(10, 2) NOT NULL,
        shipping DECIMAL(10, 2) NOT NULL,
        total DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (shipping_address_id) REFERENCES shipping_addresses(id) ON DELETE RESTRICT
      )
    `);
    
    // Create order_items table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
      )
    `);
    
    // Create cart_items table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        UNIQUE KEY user_product (user_id, product_id)
      )
    `);
    
    // Create favorites table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS favorites (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        product_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        UNIQUE KEY user_product (user_id, product_id)
      )
    `);
    
    // Create newsletter_subscribers table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS newsletter_subscribers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(100) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('All tables created successfully');
    
    // Create sample data if none exists
    const [usersResult] = await connection.query('SELECT COUNT(*) as count FROM users');
    if (usersResult[0].count === 0) {
      console.log('Adding sample data...');
      
      // Insert sample admin user
      await connection.query(`
        INSERT INTO users (name, email, password, role)
        VALUES ('Admin User', 'admin@example.com', '$2a$10$NxW7GWzEzp23Rq4DUMWNnubQ3AKrEPH/TJH5JRdLlLKJm8JRcJvMK', 'admin')
      `);
      
      // Insert sample customer
      await connection.query(`
        INSERT INTO users (name, email, password, phone)
        VALUES ('Test User', 'test@example.com', '$2a$10$NxW7GWzEzp23Rq4DUMWNnubQ3AKrEPH/TJH5JRdLlLKJm8JRcJvMK', '555-123-4567')
      `);
      
      // Insert sample categories
      await connection.query(`
        INSERT INTO categories (name, description, image) VALUES
        ('Clothing', 'Baby clothes and accessories', '/images/categories/clothing.jpg'),
        ('Furniture', 'Cribs, changing tables, and more', '/images/categories/furniture.jpg'),
        ('Feeding', 'Bottles, bibs, and other feeding supplies', '/images/categories/feeding.jpg'),
        ('Toys', 'Educational and fun toys for all ages', '/images/categories/toys.jpg'),
        ('Electronics', 'Monitors, humidifiers, and other electronics', '/images/categories/electronics.jpg')
      `);
      
      // Insert sample products
      await connection.query(`
        INSERT INTO products (name, description, price, original_price, image, category_id, stock, rating, reviews, featured, is_new, is_budget, is_luxury) VALUES
        ('Baby Onesie', 'Soft cotton onesie for newborns', 19.99, 24.99, '/images/products/onesie1.jpg', 1, 15, 4.5, 28, TRUE, TRUE, FALSE, FALSE),
        ('Baby Crib', 'Convertible 4-in-1 crib that grows with your child', 299.99, 349.99, '/images/products/crib1.jpg', 2, 8, 4.8, 42, TRUE, FALSE, FALSE, TRUE),
        ('Baby Bottles Set', 'Set of 3 anti-colic baby bottles', 24.99, 29.99, '/images/products/bottles1.jpg', 3, 25, 4.3, 76, FALSE, FALSE, TRUE, FALSE),
        ('Baby Monitor', 'HD video monitor with night vision', 89.99, 99.99, '/images/products/monitor1.jpg', 5, 5, 4.6, 54, TRUE, FALSE, FALSE, FALSE),
        ('Baby Mobile', 'Musical mobile with starry night projection', 39.99, 49.99, '/images/products/mobile1.jpg', 4, 3, 4.2, 31, FALSE, TRUE, FALSE, FALSE)
      `);
      
      console.log('Sample data added successfully');
    }
    
    // Close connection
    await connection.end();
    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Database setup failed:', error);
  }
};

// Main setup function
const setup = async () => {
  try {
    console.log('--- Victoria Kids Shop Setup ---');
    
    // Create .env file
    await createEnvFile();
    
    // Ask if user wants to set up the database
    rl.question('Do you want to set up the database? (y/n): ', async (answer) => {
      if (answer.toLowerCase() === 'y') {
        await setupDatabase();
      } else {
        console.log('Skipping database setup');
      }
      
      console.log('\nSetup completed! You can now run the application with:');
      console.log('  npm start');
      
      rl.close();
    });
  } catch (error) {
    console.error('Setup failed:', error);
    rl.close();
  }
};

// Run setup
setup(); 