'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { BUSINESS_INFO } from '@/utils/constants';

export default function Footer() {
  return (
    <motion.footer
      className="footer bg-zinc-900 py-16 relative"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      {/* Gradient orange separator */}
      <div className="section-divider absolute top-0 left-0 right-0" />

      <div className="container max-w-7xl mx-auto px-6">
        <div className="footer-content flex flex-col items-center gap-8">
          {/* Brand area */}
          <div className="footer-brand flex items-center group cursor-default">
            <Image
              src="/images/logos/logo.png"
              alt="Belle Studio Logo"
              width={56}
              height={56}
              className="footer-logo rounded-full mr-4 transition-shadow duration-300 group-hover:shadow-[0_0_20px_rgba(236,72,153,0.3)]"
            />
            <div>
              <h4 className="text-white font-bold text-xl">BARBERPRO</h4>
              <p className="text-gray-500 text-sm">{BUSINESS_INFO.location}</p>
            </div>
          </div>

          {/* Social link */}
          <div className="flex items-center gap-4">
            <motion.a
              href={`https://instagram.com/${BUSINESS_INFO.instagram.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full border border-zinc-700 hover:border-pink-500/50 flex items-center justify-center text-gray-400 hover:text-pink-500 transition-all duration-300"
              whileHover={{ y: -2, boxShadow: '0 4px 15px rgba(236,72,153,0.15)' }}
              whileTap={{ scale: 0.95 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </motion.a>
          </div>

          {/* Divider */}
          <div className="w-full max-w-xs section-divider" />

          {/* Credits */}
          <p className="text-gray-500 text-sm text-center">
            © {new Date().getFullYear()} Belle Studio · Powered by Belle Studio Template
          </p>
        </div>
      </div>
    </motion.footer>
  );
}
