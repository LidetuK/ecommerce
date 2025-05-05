const bcrypt = require("bcryptjs")
const crypto = require("crypto")
const pool = require("../config/db")
const asyncHandler = require("../utils/asyncHandler")
const { generateToken, generateRefreshToken } = require("../utils/generateToken")
const { sendEmail, emailTemplates } = require("../utils/emailService")
const logger = require("../utils/logger")
const jwt = require("jsonwebtoken")

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body

  // Check if user exists
  const [existingUsers] = await pool.query("SELECT * FROM users WHERE email = ?", [email])

  if (existingUsers.length > 0) {
    res.status(400)
    throw new Error("User already exists")
  }

  // Hash password
  const salt = await bcrypt.genSalt(10)
  const hashedPassword = await bcrypt.hash(password, salt)

  // Create user
  const [result] = await pool.query("INSERT INTO users (name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)", [
    name,
    email,
    hashedPassword,
    phone,
    "customer",
  ])

  if (result.affectedRows === 1) {
    // Send welcome email
    try {
      const welcomeTemplate = emailTemplates.welcome(name)
      await sendEmail({
        to: email,
        subject: welcomeTemplate.subject,
        html: welcomeTemplate.html,
      })
    } catch (error) {
      logger.error("Error sending welcome email:", error)
      // Continue even if email fails
    }

    // Get the created user
    const [rows] = await pool.query("SELECT id, name, email, phone, role FROM users WHERE id = ?", [result.insertId])

    const user = rows[0]

    res.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      token: generateToken(user.id),
      refreshToken: generateRefreshToken(user.id),
    })
  } else {
    res.status(400)
    throw new Error("Invalid user data")
  }
})

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  // Check for user email
  const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email])

  if (rows.length === 0) {
    res.status(401)
    throw new Error("Invalid email or password")
  }

  const user = rows[0]

  // Check if password matches
  const isMatch = await bcrypt.compare(password, user.password)

  if (!isMatch) {
    res.status(401)
    throw new Error("Invalid email or password")
  }

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    },
    token: generateToken(user.id),
    refreshToken: generateRefreshToken(user.id),
  })
})

// @desc    Admin login
// @route   POST /api/auth/admin/login
// @access  Public
const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  // Check for admin user
  const [rows] = await pool.query("SELECT * FROM users WHERE email = ? AND role = ?", [email, "admin"])

  if (rows.length === 0) {
    res.status(401)
    throw new Error("Invalid admin credentials")
  }

  const admin = rows[0]

  // Check if password matches
  const isMatch = await bcrypt.compare(password, admin.password)

  if (!isMatch) {
    res.status(401)
    throw new Error("Invalid admin credentials")
  }

  res.json({
    user: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    },
    token: generateToken(admin.id),
    refreshToken: generateRefreshToken(admin.id),
  })
})

// @desc    Refresh token
// @route   POST /api/auth/refresh-token
// @access  Public
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body

  if (!token) {
    res.status(401)
    throw new Error("Refresh token is required")
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET)

    // Check if user exists
    const [rows] = await pool.query("SELECT id FROM users WHERE id = ?", [decoded.id])

    if (rows.length === 0) {
      res.status(401)
      throw new Error("Invalid refresh token")
    }

    // Generate new access token
    const newAccessToken = generateToken(decoded.id)

    res.json({ token: newAccessToken })
  } catch (error) {
    res.status(401)
    throw new Error("Invalid refresh token")
  }
})

const forgotPassword = asyncHandler(async (req, res) => {
  res.status(500).json({ message: "Forgot Password route" })
})

const resetPassword = asyncHandler(async (req, res) => {
  res.status(500).json({ message: "Reset password route" })
})

// Other controller methods remain the same...

module.exports = {
  registerUser,
  loginUser,
  adminLogin,
  forgotPassword,
  resetPassword,
  refreshToken,
}
