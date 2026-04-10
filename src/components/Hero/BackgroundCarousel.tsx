'use client';

import { useBackgroundCarousel } from '@/hooks/useBackgroundCarousel';
import { motion } from 'framer-motion';

export default function BackgroundCarousel() {
  const { isLayer1Active, layer1Image, layer2Image } = useBackgroundCarousel();

  return (
    <div className="hero-background absolute inset-0 z-[1]">
      {/* Layer 1 */}
      <motion.div
        className="hero-bg-layer absolute inset-[-16px] bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${layer1Image.src})`,
          zIndex: isLayer1Active ? 2 : 1,
        }}
        initial={{ opacity: 0 }}
        animate={{
          opacity: isLayer1Active ? 1 : 0,
          scale: isLayer1Active ? 1.05 : 1
        }}
        transition={{
          opacity: { duration: 0.6, ease: 'easeInOut' },
          scale: { duration: 4, ease: 'easeInOut' }
        }}
      />

      {/* Layer 2 */}
      <motion.div
        className="hero-bg-layer absolute inset-[-16px] bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${layer2Image.src})`,
          zIndex: !isLayer1Active ? 2 : 1,
        }}
        initial={{ opacity: 0 }}
        animate={{
          opacity: !isLayer1Active ? 1 : 0,
          scale: !isLayer1Active ? 1.05 : 1
        }}
        transition={{
          opacity: { duration: 0.6, ease: 'easeInOut' },
          scale: { duration: 4, ease: 'easeInOut' }
        }}
      />

      {/* Overlay — multi-layer for cinematic depth */}
      <div className="hero-overlay absolute inset-0 bg-black/40 z-[3]" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-[3]" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent z-[3]" />
      {/* Cinematic vignette */}
      <div
        className="absolute inset-0 z-[3] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)',
        }}
      />
    </div>
  );
}
