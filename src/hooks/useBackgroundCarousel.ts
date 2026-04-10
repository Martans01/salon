'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { BACKGROUND_IMAGES } from '@/utils/constants';

export function useBackgroundCarousel() {
  const [isLayer1Active, setIsLayer1Active] = useState(true);
  const [layer1Image, setLayer1Image] = useState(BACKGROUND_IMAGES[0]);
  const [layer2Image, setLayer2Image] = useState(BACKGROUND_IMAGES[1]);
  const indexRef = useRef(0);

  const showNextBackground = useCallback(() => {
    indexRef.current = (indexRef.current + 1) % BACKGROUND_IMAGES.length;
    const newImage = BACKGROUND_IMAGES[indexRef.current];

    setIsLayer1Active(prev => {
      if (prev) {
        // Layer 2 is about to become active — update its image
        setLayer2Image(newImage);
      } else {
        // Layer 1 is about to become active — update its image
        setLayer1Image(newImage);
      }
      return !prev;
    });
  }, []);

  useEffect(() => {
    // Start carousel after 2 seconds, then change every 3.5 seconds
    const initialTimeout = setTimeout(() => {
      const interval = setInterval(showNextBackground, 3500);
      return () => clearInterval(interval);
    }, 2000);

    return () => clearTimeout(initialTimeout);
  }, [showNextBackground]);

  return {
    isLayer1Active,
    layer1Image,
    layer2Image,
  };
}