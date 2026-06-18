const express = require('express');
const router = express.Router();
const AiController = require('../controllers/AiController');
const authMiddleware = require('../utils/authMiddleware');

router.post('/suggest', authMiddleware(), AiController.generateSuggestion);
// POST /api/ai/copilot-suggest
router.post('/copilot-suggest', authMiddleware(), AiController.generateSuggestion);

module.exports = router;
