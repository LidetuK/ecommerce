/**
 * Cart Controller
 * Handles all cart-related operations
 */

// Mock product data (simplified)
const products = [
  {
    id: "1",
    name: "Baby Onesie",
    price: 19.99,
    image: "/images/products/onesie1.jpg",
    stock: 15,
  },
  {
    id: "2",
    name: "Baby Crib",
    price: 299.99,
    image: "/images/products/crib1.jpg",
    stock: 8,
  },
  {
    id: "3",
    name: "Baby Bottles Set",
    price: 24.99,
    image: "/images/products/bottles1.jpg",
    stock: 25,
  },
];

// Mock cart data for development
// In a real app, this would be in a database
const carts = {
  "1": [ // user_id: 1
    {
      id: "cart_item_1",
      product_id: "1",
      name: "Baby Onesie",
      price: 19.99,
      quantity: 2,
      image: "/images/products/onesie1.jpg",
    },
    {
      id: "cart_item_2",
      product_id: "3",
      name: "Baby Bottles Set",
      price: 24.99,
      quantity: 1,
      image: "/images/products/bottles1.jpg",
    },
  ],
};

/**
 * @desc    Get cart items for the current user
 * @route   GET /api/cart
 * @access  Private
 */
const getCartItems = async (req, res) => {
  try {
    // In a real app, this would be req.user.id
    const userId = "1";
    
    // Get the user's cart, or initialize empty cart if none exists
    const cart = carts[userId] || [];
    
    res.json(cart);
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Add item to cart
 * @route   POST /api/cart
 * @access  Private
 */
const addToCart = async (req, res) => {
  try {
    const { product_id, quantity = 1 } = req.body;
    
    if (!product_id) {
      return res.status(400).json({ message: 'Product ID is required' });
    }
    
    // In a real app, this would be req.user.id
    const userId = "1";
    
    // Find the product
    const product = products.find(p => p.id === product_id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Check if product is in stock
    if (product.stock < quantity) {
      return res.status(400).json({ message: 'Product is out of stock' });
    }
    
    // Initialize cart if it doesn't exist
    if (!carts[userId]) {
      carts[userId] = [];
    }
    
    // Check if the product is already in the cart
    const existingItemIndex = carts[userId].findIndex(item => item.product_id === product_id);
    
    if (existingItemIndex !== -1) {
      // Update quantity if the product is already in the cart
      const newQuantity = carts[userId][existingItemIndex].quantity + quantity;
      
      // Check if the new quantity exceeds stock
      if (newQuantity > product.stock) {
        return res.status(400).json({ message: 'Cannot add more than available stock' });
      }
      
      carts[userId][existingItemIndex].quantity = newQuantity;
      
      res.json(carts[userId]);
    } else {
      // Add new item to cart
      const newItem = {
        id: `cart_item_${Date.now()}`,
        product_id,
        name: product.name,
        price: product.price,
        quantity,
        image: product.image,
      };
      
      carts[userId].push(newItem);
      
      res.status(201).json(carts[userId]);
    }
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Update cart item quantity
 * @route   PUT /api/cart/:id
 * @access  Private
 */
const updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    
    if (!quantity || quantity < 1) {
      return res.status(400).json({ message: 'Invalid quantity' });
    }
    
    // In a real app, this would be req.user.id
    const userId = "1";
    
    // Check if user has a cart
    if (!carts[userId]) {
      return res.status(404).json({ message: 'Cart not found' });
    }
    
    // Find the cart item
    const itemIndex = carts[userId].findIndex(item => item.id === req.params.id);
    
    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }
    
    // Get the product to check stock
    const product_id = carts[userId][itemIndex].product_id;
    const product = products.find(p => p.id === product_id);
    
    // Check if quantity exceeds stock
    if (quantity > product.stock) {
      return res.status(400).json({ message: 'Cannot add more than available stock' });
    }
    
    // Update quantity
    carts[userId][itemIndex].quantity = quantity;
    
    res.json(carts[userId]);
  } catch (error) {
    console.error('Error updating cart item:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Remove item from cart
 * @route   DELETE /api/cart/:id
 * @access  Private
 */
const removeFromCart = async (req, res) => {
  try {
    // In a real app, this would be req.user.id
    const userId = "1";
    
    // Check if user has a cart
    if (!carts[userId]) {
      return res.status(404).json({ message: 'Cart not found' });
    }
    
    // Find the cart item
    const itemIndex = carts[userId].findIndex(item => item.id === req.params.id);
    
    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }
    
    // Remove the item
    carts[userId].splice(itemIndex, 1);
    
    res.json(carts[userId]);
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Clear cart
 * @route   DELETE /api/cart
 * @access  Private
 */
const clearCart = async (req, res) => {
  try {
    // In a real app, this would be req.user.id
    const userId = "1";
    
    // Clear the cart
    carts[userId] = [];
    
    res.json({ message: 'Cart cleared' });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getCartItems,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
}; 