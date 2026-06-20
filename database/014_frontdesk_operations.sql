CREATE TABLE guest_requests (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id     UUID NOT NULL REFERENCES properties(id),
    booking_id      UUID REFERENCES bookings(id),
    guest_id        UUID REFERENCES guest_profiles(id),
    request_type    VARCHAR(100) NOT NULL,
    description     TEXT NOT NULL,
    assigned_to_dept VARCHAR(50),
    status          VARCHAR(50) DEFAULT 'open',
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE guest_feedbacks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id     UUID NOT NULL REFERENCES properties(id),
    booking_id      UUID REFERENCES bookings(id),
    guest_id        UUID REFERENCES guest_profiles(id),
    department      VARCHAR(100),
    rating          INT CHECK (rating >= 1 AND rating <= 5),
    comments        TEXT,
    status          VARCHAR(50) DEFAULT 'new',
    created_at      TIMESTAMPTZ DEFAULT now()
);
