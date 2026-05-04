/**
 * In-memory ring (last 180s) + periodic rollups to Firebase analytics/*.
 */

const { getDb } = require('../config/firebase');

const SECOND_RING_MAX = 180;
const secondRing = [];

const minuteRing = [];
const MINUTE_RING_MAX = 480;

const hourlyRing = [];
const HOURLY_RING_MAX = 200;

let minuteTimer = null;
let hourlyTimer = null;
let weeklyTimer = null;

function pushSecondSample(row) {
  secondRing.push(row);
  if (secondRing.length > SECOND_RING_MAX) secondRing.shift();
}

function startAggregationTimers() {
  if (minuteTimer) return;

  minuteTimer = setInterval(async () => {
    try {
      if (!secondRing.length) return;
      const slice = secondRing.slice(-SECOND_RING_MAX);
      const n = slice.length;
      const totalPower = slice.reduce((s, r) => s + (r.totalPower || 0), 0) / n;
      const acPower = slice.reduce((s, r) => s + (r.acPower || 0), 0) / n;
      const heaterPower = slice.reduce((s, r) => s + (r.heaterPower || 0), 0) / n;
      const perDevicePower = {};
      for (const r of slice) {
        const pd = r.perDevicePower || {};
        for (const [k, v] of Object.entries(pd)) {
          perDevicePower[k] = (perDevicePower[k] || 0) + (Number(v) || 0);
        }
      }
      for (const k of Object.keys(perDevicePower)) perDevicePower[k] /= n;

      const row = {
        timestamp: Date.now(),
        totalPower,
        acPower,
        heaterPower,
        perDevicePower,
      };
      const db = getDb();
      const key = String(row.timestamp);
      await db.ref(`analytics/minute/${key}`).set(row);
      minuteRing.push(row);
      if (minuteRing.length > MINUTE_RING_MAX) minuteRing.shift();
      console.log('[analytics] wrote minute aggregate', key);
    } catch (e) {
      console.error('[analytics] minute rollup failed:', e.message);
    }
  }, 3 * 60 * 1000);

  hourlyTimer = setInterval(async () => {
    try {
      if (!minuteRing.length) return;
      const lastHour = minuteRing.slice(-20);
      if (!lastHour.length) return;
      const n = lastHour.length;
      const totalPower =
        lastHour.reduce((s, r) => s + (r.totalPower || 0), 0) / n;
      const acPower = lastHour.reduce((s, r) => s + (r.acPower || 0), 0) / n;
      const heaterPower =
        lastHour.reduce((s, r) => s + (r.heaterPower || 0), 0) / n;
      const perDevicePower = {};
      for (const r of lastHour) {
        const pd = r.perDevicePower || {};
        for (const [k, v] of Object.entries(pd)) {
          perDevicePower[k] = (perDevicePower[k] || 0) + (Number(v) || 0);
        }
      }
      for (const k of Object.keys(perDevicePower)) perDevicePower[k] /= n;

      const row = {
        timestamp: Date.now(),
        totalPower,
        acPower,
        heaterPower,
        perDevicePower,
      };
      const db = getDb();
      const key = String(row.timestamp);
      await db.ref(`analytics/hourly/${key}`).set(row);
      hourlyRing.push(row);
      if (hourlyRing.length > HOURLY_RING_MAX) hourlyRing.shift();
      console.log('[analytics] wrote hourly aggregate', key);
    } catch (e) {
      console.error('[analytics] hourly rollup failed:', e.message);
    }
  }, 60 * 60 * 1000);

  weeklyTimer = setInterval(async () => {
    try {
      if (!hourlyRing.length) return;
      const slice = hourlyRing.slice(-168);
      const n = slice.length;
      const totalPower = slice.reduce((s, r) => s + (r.totalPower || 0), 0) / n;
      const acPower = slice.reduce((s, r) => s + (r.acPower || 0), 0) / n;
      const heaterPower = slice.reduce((s, r) => s + (r.heaterPower || 0), 0) / n;
      const perDevicePower = {};
      for (const r of slice) {
        const pd = r.perDevicePower || {};
        for (const [k, v] of Object.entries(pd)) {
          perDevicePower[k] = (perDevicePower[k] || 0) + (Number(v) || 0);
        }
      }
      for (const k of Object.keys(perDevicePower)) perDevicePower[k] /= n;

      const row = {
        timestamp: Date.now(),
        totalPower,
        acPower,
        heaterPower,
        perDevicePower,
      };
      const db = getDb();
      const key = String(row.timestamp);
      await db.ref(`analytics/weekly/${key}`).set(row);
      console.log('[analytics] wrote weekly aggregate', key);
    } catch (e) {
      console.error('[analytics] weekly rollup failed:', e.message);
    }
  }, 7 * 24 * 60 * 60 * 1000);

  if (typeof minuteTimer.unref === 'function') minuteTimer.unref();
  if (typeof hourlyTimer.unref === 'function') hourlyTimer.unref();
  if (typeof weeklyTimer.unref === 'function') weeklyTimer.unref();

  console.log('[analytics] Rollup timers started (3m / 1h / 7d)');
}

function getRecentSecondSamples(max) {
  return secondRing.slice(-max);
}

module.exports = {
  pushSecondSample,
  startAggregationTimers,
  getRecentSecondSamples,
};
