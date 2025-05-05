const express = require("express")
const router = express.Router()
const { getUserFavorites, addToFavorites, removeFromFavorites, checkIsFavorite } = require("../controllers/favoriteController")
const { protect } = require("../middleware/authMiddleware")

// Protected routes
router.get("/", protect, getUserFavorites)
router.post("/", protect, addToFavorites)
router.delete("/:productId", protect, removeFromFavorites)
router.get("/check/:productId", protect, checkIsFavorite)

module.exports = router
