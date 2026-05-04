/**
 * Central API & integration surface. Values come from `.env` (VITE_*).
 */

function trimUrl(url: string) {
  return url.replace(/\/+$/, '');
}

/** Strip whitespace and common stray quotes from .env values */
function cleanEnv(raw: string | undefined): string {
  if (!raw) return '';
  return raw.trim().replace(/^["']+|["']+$/g, '');
}

const firebaseApiKey = cleanEnv(import.meta.env.VITE_FIREBASE_API_KEY);
const firebaseAuthDomain = cleanEnv(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN);
const firebaseProjectId = cleanEnv(import.meta.env.VITE_FIREBASE_PROJECT_ID);
const firebaseDatabaseURL = cleanEnv(import.meta.env.VITE_FIREBASE_DATABASE_URL);

const mqttBrokerUrl = cleanEnv(import.meta.env.VITE_MQTT_BROKER_URL);
const mqttUsername = cleanEnv(import.meta.env.VITE_MQTT_USERNAME);
const mqttPassword = cleanEnv(import.meta.env.VITE_MQTT_PASSWORD);

export const apiConfig = {
  baseApiUrl:
    trimUrl(import.meta.env.VITE_BASE_API_URL || '') || '/api',

  firebase: {
    apiKey: firebaseApiKey,
    authDomain: firebaseAuthDomain,
    projectId: firebaseProjectId,
    databaseURL: firebaseDatabaseURL,
    enabled: Boolean(firebaseApiKey && firebaseProjectId),
    rtdbEnabled: Boolean(firebaseApiKey && firebaseProjectId && firebaseDatabaseURL),
  },

  mqtt: {
    brokerUrl: mqttBrokerUrl,
    username: mqttUsername,
    password: mqttPassword,
    subscribeTopic:
      cleanEnv(import.meta.env.VITE_MQTT_TOPIC_SUBSCRIBE) || 'home/+/telemetry',
    publishTopic:
      cleanEnv(import.meta.env.VITE_MQTT_TOPIC_PUBLISH) || 'home/control/device',
    /** Optional second publish (e.g. `bms/control`) when set in `.env` */
    publishTopicBms: cleanEnv(import.meta.env.VITE_MQTT_TOPIC_PUBLISH_BMS),
    enabled: Boolean(mqttBrokerUrl),
  },

  websocketUrl: cleanEnv(import.meta.env.VITE_WS_URL),

  wifiConfigHint: cleanEnv(import.meta.env.VITE_WIFI_SSID_HINT),

  vapidPublicKey: cleanEnv(import.meta.env.VITE_VAPID_PUBLIC_KEY),
} as const;

export type ApiConfig = typeof apiConfig;
