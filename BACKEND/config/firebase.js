/**
 * Real Firebase Admin, or in-memory mock when BMS_DEMO_MODE=1 (local testing without credentials).
 */
const useMock = String(process.env.BMS_DEMO_MODE || '').trim() === '1';

module.exports = useMock ? require('./firebaseMock') : require('./firebaseImpl');
