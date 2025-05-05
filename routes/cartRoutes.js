const express = require("express")
const router = express.Router()
const { getCartItems, addToCart, updateCartItem, removeFromCart, clearCart } = require("../controllers/cartController")
const { protect } = require("../middleware/authMiddleware")

// Protected routes
router.get("/", protect, getCartItems)
router.post("/", protect, addToCart)
router.put("/:id", protect, updateCartItem)
router.delete("/:id", protect, removeFromCart)
router.delete("/", protect, clearCart)

module.exports = router
