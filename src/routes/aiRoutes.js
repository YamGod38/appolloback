const express = require('express');
const router = express.Router();
const AiController = require('../controllers/AiController');
const AiTriageController = require('../controllers/aiTriageController');
const authMiddleware = require('../utils/authMiddleware');

router.post('/suggest', authMiddleware(), AiController.generateSuggestion);
router.post('/copilot-suggest', authMiddleware(), AiController.generateSuggestion);
router.get('/summarize/:callId', authMiddleware(), AiController.summarizeCall);
router.post('/triage', authMiddleware(), AiTriageController.analyzeSymptoms);

module.exports = router;
