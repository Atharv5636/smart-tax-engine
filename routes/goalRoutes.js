const express = require("express");
const { optimizeGoal } = require("../controllers/goalController");
const { validateIncome, validateDeductions } = require("../utils/validate");

const router = express.Router();

router.post("/goal", validateIncome, validateDeductions, optimizeGoal);
module.exports = router;
