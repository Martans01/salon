'use client';

import BackgroundCarousel from './BackgroundCarousel';
import HeroContent from './HeroContent';

export default function HeroSection() {
  const handleLocationClick = () => {
    window.open('https://www.google.com/maps', '_blank');
  };

  return (
    <section
      id="home"
      className="hero min-h-screen flex items-center justify-center relative bg-[#fdf8f5] overflow-hidden"
    >
      <BackgroundCarousel />
      <HeroContent onLocationClick={handleLocationClick} />
    </section>
  );
}
