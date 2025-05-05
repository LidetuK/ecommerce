const express = require("express")
const router = express.Router()
const {
  getUserProfile,
  updateUserProfile,
  getUserAddresses,
  addUserAddress,
  updateUserAddress,
  deleteUserAddress,
} = require("../controllers/userController")
const { protect } = require("../middleware/authMiddleware")

// Protected routes
router.get("/profile", protect, getUserProfile)
router.put("/profile", protect, updateUserProfile)
router.get("/addresses", protect, getUserAddresses)
router.post("/addresses", protect, addUserAddress)
router.put("/addresses/:id", protect, updateUserAddress)
router.delete("/addresses/:id", protect, deleteUserAddress)

module.exports = router
