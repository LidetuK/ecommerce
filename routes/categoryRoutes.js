const express = require("express")
const router = express.Router()
const multer = require("multer")
const {
  getCategories,
  getCategoryBySlug,
  getProductsByCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController")
const { protect, admin } = require("../middleware/authMiddleware")

// Configure multer for memory storage
const storage = multer.memoryStorage()
const upload = multer({ storage })

// Public routes
router.get("/", getCategories)
router.get("/:slug", getCategoryBySlug)
router.get("/:slug/products", getProductsByCategory)

// Protected admin routes
router.post("/", protect, admin, upload.single("image"), createCategory)
router.put("/:id", protect, admin, upload.single("image"), updateCategory)
router.delete("/:id", protect, admin, deleteCategory)

module.exports = router
