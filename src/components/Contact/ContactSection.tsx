'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { BUSINESS_INFO } from '@/utils/constants';
import { hasMultipleBarbers, hasMultipleBranches } from '@/config/plan';
import type { Branch } from '@/types';

const contactItems = [
  {
    id: 'location',
    title: 'UBICACIÓN',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-pink-500 flex-shrink-0">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    ),
    getValue: () => BUSINESS_INFO.location,
    buttonText: 'VER EN MAPS',
    action: () => {
      window.open('https://www.google.com/maps', '_blank');
    },
  },
  {
    id: 'phone',
    title: 'TELÉFONO',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-pink-500 flex-shrink-0">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
      </svg>
    ),
    getValue: () => BUSINESS_INFO.phone,
    buttonText: 'LLAMAR',
    action: () => window.open(`tel:${BUSINESS_INFO.phone}`, '_self'),
    secondaryButtonText: 'WHATSAPP',
    secondaryAction: () => {
      const phoneClean = BUSINESS_INFO.phone.replace(/[^0-9]/g, '');
      window.open(`https://wa.me/${phoneClean}`, '_blank');
    },
    secondaryIcon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    ),
  },
  {
    id: 'instagram',
    title: 'INSTAGRAM',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-pink-500 flex-shrink-0">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ),
    getValue: () => BUSINESS_INFO.instagram,
    buttonText: 'SEGUIR',
    action: () => window.open(`https://instagram.com/${BUSINESS_INFO.instagram.replace('@', '')}`, '_blank'),
  },
];

function BranchesGrid() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/branches')
      .then(r => r.json())
      .then(data => setBranches(Array.isArray(data) ? data : []))
      .catch(() => setBranches([]))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1, 2].map(i => (
          <div key={i} className="glass-card rounded-xl p-6 animate-pulse">
            <div className="h-5 bg-zinc-800 rounded mb-3 w-2/3" />
            <div className="h-4 bg-zinc-800 rounded mb-2 w-full" />
            <div className="h-4 bg-zinc-800 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (branches.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {branches.map((branch, index) => (
        <motion.div
          key={branch.id}
          className="glass-card rounded-xl p-5 contact-card-hover"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-pink-500">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold text-lg mb-1">{branch.name}</h3>
              {branch.address && (
                <p className="text-gray-400 text-sm mb-3">{branch.address}</p>
              )}
              {branch.phone && (
                <p className="text-gray-500 text-xs mb-3">{branch.phone}</p>
              )}
              <div className="flex flex-wrap gap-2">
                {branch.lat && branch.lng && (
                  <motion.button
                    onClick={() => window.open(`https://www.google.com/maps?q=${branch.lat},${branch.lng}`, '_blank')}
                    className="text-xs font-semibold px-3 py-1.5 rounded-md border border-pink-500/50 text-pink-500 hover:bg-pink-500 hover:text-white transition-all duration-300"
                    whileTap={{ scale: 0.95 }}
                  >
                    VER EN MAPS
                  </motion.button>
                )}
                {branch.phone && (
                  <motion.button
                    onClick={() => {
                      const phoneClean = branch.phone!.replace(/[^0-9]/g, '');
                      window.open(`https://wa.me/${phoneClean}`, '_blank');
                    }}
                    className="text-xs font-semibold px-3 py-1.5 rounded-md border border-green-500/50 text-green-500 hover:bg-green-500 hover:text-white transition-all duration-300 flex items-center gap-1.5"
                    whileTap={{ scale: 0.95 }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    WHATSAPP
                  </motion.button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export default function ContactSection() {
  return (
    <section id="contact" className="contact-section py-20 relative overflow-hidden" style={{ background: 'radial-gradient(ellipse at center, #18181b 0%, #000000 70%)' }}>
      <div className="contact-container max-w-7xl mx-auto px-6">
        <motion.div
          className="contact-header text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {hasMultipleBarbers ? 'CONTÁCTANOS' : 'CONTÁCTAME'}
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            {hasMultipleBranches
              ? 'Atención con cita previa. Visítanos en cualquiera de nuestras sucursales'
              : 'Atención con cita previa. Visítanos en nuestra ubicación'}
          </p>
          <motion.div
            className="w-16 h-1 bg-pink-500 mx-auto mt-4"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          />
        </motion.div>

        {/* Branches grid for multi plan */}
        {hasMultipleBranches && (
          <div className="mb-12">
            <h3 className="text-xl font-semibold text-white mb-6 text-center">NUESTRAS SUCURSALES</h3>
            <BranchesGrid />
          </div>
        )}

        <div className="contact-content grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Contact info cards — compact horizontal layout */}
          <div className="contact-info lg:col-span-5 space-y-4 order-2 lg:order-1">
            {contactItems.filter(item => !(hasMultipleBranches && item.id === 'location')).map((item, index) => (
              <motion.div
                key={item.id}
                className="glass-card rounded-xl p-4 contact-card-hover cursor-default"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -4, boxShadow: '0 8px 30px rgba(236,72,153,0.15)' }}
              >
                <div className="flex items-start gap-4">
                  <motion.div
                    className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center flex-shrink-0 mt-0.5"
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ type: 'spring', stiffness: 300, delay: 0.2 + index * 0.1 }}
                  >
                    {item.icon}
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-400 tracking-wider mb-1">{item.title}</h3>
                    <p className="text-white text-sm mb-3 truncate">{item.getValue()}</p>
                    <div className="flex flex-wrap gap-2">
                      <motion.button
                        onClick={item.action}
                        className="text-xs font-semibold px-3 py-1.5 rounded-md border border-pink-500/50 text-pink-500 hover:bg-pink-500 hover:text-white transition-all duration-300"
                        whileTap={{ scale: 0.95 }}
                      >
                        {item.buttonText}
                      </motion.button>
                      {item.secondaryButtonText && item.secondaryAction && (
                        <motion.button
                          onClick={item.secondaryAction}
                          className="text-xs font-semibold px-3 py-1.5 rounded-md border border-green-500/50 text-green-500 hover:bg-green-500 hover:text-white transition-all duration-300 flex items-center gap-1.5"
                          whileTap={{ scale: 0.95 }}
                        >
                          {item.secondaryIcon}
                          {item.secondaryButtonText}
                        </motion.button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Booking CTA — the visual hero */}
          <motion.div
            className="lg:col-span-7 order-1 lg:order-2 gradient-border rounded-2xl relative overflow-hidden"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.15 }}
          >
            {/* Subtle background pattern */}
            <div className="absolute inset-0 opacity-[0.03]" style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(236,72,153,0.5) 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }} />

            <div className="relative bg-gradient-to-br from-zinc-900/95 via-zinc-900/90 to-zinc-950/95 p-8 sm:p-10 lg:p-12">
              {/* Animated accent line */}
              <motion.div
                className="absolute top-0 left-8 right-8 h-px"
                style={{ background: 'linear-gradient(90deg, transparent, #ec4899, transparent)' }}
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.5 }}
              />

              <div className="text-center">
                {/* Calendar icon */}
                <motion.div
                  className="w-16 h-16 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center mx-auto mb-6"
                  initial={{ scale: 0, rotate: -10 }}
                  whileInView={{ scale: 1, rotate: 0 }}
                  viewport={{ once: true }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.3 }}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-pink-500">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                    <circle cx="12" cy="16" r="1.5" fill="currentColor" stroke="none"/>
                  </svg>
                </motion.div>

                <h3 className="text-3xl sm:text-4xl font-bold text-white mb-3">
                  ¿Listo para <span className="text-gradient">agendar</span>?
                </h3>
                <p className="text-gray-400 mb-8 text-base sm:text-lg max-w-md mx-auto leading-relaxed">
                  Agenda tu cita de forma rápida y sencilla.
                  Selecciona fecha, hora y servicios en solo unos pasos.
                </p>

                <motion.div
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  <Link
                    href="/reservar"
                    className="glow-button bg-pink-500 hover:bg-pink-600 text-white inline-flex items-center justify-center gap-3 px-10 py-4 rounded-xl font-bold text-lg transition-colors duration-300"
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    AGENDAR CITA
                  </Link>
                </motion.div>

              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
