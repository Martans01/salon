-- JD Barbershop Booking System - Supabase Migration
-- Run this SQL in Supabase SQL Editor to set up the database

-- 1. Admin Settings
CREATE TABLE admin_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slot_duration_minutes INTEGER NOT NULL DEFAULT 30,
  advance_booking_days INTEGER NOT NULL DEFAULT 14,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO admin_settings (slot_duration_minutes, advance_booking_days) VALUES (30, 14);

-- 2. Availability
CREATE TABLE availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date, start_time)
);

-- 3. Time Slots
CREATE TABLE time_slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  availability_id UUID REFERENCES availability(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_booked BOOLEAN DEFAULT FALSE,
  UNIQUE(date, start_time)
);

-- 4. Appointments
CREATE TABLE appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  time_slot_id UUID REFERENCES time_slots(id) UNIQUE NOT NULL,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  services TEXT[] NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'confirmada', 'cancelada', 'completada')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Atomic booking function (prevents double booking)
CREATE OR REPLACE FUNCTION book_slot(
  p_time_slot_id UUID,
  p_client_name TEXT,
  p_client_phone TEXT,
  p_services TEXT[]
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_slot RECORD;
  v_appointment_id UUID;
BEGIN
  -- Try to claim the slot atomically
  UPDATE time_slots
  SET is_booked = TRUE
  WHERE id = p_time_slot_id AND is_booked = FALSE
  RETURNING * INTO v_slot;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'SLOT_ALREADY_BOOKED' USING ERRCODE = 'P0001';
  END IF;

  -- Create the appointment
  INSERT INTO appointments (time_slot_id, client_name, client_phone, services)
  VALUES (p_time_slot_id, p_client_name, p_client_phone, p_services)
  RETURNING id INTO v_appointment_id;

  RETURN json_build_object(
    'appointment_id', v_appointment_id,
    'client_name', p_client_name,
    'client_phone', p_client_phone,
    'services', p_services,
    'date', v_slot.date,
    'start_time', v_slot.start_time,
    'end_time', v_slot.end_time,
    'status', 'pendiente'
  );
END;
$$;

-- 6. Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER admin_settings_updated_at
  BEFORE UPDATE ON admin_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 7. RLS Policies
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Admin settings: read public, write admin only
CREATE POLICY "Public read admin_settings" ON admin_settings FOR SELECT USING (true);
CREATE POLICY "Admin write admin_settings" ON admin_settings FOR ALL USING (auth.role() = 'authenticated');

-- Availability: read active public, CRUD admin
CREATE POLICY "Public read active availability" ON availability FOR SELECT USING (is_active = true);
CREATE POLICY "Admin all availability" ON availability FOR ALL USING (auth.role() = 'authenticated');

-- Time slots: read public, write admin
CREATE POLICY "Public read time_slots" ON time_slots FOR SELECT USING (true);
CREATE POLICY "Admin all time_slots" ON time_slots FOR ALL USING (auth.role() = 'authenticated');

-- Appointments: insert public (via function), select/update admin
CREATE POLICY "Admin all appointments" ON appointments FOR ALL USING (auth.role() = 'authenticated');
-- Note: book_slot function uses SECURITY DEFINER so it bypasses RLS

-- 8. Indexes for performance
CREATE INDEX idx_time_slots_date ON time_slots(date);
CREATE INDEX idx_time_slots_date_booked ON time_slots(date, is_booked);
CREATE INDEX idx_availability_date ON availability(date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_created ON appointments(created_at);

-- 9. Push Subscriptions (for admin push notifications)
CREATE TABLE push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin all push_subscriptions" ON push_subscriptions
  FOR ALL USING (auth.role() = 'authenticated');

-- 10. Delivery service support
-- Add type to availability and update unique constraint
ALTER TABLE availability ADD COLUMN type TEXT NOT NULL DEFAULT 'en_tienda'
  CHECK (type IN ('en_tienda', 'delivery'));
ALTER TABLE availability DROP CONSTRAINT availability_date_start_time_key;
ALTER TABLE availability ADD UNIQUE(date, start_time, type);

-- Add type to time_slots and update unique constraint
ALTER TABLE time_slots ADD COLUMN type TEXT NOT NULL DEFAULT 'en_tienda';
ALTER TABLE time_slots DROP CONSTRAINT time_slots_date_start_time_key;
ALTER TABLE time_slots ADD UNIQUE(date, start_time, type);

-- Add delivery fields to appointments
ALTER TABLE appointments
  ADD COLUMN appointment_type TEXT NOT NULL DEFAULT 'en_tienda'
    CHECK (appointment_type IN ('en_tienda', 'delivery')),
  ADD COLUMN delivery_location JSONB;

-- Update book_slot() to accept appointment type and delivery location
CREATE OR REPLACE FUNCTION book_slot(
  p_time_slot_id UUID,
  p_client_name TEXT,
  p_client_phone TEXT,
  p_services TEXT[],
  p_appointment_type TEXT DEFAULT 'en_tienda',
  p_delivery_location JSONB DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_slot RECORD;
  v_appointment_id UUID;
BEGIN
  UPDATE time_slots
  SET is_booked = TRUE
  WHERE id = p_time_slot_id AND is_booked = FALSE
  RETURNING * INTO v_slot;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'SLOT_ALREADY_BOOKED' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO appointments (time_slot_id, client_name, client_phone, services, appointment_type, delivery_location)
  VALUES (p_time_slot_id, p_client_name, p_client_phone, p_services, p_appointment_type, p_delivery_location)
  RETURNING id INTO v_appointment_id;

  RETURN json_build_object(
    'appointment_id', v_appointment_id,
    'client_name', p_client_name,
    'client_phone', p_client_phone,
    'services', p_services,
    'date', v_slot.date,
    'start_time', v_slot.start_time,
    'end_time', v_slot.end_time,
    'status', 'pendiente',
    'appointment_type', p_appointment_type,
    'delivery_location', p_delivery_location
  );
END;
$$;

CREATE INDEX idx_time_slots_type ON time_slots(type);
CREATE INDEX idx_appointments_type ON appointments(appointment_type);
