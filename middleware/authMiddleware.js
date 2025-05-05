const jwt = require("jsonwebtoken")
const pool = require("../config/db")
const asyncHandler = require("../utils/asyncHandler")
const logger = require("../utils/logger")

// Protect routes - verify token
const protect = asyncHandler(async (req, res, next) => {
  let token

  // For development mode, allow all requests to admin routes
  if (process.env.NODE_ENV === 'development') {
    // Check if this is an admin route
    if (req.originalUrl.includes('/api/admin')) {
      logger.info(`Development mode: Auto-authorizing admin request to ${req.originalUrl}`)
      req.user = {
        id: "1",
        name: "Admin User",
        email: "admin@victoriakids.com",
        role: "admin"
      }
      return next()
    }
    
    // For regular development requests with mock user header
    if (req.headers['x-mock-user']) {
      try {
        req.user = {
          id: "1",
          name: "Test User",
          email: "test@example.com",
          role: req.headers['x-mock-role'] || "customer"
        }
        logger.info(`Using mock user: ${req.user.name} (${req.user.role})`)
        return next()
      } catch (error) {
        logger.error(`Mock user error: ${error.message}`)
      }
    }
  }

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1]

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'victoria_kids_shop_secret_key')

      try {
        // Get user from the token
        const [rows] = await pool.query("SELECT id, name, email, role FROM users WHERE id = ?", [decoded.id])

        if (rows.length === 0) {
          res.status(401)
          throw new Error("Not authorized, user not found")
        }

        req.user = rows[0]
        next()
      } catch (dbError) {
        // In development, if database query fails, use mock data
        if (process.env.NODE_ENV !== 'production') {
          logger.warn("Using mock user data in development mode")
          req.user = {
            id: decoded.id || "1",
            name: "Test User",
            email: "test@example.com",
            role: "customer"
          }
          return next()
        } else {
          throw dbError
        }
      }
    } catch (error) {
      res.status(401)
      throw new Error("Not authorized, token failed")
    }
  }

  if (!token) {
    res.status(401)
    throw new Error("Not authorized, no token")
  }
})

// Admin middleware
const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next()
  } else {
    res.status(403)
    throw new Error("Not authorized as an admin")
  }
}

module.exports = { protect, admin }
