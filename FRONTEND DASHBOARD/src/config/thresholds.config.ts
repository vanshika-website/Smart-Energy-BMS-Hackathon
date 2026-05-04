/**
 * Default threshold limits (kW). Override via `VITE_DEVICE_THRESHOLD_LIMITS` JSON in `.env`,
 * or replace at runtime via REST `/thresholds`.
 */

export const defaultPhaseMaxKw: Record<number, number> = {
  2: 6,
  3: 4,
};

export const defaultDeviceMaxKw: Record<string, number> = {
  ac: 3.5,
  microwave: 2.2,
  heater: 2.8,
  tv: 0.35,
  lights: 0.3,
  charger: 0.12,
  dishwasher: 1.8,
};

export function mergeDeviceThresholdOverrides(
  base: Record<string, number>,
  envRaw: string | undefined,
): Record<string, number> {
  if (!envRaw?.trim()) return { ...base };
  try {
    const parsed = JSON.parse(envRaw) as Record<string, number>;
    return { ...base, ...parsed };
  } catch {
    return { ...base };
  }
}

export const mergedDeviceLimits = mergeDeviceThresholdOverrides(
  defaultDeviceMaxKw,
  import.meta.env.VITE_DEVICE_THRESHOLD_LIMITS,
);
