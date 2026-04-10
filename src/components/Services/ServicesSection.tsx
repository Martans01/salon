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
      rotateY: (x - 0.5) * 12,
      rotateX: (0.5 - y) * 12,
    });
    setSpotlight({ x: x * 100, y: y * 100 });
  }, []);

  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => {
    setIsHovering(false);
    setTilt({ rotateX: 0, rotateY: 0 });
  };

  const isPopular = service.id === 'corte-clasico';

  const getServiceIcon = (serviceId: string) => {
    switch (serviceId) {
      case 'barba':
        return (
          <svg width="40" height="40" viewBox="0 0 122.88 87.57" fill="currentColor">
            <path d="M25.29,38.29c-0.77,1.82-1.36,3.71-1.79,5.66C8.06,25.12,9.91,29.85,8.21,5.56L0,0 c0.28,32.54,3.89,81.46,47.72,87.32c3.66,0.49,8.32,0.25,13.92-0.68c28.17,7.05,57.66-28.25,59.99-53.17 c1.11-11.11,1.58-22.23,1.01-33.34l-7.96,5.68c-1.46,23.72-0.12,19.13-14.78,37.89c-4.44-17.59-34.45-23.75-38.09-17.15 C55.97,18.96,29.19,29.09,25.29,38.29L25.29,38.29z M36.85,49.91c0.58-3.92,2.29-6.46,3.95-8.89c3.21-4.69,5.24-4.38,9.92-3.65 c8.36,1.31,16.67,1.04,24.91-0.75c5.38-0.08,10.9,9.34,10.35,13.71c-0.52,4.12-8.42,9.05-12.64,9.02 c-3.77-0.02-7.74-2.05-11.91-6.15C52.99,61.87,44.34,60.92,36.85,49.91L36.85,49.91z"/>
          </svg>
        );
      case 'corte-clasico':
        return (
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="6" cy="6" r="3"/>
            <path d="M8.12 8.12L12 12"/>
            <path d="M20 4L8.12 15.88"/>
            <circle cx="6" cy="18" r="3"/>
            <path d="M14.8 14.8L20 20"/>
          </svg>
        );
      case 'cejas':
        return (
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        );
      default:
        return (
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="6" cy="6" r="3"/>
            <path d="M8.12 8.12L12 12"/>
            <path d="M20 4L8.12 15.88"/>
            <circle cx="6" cy="18" r="3"/>
            <path d="M14.8 14.8L20 20"/>
          </svg>
        );
    }
  };

  const getServiceDescription = (serviceId: string) => {
    switch (serviceId) {
      case 'barba':
        return 'Recorte y arreglo profesional de barba con técnicas modernas';
      case 'corte-clasico':
        return 'Cortes modernos, clásicos y personalizados según tu estilo';
      case 'cejas':
        return 'Perfilado y arreglo de cejas para complementar tu look';
      default:
        return `Servicio profesional de ${service.name.toLowerCase()} con técnicas modernas y atención personalizada`;
    }
  };

  return (
    <motion.div
      ref={cardRef}
      className={`service-card bg-gradient-to-b from-zinc-800 to-zinc-900 rounded-2xl p-8 sm:p-10 text-center border transition-all duration-300 group relative ${
        isPopular
          ? 'border-pink-500 shadow-lg shadow-pink-500/10'
          : 'border-zinc-700/50 hover:border-pink-500/70'
      }`}
      style={{
        perspective: '1000px',
        transformStyle: 'preserve-3d',
      }}
      initial={{ opacity: 0, x: -30 }}
      whileInView={{ opacity: 1, x: 0 }}
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
            background: `radial-gradient(circle at ${spotlight.x}% ${spotlight.y}%, rgba(236,72,153,0.08) 0%, transparent 60%)`,
          }}
        />
      )}

      {isPopular && (
        <div className="popular-badge glow-badge absolute -top-3 left-1/2 transform -translate-x-1/2 bg-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full">
          MÁS POPULAR
        </div>
      )}

      <div className="service-icon text-pink-500 mb-6 flex justify-center">
        {getServiceIcon(service.id)}
      </div>

      <h3 className="service-name text-2xl font-bold text-white mb-4 group-hover:text-pink-500 transition-colors">
        {service.name.toUpperCase()}
      </h3>
      <p className="service-description text-gray-300 mb-6 leading-relaxed">
        {getServiceDescription(service.id)}
      </p>
      <Link
        href="/reservar"
        className="btn-secondary border-2 border-pink-500 text-pink-500 hover:bg-pink-500 hover:text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 group-hover:scale-105 inline-block"
      >
        RESERVAR
      </Link>
    </motion.div>
  );
}

export default function ServicesSection() {
  return (
    <section id="services" className="services-section py-20 bg-zinc-900">
      <div className="services-container max-w-7xl mx-auto px-6">
        <motion.div
          className="services-header text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {hasMultipleBarbers ? 'NUESTROS SERVICIOS' : 'MIS SERVICIOS'}
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Servicios profesionales con atención personalizada
          </p>
          <motion.div
            className="w-16 h-1 bg-pink-500 mx-auto mt-4"
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
          className="services-cta text-center mt-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <h3 className="text-2xl font-bold text-white mb-4">
            ¿Listo para tu próximo corte?
          </h3>
          <p className="text-gray-300 mb-8 max-w-xl mx-auto">
            Agenda tu cita ahora y disfruta de la mejor experiencia en barbería
          </p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-block"
          >
            <Link
              href="/reservar"
              className="glow-button bg-pink-500 hover:bg-pink-600 text-white px-8 py-4 rounded-lg font-semibold text-lg inline-flex items-center gap-3 mx-auto transition-colors duration-300"
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
        </motion.div>
      </div>
    </section>
  );
}
