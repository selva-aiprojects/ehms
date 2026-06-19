-- SAMP Workplace & Managed Office Management (BRD Section 3.11)

CREATE TABLE workplace_bookings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id     UUID NOT NULL REFERENCES properties(id),
    unit_id         UUID NOT NULL REFERENCES units(id),
    member_id       UUID REFERENCES guest_profiles(id),
    corporate_id    UUID REFERENCES corporate_accounts(id),
    booking_type    VARCHAR(50) NOT NULL,           -- hot_desk, dedicated_seat, private_cabin, meeting_room
    start_time      TIMESTAMPTZ NOT NULL,
    end_time        TIMESTAMPTZ NOT NULL,
    status          booking_status DEFAULT 'pending',
    is_recurring    BOOLEAN DEFAULT false,
    recurring_pattern JSONB,                        -- weekly, daily, custom
    calendar_event_id VARCHAR(255),                 -- Outlook/Google sync
    total_amount    DECIMAL(10,2),
    checked_in_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE membership_plans (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id     UUID NOT NULL REFERENCES properties(id),
    name            VARCHAR(255) NOT NULL,
    plan_type       VARCHAR(50) NOT NULL,           -- hot_desk, dedicated_seat, private_office, virtual
    billing_cycle   VARCHAR(50) DEFAULT 'monthly',  -- monthly, quarterly, yearly
    price           DECIMAL(10,2) NOT NULL,
    seat_pool       INT,                            -- pooled seats for corporate
    max_meeting_room_hours INT,
    amenities       TEXT[],
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE corporate_memberships (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    corporate_id    UUID NOT NULL REFERENCES corporate_accounts(id) ON DELETE CASCADE,
    plan_id         UUID NOT NULL REFERENCES membership_plans(id),
    start_date      DATE NOT NULL,
    end_date        DATE,
    seat_allocated  INT,
    seat_used       INT DEFAULT 0,
    auto_renew      BOOLEAN DEFAULT true,
    status          VARCHAR(50) DEFAULT 'active',
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE membership_invoices (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    membership_id   UUID NOT NULL REFERENCES corporate_memberships(id) ON DELETE CASCADE,
    invoice_number  VARCHAR(50) UNIQUE NOT NULL,
    period_start    DATE NOT NULL,
    period_end      DATE NOT NULL,
    base_amount     DECIMAL(10,2) NOT NULL,
    overage_amount  DECIMAL(10,2) DEFAULT 0,
    total_amount    DECIMAL(12,2) GENERATED ALWAYS AS (base_amount + overage_amount) STORED,
    status          invoice_status DEFAULT 'draft',
    due_date        DATE NOT NULL,
    paid_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE visitor_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id     UUID NOT NULL REFERENCES properties(id),
    host_employee_id UUID REFERENCES users(id),
    visitor_name    VARCHAR(255) NOT NULL,
    visitor_phone   VARCHAR(20),
    photo_url       TEXT,
    id_number       VARCHAR(100),
    purpose         TEXT,
    check_in        TIMESTAMPTZ NOT NULL,
    check_out       TIMESTAMPTZ,
    badge_issued    BOOLEAN DEFAULT false,
    auto_expire     BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_wp_booking_member ON workplace_bookings(member_id);
CREATE INDEX idx_wp_booking_time ON workplace_bookings(start_time, end_time);
CREATE INDEX idx_wp_booking_status ON workplace_bookings(status);
CREATE INDEX idx_membership_corporate ON corporate_memberships(corporate_id);
CREATE INDEX idx_visitor_property ON visitor_logs(property_id);
