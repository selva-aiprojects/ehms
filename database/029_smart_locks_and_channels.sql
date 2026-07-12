-- 029_smart_locks_and_channels.sql
-- Migration for OTA Channel Manager and Smart Lock Keyless Entry (Phase 2)

-- 1. Seed default OTA Channel Partners if not already present
INSERT INTO channel_partners (name, code, commission_rate, is_active)
VALUES
    ('Booking.com', 'booking_com', 15.00, true),
    ('MakeMyTrip / GoIbibo', 'mmt_goibibo', 18.00, true),
    ('Airbnb', 'airbnb', 12.00, true),
    ('Expedia', 'expedia', 16.00, true),
    ('Agoda', 'agoda', 15.00, true)
ON CONFLICT (code) DO UPDATE 
SET commission_rate = EXCLUDED.commission_rate,
    is_active = EXCLUDED.is_active;

-- 2. Create digital_keys table for Smart Lock Access PIN codes
CREATE TABLE IF NOT EXISTS digital_keys (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id     UUID REFERENCES properties(id) ON DELETE CASCADE,
    unit_id         UUID REFERENCES units(id) ON DELETE CASCADE,
    booking_id      UUID REFERENCES bookings(id) ON DELETE CASCADE,
    guest_id        UUID REFERENCES guest_profiles(id) ON DELETE SET NULL,
    lock_vendor     VARCHAR(50) DEFAULT 'Salto Bluetooth/PIN',
    pin_code        VARCHAR(20) NOT NULL,
    bluetooth_token VARCHAR(255),
    valid_from      TIMESTAMPTZ NOT NULL,
    valid_to        TIMESTAMPTZ NOT NULL,
    status          VARCHAR(30) DEFAULT 'active', -- 'active', 'revoked', 'expired'
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_digital_keys_booking ON digital_keys(booking_id);
CREATE INDEX IF NOT EXISTS idx_digital_keys_unit ON digital_keys(unit_id);
