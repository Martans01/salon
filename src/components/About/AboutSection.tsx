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
          <div key={i} className="bg-zinc-900 rounded-2xl p-6 animate-pulse">
            <div className="w-32 h-32 mx-auto rounded-full bg-zinc-800 mb-4" />
            <div className="h-5 bg-zinc-800 rounded mb-2 w-2/3 mx-auto" />
            <div className="h-4 bg-zinc-800 rounded w-1/2 mx-auto" />
          </div>
        ))}
      </div>
    );
  }

  if (barbers.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-500">Pronto presentaremos a nuestro equipo</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {barbers.map((barber, index) => (
        <motion.div
          key={barber.id}
          className="bg-gradient-to-b from-zinc-900 to-zinc-950 rounded-2xl p-6 border border-zinc-800 hover:border-pink-500/50 transition-colors"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
        >
          <div className="relative w-32 h-32 mx-auto rounded-full overflow-hidden ring-2 ring-pink-500/30 mb-4">
            {barber.image_url ? (
              <Image
                src={barber.image_url}
                alt={barber.name}
                fill
                className="object-cover"
                sizes="128px"
              />
            ) : (
              <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                <svg className="w-16 h-16 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
          </div>
          <h3 className="text-xl font-bold text-white text-center mb-1">{barber.name}</h3>
          {barber.title && (
            <p className="text-pink-500 text-sm text-center mb-1">{barber.title}</p>
          )}
          {hasMultipleBranches && barber.branch && (
            <p className="text-blue-400 text-xs text-center mb-2">{barber.branch.name}</p>
          )}
          {barber.bio && (
            <p className="text-gray-400 text-sm text-center line-clamp-3 mb-3">{barber.bio}</p>
          )}
          {barber.years_of_experience > 0 && (
            <p className="text-zinc-500 text-xs text-center">
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
      <section id="about" className="about-section py-20 bg-black">
        <div className="about-container max-w-7xl mx-auto px-6">
          <motion.div
            className="about-header text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              NUESTRO EQUIPO
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Profesionales apasionados listos para atenderte
            </p>
            <motion.div
              className="w-16 h-1 bg-pink-500 mx-auto mt-4"
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
    <section id="about" className="about-section py-20 bg-black">
      <div className="about-container max-w-7xl mx-auto px-6">
        <motion.div
          className="about-header text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            SOBRE EL BARBERO
          </h2>
          <motion.div
            className="w-16 h-1 bg-pink-500 mx-auto mt-4"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Portrait — clip-path reveal + hover zoom */}
          <motion.div
            className="relative aspect-[3/4] rounded-2xl overflow-hidden ring-2 ring-pink-500/30 ring-glow mx-auto max-w-md lg:max-w-none w-full group"
            initial={{ clipPath: 'inset(100% 0 0 0)' }}
            whileInView={{ clipPath: 'inset(0% 0 0 0)' }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <Image
              src={BARBER_PROFILE.imageSrc}
              alt={BARBER_PROFILE.imageAlt}
              fill
              className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </motion.div>

          {/* Bio */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h3 className="text-3xl md:text-4xl font-bold text-white">
              {BARBER_PROFILE.name}
            </h3>
            <p className="text-gray-300 text-lg leading-relaxed">
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
                <p className="text-4xl font-bold text-pink-500">
                  <AnimatedCounter target={BARBER_PROFILE.yearsOfExperience} suffix="+" />
                </p>
                <p className="text-gray-400 text-sm mt-1">Años de experiencia</p>
              </motion.div>

              {/* Animated divider line */}
              <motion.div
                className="w-px bg-zinc-700"
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
