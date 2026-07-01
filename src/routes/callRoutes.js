const express = require('express');
const router = express.Router();
const CallController = require('../controllers/CallController');

router.get('/next-missed', CallController.getNextMissedCall);
router.post('/schedule', CallController.scheduleCall);
router.get('/scheduled', CallController.getScheduledCalls);
router.put('/scheduled/:id/resolve', CallController.resolveScheduledCall);
router.get('/conversion-rates', CallController.getConversionRates);
router.get('/export', CallController.exportLogs);

module.exports = router;
