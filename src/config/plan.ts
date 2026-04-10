import { Plan } from '@/types';

/**
 * PLANES:
 *
 * "individual" (actual) — 1 estilista, 1 ubicación
 *   - Landing con perfil de UNA estilista (About = "Sobre Mí")
 *   - Booking directo: fecha → hora → servicios → datos cliente → confirmar
 *   - Admin: 1 solo dashboard, sin filtro por estilista
 *   - Delivery: la estilista va a la clienta
 *
 * "local" — varias estilistas, 1 ubicación
 *   - Landing muestra el equipo (About = "Nuestro Equipo")
 *   - Booking agrega paso: seleccionar estilista ANTES de fecha/hora
 *   - Cada estilista tiene su propia disponibilidad
 *   - Admin: filtrar citas por estilista
 *   - Delivery: se asigna a la estilista seleccionada
 *
 * "multi" — varias estilistas, varias sucursales
 *   - Todo lo de "local" +
 *   - Booking agrega paso: seleccionar sucursal ANTES de estilista
 *   - Cada sucursal tiene sus estilistas y disponibilidad
 *   - Admin: filtrar por sucursal y por estilista
 *   - Landing puede mostrar las sucursales en el mapa
 */

const validPlans: Plan[] = ['individual', 'local', 'multi'];

const envPlan = process.env.NEXT_PUBLIC_PLAN as Plan | undefined;

export const PLAN: Plan = envPlan && validPlans.includes(envPlan) ? envPlan : 'individual';

/** Plan "local" o "multi" — tiene múltiples estilistas */
export const hasMultipleBarbers = PLAN !== 'individual';

/** Plan "multi" — tiene múltiples sucursales */
export const hasMultipleBranches = PLAN === 'multi';
