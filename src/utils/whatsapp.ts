import { AppointmentRequest } from '@/types';
import { BUSINESS_INFO, SERVICES } from './constants';

/**
 * Generates a WhatsApp message for appointment booking
 */
export function generateWhatsAppMessage(appointment: AppointmentRequest): string {
  const serviceNames = appointment.services.map(serviceId => {
    const service = SERVICES.find(s => s.id === serviceId);
    return service?.name || serviceId;
  }).join(', ');

  const date = new Date(appointment.preferredDate);
  const dateText = date.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `Hola! Me gustaría agendar una cita en ${BUSINESS_INFO.name} para los siguientes servicios:

✂️ Servicios: ${serviceNames}
📅 Fecha preferida: ${dateText}

¡Gracias!`;
}

/**
 * Opens WhatsApp with the generated message
 */
export function openWhatsApp(message: string): void {
  const phoneNumber = BUSINESS_INFO.phone.replace(/[^0-9]/g, '');
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, '_blank');
}

/**
 * Direct WhatsApp integration for appointment booking
 */
export function bookAppointment(appointment: AppointmentRequest): void {
  const message = generateWhatsAppMessage(appointment);
  openWhatsApp(message);
}