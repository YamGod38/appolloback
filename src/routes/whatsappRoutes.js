const express = require('express');
const router = express.Router();
const WhatsappController = require('../controllers/WhatsappController');

router.get('/logs', WhatsappController.getLogs);
router.post('/feedback-reply', WhatsappController.handleFeedbackReply);
router.post('/send-pdf', WhatsappController.sendPDF);

module.exports = router;
