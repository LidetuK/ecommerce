/**
 * Favorite Controller
 * Handles all favorites-related operations
 */

const pool = require('../config/db');
const logger = require('../utils/logger');

/**
 * @desc    Get user's favorite items
 * @route   GET /api/favorites
 * @access  Private
 */
const getUserFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [favorites] = await pool.query(
      `SELECT f.id, f.product_id, p.name, p.description, p.price, p.original_price, 
       p.image, c.name as category_name, p.stock, p.rating, p.reviews, 
       p.featured, p.is_new, p.is_budget, p.is_luxury
       FROM favorites f
       JOIN products p ON f.product_id = p.id
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE f.user_id = ?`,
      [userId]
    );
    
    res.json(favorites);
  } catch (error) {
    logger.error('Error fetching favorites:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Add item to favorites
 * @route   POST /api/favorites
 * @access  Private
 */
const addToFavorites = async (req, res) => {
  try {
    const { product_id } = req.body;
    const userId = req.user.id;
    
    if (!product_id) {
      return res.status(400).json({ message: 'Product ID is required' });
    }
    
    // Check if product exists
    const [products] = await pool.query(
      'SELECT * FROM products WHERE id = ?',
      [product_id]
    );
    
    if (products.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Check if already in favorites
    const [existingFavorites] = await pool.query(
      'SELECT * FROM favorites WHERE user_id = ? AND product_id = ?',
      [userId, product_id]
    );
    
    if (existingFavorites.length > 0) {
      return res.status(400).json({ message: 'Product is already in favorites' });
    }
    
    // Add to favorites
    const [result] = await pool.query(
      'INSERT INTO favorites (user_id, product_id) VALUES (?, ?)',
      [userId, product_id]
    );
    
    // Get the newly added favorite with product details
    const [newFavorite] = await pool.query(
      `SELECT f.id, f.product_id, p.name, p.description, p.price, p.original_price, 
       p.image, c.name as category_name, p.stock, p.rating, p.reviews, 
       p.featured, p.is_new, p.is_budget, p.is_luxury
       FROM favorites f
       JOIN products p ON f.product_id = p.id
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE f.id = ?`,
      [result.insertId]
    );
    
    res.status(201).json(newFavorite[0]);
  } catch (error) {
    logger.error('Error adding to favorites:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Remove item from favorites
 * @route   DELETE /api/favorites/:productId
 * @access  Private
 */
const removeFromFavorites = async (req, res) => {
  try {
    const productId = req.params.productId;
    const userId = req.user.id;
    
    // Check if in favorites
    const [favorites] = await pool.query(
      'SELECT * FROM favorites WHERE user_id = ? AND product_id = ?',
      [userId, productId]
    );
    
    if (favorites.length === 0) {
      return res.status(404).json({ message: 'Product not found in favorites' });
    }
    
    // Get product info before removing
    const [product] = await pool.query(
      `SELECT p.id as product_id, p.name, p.description, p.price, p.original_price, 
       p.image, c.name as category_name, p.stock, p.rating, p.reviews, 
       p.featured, p.is_new, p.is_budget, p.is_luxury
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = ?`,
      [productId]
    );
    
    // Remove from favorites
    await pool.query(
      'DELETE FROM favorites WHERE user_id = ? AND product_id = ?',
      [userId, productId]
    );
    
    res.json({ 
      message: 'Removed from favorites', 
      product: product.length > 0 ? product[0] : null 
    });
  } catch (error) {
    logger.error('Error removing from favorites:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Check if a product is in favorites
 * @route   GET /api/favorites/check/:productId
 * @access  Private
 */
const checkIsFavorite = async (req, res) => {
  try {
    const productId = req.params.productId;
    const userId = req.user.id;
    
    // Check if in favorites
    const [favorites] = await pool.query(
      'SELECT * FROM favorites WHERE user_id = ? AND product_id = ?',
      [userId, productId]
    );
    
    const isFavorite = favorites.length > 0;
    
    res.json({ isFavorite });
  } catch (error) {
    logger.error('Error checking favorite status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getUserFavorites,
  addToFavorites,
  removeFromFavorites,
  checkIsFavorite,
}; 