-- 032_self_checkin.sql — Digital Self Check-in/Out, Kiosk Mode, QR Code Workflow
-- Run in tenant schema

-- ── Self Check-in Sessions ──
CREATE TABLE IF NOT EXISTS checkin_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id   UUID NOT NULL REFERENCES properties(id),
  booking_id    UUID NOT NULL REFERENCES bookings(id),
  guest_id      UUID REFERENCES guest_profiles(id),

  -- Kiosk / QR
  session_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  qr_code_url   TEXT,
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','identity_verified','payment_pending','completed','expired','cancelled')),

  -- Identity verification
  id_type        TEXT,
  id_number      TEXT,
  id_front_url   TEXT,
  id_back_url    TEXT,
  id_verified    BOOLEAN DEFAULT false,
  id_verified_by UUID REFERENCES users(id),
  id_verified_at TIMESTAMPTZ,

  -- Face match
  selfie_url     TEXT,
  face_matched   BOOLEAN,

  -- Police / registration
  form_c_auto    BOOLEAN DEFAULT false,
  form_c_submitted BOOLEAN DEFAULT false,

  -- Payment
  payment_method   TEXT,
  payment_status   TEXT DEFAULT 'pending'
                   CHECK (payment_status IN ('pending','authorized','captured','failed','refunded')),
  payment_amount   NUMERIC(12,2),
  payment_ref      TEXT,

  -- Digital key
  digital_key_issued BOOLEAN DEFAULT false,
  digital_key_value  TEXT,
  digital_key_expires TIMESTAMPTZ,

  -- Timestamps
  opened_at    TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  expires_at   TIMESTAMPTZ DEFAULT (now() + INTERVAL '24 hours'),
  ip_address   TEXT,
  user_agent   TEXT,

  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- ── Self Check-out Sessions ──
CREATE TABLE IF NOT EXISTS checkout_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id     UUID NOT NULL REFERENCES properties(id),
  booking_id      UUID NOT NULL REFERENCES bookings(id),
  checkin_session_id UUID REFERENCES checkin_sessions(id),

  session_token   TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','folio_review','payment_pending','completed','expired')),

  -- Folio summary
  total_charges   NUMERIC(12,2) DEFAULT 0,
  total_payments  NUMERIC(12,2) DEFAULT 0,
  balance_due     NUMERIC(12,2) DEFAULT 0,

  -- Payment
  payment_method   TEXT,
  payment_status   TEXT DEFAULT 'pending',
  payment_amount   NUMERIC(12,2),
  payment_ref      TEXT,

  -- Feedback
  satisfaction_rating INT CHECK (satisfaction_rating BETWEEN 1 AND 5),
  feedback_text       TEXT,

  -- Digital key return
  digital_key_returned BOOLEAN DEFAULT false,

  opened_at     TIMESTAMPTZ DEFAULT now(),
  completed_at  TIMESTAMPTZ,
  expires_at    TIMESTAMPTZ DEFAULT (now() + INTERVAL '12 hours'),

  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- ── ID Verification Log ──
CREATE TABLE IF NOT EXISTS identity_verifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checkin_session_id UUID NOT NULL REFERENCES checkin_sessions(id),
  method          TEXT NOT NULL DEFAULT 'manual'
                  CHECK (method IN ('manual','ocr','face_match','biometric')),
  id_type         TEXT,
  id_number       TEXT,
  id_image_url    TEXT,
  selfie_url      TEXT,
  face_matched    BOOLEAN,
  confidence_score NUMERIC(5,2),
  verified_by     UUID REFERENCES users(id),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ── Kiosk Config per Property ──
CREATE TABLE IF NOT EXISTS kiosk_config (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id   UUID NOT NULL REFERENCES properties(id) UNIQUE,

  enabled             BOOLEAN DEFAULT false,
  welcome_message     TEXT DEFAULT 'Welcome! Please check in using this kiosk.',
  required_id_types   JSONB DEFAULT '["passport","aadhaar"]'::jsonb,
  require_selfie      BOOLEAN DEFAULT true,
  require_payment     BOOLEAN DEFAULT true,
  require_form_c      BOOLEAN DEFAULT false,
  digital_key_enabled BOOLEAN DEFAULT true,

  branding_logo_url   TEXT,
  branding_color      TEXT DEFAULT '#062A54',
  background_image_url TEXT,

  auto_checkin_enabled BOOLEAN DEFAULT false,
  auto_checkout_enabled BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── Indexes ──
CREATE INDEX IF NOT EXISTS idx_checkin_sessions_property ON checkin_sessions(property_id);
CREATE INDEX IF NOT EXISTS idx_checkin_sessions_booking ON checkin_sessions(booking_id);
CREATE INDEX IF NOT EXISTS idx_checkin_sessions_token ON checkin_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_checkin_sessions_status ON checkin_sessions(status);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_property ON checkout_sessions(property_id);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_booking ON checkout_sessions(booking_id);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_token ON checkout_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_identity_verifications_session ON identity_verifications(checkin_session_id);

-- ── Seed default kiosk config for existing properties ──
INSERT INTO kiosk_config (property_id, enabled)
SELECT id, false FROM properties
WHERE NOT EXISTS (SELECT 1 FROM kiosk_config WHERE property_id = properties.id)
ON CONFLICT (property_id) DO NOTHING;
