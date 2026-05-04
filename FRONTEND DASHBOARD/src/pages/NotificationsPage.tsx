import { useMemo, useState, type ReactNode } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Breadcrumbs } from '@/components/Breadcrumbs';
import { apiConfig } from '@/config/api.config';
import { useEnergy } from '@/contexts/EnergyContext';

type Tab = 'active' | 'history' | 'push';

export function NotificationsPage() {
  const [tab, setTab] = useState<Tab>('active');
  const [dismissed, setDismissed] = useState<Set<string>>(() => new Set());
  const { alerts, compareRows, history24h } = useEnergy();

  const telemetryChart = history24h.map((p) => ({
    label: new Date(p.t).toLocaleTimeString(undefined, { hour: '2-digit' }),
    kw: Number(p.kw.toFixed(2)),
  }));

  const visibleAlerts = alerts.filter((a) => !dismissed.has(a.id));

  const historical = useMemo(
    () =>
      compareRows.map((r, i) => ({
        id: `hist-${r.id}-${i}`,
        deviceName: r.deviceName,
        message: `${r.percentIncrease}% above prior envelope`,
        time: new Date(Date.now() - (i + 1) * 3600_000).toLocaleString(),
      })),
    [compareRows],
  );

  return (
    <div className="space-y-5">
      <Breadcrumbs trail={['Map', 'NIET', 'Home']} />

      <div className="flex gap-2 border-b border-neutral-800 pb-2">
        <TabBtn active={tab === 'active'} onClick={() => setTab('active')}>
          Active
        </TabBtn>
        <TabBtn active={tab === 'history'} onClick={() => setTab('history')}>
          Historical
        </TabBtn>
        <TabBtn active={tab === 'push'} onClick={() => setTab('push')}>
          Push / MQTT digest
        </TabBtn>
      </div>

      {tab === 'active' ? (
        <div className="space-y-3">
          {!visibleAlerts.length ? (
            <p className="rounded-xl border border-neutral-800 bg-[#161616] px-4 py-8 text-center text-[13px] text-neutral-500">
              No open threshold breaches.
            </p>
          ) : (
            visibleAlerts.map((alert) => (
              <article
                key={alert.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-neutral-800 bg-[#161616] px-4 py-3"
              >
                <div className="flex min-w-[200px] items-start gap-3">
                  <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-red-500" aria-hidden />
                  <div>
                    <p className="text-[14px] font-semibold text-white">{alert.deviceName}</p>
                    <p className="text-[12px] text-red-400/90">
                      Overcurrent threshold exceeded ({alert.currentKw.toFixed(2)} kW vs ≤{' '}
                      {alert.normalHighKw.toFixed(2)})
                    </p>
                    <p className="mt-1 text-[11px] text-neutral-500">{alert.timestamp}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDismissed((s) => new Set(s).add(alert.id))}
                  className="rounded-lg border border-neutral-600 px-4 py-2 text-[12px] text-neutral-200 hover:border-[#00ff66]/40 hover:text-[#00ff66]"
                >
                  Acknowledge
                </button>
              </article>
            ))
          )}
          <MiniChart telemetryChart={telemetryChart} />
        </div>
      ) : null}

      {tab === 'history' ? (
        <div className="space-y-3">
          {!historical.length ? (
            <p className="text-[13px] text-neutral-500">No comparative spikes recorded yet.</p>
          ) : (
            historical.map((h) => (
              <div
                key={h.id}
                className="rounded-xl border border-neutral-800 bg-[#161616] px-4 py-3 text-[13px]"
              >
                <p className="font-semibold text-white">{h.deviceName}</p>
                <p className="text-neutral-400">{h.message}</p>
                <p className="mt-1 text-[11px] text-neutral-600">{h.time}</p>
              </div>
            ))
          )}
        </div>
      ) : null}

      {tab === 'push' ? (
        <div className="space-y-2 rounded-xl border border-neutral-800 bg-[#161616] px-4 py-4 text-[13px] text-neutral-400">
          <p>
            MQTT topic publish:{' '}
            <code className="text-neutral-300">{apiConfig.mqtt.publishTopic}</code>
          </p>
          <p>Slack / SMS / Email require backend relays and secrets outside the SPA (see .env).</p>
        </div>
      ) : null}
    </div>
  );
}

function TabBtn({
  children,
  active,
  onClick,
}: {
  children: ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'rounded-lg px-4 py-2 text-[13px] font-medium transition-colors',
        active ? 'bg-[#00ff66]/20 text-[#00ff66]' : 'text-neutral-400 hover:bg-neutral-800 hover:text-white',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

function MiniChart({
  telemetryChart,
}: {
  telemetryChart: { label: string; kw: number }[];
}) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-[#161616] p-4">
      <p className="mb-3 text-[12px] text-neutral-500">Load snapshot · 24 h glide</p>
      <div className="h-[160px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={telemetryChart.slice(-24)}>
            <CartesianGrid strokeDasharray="3 12" stroke="#292929" />
            <XAxis dataKey="label" tick={{ fill: '#737373', fontSize: 10 }} stroke="#404040" />
            <YAxis tick={{ fill: '#737373', fontSize: 10 }} stroke="#404040" width={32} />
            <Tooltip
              cursor={{ stroke: '#00ff6633' }}
              contentStyle={{
                background: '#0f0f0f',
                border: '1px solid #333',
                borderRadius: 12,
                fontSize: 12,
              }}
            />
            <Line type="monotone" dataKey="kw" stroke="#00ff66" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
