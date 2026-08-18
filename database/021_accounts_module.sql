-- eHMS Accounts Module Extension (BRD Section 3.8 — Full GL, AP, AR, Budget, Fixed Assets, Tax)
-- Extends 005_finance_gl.sql with complete accounting workflows

-- 1. Accounting Periods / Fiscal Years
CREATE TABLE fiscal_years (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id     UUID NOT NULL REFERENCES properties(id),
    name            VARCHAR(100) NOT NULL,           -- e.g. "FY 2026-27"
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    is_closed       BOOLEAN DEFAULT false,
    closed_at       TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- 2. Extend chart_of_accounts with sub-type and active flag
ALTER TABLE chart_of_accounts ADD COLUMN IF NOT EXISTS sub_type VARCHAR(50);
ALTER TABLE chart_of_accounts ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE chart_of_accounts ADD COLUMN IF NOT EXISTS opening_balance DECIMAL(14,2) DEFAULT 0;
ALTER TABLE chart_of_accounts ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE chart_of_accounts ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- 3. Cost Centers for departmental P&L
CREATE TABLE cost_centers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id     UUID NOT NULL REFERENCES properties(id),
    code            VARCHAR(20) NOT NULL,
    name            VARCHAR(255) NOT NULL,
    department_id   UUID REFERENCES departments(id),
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE(property_id, code)
);

-- 4. Extend journal_entries with period tracking
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS fiscal_period_id UUID REFERENCES fiscal_years(id);
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS is_adjusting BOOLEAN DEFAULT false;
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS journal_type VARCHAR(50) DEFAULT 'general';  -- general, sales, purchase, cash, contra
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 5. Vendor Bills (Accounts Payable)
CREATE TABLE vendor_bills (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id     UUID NOT NULL REFERENCES properties(id),
    vendor_id       UUID NOT NULL REFERENCES vendors(id),
    bill_number     VARCHAR(100) NOT NULL,
    bill_date       DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date        DATE NOT NULL,
    category        VARCHAR(100),                    -- supplies, service, utility, rent, etc.
    subtotal        DECIMAL(12,2) DEFAULT 0,
    tax_total       DECIMAL(12,2) DEFAULT 0,
    grand_total     DECIMAL(12,2) DEFAULT 0,
    paid_total      DECIMAL(12,2) DEFAULT 0,
    balance_due     DECIMAL(12,2) GENERATED ALWAYS AS (grand_total - COALESCE(paid_total, 0)) STORED,
    status          VARCHAR(50) DEFAULT 'pending',    -- pending, approved, paid, cancelled, overdue
    notes           TEXT,
    created_by      UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE bill_line_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_id         UUID NOT NULL REFERENCES vendor_bills(id) ON DELETE CASCADE,
    description     VARCHAR(500) NOT NULL,
    quantity        DECIMAL(10,2) DEFAULT 1,
    unit_price      DECIMAL(12,2) NOT NULL,
    tax_rate        DECIMAL(5,2) DEFAULT 0,
    line_total      DECIMAL(14,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    account_id      UUID REFERENCES chart_of_accounts(id),
    cost_center_id  UUID REFERENCES cost_centers(id)
);

-- 6. Bill Payments (AP Payments)
CREATE TABLE bill_payments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id     UUID NOT NULL REFERENCES properties(id),
    bill_id         UUID NOT NULL REFERENCES vendor_bills(id),
    payment_method  VARCHAR(50) NOT NULL,
    reference_number VARCHAR(255),
    amount          DECIMAL(12,2) NOT NULL,
    payment_date    TIMESTAMPTZ DEFAULT now(),
    status          VARCHAR(50) DEFAULT 'completed',  -- completed, pending, failed, reversed
    notes           TEXT,
    created_by      UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- 7. Budget Management
CREATE TABLE budget_heads (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id     UUID NOT NULL REFERENCES properties(id),
    code            VARCHAR(20) NOT NULL,
    name            VARCHAR(255) NOT NULL,
    account_id      UUID REFERENCES chart_of_accounts(id),
    is_active       BOOLEAN DEFAULT true,
    UNIQUE(property_id, code)
);

CREATE TABLE budget_entries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    budget_head_id  UUID NOT NULL REFERENCES budget_heads(id) ON DELETE CASCADE,
    fiscal_year_id  UUID NOT NULL REFERENCES fiscal_years(id),
    period_month    INT NOT NULL CHECK (period_month BETWEEN 1 AND 12),
    budget_amount   DECIMAL(14,2) NOT NULL DEFAULT 0,
    actual_amount   DECIMAL(14,2) DEFAULT 0,          -- updated via trigger or periodic refresh
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE(budget_head_id, fiscal_year_id, period_month)
);

-- 8. Fixed Assets Register
CREATE TABLE fixed_assets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id     UUID NOT NULL REFERENCES properties(id),
    asset_code      VARCHAR(50) NOT NULL UNIQUE,
    asset_name      VARCHAR(255) NOT NULL,
    category        VARCHAR(100),                     -- furniture, equipment, vehicle, building, it, leasehold
    purchase_date   DATE NOT NULL,
    purchase_cost   DECIMAL(14,2) NOT NULL,
    salvage_value   DECIMAL(14,2) DEFAULT 0,
    useful_life_yrs INT NOT NULL,                     -- e.g. 5, 10, 15
    depreciation_method VARCHAR(50) DEFAULT 'straight_line',  -- straight_line, declining, sum_of_years
    accumulated_dep  DECIMAL(14,2) DEFAULT 0,
    book_value       DECIMAL(14,2) GENERATED ALWAYS AS (purchase_cost - COALESCE(accumulated_dep, 0)) STORED,
    status          VARCHAR(50) DEFAULT 'active',     -- active, disposed, sold, fully_depreciated
    location        VARCHAR(255),
    assigned_to     UUID REFERENCES employees(id),
    account_id      UUID REFERENCES chart_of_accounts(id),
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

-- 9. Depreciation Schedule
CREATE TABLE depreciation_schedule (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id        UUID NOT NULL REFERENCES fixed_assets(id) ON DELETE CASCADE,
    period_date     DATE NOT NULL,
    amount          DECIMAL(14,2) NOT NULL,
    is_posted       BOOLEAN DEFAULT false,
    journal_id      UUID REFERENCES journal_entries(id),
    created_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE(asset_id, period_date)
);

-- 10. Tax Management
CREATE TABLE tax_filings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id     UUID NOT NULL REFERENCES properties(id),
    tax_type        VARCHAR(50) NOT NULL,              -- gst, tds, income_tax, professional_tax
    return_type     VARCHAR(50),                       -- monthly, quarterly, annual
    period_start    DATE NOT NULL,
    period_end      DATE NOT NULL,
    filing_date     DATE,
    due_date        DATE NOT NULL,
    total_liability DECIMAL(14,2) DEFAULT 0,
    total_paid      DECIMAL(14,2) DEFAULT 0,
    status          VARCHAR(50) DEFAULT 'pending',     -- pending, filed, paid, overdue
    filed_by        UUID REFERENCES users(id),
    remarks         TEXT,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

-- 11. Invoice enhancement — extend invoices table with cost center & tax details
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS cost_center_id UUID REFERENCES cost_centers(id);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS invoice_type VARCHAR(50) DEFAULT 'sales';  -- sales, purchase, credit_note, debit_note
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 12. Payment enhancement
ALTER TABLE payments ADD COLUMN IF NOT EXISTS cost_center_id UUID REFERENCES cost_centers(id);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Indexes
CREATE INDEX idx_fiscal_years_property ON fiscal_years(property_id);
CREATE INDEX idx_cost_centers_property ON cost_centers(property_id);
CREATE INDEX idx_vendor_bills_property ON vendor_bills(property_id);
CREATE INDEX idx_vendor_bills_vendor ON vendor_bills(vendor_id);
CREATE INDEX idx_vendor_bills_status ON vendor_bills(status);
CREATE INDEX idx_bill_payments_bill ON bill_payments(bill_id);
CREATE INDEX idx_budget_heads_property ON budget_heads(property_id);
CREATE INDEX idx_budget_entries_head ON budget_entries(budget_head_id);
CREATE INDEX idx_budget_entries_period ON budget_entries(fiscal_year_id, period_month);
CREATE INDEX idx_fixed_assets_property ON fixed_assets(property_id);
CREATE INDEX idx_fixed_assets_status ON fixed_assets(status);
CREATE INDEX idx_depreciation_asset ON depreciation_schedule(asset_id);
CREATE INDEX idx_tax_filings_property ON tax_filings(property_id);
CREATE INDEX idx_tax_filings_type ON tax_filings(tax_type, status);
CREATE INDEX idx_chart_of_accounts_type ON chart_of_accounts(account_type, sub_type);
