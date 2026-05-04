const express = require('express');
const {
  postUniversalControl,
  postDeviceControlCompat,
  getRegistry,
} = require('../controllers/deviceController');

const router = express.Router();

router.post('/device/control', postUniversalControl);
router.post('/devices/:deviceId/control', postDeviceControlCompat);
router.get('/devices/registry', getRegistry);

module.exports = router;
