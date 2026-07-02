const express = require('express');
const router = express.Router();
const AttendanceController = require('../controllers/AttendanceController');
const authMiddleware = require('../utils/authMiddleware');

router.get('/logs', authMiddleware(), AttendanceController.getLogs);
router.get('/export', authMiddleware(), AttendanceController.exportLogs);

module.exports = router;
