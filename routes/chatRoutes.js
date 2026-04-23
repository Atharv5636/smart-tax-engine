const express = require("express");
const { analyzeChatPrompt } = require("../controllers/chatController");

const router = express.Router();

router.post("/analyze", analyzeChatPrompt);

module.exports = router;
