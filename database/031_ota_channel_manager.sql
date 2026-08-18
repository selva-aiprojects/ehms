-- ============================================================
-- 031_ota_channel_manager.sql
-- Phase 2: OTA Channel Manager + Direct Booking Engine
-- ============================================================

-- ── 1. OTA RATE MAPPINGS ──────────────────────────────────
-- Maps internal room types to OTA channel room type codes
CREATE TABLE IF NOT EXISTS ota_rate_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES channel_partners(id) ON DELETE CASCADE,
  unit_type VARCHAR(50) NOT NULL,
  channel_room_type_code VARCHAR(100) NOT NULL,
  channel_room_name VARCHAR(255),
  rate_multiplier DECIMAL(4,2) NOT NULL DEFAULT 1.00,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (property_id, channel_id, unit_type)
);

-- ── 2. OTA AVAILABILITY PUSH QUEUE ────────────────────────
CREATE TABLE IF NOT EXISTS ota_availability_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  available BOOLEAN NOT NULL DEFAULT true,
  rate DECIMAL(10,2),
  min_stay INT DEFAULT 1,
  status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','syncing','synced','failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  synced_at TIMESTAMPTZ,
  UNIQUE (property_id, unit_id, date)
);
CREATE INDEX IF NOT EXISTS idx_ota_avail_queue_status ON ota_availability_queue(status, property_id);

-- ── 3. OTA RATE PUSH QUEUE ────────────────────────────────
CREATE TABLE IF NOT EXISTS ota_rate_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  mapping_id UUID NOT NULL REFERENCES ota_rate_mappings(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  rate DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'INR',
  status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','syncing','synced','failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  synced_at TIMESTAMPTZ,
  UNIQUE (mapping_id, date)
);

-- ── 4. OTA BOOKING INGEST QUEUE ───────────────────────────
CREATE TABLE IF NOT EXISTS ota_booking_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES channel_partners(id) ON DELETE CASCADE,
  channel_booking_ref VARCHAR(255) NOT NULL,
  guest_name VARCHAR(255),
  guest_email VARCHAR(255),
  guest_phone VARCHAR(20),
  unit_type VARCHAR(50),
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  adults INT DEFAULT 1,
  children INT DEFAULT 0,
  total_amount DECIMAL(12,2),
  commission DECIMAL(12,2),
  net_amount DECIMAL(12,2),
  status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','created','cancelled','error')),
  internal_booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  raw_payload JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  UNIQUE (channel_id, channel_booking_ref)
);
CREATE INDEX IF NOT EXISTS idx_ota_booking_queue_status ON ota_booking_queue(status, property_id);

-- ── 5. OTA COMMISSION RATES ───────────────────────────────
CREATE TABLE IF NOT EXISTS ota_commission_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES channel_partners(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  unit_type VARCHAR(50),
  commission_pct DECIMAL(5,2) NOT NULL DEFAULT 15.00,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (channel_id, property_id, unit_type, effective_from)
);

-- ── 6. OTA SETTLEMENTS ────────────────────────────────────
CREATE TABLE IF NOT EXISTS ota_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES channel_partners(id) ON DELETE CASCADE,
  settlement_ref VARCHAR(255),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  gross_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  commission DECIMAL(12,2) NOT NULL DEFAULT 0,
  net_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  booking_count INT NOT NULL DEFAULT 0,
  status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reconciled','paid')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 7. OTA SYNC LOG (extend existing) ─────────────────────
-- The channel_sync_log table already exists from migration 004.
-- No schema change needed — just ensure it has the right columns.
ALTER TABLE channel_sync_log ADD COLUMN IF NOT EXISTS duration_ms INT;
ALTER TABLE channel_sync_log ADD COLUMN IF NOT EXISTS error_message TEXT;

-- ── 8. BOOKING ENGINE CONFIG ──────────────────────────────
CREATE TABLE IF NOT EXISTS booking_engine_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE UNIQUE,
  hero_image TEXT,
  tagline VARCHAR(255),
  description TEXT,
  theme_color VARCHAR(20) DEFAULT '#1E3A8A',
  cancellation_policy TEXT DEFAULT 'Free cancellation up to 24 hours before check-in.',
  payment_methods JSONB NOT NULL DEFAULT '["razorpay","cash"]'::jsonb,
  require_advance_payment BOOLEAN NOT NULL DEFAULT false,
  advance_percentage DECIMAL(5,2) DEFAULT 0,
  min_advance_amount DECIMAL(10,2) DEFAULT 0,
  check_in_time TIME DEFAULT '14:00',
  check_out_time TIME DEFAULT '11:00',
  terms_html TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 9. PROMO CODES ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  description TEXT,
  discount_type VARCHAR(20) NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage','fixed_amount')),
  discount_value DECIMAL(10,2) NOT NULL,
  min_nights INT DEFAULT 0,
  min_amount DECIMAL(10,2) DEFAULT 0,
  max_uses INT,
  used_count INT NOT NULL DEFAULT 0,
  applicable_room_types TEXT[],
  valid_from DATE NOT NULL,
  valid_to DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (property_id, code)
);
CREATE INDEX IF NOT EXISTS idx_promo_codes_prop ON promo_codes(property_id, code, is_active);

-- ── 10. BOOKING ENGINE SESSIONS ───────────────────────────
CREATE TABLE IF NOT EXISTS booking_engine_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  session_token VARCHAR(64) UNIQUE NOT NULL,
  guest_name VARCHAR(255),
  guest_email VARCHAR(255),
  guest_phone VARCHAR(20),
  check_in DATE,
  check_out DATE,
  adults INT DEFAULT 1,
  children INT DEFAULT 0,
  unit_type VARCHAR(50),
  promo_code VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- ── SEED: Commission rates for existing channels ──────────
DO $$
DECLARE
  ch RECORD;
  prop RECORD;
BEGIN
  FOR ch IN SELECT id, code FROM channel_partners WHERE code IN ('BOOKING_COM','EXPEDIA','AGODA','MAKEMYTRIP','GOIBIBO','HOTELS_COM') LOOP
    FOR prop IN SELECT id FROM properties WHERE is_active = true LOOP
      INSERT INTO ota_commission_rates (channel_id, property_id, commission_pct)
      VALUES (ch.id, prop.id,
        CASE ch.code
          WHEN 'BOOKING_COM' THEN 15.00
          WHEN 'EXPEDIA' THEN 18.00
          WHEN 'AGODA' THEN 16.00
          WHEN 'MAKEMYTRIP' THEN 12.00
          WHEN 'GOIBIBO' THEN 12.00
          WHEN 'HOTELS_COM' THEN 18.00
          ELSE 15.00
        END
      )
      ON CONFLICT (channel_id, property_id, unit_type, effective_from) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- ── SEED: Booking engine config for existing properties ───
DO $$
DECLARE
  prop RECORD;
BEGIN
  FOR prop IN SELECT id, name, check_in_time, check_out_time FROM properties WHERE is_active = true LOOP
    INSERT INTO booking_engine_config (property_id, tagline, description, check_in_time, check_out_time)
    VALUES (prop.id, 'Book directly at the best rate', 'Experience seamless direct booking with instant confirmation.', prop.check_in_time, prop.check_out_time)
    ON CONFLICT (property_id) DO NOTHING;
  END LOOP;
END $$;
