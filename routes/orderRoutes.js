const express = require("express")
const router = express.Router()
const { getUserOrders, getOrderById, createOrder, updateOrderStatus } = require("../controllers/orderController")
const { protect, admin } = require("../middleware/authMiddleware")

// Protected routes
router.get("/", protect, getUserOrders)
router.get("/:id", protect, getOrderById)
router.post("/", protect, createOrder)
router.put("/:id/status", protect, admin, updateOrderStatus)

module.exports = router
