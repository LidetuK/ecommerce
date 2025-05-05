const jwt = require("jsonwebtoken")

// Generate access token
const generateToken = (id) => {
  const secret = process.env.JWT_SECRET || 'fallback_secret_key_victoria_kids_shop_2023'
  console.log('Using JWT_SECRET:', secret.substring(0, 5) + '...')
  
  return jwt.sign({ id }, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1h",
  })
}

// Generate refresh token
const generateRefreshToken = (id) => {
  const refreshSecret = process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_key_victoria_kids_shop_2023'
  console.log('Using JWT_REFRESH_SECRET:', refreshSecret.substring(0, 5) + '...')
  
  return jwt.sign({ id }, refreshSecret, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  })
}

module.exports = { generateToken, generateRefreshToken }
