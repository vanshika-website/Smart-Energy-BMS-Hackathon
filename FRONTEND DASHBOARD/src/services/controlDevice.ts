import axios from 'axios';

import { apiConfig } from '@/config/api.config';
import { http } from '@/services/http';
import { publishControl, publishMqtt } from '@/services/mqttService';

export type ControlAction = 'on' | 'off';

export async function controlDevice(
  deviceId: string,
  action: ControlAction,
): Promise<{ ok: boolean; detail?: string }> {
  const ts = Date.now();
  const command = action === 'on' ? 'ON' : 'OFF';
  const restBody = { deviceId, action, ts };
  const mqttBody = JSON.stringify({
    ...restBody,
    device: deviceId,
    command,
  });

  let httpOk = false;
  let httpDetail: string | undefined;
  try {
    await http.post(`devices/${deviceId}/control`, restBody);
    httpOk = true;
  } catch (e) {
    if (axios.isAxiosError(e)) {
      const msg = (e.response?.data as { error?: string } | undefined)?.error;
      httpDetail = msg || e.message;
    } else {
      httpDetail = String(e);
    }
  }

  let mqttOk = false;
  let mqttDetail: string | undefined;
  if (apiConfig.mqtt.enabled) {
    try {
      await publishControl(mqttBody);
      const bmsTopic = apiConfig.mqtt.publishTopicBms?.trim();
      if (bmsTopic) await publishMqtt(bmsTopic, mqttBody);
      mqttOk = true;
    } catch (e) {
      mqttDetail = e instanceof Error ? e.message : String(e);
    }
  }

  const ok = httpOk || mqttOk;
  if (!ok) {
    const parts = [httpDetail, mqttDetail].filter(Boolean);
    return {
      ok: false,
      detail: parts.length ? parts.join(' · ') : 'Control failed (REST and MQTT unreachable)',
    };
  }

  if (!httpOk && mqttOk) {
    return {
      ok: true,
      detail: `MQTT ok${mqttDetail ? ` (${mqttDetail})` : ''}; REST: ${httpDetail ?? 'unreachable'}`,
    };
  }

  return { ok: true };
}
