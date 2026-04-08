const express = require("express");
const { saveTax, getHistory } = require("../controllers/taxProfileController");

const router = express.Router();

router.post("/save", saveTax);
router.get("/history/:userId", getHistory);

module.exports = router;
