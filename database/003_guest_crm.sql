-- SAMP Guest / Tenant / Member CRM (BRD Section 3.2)

CREATE TABLE guest_profiles (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100),
    email           VARCHAR(255),
    phone           VARCHAR(20),
    id_type         VARCHAR(50),                    -- aadhaar, passport, driving_license
    id_number       VARCHAR(100),
    id_verified     BOOLEAN DEFAULT false,
    id_verified_at  TIMESTAMPTZ,
    kyc_token       VARCHAR(255),                   -- "Cleared for Stay" token
    nationality     VARCHAR(100),
    date_of_birth   DATE,
    tags            TEXT[],                         -- VIP, corporate, frequent
    preferences     JSONB DEFAULT '{}',
    total_stays     INT DEFAULT 0,
    loyalty_points  DECIMAL(10,2) DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE corporate_accounts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(255) NOT NULL,
    tax_id          VARCHAR(50),
    spending_limit  DECIMAL(12,2),
    billing_cycle   VARCHAR(50) DEFAULT 'monthly',
    payment_terms   INT DEFAULT 30,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE corporate_members (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    corporate_id    UUID NOT NULL REFERENCES corporate_accounts(id) ON DELETE CASCADE,
    guest_id        UUID NOT NULL REFERENCES guest_profiles(id) ON DELETE CASCADE,
    designation     VARCHAR(100),
    employee_id     VARCHAR(50),
    is_approved     BOOLEAN DEFAULT false,
    created_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE(corporate_id, guest_id)
);

CREATE TABLE guest_communications (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guest_id        UUID NOT NULL REFERENCES guest_profiles(id) ON DELETE CASCADE,
    channel         VARCHAR(50) NOT NULL,           -- email, whatsapp, sms
    template        VARCHAR(100) NOT NULL,
    sent_at         TIMESTAMPTZ DEFAULT now(),
    status          VARCHAR(50) DEFAULT 'sent',     -- sent, delivered, failed
    error_message   TEXT
);

CREATE INDEX idx_guest_email ON guest_profiles(email);
CREATE INDEX idx_guest_phone ON guest_profiles(phone);
CREATE INDEX idx_guest_corporate ON corporate_members(corporate_id);
