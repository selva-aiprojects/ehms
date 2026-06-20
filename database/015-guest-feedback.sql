-- 015-guest-feedback.sql
-- Create guest feedback table for collecting department-specific ratings

CREATE TABLE IF NOT EXISTS guest_feedbacks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES properties(id),
    booking_id UUID REFERENCES bookings(id),
    guest_id UUID REFERENCES guest_profiles(id),
    department VARCHAR(50) NOT NULL, -- 'Front Desk', 'Housekeeping', 'F&B', 'Maintenance', 'Overall'
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indices for reporting
CREATE INDEX idx_guest_feedbacks_property ON guest_feedbacks(property_id);
CREATE INDEX idx_guest_feedbacks_booking ON guest_feedbacks(booking_id);
CREATE INDEX idx_guest_feedbacks_department ON guest_feedbacks(department);
