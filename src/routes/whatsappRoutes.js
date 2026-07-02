const express = require('express');
const router = express.Router();
const WhatsappController = require('../controllers/WhatsappController');
const authMiddleware = require('../utils/authMiddleware');

router.get('/logs', authMiddleware(), WhatsappController.getLogs);
router.post('/feedback-reply', authMiddleware(), WhatsappController.handleFeedbackReply);
router.post('/send-pdf', authMiddleware(), WhatsappController.sendPDF);

module.exports = router;
