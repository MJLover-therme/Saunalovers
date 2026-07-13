import React from 'react';
import ReactDOM from 'react-dom/client';
import 'leaflet/dist/leaflet.css';
import './index.css';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { CurrentUserProvider } from './context/CurrentUserContext';
import { DataProvider } from './context/DataContext';
import { PresenceProvider } from './context/PresenceContext';
import { ActivityProvider } from './context/ActivityContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <CurrentUserProvider>
        <DataProvider>
          <PresenceProvider>
            <ActivityProvider>
              <App />
            </ActivityProvider>
          </PresenceProvider>
        </DataProvider>
      </CurrentUserProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
