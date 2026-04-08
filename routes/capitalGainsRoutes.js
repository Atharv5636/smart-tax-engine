const express = require("express");
const {
  calculateCapitalGains,
} = require("../controllers/capitalGainsController");

const router = express.Router();

router.post("/capital-gains", calculateCapitalGains);

module.exports = router;
