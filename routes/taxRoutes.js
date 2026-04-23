const express = require("express");
const { calculateTax, calculateOldTaxOnly, calculateNewTaxOnly } = require("../controllers/taxController");
const { validateIncome, validateDeductions } = require("../utils/validate");

const router = express.Router();

router.post("/calculate", validateIncome, validateDeductions, calculateTax);
router.post("/calculate-old", validateIncome, validateDeductions, calculateOldTaxOnly);
router.post("/calculate-new", validateIncome, calculateNewTaxOnly);

module.exports = router;
