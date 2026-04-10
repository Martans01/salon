'use client';

import Navigation from '@/components/Navigation/Navigation';
import HeroSection from '@/components/Hero/HeroSection';
import AboutSection from '@/components/About/AboutSection';
import ServicesSection from '@/components/Services/ServicesSection';
import GallerySection from '@/components/Gallery/GallerySection';
import Footer from '@/components/Footer/Footer';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#fdf8f5]">
      <Navigation />
      <HeroSection />
      <AboutSection />
      <ServicesSection />
      <GallerySection />
      <Footer />
    </main>
  );
}
