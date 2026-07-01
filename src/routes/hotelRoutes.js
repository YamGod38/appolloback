const express = require('express');
const router = express.Router();
const HotelController = require('../controllers/HotelController');

router.get('/', HotelController.getHotels);
router.post('/book', HotelController.bookRoom);

module.exports = router;
