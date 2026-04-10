# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Start development server
- `npm run build` — Production build
- `npm run lint` — ESLint check
- `npm start` — Start production server

No test framework is configured.

## Architecture

**Stack:** Next.js 15 (App Router) + React 19 + Supabase + Tailwind CSS 4 + Framer Motion + next-pwa + web-push + date-fns + Leaflet/react-leaflet
**Deployed on Vercel** (configure your own domain)

This is a barbershop appointment booking system with a public-facing landing page, a multi-step booking flow, and a full admin panel. Supports two service modalities: **en_tienda** (at the barbershop) and **delivery** (barber goes to client's home). All dates/times use Panama timezone (UTC-5, no DST).

### Public Side

**Landing page (`/`):** Hero section with background carousel, services section, about section, contact section, and footer. Includes PWA install prompt and navigation bar.

**Booking flow (`/reservar`):** First shows a type selection screen (En el local / A domicilio). "En el local" continues in-page with the multi-step wizard: DatePicker → TimeSlotGrid → ServiceSelector → ClientInfoForm → BookingSummary. "A domicilio" redirects to `/reservar/delivery`. If a `?date=` URL param is present, the type selection is skipped. Fetches available slots via `/api/slots`, books atomically via `/api/book` which calls the `book_slot()` Supabase RPC function to prevent double-booking. On success, redirects to `/reservar/confirmacion` with booking details.

**Delivery booking flow (`/reservar/delivery`):** Same wizard structure but with an additional Location step between Services and Client Info. Uses a Leaflet/OpenStreetMap map picker (`MapPicker` component, loaded with `next/dynamic` SSR-disabled) where the client taps to place a marker + optional text description. Includes "Usar mi ubicación" GPS button. Posts to `/api/book` with `appointment_type: 'delivery'` and `delivery_location: { lat, lng, description }`. On success, redirects to `/reservar/delivery/confirmacion`.

### Admin Side (`/admin/*`)

All admin pages are `'use client'` components wrapped in `AdminGuard` (client-side auth check). The guard auto-refreshes sessions on visibility change and every 10 minutes.

**Routes:**
- `/admin/login` — Email/password login
- `/admin/citas` — Appointment management (view, confirm, complete, cancel, register payments). Includes type filter (Todas/Barbería/Delivery) and status filter. Delivery appointments show Google Maps and Waze navigation links + copy address button.
- `/admin/disponibilidad` — Availability block management (create/delete time ranges). Toggle at top switches between "Barbería" and "Delivery" modes — each has independent availability. Share links auto-adjust to the active type.
- `/admin/ganancias` — Revenue dashboard with period filters (today/week/month), shows earnings by completed appointments with payment method breakdown (Efectivo/Yappy)
- `/admin/configuracion` — Settings (slot duration, advance booking days) and push notification management (activate/test)

### Auth & Sessions

Supabase Auth with email/password. Middleware (`src/middleware.ts`) refreshes the session on every request. Cookies use 400-day max-age with `sameSite: lax` and `secure: true`. Special care is needed for iOS PWA standalone mode — avoid server-side `redirect()` and Next.js RSC navigation after login, as these break WKWebView's standalone context.

### Database

Supabase (PostgreSQL) with RLS policies. Schema in `supabase/migration.sql`. Key tables: `admin_settings`, `availability` (has `type` column: `en_tienda`/`delivery`), `time_slots` (has `type` column), `appointments` (has `appointment_type` and `delivery_location` JSONB), `push_subscriptions`. The `book_slot()` RPC function uses `SECURITY DEFINER` for atomic booking and accepts optional `p_appointment_type` and `p_delivery_location` parameters.

### API Routes (`/api/*`)

- `/api/slots` — GET, public: fetch available slots for a date. Accepts `type` query param (`en_tienda`|`delivery`, default `en_tienda`)
- `/api/book` — POST, public: create appointment via RPC + sends push notification to admin. Accepts optional `appointment_type` and `delivery_location` fields for delivery bookings
- `/api/admin/appointments` — GET/PATCH/DELETE, authenticated
- `/api/admin/availability` — GET/POST/DELETE, authenticated. Accepts `type` query/body param for filtering/creating by modality
- `/api/admin/settings` — GET/PUT, authenticated
- `/api/admin/push-subscription` — POST, authenticated: save push subscription
- `/api/admin/push-subscription/check` — POST, authenticated: verify subscription exists in DB
- `/api/admin/push-test` — POST, authenticated: send test push notification

### Push Notifications

Web Push via `web-push` library with VAPID keys. Flow:
1. Admin visits `/admin/configuracion` → SW auto-registers + auto-subscribes if permission granted
2. Subscription saved to `push_subscriptions` table
3. When a client books via `/api/book`, `sendPushToAdmin()` (`src/lib/push.ts`) sends notification to all stored subscriptions
4. Expired subscriptions (410/404) are auto-removed from DB
5. Notification format: `Nueva Cita` (or `Nueva Cita Delivery`) — `Name - Service1, Service2 - 3:00 PM`

### PWA

Configured via next-pwa. Service worker at `/public/sw.js` (auto-generated). Custom push notification worker at `/worker/index.js`. Manifest targets `/admin/citas` as start URL with standalone display mode.

## Components (`src/components/`)

- **Booking/** — DatePicker, TimeSlotGrid, ServiceSelector, ClientInfoForm, BookingSummary, MapPicker (Leaflet, SSR-disabled)
- **Admin/** — AdminGuard, AdminLayout, AppointmentCard, PaymentModal, PushSubscription
- **Modal/** — AppointmentModal
- **PWA/** — InstallPWA, PWAChecker, PWAStatus, ServiceWorkerRegistration
- **Hero/** — HeroSection, BackgroundCarousel, HeroContent
- **Navigation/** — Navigation
- **Services/** — ServicesSection
- **About/** — AboutSection
- **Contact/** — ContactSection
- **Footer/** — Footer

## Key Utilities

- `src/lib/utils/dates.ts` — `nowInPanama()`, `todayInPanama()`, `formatDateSpanish()`, `formatTime12h()`, `getBookingDateRange()`, `isDateInRange()`, `getDaysInRange()` — all hardcoded to UTC-5
- `src/lib/utils/slots.ts` — `generateSlotsFromAvailability()`: generates time slots from availability blocks
- `src/lib/supabase/client.ts` — Browser Supabase client
- `src/lib/supabase/server.ts` — Server client (cookie-based) and service client (service role key)
- `src/lib/push.ts` — `sendPushToAdmin()`: sends web push to all stored subscriptions, auto-cleans expired
- `src/utils/constants.ts` — Business info, services list, barber profile, nav links, colors
- `src/types/index.ts` — TypeScript interfaces: Appointment, TimeSlot, Availability, AdminSettings, BookingRequest, DeliveryBookingRequest, DeliveryLocation, BookingConfirmation, AppointmentStatus, PaymentMethod

## Path Alias

`@/*` maps to `./src/*`

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_VAPID_PUBLIC_KEY  (push notifications)
VAPID_PRIVATE_KEY             (push notifications)
```

## iOS PWA Pitfalls

This app has had recurring issues with iOS Safari's WKWebView losing standalone mode. Known triggers to avoid:
- Server-side `redirect()` from next/navigation (causes HTTP 307/308)
- `router.replace()` after login (RSC flight can trigger MPA fallback)
- Use `window.location.href` for post-login navigation instead
- The admin layout uses `force-dynamic` because admin client components import Supabase which requires env vars unavailable at build time
