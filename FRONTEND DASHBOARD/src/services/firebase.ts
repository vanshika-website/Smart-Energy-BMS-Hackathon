/**
 * Firebase Realtime Database — live phase2 / phase3 listeners for ESP32 data.
 */

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getDatabase, ref, onValue, type Unsubscribe } from 'firebase/database';

import { apiConfig } from '@/config/api.config';

export const firebaseConfigured = apiConfig.firebase.rtdbEnabled;

function getApp(): FirebaseApp | null {
  if (!firebaseConfigured) return null;
  const apps = getApps();
  if (apps.length) return apps[0]!;
  return initializeApp({
    apiKey: apiConfig.firebase.apiKey,
    authDomain: apiConfig.firebase.authDomain,
    projectId: apiConfig.firebase.projectId,
    databaseURL: apiConfig.firebase.databaseURL,
  });
}

export type FirebasePhasePayload = {
  phase2: Record<string, unknown>;
  phase3: Record<string, unknown>;
};

/**
 * Subscribes to `phase2` and `phase3` roots. Caller merges into UI state.
 * Returns unsubscribe (always a function).
 */
export function subscribeFirebaseRtdb(
  onData: (payload: FirebasePhasePayload) => void,
): () => void {
  const app = getApp();
  if (!app) {
    return () => {};
  }

  const db = getDatabase(app);
  const r2 = ref(db, 'phase2');
  const r3 = ref(db, 'phase3');

  let p2: Record<string, unknown> = {};
  let p3: Record<string, unknown> = {};

  const emit = () => onData({ phase2: { ...p2 }, phase3: { ...p3 } });

  const u2: Unsubscribe = onValue(r2, (snap) => {
    p2 = (snap.val() as Record<string, unknown>) || {};
    emit();
  });
  const u3: Unsubscribe = onValue(r3, (snap) => {
    p3 = (snap.val() as Record<string, unknown>) || {};
    emit();
  });

  console.log('[firebase] RTDB listeners active (phase2, phase3)');

  return () => {
    u2();
    u3();
  };
}

/** @deprecated use subscribeFirebaseRtdb */
export async function subscribeFirebaseRealtime(): Promise<never> {
  return Promise.reject(
    new Error('Use subscribeFirebaseRtdb — subscribeFirebaseRealtime is deprecated'),
  );
}
