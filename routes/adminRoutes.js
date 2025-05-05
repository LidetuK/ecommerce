const express = require("express")
const router = express.Router()
const {
  getDashboardStats,
  getRecentOrders,
  getLowStockProducts,
  getAllCustomers,
  generateSalesReport,
} = require("../controllers/adminController")
const { getAllOrders } = require("../controllers/orderController")
const { getAdminProducts } = require("../controllers/productController")
const { getAdminCategories } = require("../controllers/categoryController")
const { protect, admin } = require("../middleware/authMiddleware")

// Protected admin routes
router.get("/dashboard/stats", protect, admin, getDashboardStats)
router.get("/dashboard/recent-orders", protect, admin, getRecentOrders)
router.get("/dashboard/low-stock", protect, admin, getLowStockProducts)
router.get("/customers", protect, admin, getAllCustomers)
router.get("/reports/sales", protect, admin, generateSalesReport)
router.get("/orders", protect, admin, getAllOrders)

// Additional admin routes for products and categories
router.get("/products", protect, admin, getAdminProducts)
router.get("/categories", protect, admin, getAdminCategories)

module.exports = router
