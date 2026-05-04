import { useEffect, useMemo, useState } from 'react';

import { Breadcrumbs } from '@/components/Breadcrumbs';
import { useEnergy } from '@/contexts/EnergyContext';

export function CalculatorPage() {
  const { devices } = useEnergy();

  const [deviceId, setDeviceId] = useState(devices[0]?.id ?? '');

  useEffect(() => {
    if (!devices.length) return;
    setDeviceId((curr) => curr || devices[0]!.id);
  }, [devices]);

  const selected = devices.find((d) => d.id === deviceId) ?? devices[0];

  const defaultKwHint =
    selected?.sensorAttached && selected?.currentKw != null
      ? Number(selected.currentKw.toFixed(2))
      : 1.25;

  const [ratedKw, setRatedKw] = useState(defaultKwHint);
  const [hoursPerDay, setHoursPerDay] = useState(5);
  const [costPerKwh, setCostPerKwh] = useState(8);

  useEffect(() => {
    setRatedKw(defaultKwHint);
  }, [defaultKwHint]);

  const totals = useMemo(() => {
    const daysInMonth = 30;
    const kwhMonthly = ratedKw * hoursPerDay * daysInMonth;
    const monthlyEstimate = Math.round(kwhMonthly * costPerKwh * 100) / 100;
    const annualEstimate = Math.round(monthlyEstimate * 12 * 100) / 100;
    return {
      monthlyEstimate,
      annualEstimate,
      monthlyKWh: Number(kwhMonthly.toFixed(1)),
    };
  }, [ratedKw, hoursPerDay, costPerKwh]);

  return (
    <section className="space-y-8">
      <Breadcrumbs trail={['Map', 'NIET', 'Home']} />

      <div className="space-y-2">
        <p className="text-[11px] uppercase tracking-wider text-neutral-600">Calculator</p>
        <h2 className="text-xl font-semibold tracking-tight text-white">Monthly & annual ₹ estimate</h2>
        <p className="max-w-2xl text-[13px] text-neutral-500">
          Draw from live device IDs; tariff and hours editable below.
        </p>
      </div>

      <div className="grid gap-[1.65rem] lg:grid-cols-[minmax(0,1.09fr)_minmax(0,1fr)]">
        <form className="space-y-[1rem] rounded-[2rem] border border-neutral-800 bg-black/93 p-[1.7rem]">
          <fieldset className="space-y-10">
            <legend className="text-xs uppercase tracking-[0.34em] text-neutral-500">
              Parametric inputs
            </legend>

            <label className="block space-y-3 text-[13px] text-neutral-200">
              <span className="text-[11px] uppercase tracking-[0.31em] text-neutral-500">
                Appliance (registry ID)
              </span>
              <select
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-[0.93rem] py-[0.93rem] text-base text-white hover:border-neutral-600"
                value={selected?.id ?? ''}
                onChange={(e) => {
                  const id = e.target.value;
                  const d = devices.find((x) => x.id === id);
                  setDeviceId(id);
                  const hint =
                    d?.sensorAttached && d?.currentKw != null
                      ? Number(d.currentKw.toFixed(2))
                      : 1.25;
                  setRatedKw(hint);
                }}
              >
                {devices.map((device) => (
                  <option key={device.id} value={device.id}>
                    {device.name} ({device.phaseId})
                  </option>
                ))}
              </select>
            </label>

            <NumericField
              label="Assumed steady draw · kW"
              value={ratedKw}
              onChange={(n) => setRatedKw(Number.isFinite(n) ? n : 0)}
              suffix="kW nominal"
              min={0.05}
              max={99}
              step={0.05}
            />

            <NumericField
              label="Hours used per day"
              value={hoursPerDay}
              onChange={(n) => setHoursPerDay(Number.isFinite(n) ? n : 0)}
              min={0.25}
              max={24}
              suffix="hrs"
              step={0.25}
            />

            <NumericField
              label="Cost per kWh · local utility"
              value={costPerKwh}
              onChange={(n) => setCostPerKwh(Number.isFinite(n) ? n : 0)}
              suffix="₹ / kWh"
              min={0}
              max={100}
              step={0.1}
            />
          </fieldset>
        </form>

        <aside className="flex flex-col justify-between rounded-[2rem] border border-[#14b8a6]/53 bg-neutral-950/93 p-[1.7rem]">
          <div className="space-y-[1rem]">
            <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-500">
              Results · 30‑day glide
            </p>
            <p className="text-sm text-neutral-300">
              Monthly kWh here assumes thirty operating days until calendar logic lands server-side.
            </p>
            <div className="mt-7 rounded-2xl border border-neutral-800 bg-black/93 p-[1rem] text-xs text-neutral-400">
              Implied consumption this block:&nbsp;
              <span className="block text-xl font-semibold text-[#00ff66]">
                {totals.monthlyKWh} kWh
              </span>
            </div>
          </div>
          <div className="mt-[1rem] grid gap-[0.93rem] sm:grid-cols-2">
            <PulseCard tone="neon" eyebrow="Monthly estimate" metric={`₹ ${totals.monthlyEstimate}`} />
            <PulseCard tone="muted" eyebrow="Annual glide" metric={`₹ ${totals.annualEstimate}`} />
          </div>
        </aside>
      </div>
    </section>
  );
}

function PulseCard({
  tone,
  eyebrow,
  metric,
}: {
  tone: 'neon' | 'muted';
  eyebrow: string;
  metric: string;
}) {
  return (
    <div
      className={[
        'rounded-[1.45rem] border bg-neutral-950/93 p-[1rem]',
        tone === 'neon' ? 'border-[#00ff66]/73 glow-neon' : 'border-neutral-700',
      ].join(' ')}
    >
      <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-500">{eyebrow}</p>
      <p className="mt-[0.5rem] font-mono text-3xl tracking-tighter text-neutral-50">{metric}</p>
    </div>
  );
}

function NumericField(props: {
  label: string;
  value: number;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
  onChange: (n: number) => void;
}) {
  const { label, suffix, value, min, max, step, onChange } = props;
  return (
    <label className="block space-y-[0.6rem] text-[13px] text-neutral-200">
      <span className="text-[11px] uppercase tracking-[0.31em] text-neutral-500">{label}</span>
      <div className="flex items-center gap-4">
        <input
          type="number"
          className="w-full rounded-xl border border-neutral-800 bg-black/93 px-[0.93rem] py-[0.93rem] text-base text-white hover:border-neutral-600"
          value={Number.isFinite(value) ? value : 0}
          min={min}
          max={max}
          step={step}
          onChange={(ev) => onChange(Number(ev.target.value))}
        />
        {suffix ? (
          <span className="w-28 whitespace-nowrap text-xs text-neutral-500">{suffix}</span>
        ) : null}
      </div>
    </label>
  );
}
