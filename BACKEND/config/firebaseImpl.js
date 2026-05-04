const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

let db;
let initialized = false;

function loadServiceAccount() {
  const inline = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (inline?.trim()) {
    try {
      return JSON.parse(inline);
    } catch (e) {
      console.error('[firebase] FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON:', e.message);
      throw e;
    }
  }

  const filePath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (filePath?.trim()) {
    const resolved = path.isAbsolute(filePath)
      ? filePath
      : path.join(process.cwd(), filePath);
    if (!fs.existsSync(resolved)) {
      console.warn(
        '[firebase] FIREBASE_SERVICE_ACCOUNT_PATH not found (skipping):',
        resolved,
      );
    } else {
      const raw = fs.readFileSync(resolved, 'utf8');
      return JSON.parse(raw);
    }
  }

  return null;
}

function initFirebase() {
  if (initialized) return db;

  const databaseURL = process.env.FIREBASE_DB_URL?.trim();
  if (!databaseURL) {
    throw new Error('FIREBASE_DB_URL is required');
  }

  if (admin.apps.length) {
    db = admin.database();
    initialized = true;
    return db;
  }

  const serviceAccount = loadServiceAccount();
  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL,
    });
    console.log('[firebase] Initialized with service account credential');
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim()) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      databaseURL,
    });
    console.log('[firebase] Initialized with application default credentials');
  } else {
    throw new Error(
      'Firebase credentials missing: set FIREBASE_SERVICE_ACCOUNT_JSON, FIREBASE_SERVICE_ACCOUNT_PATH (existing file), or GOOGLE_APPLICATION_CREDENTIALS. Or set BMS_DEMO_MODE=1 for local mock.',
    );
  }

  db = admin.database();
  initialized = true;
  return db;
}

function getDb() {
  if (!db) initFirebase();
  return db;
}

module.exports = { initFirebase, getDb };
