import type { DeviceRecord } from '@/types/energy';

const PHASE2_SEGMENT = import.meta.env.VITE_PHASE2_SEGMENT?.trim() || 'relay';

function isOnState(val: unknown): boolean {
  if (val == null) return false;
  const s = String(val).trim().toUpperCase();
  if (s === 'ON' || s === 'TRUE' || s === '1') return true;
  if (val === true) return true;
  return false;
}

function readKw(node: Record<string, unknown> | null | undefined): number | null {
  if (!node || node.voltage == null) return null;
  const w = Number(node.voltage);
  if (!Number.isFinite(w)) return null;
  return w / 1000;
}

function treeNode(
  d: DeviceRecord,
  phase2: Record<string, unknown>,
  phase3: Record<string, unknown>,
): Record<string, unknown> {
  if (d.phaseId === 'phase3') {
    const n = phase3[d.id];
    return n && typeof n === 'object' ? (n as Record<string, unknown>) : {};
  }
  const relay = phase2[PHASE2_SEGMENT];
  if (relay && typeof relay === 'object') return relay as Record<string, unknown>;
  const direct = phase2[d.id];
  return direct && typeof direct === 'object' ? (direct as Record<string, unknown>) : {};
}

/** Merge RTDB phase snapshots into dashboard device rows (paths match ESP32 layout). */
export function applyFirebasePhaseTrees(
  devices: DeviceRecord[],
  phase2: unknown,
  phase3: unknown,
): DeviceRecord[] {
  const p2 =
    phase2 && typeof phase2 === 'object' ? (phase2 as Record<string, unknown>) : {};
  const p3 =
    phase3 && typeof phase3 === 'object' ? (phase3 as Record<string, unknown>) : {};
  const now = new Date().toISOString();

  return devices.map((d) => {
    const node = treeNode(d, p2, p3);
    const hasVoltage = Object.prototype.hasOwnProperty.call(node, 'voltage');
    const kw = readKw(node);
    const isOn = isOnState(node.state);
    return {
      ...d,
      sensorAttached: d.sensorAttached || Boolean(hasVoltage),
      isOn,
      currentKw: kw != null ? kw : isOn ? Math.max(d.currentKw ?? 0.05, 0.05) : 0,
      lastUpdated: now,
    };
  });
}
