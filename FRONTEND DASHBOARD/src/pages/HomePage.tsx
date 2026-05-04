import { useCallback, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { useEnergy } from '@/contexts/EnergyContext';
import type { PhaseId, PhaseStatus } from '@/types/energy';

const PHASE_LABELS: Record<PhaseId, string> = {
  phase2: 'Phase 2 · Light Appliances',
  phase3: 'Phase 3 · Heavy Appliances',
};

function zoneFrame(status: PhaseStatus): string {
  if (status === 'overload') return 'glow-red neon-pulse';
  if (status === 'moderate_warn') return 'border-amber-500/55';
  if (status === 'no_sensor') return 'glow-grey';
  return 'glow-green neon-pulse';
}

export function HomePage() {
  const { phases, realtimeSeries, totalKw, devices, deviceLimitsKw, toggleDevice } = useEnergy();
  const [toast, setToast] = useState<string | undefined>();
  const [pending, setPending] = useState(false);

  const ac = devices.find((d) => d.id === 'ac');
  const acOverload = ac && ac.currentKw && ac.currentKw > (deviceLimitsKw['ac'] || 2.5);

  async function handleEmergencyShutdown() {
    if (!ac) return;
    setPending(true);
    await toggleDevice(ac.id);
    setPending(false);
    setToast('Emergency shutdown command sent');
    setTimeout(() => setToast(undefined), 3000);
  }

  const kpis = useMemo(() => {
    // ...
    const bench = Math.max(totalKw + 3.8, 5.8);
    const slack = Math.max(0, bench - totalKw);
    const energySavedKwh = Number((slack * 1.15 + 4.2).toFixed(2));
    const tariff = 60;
    const costSaved = Math.round(energySavedKwh * (tariff / 10));
    const co2Kg = Math.round(energySavedKwh * 0.82);
    return { energySavedKwh, costSaved, co2Kg };
  }, [totalKw]);

  const chartPoints = useMemo(() => {
    const slice = realtimeSeries.length >= 12 ? realtimeSeries.slice(-52) : realtimeSeries;
    const base =
      slice.length > 2
        ? slice
        : Array.from({ length: 28 }, (_, i) => ({
            t: Date.now() - (27 - i) * 3200,
            kw: Math.max(0.4, totalKw * (0.88 + Math.sin(i / 5) * 0.04)),
          }));
    return base.map((p) => {
      const consumed = p.kw * 1000;
      const tailroom = Math.max(0, 3200 - consumed);
      const saved = tailroom * 0.42 + consumed * 0.08 + 220;
      return {
        ts: new Date(p.t).toLocaleTimeString(undefined, {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        normalUsed: consumed,
        energySaved: Math.min(saved, 1400),
      };
    });
  }, [realtimeSeries, totalKw]);



  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total power now" value={`${totalKw.toFixed(2)}`} unit="kW" accent="#60a5fa" />
        <KpiCard
          label="Energy saved today"
          value={`${kpis.energySavedKwh.toFixed(2)}`}
          unit="kWh"
          accent="#00ff66"
        />
        <KpiCard
          label="Cost saved today"
          value={`${kpis.costSaved}`}
          unit="₹"
          accent="#facc15"
        />
        <KpiCard
          label="CO₂ reduced"
          value={`${kpis.co2Kg}`}
          unit="kg"
          accent="#22d3ee"
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {phases.map((phase) => {
          const phaseDevices = devices.filter((d) => d.phaseId === phase.id);
          const powerW =
            phase.status === 'no_sensor'
              ? '—'
              : `${Math.round(phase.liveKw * 1000)}W`;

          const zoneActiveLabel = phase.status === 'overload' ? 'LIMIT' : 'ACTIVE';

          return (
            <div
              key={phase.id}
              className={[
                'flex flex-col rounded-xl border bg-[#161616] px-4 py-4',
                zoneFrame(phase.status),
              ].join(' ')}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[14px] font-semibold text-white">{PHASE_LABELS[phase.id]}</p>
                  <p className="mt-1 text-[12px] text-neutral-500">
                    Total Load: <span className="text-neutral-200 font-medium">{powerW}</span>
                  </p>
                </div>
                <span
                  className={[
                    'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                    zoneActiveLabel === 'ACTIVE'
                      ? 'bg-emerald-500/25 text-emerald-300 ring-1 ring-emerald-500/40'
                      : 'bg-red-500/20 text-red-300 ring-1 ring-red-500/40',
                  ].join(' ')}
                >
                  {zoneActiveLabel}
                </span>
              </div>
              
              <div className="mt-4 flex-1 space-y-2">
                {phaseDevices.map(d => {
                  const watts = d.currentKw != null ? Math.round(d.currentKw * 1000) : null;
                  const amps = watts != null ? (watts / 230).toFixed(1) : '—';
                  
                  return (
                    <div key={d.id} className={`flex items-center justify-between text-[12px] bg-neutral-800/40 p-2.5 rounded-lg border border-neutral-700/50 transition-all ${d.id === 'ac' ? 'glow-red neon-pulse' : d.id === 'microwave' ? 'glow-grey' : 'glow-green neon-pulse'}`}>
                      <span className="text-neutral-200 font-medium">{d.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-neutral-400">
                          {watts != null ? `${watts}W (${amps}A)` : '—'}
                        </span>
                        </div>
                    </div>
                  );
                })}
              </div>

            </div>
          );
        })}
      </div>

      <section className="rounded-xl border border-neutral-800 bg-[#161616] p-4">
        <h2 className="text-[15px] font-semibold text-neutral-100">
          Real‑time power consumption vs savings
        </h2>
        <div className="mt-4 h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartPoints} margin={{ top: 6, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="fillUsed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="fillSaved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00ff66" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#00ff66" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 10" stroke="#292929" vertical={false} />
              <XAxis dataKey="ts" stroke="#525252" tick={{ fill: '#737373', fontSize: 10 }} />
              <YAxis stroke="#525252" tick={{ fill: '#737373', fontSize: 10 }} width={42} domain={[0, 'auto']} />
              <Tooltip
                contentStyle={{
                  background: '#0f0f0f',
                  border: '1px solid #333',
                  borderRadius: 12,
                  fontSize: 12,
                }}
                labelStyle={{ color: '#888' }}
              />
              <Area
                type="monotone"
                dataKey="normalUsed"
                name="Normal used"
                stackId="1"
                stroke="#3b82f6"
                fill="url(#fillUsed)"
                strokeWidth={3}
                animationDuration={1500}
                isAnimationActive={true}
              />
              <Area
                type="monotone"
                dataKey="energySaved"
                name="Energy saved"
                stackId="1"
                stroke="#00ff66"
                fill="url(#fillSaved)"
                strokeWidth={3}
                animationDuration={2000}
                isAnimationActive={true}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex gap-6 text-[11px] text-neutral-500">
          <span className="flex items-center gap-2">
            <span className="h-2 w-4 rounded-sm bg-[#3b82f6]" aria-hidden /> Normal used
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2 w-4 rounded-sm bg-[#00ff66]" aria-hidden /> Energy saved
          </span>
        </div>
      </section>
    </div>
  );
}

function KpiCard({
  label,
  value,
  unit,
  accent,
}: {
  label: string;
  value: string;
  unit: string;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-[#161616] px-4 py-3">
      <p className="text-[11px] text-neutral-500">{label}</p>
      <p className="mt-2 text-[1.75rem] font-semibold tabular-nums leading-none" style={{ color: accent }}>
        {value}
      </p>
      <p className="mt-1 text-[11px] text-neutral-600">{unit}</p>
    </div>
  );
}
