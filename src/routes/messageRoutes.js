const express = require('express');
const router = express.Router();
const MessageController = require('../controllers/MessageController');
const authMiddleware = require('../utils/authMiddleware');

// POST /api/messages/send
router.post('/send', authMiddleware(), MessageController.sendMessage);

module.exports = router;
