const { getDb } = require('../config/firebase');
const {
  getDeviceMeta,
  deviceCommandPath,
  slugifySegment,
} = require('../config/devices');

function normalizeCommand(command) {
  const c = String(command ?? '')
    .trim()
    .toUpperCase();
  if (c === 'ON' || c === '1' || c === 'TRUE') return 'ON';
  if (c === 'OFF' || c === '0' || c === 'FALSE') return 'OFF';
  return null;
}

function normalizeAction(action) {
  const a = String(action ?? '')
    .trim()
    .toLowerCase();
  if (a === 'on') return 'ON';
  if (a === 'off') return 'OFF';
  return null;
}

async function writeCommandToFirebase(deviceId, firebaseValue) {
  const id = slugifySegment(deviceId);
  const meta = getDeviceMeta(id);
  if (!meta) {
    const err = new Error(`Unknown device: ${deviceId}`);
    err.statusCode = 404;
    throw err;
  }

  const db = getDb();
  const path = deviceCommandPath(meta);
  await db.ref(path).set(firebaseValue);
  console.log(`[control] ${path} ←`, firebaseValue);

  /** 
   * Force sync command -> state so the dashboard reflects the user's intent immediately 
   * while the hardware processes the command.
   */
  const statePath = path.replace(/\/command$/, '/state');
  if (statePath !== path) {
    await db.ref(statePath).set(firebaseValue);
    console.log(`[control] ${statePath} ← (sync)`);
  }

  return { path, value: firebaseValue, deviceId: id };
}

async function controlDevice(deviceId, commandOrAction) {
  const onOff =
    normalizeCommand(commandOrAction) ?? normalizeAction(commandOrAction);
  if (!onOff) {
    const err = new Error('Invalid command: use ON/OFF (or action on/off)');
    err.statusCode = 400;
    throw err;
  }

  const result = await writeCommandToFirebase(deviceId, onOff);

  /** If turning ON, reset status/errors to clear any sticky 'OVERLOAD' or 'TRIPPED' states. */
  if (onOff === 'ON') {
    const id = slugifySegment(deviceId);
    const meta = getDeviceMeta(id);
    if (meta) {
      const db = getDb();
      const statusPath = deviceStatusPath(meta);
      await db.ref(statusPath).set('NORMAL');
    }
  }

  return result;
}

module.exports = {
  controlDevice,
  normalizeCommand,
  normalizeAction,
  writeCommandToFirebase,
};
