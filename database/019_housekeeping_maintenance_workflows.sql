-- Housekeeping & Maintenance Workflow Enhancements

-- 1. Linen Item Tracking (individual item lifecycle)
CREATE TABLE IF NOT EXISTS linen_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id     UUID REFERENCES properties(id),
    batch_id        UUID REFERENCES linen_batches(id),
    rfid_tag        VARCHAR(100) UNIQUE,
    item_type       VARCHAR(100) NOT NULL,
    status          VARCHAR(50) DEFAULT 'in_stock',  -- in_stock, in_use, in_laundry, damaged, lost
    assigned_unit   UUID REFERENCES units(id),
    last_cleaned    TIMESTAMPTZ,
    lifecycle_count INT DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- 2. Housekeeping Inspections (quality control)
CREATE TABLE IF NOT EXISTS housekeeping_inspections (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id         UUID REFERENCES housekeeping_tasks(id) ON DELETE CASCADE,
    unit_id         UUID REFERENCES units(id),
    inspector_id    UUID REFERENCES users(id),
    score           DECIMAL(5,2),
    status          VARCHAR(50) DEFAULT 'pending',  -- pending, passed, failed, conditional_pass
    notes           TEXT,
    checklist_items JSONB DEFAULT '[]',             -- [{item: string, passed: bool, note: string}]
    inspected_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- 3. Maintenance Ticket Parts Usage
CREATE TABLE IF NOT EXISTS maintenance_ticket_parts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id       UUID NOT NULL REFERENCES maintenance_tickets(id) ON DELETE CASCADE,
    part_id         UUID REFERENCES parts_inventory(id),
    part_name       VARCHAR(255) NOT NULL,
    quantity        INT NOT NULL DEFAULT 1,
    unit_price      DECIMAL(10,2) DEFAULT 0,
    total_price     DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- 4. Maintenance Time Tracking
CREATE TABLE IF NOT EXISTS maintenance_time_entries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id       UUID NOT NULL REFERENCES maintenance_tickets(id) ON DELETE CASCADE,
    technician_id   UUID REFERENCES users(id),
    start_time      TIMESTAMPTZ NOT NULL,
    end_time        TIMESTAMPTZ,
    duration_minutes INT GENERATED ALWAYS AS (COALESCE(EXTRACT(EPOCH FROM (end_time - start_time)) / 60, 0)) STORED,
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- 5. Maintenance Approval Workflow Log
CREATE TABLE IF NOT EXISTS maintenance_approvals (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id       UUID NOT NULL REFERENCES maintenance_tickets(id) ON DELETE CASCADE,
    action          VARCHAR(50) NOT NULL,           -- assigned, approved, rejected, closed
    performed_by    UUID REFERENCES users(id),
    comment         TEXT,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_linen_status ON linen_items(status);
CREATE INDEX idx_hk_inspections_task ON housekeeping_inspections(task_id);
CREATE INDEX idx_hk_inspections_unit ON housekeeping_inspections(unit_id);
CREATE INDEX idx_ticket_parts_ticket ON maintenance_ticket_parts(ticket_id);
CREATE INDEX idx_maintenance_time_ticket ON maintenance_time_entries(ticket_id);
CREATE INDEX idx_maintenance_approvals_ticket ON maintenance_approvals(ticket_id);
