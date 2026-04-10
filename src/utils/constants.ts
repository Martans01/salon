import { BusinessInfo, Service, BackgroundImage, NavLink, StylistProfile } from '@/types';

// Business information
export const BUSINESS_INFO: BusinessInfo = {
  name: 'Belle Studio',
  location: 'Tu Ciudad, Tu País',
  phone: '+1 (555) 987-6543',
  instagram: '@bellestudio_demo',
  hours: 'Reserva tu cita con nosotros'
};

// Services offered
export const SERVICES: Service[] = [
  {
    id: 'corte',
    name: 'CORTE Y PEINADO',
    description: 'Cortes modernos, capas, bobs y peinados personalizados para cada ocasión',
    featured: true
  },
  {
    id: 'tinte',
    name: 'COLORACIÓN',
    description: 'Tintes, mechas, balayage y técnicas de color para transformar tu look'
  },
  {
    id: 'manicure',
    name: 'MANICURE & PEDICURE',
    description: 'Uñas acrílicas, gel, diseño artístico y cuidado profesional de manos y pies'
  },
  {
    id: 'alisado',
    name: 'ALISADO & TRATAMIENTO',
    description: 'Keratina, botox capilar y tratamientos de hidratación profunda'
  },
  {
    id: 'maquillaje',
    name: 'MAQUILLAJE',
    description: 'Maquillaje profesional para eventos, bodas y sesiones fotográficas'
  },
  {
    id: 'cejas',
    name: 'CEJAS & PESTAÑAS',
    description: 'Diseño de cejas, laminado, extensiones de pestañas y lifting'
  }
];

// Stylist profile
export const BARBER_PROFILE: StylistProfile = {
  name: 'Isabella Morales',
  title: '',
  bio: 'Estilista profesional con años de experiencia en coloración, cortes de tendencia y cuidado capilar. Mi pasión es realzar la belleza natural de cada clienta, combinando técnicas innovadoras con un trato personalizado para que siempre salgas sintiéndote increíble.',
  yearsOfExperience: 8,
  imageSrc: '/images/cortes/about-salon.jpg',
  imageAlt: 'Isabella - Estilista Profesional',
};

// Navigation links
export const NAV_LINKS: NavLink[] = [
  { href: '#home', label: 'Inicio' },
  { href: '#about', label: 'Sobre Mí' },
  { href: '#services', label: 'Servicios' },
  { href: '#gallery', label: 'Galería' }
];

// Background carousel images
export const BACKGROUND_IMAGES: BackgroundImage[] = [
  { src: '/images/cortes/salon1.jpg', alt: 'Salón de belleza profesional' },
  { src: '/images/cortes/salon2.jpg', alt: 'Estilismo y coloración' },
  { src: '/images/cortes/salon3.jpg', alt: 'Belleza y estilo' },
  { src: '/images/cortes/salon4.jpg', alt: 'Peinados elegantes' },
  { src: '/images/cortes/salon5.jpg', alt: 'Cuidado capilar' },
  { src: '/images/cortes/salon6.jpg', alt: 'Spa y relajación' },
  { src: '/images/cortes/salon7.jpg', alt: 'Coloración profesional' },
  { src: '/images/cortes/salon8.jpg', alt: 'Transformación de look' }
];

// Colors
export const COLORS = {
  primary: '#c48b8b', // Soft rose
  background: '#fdf8f5', // Cream
  text: '#3d2c33', // Warm dark
  textSecondary: '#5a4249', // Warm gray
  cardBackground: '#ffffff' // White
} as const;
