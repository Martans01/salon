'use client';

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Solo mostrar si NO está ya instalado
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                       (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    
    if (isInstalled) {
      return;
    }

    // Handle beforeinstallprompt event (Chrome/Edge on Android/Desktop)
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Para browsers que no soportan beforeinstallprompt
    const timer = setTimeout(() => {
      if (!deferredPrompt) {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        // Solo mostrar en iOS como fallback, otros browsers modernos deben usar beforeinstallprompt
        if (isIOS) {
          setShowInstallButton(true);
        }
      }
    }, 2000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(timer);
    };
  }, [deferredPrompt]);

  const handleInstallClick = async () => {
    if (isInstalling) return;
    setIsInstalling(true);

    // Si tenemos el prompt nativo (Chrome/Edge) - USAR ESO
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          setDeferredPrompt(null);
          setShowInstallButton(false);
        }
      } catch (error) {
        console.error('Error installing PWA:', error);
      }
    } else {
      // Fallback solo para iOS (ya que no soporta PWAs nativas)
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      
      if (isIOS) {
        alert(`❌ Safari en iOS no soporta instalación nativa de PWAs.

📱 Para mejor experiencia, usa:

• Chrome en iPhone/iPad
• Firefox en iPhone/iPad  
• Edge en iPhone/iPad

En estos navegadores obtendrás instalación real como app nativa.

Safari solo permite "añadir a inicio" que no es una app real.`);
      } else {
        alert(`❌ Tu navegador no soporta instalación nativa de PWAs.

📱 Para instalar como app nativa, usa:

• Chrome (recomendado)
• Microsoft Edge
• Firefox (versiones recientes)

Estos navegadores permiten instalación real como aplicación nativa.`);
      }
    }

    setIsInstalling(false);
  };

  if (!showInstallButton) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={handleInstallClick}
        disabled={isInstalling}
        className="bg-white text-black px-6 py-3 rounded-lg shadow-lg hover:bg-gray-100 transition-colors duration-200 flex items-center gap-2 font-medium"
      >
        {isInstalling ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent"></div>
            Instalando...
          </>
        ) : (
          <>
            📱 Instalar App
          </>
        )}
      </button>
    </div>
  );
}