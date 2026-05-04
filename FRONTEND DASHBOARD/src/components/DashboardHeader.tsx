import { apiConfig } from '@/config/api.config';
import { useEnergy } from '@/contexts/EnergyContext';

export function DashboardHeader({
  variant = 'full',
}: {
  variant?: 'full' | 'compact';
}) {
  const { mqttConnectedFlag, lastSyncedAt, loading, totalKw } = useEnergy();
  const wsActive = Boolean(apiConfig.websocketUrl);

  const formattedSync = lastSyncedAt
    ? new Date(lastSyncedAt).toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

  if (variant === 'compact') {
    return (
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <h1 className="text-xl font-semibold tracking-tight text-white">
          DEBUG DIVAS – NIET Smart Energy Control
        </h1>
        <div className="flex flex-wrap gap-3 text-[11px] text-neutral-500">
          <span className="rounded-lg border border-neutral-800 px-3 py-1.5 bg-[#161616]">
            Σ&nbsp;
            <span className="text-[#00ff66]">{totalKw.toFixed(2)} kW</span>
          </span>
          <span className="rounded-lg border border-neutral-800 bg-[#161616] px-3 py-1.5">
            MQTT&nbsp;
            {mqttConnectedFlag ? (
              <span className="text-[#00ff66]">live</span>
            ) : apiConfig.mqtt.enabled ? (
              '…'
            ) : (
              'off'
            )}
          </span>
          <span className="rounded-lg border border-neutral-800 px-3 py-1.5 bg-[#161616]">
            {loading ? 'sync…' : formattedSync}
            {wsActive ? ' · WS' : ''}
          </span>
        </div>
      </header>
    );
  }

  return (
    <header className="mb-8 flex flex-col gap-4 border-b border-neutral-800 pb-8 md:flex-row md:items-start md:justify-between">
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#00ff66]/80">
          NIET Smart Energy
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-white md:text-[1.75rem]">
          DEBUG DIVAS – NIET Smart Energy Control
        </h1>
      </div>

      <div className="flex flex-wrap gap-2 text-[11px]">
        <div className="rounded-xl border border-neutral-800 bg-[#161616] px-3 py-2">
          <span className="text-neutral-500">MQTT · </span>
          <span
            className={
              mqttConnectedFlag ? 'text-[#00ff66]' : apiConfig.mqtt.enabled ? 'text-neutral-400' : 'text-neutral-600'
            }
          >
            {!apiConfig.mqtt.enabled ? 'disabled' : mqttConnectedFlag ? 'connected' : 'pending'}
          </span>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-[#161616] px-3 py-2 text-neutral-500">
          {wsActive ? 'WebSocket armed' : 'Poll + MQTT'}{' · '}{formattedSync}
        </div>
        <div className="rounded-xl border border-[#00ff66]/40 bg-black/70 px-3 py-2">
          <span className="text-neutral-500">Load </span>
          <span className="text-[#00ff66] font-semibold">{totalKw.toFixed(2)} kW</span>
        </div>
      </div>
    </header>
  );
}
