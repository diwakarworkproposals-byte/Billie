import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { initNativeApp } from './utils/mobileNative.js';

// Initialize Capacitor native mobile features (Splash screen, status bar, hardware back button)
initNativeApp();

// Register Service Worker for Progressive Web App offline capabilities
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const swUrl = `${import.meta.env.BASE_URL}sw.js`;
    navigator.serviceWorker
      .register(swUrl, { scope: import.meta.env.BASE_URL })
      .then((registration) => {
        registration.update();
        console.log('[Billie PWA] Service Worker registered and checked for updates:', registration.scope);
      })
      .catch((error) => {
        console.warn('[Billie PWA] Service Worker registration failed:', error);
      });
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
