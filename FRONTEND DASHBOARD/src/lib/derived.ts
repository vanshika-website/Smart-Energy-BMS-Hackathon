import { defaultPhaseMaxKw } from '@/config/thresholds.config';
import type {
  CompareRow,
  DeviceRecord,
  EnergyAlert,
  HistoryPoint,
  PhaseId,
  PhaseView,
  RecommendationItem,
} from '@/types/energy';

const phaseTitles: Record<PhaseId, { title: string; subtitle: string }> = {
  phase2: {
    title: 'Phase 2',
    subtitle: 'Light Appliances',
  },
  phase3: {
    title: 'Phase 3',
    subtitle: 'Heavy Appliances',
  },
};

function numericPhase(pid: PhaseId): number {
  if (pid === 'phase2') return 2;
  return 3;
}

export function totalConsumptionKw(devices: DeviceRecord[]): number {
  return devices.reduce((acc, d) => acc + (d.currentKw ?? 0), 0);
}

export function buildPhaseViews(
  devices: DeviceRecord[],
  phaseLimitsKw: Record<number, number>,
  deviceLimits: Record<string, number>,
): PhaseView[] {
  const phases: PhaseId[] = ['phase2', 'phase3'];

  return phases.map((pid) => {
    const scoped = devices.filter((d) => d.phaseId === pid);
    const names = [...new Set(scoped.map((d) => d.name))];
    const liveKwSum = scoped.reduce((s, d) => s + (d.currentKw ?? 0), 0);
    const anySensorMissing = scoped.some((d) => !d.sensorAttached);
    const allNoSensor =
      scoped.length > 0 && scoped.every((d) => !d.sensorAttached);
    const pnum = numericPhase(pid);
    const limit = phaseLimitsKw[pnum] ?? defaultPhaseMaxKw[pnum] ?? 6;

    let status: PhaseView['status'] = 'normal';

    const overloadRisk = scoped.some((d) => {
      if (!d.sensorAttached || d.currentKw == null) return false;
      const cap = deviceLimits[d.id];
      return cap != null && d.currentKw > cap;
    });

    if (liveKwSum > limit || overloadRisk) status = 'overload';
    else if (liveKwSum > limit * 0.78) status = 'moderate_warn';
    if (allNoSensor) status = 'no_sensor';

    const meta = phaseTitles[pid];
    return {
      id: pid,
      title: meta.title,
      subtitle: meta.subtitle,
      appliances: names,
      liveKw: liveKwSum,
      totalLoadKw: liveKwSum,
      manualControlNotice: allNoSensor
        ? 'No sensor data — manual control enabled'
        : anySensorMissing
          ? 'Partial telemetry — manual fallback available'
          : undefined,
      status,
    };
  });
}

export function highestConsumerId(devices: DeviceRecord[]): string | null {
  let best: { id: string; kw: number } | null = null;
  for (const d of devices) {
    if (d.currentKw == null) continue;
    if (!best || d.currentKw > best.kw) best = { id: d.id, kw: d.currentKw };
  }
  return best?.id ?? null;
}

export function buildAlerts(
  devices: DeviceRecord[],
  limits: Record<string, number>,
): EnergyAlert[] {
  const out: EnergyAlert[] = [];
  for (const d of devices) {
    if (!d.sensorAttached || d.currentKw == null) continue;
    const cap = limits[d.id];
    if (cap == null) continue;
    if (d.currentKw > cap) {
      out.push({
        id: `${d.id}-alert`,
        deviceId: d.id,
        deviceName: d.name,
        currentKw: d.currentKw,
        normalHighKw: cap,
        timestamp: new Date().toISOString(),
        channel: 'in_app',
      });
    }
  }
  return out;
}

export function buildCompareRows(
  devices: DeviceRecord[],
  previous: Map<string, number>,
): CompareRow[] {
  const rows: CompareRow[] = [];
  for (const d of devices) {
    if (d.currentKw == null) continue;
    const prev = previous.get(d.id);
    if (prev == null) continue;
    if (prev <= 0) continue;
    const pct = ((d.currentKw - prev) / prev) * 100;
    if (pct > 8) {
      rows.push({
        id: `${d.id}-cmp`,
        deviceId: d.id,
        deviceName: d.name,
        previousKw: prev,
        currentKw: d.currentKw,
        percentIncrease: Math.round(pct * 10) / 10,
      });
    }
  }
  return rows.sort((a, b) => b.percentIncrease - a.percentIncrease);
}

export function seedHistory24h(totalKw: number): HistoryPoint[] {
  const now = Date.now();
  const pts: HistoryPoint[] = [];
  // Use 48 points for smoother but more detailed 24h history (every 30 mins)
  for (let i = 47; i >= 0; i -= 1) {
    const hour = (new Date(now - i * 1800_000).getHours());
    
    // Day/Night cycle: Lower at night (2am-6am), higher in evening (6pm-10pm)
    let cycleFactor = 1.0;
    if (hour >= 2 && hour <= 6) cycleFactor = 0.45;
    else if (hour >= 18 && hour <= 22) cycleFactor = 1.45;
    else if (hour >= 10 && hour <= 16) cycleFactor = 1.2;

    // Add random noise and occasional spikes
    const jitter = (Math.random() - 0.5) * 0.15;
    const spike = Math.random() > 0.92 ? Math.random() * 0.8 : 0;
    
    pts.push({
      t: now - i * 1800_000,
      kw: Math.max(0.15, totalKw * cycleFactor * (0.85 + jitter) + spike),
    });
  }
  return pts;
}

export function seedHistory7d(totalKw: number): { day: string; kwAvg: number }[] {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days.map((day, i) => {
    // Weekend usage usually differs
    const isWeekend = day === 'Sat' || day === 'Sun';
    const baseFactor = isWeekend ? 1.15 : 0.95;
    const randomness = 0.85 + Math.random() * 0.3;
    
    return {
      day,
      kwAvg: Math.max(0.4, totalKw * baseFactor * randomness),
    };
  });
}

export function buildDynamicRecommendations(
  devices: DeviceRecord[],
  alerts: EnergyAlert[]
): RecommendationItem[] {
  const recs: RecommendationItem[] = [];
  
  const ac = devices.find(d => d.id === 'ac');
  const microwave = devices.find(d => d.id === 'microwave');
  const heater = devices.find(d => d.id === 'heater');
  
  const acAlert = alerts.find(a => a.deviceId === 'ac');
  if (acAlert) {
    recs.push({
      id: 'rec-ac-overload',
      deviceId: 'ac',
      phaseId: 'phase3',
      title: 'Replace with Inverter AC to prevent overloading',
      reason: `AC is drawing ${acAlert.currentKw}kW, exceeding the safe limit of ${acAlert.normalHighKw}kW.`,
      suggestedModel: 'LG 1.5 Ton 5 Star DUAL Inverter Split AC',
      purchaseLink: 'https://www.amazon.in/dp/B0BP18XZNZ',
      estimatedPriceInr: 45490,
      energyRatingComparison: 'Inverter ACs reduce peak draw by ~35% over legacy models.',
      estimatedAnnualSavingsInr: 6200,
    });
  } else if (ac && ac.isOn && ac.currentKw && ac.currentKw > 2.5) {
     recs.push({
      id: 'rec-ac-high',
      deviceId: 'ac',
      phaseId: 'phase3',
      title: 'Automate AC thermostat for efficiency',
      reason: `AC is drawing ${ac.currentKw}kW. Automating the thermostat saves ~6% energy per degree.`,
      suggestedModel: 'Sensibo Sky Smart AC Controller',
      purchaseLink: 'https://www.amazon.in/dp/B073NYBSK2',
      estimatedPriceInr: 10499,
      energyRatingComparison: 'Optimizes cooling dynamically without overworking compressor.',
      estimatedAnnualSavingsInr: 1500,
    });
  }
  
  if (microwave && heater && microwave.isOn && heater.isOn) {
     recs.push({
      id: 'rec-microwave-heater',
      deviceId: 'heater',
      phaseId: 'phase3',
      title: 'Add load shedding smart plug',
      reason: 'Microwave and Heater are running simultaneously, risking Phase 3 overload.',
      suggestedModel: 'Havells 16A Smart Plug with Power Monitor',
      purchaseLink: 'https://www.amazon.in/dp/B09Y29FY63',
      estimatedPriceInr: 1199,
      energyRatingComparison: 'Prevents spikes and avoids grid demand charge penalties.',
      estimatedAnnualSavingsInr: 2400,
    });
  }

  const lights = devices.find(d => d.id === 'lights');
  if (lights && lights.isOn) {
    recs.push({
      id: 'rec-led',
      deviceId: 'lights',
      phaseId: 'phase2',
      title: 'Upgrade to motion-sensing smart LEDs',
      reason: 'Lights are currently ON. Ensure they are switched off automatically in unoccupied zones.',
      suggestedModel: 'Philips Hue 9W Smart LED Bulb',
      purchaseLink: 'https://www.amazon.in/dp/B09M71BS1K',
      estimatedPriceInr: 2499,
      energyRatingComparison: 'Smart LEDs with automation save ~30% runtime kWh.',
      estimatedAnnualSavingsInr: 900,
    });
  }

  if (recs.length === 0) {
    recs.push({
      id: 'rec-general',
      phaseId: 'phase2',
      title: 'General Maintenance: Upgrade to BLDC Fans',
      reason: 'All monitored devices are operating within normal parameters. Consider upgrading basic appliances.',
      suggestedModel: 'Atomberg Renesa 1200mm BLDC Motor Fan',
      purchaseLink: 'https://www.amazon.in/dp/B082T6S2S1',
      estimatedPriceInr: 3599,
      energyRatingComparison: 'Consumes only 28W at top speed compared to 75W normal fans.',
      estimatedAnnualSavingsInr: 1500,
    });
  }
  
  return recs;
}
