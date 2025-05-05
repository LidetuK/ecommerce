/**
 * Order Controller
 * Handles all order-related operations
 */

const pool = require('../config/db');
const logger = require('../utils/logger');

/**
 * @desc    Get user orders
 * @route   GET /api/orders
 * @access  Private
 */
const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's orders
    const [orders] = await pool.query(
      `SELECT o.id, o.user_id, o.payment_method, o.payment_status, o.order_status,
       o.subtotal, o.tax, o.shipping, o.total, o.created_at, o.updated_at,
       a.full_name, a.address_line1, a.address_line2, a.city, a.state, a.zip_code, a.country, a.phone
       FROM orders o
       LEFT JOIN shipping_addresses a ON o.shipping_address_id = a.id
       WHERE o.user_id = ?
       ORDER BY o.created_at DESC`,
      [userId]
    );
    
    // Get order items for each order
    for (let order of orders) {
      const [items] = await pool.query(
        `SELECT oi.product_id, oi.quantity, oi.price, p.name, p.image
         FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = ?`,
        [order.id]
      );
      
      // Add shipping address from joined data
      order.shipping_address = {
        fullName: order.full_name,
        addressLine1: order.address_line1,
        addressLine2: order.address_line2,
        city: order.city,
        state: order.state,
        zipCode: order.zip_code,
        country: order.country,
        phone: order.phone
      };
      
      // Add items to order
      order.items = items;
      
      // Remove redundant properties
      delete order.full_name;
      delete order.address_line1;
      delete order.address_line2;
      delete order.city;
      delete order.state;
      delete order.zip_code;
      delete order.country;
      delete order.phone;
    }
    
    res.json(orders);
  } catch (error) {
    logger.error('Error fetching user orders:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Get all orders (admin)
 * @route   GET /api/admin/orders
 * @access  Private/Admin
 */
const getAllOrders = async (req, res) => {
  try {
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Filter by status if provided
    const status = req.query.status || '';
    let query = `
      SELECT o.id, o.user_id, o.payment_method, o.payment_status, o.order_status,
      o.subtotal, o.tax, o.shipping, o.total, o.created_at, o.updated_at,
      u.name as customer_name, u.email as customer_email
      FROM orders o
      JOIN users u ON o.user_id = u.id
    `;
    
    let countQuery = `SELECT COUNT(*) as total FROM orders o`;
    let queryParams = [];
    
    if (status) {
      query += ` WHERE o.order_status = ?`;
      countQuery += ` WHERE o.order_status = ?`;
      queryParams.push(status);
    }
    
    // Sort orders by date, newest first
    query += ` ORDER BY o.created_at DESC LIMIT ? OFFSET ?`;
    queryParams.push(limit, offset);
    
    // Execute queries
    const [orders] = await pool.query(query, queryParams);
    const [countResult] = await pool.query(
      countQuery, 
      status ? [status] : []
    );
    
    // Get item count for each order
    for (let order of orders) {
      const [itemCountResult] = await pool.query(
        `SELECT COUNT(*) as count FROM order_items WHERE order_id = ?`,
        [order.id]
      );
      order.item_count = itemCountResult[0].count;
    }
    
    const total = countResult[0].total;
    
    res.json({
      orders,
      page,
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    logger.error('Error fetching all orders:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Get order by ID
 * @route   GET /api/orders/:id
 * @access  Private
 */
const getOrderById = async (req, res) => {
  try {
    const orderId = req.params.id;
    const userId = req.user.id;
    
    // Check if admin (for admin, you would check user role in req.user)
    const isAdmin = req.user.role === 'admin';
    
    // Get order
    const [orders] = await pool.query(
      `SELECT o.id, o.user_id, o.payment_method, o.payment_status, o.order_status,
       o.subtotal, o.tax, o.shipping, o.total, o.created_at, o.updated_at,
       a.full_name, a.address_line1, a.address_line2, a.city, a.state, a.zip_code, a.country, a.phone
       FROM orders o
       LEFT JOIN shipping_addresses a ON o.shipping_address_id = a.id
       WHERE o.id = ?`,
      [orderId]
    );
    
    if (orders.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    const order = orders[0];
    
    // Check if the order belongs to the user or if user is admin
    if (order.user_id !== userId && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }
    
    // Get order items
    const [items] = await pool.query(
      `SELECT oi.product_id, oi.quantity, oi.price, p.name, p.image
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [order.id]
    );
    
    // Add shipping address from joined data
    order.shipping_address = {
      fullName: order.full_name,
      addressLine1: order.address_line1,
      addressLine2: order.address_line2,
      city: order.city,
      state: order.state,
      zipCode: order.zip_code,
      country: order.country,
      phone: order.phone
    };
    
    // Add items to order
    order.items = items;
    
    // Remove redundant properties
    delete order.full_name;
    delete order.address_line1;
    delete order.address_line2;
    delete order.city;
    delete order.state;
    delete order.zip_code;
    delete order.country;
    delete order.phone;
    
    res.json(order);
  } catch (error) {
    logger.error('Error fetching order:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Create a new order
 * @route   POST /api/orders
 * @access  Private
 */
const createOrder = async (req, res) => {
  try {
    const {
      items,
      shipping_address,
      payment_method,
      subtotal,
      tax,
      shipping,
      total,
    } = req.body;
    
    const userId = req.user.id;
    
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No order items' });
    }
    
    // Start a transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // 1. Insert shipping address
      const [addressResult] = await connection.query(
        `INSERT INTO shipping_addresses 
         (user_id, full_name, address_line1, address_line2, city, state, zip_code, country, phone) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          shipping_address.fullName,
          shipping_address.addressLine1,
          shipping_address.addressLine2 || '',
          shipping_address.city,
          shipping_address.state,
          shipping_address.zipCode,
          shipping_address.country,
          shipping_address.phone,
        ]
      );
      
      const addressId = addressResult.insertId;
      
      // 2. Insert order
      const [orderResult] = await connection.query(
        `INSERT INTO orders 
         (user_id, shipping_address_id, payment_method, payment_status, order_status, 
          subtotal, tax, shipping, total) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          addressId,
          payment_method,
          payment_method === 'cash_on_delivery' ? 'pending' : 'paid',
          'processing',
          parseFloat(subtotal),
          parseFloat(tax),
          parseFloat(shipping),
          parseFloat(total),
        ]
      );
      
      const orderId = orderResult.insertId;
      
      // 3. Insert order items
      for (const item of items) {
        await connection.query(
          `INSERT INTO order_items (order_id, product_id, quantity, price) 
           VALUES (?, ?, ?, ?)`,
          [orderId, item.product_id, item.quantity, item.price]
        );
        
        // 4. Update product stock
        await connection.query(
          `UPDATE products SET stock = stock - ? WHERE id = ?`,
          [item.quantity, item.product_id]
        );
      }
      
      // 5. Clear cart (optional)
      await connection.query(
        `DELETE FROM cart_items WHERE user_id = ?`,
        [userId]
      );
      
      // Commit transaction
      await connection.commit();
      
      // Get the complete order
      const [orders] = await pool.query(
        `SELECT o.id, o.user_id, o.payment_method, o.payment_status, o.order_status,
         o.subtotal, o.tax, o.shipping, o.total, o.created_at, o.updated_at,
         a.full_name, a.address_line1, a.address_line2, a.city, a.state, a.zip_code, a.country, a.phone
         FROM orders o
         LEFT JOIN shipping_addresses a ON o.shipping_address_id = a.id
         WHERE o.id = ?`,
        [orderId]
      );
      
      const order = orders[0];
      
      // Get order items
      const [orderItems] = await pool.query(
        `SELECT oi.product_id, oi.quantity, oi.price, p.name, p.image
         FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = ?`,
        [orderId]
      );
      
      // Add shipping address from joined data
      order.shipping_address = {
        fullName: order.full_name,
        addressLine1: order.address_line1,
        addressLine2: order.address_line2,
        city: order.city,
        state: order.state,
        zipCode: order.zip_code,
        country: order.country,
        phone: order.phone
      };
      
      // Add items to order
      order.items = orderItems;
      
      // Remove redundant properties
      delete order.full_name;
      delete order.address_line1;
      delete order.address_line2;
      delete order.city;
      delete order.state;
      delete order.zip_code;
      delete order.country;
      delete order.phone;
      
      res.status(201).json(order);
    } catch (error) {
      // Rollback in case of error
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    logger.error('Error creating order:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Update order status
 * @route   PUT /api/orders/:id/status
 * @access  Private/Admin
 */
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const orderId = req.params.id;
    
    if (!status) {
      return res.status(400).json({ message: 'Please provide a status' });
    }
    
    const validStatuses = ['processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    // Check if order exists
    const [orderCheck] = await pool.query(
      'SELECT * FROM orders WHERE id = ?',
      [orderId]
    );
    
    if (orderCheck.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Update order status
    await pool.query(
      'UPDATE orders SET order_status = ?, updated_at = NOW() WHERE id = ?',
      [status, orderId]
    );
    
    // Get updated order
    const [orders] = await pool.query(
      `SELECT o.id, o.user_id, o.payment_method, o.payment_status, o.order_status,
       o.subtotal, o.tax, o.shipping, o.total, o.created_at, o.updated_at,
       a.full_name, a.address_line1, a.address_line2, a.city, a.state, a.zip_code, a.country, a.phone
       FROM orders o
       LEFT JOIN shipping_addresses a ON o.shipping_address_id = a.id
       WHERE o.id = ?`,
      [orderId]
    );
    
    const order = orders[0];
    
    // Get order items
    const [items] = await pool.query(
      `SELECT oi.product_id, oi.quantity, oi.price, p.name, p.image
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [orderId]
    );
    
    // Add shipping address from joined data
    order.shipping_address = {
      fullName: order.full_name,
      addressLine1: order.address_line1,
      addressLine2: order.address_line2,
      city: order.city,
      state: order.state,
      zipCode: order.zip_code,
      country: order.country,
      phone: order.phone
    };
    
    // Add items to order
    order.items = items;
    
    // Remove redundant properties
    delete order.full_name;
    delete order.address_line1;
    delete order.address_line2;
    delete order.city;
    delete order.state;
    delete order.zip_code;
    delete order.country;
    delete order.phone;
    
    res.json(order);
  } catch (error) {
    logger.error('Error updating order status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getUserOrders,
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
}; 