import type { DeviceRecord } from '@/types/energy';

type DeviceControlModalProps = {
  device: DeviceRecord | null;
  maxKw?: number;
  activeAlarms: number;
  onClose: () => void;
};

export function DeviceControlModal({
  device,
  maxKw,
  activeAlarms,
  onClose,
}: DeviceControlModalProps) {
  if (!device) return null;

  const wattsText =
    device.sensorAttached && device.currentKw != null
      ? `${Math.round(device.currentKw * 1000)}W`
      : '—';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-neutral-800 bg-[#141414] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="presentation"
      >
        <h2 id="modal-title" className="text-lg font-semibold text-white">
          {device.id.replace(/-/g, '_').toUpperCase()}
        </h2>
        <p className="mt-1 text-sm text-neutral-500">{device.zoneLabel}</p>

        <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
          <Metric label="Phase" value={zoneShort(device.phaseId)} />
          <Metric label="Type" value={device.loadCategory.toUpperCase()} />
          <Metric label="Watts" value={wattsText} accent={device.isOn} />
          <Metric
            label="Status"
            value={device.isOn ? 'RUNNING' : 'STOPPED'}
            accent={device.isOn}
          />
        </dl>
        <p className="mt-4 text-xs text-neutral-500">
          Active alarms:{' '}
          <span className={activeAlarms > 0 ? 'font-semibold text-red-400' : 'text-[#00ff66]'}>
            {activeAlarms}
          </span>
        </p>
        {maxKw != null ? (
          <p className="mt-1 text-xs text-neutral-600">
            Envelope ≤ {maxKw.toFixed(2)} kW
          </p>
        ) : null}



        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-300 hover:border-neutral-500 hover:text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function zoneShort(pid: DeviceRecord['phaseId']): string {
  if (pid === 'phase2') return 'PHASE 2';
  return 'PHASE 3';
}

function Metric({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-black/60 px-3 py-2">
      <dt className="text-[10px] uppercase tracking-wider text-neutral-500">{label}</dt>
      <dd className={`mt-0.5 font-medium ${accent ? 'text-[#00ff66]' : 'text-neutral-200'}`}>
        {value}
      </dd>
    </div>
  );
}
