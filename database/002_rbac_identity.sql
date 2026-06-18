-- SAMP RBAC & Identity (BRD Section 2)

-- ============================================================
-- USERS & ROLES
-- ============================================================
CREATE TABLE roles (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(100) NOT NULL UNIQUE,
    description     TEXT,
    is_system       BOOLEAN DEFAULT false,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- Seed system roles
INSERT INTO roles (name, description, is_system) VALUES
    ('super_admin', 'Global system configuration & security', true),
    ('executive', 'Strategic analysis & approvals', true),
    ('property_manager', 'Property yield & compliance', true),
    ('front_desk', 'Check-in/out & reservations', true),
    ('housekeeping_supervisor', 'Task allocation & inspections', true),
    ('housekeeping_staff', 'Room cleaning & amenity logging', true),
    ('maintenance_staff', 'Asset repairs & preventive tasks', true),
    ('hr_manager', 'Attendance & payroll', true),
    ('finance_manager', 'GL, tax & reconciliations', true),
    ('security_staff', 'Parking & visitor control', true),
    ('vendor_user', 'Invoice & compliance upload', true),
    ('workplace_facility_manager', 'Desk & access management', true);

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    phone           VARCHAR(20),
    password_hash   TEXT NOT NULL,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100),
    avatar_url      TEXT,
    is_active       BOOLEAN DEFAULT true,
    mfa_enabled     BOOLEAN DEFAULT false,
    mfa_secret      TEXT,
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE user_roles (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id         UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    property_id     UUID REFERENCES properties(id) ON DELETE CASCADE,  -- NULL = global scope
    granted_at      TIMESTAMPTZ DEFAULT now(),
    granted_by      UUID REFERENCES users(id),
    UNIQUE(user_id, role_id, property_id)
);

-- ============================================================
-- AUDIT TRAIL (BRD Section 4.2)
-- ============================================================
CREATE TABLE audit_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES users(id),
    action          VARCHAR(50) NOT NULL,           -- CREATE, UPDATE, DELETE, READ
    entity_type     VARCHAR(100) NOT NULL,          -- booking, unit, invoice, etc.
    entity_id       UUID NOT NULL,
    old_state       JSONB,
    new_state       JSONB,
    ip_address      INET,
    user_agent      TEXT,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
