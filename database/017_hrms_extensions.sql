-- HRMS Extensions: Timesheets, Leave Management & Reporting Hierarchy

ALTER TABLE employees ADD COLUMN IF NOT EXISTS reporting_manager_id UUID REFERENCES employees(id);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS shift_id UUID REFERENCES shift_rotations(id);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS band_id UUID REFERENCES employee_bands(id);

CREATE TABLE leave_types (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(100) NOT NULL,
    code            VARCHAR(20) UNIQUE NOT NULL,
    description     TEXT,
    days_per_year   INT NOT NULL DEFAULT 0,
    carry_forward   BOOLEAN DEFAULT false,
    max_carry       INT DEFAULT 0,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE leave_balances (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id     UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    leave_type_id   UUID NOT NULL REFERENCES leave_types(id),
    total_allocated INT NOT NULL DEFAULT 0,
    used            INT NOT NULL DEFAULT 0,
    pending         INT NOT NULL DEFAULT 0,
    remaining       INT GENERATED ALWAYS AS (total_allocated - used - pending) STORED,
    period_year     INT NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
    created_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE(employee_id, leave_type_id, period_year)
);

CREATE TABLE leave_requests (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id     UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    leave_type_id   UUID NOT NULL REFERENCES leave_types(id),
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    total_days      INT NOT NULL,
    reason          TEXT,
    status          VARCHAR(20) DEFAULT 'pending',
    approved_by     UUID REFERENCES users(id),
    approved_at     TIMESTAMPTZ,
    reviewer_notes  TEXT,
    created_at      TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT chk_dates CHECK (end_date >= start_date)
);

CREATE TABLE timesheets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id     UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    date            DATE NOT NULL,
    clock_in        TIMESTAMPTZ,
    clock_out       TIMESTAMPTZ,
    total_hours     DECIMAL(5,2),
    break_hours     DECIMAL(4,2) DEFAULT 0,
    net_hours       DECIMAL(5,2) GENERATED ALWAYS AS (total_hours - break_hours) STORED,
    project         VARCHAR(255),
    task            TEXT,
    status          VARCHAR(20) DEFAULT 'draft',
    approved_by     UUID REFERENCES users(id),
    approved_at     TIMESTAMPTZ,
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE(employee_id, date)
);

CREATE INDEX idx_timesheets_employee_date ON timesheets(employee_id, date);
CREATE INDEX idx_timesheets_status ON timesheets(status);
CREATE INDEX idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);

INSERT INTO leave_types (name, code, description, days_per_year, carry_forward, max_carry) VALUES
  ('Annual Leave', 'ANNUAL', 'Planned vacation / annual leave', 18, true, 6),
  ('Sick Leave', 'SICK', 'Medical / health related absence', 12, false, 0),
  ('Casual Leave', 'CASUAL', 'Emergency / casual time off', 10, false, 0),
  ('Personal Leave', 'PERSONAL', 'Personal errands / family commitments', 6, false, 0),
  ('Maternity Leave', 'MATERNITY', 'Maternity / parental leave', 26, false, 0),
  ('Compensatory Off', 'COMPOFF', 'Compensation for overtime / holiday work', 8, true, 4)
ON CONFLICT (code) DO NOTHING;
