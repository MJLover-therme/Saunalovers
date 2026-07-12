import React from 'react';
import ReactDOM from 'react-dom/client';
import 'leaflet/dist/leaflet.css';
import './index.css';
import App from './App';
import { CurrentUserProvider } from './context/CurrentUserContext';
import { DataProvider } from './context/DataContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CurrentUserProvider>
      <DataProvider>
        <App />
      </DataProvider>
    </CurrentUserProvider>
  </React.StrictMode>,
);
