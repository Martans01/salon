# Sistema de Citas - BarberPro

## Arquitectura General

```
Cliente (Next.js 15 / React 19)
       │
       ├── /reservar          → Wizard de reserva (5 pasos)
       ├── /admin/citas       → Gestión de citas
       ├── /admin/disponibilidad → Gestión de horarios
       └── /admin/configuracion  → Ajustes del sistema
       │
       ▼
API Routes (Next.js Route Handlers)
       │
       ▼
Supabase (PostgreSQL + Auth + RLS)
```

---

## Flujo de Reserva (Cliente)

```
Paso 1: Seleccionar Fecha
        │
        ▼
Paso 2: Seleccionar Hora
        │  GET /api/slots?date=YYYY-MM-DD
        │  ← time_slots disponibles (is_booked=false)
        ▼
Paso 3: Seleccionar Servicio(s)
        │  (Corte, Barba, Cejas - desde constants.ts)
        ▼
Paso 4: Datos del Cliente
        │  (nombre, teléfono +507 XXXX-XXXX)
        ▼
Paso 5: Resumen y Confirmación
        │
        ▼
POST /api/book
        │  RPC book_slot() — atómico, evita doble reserva
        ▼
/reservar/confirmacion
        │  Muestra resumen + enlace WhatsApp al barbero
```

---

## Flujo del Admin

```
1. Login → /admin/login (email + password Supabase)
           │
           ▼
2. Disponibilidad → /admin/disponibilidad
   │  Seleccionar fecha en calendario
   │  POST /api/admin/availability → crea bloque (date, start_time, end_time)
   │  → genera time_slots individuales automáticamente
   │    (según slot_duration_minutes en admin_settings)
   ▼
3. Citas → /admin/citas
   │  GET /api/admin/appointments → lista todas las citas
   │  PATCH /api/admin/appointments → cambia estado
   │  Filtros: pendiente | confirmada | cancelada | completada
   ▼
4. Configuración → /admin/configuracion
   GET/PUT /api/admin/settings
   - slot_duration_minutes (default: 30)
   - advance_booking_days (default: 14)
```

---

## Tablas de Base de Datos

### `admin_settings`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID | PK |
| slot_duration_minutes | INTEGER | Duración de cada cita (default: 30) |
| advance_booking_days | INTEGER | Días máximos de anticipación (default: 14) |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | Auto-actualizado por trigger |

### `availability`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID | PK |
| date | DATE | Fecha del bloque de disponibilidad |
| start_time | TIME | Hora de inicio del bloque |
| end_time | TIME | Hora de fin del bloque |
| is_active | BOOLEAN | Si el bloque está activo (default: true) |
| created_at | TIMESTAMPTZ | |
| UNIQUE | (date, start_time) | No se pueden duplicar bloques |

### `time_slots`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID | PK |
| availability_id | UUID | FK → availability (CASCADE DELETE) |
| date | DATE | Fecha del slot |
| start_time | TIME | Hora de inicio del slot |
| end_time | TIME | Hora de fin del slot |
| is_booked | BOOLEAN | Si ya fue reservado (default: false) |
| UNIQUE | (date, start_time) | No se duplican slots |

**Relación:** Un bloque de `availability` genera N `time_slots` según `slot_duration_minutes`.

### `appointments`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID | PK |
| time_slot_id | UUID | FK → time_slots (UNIQUE — 1 cita por slot) |
| client_name | TEXT | Nombre del cliente |
| client_phone | TEXT | Teléfono (+507 XXXX-XXXX) |
| services | TEXT[] | Array de servicios seleccionados |
| status | TEXT | pendiente \| confirmada \| cancelada \| completada |
| notes | TEXT | Notas opcionales |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | Auto-actualizado por trigger |

---

## Estados de una Cita

```
CREADA
  │
  ▼
pendiente ──── (admin confirma) ──→ confirmada ──→ completada
     │                                   │
     └─── (admin cancela) ──────→ cancelada
```

| Estado | Significado |
|--------|-------------|
| `pendiente` | Recién creada, sin revisar |
| `confirmada` | Admin confirmó la cita |
| `cancelada` | Cita cancelada (libera el slot visualmente) |
| `completada` | Servicio realizado |

---

## API Endpoints

### Públicos (sin autenticación)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/slots?date=YYYY-MM-DD` | Slots disponibles para una fecha |
| GET | `/api/slots?from=YYYY-MM-DD&to=YYYY-MM-DD` | Slots en rango de fechas |
| POST | `/api/book` | Crear reserva (llama RPC `book_slot()`) |

**Body de POST /api/book:**
```json
{
  "time_slot_id": "uuid",
  "client_name": "Juan Pérez",
  "client_phone": "+507 6123-4567",
  "services": ["Corte de Cabello", "Barba"]
}
```

### Admin (requieren sesión autenticada)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/admin/appointments` | Listar todas las citas |
| PATCH | `/api/admin/appointments` | Actualizar estado de una cita |
| GET | `/api/admin/availability` | Ver disponibilidad |
| POST | `/api/admin/availability` | Crear bloque de disponibilidad + generar slots |
| DELETE | `/api/admin/availability` | Eliminar bloque (cascade elimina slots) |
| GET | `/api/admin/settings` | Ver configuración |
| PUT | `/api/admin/settings` | Actualizar configuración |

---

## Función RPC: `book_slot()`

Función PostgreSQL con `SECURITY DEFINER` que garantiza atomicidad:

```sql
book_slot(
  p_time_slot_id UUID,
  p_client_name  TEXT,
  p_client_phone TEXT,
  p_services     TEXT[]
) RETURNS JSON
```

1. Hace `UPDATE time_slots SET is_booked=TRUE WHERE id=... AND is_booked=FALSE`
2. Si no encuentra fila → lanza `SLOT_ALREADY_BOOKED` (previene doble reserva)
3. Inserta en `appointments`
4. Retorna JSON con todos los datos de la cita creada

---

## RLS (Row Level Security)

| Tabla | Anon (público) | Authenticated (admin) |
|-------|---------------|----------------------|
| admin_settings | SELECT | ALL |
| availability | SELECT (is_active=true) | ALL |
| time_slots | SELECT | ALL |
| appointments | — (solo via RPC) | ALL |

---

## Setup Inicial

### 1. Variables de entorno

Crear `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key del dashboard>
SUPABASE_SERVICE_ROLE_KEY=<service role key del dashboard>
```

Obtener las keys en: **Supabase Dashboard → Settings → API**

### 2. Base de Datos

Aplicar `/supabase/migration.sql` en el SQL Editor de Supabase.

### 3. Credenciales Admin

- **Email:** `admin@tudominio.com`
- **Password:** `TuPasswordSeguro123!`

Cambiar la contraseña en: **Supabase Dashboard → Authentication → Users**

### 4. Iniciar la app

```bash
npm install
npm run dev
```

---

## Zona Horaria

El sistema usa **UTC-5 (Panamá)** hardcodeado en `/src/lib/utils/dates.ts`.
No hay cambio de horario de verano en Panamá.

---

## Servicios Disponibles

Definidos en `/src/utils/constants.ts`:
- **Corte de Cabello** (servicio principal)
- **Barba**
- **Cejas**

---

## Contacto del Negocio

Definido en `/src/utils/constants.ts`:
- Teléfono WhatsApp para confirmaciones post-reserva
- Horario de atención referencial
