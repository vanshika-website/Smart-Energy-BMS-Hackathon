require('dotenv').config();

const express = require('express');
const cors = require('cors');

const { initFirebase } = require('./config/firebase');
const { getMqttClient, shouldEnableMqtt } = require('./config/mqtt');
const { controlDevice } = require('./services/deviceControlService');
const { startRealtimeListener } = require('./services/realtimeListener');
const { startAggregationTimers } = require('./services/aggregationService');

const deviceRoutes = require('./routes/deviceRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const PORT = Number(process.env.PORT) || 5000;

function setupMqttBridge() {
  if (!shouldEnableMqtt()) {
    console.log('[mqtt] MQTT_URL not set — skipping MQTT client');
    return;
  }

  const client = getMqttClient();
  if (!client) return;

  const topic = process.env.MQTT_CONTROL_TOPIC?.trim() || 'bms/control';

  function subscribeControlTopic() {
    client.subscribe(topic, { qos: 1 }, (err) => {
      if (err) console.error('[mqtt] subscribe failed:', err.message);
      else console.log('[mqtt] Subscribed to', topic);
    });
  }

  if (client.connected) subscribeControlTopic();
  else client.on('connect', subscribeControlTopic);

  client.on('message', (t, payload) => {
    if (t !== topic) return;
    let body;
    try {
      body = JSON.parse(payload.toString());
    } catch {
      console.warn('[mqtt] Non-JSON payload on', topic);
      return;
    }
    const device = body.device ?? body.deviceId;
    const command = body.command ?? body.action;
    if (!device) {
      console.warn('[mqtt] Missing device / deviceId in message');
      return;
    }
    controlDevice(device, command)
      .then(() => console.log('[mqtt] Applied control from MQTT', device, command))
      .catch((e) => console.error('[mqtt] Control failed:', e.message));
  });
}

function errorHandler(err, req, res, next) {
  const status = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  console.error('[api]', req.method, req.path, status, message);
  res.status(status).json({ ok: false, error: message });
}

async function main() {
  initFirebase();

  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (req, res) => {
    res.json({
      ok: true,
      uptime: process.uptime(),
      mqtt: shouldEnableMqtt(),
    });
  });

  app.use('/api', dashboardRoutes);
  app.use('/api', deviceRoutes);
  app.use('/api', analyticsRoutes);

  app.use(errorHandler);

  startRealtimeListener();
  startAggregationTimers();
  setupMqttBridge();

  const httpServer = app.listen(PORT, () => {
    console.log(`[server] BMS API listening on http://localhost:${PORT}`);
    console.log('[server] Control: POST /api/device/control');
    console.log('[server] Control (compat): POST /api/devices/:deviceId/control');
    console.log('[server] Graphs: GET /api/live | /api/minute | /api/hourly | /api/weekly');
    console.log('[server] Dashboard: GET /api/dashboard | GET /api/devices');
  });
  httpServer.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(
        `[server] Port ${PORT} is already in use. Stop the other process (e.g. old node server) or set PORT in .env.`,
      );
    } else {
      console.error('[server] Listen error:', err.message);
    }
    process.exit(1);
  });
}

main().catch((e) => {
  console.error('[server] Fatal:', e);
  process.exit(1);
});
