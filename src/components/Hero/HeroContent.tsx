'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface HeroContentProps {
  onLocationClick: () => void;
}

export default function HeroContent({ onLocationClick }: HeroContentProps) {
  return (
    <div className="hero-container relative z-[4] px-6 sm:px-8">
      <div className="hero-content flex flex-col items-center text-center">
        {/* Logo */}
        <motion.div
          className="hero-logo flex flex-col items-center mb-6 mt-16"
          initial={{ scale: 0.3, opacity: 0, filter: 'blur(10px)' }}
          animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          <Image
            src="/images/logos/logo.png"
            alt="Belle Studio Logo"
            width={200}
            height={200}
            className="hero-logo-img w-[140px] sm:w-[170px] md:w-[200px] h-auto rounded-full object-contain mb-4 p-4 drop-shadow-lg"
            priority
          />
        </motion.div>

        {/* Decorative line */}
        <motion.div
          className="w-20 h-px bg-gradient-to-r from-transparent via-[#c48b8b] to-transparent mb-6"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        />

        {/* Heading */}
        <motion.h2
          className="font-playfair text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-normal text-[#3d2c33] mb-3 leading-tight italic"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          Belle Studio
        </motion.h2>

        {/* Tagline */}
        <motion.p
          className="text-sm sm:text-base tracking-[0.3em] uppercase text-[#c48b8b] mb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          Salón de Belleza
        </motion.p>

        {/* Subheading */}
        <motion.p
          className="hero-description text-base sm:text-lg md:text-xl text-[#5a4249]/70 mb-10 max-w-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          Donde la elegancia se encuentra con el cuidado profesional
        </motion.p>

        {/* Buttons */}
        <motion.div
          className="hero-buttons flex flex-col sm:flex-row gap-4 items-center w-full sm:w-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
        >
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="w-full sm:w-auto"
          >
            <Link
              href="/reservar"
              className="glow-button bg-[#c48b8b] hover:bg-[#b07878] text-white px-10 py-4 rounded-full font-medium flex items-center justify-center gap-3 transition-colors duration-300 w-full sm:w-auto tracking-wider text-sm uppercase"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              Agendar Cita
            </Link>
          </motion.div>

          <motion.button
            onClick={onLocationClick}
            className="border border-[#c48b8b]/40 text-[#3d2c33]/80 hover:bg-[#c48b8b]/10 hover:border-[#c48b8b] px-10 py-4 rounded-full font-medium flex items-center justify-center gap-3 transition-all duration-300 w-full sm:w-auto tracking-wider text-sm uppercase"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            Ubicación
          </motion.button>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="flex flex-col items-center mt-14 gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.8 }}
        >
          <span className="text-[10px] text-[#5a4249]/30 tracking-[0.3em] uppercase">Descubre</span>
          <div className="relative w-[1px] h-8 bg-[#c48b8b]/15 rounded-full overflow-hidden">
            <div className="scroll-indicator-line absolute inset-0 bg-[#c48b8b] rounded-full" />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
