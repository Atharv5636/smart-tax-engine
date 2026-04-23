const express = require("express");
const { optimizeTax } = require("../controllers/optimizationController");
const { optimizeTaxAdvanced } = require("../controllers/optimizerController");
const { validateIncome, validateBudget } = require("../utils/validate");

const router = express.Router();

router.post("/optimize", validateIncome, optimizeTax);
router.post("/optimize-advanced", validateIncome, validateBudget, optimizeTaxAdvanced);

module.exports = router;
