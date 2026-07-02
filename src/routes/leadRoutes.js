const express = require('express');
const router = express.Router();
const LeadController = require('../controllers/LeadController');
const authMiddleware = require('../utils/authMiddleware');

router.get('/', authMiddleware(), LeadController.getLeads);
router.post('/', authMiddleware(), LeadController.createLead);
router.put('/:id', authMiddleware(), LeadController.updateLead);
router.delete('/:id', authMiddleware(['ADMIN']), LeadController.deleteLead);

module.exports = router;
