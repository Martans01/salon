// Plan types
export type Plan = 'individual' | 'local' | 'multi';

// Business information types
export interface BusinessInfo {
  name: string;
  location: string;
  phone: string;
  instagram: string;
  hours: string;
}

// Service types
export interface Service {
  id: string;
  name: string;
  description: string;
  price?: string;
  featured?: boolean;
}

// Appointment types
export interface AppointmentRequest {
  services: string[];
  preferredDate: string;
}

// Navigation types
export interface NavLink {
  href: string;
  label: string;
}

// Barber profile type (used by individual plan from constants)
export interface Belle Studiofile {
  name: string;
  title: string;
  bio: string;
  yearsOfExperience: number;
  imageSrc: string;
  imageAlt: string;
}

// Branch type (used by multi plan from database)
export interface Branch {
  id: string;
  name: string;
  slug: string;
  address?: string;
  phone?: string;
  lat?: number;
  lng?: number;
  image_url?: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

// Barber type (used by local/multi plans from database)
export interface Barber {
  id: string;
  name: string;
  title?: string;
  bio?: string;
  image_url?: string;
  phone?: string;
  instagram?: string;
  years_of_experience: number;
  is_active: boolean;
  display_order: number;
  commission_percent: number;
  branch_id?: string;
  branch?: Branch;
  created_at: string;
}

// Background carousel types
export interface BackgroundImage {
  src: string;
  alt: string;
}

// Booking system types
export type AppointmentStatus = 'pendiente' | 'confirmada' | 'cancelada' | 'completada';
export type PaymentMethod = 'efectivo' | 'yappy';

export interface AdminSettings {
  id: string;
  slot_duration_minutes: number;
  advance_booking_days: number;
  created_at: string;
  updated_at: string;
}

export interface Availability {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
  barber_id?: string;
  branch_id?: string;
  created_at: string;
}

export interface TimeSlot {
  id: string;
  availability_id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
  barber_id?: string;
  branch_id?: string;
}

export interface DeliveryLocation {
  lat: number;
  lng: number;
  description: string;
}

export interface Appointment {
  id: string;
  time_slot_id: string;
  client_name: string;
  client_phone: string;
  services: string[];
  status: AppointmentStatus;
  notes?: string;
  payment_amount?: number;
  payment_method?: PaymentMethod;
  paid_at?: string;
  created_at: string;
  updated_at: string;
  appointment_type: 'en_tienda' | 'delivery';
  delivery_location?: DeliveryLocation;
  barber_id?: string;
  branch_id?: string;
  // Joined fields
  time_slot?: TimeSlot;
  barber?: Barber;
  branch?: Branch;
}

export interface BookingRequest {
  time_slot_id: string;
  client_name: string;
  client_phone: string;
  services: string[];
  barber_id?: string;
  branch_id?: string;
}

export interface DeliveryBookingRequest {
  time_slot_id: string;
  client_name: string;
  client_phone: string;
  services: string[];
  delivery_location: DeliveryLocation;
  barber_id?: string;
  branch_id?: string;
}

export interface BookingConfirmation {
  appointment_id: string;
  client_name: string;
  client_phone: string;
  services: string[];
  date: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  appointment_type?: 'en_tienda' | 'delivery';
  delivery_location?: DeliveryLocation;
  barber_id?: string;
  barber_name?: string;
  branch_id?: string;
  branch_name?: string;
}