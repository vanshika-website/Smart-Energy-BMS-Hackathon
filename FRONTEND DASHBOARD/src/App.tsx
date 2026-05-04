import { Navigate, Route, Routes } from 'react-router-dom';

import { MainLayout } from '@/layouts/MainLayout';
import { CalculatorPage } from '@/pages/CalculatorPage';
import { CurrentPage } from '@/pages/CurrentPage';
import { HomePage } from '@/pages/HomePage';
import { MachineControlPage } from '@/pages/MachineControlPage';
import { MapPage } from '@/pages/MapPage';
import { NotificationsPage } from '@/pages/NotificationsPage';
import { RecommendationsPage } from '@/pages/RecommendationsPage';

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="map" element={<MapPage />} />
        <Route path="current" element={<CurrentPage />} />
        <Route path="calculator" element={<CalculatorPage />} />
        <Route path="control" element={<MachineControlPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="recommendations" element={<RecommendationsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
