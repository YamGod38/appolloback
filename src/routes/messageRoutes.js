const express = require('express');
const router = express.Router();
const MessageController = require('../controllers/MessageController');

// POST /api/messages/send
router.post('/send', MessageController.sendMessage);

module.exports = router;
