-- SAMP Vendor Ecosystem & Procurement (BRD Section 3.6)

CREATE TABLE vendors (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name    VARCHAR(255) NOT NULL,
    contact_person  VARCHAR(100),
    email           VARCHAR(255),
    phone           VARCHAR(20),
    tax_id          VARCHAR(50),
    gst_number      VARCHAR(50),
    insurance_cert  TEXT,
    bank_account    VARCHAR(100),
    bank_ifsc       VARCHAR(50),
    is_compliant    BOOLEAN DEFAULT false,
    status          VARCHAR(50) DEFAULT 'pending',  -- pending, approved, suspended
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE vendor_services (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id       UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    service_type    VARCHAR(100) NOT NULL,          -- housekeeping, laundry, hvac, electrical
    description     TEXT,
    rate            DECIMAL(10,2),
    rate_unit       VARCHAR(50),                    -- per_room, per_hour, per_visit
    is_active       BOOLEAN DEFAULT true
);

CREATE TABLE purchase_orders (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id     UUID NOT NULL REFERENCES properties(id),
    vendor_id       UUID REFERENCES vendors(id),
    po_number       VARCHAR(50) UNIQUE NOT NULL,
    po_date         DATE NOT NULL DEFAULT CURRENT_DATE,
    status          VARCHAR(50) DEFAULT 'draft',    -- draft, sent, approved, received, closed
    total_amount    DECIMAL(12,2),
    notes           TEXT,
    created_by      UUID REFERENCES users(id),
    approved_by     UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE purchase_order_lines (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    po_id           UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    item_description TEXT NOT NULL,
    quantity        INT NOT NULL,
    unit_price      DECIMAL(10,2) NOT NULL,
    line_total      DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    received_qty    INT DEFAULT 0
);

CREATE TABLE goods_received_notes (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    po_id           UUID NOT NULL REFERENCES purchase_orders(id),
    grn_number      VARCHAR(50) UNIQUE NOT NULL,
    received_date   DATE NOT NULL DEFAULT CURRENT_DATE,
    received_by     UUID REFERENCES users(id),
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE grn_lines (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grn_id          UUID NOT NULL REFERENCES goods_received_notes(id) ON DELETE CASCADE,
    po_line_id      UUID NOT NULL REFERENCES purchase_order_lines(id),
    received_qty    INT NOT NULL,
    accepted_qty    INT,
    rejected_qty    INT,
    rejection_reason TEXT
);

CREATE INDEX idx_vendor_status ON vendors(status);
CREATE INDEX idx_po_vendor ON purchase_orders(vendor_id);
CREATE INDEX idx_po_status ON purchase_orders(status);
