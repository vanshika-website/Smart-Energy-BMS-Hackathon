import { Outlet, useLocation } from 'react-router-dom';

import { AppShell } from '@/components/AppShell';
import { DashboardHeader } from '@/components/DashboardHeader';

export function MainLayout() {
  const { pathname } = useLocation();
  const isHome = pathname === '/';

  return (
    <AppShell>
      {!isHome ? <DashboardHeader variant="compact" /> : null}
      <Outlet />
    </AppShell>
  );
}
