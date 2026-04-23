const express = require("express");
const { saveTax, getHistory } = require("../controllers/taxProfileController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/save", protect, saveTax);
router.get("/history", protect, getHistory);

module.exports = router;
