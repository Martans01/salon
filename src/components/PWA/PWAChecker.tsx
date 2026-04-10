'use client';

import { useState, useEffect } from 'react';

interface PWARequirements {
  hasManifest: boolean;
  hasServiceWorker: boolean;
  hasIcons: boolean;
  isHTTPS: boolean;
  hasStartUrl: boolean;
  hasDisplay: boolean;
  hasName: boolean;
  manifestValid: boolean;
  installable: boolean;
}

export default function PWAChecker() {
  const [requirements, setRequirements] = useState<PWARequirements>({
    hasManifest: false,
    hasServiceWorker: false,
    hasIcons: false,
    isHTTPS: false,
    hasStartUrl: false,
    hasDisplay: false,
    hasName: false,
    manifestValid: false,
    installable: false
  });
  
  const [showChecker, setShowChecker] = useState(false);

  useEffect(() => {
    const checkPWARequirements = async () => {
      console.log('PWA: Starting PWA requirements check...');
      
      // Check HTTPS
      const isHTTPS = location.protocol === 'https:' || location.hostname === 'localhost';
      console.log('PWA: HTTPS check:', isHTTPS);
      
      // Check Service Worker
      const hasServiceWorker = 'serviceWorker' in navigator;
      console.log('PWA: Service Worker supported:', hasServiceWorker);
      
      let swRegistered = false;
      if (hasServiceWorker) {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          swRegistered = registrations.length > 0;
          console.log('PWA: Service Worker registered:', swRegistered, registrations);
        } catch (error) {
          console.error('PWA: Error checking service worker:', error);
        }
      }
      
      // Check Manifest
      let manifestData: Record<string, unknown> | null = null;
      let hasManifest = false;
      let hasIcons = false;
      let hasStartUrl = false;
      let hasDisplay = false;
      let hasName = false;
      let manifestValid = false;
      
      try {
        const manifestResponse = await fetch('/manifest.json');
        if (manifestResponse.ok) {
          manifestData = await manifestResponse.json();
          hasManifest = true;
          hasIcons = !!(manifestData && manifestData.icons && Array.isArray(manifestData.icons) && manifestData.icons.length > 0);
          hasStartUrl = !!(manifestData && manifestData.start_url);
          hasDisplay = !!(manifestData && manifestData.display);
          hasName = !!(manifestData && manifestData.name && manifestData.short_name);
          manifestValid = hasIcons && hasStartUrl && hasDisplay && hasName;
          
          console.log('PWA: Manifest loaded:', manifestData);
          console.log('PWA: Manifest requirements:', {
            hasIcons, hasStartUrl, hasDisplay, hasName, manifestValid
          });
        } else {
          console.error('PWA: Failed to load manifest:', manifestResponse.status);
        }
      } catch (error) {
        console.error('PWA: Error loading manifest:', error);
      }
      
      // Check if installable (beforeinstallprompt fired or app is installable)
      const installable = hasManifest && swRegistered && manifestValid && isHTTPS;
      console.log('PWA: Overall installable status:', installable);
      
      setRequirements({
        hasManifest,
        hasServiceWorker: swRegistered,
        hasIcons,
        isHTTPS,
        hasStartUrl,
        hasDisplay,
        hasName,
        manifestValid,
        installable
      });
    };

    // Run check after component mounts
    const timer = setTimeout(checkPWARequirements, 2000);
    
    // Listen for beforeinstallprompt to confirm installability
    const handleBeforeInstallPrompt = () => {
      console.log('PWA: beforeinstallprompt fired - app is installable!');
      setRequirements(prev => ({ ...prev, installable: true }));
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Only show in development mode
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const allPassed = Object.values(requirements).every(req => req === true);

  return (
    <div className="fixed top-4 right-4 z-[300]">
      <button
        onClick={() => setShowChecker(!showChecker)}
        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          allPassed 
            ? 'bg-green-600 hover:bg-green-700 text-white' 
            : 'bg-red-600 hover:bg-red-700 text-white'
        }`}
      >
        PWA Check {allPassed ? '✅' : '❌'}
      </button>
      
      {showChecker && (
        <div className="absolute top-12 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-lg min-w-[320px] text-sm">
          <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">
            PWA Requirements Check
          </h3>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">HTTPS:</span>
              <span className={requirements.isHTTPS ? 'text-green-600' : 'text-red-600'}>
                {requirements.isHTTPS ? '✅' : '❌'}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Manifest:</span>
              <span className={requirements.hasManifest ? 'text-green-600' : 'text-red-600'}>
                {requirements.hasManifest ? '✅' : '❌'}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Service Worker:</span>
              <span className={requirements.hasServiceWorker ? 'text-green-600' : 'text-red-600'}>
                {requirements.hasServiceWorker ? '✅' : '❌'}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Icons:</span>
              <span className={requirements.hasIcons ? 'text-green-600' : 'text-red-600'}>
                {requirements.hasIcons ? '✅' : '❌'}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Start URL:</span>
              <span className={requirements.hasStartUrl ? 'text-green-600' : 'text-red-600'}>
                {requirements.hasStartUrl ? '✅' : '❌'}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Display Mode:</span>
              <span className={requirements.hasDisplay ? 'text-green-600' : 'text-red-600'}>
                {requirements.hasDisplay ? '✅' : '❌'}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Name/Short Name:</span>
              <span className={requirements.hasName ? 'text-green-600' : 'text-red-600'}>
                {requirements.hasName ? '✅' : '❌'}
              </span>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
            <div className="flex justify-between items-center font-semibold">
              <span className="text-gray-900 dark:text-white">Installable:</span>
              <span className={requirements.installable ? 'text-green-600' : 'text-red-600'}>
                {requirements.installable ? '✅ Ready!' : '❌ Not Ready'}
              </span>
            </div>
            
            {!requirements.installable && (
              <p className="text-xs text-red-600 mt-2">
                Fix the failing requirements above to enable PWA installation.
              </p>
            )}
          </div>
          
          <div className="mt-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm"
            >
              Recheck
            </button>
          </div>
        </div>
      )}
    </div>
  );
}