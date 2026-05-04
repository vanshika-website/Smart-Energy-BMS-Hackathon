/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BASE_API_URL: string;
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_DATABASE_URL: string;
  readonly VITE_PHASE2_SEGMENT: string;
  readonly VITE_MQTT_BROKER_URL: string;
  readonly VITE_MQTT_USERNAME: string;
  readonly VITE_MQTT_PASSWORD: string;
  readonly VITE_MQTT_TOPIC_SUBSCRIBE: string;
  readonly VITE_MQTT_TOPIC_PUBLISH: string;
  readonly VITE_MQTT_TOPIC_PUBLISH_BMS: string;
  readonly VITE_WS_URL: string;
  readonly VITE_WIFI_SSID_HINT: string;
  readonly VITE_DEVICE_THRESHOLD_LIMITS: string;
  readonly VITE_VAPID_PUBLIC_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
