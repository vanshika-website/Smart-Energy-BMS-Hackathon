import { deviceRegistrySeed } from '@/config/devices.registry';
import { mergedDeviceLimits } from '@/config/thresholds.config';
import { http } from '@/services/http';
import type { CompareRow, DeviceRecord, EnergyAlert, HistoryPoint } from '@/types/energy';

type RemotePayload = {
  devices?: DeviceRecord[];
  deviceLimits?: Record<string, number>;
  phaseLimits?: Record<string, number>;
  alerts?: EnergyAlert[];
  compare?: CompareRow[];
  historyRealtime?: HistoryPoint[];
  history24h?: HistoryPoint[];
  history7d?: { day: string; kwAvg: number }[];
};

export function normalizeDevices(remote: DeviceRecord[] | undefined): DeviceRecord[] {
  const seedMap = new Map(deviceRegistrySeed.map((d) => [d.id, d]));
  if (!remote?.length) {
    return deviceRegistrySeed.map((d) => ({
      ...d,
      lastUpdated: d.lastUpdated ?? new Date().toISOString(),
    }));
  }
  return remote.map((d) => {
    const seed = seedMap.get(d.id);
    return {
      ...(seed ?? d),
      ...d,
    };
  });
}

export async function fetchDashboardPayload(): Promise<RemotePayload | null> {
  try {
    const { data } = await http.get<RemotePayload | DeviceRecord[]>('dashboard');
    if (Array.isArray(data)) {
      return { devices: data };
    }
    return data ?? null;
  } catch {
    try {
      const { data } = await http.get<DeviceRecord[]>('devices');
      return Array.isArray(data) ? { devices: data } : null;
    } catch {
      return null;
    }
  }
}

export function deriveLimits(remote: RemotePayload | null): Record<string, number> {
  return { ...mergedDeviceLimits, ...(remote?.deviceLimits ?? {}) };
}
