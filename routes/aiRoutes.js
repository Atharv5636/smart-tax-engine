const express = require("express");
const { parseFinancialText } = require("../controllers/aiController");

const router = express.Router();

router.post("/parse", parseFinancialText);

module.exports = router;
