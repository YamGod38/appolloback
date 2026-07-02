const express = require('express');
const router = express.Router();
const CallController = require('../controllers/CallController');
const authMiddleware = require('../utils/authMiddleware');

router.get('/next-missed', authMiddleware(), CallController.getNextMissedCall);
router.post('/schedule', authMiddleware(), CallController.scheduleCall);
router.get('/scheduled', authMiddleware(), CallController.getScheduledCalls);
router.put('/scheduled/:id/resolve', authMiddleware(), CallController.resolveScheduledCall);
router.get('/conversion-rates', authMiddleware(), CallController.getConversionRates);
router.get('/export', authMiddleware(), CallController.exportLogs);

module.exports = router;
