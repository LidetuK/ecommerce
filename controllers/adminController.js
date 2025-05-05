/**
 * Admin Controller
 * Handles all admin-related operations
 */

const pool = require('../config/db');
const logger = require('../utils/logger');

/**
 * @desc    Get dashboard statistics
 * @route   GET /api/admin/dashboard/stats
 * @access  Private/Admin
 */
const getDashboardStats = async (req, res) => {
  try {
    // Get total sales
    const [salesResult] = await pool.query(
      'SELECT SUM(total) as total_sales FROM orders WHERE payment_status = "paid"'
    );
    const total_sales = parseFloat(salesResult[0].total_sales || 0);
    
    // Get total orders
    const [ordersResult] = await pool.query(
      'SELECT COUNT(*) as total_orders FROM orders'
    );
    const total_orders = parseInt(ordersResult[0].total_orders || 0);
    
    // Get total customers
    const [customersResult] = await pool.query(
      'SELECT COUNT(DISTINCT user_id) as total_customers FROM orders'
    );
    const total_customers = parseInt(customersResult[0].total_customers || 0);
    
    // Get total products
    const [productsResult] = await pool.query(
      'SELECT COUNT(*) as total_products FROM products'
    );
    const total_products = parseInt(productsResult[0].total_products || 0);
    
    // Get sales by month (last 6 months)
    const [salesByMonth] = await pool.query(
      `SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month, 
        SUM(total) as sales 
      FROM orders 
      WHERE 
        payment_status = "paid" AND 
        created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 MONTH)
      GROUP BY month 
      ORDER BY month DESC
      LIMIT 6`
    );
    
    // Get top products
    const [topProducts] = await pool.query(
      `SELECT 
        p.id, 
        p.name, 
        SUM(oi.quantity) as total_sold, 
        p.image
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.payment_status = "paid"
      GROUP BY p.id, p.name
      ORDER BY total_sold DESC
      LIMIT 3`
    );
    
    res.json({
      total_sales,
      total_orders,
      total_customers,
      total_products,
      sales_by_month: salesByMonth,
      top_products: topProducts
    });
    
  } catch (error) {
    logger.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Get recent orders
 * @route   GET /api/admin/dashboard/recent-orders
 * @access  Private/Admin
 */
const getRecentOrders = async (req, res) => {
  try {
    const [recentOrders] = await pool.query(
      `SELECT 
        o.id, 
        CONCAT('ORD-', YEAR(o.created_at), '-', LPAD(o.id, 3, '0')) as order_number,
        o.total, 
        o.order_status as status, 
        o.payment_status, 
        o.created_at,
        u.name as customer_name,
        u.email as customer_email,
        (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
      LIMIT 10`
    );
    
    res.json(recentOrders);
  } catch (error) {
    logger.error('Error fetching recent orders:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Get low stock products
 * @route   GET /api/admin/dashboard/low-stock
 * @access  Private/Admin
 */
const getLowStockProducts = async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold) || 10;
    
    const [lowStockProducts] = await pool.query(
      `SELECT 
        p.id, 
        p.name, 
        p.stock, 
        p.price,
        c.name as category_name,
        p.image
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.stock <= ?
      ORDER BY p.stock ASC
      LIMIT 10`,
      [threshold]
    );
    
    res.json(lowStockProducts);
  } catch (error) {
    logger.error('Error fetching low stock products:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Get all customers
 * @route   GET /api/admin/customers
 * @access  Private/Admin
 */
const getAllCustomers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const sort = req.query.sort || 'newest';
    
    // Base query
    let query = `
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.phone, 
        u.created_at,
        (SELECT COUNT(*) FROM orders WHERE user_id = u.id) as order_count
      FROM users u
      WHERE u.role = 'customer'
    `;
    
    // Count query
    let countQuery = `
      SELECT COUNT(*) as total
      FROM users u
      WHERE u.role = 'customer'
    `;
    
    // Add search conditions if provided
    if (search) {
      const searchParam = `%${search}%`;
      query += ` AND (u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)`;
      countQuery += ` AND (u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)`;
    }
    
    // Add sorting
    switch (sort) {
      case 'oldest':
        query += ` ORDER BY u.created_at ASC`;
        break;
      case 'name_asc':
        query += ` ORDER BY u.name ASC`;
        break;
      case 'name_desc':
        query += ` ORDER BY u.name DESC`;
        break;
      case 'newest':
      default:
        query += ` ORDER BY u.created_at DESC`;
    }
    
    // Add pagination
    query += ` LIMIT ? OFFSET ?`;
    
    // Execute queries
    let customers, countResult;
    
    if (search) {
      const searchParam = `%${search}%`;
      [customers] = await pool.query(
        query, 
        [searchParam, searchParam, searchParam, limit, offset]
      );
      [countResult] = await pool.query(
        countQuery, 
        [searchParam, searchParam, searchParam]
      );
    } else {
      [customers] = await pool.query(query, [limit, offset]);
      [countResult] = await pool.query(countQuery);
    }
    
    const total = countResult[0].total;
    
    res.json({
      customers,
      page,
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    logger.error('Error fetching customers:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Generate sales report
 * @route   GET /api/admin/reports/sales
 * @access  Private/Admin
 */
const generateSalesReport = async (req, res) => {
  try {
    const { start_date, end_date, group_by = 'day' } = req.query;
    
    // Validate dates
    if (!start_date || !end_date) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }
    
    // Group by format based on parameter
    let dateFormat;
    switch (group_by) {
      case 'month':
        dateFormat = '%Y-%m';
        break;
      case 'week':
        dateFormat = '%Y-%u'; // ISO week number
        break;
      case 'day':
      default:
        dateFormat = '%Y-%m-%d';
    }
    
    // Get sales data by period
    const [salesData] = await pool.query(
      `SELECT 
        DATE_FORMAT(o.created_at, ?) as period,
        COUNT(o.id) as order_count,
        SUM(o.total) as total_sales,
        AVG(o.total) as average_order_value
      FROM orders o
      WHERE 
        o.created_at BETWEEN ? AND ? AND
        o.payment_status = 'paid'
      GROUP BY period
      ORDER BY period`,
      [dateFormat, start_date, end_date]
    );
    
    // Get product sales
    const [productSales] = await pool.query(
      `SELECT 
        p.id,
        p.name,
        SUM(oi.quantity) as quantity_sold,
        SUM(oi.quantity * oi.price) as total_sales
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE 
        o.created_at BETWEEN ? AND ? AND
        o.payment_status = 'paid'
      GROUP BY p.id, p.name
      ORDER BY total_sales DESC
      LIMIT 10`,
      [start_date, end_date]
    );
    
    // Get category sales
    const [categorySales] = await pool.query(
      `SELECT 
        c.id,
        c.name,
        SUM(oi.quantity) as quantity_sold,
        SUM(oi.quantity * oi.price) as total_sales
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN categories c ON p.category_id = c.id
      JOIN orders o ON oi.order_id = o.id
      WHERE 
        o.created_at BETWEEN ? AND ? AND
        o.payment_status = 'paid'
      GROUP BY c.id, c.name
      ORDER BY total_sales DESC
      LIMIT 10`,
      [start_date, end_date]
    );
    
    // Get summary
    const [summary] = await pool.query(
      `SELECT 
        COUNT(o.id) as total_orders,
        SUM(o.total) as total_sales,
        AVG(o.total) as average_order_value
      FROM orders o
      WHERE 
        o.created_at BETWEEN ? AND ? AND
        o.payment_status = 'paid'`,
      [start_date, end_date]
    );
    
    res.json({
      sales_data: salesData,
      product_sales: productSales,
      category_sales: categorySales,
      summary: {
        start_date,
        end_date,
        total_orders: summary[0].total_orders || 0,
        total_sales: summary[0].total_sales || 0,
        average_order_value: summary[0].average_order_value || 0
      }
    });
    
  } catch (error) {
    logger.error('Error generating sales report:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getDashboardStats,
  getRecentOrders,
  getLowStockProducts,
  getAllCustomers,
  generateSalesReport,
};
