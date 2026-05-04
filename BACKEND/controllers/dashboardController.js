const { buildDashboardPayload } = require('../services/dashboardService');

async function getDashboard(req, res, next) {
  try {
    const payload = await buildDashboardPayload();
    res.json(payload);
  } catch (e) {
    next(e);
  }
}

async function getDevicesList(req, res, next) {
  try {
    const payload = await buildDashboardPayload();
    res.json(payload.devices);
  } catch (e) {
    next(e);
  }
}

module.exports = { getDashboard, getDevicesList };
