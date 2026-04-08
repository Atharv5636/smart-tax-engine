const express = require("express");
const { simulateTax } = require("../controllers/simulationController");

const router = express.Router();

router.post("/simulate", simulateTax);

module.exports = router;
