'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useScrollEffect } from '@/hooks/useScrollEffect';
import { BUSINESS_INFO } from '@/utils/constants';
import { hasMultipleBarbers } from '@/config/plan';
import Image from 'next/image';

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isScrolled, scrollToSection } = useScrollEffect();

  const aboutLabel = hasMultipleBarbers ? 'Nuestro Equipo' : 'Sobre Mí';
  const servicesLabel = hasMultipleBarbers ? 'Servicios' : 'Mis Servicios';
  const galleryLabel = 'Galería';

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const handleLinkClick = (sectionId: string) => {
    scrollToSection(sectionId);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <motion.nav
        className={`navbar fixed top-0 left-0 right-0 z-[100] w-full transition-all duration-500 ${
          isScrolled
            ? 'bg-white/90 backdrop-blur-lg shadow-sm'
            : 'bg-transparent'
        }`}
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="nav-container max-w-7xl mx-auto px-4 sm:px-6 flex justify-between items-center h-20 w-full">
          <motion.div
            className="nav-brand flex items-center cursor-pointer"
            onClick={() => handleLinkClick('#home')}
            animate={{ scale: isScrolled ? 0.95 : 1 }}
            transition={{ duration: 0.3 }}
          >
            <Image
              src="/images/logos/logo.png"
              alt="Belle Studio Logo"
              width={44}
              height={44}
              className="brand-logo rounded-full"
            />
            <div className="brand-text ml-3">
              <h1 className="font-playfair text-xl font-normal text-[#3d2c33] leading-none italic">Belle</h1>
              <div className="brand-lines flex items-center gap-2">
                <span className="line w-3 h-px bg-[#c48b8b]"></span>
                <span className="brand-subtitle text-[10px] text-[#c48b8b] font-medium tracking-[0.15em] uppercase">Studio</span>
                <span className="line w-3 h-px bg-[#c48b8b]"></span>
              </div>
            </div>
          </motion.div>

          <div className="nav-menu hidden md:flex items-center space-x-8">
            {[
              { id: '#home', label: 'Inicio' },
              { id: '#about', label: aboutLabel },
              { id: '#services', label: servicesLabel },
              { id: '#gallery', label: galleryLabel },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => handleLinkClick(item.id)}
                className="nav-link nav-link-premium text-[#3d2c33]/70 hover:text-[#c48b8b] transition-colors duration-300 font-light text-sm tracking-wider uppercase"
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="nav-social hidden md:flex items-center space-x-4">
            <a
              href={`https://instagram.com/${BUSINESS_INFO.instagram.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="social-link instagram text-[#3d2c33]/40 hover:text-[#c48b8b] transition-colors duration-300"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
            <Link
              href="/reservar"
              className="bg-[#c48b8b] hover:bg-[#b07878] text-white px-5 py-2 rounded-full font-medium text-xs tracking-wider uppercase transition-colors duration-300"
            >
              Agendar Cita
            </Link>
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="mobile-menu-toggle md:hidden flex flex-col justify-center items-center w-8 h-8 space-y-1.5"
          >
            <motion.span
              className="block w-6 h-px bg-[#3d2c33] transition-all"
              animate={{
                rotate: isMobileMenuOpen ? 45 : 0,
                y: isMobileMenuOpen ? 6 : 0
              }}
            />
            <motion.span
              className="block w-6 h-px bg-[#3d2c33] transition-all"
              animate={{
                opacity: isMobileMenuOpen ? 0 : 1
              }}
            />
            <motion.span
              className="block w-6 h-px bg-[#3d2c33] transition-all"
              animate={{
                rotate: isMobileMenuOpen ? -45 : 0,
                y: isMobileMenuOpen ? -6 : 0
              }}
            />
          </button>
        </div>
      </motion.nav>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="mobile-menu fixed inset-0 z-[90] bg-[#fdf8f5]/98 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mobile-menu-content flex flex-col items-center justify-center min-h-screen space-y-8">
              {[
                { id: '#home', label: 'Inicio', delay: 0.1 },
                { id: '#about', label: aboutLabel, delay: 0.15 },
                { id: '#services', label: servicesLabel, delay: 0.2 },
                { id: '#gallery', label: galleryLabel, delay: 0.3 },
              ].map((item) => (
                <motion.button
                  key={item.id}
                  onClick={() => handleLinkClick(item.id)}
                  className="mobile-nav-link text-[#3d2c33]/70 text-xl font-light tracking-wider uppercase hover:text-[#c48b8b] transition-colors"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: item.delay }}
                >
                  {item.label}
                </motion.button>
              ))}
              <motion.div
                className="w-12 h-px bg-gradient-to-r from-transparent via-[#c48b8b] to-transparent"
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ delay: 0.35 }}
              />
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <Link
                  href="/reservar"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="glow-button bg-[#c48b8b] hover:bg-[#b07878] text-white px-10 py-4 rounded-full font-medium text-sm tracking-wider uppercase transition-colors inline-block"
                >
                  Agendar Cita
                </Link>
              </motion.div>
              <motion.div
                className="mobile-contact-info text-center text-[#5a4249]/40 space-y-2"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <p className="text-xs tracking-wider">{BUSINESS_INFO.location}</p>
                <p className="text-xs tracking-wider">{BUSINESS_INFO.phone}</p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
