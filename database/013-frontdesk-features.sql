-- 013-frontdesk-features.sql

-- 1. Parking Allocations
CREATE TABLE parking_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    vehicle_number VARCHAR(50),
    slot_number VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'released')),
    allocated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    released_at TIMESTAMPTZ
);

-- 2. Guest Requests & Complaints
CREATE TABLE guest_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    request_type VARCHAR(50) CHECK (request_type IN ('room_service', 'maintenance', 'housekeeping', 'complaint', 'other')),
    description TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'cancelled')),
    assigned_to_dept VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMPTZ
);

-- 3. Promotions & Offers
CREATE TABLE promotions_offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    offer_code VARCHAR(50) NOT NULL,
    discount_type VARCHAR(20) CHECK (discount_type IN ('percentage', 'fixed_amount', 'upgrade', 'complimentary')),
    discount_value DECIMAL(10,2),
    title VARCHAR(100) NOT NULL,
    description TEXT,
    valid_from TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true
);

-- 4. Check-in Checklists
CREATE TABLE checkin_checklists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE UNIQUE,
    checklist_items JSONB NOT NULL DEFAULT '{}'::jsonb,
    verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. Guest Feedback
CREATE TABLE guest_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    department VARCHAR(50) CHECK (department IN ('front_desk', 'housekeeping', 'maintenance', 'f_and_b', 'overall')),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comments TEXT,
    submitted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Insert dummy promotions for demo
INSERT INTO promotions_offers (property_id, offer_code, discount_type, discount_value, title, description, valid_until)
SELECT p.id, 'SPA10', 'percentage', 10, '10% Off Spa Services', 'Get 10% off any massage or spa treatment.', NOW() + INTERVAL '30 days'
FROM properties p WHERE p.code = 'OVH';

INSERT INTO promotions_offers (property_id, offer_code, discount_type, discount_value, title, description, valid_until)
SELECT p.id, 'UPG50', 'fixed_amount', 50, '$50 Suite Upgrade', 'Upgrade to a suite for only $50/night.', NOW() + INTERVAL '15 days'
FROM properties p WHERE p.code = 'OVH';
