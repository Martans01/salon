-- ============================================================
-- Multi-plan support: barbers table + barber_id columns
-- Safe to run on existing individual-plan databases
-- All new columns are nullable so existing data stays valid
-- ============================================================

-- 1. Barbers table (used by 'local' and 'multi' plans)
CREATE TABLE barbers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT,
  bio TEXT,
  image_url TEXT,
  phone TEXT,
  instagram TEXT,
  years_of_experience INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE barbers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read active barbers" ON barbers
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admin all barbers" ON barbers
  FOR ALL USING (auth.role() = 'authenticated');

-- 2. Add nullable barber_id to existing tables
ALTER TABLE availability
  ADD COLUMN barber_id UUID REFERENCES barbers(id) ON DELETE CASCADE;

ALTER TABLE time_slots
  ADD COLUMN barber_id UUID REFERENCES barbers(id) ON DELETE CASCADE;

ALTER TABLE appointments
  ADD COLUMN barber_id UUID REFERENCES barbers(id) ON DELETE SET NULL;

-- 3. Update unique constraints to allow same time for different barbers
ALTER TABLE availability DROP CONSTRAINT IF EXISTS availability_date_start_time_type_key;
CREATE UNIQUE INDEX uq_availability_barber
  ON availability (date, start_time, type, COALESCE(barber_id, '00000000-0000-0000-0000-000000000000'::uuid));

ALTER TABLE time_slots DROP CONSTRAINT IF EXISTS time_slots_date_start_time_type_key;
CREATE UNIQUE INDEX uq_time_slots_barber
  ON time_slots (date, start_time, type, COALESCE(barber_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- 4. Indexes for filtered queries
CREATE INDEX idx_availability_barber ON availability(barber_id);
CREATE INDEX idx_time_slots_barber ON time_slots(barber_id);
CREATE INDEX idx_appointments_barber ON appointments(barber_id);

-- 5. Update book_slot() to accept barber_id
CREATE OR REPLACE FUNCTION book_slot(
  p_time_slot_id UUID,
  p_client_name TEXT,
  p_client_phone TEXT,
  p_services TEXT[],
  p_appointment_type TEXT DEFAULT 'en_tienda',
  p_delivery_location JSONB DEFAULT NULL,
  p_barber_id UUID DEFAULT NULL
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

  INSERT INTO appointments (
    time_slot_id, client_name, client_phone, services,
    appointment_type, delivery_location, barber_id
  )
  VALUES (
    p_time_slot_id, p_client_name, p_client_phone, p_services,
    p_appointment_type, p_delivery_location, p_barber_id
  )
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
    'delivery_location', p_delivery_location,
    'barber_id', p_barber_id
  );
END;
$$;
