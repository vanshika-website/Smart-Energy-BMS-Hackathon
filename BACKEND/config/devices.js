/**
 * Dynamic device registry from env — no hardcoded device IDs in control/status logic.
 * DEVICE_REGISTRY_JSON: [{"id":"ac","phase":"phase3","powerLimitW":3000,"firebaseSegment":"ac"}, ...]
 * Optional: POWER_LIMIT_<ID>=watts adds or overrides limits (e.g. POWER_LIMIT_AC=3000).
 */

function slugifySegment(id) {
  return String(id || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');
}

function parseRegistryJson() {
  const raw = process.env.DEVICE_REGISTRY_JSON?.trim();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      console.warn('[devices] DEVICE_REGISTRY_JSON must be a JSON array — ignoring');
      return [];
    }
    return parsed;
  } catch (e) {
    console.error('[devices] DEVICE_REGISTRY_JSON parse error:', e.message);
    return [];
  }
}

function powerLimitOverridesFromEnv() {
  const out = {};
  const re = /^POWER_LIMIT_(.+)$/i;
  for (const key of Object.keys(process.env)) {
    const m = key.match(re);
    if (!m) continue;
    const deviceKey = m[1].toLowerCase();
    const n = Number(process.env[key]);
    if (Number.isFinite(n) && n > 0) out[deviceKey] = n;
  }
  return out;
}

function normalizeEntry(entry, powerOverrides) {
  const id = slugifySegment(entry.id);
  if (!id) return null;
  const phase = String(entry.phase || 'phase3')
    .trim()
    .toLowerCase();
  const firebaseSegment = entry.firebaseSegment
    ? slugifySegment(entry.firebaseSegment)
    : id;
  const fromOverride = powerOverrides[id];
  const fromEntry = entry.powerLimitW ?? entry.powerLimit;
  const rawLimit = fromOverride ?? fromEntry ?? 0;
  const powerLimitW = Number(rawLimit);
  return {
    id,
    phase,
    firebaseSegment,
    powerLimitW: Number.isFinite(powerLimitW) && powerLimitW > 0 ? powerLimitW : 0,
  };
}

function buildRegistryMap() {
  const powerOverrides = powerLimitOverridesFromEnv();
  const fromJson = parseRegistryJson();
  const byId = new Map();

  for (const e of fromJson) {
    const n = normalizeEntry(e, powerOverrides);
    if (n) byId.set(n.id, n);
  }

  for (const [id, w] of Object.entries(powerOverrides)) {
    if (byId.has(id)) {
      const cur = byId.get(id);
      byId.set(id, { ...cur, powerLimitW: w });
    } else {
      const n = normalizeEntry({ id, phase: 'phase3', powerLimitW: w }, powerOverrides);
      if (n) byId.set(n.id, n);
    }
  }

  return byId;
}

let cached = null;
let cachedAt = 0;
const CACHE_MS = 30_000;

function getDeviceRegistry() {
  const now = Date.now();
  if (cached && now - cachedAt < CACHE_MS) return cached;

  const byId = buildRegistryMap();
  const list = [...byId.values()];
  cached = { list, byId };
  cachedAt = now;

  if (!list.length) {
    console.warn(
      '[devices] Registry is empty. Set DEVICE_REGISTRY_JSON and/or POWER_LIMIT_* env vars.',
    );
  } else {
    console.log('[devices] Loaded registry:', list.length, 'device(s)');
  }

  return cached;
}

function getDeviceMeta(deviceId) {
  const id = slugifySegment(deviceId);
  return getDeviceRegistry().byId.get(id) || null;
}

function listDeviceIds() {
  return getDeviceRegistry().list.map((d) => d.id);
}

function deviceCommandPath(meta) {
  return `${meta.phase}/${meta.firebaseSegment}/command`;
}

function deviceStatePath(meta) {
  return `${meta.phase}/${meta.firebaseSegment}/state`;
}

function deviceVoltagePath(meta) {
  return `${meta.phase}/${meta.firebaseSegment}/voltage`;
}

function deviceStatusPath(meta) {
  return `${meta.phase}/${meta.firebaseSegment}/status`;
}

module.exports = {
  getDeviceRegistry,
  getDeviceMeta,
  listDeviceIds,
  deviceCommandPath,
  deviceStatePath,
  deviceVoltagePath,
  deviceStatusPath,
  slugifySegment,
};
