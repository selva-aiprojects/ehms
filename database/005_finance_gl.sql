-- SAMP Finance & General Ledger (BRD Section 3.8)

CREATE TABLE chart_of_accounts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id     UUID REFERENCES properties(id),
    account_code    VARCHAR(20) NOT NULL,
    account_name    VARCHAR(255) NOT NULL,
    account_type    VARCHAR(50) NOT NULL,           -- asset, liability, income, expense, equity
    is_system       BOOLEAN DEFAULT false,
    parent_id       UUID REFERENCES chart_of_accounts(id),
    UNIQUE(property_id, account_code)
);

CREATE TABLE journal_entries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id     UUID NOT NULL REFERENCES properties(id),
    entry_date      DATE NOT NULL,
    reference_type  VARCHAR(50),                    -- booking, invoice, payment, adjustment
    reference_id    UUID,
    description     TEXT,
    created_by      UUID REFERENCES users(id),
    posted_at       TIMESTAMPTZ DEFAULT now(),
    is_posted       BOOLEAN DEFAULT true
);

CREATE TABLE journal_lines (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_id      UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id      UUID NOT NULL REFERENCES chart_of_accounts(id),
    debit           DECIMAL(14,2) DEFAULT 0,
    credit          DECIMAL(14,2) DEFAULT 0,
    description     TEXT
);

CREATE TABLE invoices (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id     UUID NOT NULL REFERENCES properties(id),
    booking_id      UUID REFERENCES bookings(id),
    guest_id        UUID REFERENCES guest_profiles(id),
    invoice_number  VARCHAR(50) UNIQUE NOT NULL,
    invoice_date    DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date        DATE NOT NULL,
    status          invoice_status DEFAULT 'draft',
    subtotal        DECIMAL(12,2),
    tax_total       DECIMAL(12,2),
    grand_total     DECIMAL(12,2),
    balance_due     DECIMAL(12,2) GENERATED ALWAYS AS (grand_total - COALESCE(paid_total, 0)) STORED,
    paid_total      DECIMAL(12,2) DEFAULT 0,
    currency        VARCHAR(3) DEFAULT 'INR',
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE invoice_lines (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id      UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description     VARCHAR(500) NOT NULL,
    quantity        INT DEFAULT 1,
    unit_price      DECIMAL(10,2) NOT NULL,
    tax_rate        DECIMAL(5,2) DEFAULT 0,
    line_total      DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    account_id      UUID REFERENCES chart_of_accounts(id)
);

CREATE TABLE payments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id      UUID REFERENCES invoices(id),
    booking_id      UUID REFERENCES bookings(id),
    property_id     UUID NOT NULL REFERENCES properties(id),
    payment_method  VARCHAR(50) NOT NULL,           -- card, upi, bank_transfer, cash, gateway
    gateway_ref     VARCHAR(255),
    amount          DECIMAL(12,2) NOT NULL,
    currency        VARCHAR(3) DEFAULT 'INR',
    payment_date    TIMESTAMPTZ DEFAULT now(),
    status          VARCHAR(50) DEFAULT 'completed',
    reconciliation_status VARCHAR(50) DEFAULT 'pending', -- pending, matched, unmatched
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE bank_reconciliation (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id     UUID NOT NULL REFERENCES properties(id),
    bank_ref        VARCHAR(255) NOT NULL,
    transaction_date DATE NOT NULL,
    amount          DECIMAL(12,2) NOT NULL,
    description     TEXT,
    matched_payment_id UUID REFERENCES payments(id),
    status          VARCHAR(50) DEFAULT 'unmatched',
    reconciled_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_invoices_booking ON invoices(booking_id);
CREATE INDEX idx_invoices_guest ON invoices(guest_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_payments_reconciliation ON payments(reconciliation_status);
