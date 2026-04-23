const express = require("express");
const { uploadPDF } = require("../middleware/uploadMiddleware");
const { uploadAndParsePDF, listRecentUploads } = require("../controllers/pdfController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/upload", protect, uploadPDF, uploadAndParsePDF);
router.get("/uploads", protect, listRecentUploads);

module.exports = router;
