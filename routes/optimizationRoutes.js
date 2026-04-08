const express = require("express");
const { optimizeTax } = require("../controllers/optimizationController");

const router = express.Router();

router.post("/optimize", optimizeTax);

module.exports = router;
