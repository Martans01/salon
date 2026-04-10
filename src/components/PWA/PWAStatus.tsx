'use client';

import { useState, useEffect } from 'react';

interface PWAStatus {
  isInstalled: boolean;
  isInstallable: boolean;
  isOnline: boolean;
  hasServiceWorker: boolean;
  platform: string;
}

export default function PWAStatus() {
  const [status, setStatus] = useState<PWAStatus>({
    isInstalled: false,
    isInstallable: false,
    isOnline: true,
    hasServiceWorker: false,
    platform: 'unknown'
  });
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    const updateStatus = () => {
      const isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                         (window.navigator as unknown as { standalone?: boolean })?.standalone === true ||
                         document.referrer.includes('android-app://');

      const isOnline = navigator.onLine;
      const hasServiceWorker = 'serviceWorker' in navigator;
      
      let platform = 'unknown';
      if (/android/i.test(navigator.userAgent)) platform = 'android';
      else if (/iphone|ipad|ipod/i.test(navigator.userAgent)) platform = 'ios';
      else if (/windows/i.test(navigator.userAgent)) platform = 'windows';
      else if (/mac/i.test(navigator.userAgent)) platform = 'mac';
      else if (/linux/i.test(navigator.userAgent)) platform = 'linux';

      setStatus({
        isInstalled,
        isInstallable: false, // Will be updated by beforeinstallprompt
        isOnline,
        hasServiceWorker,
        platform
      });
    };

    const handleBeforeInstallPrompt = () => {
      setStatus(prev => ({ ...prev, isInstallable: true }));
    };

    const handleOnlineStatus = () => {
      setStatus(prev => ({ ...prev, isOnline: navigator.onLine }));
    };

    updateStatus();
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);

  // Only show in development mode
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 z-[300]">
      <button
        onClick={() => setShowStatus(!showStatus)}
        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium"
      >
        PWA Status
      </button>
      
      {showStatus && (
        <div className="absolute top-12 left-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-lg min-w-[280px] text-sm">
          <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">PWA Debug Info</h3>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Installed:</span>
              <span className={status.isInstalled ? 'text-green-600' : 'text-red-600'}>
                {status.isInstalled ? 'Yes' : 'No'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Installable:</span>
              <span className={status.isInstallable ? 'text-green-600' : 'text-red-600'}>
                {status.isInstallable ? 'Yes' : 'No'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Online:</span>
              <span className={status.isOnline ? 'text-green-600' : 'text-red-600'}>
                {status.isOnline ? 'Yes' : 'No'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Service Worker:</span>
              <span className={status.hasServiceWorker ? 'text-green-600' : 'text-red-600'}>
                {status.hasServiceWorker ? 'Supported' : 'Not Supported'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Platform:</span>
              <span className="text-gray-900 dark:text-white capitalize">
                {status.platform}
              </span>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-pink-500 hover:bg-pink-600 text-white px-3 py-2 rounded text-sm"
            >
              Reload Page
            </button>
          </div>
        </div>
      )}
    </div>
  );
}