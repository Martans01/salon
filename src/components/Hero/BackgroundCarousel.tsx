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
          scale: isLayer1Active ? 1.03 : 1
        }}
        transition={{
          opacity: { duration: 1, ease: 'easeInOut' },
          scale: { duration: 6, ease: 'easeInOut' }
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
          scale: !isLayer1Active ? 1.03 : 1
        }}
        transition={{
          opacity: { duration: 1, ease: 'easeInOut' },
          scale: { duration: 6, ease: 'easeInOut' }
        }}
      />

      {/* Soft elegant overlay - lighter, warm tones */}
      <div className="absolute inset-0 bg-[#fdf8f5]/30 z-[3]" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#fdf8f5] via-[#fdf8f5]/30 to-transparent z-[3]" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#fdf8f5]/40 via-transparent to-transparent z-[3]" />
      {/* Warm vignette */}
      <div
        className="absolute inset-0 z-[3] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(253,248,245,0.4) 100%)',
        }}
      />
    </div>
  );
}
