-- SAMP Core Schema: Multi-Tenant Foundation
-- Vertical Types: Hotel/Resort | Service Apartment | Rental Apartment | Workplace

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE vertical_type AS ENUM ('hotel', 'service_apartment', 'rental_apartment', 'workplace');
CREATE TYPE unit_type AS ENUM ('room', 'suite', 'apartment', 'desk', 'seat', 'meeting_room', 'cabin');
CREATE TYPE booking_model AS ENUM ('nightly', 'lease', 'membership', 'hourly');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show');
CREATE TYPE room_status AS ENUM ('vacant', 'occupied', 'dirty', 'cleaning', 'inspection', 'maintenance', 'reserved');
CREATE TYPE lease_status AS ENUM ('drafted', 'signed', 'active', 'renewal_due', 'renewed', 'terminated');
CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE ticket_status AS ENUM ('open', 'assigned', 'in_progress', 'resolved', 'closed');
CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue', 'cancelled', 'refunded');

-- ============================================================
-- ENTERPRISE HIERARCHY (BRD Section 3.1)
-- ============================================================
CREATE TABLE enterprises (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    code            VARCHAR(20) UNIQUE NOT NULL,
    logo_url        TEXT,
    tax_id          VARCHAR(50),
    currency        VARCHAR(3) DEFAULT 'INR',
    timezone        VARCHAR(50) DEFAULT 'Asia/Kolkata',
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE regions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enterprise_id   UUID NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    code            VARCHAR(20) NOT NULL,
    country         VARCHAR(100),
    state           VARCHAR(100),
    city            VARCHAR(100),
    created_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE(enterprise_id, code)
);

CREATE TABLE properties (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region_id       UUID NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    code            VARCHAR(20) NOT NULL,
    vertical_type   vertical_type NOT NULL,
    booking_model   booking_model NOT NULL,
    address         TEXT,
    latitude        DECIMAL(10,7),
    longitude       DECIMAL(10,7),
    phone           VARCHAR(20),
    email           VARCHAR(255),
    check_in_time   TIME DEFAULT '14:00',
    check_out_time  TIME DEFAULT '11:00',
    star_rating     INT CHECK (star_rating BETWEEN 1 AND 5),
    is_active       BOOLEAN DEFAULT true,
    config          JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE(region_id, code)
);

CREATE TABLE buildings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id     UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    code            VARCHAR(20) NOT NULL,
    floors          INT DEFAULT 1,
    year_built      INT,
    UNIQUE(property_id, code)
);

CREATE TABLE floors (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    building_id     UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,
    floor_number    INT NOT NULL,
    UNIQUE(building_id, floor_number)
);

-- ============================================================
-- UNITS / ROOMS / ASSETS (Core Inventory)
-- ============================================================
CREATE TABLE units (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    floor_id        UUID NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
    unit_type       unit_type NOT NULL,
    unit_label      VARCHAR(50) NOT NULL,         -- e.g. "101", "A-201"
    layout_type     VARCHAR(50),                   -- studio, 1BHK, 2BHK, open_plan
    sq_ft           DECIMAL(8,2),
    max_occupancy   INT DEFAULT 2,
    base_rate       DECIMAL(10,2),                -- nightly / monthly base price
    status          room_status DEFAULT 'vacant',
    is_active       BOOLEAN DEFAULT true,
    attributes      JSONB DEFAULT '{}',            -- mutable attributes
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE(floor_id, unit_label)
);

CREATE TABLE asset_register (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id         UUID REFERENCES units(id) ON DELETE SET NULL,
    property_id     UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    asset_type      VARCHAR(100) NOT NULL,         -- AC, TV, Smart Lock, Geyser
    brand           VARCHAR(100),
    model           VARCHAR(100),
    serial_number   VARCHAR(100) UNIQUE NOT NULL,
    purchase_date   DATE,
    warranty_months INT,
    warranty_expiry DATE GENERATED ALWAYS AS (purchase_date + make_interval(months => warranty_months)) STORED,
    depreciation_method VARCHAR(50),
    depreciation_rate DECIMAL(5,2),
    current_value   DECIMAL(10,2),
    status          VARCHAR(50) DEFAULT 'active',  -- active, maintenance, scrapped
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- COMPLIANCE VAULT (BRD Section 3.1)
-- ============================================================
CREATE TABLE compliance_records (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id     UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    certificate_type VARCHAR(100) NOT NULL,        -- fire_safety, liquor_license, RERA
    reference_number VARCHAR(255),
    issued_date     DATE,
    expiry_date     DATE NOT NULL,
    status          VARCHAR(50) DEFAULT 'active',
    document_url    TEXT,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_properties_vertical ON properties(vertical_type);
CREATE INDEX idx_properties_region ON properties(region_id);
CREATE INDEX idx_units_status ON units(status);
CREATE INDEX idx_units_floor ON units(floor_id);
CREATE INDEX idx_asset_register_property ON asset_register(property_id);
CREATE INDEX idx_compliance_expiry ON compliance_records(expiry_date);
