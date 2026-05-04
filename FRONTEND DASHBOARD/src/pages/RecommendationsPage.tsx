import { useMemo } from 'react';

import { Breadcrumbs } from '@/components/Breadcrumbs';
import { useEnergy } from '@/contexts/EnergyContext';
import type { RecommendationItem } from '@/types/energy';

export function RecommendationsPage() {
  const { alerts, recommendations } = useEnergy();

  const { phase2Recs, phase3Recs } = useMemo(() => {
    const hotIds = new Set(alerts.map((a) => a.deviceId));
    
    const sorted = [...recommendations].sort((a, b) => {
      const ah = Number(hotIds.has(a.deviceId ?? ''));
      const bh = Number(hotIds.has(b.deviceId ?? ''));
      return bh - ah || b.estimatedAnnualSavingsInr - a.estimatedAnnualSavingsInr;
    });

    return {
      phase2Recs: sorted.filter(r => r.phaseId === 'phase2'),
      phase3Recs: sorted.filter(r => r.phaseId === 'phase3')
    };
  }, [alerts, recommendations]);

  const renderRecommendationCard = (rec: RecommendationItem) => (
    <article
      key={rec.id}
      className="flex flex-col justify-between rounded-xl border border-neutral-800 bg-[#161616] p-5"
    >
      <div className="space-y-[0.93rem]">
        <header>
          <div className="flex justify-between items-start">
            <p className="text-[11px] uppercase tracking-[0.35em] text-[#14b8a6]">
              {rec.deviceId ? `Device · ${rec.deviceId}` : 'Operational'}
            </p>
            {rec.purchaseLink && (
              <a
                href={rec.purchaseLink}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-[10px] font-medium text-neutral-300 hover:border-[#00ff66]/50 hover:text-white"
              >
                View product ↗
              </a>
            )}
          </div>
          <h3 className="mt-[0.73rem] text-2xl font-semibold tracking-tight text-white">{rec.title}</h3>
          <p className="mt-[0.7rem] text-sm text-neutral-400">{rec.reason}</p>
        </header>
        <dl className="space-y-[0.93rem] text-sm">
          <div className="rounded-2xl border border-neutral-800 bg-black/90 p-[1rem]">
            <div className="flex justify-between items-start">
              <dt className="text-[11px] uppercase tracking-[0.3em] text-neutral-500">Suggested model</dt>
              {rec.estimatedPriceInr != null && (
                <span className="text-[11px] font-medium text-neutral-400 border border-neutral-800 rounded px-1.5 py-0.5">
                  Est. Price: ₹{rec.estimatedPriceInr.toLocaleString()}
                </span>
              )}
            </div>
            <dd className="mt-[0.53rem] text-base text-white">{rec.suggestedModel}</dd>
          </div>
          <div className="rounded-2xl border border-[#00ff66]/60 bg-neutral-950/90 p-[1rem]">
            <dt className="text-[11px] uppercase tracking-[0.31em] text-neutral-500">
              Estimated annual savings · INR
            </dt>
            <dd className="mt-[0.43rem] text-4xl font-semibold text-[#00ff66]">
              ₹ {rec.estimatedAnnualSavingsInr.toLocaleString()}
            </dd>
            <dd className="mt-[1rem] text-xs text-neutral-400">{rec.energyRatingComparison}</dd>
          </div>
        </dl>
      </div>
    </article>
  );

  return (
    <section className="space-y-8">
      <Breadcrumbs trail={['Map', 'NIET', 'Home']} />

      <header className="space-y-2">
        <p className="text-[11px] uppercase tracking-wider text-neutral-600">Recommendations</p>
        <h2 className="text-xl font-semibold tracking-tight text-white">Efficiency upgrades · ₹ savings</h2>
        <p className="max-w-2xl text-[13px] text-neutral-500">
          Real-time product suggestions based on active telemetry to optimize your energy consumption.
        </p>
      </header>

      <div className="grid gap-[1.65rem] md:grid-cols-2">
        {/* Phase 2 Column */}
        <div className="space-y-4">
          <div className="mb-2 border-b border-neutral-800 pb-2">
            <h3 className="text-sm font-semibold text-neutral-300">Phase 2 · Light Appliances</h3>
          </div>
          <div className="flex flex-col gap-[1.65rem]">
            {phase2Recs.length > 0 ? (
              phase2Recs.map(renderRecommendationCard)
            ) : (
              <p className="text-[13px] text-neutral-500 italic">No current recommendations for Phase 2.</p>
            )}
          </div>
        </div>

        {/* Phase 3 Column */}
        <div className="space-y-4">
          <div className="mb-2 border-b border-neutral-800 pb-2">
            <h3 className="text-sm font-semibold text-neutral-300">Phase 3 · Heavy Appliances</h3>
          </div>
          <div className="flex flex-col gap-[1.65rem]">
            {phase3Recs.length > 0 ? (
              phase3Recs.map(renderRecommendationCard)
            ) : (
              <p className="text-[13px] text-neutral-500 italic">No current recommendations for Phase 3.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
