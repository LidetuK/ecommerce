const express = require("express")
const cors = require("cors")
const dotenv = require("dotenv")
const morgan = require("morgan")
const { checkSession } = require("./middleware/sessionMiddleware")
const { errorHandler } = require("./middleware/errorMiddleware")
const { notFound } = require("./middleware/notFoundMiddleware")
const logger = require("./utils/logger")
const path = require("path")
const fs = require("fs")
const { testConnection } = require('./config/database')

// Load env vars first
dotenv.config()

// Debug environment variables
logger.info('Environment variables loaded:')
logger.info('NODE_ENV: ' + process.env.NODE_ENV)
logger.info('PORT: ' + process.env.PORT)
logger.info('DB_TYPE: ' + process.env.DB_TYPE)
logger.info('DB_HOST: ' + process.env.DB_HOST)
logger.info('DB_NAME: ' + process.env.DB_NAME)
logger.info('JWT_SECRET exists: ' + !!process.env.JWT_SECRET)
logger.info('JWT_REFRESH_SECRET exists: ' + !!process.env.JWT_REFRESH_SECRET)

// Function to run the database initialization
const runDatabaseInit = async () => {
  try {
    logger.info("Starting database initialization...")
    
    // Import the database initialization module
    // We use require here instead of import so it runs immediately
    const initDbPath = path.join(__dirname, 'config', 'initDb.js')
    
    if (fs.existsSync(initDbPath)) {
      logger.info(`Found initDb.js at: ${initDbPath}`)
      // Execute the initialization script
      await require('./config/initDb')
      logger.info("Database initialization completed")
    } else {
      logger.error(`initDb.js not found at path: ${initDbPath}`)
    }
  } catch (error) {
    logger.error("Failed to initialize database:", error)
    // Don't exit here, continue with server start
  }
}

// Initialize express
const app = express()

// Routes
const authRoutes = require("./routes/authRoutes")
const userRoutes = require("./routes/userRoutes")
const productRoutes = require("./routes/productRoutes")
const categoryRoutes = require("./routes/categoryRoutes")
const orderRoutes = require("./routes/orderRoutes")
const cartRoutes = require("./routes/cartRoutes")
const favoriteRoutes = require("./routes/favoriteRoutes")
const newsletterRoutes = require("./routes/newsletterRoutes")
const adminRoutes = require("./routes/adminRoutes")
const paymentRoutes = require("./routes/paymentRoutes")
const mediaRoutes = require("./routes/mediaRoutes")

// Middleware
app.use(cors())
app.use(express.json())
app.use(morgan("dev"))

// Root route with API documentation
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Victoria Kids Shop API',
    version: '1.0.0',
    status: 'active',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      products: '/api/products',
      categories: '/api/categories',
      orders: '/api/orders',
      cart: '/api/cart',
      favorites: '/api/favorites',
      newsletter: '/api/newsletter',
      admin: '/api/admin',
      payments: '/api/payments',
      media: '/api/media'
    },
    documentation: 'API documentation available at /api/docs',
    health: '/health'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Session check middleware
app.use(checkSession)

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)
app.use("/api/products", productRoutes)
app.use("/api/categories", categoryRoutes)
app.use("/api/orders", orderRoutes)
app.use("/api/cart", cartRoutes)
app.use("/api/favorites", favoriteRoutes)
app.use("/api/newsletter", newsletterRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/payments", paymentRoutes)
app.use("/api/media", mediaRoutes)

// Error handling
app.use(notFound)
app.use(errorHandler)

// Start server
const PORT = process.env.PORT || 5000

// Test database connection before starting the server
const startServer = async () => {
  try {
    logger.info('Testing database connection...');
    const isConnected = await testConnection();
    
    if (!isConnected) {
      logger.error('Failed to connect to the database. Server will not start.');
      process.exit(1);
    }

    logger.info('Database connection successful. Starting server...');

    // Start the server
    const server = app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
      logger.info(`API available at http://localhost:${PORT}/api`);
    });

    server.on('error', (err) => {
      logger.error('Server error:', err);
      process.exit(1);
    });

  } catch (error) {
    logger.error('Error starting server:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

startServer();
