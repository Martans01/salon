import { Plan } from '@/types';

/**
 * PLANES:
 *
 * "individual" (actual) — 1 barbero, 1 ubicación
 *   - Landing con perfil de UN barbero (About = "Sobre Mí")
 *   - Booking directo: fecha → hora → servicios → datos cliente → confirmar
 *   - Admin: 1 solo dashboard, sin filtro por barbero
 *   - Delivery: el barbero va al cliente
 *
 * "local" — varios barberos, 1 ubicación
 *   - Landing muestra el equipo (About = "Nuestro Equipo")
 *   - Booking agrega paso: seleccionar barbero ANTES de fecha/hora
 *   - Cada barbero tiene su propia disponibilidad
 *   - Admin: filtrar citas por barbero
 *   - Delivery: se asigna al barbero seleccionado
 *
 * "multi" — varios barberos, varias sucursales
 *   - Todo lo de "local" +
 *   - Booking agrega paso: seleccionar sucursal ANTES de barbero
 *   - Cada sucursal tiene sus barberos y disponibilidad
 *   - Admin: filtrar por sucursal y por barbero
 *   - Landing puede mostrar las sucursales en el mapa
 */

const validPlans: Plan[] = ['individual', 'local', 'multi'];

const envPlan = process.env.NEXT_PUBLIC_PLAN as Plan | undefined;

export const PLAN: Plan = envPlan && validPlans.includes(envPlan) ? envPlan : 'individual';

/** Plan "local" o "multi" — tiene múltiples barberos */
export const hasMultipleBarbers = PLAN !== 'individual';

/** Plan "multi" — tiene múltiples sucursales */
export const hasMultipleBranches = PLAN === 'multi';
