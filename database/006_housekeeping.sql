-- SAMP Housekeeping & Linen (BRD Section 3.4)

CREATE TABLE housekeeping_tasks (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unit_id         UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    property_id     UUID NOT NULL REFERENCES properties(id),
    assigned_to     UUID REFERENCES users(id),
    assigned_by     UUID REFERENCES users(id),
    task_type       VARCHAR(50) NOT NULL,           -- deep_clean, stayover_tidy, turnaround, inspection
    priority        ticket_priority DEFAULT 'medium',
    status          ticket_status DEFAULT 'open',
    scheduled_at    TIMESTAMPTZ,
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE housekeeping_checklists (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id         UUID NOT NULL REFERENCES housekeeping_tasks(id) ON DELETE CASCADE,
    item            VARCHAR(255) NOT NULL,
    is_checked      BOOLEAN DEFAULT false,
    checked_at      TIMESTAMPTZ,
    checked_by      UUID REFERENCES users(id)
);

CREATE TABLE linen_batches (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id        VARCHAR(100) UNIQUE NOT NULL,
    property_id     UUID NOT NULL REFERENCES properties(id),
    item_type       VARCHAR(100) NOT NULL,          -- bedsheet, towel, pillowcase, duvet
    quantity        INT NOT NULL,
    lifecycle_stage VARCHAR(50) DEFAULT 'in_use',  -- in_use, soiled, dispatched, received, scrapped
    vendor_id       UUID,
    last_updated    TIMESTAMPTZ DEFAULT now(),
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE linen_transactions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id        UUID NOT NULL REFERENCES linen_batches(id) ON DELETE CASCADE,
    from_stage      VARCHAR(50) NOT NULL,
    to_stage        VARCHAR(50) NOT NULL,
    quantity        INT NOT NULL,
    unit_id         UUID REFERENCES units(id),
    logged_by       UUID REFERENCES users(id),
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_hk_unit ON housekeeping_tasks(unit_id);
CREATE INDEX idx_hk_status ON housekeeping_tasks(status);
CREATE INDEX idx_hk_assigned ON housekeeping_tasks(assigned_to);
CREATE INDEX idx_linen_stage ON linen_batches(lifecycle_stage);
