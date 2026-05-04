const { controlDevice } = require('../services/deviceControlService');
const { getDeviceRegistry } = require('../config/devices');

async function postUniversalControl(req, res, next) {
  try {
    const { device, command } = req.body || {};
    const result = await controlDevice(device, command);
    res.json({ ok: true, ...result });
  } catch (e) {
    next(e);
  }
}

async function postDeviceControlCompat(req, res, next) {
  try {
    const { deviceId } = req.params;
    const { action, command } = req.body || {};
    const result = await controlDevice(deviceId, command ?? action);
    res.json({ ok: true, ...result });
  } catch (e) {
    next(e);
  }
}

async function getRegistry(req, res, next) {
  try {
    const { list } = getDeviceRegistry();
    res.json({
      devices: list.map((d) => ({
        id: d.id,
        phase: d.phase,
        firebaseSegment: d.firebaseSegment,
        powerLimitW: d.powerLimitW,
      })),
    });
  } catch (e) {
    next(e);
  }
}

module.exports = {
  postUniversalControl,
  postDeviceControlCompat,
  getRegistry,
};
