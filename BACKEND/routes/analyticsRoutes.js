const express = require('express');
const {
  getLive,
  getMinute,
  getHourly,
  getWeekly,
} = require('../controllers/analyticsController');

const router = express.Router();

router.get('/live', getLive);
router.get('/minute', getMinute);
router.get('/hourly', getHourly);
router.get('/weekly', getWeekly);

module.exports = router;
