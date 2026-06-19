-- SAMP Reservation & Booking Engine (BRD Section 3.3)

CREATE TABLE rate_plans (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id     UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    unit_type       unit_type,
    name            VARCHAR(255) NOT NULL,
    base_rate       DECIMAL(10,2) NOT NULL,
    currency        VARCHAR(3) DEFAULT 'INR',
    is_dynamic      BOOLEAN DEFAULT false,
    rules           JSONB DEFAULT '{}',
    effective_from  DATE,
    effective_to    DATE,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE bookings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id     UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    unit_id         UUID REFERENCES units(id),
    guest_id        UUID REFERENCES guest_profiles(id),
    corporate_id    UUID REFERENCES corporate_accounts(id),
    booking_model   booking_model NOT NULL,
    status          booking_status DEFAULT 'pending',
    source          VARCHAR(50) DEFAULT 'direct',   -- direct, booking.com, expedia, agoda
    source_booking_ref VARCHAR(255),                -- OTA reference
    check_in        TIMESTAMPTZ NOT NULL,
    check_out       TIMESTAMPTZ NOT NULL,
    adults          INT DEFAULT 1,
    children        INT DEFAULT 0,
    total_amount    DECIMAL(12,2),
    tax_amount      DECIMAL(12,2),
    paid_amount     DECIMAL(12,2) DEFAULT 0,
    balance_amount  DECIMAL(12,2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
    currency        VARCHAR(3) DEFAULT 'INR',
    special_requests TEXT,
    cancellation_policy VARCHAR(100),
    checked_in_at   TIMESTAMPTZ,
    checked_out_at  TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE booking_guests (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id      UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    guest_id        UUID NOT NULL REFERENCES guest_profiles(id) ON DELETE CASCADE,
    is_primary      BOOLEAN DEFAULT false,
    UNIQUE(booking_id, guest_id)
);

CREATE TABLE inventory_calendar (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id         UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    date            DATE NOT NULL,
    status          room_status DEFAULT 'vacant',
    rate            DECIMAL(10,2),
    is_blocked      BOOLEAN DEFAULT false,
    booking_id      UUID REFERENCES bookings(id) ON DELETE SET NULL,
    UNIQUE(unit_id, date)
);

CREATE TABLE channel_sync_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id     UUID NOT NULL REFERENCES properties(id),
    channel         VARCHAR(50) NOT NULL,
    action          VARCHAR(50) NOT NULL,           -- push_availability, push_rate, booking_received
    request_payload JSONB,
    response_status INT,
    response_body   TEXT,
    synced_at       TIMESTAMPTZ DEFAULT now(),
    duration_ms     INT
);

CREATE INDEX idx_bookings_property ON bookings(property_id);
CREATE INDEX idx_bookings_guest ON bookings(guest_id);
CREATE INDEX idx_bookings_dates ON bookings(check_in, check_out);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_inventory_date ON inventory_calendar(date);
CREATE INDEX idx_inventory_unit_date ON inventory_calendar(unit_id, date);
