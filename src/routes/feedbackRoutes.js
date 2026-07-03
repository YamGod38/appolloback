const express = require('express');
const router = express.Router();
const FeedbackController = require('../controllers/FeedbackController');
const authMiddleware = require('../utils/authMiddleware');

// Send feedback link is typically an authenticated backend call
router.post('/send-link', authMiddleware(), FeedbackController.sendLink);

// Submitting feedback should be open to the public
router.post('/submit', FeedbackController.submit);

module.exports = router;
