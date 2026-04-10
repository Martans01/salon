import { BusinessInfo, Service, BackgroundImage, NavLink, Belle Studiofile } from '@/types';

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
export const BARBER_PROFILE: Belle Studiofile = {
  name: 'Isabella Morales',
  title: '',
  bio: 'Estilista profesional con años de experiencia en coloración, cortes de tendencia y cuidado capilar. Mi pasión es realzar la belleza natural de cada clienta, combinando técnicas innovadoras con un trato personalizado para que siempre salgas sintiéndote increíble.',
  yearsOfExperience: 8,
  imageSrc: '/images/cortes/about.jpg',
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
  { src: '/images/cortes/corte.jpg', alt: 'Corte y peinado profesional' },
  { src: '/images/cortes/corte2.jpg', alt: 'Coloración y mechas' },
  { src: '/images/cortes/corte3.jpg', alt: 'Estilo elegante' },
  { src: '/images/cortes/corte4.jpg', alt: 'Tratamiento capilar' },
  { src: '/images/cortes/corte5.jpg', alt: 'Manicure artístico' },
  { src: '/images/cortes/corte6.jpg', alt: 'Peinado de evento' },
  { src: '/images/cortes/corte7.jpg', alt: 'Look vanguardista' },
  { src: '/images/cortes/corte8.jpg', alt: 'Transformación completa' }
];

// Colors
export const COLORS = {
  primary: '#ec4899', // Pink
  background: '#000000', // Black
  text: '#ffffff', // White
  textSecondary: '#cccccc', // Light gray
  cardBackground: '#2a2a2a' // Dark gray
} as const;
