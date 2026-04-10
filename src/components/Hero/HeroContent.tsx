'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface HeroContentProps {
  onLocationClick: () => void;
}

const headingWords = ['TU', 'SALÓN', 'DE', 'BELLEZA', 'EN'];

export default function HeroContent({ onLocationClick }: HeroContentProps) {
  return (
    <div className="hero-container relative z-[4] px-6 sm:px-8">
      <div className="hero-content flex flex-col items-center text-center">
        {/* Logo — materializes from blur */}
        <motion.div
          className="hero-logo flex flex-col items-center mb-8 mt-16"
          initial={{ scale: 0.3, opacity: 0, filter: 'blur(10px)' }}
          animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          <Image
            src="/images/logos/logo.png"
            alt="Belle Studio Logo"
            width={260}
            height={260}
            className="hero-logo-img w-[180px] sm:w-[220px] md:w-[260px] h-auto rounded-full object-contain mb-4 p-5"
            priority
          />
        </motion.div>

        {/* Heading — stagger per word */}
        <h2 className="hero-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
          {headingWords.map((word, i) => (
            <motion.span
              key={i}
              className="inline-block mr-[0.3em]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            >
              {word}
            </motion.span>
          ))}
          <motion.span
            className="text-gradient inline-block"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 + headingWords.length * 0.08, ease: [0.16, 1, 0.3, 1] }}
          >
            TU CIUDAD
          </motion.span>
        </h2>

        {/* Subheading — clip-path reveal */}
        <motion.p
          className="hero-description text-base sm:text-lg md:text-xl text-gray-300 mb-8"
          initial={{ clipPath: 'inset(0 100% 0 0)' }}
          animate={{ clipPath: 'inset(0 0% 0 0)' }}
          transition={{ duration: 0.8, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          BELLEZA, ESTILO Y CUIDADO PROFESIONAL
        </motion.p>

        {/* Buttons */}
        <motion.div
          className="hero-buttons flex flex-col sm:flex-row gap-4 items-center w-full sm:w-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 100 }}
            className="w-full sm:w-auto"
          >
            <Link
              href="/reservar"
              className="glow-button bg-pink-500 hover:bg-pink-600 text-white px-8 py-4 rounded-lg font-semibold flex items-center justify-center gap-3 transition-colors duration-300 w-full sm:w-auto"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              AGENDAR CITA
            </Link>
          </motion.div>

          <motion.button
            onClick={onLocationClick}
            className="border-2 border-white/80 text-white hover:bg-white hover:text-black px-8 py-4 rounded-lg font-semibold flex items-center justify-center gap-3 transition-all duration-300 w-full sm:w-auto relative overflow-hidden"
            whileHover={{ scale: 1.05, borderColor: '#ec4899' }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 100 }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            UBICACIÓN
          </motion.button>
        </motion.div>

        {/* Scroll indicator — vertical line + dot */}
        <motion.div
          className="flex flex-col items-center mt-12 gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.8 }}
        >
          <span className="text-[10px] text-white/40 tracking-[0.3em] uppercase">Desliza</span>
          <div className="relative w-[1px] h-8 bg-white/10 rounded-full overflow-hidden">
            <div className="scroll-indicator-line absolute inset-0 bg-pink-500 rounded-full" />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
