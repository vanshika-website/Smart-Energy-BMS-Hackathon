import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from '@/App';
import '@/index.css';
import { EnergyProvider } from '@/contexts/EnergyContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <EnergyProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </EnergyProvider>
  </StrictMode>,
);
