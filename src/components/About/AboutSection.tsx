'use client';

import Image from 'next/image';
import { motion, useInView } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import { BARBER_PROFILE } from '@/utils/constants';
import { hasMultipleBarbers, hasMultipleBranches } from '@/config/plan';
import type { Barber } from '@/types';

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 1500;
    const stepTime = 30;
    const steps = duration / stepTime;
    const increment = target / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [isInView, target]);

  return (
    <span ref={ref}>
      {count}{suffix}
    </span>
  );
}

function TeamGrid() {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/barbers')
      .then(r => r.json())
      .then(data => setBarbers(Array.isArray(data) ? data : []))
      .catch(() => setBarbers([]))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-2xl p-6 animate-pulse shadow-sm">
            <div className="w-32 h-32 mx-auto rounded-full bg-[#f5ebe4] mb-4" />
            <div className="h-5 bg-[#f5ebe4] rounded mb-2 w-2/3 mx-auto" />
            <div className="h-4 bg-[#f5ebe4] rounded w-1/2 mx-auto" />
          </div>
        ))}
      </div>
    );
  }

  if (barbers.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[#5a4249]/50">Pronto presentaremos a nuestro equipo</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {barbers.map((barber, index) => (
        <motion.div
          key={barber.id}
          className="bg-white rounded-2xl p-6 border border-[#c48b8b]/10 hover:border-[#c48b8b]/30 transition-colors shadow-sm"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
        >
          <div className="relative w-32 h-32 mx-auto rounded-full overflow-hidden ring-2 ring-[#c48b8b]/20 mb-4">
            {barber.image_url ? (
              <Image
                src={barber.image_url}
                alt={barber.name}
                fill
                className="object-cover"
                sizes="128px"
              />
            ) : (
              <div className="w-full h-full bg-[#f5ebe4] flex items-center justify-center">
                <svg className="w-16 h-16 text-[#c48b8b]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
          </div>
          <h3 className="text-xl font-bold text-[#3d2c33] text-center mb-1">{barber.name}</h3>
          {barber.title && (
            <p className="text-[#c48b8b] text-sm text-center mb-1">{barber.title}</p>
          )}
          {hasMultipleBranches && barber.branch && (
            <p className="text-[#c48b8b]/70 text-xs text-center mb-2">{barber.branch.name}</p>
          )}
          {barber.bio && (
            <p className="text-[#5a4249]/60 text-sm text-center line-clamp-3 mb-3">{barber.bio}</p>
          )}
          {barber.years_of_experience > 0 && (
            <p className="text-[#5a4249]/40 text-xs text-center">
              {barber.years_of_experience}+ años de experiencia
            </p>
          )}
        </motion.div>
      ))}
    </div>
  );
}

export default function AboutSection() {
  if (hasMultipleBarbers) {
    return (
      <section id="about" className="about-section py-24 bg-white">
        <div className="about-container max-w-7xl mx-auto px-6">
          <motion.div
            className="about-header text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <span className="text-[#c48b8b] text-sm tracking-[0.2em] uppercase mb-3 block">Profesionales</span>
            <h2 className="font-playfair text-4xl md:text-5xl font-normal text-[#3d2c33] mb-4 italic">
              Nuestro Equipo
            </h2>
            <motion.div
              className="w-16 h-px bg-gradient-to-r from-transparent via-[#c48b8b] to-transparent mx-auto mt-4"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            />
          </motion.div>

          <TeamGrid />
        </div>
      </section>
    );
  }

  return (
    <section id="about" className="about-section py-24 bg-white">
      <div className="about-container max-w-7xl mx-auto px-6">
        <motion.div
          className="about-header text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <span className="text-[#c48b8b] text-sm tracking-[0.2em] uppercase mb-3 block">Conóceme</span>
          <h2 className="font-playfair text-4xl md:text-5xl font-normal text-[#3d2c33] mb-4 italic">
            Sobre la Estilista
          </h2>
          <motion.div
            className="w-16 h-px bg-gradient-to-r from-transparent via-[#c48b8b] to-transparent mx-auto mt-4"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Portrait */}
          <motion.div
            className="relative aspect-[3/4] rounded-3xl overflow-hidden shadow-xl mx-auto max-w-md lg:max-w-none w-full group"
            initial={{ clipPath: 'inset(100% 0 0 0)' }}
            whileInView={{ clipPath: 'inset(0% 0 0 0)' }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <Image
              src={BARBER_PROFILE.imageSrc}
              alt={BARBER_PROFILE.imageAlt}
              fill
              className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            {/* Subtle warm overlay on hover */}
            <div className="absolute inset-0 bg-[#c48b8b]/0 group-hover:bg-[#c48b8b]/5 transition-colors duration-500" />
          </motion.div>

          {/* Bio */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h3 className="font-playfair text-3xl md:text-4xl font-normal text-[#3d2c33] italic">
              {BARBER_PROFILE.name}
            </h3>
            <div className="w-12 h-px bg-[#c48b8b]" />
            <p className="text-[#5a4249]/70 text-lg leading-relaxed">
              {BARBER_PROFILE.bio}
            </p>

            {/* Stats */}
            <div className="flex items-center gap-8 pt-4">
              <motion.div
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <p className="font-playfair text-4xl font-normal text-[#c48b8b] italic">
                  <AnimatedCounter target={BARBER_PROFILE.yearsOfExperience} suffix="+" />
                </p>
                <p className="text-[#5a4249]/50 text-sm mt-1">Años de experiencia</p>
              </motion.div>

              <motion.div
                className="w-px bg-[#c48b8b]/20"
                initial={{ height: 0 }}
                whileInView={{ height: 64 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.5 }}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
