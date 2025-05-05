const express = require("express")
const router = express.Router()
const {
  subscribeToNewsletter,
  unsubscribeFromNewsletter,
  getAllSubscribers,
  createCampaign,
} = require("../controllers/newsletterController")
const { protect, admin } = require("../middleware/authMiddleware")

// Public routes
router.post("/subscribe", subscribeToNewsletter)
router.post("/unsubscribe", unsubscribeFromNewsletter)

// Admin routes
router.get("/admin/subscribers", protect, admin, getAllSubscribers)
router.post("/admin/campaign", protect, admin, createCampaign)

module.exports = router
