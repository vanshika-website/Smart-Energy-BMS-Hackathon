const express = require('express');
const { getDashboard, getDevicesList } = require('../controllers/dashboardController');

const router = express.Router();

router.get('/dashboard', getDashboard);
router.get('/devices', getDevicesList);

module.exports = router;
