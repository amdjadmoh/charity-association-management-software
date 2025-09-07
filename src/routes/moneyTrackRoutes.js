const express = require('express');
const moneyTrackController = require('../controller/moneyTrack');

const router = express.Router();

// Routes for financial tracking
router.get('/', moneyTrackController.getMoneyTrack);
router.get('/date-range', moneyTrackController.getMoneyTrackByDateRange);

module.exports = router;
