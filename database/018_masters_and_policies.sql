-- Additional Masters & Policy Document Repository

-- 1. HR Masters
CREATE TABLE holiday_calendar (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id     UUID REFERENCES properties(id),
    name            VARCHAR(255) NOT NULL,
    date            DATE NOT NULL,
    type            VARCHAR(50) DEFAULT 'public',  -- public, optional, restricted
    applicable_to   VARCHAR(100) DEFAULT 'all',    -- all, specific departments
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE(property_id, date)
);

CREATE TABLE overtime_policies (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id     UUID REFERENCES properties(id),
    name            VARCHAR(255) NOT NULL,
    multiplier      DECIMAL(3,1) DEFAULT 1.5,       -- e.g., 1.5x, 2.0x
    min_hours       INT DEFAULT 1,                  -- min hours to qualify
    max_hours_per_day INT DEFAULT 4,
    applicable_shifts TEXT,                          -- comma-separated shift IDs or 'all'
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE attendance_policies (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id     UUID REFERENCES properties(id),
    name            VARCHAR(255) NOT NULL,
    late_threshold  INT DEFAULT 15,                  -- minutes after shift start = late
    half_day_threshold INT DEFAULT 120,              -- minutes late = half day
    early_exit_threshold INT DEFAULT 15,             -- minutes before shift end
    grace_period    INT DEFAULT 5,                   -- grace minutes
    requires_geo    BOOLEAN DEFAULT false,
    requires_face_auth BOOLEAN DEFAULT false,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE document_types (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    code            VARCHAR(50) UNIQUE,
    category        VARCHAR(50) DEFAULT 'employee',  -- employee, policy, compliance
    description     TEXT,
    is_mandatory    BOOLEAN DEFAULT false,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- 2. HR Policy Document Repository
CREATE TABLE policy_documents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id     UUID REFERENCES properties(id),
    category        VARCHAR(100) NOT NULL,            -- policy, form, handbook, compliance, training
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    department      VARCHAR(100) DEFAULT 'all',
    file_name       VARCHAR(255),
    file_type       VARCHAR(100),                     -- MIME type
    file_size       INT,                              -- bytes
    file_content    TEXT,                              -- base64 encoded
    effective_date  DATE,
    version         VARCHAR(20) DEFAULT '1.0',
    uploaded_by     UUID REFERENCES users(id),
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- 3. Finance Masters
CREATE TABLE tax_slabs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    tax_type        VARCHAR(50) NOT NULL,             -- gst, tds, income_tax
    rate            DECIMAL(5,2) NOT NULL,
    min_amount      DECIMAL(12,2) DEFAULT 0,
    max_amount      DECIMAL(12,2),
    description     TEXT,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE payment_modes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    code            VARCHAR(50) UNIQUE,
    type            VARCHAR(50) DEFAULT 'online',     -- online, offline, wallet
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- 4. Hospitality Masters
CREATE TABLE booking_sources (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    code            VARCHAR(50) UNIQUE,
    commission_pct  DECIMAL(5,2) DEFAULT 0,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- rate_plans already exists in 004_reservation_booking.sql

CREATE TABLE id_proof_types (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    code            VARCHAR(50) UNIQUE,
    is_mandatory    BOOLEAN DEFAULT false,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- 5. Maintenance Masters
CREATE TABLE asset_categories (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    code            VARCHAR(50) UNIQUE,
    description     TEXT,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- 6. Procurement Masters
CREATE TABLE uom (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(100) NOT NULL,            -- full name
    code            VARCHAR(20) UNIQUE,               -- abbreviation
    description     TEXT,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- 7. Geographic Reference Data
CREATE TABLE countries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    code            VARCHAR(3) UNIQUE,                -- ISO 3166-1 alpha-3
    phone_code      VARCHAR(10),
    currency        VARCHAR(3),
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE states (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_id      UUID NOT NULL REFERENCES countries(id),
    name            VARCHAR(255) NOT NULL,
    code            VARCHAR(10),                      -- state code
    tax_region      VARCHAR(50),                      -- for GST/PT calculation
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE(country_id, name)
);

CREATE TABLE cities (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    state_id        UUID NOT NULL REFERENCES states(id),
    name            VARCHAR(255) NOT NULL,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE(state_id, name)
);

CREATE INDEX idx_holiday_date ON holiday_calendar(date);
CREATE INDEX idx_policy_documents_category ON policy_documents(category);
CREATE INDEX idx_tax_slabs_type ON tax_slabs(tax_type);

-- Seed data: Common document types
INSERT INTO document_types (name, code, category, is_mandatory) VALUES
  ('Aadhaar Card', 'AADHAAR', 'employee', true),
  ('PAN Card', 'PAN', 'employee', true),
  ('Bank Account Proof', 'BANK_PROOF', 'employee', true),
  ('Previous Employment Letter', 'EXP_LETTER', 'employee', false),
  ('Educational Certificates', 'EDUCATION', 'employee', false),
  ('Experience Certificates', 'EXPERIENCE', 'employee', false),
  ('Passport Photo', 'PHOTO', 'employee', true),
  ('Employment Contract', 'CONTRACT', 'policy', true),
  ('NDA Agreement', 'NDA', 'policy', true),
  ('Company Handbook Acknowledgment', 'HANDBOOK', 'policy', false)
ON CONFLICT (code) DO NOTHING;

-- Seed data: Common payment modes
INSERT INTO payment_modes (name, code, type) VALUES
  ('Cash', 'CASH', 'offline'),
  ('Credit Card', 'CREDIT_CARD', 'online'),
  ('Debit Card', 'DEBIT_CARD', 'online'),
  ('UPI', 'UPI', 'online'),
  ('Net Banking', 'NET_BANKING', 'online'),
  ('Bank Transfer', 'BANK_TRANSFER', 'offline'),
  ('Wallet', 'WALLET', 'wallet'),
  ('Cheque', 'CHEQUE', 'offline')
ON CONFLICT (code) DO NOTHING;

-- Seed data: Common booking sources
INSERT INTO booking_sources (name, code, commission_pct) VALUES
  ('Direct', 'DIRECT', 0),
  ('MakeMyTrip', 'MMT', 15),
  ('GoIbibo', 'GOIBIBO', 12),
  ('Booking.com', 'BOOKING', 18),
  ('Expedia', 'EXPEDIA', 20),
  ('Agoda', 'AGODA', 16),
  ('Airbnb', 'AIRBNB', 10)
ON CONFLICT (code) DO NOTHING;

-- Seed data: Common ID proof types
INSERT INTO id_proof_types (name, code, is_mandatory) VALUES
  ('Aadhaar Card', 'AADHAAR', true),
  ('Passport', 'PASSPORT', true),
  ('Driver License', 'DL', false),
  ('Voter ID', 'VOTER_ID', false),
  ('PAN Card', 'PAN', false)
ON CONFLICT (code) DO NOTHING;

-- Seed data: Asset categories
INSERT INTO asset_categories (name, code) VALUES
  ('Electrical', 'ELECTRICAL'),
  ('Plumbing', 'PLUMBING'),
  ('HVAC', 'HVAC'),
  ('Furniture', 'FURNITURE'),
  ('IT Equipment', 'IT_EQPT'),
  ('Vehicles', 'VEHICLE'),
  ('Building', 'BUILDING'),
  ('Safety Equipment', 'SAFETY')
ON CONFLICT (code) DO NOTHING;

-- Seed data: UOM
INSERT INTO uom (name, code) VALUES
  ('Piece', 'PCS'),
  ('Kilogram', 'KG'),
  ('Gram', 'G'),
  ('Liter', 'LTR'),
  ('Milliliter', 'ML'),
  ('Meter', 'M'),
  ('Square Meter', 'SQM'),
  ('Box', 'BOX'),
  ('Pack', 'PKT'),
  ('Dozen', 'DOZ')
ON CONFLICT (code) DO NOTHING;

-- Seed data: Countries, States, Cities (India)
INSERT INTO countries (name, code, phone_code, currency) VALUES
  ('India', 'IND', '+91', 'INR')
ON CONFLICT (code) DO NOTHING;

INSERT INTO states (country_id, name, code, tax_region)
SELECT c.id, s.name, s.code, s.tax_region
FROM countries c
CROSS JOIN (VALUES
  ('Tamil Nadu', 'TN', 'south'),
  ('Karnataka', 'KA', 'south'),
  ('Kerala', 'KL', 'south'),
  ('Andhra Pradesh', 'AP', 'south'),
  ('Telangana', 'TS', 'south'),
  ('Maharashtra', 'MH', 'west'),
  ('Gujarat', 'GJ', 'west'),
  ('Rajasthan', 'RJ', 'north'),
  ('Uttar Pradesh', 'UP', 'north'),
  ('Delhi', 'DL', 'north'),
  ('West Bengal', 'WB', 'east'),
  ('Puducherry', 'PY', 'south')
) AS s(name, code, tax_region)
WHERE c.code = 'IND'
ON CONFLICT DO NOTHING;

INSERT INTO cities (state_id, name)
SELECT st.id, c.name
FROM states st
CROSS JOIN (VALUES
  ('Tamil Nadu', 'Chennai'), ('Tamil Nadu', 'Coimbatore'), ('Tamil Nadu', 'Madurai'),
  ('Karnataka', 'Bengaluru'), ('Karnataka', 'Mysuru'), ('Karnataka', 'Mangaluru'),
  ('Kerala', 'Kochi'), ('Kerala', 'Thiruvananthapuram'), ('Kerala', 'Kozhikode'),
  ('Maharashtra', 'Mumbai'), ('Maharashtra', 'Pune'), ('Maharashtra', 'Nagpur'),
  ('Delhi', 'New Delhi'), ('Delhi', 'Delhi'),
  ('West Bengal', 'Kolkata'), ('West Bengal', 'Siliguri')
) AS c(state_name, name)
WHERE st.name = c.state_name
ON CONFLICT DO NOTHING;

-- Seed data: Tax slabs
INSERT INTO tax_slabs (name, tax_type, rate, min_amount, max_amount) VALUES
  ('GST 0%', 'gst', 0, 0, NULL),
  ('GST 5%', 'gst', 5, 0, NULL),
  ('GST 12%', 'gst', 12, 0, NULL),
  ('GST 18%', 'gst', 18, 0, NULL),
  ('GST 28%', 'gst', 28, 0, NULL),
  ('TDS < 2.5L', 'tds', 0, 0, 250000),
  ('TDS 2.5L-5L', 'tds', 5, 250000, 500000),
  ('TDS 5L-10L', 'tds', 20, 500000, 1000000),
  ('TDS > 10L', 'tds', 30, 1000000, NULL)
ON CONFLICT DO NOTHING;

-- Seed data: Holiday calendar (India 2026)
INSERT INTO holiday_calendar (property_id, name, date, type)
SELECT p.id, h.name, h.date, h.type
FROM properties p
CROSS JOIN (VALUES
  ('Republic Day', '2026-01-26'::date, 'public'),
  ('Holi', '2026-03-13'::date, 'public'),
  ('Good Friday', '2026-04-03'::date, 'public'),
  ('Independence Day', '2026-08-15'::date, 'public'),
  ('Gandhi Jayanti', '2026-10-02'::date, 'public'),
  ('Diwali', '2026-10-31'::date, 'public'),
  ('Christmas', '2026-12-25'::date, 'public')
) AS h(name, date, type)
WHERE p.code = 'OVH'
ON CONFLICT DO NOTHING;

-- Seed data: Overtime policies
INSERT INTO overtime_policies (property_id, name, multiplier, min_hours, max_hours_per_day, applicable_shifts)
SELECT p.id, op.name, op.multiplier, op.min_hours, op.max_hours_per_day, op.applicable_shifts
FROM properties p
CROSS JOIN (VALUES
  ('Weekday Overtime', 1.5, 1, 4, 'all'),
  ('Weekend Overtime', 2.0, 1, 4, 'all'),
  ('Holiday Overtime', 2.5, 1, 4, 'all')
) AS op(name, multiplier, min_hours, max_hours_per_day, applicable_shifts)
WHERE p.code = 'OVH'
ON CONFLICT DO NOTHING;

-- Seed data: Attendance policy
INSERT INTO attendance_policies (property_id, name, late_threshold, half_day_threshold, early_exit_threshold, grace_period)
SELECT p.id, 'Standard', 15, 120, 15, 5
FROM properties p
WHERE p.code = 'OVH'
ON CONFLICT DO NOTHING;

-- 8. Appraisal, Increment & Promotion Tables
CREATE TABLE appraisal_cycles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id     UUID REFERENCES properties(id),
    name            VARCHAR(255) NOT NULL,
    cycle_type      VARCHAR(50) DEFAULT 'annual',     -- annual, half_yearly, quarterly
    period_start    DATE NOT NULL,
    period_end      DATE NOT NULL,
    rating_scale    INT DEFAULT 5,                     -- 1-5, 1-10, etc.
    status          VARCHAR(50) DEFAULT 'draft',       -- draft, active, closed
    created_by      UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE appraisal_goals (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cycle_id        UUID NOT NULL REFERENCES appraisal_cycles(id) ON DELETE CASCADE,
    employee_id     UUID NOT NULL REFERENCES employees(id),
    goal            TEXT NOT NULL,
    weightage       DECIMAL(5,2) DEFAULT 100,           -- percentage weight
    target_date     DATE,
    status          VARCHAR(50) DEFAULT 'pending',      -- pending, achieved, partially_achieved, not_achieved
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE appraisal_reviews (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cycle_id        UUID NOT NULL REFERENCES appraisal_cycles(id) ON DELETE CASCADE,
    employee_id     UUID NOT NULL REFERENCES employees(id),
    reviewer_id     UUID NOT NULL REFERENCES users(id),
    self_rating     DECIMAL(3,1),
    reviewer_rating DECIMAL(3,1),
    final_rating    DECIMAL(3,1),
    self_comment    TEXT,
    reviewer_comment TEXT,
    overall_score   DECIMAL(5,2),
    status          VARCHAR(50) DEFAULT 'pending',      -- pending, self_submitted, reviewed, completed
    submitted_at    TIMESTAMPTZ,
    reviewed_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE(cycle_id, employee_id)
);

CREATE TABLE increments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id     UUID NOT NULL REFERENCES employees(id),
    appraisal_id    UUID REFERENCES appraisal_reviews(id),
    current_ctc     DECIMAL(12,2) NOT NULL,
    new_ctc         DECIMAL(12,2) NOT NULL,
    increment_amount DECIMAL(12,2) GENERATED ALWAYS AS (new_ctc - current_ctc) STORED,
    increment_pct   DECIMAL(5,2) NOT NULL,
    effective_date  DATE NOT NULL,
    reason          TEXT,
    approved_by     UUID REFERENCES users(id),
    approved_at     TIMESTAMPTZ,
    status          VARCHAR(50) DEFAULT 'draft',        -- draft, approved, paid
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE employee_promotions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id     UUID NOT NULL REFERENCES employees(id),
    from_designation VARCHAR(255),
    to_designation  VARCHAR(255) NOT NULL,
    from_band_id    UUID REFERENCES employee_bands(id),
    to_band_id      UUID REFERENCES employee_bands(id),
    from_ctc        DECIMAL(12,2),
    to_ctc          DECIMAL(12,2),
    effective_date  DATE NOT NULL,
    reason          TEXT,
    approved_by     UUID REFERENCES users(id),
    approved_at     TIMESTAMPTZ,
    status          VARCHAR(50) DEFAULT 'draft',        -- draft, approved, effected
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_appraisal_cycle ON appraisal_reviews(cycle_id);
CREATE INDEX idx_appraisal_employee ON appraisal_reviews(employee_id);
CREATE INDEX idx_increments_employee ON increments(employee_id);
CREATE INDEX idx_promotions_employee ON employee_promotions(employee_id);

-- Seed: Sample appraisal cycle
INSERT INTO appraisal_cycles (property_id, name, cycle_type, period_start, period_end, status)
SELECT p.id, 'Annual Review 2026', 'annual', '2026-01-01'::date, '2026-12-31'::date, 'draft'
FROM properties p
WHERE p.code = 'OVH'
ON CONFLICT DO NOTHING;
