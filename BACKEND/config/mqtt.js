const mqtt = require('mqtt');

let client;
let connected = false;

function shouldEnableMqtt() {
  return Boolean(process.env.MQTT_URL?.trim());
}

function createMqttClient() {
  const url = process.env.MQTT_URL?.trim();
  if (!url) return null;

  const user = process.env.MQTT_USERNAME?.trim();
  const pass = process.env.MQTT_PASSWORD?.trim();

  const opts = {
    username: user || undefined,
    password: pass || undefined,
    reconnectPeriod: 5000,
    keepalive: 60,
    connectTimeout: 30_000,
    clientId: `bms-backend-${process.pid}-${Date.now().toString(36)}`,
    /** HiveMQ Cloud uses a public CA; keep TLS verification on */
    rejectUnauthorized: true,
  };

  const c = mqtt.connect(url, opts);

  c.on('connect', () => {
    connected = true;
    console.log('[mqtt] Connected (TLS MQTT)');
  });

  c.on('reconnect', () => {
    console.log('[mqtt] Reconnecting…');
  });

  c.on('close', () => {
    connected = false;
    console.log('[mqtt] Connection closed');
  });

  c.on('error', (err) => {
    console.error('[mqtt] Error:', err.message);
    if (!user || !pass) {
      console.error(
        '[mqtt] Hint: set MQTT_USERNAME and MQTT_PASSWORD in .env (HiveMQ Cloud → Access Management → Credentials).',
      );
    }
  });

  return c;
}

function getMqttClient() {
  if (!shouldEnableMqtt()) return null;
  if (!client) client = createMqttClient();
  return client;
}

function isMqttConnected() {
  return connected;
}

module.exports = {
  shouldEnableMqtt,
  getMqttClient,
  isMqttConnected,
};
