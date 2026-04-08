const express = require("express");
const { calculateTax } = require("../controllers/taxController");

const router = express.Router();

router.post("/calculate", calculateTax);

module.exports = router;
