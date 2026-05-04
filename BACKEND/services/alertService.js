const { getDb } = require('../config/firebase');

const overloadEdge = new Map();

function formatKw(watts) {
  const kw = watts / 1000;
  return `${kw.toFixed(2)} kW`;
}

async function pushOverloadNotification({
  deviceId,
  displayName,
  powerW,
  limitW,
}) {
  const db = getDb();
  const ref = db.ref('notifications').push();
  const id = ref.key;
  const payload = {
    device: displayName || deviceId.toUpperCase(),
    message: 'Over power usage detected',
    value: `${formatKw(powerW)} > ${formatKw(limitW)}`,
    timestamp: Date.now(),
  };
  await ref.set(payload);
  console.log(`[alert] notification/${id}`, payload);
  return id;
}

/**
 * Fire when device transitions into overload (power > threshold).
 */
function handlePowerSample({ deviceId, displayName, powerW, limitW }) {
  if (!limitW || limitW <= 0) return;

  const overloaded = powerW > limitW;
  const was = overloadEdge.get(deviceId) === true;

  if (overloaded && !was) {
    pushOverloadNotification({
      deviceId,
      displayName,
      powerW,
      limitW,
    }).catch((e) => console.error('[alert] push failed:', e.message));
  }

  overloadEdge.set(deviceId, overloaded);
}

module.exports = {
  pushOverloadNotification,
  handlePowerSample,
};
