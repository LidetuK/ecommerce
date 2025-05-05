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

// Load env vars first
dotenv.config()

// Debug environment variables
logger.info('Environment variables loaded:')
logger.info('NODE_ENV: ' + process.env.NODE_ENV)
logger.info('PORT: ' + process.env.PORT)
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

// Function to start server with graceful error handling
const startServer = async (port) => {
  try {
    // First run database initialization
    await runDatabaseInit()
    
    // Then start the server
    const server = app.listen(port, () => {
      logger.info(`Server running on port ${port}`)
      logger.info(`API available at http://localhost:${port}/api`)
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        logger.warn(`Port ${port} is already in use, trying alternative port ${port + 1}`)
        startServer(port + 1)
      } else {
        logger.error(`Server error: ${err.message}`)
        process.exit(1)
      }
    });
  } catch (error) {
    logger.error("Failed to start server:", error)
    process.exit(1)
  }
}

// Start the server
startServer(PORT)
