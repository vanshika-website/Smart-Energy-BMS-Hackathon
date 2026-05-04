/* eslint-disable react-refresh/only-export-components -- context module pattern */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { apiConfig } from '@/config/api.config';
import {
  deriveLimits,
  fetchDashboardPayload,
  normalizeDevices,
} from '@/services/api/devices';
import { controlDevice } from '@/services/controlDevice';
import {
  buildAlerts,
  buildCompareRows,
  buildPhaseViews,
  highestConsumerId,
  seedHistory24h,
  seedHistory7d,
  totalConsumptionKw,
  buildDynamicRecommendations,
} from '@/lib/derived';
import { applyFirebasePhaseTrees } from '@/lib/firebaseMerge';
import {
  mqttConnected as mqttAlive,
  mqttSubscribe,
} from '@/services/mqttService';
import { subscribeFirebaseRtdb } from '@/services/firebase';
import { subscribeWebSocket } from '@/services/websocketService';
import { defaultPhaseMaxKw } from '@/config/thresholds.config';
import type {
  CompareRow,
  DeviceRecord,
  EnergyAlert,
  HistoryPoint,
  PhaseView,
  RecommendationItem,
} from '@/types/energy';

interface EnergyTelemetryMessage {
  deviceId?: string;
  currentKw?: number | null;
  isOn?: boolean;
}

type EnergyCtx = {
  devices: DeviceRecord[];
  phaseLimitsKw: Record<number, number>;
  deviceLimitsKw: Record<string, number>;
  phases: PhaseView[];
  realtimeSeries: HistoryPoint[];
  history24h: HistoryPoint[];
  history7d: { day: string; kwAvg: number }[];
  historyMinute: HistoryPoint[];
  alerts: EnergyAlert[];
  compareRows: CompareRow[];
  recommendations: RecommendationItem[];
  totalKw: number;
  highestKwDeviceId: string | null;
  loading: boolean;
  lastSyncedAt?: string;
  mqttConnectedFlag: boolean;
  toggleDevice: (id: string, next?: boolean) => Promise<{ ok: boolean; detail?: string }>;
};

const EnergyContext = createContext<EnergyCtx | null>(null);

function mergeTelemetry(
  current: DeviceRecord[],
  telemetry: EnergyTelemetryMessage,
): DeviceRecord[] {
  const id = telemetry.deviceId;
  if (!id) return current;
  return current.map((d) =>
    d.id === id
      ? {
          ...d,
          currentKw:
            telemetry.currentKw !== undefined ? telemetry.currentKw : d.currentKw,
          isOn: telemetry.isOn ?? d.isOn,
          lastUpdated: new Date().toISOString(),
        }
      : d,
  );
}

export function EnergyProvider({ children }: { children: ReactNode }) {
  const [devices, setDevices] = useState<DeviceRecord[]>(() =>
    normalizeDevices(undefined),
  );
  const [deviceLimitsKw, setDeviceLimitsKw] = useState(() =>
    deriveLimits(null),
  );
  const [phaseLimitsKw, setPhaseLimitsKw] = useState<
    Record<number, number>
  >({ ...defaultPhaseMaxKw });
  const [remoteHistory24h, setRemoteHistory24h] = useState<
    HistoryPoint[] | null
  >(null);
  const [remoteHistory7d, setRemoteHistory7d] = useState<
    { day: string; kwAvg: number }[] | null
  >(null);
  const [remoteHistoryMinute, setRemoteHistoryMinute] = useState<
    HistoryPoint[] | null
  >(null);
  const [realtimeSeries, setRealtimeSeries] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | undefined>();
  const [mqttTick, setMqttTick] = useState(0);

  const devicesRef = useRef(devices);
  useEffect(() => {
    devicesRef.current = devices;
  }, [devices]);

  const [comparisonBaseline, setComparisonBaseline] = useState(() => {
    const m = new Map<string, number>();
    for (const d of normalizeDevices(undefined)) {
      m.set(d.id, d.currentKw ?? 0);
    }
    return m;
  });

  const refresh = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    const remote = await fetchDashboardPayload();
    setComparisonBaseline(
      new Map(
        devicesRef.current.map((d) => [d.id, d.currentKw ?? 0]),
      ),
    );
    if (remote?.devices?.length) {
      setDevices(normalizeDevices(remote.devices));
    } else {
      setDevices(normalizeDevices(undefined));
    }
    setDeviceLimitsKw(deriveLimits(remote));
    if (remote?.phaseLimits) {
      const mapped: Record<number, number> = { ...defaultPhaseMaxKw };
      for (const [k, v] of Object.entries(remote.phaseLimits)) {
        const n = Number(k);
        if (!Number.isFinite(n)) continue;
        mapped[n] = v;
      }
      setPhaseLimitsKw(mapped);
    }
    if (remote?.history24h?.length) setRemoteHistory24h(remote.history24h);
    if (remote?.history7d?.length) setRemoteHistory7d(remote.history7d);
    if (remote?.historyMinute?.length) setRemoteHistoryMinute(remote.historyMinute);
    setLastSyncedAt(new Date().toISOString());
    if (!opts?.silent) setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => {
      void refresh();
    }, 8000);
    return () => window.clearInterval(id);
  }, [refresh]);

  useEffect(() => {
    if (!apiConfig.firebase.rtdbEnabled) return () => {};
    try {
      const unsub = subscribeFirebaseRtdb(({ phase2, phase3 }) => {
        setDevices((prev) => applyFirebasePhaseTrees(prev, phase2, phase3));
        setLastSyncedAt(new Date().toISOString());
      });
      return unsub;
    } catch (e) {
      console.warn('[EnergyContext] Firebase RTDB:', e);
      return () => {};
    }
  }, []);

  useEffect(() => {
    const teardown = mqttSubscribe((_topic, payload) => {
      try {
        const text = new TextDecoder().decode(payload);
        const parsed = JSON.parse(text) as EnergyTelemetryMessage;
        setDevices((prev) => mergeTelemetry(prev, parsed));
        setMqttTick((x) => x + 1);
      } catch {
        /** ignore */
      }
    });
    return teardown;
  }, []);

  useEffect(() => {
    return subscribeWebSocket((raw) => {
      if (raw && typeof raw === 'object') {
        setDevices((prev) => mergeTelemetry(prev, raw as EnergyTelemetryMessage));
      }
    });
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setMqttTick((x) => x + (mqttAlive() ? 1 : 0));
    }, 4000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      const snapshot = devicesRef.current;
      const baseKw = totalConsumptionKw(snapshot);
      // Add +/- 15W of sensor jitter for realism
      const noise = (Math.random() - 0.5) * 0.03;
      const kw = Math.max(0, baseKw + noise);
      const t = Date.now();
      setRealtimeSeries((s) => [...s.slice(-179), { t, kw }]);
    }, 2000);
    return () => window.clearInterval(id);
  }, []);

  const phases = useMemo(
    () => buildPhaseViews(devices, phaseLimitsKw, deviceLimitsKw),
    [devices, phaseLimitsKw, deviceLimitsKw],
  );

  const alerts = useMemo(
    () => buildAlerts(devices, deviceLimitsKw),
    [devices, deviceLimitsKw],
  );

  const compareRows = useMemo(
    () => buildCompareRows(devices, comparisonBaseline),
    [devices, comparisonBaseline],
  );

  const recommendations = useMemo(
    () => buildDynamicRecommendations(devices, alerts),
    [devices, alerts],
  );

  const totalKw = useMemo(() => totalConsumptionKw(devices), [devices]);

  const highestKwDeviceId = useMemo(() => highestConsumerId(devices), [devices]);

  const history24h = useMemo(() => {
    if (remoteHistory24h?.length) return remoteHistory24h;
    return seedHistory24h(totalKw);
  }, [remoteHistory24h, totalKw]);

  const history7d = useMemo(() => {
    if (remoteHistory7d?.length) return remoteHistory7d;
    return seedHistory7d(totalKw);
  }, [remoteHistory7d, totalKw]);

  const historyMinute = useMemo(() => {
    if (remoteHistoryMinute?.length) return remoteHistoryMinute;
    return [];
  }, [remoteHistoryMinute]);

  useEffect(() => {
    /** Prime chart when totals shift after first API load */
    if (loading) return;
    if (realtimeSeries.length === 0 && totalKw > 0) {
      const t = Date.now();
      setRealtimeSeries([{ t, kw: totalKw }]);
    }
  }, [loading, realtimeSeries.length, totalKw]);

  const toggleDevice = useCallback(async (id: string, next?: boolean) => {
    const prevList = [...devicesRef.current];
    setDevices((list) =>
      list.map((d) => {
        if (d.id !== id || !d.manualControl) return d;
        const on = typeof next === 'boolean' ? next : !d.isOn;
        return {
          ...d,
          isOn: on,
          currentKw:
            !d.sensorAttached
              ? d.currentKw
              : on && d.currentKw !== null && d.currentKw !== undefined && d.currentKw > 0
                ? d.currentKw
                : on
                  ? Math.max(d.currentKw ?? 0.2, 0.2)
                  : 0,
          lastUpdated: new Date().toISOString(),
        };
      }),
    );
    const current = prevList.find((d) => d.id === id);
    const toggled =
      typeof next === 'boolean'
        ? next
        : current
          ? !current.isOn
          : false;

    const res = await controlDevice(id, toggled ? 'on' : 'off');
    if (!res.ok && current) {
      setDevices(prevList);
    } else if (res.ok) {
      void refresh({ silent: true });
    }
    return res;
  }, [refresh]);

  const value: EnergyCtx = useMemo(
    () => ({
      devices,
      phaseLimitsKw,
      deviceLimitsKw,
      phases,
      realtimeSeries,
      history24h,
      history7d,
      historyMinute,
      alerts,
      compareRows,
      recommendations,
      totalKw,
      highestKwDeviceId,
      loading,
      lastSyncedAt,
      mqttConnectedFlag: apiConfig.mqtt.enabled && mqttAlive(),
      toggleDevice,
    }),
    [
      devices,
      phaseLimitsKw,
      deviceLimitsKw,
      phases,
      realtimeSeries,
      history24h,
      history7d,
      historyMinute,
      alerts,
      compareRows,
      recommendations,
      totalKw,
      highestKwDeviceId,
      loading,
      lastSyncedAt,
      toggleDevice,
      mqttTick,
    ],
  );

  return (
    <EnergyContext.Provider value={value}>{children}</EnergyContext.Provider>
  );
}

export function useEnergy() {
  const ctx = useContext(EnergyContext);
  if (!ctx) throw new Error('useEnergy must be inside EnergyProvider');
  return ctx;
}
