import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ['image/webp', 'image/avif'],
  },
  experimental: {
    optimizePackageImports: ['framer-motion'],
  },
  // Remove Turbopack to avoid conflicts with PWA
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

// PWA Configuration
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  scope: '/',
  sw: 'sw.js',
  reloadOnOnline: false,
  fallbacks: {
    document: '/offline.html',
  },
  publicExcludes: ['!robots.txt', '!sitemap.xml', '!manifest.json'],
  buildExcludes: ['app-build-manifest.json'],
});

export default withPWA(nextConfig);