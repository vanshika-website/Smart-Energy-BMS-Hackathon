/**
 * Lightweight WebSocket client for realtime telemetry alternatives to MQTT polling.
 */

import { apiConfig } from '@/config/api.config';

export function subscribeWebSocket(
  onTelemetry: (raw: unknown) => void,
): () => void {
  if (!apiConfig.websocketUrl) {
    return () => {};
  }
  let closed = false;
  const ws = new WebSocket(apiConfig.websocketUrl);

  ws.addEventListener('message', (ev) => {
    try {
      const parsed =
        typeof ev.data === 'string' ? JSON.parse(ev.data as string) : ev.data;
      onTelemetry(parsed);
    } catch {
      /** malformed payload ignored */
    }
  });

  return () => {
    if (closed) return;
    closed = true;
    ws.close();
  };
}
