import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";


const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Belle Studio - Salón de Belleza",
  description: "Salón de belleza profesional. Cortes, coloración, manicure, tratamientos y más. Agenda tu cita en línea.",
  keywords: ["salón de belleza", "beauty salon", "cortes", "coloración", "manicure", "pedicure", "citas online"],
  authors: [{ name: "Belle Studio" }],
  creator: "Belle Studio",
  publisher: "Belle Studio",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://example.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Belle Studio - Tu Barbería de Confianza",
    description: "Barbería profesional. Cortes modernos y clásicos con atención personalizada.",
    url: "https://example.com",
    siteName: "Belle Studio",
    locale: "es",
    type: "website",
    images: [
      {
        url: "/images/logos/icon-512.png",
        width: 512,
        height: 512,
        alt: "Belle Studio Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Belle Studio - Tu Barbería de Confianza",
    description: "Barbería profesional. Cortes modernos y clásicos con atención personalizada.",
    images: ["/images/logos/icon-512.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "google-site-verification-code-here",
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48", type: "image/x-icon" },
      { url: "/images/logos/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/images/logos/icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/images/logos/apple-touch-icon.png", sizes: "180x180", type: "image/png" }
    ],
    other: [
      {
        rel: "mask-icon",
        url: "/images/logos/icon-512.png",
        color: "#000000"
      }
    ]
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Belle Studio",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        {/* Favicon configurations for cross-browser compatibility */}
        <link rel="icon" href="/favicon.ico" sizes="16x16 32x32 48x48" type="image/x-icon" />
        <link rel="icon" href="/images/logos/icon-192.png" sizes="192x192" type="image/png" />
        <link rel="icon" href="/images/logos/icon-512.png" sizes="512x512" type="image/png" />
        
        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/images/logos/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/images/logos/apple-touch-icon.png" />
        
        {/* Safari Pinned Tab */}
        <link rel="mask-icon" href="/images/logos/icon-512.png" color="#000000" />
        
        {/* PWA and mobile configurations */}
        <meta name="theme-color" content="#000000" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-TileImage" content="/images/logos/icon-192.png" />
        
      </head>
      <body className={`${inter.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
