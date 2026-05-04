const { getDb } = require('../config/firebase');
const { getRecentSecondSamples } = require('../services/aggregationService');

async function fetchOrderedChildren(refPath, limit) {
  const db = getDb();
  const snap = await db
    .ref(refPath)
    .orderByKey()
    .limitToLast(limit)
    .once('value');
  const val = snap.val() || {};
  const keys = Object.keys(val).sort();
  return keys.map((k) => ({ key: k, ...val[k] }));
}

async function getLive(req, res, next) {
  try {
    const memory = getRecentSecondSamples(60);
    if (memory.length) {
      return res.json({ source: 'memory', points: memory });
    }
    const points = await fetchOrderedChildren('analytics/second', 60);
    res.json({ source: 'firebase', points });
  } catch (e) {
    next(e);
  }
}

async function getMinute(req, res, next) {
  try {
    const limit = Math.min(Number(req.query.limit) || 480, 2000);
    const points = await fetchOrderedChildren('analytics/minute', limit);
    res.json({ points });
  } catch (e) {
    next(e);
  }
}

async function getHourly(req, res, next) {
  try {
    const limit = Math.min(Number(req.query.limit) || 168, 2000);
    const points = await fetchOrderedChildren('analytics/hourly', limit);
    res.json({ points });
  } catch (e) {
    next(e);
  }
}

async function getWeekly(req, res, next) {
  try {
    const limit = Math.min(Number(req.query.limit) || 52, 200);
    const points = await fetchOrderedChildren('analytics/weekly', limit);
    res.json({ points });
  } catch (e) {
    next(e);
  }
}

module.exports = {
  getLive,
  getMinute,
  getHourly,
  getWeekly,
};
