const express = require("express")
const router = express.Router()
const {
  registerUser,
  loginUser,
  adminLogin,
  forgotPassword,
  resetPassword,
  refreshToken,
} = require("../controllers/authController")

// Public routes
router.post("/register", registerUser)
router.post("/login", loginUser)
router.post("/admin/login", adminLogin)
router.post("/forgot-password", forgotPassword)
router.post("/reset-password", resetPassword)
router.post("/refresh-token", refreshToken)

module.exports = router
