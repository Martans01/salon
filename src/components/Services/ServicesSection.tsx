'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { SERVICES } from '@/utils/constants';
import { hasMultipleBarbers } from '@/config/plan';
import { useRef, useState, useCallback } from 'react';

function ServiceCard({ service, index }: { service: typeof SERVICES[number]; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });
  const [spotlight, setSpotlight] = useState({ x: 50, y: 50 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setTilt({
      rotateY: (x - 0.5) * 8,
      rotateX: (0.5 - y) * 8,
    });
    setSpotlight({ x: x * 100, y: y * 100 });
  }, []);

  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => {
    setIsHovering(false);
    setTilt({ rotateX: 0, rotateY: 0 });
  };

  const isPopular = service.id === 'corte';

  const getServiceIcon = (serviceId: string) => {
    switch (serviceId) {
      case 'corte':
        return (
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="6" cy="6" r="3"/>
            <path d="M8.12 8.12L12 12"/>
            <path d="M20 4L8.12 15.88"/>
            <circle cx="6" cy="18" r="3"/>
            <path d="M14.8 14.8L20 20"/>
          </svg>
        );
      case 'tinte':
        return (
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2"/>
            <path d="M12 2v10l8.5 5"/>
            <path d="M12 12L3.5 17"/>
          </svg>
        );
      case 'manicure':
        return (
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M7 11.5V14a5 5 0 0010 0v-2.5"/>
            <path d="M12 2v4"/>
            <path d="M8 4l1 3"/>
            <path d="M16 4l-1 3"/>
            <path d="M5 7h14"/>
          </svg>
        );
      case 'alisado':
        return (
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
          </svg>
        );
      case 'maquillaje':
        return (
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 3c-1.5 0-3 .5-4 1.5C7 5.5 6 7.5 6 10c0 4 3 8 6 11 3-3 6-7 6-11 0-2.5-1-4.5-2-5.5-1-1-2.5-1.5-4-1.5z"/>
          </svg>
        );
      case 'cejas':
        return (
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        );
      default:
        return (
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        );
    }
  };

  return (
    <motion.div
      ref={cardRef}
      className={`service-card bg-white rounded-2xl p-8 sm:p-10 text-center border transition-all duration-300 group relative shadow-sm hover:shadow-md ${
        isPopular
          ? 'border-[#c48b8b]/40 shadow-md'
          : 'border-[#c48b8b]/10 hover:border-[#c48b8b]/30'
      }`}
      style={{
        perspective: '1000px',
        transformStyle: 'preserve-3d',
      }}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      animate={{
        rotateX: tilt.rotateX,
        rotateY: tilt.rotateY,
      }}
    >
      {/* Spotlight overlay — desktop only */}
      {isHovering && (
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none hidden md:block"
          style={{
            background: `radial-gradient(circle at ${spotlight.x}% ${spotlight.y}%, rgba(196,139,139,0.06) 0%, transparent 60%)`,
          }}
        />
      )}

      {isPopular && (
        <div className="popular-badge glow-badge absolute -top-3 left-1/2 transform -translate-x-1/2 bg-[#c48b8b] text-white text-xs font-medium px-4 py-1 rounded-full tracking-wider">
          POPULAR
        </div>
      )}

      <div className="service-icon text-[#c48b8b] mb-6 flex justify-center">
        {getServiceIcon(service.id)}
      </div>

      <h3 className="service-name text-lg font-semibold text-[#3d2c33] mb-3 tracking-wider group-hover:text-[#c48b8b] transition-colors">
        {service.name}
      </h3>
      <p className="service-description text-[#5a4249]/60 mb-6 leading-relaxed text-sm">
        {service.description}
      </p>
      <Link
        href="/reservar"
        className="border border-[#c48b8b]/40 text-[#c48b8b] hover:bg-[#c48b8b] hover:text-white px-6 py-2.5 rounded-full font-medium text-sm tracking-wider transition-all duration-300 inline-block"
      >
        RESERVAR
      </Link>
    </motion.div>
  );
}

export default function ServicesSection() {
  return (
    <section id="services" className="services-section py-24 bg-[#fdf8f5]">
      <div className="services-container max-w-7xl mx-auto px-6">
        <motion.div
          className="services-header text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <span className="text-[#c48b8b] text-sm tracking-[0.2em] uppercase mb-3 block">Lo que ofrecemos</span>
          <h2 className="font-playfair text-4xl md:text-5xl font-normal text-[#3d2c33] mb-4 italic">
            {hasMultipleBarbers ? 'Nuestros Servicios' : 'Mis Servicios'}
          </h2>
          <p className="text-[#5a4249]/60 max-w-2xl mx-auto">
            Servicios profesionales con atención personalizada
          </p>
          <motion.div
            className="w-16 h-px bg-gradient-to-r from-transparent via-[#c48b8b] to-transparent mx-auto mt-4"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          />
        </motion.div>

        <div className="services-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {SERVICES.map((service, index) => (
            <ServiceCard key={service.id} service={service} index={index} />
          ))}
        </div>

        <motion.div
          className="services-cta text-center mt-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <h3 className="font-playfair text-2xl font-normal text-[#3d2c33] mb-4 italic">
            ¿Lista para renovar tu look?
          </h3>
          <p className="text-[#5a4249]/60 mb-8 max-w-xl mx-auto">
            Agenda tu cita ahora y vive la mejor experiencia de belleza
          </p>
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="inline-block"
          >
            <Link
              href="/reservar"
              className="glow-button bg-[#c48b8b] hover:bg-[#b07878] text-white px-10 py-4 rounded-full font-medium text-sm inline-flex items-center gap-3 mx-auto transition-colors duration-300 tracking-wider uppercase"
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
        </motion.div>
      </div>
    </section>
  );
}
