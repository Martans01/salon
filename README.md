# BarberPro - Barbershop Booking Template

Sistema de reservas de citas para barberia construido con Next.js 15, React 19, Supabase y Tailwind CSS.

## Funcionalidades

- Reserva de citas online con wizard multi-paso
- Panel de administracion para gestionar citas y disponibilidad
- Notificaciones push para nuevas reservas
- Soporte PWA (instalable en movil)
- Modo de reserva a domicilio (delivery)
- Dashboard de ganancias

## Comenzar

1. Clona el repositorio
2. Copia `.env.local.example` a `.env.local` y completa tus credenciales de Supabase
3. Ejecuta la migracion de base de datos desde `supabase/migration.sql`
4. Crea un usuario admin en Supabase Authentication
5. `npm install && npm run dev`

## Personalizacion

- Edita `src/utils/constants.ts` para cambiar nombre del negocio, contacto, servicios y perfil del barbero
- Reemplaza las imagenes en `public/images/` con las tuyas
- Actualiza los metadatos en `src/app/layout.tsx`
- Configura tu dominio en Vercel
