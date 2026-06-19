-- SAMP Maintenance & Asset Management (BRD Section 3.5)

CREATE TABLE maintenance_tickets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id     UUID NOT NULL REFERENCES properties(id),
    unit_id         UUID REFERENCES units(id),
    asset_id        UUID REFERENCES asset_register(id),
    ticket_number   VARCHAR(50) UNIQUE NOT NULL,
    ticket_type     VARCHAR(50) NOT NULL,           -- preventive, corrective, amc
    category        VARCHAR(100),                    -- HVAC, Plumbing, Electrical, etc.
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    priority        ticket_priority DEFAULT 'medium',
    status          ticket_status DEFAULT 'open',
    reported_by     UUID REFERENCES users(id),
    assigned_to     UUID REFERENCES users(id),
    vendor_id       UUID,
    amc_id          UUID,
    photos          TEXT[],                         -- URLs
    scheduled_date  TIMESTAMPTZ,
    resolved_at     TIMESTAMPTZ,
    resolution_notes TEXT,
    cost_parts      DECIMAL(10,2) DEFAULT 0,
    cost_labor      DECIMAL(10,2) DEFAULT 0,
    total_cost      DECIMAL(10,2) GENERATED ALWAYS AS (cost_parts + cost_labor) STORED,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE amc_contracts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id     UUID NOT NULL REFERENCES properties(id),
    vendor_id       UUID,
    contract_name   VARCHAR(255) NOT NULL,
    contract_ref    VARCHAR(100),
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    coverage        JSONB DEFAULT '{}',             -- asset types covered
    value           DECIMAL(12,2),
    status          VARCHAR(50) DEFAULT 'active',
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE preventive_schedules (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id     UUID NOT NULL REFERENCES properties(id),
    asset_type      VARCHAR(100),
    frequency_days  INT NOT NULL,
    task_template   TEXT NOT NULL,
    last_run        TIMESTAMPTZ,
    next_due        TIMESTAMPTZ NOT NULL,
    is_active       BOOLEAN DEFAULT true
);

CREATE TABLE parts_inventory (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id     UUID NOT NULL REFERENCES properties(id),
    part_name       VARCHAR(255) NOT NULL,
    part_code       VARCHAR(100),
    quantity_in_stock INT DEFAULT 0,
    reorder_level   INT DEFAULT 5,
    unit_price      DECIMAL(10,2),
    vendor_id       UUID,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_maint_property ON maintenance_tickets(property_id);
CREATE INDEX idx_maint_status ON maintenance_tickets(status);
CREATE INDEX idx_maint_assigned ON maintenance_tickets(assigned_to);
CREATE INDEX idx_maint_priority ON maintenance_tickets(priority);
CREATE INDEX idx_amc_expiry ON amc_contracts(end_date);
CREATE INDEX idx_preventive_next ON preventive_schedules(next_due);
