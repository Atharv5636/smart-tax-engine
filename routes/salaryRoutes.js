const express = require("express");
const { calculateSalaryHRA } = require("../controllers/salaryController");

const router = express.Router();

router.post("/hra", calculateSalaryHRA);
router.post("/salary-structure", calculateSalaryHRA);

module.exports = router;
