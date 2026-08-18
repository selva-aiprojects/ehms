-- SAMP Lease & Tenancy Management (BRD Section 3.10)
-- For Apartment Rental & Services vertical

CREATE TABLE lease_agreements (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id     UUID NOT NULL REFERENCES properties(id),
    unit_id         UUID NOT NULL REFERENCES units(id),
    tenant_id       UUID NOT NULL REFERENCES guest_profiles(id),
    agreement_ref   VARCHAR(50) UNIQUE NOT NULL,
    status          lease_status DEFAULT 'drafted',
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    lock_in_period_months INT DEFAULT 0,
    notice_period_days    INT DEFAULT 30,
    rent_amount     DECIMAL(10,2) NOT NULL,
    security_deposit DECIMAL(12,2),
    escalation_percent DECIMAL(5,2),
    escalation_frequency_months INT DEFAULT 12,
    furnishing_inventory JSONB DEFAULT '{}',
    e_signature_url TEXT,
    signed_at       TIMESTAMPTZ,
    signed_by_tenant BOOLEAN DEFAULT false,
    signed_by_owner BOOLEAN DEFAULT false,
    document_url    TEXT,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE lease_amendments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lease_id        UUID NOT NULL REFERENCES lease_agreements(id) ON DELETE CASCADE,
    amendment_type  VARCHAR(50) NOT NULL,           -- rent_escalation, term_extension, tenant_change
    prev_value     JSONB,
    new_value      JSONB,
    effective_date  DATE NOT NULL,
    approved_by     UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE rent_invoices (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lease_id        UUID NOT NULL REFERENCES lease_agreements(id) ON DELETE CASCADE,
    invoice_number  VARCHAR(50) UNIQUE NOT NULL,
    period_start    DATE NOT NULL,
    period_end      DATE NOT NULL,
    rent_amount     DECIMAL(10,2) NOT NULL,
    maintenance_charges DECIMAL(10,2) DEFAULT 0,
    late_fee        DECIMAL(10,2) DEFAULT 0,
    total_amount    DECIMAL(12,2) GENERATED ALWAYS AS (rent_amount + maintenance_charges + late_fee) STORED,
    paid_amount     DECIMAL(12,2) DEFAULT 0,
    due_date        DATE NOT NULL,
    paid_at         TIMESTAMPTZ,
    status          invoice_status DEFAULT 'draft',
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE deposit_ledger (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lease_id        UUID NOT NULL REFERENCES lease_agreements(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL,          -- deposit_received, deduction, refund, interest
    amount          DECIMAL(12,2) NOT NULL,
    description     TEXT,
    transaction_date TIMESTAMPTZ DEFAULT now(),
    created_by      UUID REFERENCES users(id)
);

CREATE TABLE move_out_checklist (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lease_id        UUID NOT NULL REFERENCES lease_agreements(id) ON DELETE CASCADE,
    item            VARCHAR(255) NOT NULL,
    condition       VARCHAR(50),                    -- good, damaged, missing
    photo_url       TEXT,
    is_verified     BOOLEAN DEFAULT false,
    verified_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_lease_unit ON lease_agreements(unit_id);
CREATE INDEX idx_lease_tenant ON lease_agreements(tenant_id);
CREATE INDEX idx_lease_status ON lease_agreements(status);
CREATE INDEX idx_rent_invoice_lease ON rent_invoices(lease_id);
CREATE INDEX idx_rent_invoice_status ON rent_invoices(status);
