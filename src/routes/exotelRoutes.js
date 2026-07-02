const express = require('express');
const router = express.Router();
const ExotelController = require('../controllers/ExotelController');
const authMiddleware = require('../utils/authMiddleware');

router.post('/incoming', authMiddleware(), ExotelController.handleIncomingCall);

// Webhook for Post-Call AI Summary Processing
router.post('/recording-ready', authMiddleware(), ExotelController.handleRecordingReady);

module.exports = router;
