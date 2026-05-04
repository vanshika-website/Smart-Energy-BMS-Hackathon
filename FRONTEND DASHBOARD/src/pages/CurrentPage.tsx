import { useMemo, useState } from 'react';

import { Breadcrumbs } from '@/components/Breadcrumbs';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { useEnergy } from '@/contexts/EnergyContext';

const monoAxis = {
  stroke: '#404040',
  tick: { fill: '#737373', fontSize: 11 },
};

export function CurrentPage() {
  const {
    devices,
    deviceLimitsKw,
    totalKw,
    realtimeSeries,
    history24h,
    historyMinute,
    highestKwDeviceId,
    history7d,
  } = useEnergy();


  const realtimeData = useMemo(
    () =>
      realtimeSeries.map((p) => ({
        ts: new Date(p.t).toLocaleTimeString(undefined, {
          minute: '2-digit',
          second: '2-digit',
        }),
        kw: Number(p.kw.toFixed(3)),
      })),
    [realtimeSeries],
  );

  const history7Fmt = useMemo(
    () =>
      history7d.map((d) => ({
        day: d.day,
        avg: Number(d.kwAvg.toFixed(2)),
      })),
    [history7d],
  );

  const history24Fmt = useMemo(
    () =>
      history24h.map((p) => ({
        label: new Date(p.t).toLocaleTimeString(undefined, {
          hour: '2-digit',
        }),
        kw: Number(p.kw.toFixed(2)),
      })),
    [history24h],
  );



  return (
    <section className="space-y-8">
      <Breadcrumbs trail={['Map', 'NIET', 'Home']} />

      <div className="space-y-2">
        <p className="text-[11px] uppercase tracking-wider text-neutral-600">
          Current monitoring
        </p>
        <h2 className="text-xl font-semibold tracking-tight text-white">
          Real‑time draw · envelopes · histories
        </h2>
        <p className="max-w-2xl text-[13px] text-neutral-500">
          Highest consumer gets a red border; nominal loads glow neon green when sensed.
        </p>

      </div>

      <div className="grid gap-[1rem] xl:grid-cols-[2fr_minmax(0,1fr)]">
        <div className="grid gap-[1rem] md:grid-cols-2">
          <div className="rounded-[1.6rem] border border-[#00ff66]/40 bg-black/94 p-[1rem] md:col-span-2">
            <p className="text-[11px] uppercase tracking-[0.25em] text-neutral-500">
              Aggregated sensing
            </p>
            <p className="text-5xl font-semibold text-[#00ff66]">
              {totalKw.toFixed(2)}
              <span className="ml-2 align-middle text-xl font-semibold text-neutral-500">
                kW Σ
              </span>
            </p>
          </div>

          {devices.map((device) => {
            const hottest = highestKwDeviceId === device.id;
            const badge =
              !device.sensorAttached || device.currentKw == null ? 'muted' : 'live';

            const statusClass = device.id === 'ac' ? 'glow-red' : device.id === 'microwave' ? 'glow-grey' : 'glow-green';
            
            return (
              <article
                key={device.id}
                className={[
                  'rounded-[1.5rem] border bg-black/90 p-[1.2rem] transition-all card-surface',
                  statusClass,
                  device.id !== 'microwave' ? 'neon-pulse' : '',
                ].join(' ')}
              >
                <header className="flex items-start justify-between gap-5">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-neutral-500">
                      {device.loadCategory} · envelope cap{' '}
                      {deviceLimitsKw[device.id]?.toFixed(2) ?? '—'} kW
                    </p>
                    <h3 className="text-xl font-semibold text-white">{device.name}</h3>
                  </div>
                  <span className="text-xs text-neutral-500">
                    {!device.manualControl ? 'Operator lock' : 'Manual OK'}
                  </span>
                </header>
                <div className="mt-7 flex items-center justify-between gap-5 text-[13px] text-neutral-300">
                  <div>
                    Live current{' '}
                    <span className="text-lg font-semibold text-[#00ff66]">
                      {!device.sensorAttached || device.currentKw == null ? (
                        '—'
                      ) : (
                        <>
                          {device.currentKw.toFixed(2)}{' '}
                          <span className="text-xs font-normal text-neutral-500">kW</span>
                        </>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className={device.isOn ? 'text-emerald-200' : 'text-neutral-500'}>
                      {device.isOn ? 'ON rail' : 'OFF rail'}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="space-y-8 lg:sticky lg:top-24">
          <div className="rounded-[2rem] border border-neutral-800 bg-neutral-950/93 p-[1.4rem]">
            <header className="mb-8 flex justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.25em] text-neutral-500">
                  Realtime stream · 120 s FIFO
                </p>
                <h3 className="text-xl font-semibold tracking-tight text-white">
                  Live total draw
                </h3>
              </div>
            </header>

            <div className="h-[236px] w-full md:h-[274px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={realtimeData}>
                  <defs>
                    <linearGradient id="neon" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#00ff66" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="#00ff66" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 11" stroke="#1f2937" />
                  <XAxis dataKey="ts" {...monoAxis} />
                  <YAxis {...monoAxis} tickFormatter={(v: number) => `${v}`} domain={['auto', 'auto']} />
                  <Tooltip
                    cursor={{ stroke: '#00ff6680' }}
                    contentStyle={{
                      background: '#090909',
                      border: '1px solid #262626',
                      borderRadius: 16,
                      color: '#e5e5e5',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="kw"
                    stroke="#00ff66"
                    fill="url(#neon)"
                    strokeWidth={4}
                    dot={false}
                    animationDuration={1500}
                    isAnimationActive={true}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>



          <div className="rounded-[2rem] border border-neutral-800 bg-neutral-950/93 p-[1.4rem]">
            <header className="mb-7">
              <p className="text-[11px] uppercase tracking-[0.25em] text-neutral-500">
                24 hour glide path
              </p>
              <h3 className="text-xl font-semibold tracking-tight text-white">Hourly deltas</h3>
            </header>
            <div className="h-[240px] w-full md:h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history24Fmt}>
                  <CartesianGrid strokeDasharray="6 13" stroke="#1f2937" />
                  <XAxis dataKey="label" {...monoAxis} />
                  <YAxis {...monoAxis} domain={['auto', 'auto']} />
                  <Tooltip
                    cursor={{ stroke: '#14b8a680' }}
                    contentStyle={{
                      background: '#090909',
                      border: '1px solid #262626',
                      borderRadius: 16,
                      color: '#e5e5e5',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="kw"
                    stroke="#14b8a6"
                    strokeWidth={4}
                    dot={false}
                    animationDuration={2500}
                    isAnimationActive={true}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] border border-neutral-800 bg-neutral-950/93 p-[1.4rem]">
        <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-neutral-500">
              7‑day glide path · rolling averages
            </p>
            <h3 className="text-xl font-semibold tracking-tight text-white">Weekly envelope</h3>
          </div>
        </header>
        <div className="h-[296px] w-full md:h-[348px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={history7Fmt}>
              <CartesianGrid strokeDasharray="4 13" stroke="#1f2937" />
              <XAxis dataKey="day" {...monoAxis} />
              <YAxis {...monoAxis} domain={['auto', 'auto']} />
              <Tooltip
                cursor={{ fill: '#00ff6610' }}
                contentStyle={{
                  background: '#090909',
                  border: '1px solid #262626',
                  borderRadius: 16,
                  color: '#e5e5e5',
                }}
              />
              <Bar dataKey="avg" radius={[13, 13, 0, 0]}>
                {history7Fmt.map((entry, idx) => {
                  const today = new Date().toLocaleDateString(undefined, { weekday: 'short' });
                  const isToday = entry.day === today;
                  return (
                    <Cell
                      key={`${entry.day}-${idx}`}
                      fill={isToday ? '#00ff66' : 'rgba(115, 115, 115, 0.1)'}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
