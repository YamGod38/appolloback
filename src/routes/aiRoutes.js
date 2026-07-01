const express = require('express');
const router = express.Router();
const AiController = require('../controllers/AiController');
const authMiddleware = require('../utils/authMiddleware');

router.post('/suggest', authMiddleware(), AiController.generateSuggestion);
router.post('/copilot-suggest', authMiddleware(), AiController.generateSuggestion);
router.get('/summarize/:callId', authMiddleware(), AiController.summarizeCall);

module.exports = router;
