const jwt = require("jsonwebtoken")
const asyncHandler = require("../utils/asyncHandler")

// Middleware to check session validity
const checkSession = asyncHandler(async (req, res, next) => {
  // Get token from header
  const token = req.headers.authorization?.split(" ")[1]

  if (token) {
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET)

      // Add user ID to request
      req.userId = decoded.id

      // Continue to next middleware
      next()
    } catch (error) {
      // Token is invalid or expired, but we'll still allow the request
      // The client will handle token refresh if needed
      req.userId = null
      next()
    }
  } else {
    // No token, but we'll still allow the request
    req.userId = null
    next()
  }
})

module.exports = { checkSession }
