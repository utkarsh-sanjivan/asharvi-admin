import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider } from './auth/AuthContext';
import App from './app/App';
import './styles/global.css';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import { logEvent } from './features/diagnostics/diagnosticsStore';

logEvent('APP_BOOT');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
