-- SAMP HRMS & Payroll (BRD Section 3.7)

CREATE TABLE departments (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id     UUID REFERENCES properties(id),
    name            VARCHAR(255) NOT NULL,
    code            VARCHAR(20),
    manager_id      UUID REFERENCES users(id)
);

CREATE TABLE employees (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    employee_code   VARCHAR(50) UNIQUE NOT NULL,
    department_id   UUID REFERENCES departments(id),
    designation     VARCHAR(100),
    employment_type VARCHAR(50) DEFAULT 'full_time', -- full_time, part_time, contract
    doj             DATE,
    base_salary     DECIMAL(12,2),
    bank_account    VARCHAR(100),
    bank_ifsc       VARCHAR(50),
    pan_number      VARCHAR(20),
    uan_number      VARCHAR(50),                    -- PF account
    esi_number      VARCHAR(50),
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE attendance_records (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id     UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    property_id     UUID REFERENCES properties(id),
    clock_in        TIMESTAMPTZ NOT NULL,
    clock_out       TIMESTAMPTZ,
    geo_lat_in      DECIMAL(10,7),
    geo_lng_in      DECIMAL(10,7),
    geo_lat_out     DECIMAL(10,7),
    geo_lng_out     DECIMAL(10,7),
    face_auth_id    VARCHAR(255),
    is_geofenced    BOOLEAN DEFAULT false,
    status          VARCHAR(50) DEFAULT 'present',  -- present, absent, late, half_day
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE payroll_runs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id     UUID REFERENCES properties(id),
    period_start    DATE NOT NULL,
    period_end      DATE NOT NULL,
    run_date        DATE NOT NULL DEFAULT CURRENT_DATE,
    status          VARCHAR(50) DEFAULT 'draft',    -- draft, computed, approved, paid
    total_gross     DECIMAL(14,2),
    total_deductions DECIMAL(14,2),
    total_net       DECIMAL(14,2),
    processed_by    UUID REFERENCES users(id),
    approved_by     UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE payroll_lines (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payroll_id      UUID NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
    employee_id     UUID NOT NULL REFERENCES employees(id),
    gross_pay       DECIMAL(12,2),
    pf_deduction    DECIMAL(10,2),
    esi_deduction   DECIMAL(10,2),
    pt_deduction    DECIMAL(10,2),
    tds_deduction   DECIMAL(10,2),
    other_deductions DECIMAL(10,2),
    net_pay         DECIMAL(12,2) GENERATED ALWAYS AS (
        gross_pay - pf_deduction - esi_deduction - pt_deduction - tds_deduction - other_deductions
    ) STORED,
    overtime_hours  DECIMAL(5,2),
    overtime_amount DECIMAL(10,2)
);

CREATE TABLE shift_rotations (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id     UUID REFERENCES properties(id),
    name            VARCHAR(100) NOT NULL,
    start_time      TIME NOT NULL,
    end_time        TIME NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_attendance_employee ON attendance_records(employee_id);
CREATE INDEX idx_attendance_date ON attendance_records(clock_in);
CREATE INDEX idx_payroll_period ON payroll_runs(period_start, period_end);
