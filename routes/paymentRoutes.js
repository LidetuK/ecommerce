const express = require("express")
const router = express.Router()
const { createPaymentSession, handleWebhook, getPaymentStatus } = require("../controllers/paymentController")
const { protect } = require("../middleware/authMiddleware")

// Routes
router.post("/create-session", protect, createPaymentSession)
router.post("/webhook", express.raw({ type: "application/json" }), handleWebhook)
router.get("/status/:paymentId", protect, getPaymentStatus)

module.exports = router
