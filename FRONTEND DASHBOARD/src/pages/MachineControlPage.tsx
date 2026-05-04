import { useMemo, useState, type ReactNode } from 'react';

import { Breadcrumbs } from '@/components/Breadcrumbs';
import { DeviceControlModal } from '@/components/DeviceControlModal';
import { useEnergy } from '@/contexts/EnergyContext';
import type { DeviceRecord, LoadCategory, PhaseId } from '@/types/energy';

// Removed assetId function

function zoneLabel(pid: PhaseId): string {
  if (pid === 'phase2') return 'Phase 2';
  return 'Phase 3';
}

export function MachineControlPage() {
  const { devices, deviceLimitsKw, alerts } = useEnergy();
  const [filterId, setFilterId] = useState('');
  const [filterLoc, setFilterLoc] = useState('');
  const [filterType, setFilterType] = useState('');
  const [toast, setToast] = useState<string | undefined>();
  const [modalDevice, setModalDevice] = useState<DeviceRecord | null>(null);

  const rows = useMemo(() => {
    let r = [...devices].sort((a, b) => a.name.localeCompare(b.name));
    if (filterId.trim()) {
      const q = filterId.trim().toLowerCase();
      r = r.filter(
        (d) =>
          d.id.includes(q)
          || d.name.toLowerCase().includes(q)
      );
    }
    if (filterLoc) {
      const z = Number(filterLoc);
      const pid: PhaseId = z === 2 ? 'phase2' : 'phase3';
      r = r.filter((d) => d.phaseId === pid);
    }
    if (filterType)
      r = r.filter((d) => d.loadCategory === (filterType as LoadCategory));

    return r;
  }, [devices, filterId, filterLoc, filterType]);

  const alarmCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of alerts) {
      m.set(a.deviceId, (m.get(a.deviceId) ?? 0) + 1);
    }
    return m;
  }, [alerts]);

  const cardStatusClass = (d: DeviceRecord) => {
    if (d.id === 'microwave') return 'glow-grey';
    if (d.id === 'ac') return 'glow-red';
    return 'glow-green';
  };

  return (
    <div className="space-y-5">
      <Breadcrumbs trail={['Map', 'NIET', 'Home']} />

      <div className="flex flex-wrap items-end gap-4">
        <Field label="Appliance">
          <input
            value={filterId}
            onChange={(e) => setFilterId(e.target.value)}
            placeholder="Search"
            className="min-w-[120px] rounded-lg border border-neutral-700 bg-[#161616] px-3 py-2 text-[13px] text-white placeholder:text-neutral-600 focus:border-[#00ff66]/50 focus:outline-none"
          />
        </Field>
        <Field label="Location">
          <select
            value={filterLoc}
            onChange={(e) => setFilterLoc(e.target.value)}
            className="rounded-lg border border-neutral-700 bg-[#161616] px-3 py-2 text-[13px] text-white focus:border-[#00ff66]/50 focus:outline-none"
          >
            <option value="">All</option>
            <option value="2">Phase 2</option>
            <option value="3">Phase 3</option>
          </select>
        </Field>
        <Field label="Type">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-lg border border-neutral-700 bg-[#161616] px-3 py-2 text-[13px] text-white focus:border-[#00ff66]/50 focus:outline-none"
          >
            <option value="">All</option>
            <option value="heavy">Heavy</option>
            <option value="moderate">Moderate</option>
            <option value="light">Lights</option>
          </select>
        </Field>
        <button
          type="button"
          onClick={() => {
            setFilterId('');
            setFilterLoc('');
            setFilterType('');
          }}
          className="rounded-lg border border-blue-500/40 px-4 py-2 text-[12px] text-blue-300 hover:bg-blue-500/10"
        >
          Clear filters
        </button>
      </div>

      {toast ? (
        <p className="rounded-lg border border-red-900/60 bg-red-950/30 px-3 py-2 text-[12px] text-red-300">
          {toast}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map((device) => {
          const id = device.name;
          const watts =
            device.sensorAttached && device.currentKw != null
              ? Math.round(device.currentKw * 1000)
              : 0;
          const amps = (watts / 230).toFixed(1);
          const zoneNum = device.phaseId === 'phase2' ? 2 : 3;
          const running = device.isOn;
          const alarms = alarmCounts.get(device.id) ?? 0;

          return (
            <article
              key={device.id}
              className={[
                'flex flex-col rounded-xl border bg-[#161616] p-4 transition-all duration-300 card-surface',
                cardStatusClass(device),
                device.isOn ? 'neon-pulse' : '',
              ].join(' ')}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-[15px] font-semibold text-white">{id}</h3>
                  <p className="text-[12px] text-neutral-500">{zoneLabel(device.phaseId)}</p>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-medium">
                  <span
                    className={`h-2 w-2 rounded-full ${running ? 'bg-[#00ff66]' : 'bg-neutral-500'}`}
                    aria-hidden
                  />
                  <span className={running ? 'text-[#00ff66]' : 'text-neutral-400'}>
                    {running ? 'RUNNING' : 'STOPPED'}
                  </span>
                </div>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-2 text-[12px]">
                <div>
                  <dt className="text-neutral-500">POWER / CURRENT</dt>
                  <dd className="font-medium text-neutral-200">{watts}W ({amps}A)</dd>
                </div>
                <div>
                  <dt className="text-neutral-500">PHASE</dt>
                  <dd className="font-medium text-neutral-200">PHASE {zoneNum}</dd>
                </div>
                <div>
                  <dt className="text-neutral-500">TYPE</dt>
                  <dd className="font-medium text-neutral-200 uppercase">{device.loadCategory}</dd>
                </div>
                <div>
                  <dt className="text-neutral-500">STATUS</dt>
                  <dd className="font-medium text-neutral-200">{running ? 'RUNNING' : 'STOPPED'}</dd>
                </div>
              </dl>

              <p className="mt-3 text-[11px] text-neutral-500">
                Active alarms:{' '}
                <span className={alarms > 0 ? 'text-red-400' : 'text-neutral-400'}>{alarms}</span>
              </p>

              <div className="mt-4 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setModalDevice(device)}
                  className="flex items-center gap-1 rounded-lg border border-neutral-600 px-3 py-1.5 text-[12px] text-neutral-200 hover:border-[#00ff66]/45"
                >
                  Details{' '}
                  <span aria-hidden className="text-neutral-500">
                    ↗
                  </span>
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <DeviceControlModal
        device={modalDevice}
        maxKw={modalDevice ? deviceLimitsKw[modalDevice.id] : undefined}
        activeAlarms={modalDevice ? (alarmCounts.get(modalDevice.id) ?? 0) : 0}
        onClose={() => setModalDevice(null)}
      />
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-[11px] text-neutral-500">
      <span>{label}</span>
      {children}
    </label>
  );
}
