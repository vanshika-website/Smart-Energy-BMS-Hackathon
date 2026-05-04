import { useMemo, useState } from 'react';

import { Breadcrumbs } from '@/components/Breadcrumbs';
import { useEnergy } from '@/contexts/EnergyContext';
import type { DeviceRecord, PhaseId } from '@/types/energy';

const ZONE_FRAME: Record<PhaseId, string> = {
  phase2: 'border-blue-500/35',
  phase3: 'border-amber-500/35',
};

function pillClass(device: DeviceRecord, limit?: number): string {
  const base =
    'cursor-pointer rounded-md border px-2.5 py-1 text-[11px] font-medium transition hover:brightness-110';
  if (!device.isOn)
    return `${base} border-neutral-700 bg-neutral-900 text-neutral-500`;
  const kw = device.currentKw;
  if (device.sensorAttached && kw != null && typeof limit === 'number' && kw > limit) {
    return `${base} border-red-600 bg-red-950/70 text-red-200`;
  }
  return `${base} border-emerald-600/55 bg-emerald-950/50 text-emerald-200`;
}

function deviceTag(device: DeviceRecord): string {
  return `${device.name.replace(/\s+/g, '_')}_${device.phaseId.slice(-1)}`.toUpperCase();
}

export function MapPage() {
  const { devices, deviceLimitsKw } = useEnergy();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const buckets = useMemo(() => {
    const m = new Map<PhaseId, DeviceRecord[]>();
    for (const d of devices) {
      const arr = m.get(d.phaseId) ?? [];
      arr.push(d);
      m.set(d.phaseId, arr);
    }
    return m;
  }, [devices]);

  const phases: PhaseId[] = ['phase2', 'phase3'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <Breadcrumbs trail={['Map', 'NIET', 'Home']} />
        <p className="text-[11px] text-neutral-500 italic">
          💡 Tip: Click any device pill to highlight it.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {phases.map((phaseId, idx) => {
          const list = buckets.get(phaseId) ?? [];
          const title = phaseId === 'phase2' ? 'Phase 2' : 'Phase 3';

          return (
            <div
              key={phaseId}
              className={[
                'min-h-[160px] rounded-xl border bg-[#161616] px-4 py-4 shadow-inner',
                ZONE_FRAME[phaseId],
              ].join(' ')}
            >
              <p className="text-[13px] font-semibold text-neutral-100">{title}</p>
              {idx === 2 ? (
                <p className="mt-1 text-[11px] text-neutral-500">ENTRY · manual overlays</p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2">
                {list.map((device) => {
                  const high =
                    device.sensorAttached
                    && device.currentKw != null
                    && device.currentKw > (deviceLimitsKw[device.id] ?? Number.POSITIVE_INFINITY);
                  return (
                    <button
                      key={device.id}
                      type="button"
                      title={
                        `${high ? 'High current · ' : ''}${device.isOn ? 'On' : 'Off'} — click to highlight`
                      }
                      onClick={() => setSelectedId((s) => (s === device.id ? null : device.id))}
                      className={[
                        pillClass(device, deviceLimitsKw[device.id]),
                        selectedId === device.id ? 'ring-2 ring-[#00ff66]/50' : '',
                      ].join(' ')}
                    >
                      {deviceTag(device)}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
