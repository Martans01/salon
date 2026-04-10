'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { motion, useInView } from 'framer-motion';
import Link from 'next/link';

const galleryImages = [
  { src: '/images/cortes/salon1.jpg', alt: 'Salón de belleza', label: 'Ambiente' },
  { src: '/images/cortes/salon2.jpg', alt: 'Estilismo profesional', label: 'Estilismo' },
  { src: '/images/cortes/salon3.jpg', alt: 'Belleza y estilo', label: 'Belleza' },
  { src: '/images/cortes/salon4.jpg', alt: 'Peinados elegantes', label: 'Peinados' },
  { src: '/images/cortes/salon5.jpg', alt: 'Cuidado capilar', label: 'Cuidado' },
  { src: '/images/cortes/salon6.jpg', alt: 'Spa y relajación', label: 'Spa' },
  { src: '/images/cortes/salon7.jpg', alt: 'Coloración profesional', label: 'Color' },
  { src: '/images/cortes/salon8.jpg', alt: 'Transformación de look', label: 'Total Look' },
];

const row1 = galleryImages.slice(0, 4);
const row2 = galleryImages.slice(4, 8);

function MarqueeRow({ images, direction = 'left', speed = 30 }: { images: typeof galleryImages; direction?: 'left' | 'right'; speed?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  const tripled = [...images, ...images, ...images];

  return (
    <div
      className="overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div
        ref={containerRef}
        className="flex gap-4"
        style={{
          animation: `marquee-${direction} ${speed}s linear infinite`,
          animationPlayState: isPaused ? 'paused' : 'running',
          width: 'fit-content',
        }}
      >
        {tripled.map((img, i) => (
          <div
            key={`${img.src}-${i}`}
            className="relative flex-shrink-0 w-[280px] sm:w-[320px] md:w-[360px] aspect-[4/5] rounded-2xl overflow-hidden group cursor-pointer shadow-sm"
          >
            <Image
              src={img.src}
              alt={img.alt}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              sizes="(max-width: 640px) 280px, (max-width: 768px) 320px, 360px"
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#3d2c33]/70 via-[#3d2c33]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            {/* Label */}
            <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
              <span className="text-[#e0b4b7] text-xs font-medium uppercase tracking-[0.15em]">Estilo</span>
              <h3 className="text-white font-semibold text-lg">{img.label}</h3>
            </div>
            {/* Top corner on hover */}
            <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/0 group-hover:bg-white/20 transition-all duration-500 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <path d="M7 17L17 7M17 7H7M17 7v10"/>
              </svg>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function GallerySection() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  return (
    <section id="gallery" ref={sectionRef} className="py-24 relative overflow-hidden bg-white">
      {/* Subtle background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[#c48b8b]/3 rounded-full blur-[150px] pointer-events-none" />

      <div className="relative">
        {/* Header */}
        <motion.div
          className="text-center mb-12 px-6"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <motion.span
            className="inline-block text-[#c48b8b] text-sm tracking-[0.2em] uppercase mb-3"
            initial={{ opacity: 0, y: 10 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Nuestro trabajo
          </motion.span>
          <h2 className="font-playfair text-4xl md:text-5xl font-normal text-[#3d2c33] mb-4 italic">
            Galería de <span className="text-gradient">Estilos</span>
          </h2>
          <p className="text-[#5a4249]/60 max-w-2xl mx-auto">
            Cada servicio es una experiencia. Descubre lo que podemos hacer por ti.
          </p>
          <motion.div
            className="w-16 h-px bg-gradient-to-r from-transparent via-[#c48b8b] to-transparent mx-auto mt-4"
            initial={{ scaleX: 0 }}
            animate={isInView ? { scaleX: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
          />
        </motion.div>

        {/* Marquee rows */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 1, delay: 0.4 }}
        >
          <MarqueeRow images={row1} direction="left" speed={35} />
          <MarqueeRow images={row2} direction="right" speed={40} />
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          className="text-center mt-12 px-6"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <motion.div
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.03 }}
            transition={{ type: 'spring', stiffness: 400 }}
            className="inline-block"
          >
            <Link
              href="/reservar"
              className="glow-button bg-[#c48b8b] hover:bg-[#b07878] text-white inline-flex items-center justify-center gap-3 px-10 py-4 rounded-full font-medium text-sm tracking-wider uppercase transition-colors duration-300"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              Reservar Ahora
            </Link>
          </motion.div>
          <p className="text-[#5a4249]/40 text-sm mt-3">Agenda tu cita en menos de 1 minuto</p>
        </motion.div>
      </div>
    </section>
  );
}
