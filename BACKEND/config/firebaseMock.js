/**
 * In-memory RTDB stand-in for local testing when BMS_DEMO_MODE=1.
 * Same shapes as Firebase Admin (ref / once / set / update / orderByKey / limitToLast / push).
 */

let store = {};
let db;
let initialized = false;

function pathParts(p) {
  return String(p ?? '').split('/').filter(Boolean);
}

function getSub(obj, parts) {
  let cur = obj;
  for (const part of parts) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = cur[part];
  }
  return cur;
}

function setSub(obj, parts, value) {
  if (parts.length === 0) return;
  const last = parts[parts.length - 1];
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (!cur[p] || typeof cur[p] !== 'object') cur[p] = {};
    cur = cur[p];
  }
  cur[last] = value;
}

function seedDemoData() {
  store = {
    phase3: {
      ac: { voltage: 3800, state: 'ON', command: 'ON' },
      heater: { voltage: 2000, state: 'ON', command: 'ON' },
      microwave: { voltage: 0, state: 'OFF', command: 'OFF' },
    },
    phase2: {
      relay: { voltage: 120, state: 'ON', command: 'ON' },
    },
  };
}

function createRef(pathStr) {
  const selfPath = pathStr == null || pathStr === '' ? '' : String(pathStr);

  const ref = {
    once: async (ev) => {
      if (ev !== 'value') return { val: () => null };
      const v = getSub(store, pathParts(selfPath));
      return { val: () => (v === undefined ? null : v) };
    },
    set: async (val) => {
      setSub(store, pathParts(selfPath), val);
      if (selfPath.endsWith('/command')) {
        const statePath = selfPath.replace(/\/command$/, '/state');
        setSub(store, pathParts(statePath), val);
      }
    },
    update: async (obj) => {
      for (const [rel, val] of Object.entries(obj)) {
        const full = selfPath ? `${selfPath}/${rel}` : rel;
        setSub(store, pathParts(full), val);
      }
    },
    orderByKey: () => ({
      limitToLast: (n) => ({
        once: async (ev) => {
          if (ev !== 'value') return { val: () => null };
          const node = getSub(store, pathParts(selfPath));
          const o = node && typeof node === 'object' && !Array.isArray(node) ? node : {};
          const keys = Object.keys(o).sort();
          const slice = keys.slice(Math.max(0, keys.length - n));
          const out = {};
          for (const k of slice) out[k] = o[k];
          return { val: () => out };
        },
      }),
    }),
    push: () => {
      const id = `-MOCK${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
      const childPath = selfPath ? `${selfPath}/${id}` : id;
      const childRef = createRef(childPath);
      Object.defineProperty(childRef, 'key', {
        value: id,
        enumerable: true,
        writable: false,
      });
      return childRef;
    },
  };

  return ref;
}

function createMockDb() {
  return {
    ref: (p) => createRef(p == null ? '' : String(p)),
  };
}

function initFirebase() {
  if (initialized) return db;
  seedDemoData();
  db = createMockDb();
  initialized = true;
  console.log(
    '[firebase:mock] In-memory database (BMS_DEMO_MODE=1). No real Firebase calls.',
  );
  return db;
}

function getDb() {
  if (!db) initFirebase();
  return db;
}

module.exports = { initFirebase, getDb };
