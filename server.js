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

// Test database connection before starting the server
const startServer = async () => {
  try {
    // Test database connection
    const isConnected = await testConnection()
    if (!isConnected) {
      console.error('Failed to connect to the database. Server will not start.')
      process.exit(1)
    }

    // Start the server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`)
    })
  } catch (error) {
    console.error('Error starting server:', error)
    process.exit(1)
  }
}

startServer()
