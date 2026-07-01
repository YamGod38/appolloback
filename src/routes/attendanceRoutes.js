const express = require('express');
const router = express.Router();
const AttendanceController = require('../controllers/AttendanceController');

router.get('/logs', AttendanceController.getLogs);
router.get('/export', AttendanceController.exportLogs);

module.exports = router;
