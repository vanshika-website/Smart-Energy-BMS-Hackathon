import mqtt from 'mqtt';

import { apiConfig } from '@/config/api.config';

let client: mqtt.MqttClient | null = null;

function getClient(): mqtt.MqttClient | null {
  if (!apiConfig.mqtt.enabled) return null;
  if (!client) {
    client = mqtt.connect(apiConfig.mqtt.brokerUrl, {
      reconnectPeriod: 5000,
      keepalive: 60,
      connectTimeout: 30_000,
      clean: true,
      protocolVersion: 4,
      username: apiConfig.mqtt.username || undefined,
      password: apiConfig.mqtt.password || undefined,
    });
    client.on('error', (err) => {
      console.error('[MQTT]', err.message);
      if (!apiConfig.mqtt.username?.trim() || !apiConfig.mqtt.password?.trim()) {
        console.error(
          '[MQTT] Set VITE_MQTT_USERNAME and VITE_MQTT_PASSWORD in .env (HiveMQ Cloud → Access Management).',
        );
      }
    });
  }
  return client;
}

async function waitForConnect(c: mqtt.MqttClient): Promise<void> {
  if (c.connected) return;
  await new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(
      () => reject(new Error('MQTT connect timeout')),
      8000,
    );
    const onOk = () => {
      window.clearTimeout(timeout);
      c.off('error', onErr);
      resolve();
    };
    const onErr = () => {
      window.clearTimeout(timeout);
      c.off('connect', onOk);
      reject(new Error('MQTT connection error'));
    };
    c.once('connect', onOk);
    c.once('error', onErr);
  });
}

export function mqttSubscribe(
  onMessage: (topic: string, payload: Uint8Array) => void,
): () => void {
  const c = getClient();
  if (!c) return () => {};

  const topic = apiConfig.mqtt.subscribeTopic;

  const onConnect = () => {
    void c.subscribe(topic, (err) => {
      if (err) console.error('[MQTT] subscribe error', err);
    });
  };

  const onMsg = (t: string, buf: Uint8Array) => onMessage(t, buf);

  c.on('connect', onConnect);
  c.on('message', onMsg);

  if (c.connected) onConnect();

  return () => {
    try {
      c.off('message', onMsg);
      c.off('connect', onConnect);
      void c.unsubscribe(topic);
    } catch {
      /** ignore */
    }
  };
}

export async function publishMqtt(topic: string, payload: string): Promise<void> {
  if (!apiConfig.mqtt.enabled) return;
  const c = getClient();
  if (!c) return;
  if (!c.connected) await waitForConnect(c);
  await new Promise<void>((resolve, reject) => {
    c.publish(topic, payload, { qos: 1 }, (err) => (err ? reject(err) : resolve()));
  });
}

export async function publishControl(payload: string): Promise<void> {
  await publishMqtt(apiConfig.mqtt.publishTopic, payload);
}

export function mqttConnected(): boolean {
  return !!client?.connected;
}
