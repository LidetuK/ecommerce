/**
 * Migration: 002_sample_data
 * Description: Adds sample data for development environment
 */

const up = async (connection) => {
  // Check if we already have users
  const [usersResult] = await connection.query('SELECT COUNT(*) as count FROM users');
  if (usersResult[0].count === 0) {
    console.log('Adding sample users...');
    
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
  }
  
  // Check if we already have categories
  const [categoriesResult] = await connection.query('SELECT COUNT(*) as count FROM categories');
  if (categoriesResult[0].count === 0) {
    console.log('Adding sample categories...');
    
    // Insert sample categories
    await connection.query(`
      INSERT INTO categories (name, description, image) VALUES
      ('Clothing', 'Baby clothes and accessories', '/images/categories/clothing.jpg'),
      ('Furniture', 'Cribs, changing tables, and more', '/images/categories/furniture.jpg'),
      ('Feeding', 'Bottles, bibs, and other feeding supplies', '/images/categories/feeding.jpg'),
      ('Toys', 'Educational and fun toys for all ages', '/images/categories/toys.jpg'),
      ('Electronics', 'Monitors, humidifiers, and other electronics', '/images/categories/electronics.jpg')
    `);
  }
  
  // Check if we already have products
  const [productsResult] = await connection.query('SELECT COUNT(*) as count FROM products');
  if (productsResult[0].count === 0) {
    console.log('Adding sample products...');
    
    // Insert sample products
    await connection.query(`
      INSERT INTO products (name, description, price, original_price, image, category_id, stock, rating, reviews, featured, is_new, is_budget, is_luxury) VALUES
      ('Baby Onesie', 'Soft cotton onesie for newborns', 19.99, 24.99, '/images/products/onesie1.jpg', 1, 15, 4.5, 28, TRUE, TRUE, FALSE, FALSE),
      ('Baby Crib', 'Convertible 4-in-1 crib that grows with your child', 299.99, 349.99, '/images/products/crib1.jpg', 2, 8, 4.8, 42, TRUE, FALSE, FALSE, TRUE),
      ('Baby Bottles Set', 'Set of 3 anti-colic baby bottles', 24.99, 29.99, '/images/products/bottles1.jpg', 3, 25, 4.3, 76, FALSE, FALSE, TRUE, FALSE),
      ('Baby Monitor', 'HD video monitor with night vision', 89.99, 99.99, '/images/products/monitor1.jpg', 5, 5, 4.6, 54, TRUE, FALSE, FALSE, FALSE),
      ('Baby Mobile', 'Musical mobile with starry night projection', 39.99, 49.99, '/images/products/mobile1.jpg', 4, 3, 4.2, 31, FALSE, TRUE, FALSE, FALSE)
    `);
  }
};

const down = async (connection) => {
  // Remove sample data
  await connection.query('DELETE FROM products');
  await connection.query('DELETE FROM categories');
  await connection.query('DELETE FROM users');
};

module.exports = {
  up,
  down
}; 