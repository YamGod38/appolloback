const express = require('express');
const router = express.Router();
const ExotelController = require('../controllers/ExotelController');

router.post('/incoming', ExotelController.handleIncomingCall);

// Webhook for Post-Call AI Summary Processing
router.post('/recording-ready', ExotelController.handleRecordingReady);

module.exports = router;
