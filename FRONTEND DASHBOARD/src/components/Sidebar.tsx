import { useState } from 'react';
import { NavLink } from 'react-router-dom';

import { useEnergy } from '@/contexts/EnergyContext';

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/map', label: 'Map' },
  { to: '/current', label: 'Current' },
  { to: '/calculator', label: 'Calculator' },
  { to: '/control', label: 'Machine Control' },
  { to: '/notifications', label: 'Notifications', badgeAlerts: true },
  { to: '/recommendations', label: 'Recommendations' },
] as const;

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { alerts } = useEnergy();

  return (
    <aside
      className={[
        'flex shrink-0 flex-col border-neutral-800/80 bg-[#161616]',
        'border-b lg:border-b-0 lg:border-r',
        'w-full lg:h-screen lg:sticky lg:top-0 lg:transition-[width] lg:duration-200 lg:ease-out',
        collapsed ? 'lg:w-[72px]' : 'lg:w-[238px]',
      ].join(' ')}
    >
      <div className="flex items-center justify-between gap-2 border-b border-neutral-800 px-4 py-4 lg:py-5">
        {!collapsed ? (
          <div className="text-[13px] font-semibold leading-tight tracking-tight text-[#00ff66]">
            DEBUG DIVAS
            <span className="mt-1 block text-[11px] font-normal text-neutral-500">
              Smart Energy Control
            </span>
          </div>
        ) : (
          <span className="hidden lg:block text-[#00ff66] text-xs font-bold px-1" aria-hidden>
            DD
          </span>
        )}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="rounded-md border border-neutral-700 px-2 py-1 text-[10px] text-neutral-400 hover:border-neutral-500 hover:text-white"
          aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
        >
          {collapsed ? '›' : '‹'}
        </button>
      </div>

      <nav className="flex flex-row gap-1 overflow-x-auto p-2 pb-3 lg:flex-1 lg:flex-col lg:overflow-y-auto lg:gap-0.5 lg:p-3">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={'end' in l ? l.end : false}
            className={({ isActive }) =>
              [
                'group relative flex shrink-0 items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-[13px] transition-colors lg:rounded-md',
                isActive ? 'bg-neutral-700/80 text-white' : 'text-neutral-400 hover:bg-neutral-800/90 hover:text-white',
              ].join(' ')
            }
          >
            <span className="font-medium">{l.label}</span>
            {'badgeAlerts' in l && l.badgeAlerts && alerts.length > 0 ? (
              <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
                {alerts.length}
              </span>
            ) : null}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
