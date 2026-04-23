const express = require("express");
const { simulateTax } = require("../controllers/simulationController");
const { validateIncome, validateDeductions } = require("../utils/validate");

const router = express.Router();

router.post("/simulate", validateIncome, validateDeductions, simulateTax);

module.exports = router;
