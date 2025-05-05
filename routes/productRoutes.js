const express = require("express")
const router = express.Router()
const multer = require("multer")
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getFeaturedProducts,
  getNewArrivals,
  getBudgetProducts,
  getLuxuryProducts,
  getRelatedProducts,
} = require("../controllers/productController")
const { protect, admin } = require("../middleware/authMiddleware")

// Configure multer for memory storage
const storage = multer.memoryStorage()
const upload = multer({ storage })

// Public routes
router.get("/", getProducts)
router.get("/featured", getFeaturedProducts)
router.get("/new", getNewArrivals)
router.get("/budget", getBudgetProducts)
router.get("/luxury", getLuxuryProducts)
router.get("/related/:id", getRelatedProducts)
router.get("/:id", getProductById)

// Protected admin routes
router.post("/", protect, admin, upload.array("images", 10), createProduct)
router.put("/:id", protect, admin, upload.array("images", 10), updateProduct)
router.delete("/:id", protect, admin, deleteProduct)

module.exports = router
