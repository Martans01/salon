'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const registerSW = async () => {
        try {
          console.log('PWA: Attempting to register service worker...');
          
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/'
          });
          
          console.log('PWA: Service Worker registered successfully:', registration);
          
          // Handle service worker updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              console.log('PWA: New service worker installing...');
              
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('PWA: New service worker available, will update on next page load');
                  
                  // Optionally show update notification
                  if (window.confirm('Nueva versión disponible. ¿Deseas actualizar?')) {
                    newWorker.postMessage({ action: 'SKIP_WAITING' });
                    window.location.reload();
                  }
                }
              });
            }
          });
          
          // Handle controlled page changes
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('PWA: Service worker controller changed');
            window.location.reload();
          });
          
        } catch (error) {
          console.error('PWA: Service Worker registration failed:', error);
        }
      };
      
      // Register on page load
      if (document.readyState === 'loading') {
        window.addEventListener('load', registerSW);
      } else {
        registerSW();
      }
      
      return () => {
        window.removeEventListener('load', registerSW);
      };
    }
  }, []);
  
  return null;
}