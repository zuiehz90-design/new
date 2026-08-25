import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { migrateLegacyData } from './lib/storageScope';

// Séparation invité / comptes : mets les anciennes données locales de côté (jamais exposées à l'invité)
migrateLegacyData();

import { initSentry } from './lib/sentry';
import './index.css';

// Sentry : initialisation lazy en production (si DSN configuré)
initSentry();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);

// Service worker (hors ligne) — en production uniquement
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
