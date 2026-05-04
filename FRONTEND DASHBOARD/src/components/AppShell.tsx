import { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { useEnergy } from '@/contexts/EnergyContext';
import type { ReactNode } from 'react';

export function AppShell({ children }: { children: ReactNode }) {
  const { devices, deviceLimitsKw, toggleDevice } = useEnergy();
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

  return (
    <div className="flex min-h-screen bg-[#0f0f0f] lg:flex-row flex-col">
      <Sidebar />

      <div className="flex min-h-0 flex-1 flex-col bg-[#0f0f0f]">
        <div className="mx-auto flex min-h-[calc(100vh-96px)] w-full flex-1 flex-col gap-6 px-4 pb-10 pt-5 md:px-6 lg:min-h-screen lg:px-8">
          {acOverload && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-red-500/50 bg-red-950/40 p-4 shadow-[0_0_20px_rgba(239,68,68,0.2)] animate-pulse">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white font-bold">!</span>
                <div>
                  <p className="text-[14px] font-bold text-red-100 uppercase tracking-tight">CRITICAL OVERLOAD: AC</p>
                  <p className="text-[12px] text-red-300">The AC is consuming {ac.currentKw?.toFixed(2)}kW. Safe limit is {deviceLimitsKw['ac'] || 2.5}kW.</p>
                </div>
              </div>
              <button 
                onClick={handleEmergencyShutdown}
                disabled={pending}
                className="w-full sm:w-auto rounded-lg bg-red-600 px-4 py-2 text-[12px] font-bold text-white hover:bg-red-700 transition-colors uppercase"
              >
                {pending ? 'Sending...' : 'Emergency Shutdown'}
              </button>
            </div>
          )}

          {toast && (
            <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-emerald-600 px-4 py-2 text-[13px] font-medium text-white shadow-lg animate-in slide-in-from-bottom">
              {toast}
            </div>
          )}

          {children}
        </div>
      </div>
    </div>
  );
}
