const express = require("express")
const router = express.Router()
const multer = require("multer")
const { uploadMedia, uploadMultipleMedia } = require("../controllers/mediaController")
const { protect, admin } = require("../middleware/authMiddleware")

// Configure multer for memory storage
const storage = multer.memoryStorage()
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
})

// Single file upload route
router.post("/upload", protect, admin, upload.single("file"), uploadMedia)

// Multiple files upload route
router.post("/upload-multiple", protect, admin, upload.array("files", 10), uploadMultipleMedia)

module.exports = router
