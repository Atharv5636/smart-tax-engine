const express = require("express");
const { optimizeGoal } = require("../controllers/goalController");

const router = express.Router();

router.post("/goal", optimizeGoal);
module.exports = router;
