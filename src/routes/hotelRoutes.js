const express = require('express');
const router = express.Router();
const HotelController = require('../controllers/HotelController');
const authMiddleware = require('../utils/authMiddleware');

router.get('/', authMiddleware(), HotelController.getHotels);
router.post('/book', authMiddleware(), HotelController.bookRoom);

module.exports = router;
