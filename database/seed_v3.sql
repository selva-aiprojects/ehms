-- =============================================================
-- eHMS Seed Data v3 - Comprehensive All-Vertical Staff, Roles, Bookings, & Revenue
-- =============================================================

-- ── 1. Greenwood Residency (GWR) Building, Floors, and Units ──
-- Insert Building T-A for GWR
INSERT INTO buildings (property_id, name, code, floors)
SELECT id, 'Tower A', 'T-A', 3 
FROM properties 
WHERE code = 'GWR'
ON CONFLICT (property_id, code) DO NOTHING;

-- Insert Floors for GWR
INSERT INTO floors (building_id, name, floor_number)
SELECT b.id, 'Floor ' || gs, gs
FROM buildings b
JOIN properties p ON b.property_id = p.id
CROSS JOIN generate_series(1, 3) gs
WHERE p.code = 'GWR' AND b.code = 'T-A'
ON CONFLICT (building_id, floor_number) DO NOTHING;

-- Insert Units for GWR
INSERT INTO units (floor_id, unit_type, unit_label, layout_type, sq_ft, max_occupancy, base_rate, status)
SELECT f.id, u.unit_type::unit_type, u.unit_label, u.layout_type, u.sq_ft, u.max_occupancy, u.base_rate, u.status::room_status
FROM floors f
JOIN buildings b ON f.building_id = b.id
JOIN properties p ON b.property_id = p.id
CROSS JOIN (VALUES
  (1, 'apartment', '101', '2BHK', 1200, 4, 25000.00, 'occupied'),
  (1, 'apartment', '102', '3BHK', 1600, 6, 32000.00, 'vacant'),
  (2, 'apartment', '201', '2BHK', 1200, 4, 25000.00, 'occupied'),
  (2, 'apartment', '202', '3BHK', 1600, 6, 32000.00, 'occupied'),
  (3, 'apartment', '301', '2BHK', 1200, 4, 25000.00, 'dirty'),
  (3, 'apartment', '302', '3BHK', 1600, 6, 32000.00, 'maintenance')
) AS u(floor_number, unit_type, unit_label, layout_type, sq_ft, max_occupancy, base_rate, status)
WHERE p.code = 'GWR' AND b.code = 'T-A' AND f.floor_number = u.floor_number
ON CONFLICT (floor_id, unit_label) DO NOTHING;


-- ── 2. Innovate Coworking (ICS) Building, Floors, and Units ──
-- Insert Building IH for ICS
INSERT INTO buildings (property_id, name, code, floors)
SELECT id, 'Innovate Hub', 'IH', 2 
FROM properties 
WHERE code = 'ICS'
ON CONFLICT (property_id, code) DO NOTHING;

-- Insert Floors for ICS
INSERT INTO floors (building_id, name, floor_number)
SELECT b.id, CASE WHEN gs = 1 THEN 'Ground Floor' ELSE 'First Floor' END, gs
FROM buildings b
JOIN properties p ON b.property_id = p.id
CROSS JOIN generate_series(1, 2) gs
WHERE p.code = 'ICS' AND b.code = 'IH'
ON CONFLICT (building_id, floor_number) DO NOTHING;

-- Insert Units for ICS
INSERT INTO units (floor_id, unit_type, unit_label, layout_type, sq_ft, max_occupancy, base_rate, status)
SELECT f.id, u.unit_type::unit_type, u.unit_label, u.layout_type, u.sq_ft, u.max_occupancy, u.base_rate, u.status::room_status
FROM floors f
JOIN buildings b ON f.building_id = b.id
JOIN properties p ON b.property_id = p.id
CROSS JOIN (VALUES
  (1, 'desk', 'D-101', 'hot_desk', 30, 1, 200.00, 'vacant'),
  (1, 'desk', 'D-102', 'hot_desk', 30, 1, 200.00, 'occupied'),
  (1, 'desk', 'D-103', 'hot_desk', 30, 1, 200.00, 'vacant'),
  (1, 'desk', 'D-104', 'hot_desk', 30, 1, 200.00, 'occupied'),
  (1, 'desk', 'D-105', 'hot_desk', 30, 1, 200.00, 'vacant'),
  (1, 'seat', 'S-111', 'dedicated_seat', 40, 1, 500.00, 'occupied'),
  (1, 'seat', 'S-112', 'dedicated_seat', 40, 1, 500.00, 'occupied'),
  (1, 'seat', 'S-113', 'dedicated_seat', 40, 1, 500.00, 'vacant'),
  (2, 'cabin', 'C-201', 'private_cabin', 150, 4, 1500.00, 'vacant'),
  (2, 'cabin', 'C-202', 'private_cabin', 150, 4, 1500.00, 'occupied'),
  (2, 'meeting_room', 'MR-203', 'meeting_room', 250, 10, 1000.00, 'occupied'),
  (2, 'meeting_room', 'MR-204', 'meeting_room', 200, 8, 800.00, 'vacant')
) AS u(floor_number, unit_type, unit_label, layout_type, sq_ft, max_occupancy, base_rate, status)
WHERE p.code = 'ICS' AND b.code = 'IH' AND f.floor_number = u.floor_number
ON CONFLICT (floor_id, unit_label) DO NOTHING;


-- ── 3. Departments for CSA, GWR, and ICS ──
INSERT INTO departments (property_id, name, code)
SELECT p.id, d.name, d.code
FROM properties p
CROSS JOIN (VALUES
  ('Front Desk', 'FD'),
  ('Housekeeping', 'HK'),
  ('Maintenance', 'MT'),
  ('Finance', 'FN'),
  ('Human Resources', 'HR'),
  ('Sales & Marketing', 'SM'),
  ('Security', 'SC')
) AS d(name, code)
WHERE p.code IN ('CSA', 'GWR', 'ICS')
ON CONFLICT DO NOTHING;


-- ── 4. Users and Roles for Each Property Perspective ──
-- Base auth users for CSA
INSERT INTO users (email, phone, password_hash, first_name, last_name, is_active) VALUES
  ('manager.csa@ehms.demo',      '+91-9000000101', crypt('Demo@1234', gen_salt('bf')), 'Alok',      'Nath',     true),
  ('frontdesk.csa@ehms.demo',    '+91-9000000102', crypt('Demo@1234', gen_salt('bf')), 'Neha',      'Gupta',    true),
  ('housekeeping.csa@ehms.demo', '+91-9000000103', crypt('Demo@1234', gen_salt('bf')), 'Kamla',     'Devi',     true),
  ('maintenance.csa@ehms.demo',  '+91-9000000104', crypt('Demo@1234', gen_salt('bf')), 'Ramesh',    'Singh',    true),
  ('hr.csa@ehms.demo',           '+91-9000000105', crypt('Demo@1234', gen_salt('bf')), 'Shreya',    'Sen',      true),
  ('finance.csa@ehms.demo',      '+91-9000000106', crypt('Demo@1234', gen_salt('bf')), 'Kunal',     'Shah',     true),
  ('partner.csa@ehms.demo',      '+91-9000000107', crypt('Demo@1234', gen_salt('bf')), 'Aditya',    'Birla',    true)
ON CONFLICT (email) DO NOTHING;

-- Base auth users for GWR
INSERT INTO users (email, phone, password_hash, first_name, last_name, is_active) VALUES
  ('manager.gwr@ehms.demo',      '+91-9000000201', crypt('Demo@1234', gen_salt('bf')), 'Rajiv',     'Malhotra', true),
  ('frontdesk.gwr@ehms.demo',    '+91-9000000202', crypt('Demo@1234', gen_salt('bf')), 'Sanya',     'Malhotra', true),
  ('housekeeping.gwr@ehms.demo', '+91-9000000203', crypt('Demo@1234', gen_salt('bf')), 'Laxmi',     'Bai',      true),
  ('maintenance.gwr@ehms.demo',  '+91-9000000204', crypt('Demo@1234', gen_salt('bf')), 'Suresh',    'Prasad',   true),
  ('hr.gwr@ehms.demo',           '+91-9000000205', crypt('Demo@1234', gen_salt('bf')), 'Nidhi',     'Aggarwal', true),
  ('finance.gwr@ehms.demo',      '+91-9000000206', crypt('Demo@1234', gen_salt('bf')), 'Pankaj',    'Tripathi', true),
  ('partner.gwr@ehms.demo',      '+91-9000000207', crypt('Demo@1234', gen_salt('bf')), 'Sunil',     'Bharti',   true)
ON CONFLICT (email) DO NOTHING;

-- Base auth users for ICS
INSERT INTO users (email, phone, password_hash, first_name, last_name, is_active) VALUES
  ('manager.ics@ehms.demo',      '+91-9000000301', crypt('Demo@1234', gen_salt('bf')), 'Vikrant',   'Massey',   true),
  ('frontdesk.ics@ehms.demo',    '+91-9000000302', crypt('Demo@1234', gen_salt('bf')), 'Kriti',     'Sanon',    true),
  ('housekeeping.ics@ehms.demo', '+91-9000000303', crypt('Demo@1234', gen_salt('bf')), 'Ramu',      'Kaka',     true),
  ('maintenance.ics@ehms.demo',  '+91-9000000304', crypt('Demo@1234', gen_salt('bf')), 'Jitendra',  'Kumar',    true),
  ('hr.ics@ehms.demo',           '+91-9000000305', crypt('Demo@1234', gen_salt('bf')), 'Nisha',     'Rawal',    true),
  ('finance.ics@ehms.demo',      '+91-9000000306', crypt('Demo@1234', gen_salt('bf')), 'Abhishek',  'Sharma',   true),
  ('partner.ics@ehms.demo',      '+91-9000000307', crypt('Demo@1234', gen_salt('bf')), 'Anand',     'Mahindra', true)
ON CONFLICT (email) DO NOTHING;


-- Assign local roles linked to properties
-- CSA
INSERT INTO user_roles (user_id, role_id, property_id)
SELECT u.id, r.id, p.id
FROM users u
CROSS JOIN roles r
CROSS JOIN properties p
WHERE p.code = 'CSA' AND (
  (u.email = 'manager.csa@ehms.demo'      AND r.name = 'property_manager') OR
  (u.email = 'frontdesk.csa@ehms.demo'    AND r.name = 'front_desk') OR
  (u.email = 'housekeeping.csa@ehms.demo' AND r.name = 'housekeeping_staff') OR
  (u.email = 'maintenance.csa@ehms.demo'  AND r.name = 'maintenance_staff') OR
  (u.email = 'hr.csa@ehms.demo'           AND r.name = 'hr_manager') OR
  (u.email = 'finance.csa@ehms.demo'      AND r.name = 'finance_manager') OR
  (u.email = 'partner.csa@ehms.demo'      AND r.name = 'executive')
)
ON CONFLICT (user_id, role_id, property_id) DO NOTHING;

-- GWR
INSERT INTO user_roles (user_id, role_id, property_id)
SELECT u.id, r.id, p.id
FROM users u
CROSS JOIN roles r
CROSS JOIN properties p
WHERE p.code = 'GWR' AND (
  (u.email = 'manager.gwr@ehms.demo'      AND r.name = 'property_manager') OR
  (u.email = 'frontdesk.gwr@ehms.demo'    AND r.name = 'front_desk') OR
  (u.email = 'housekeeping.gwr@ehms.demo' AND r.name = 'housekeeping_staff') OR
  (u.email = 'maintenance.gwr@ehms.demo'  AND r.name = 'maintenance_staff') OR
  (u.email = 'hr.gwr@ehms.demo'           AND r.name = 'hr_manager') OR
  (u.email = 'finance.gwr@ehms.demo'      AND r.name = 'finance_manager') OR
  (u.email = 'partner.gwr@ehms.demo'      AND r.name = 'executive')
)
ON CONFLICT (user_id, role_id, property_id) DO NOTHING;

-- ICS
INSERT INTO user_roles (user_id, role_id, property_id)
SELECT u.id, r.id, p.id
FROM users u
CROSS JOIN roles r
CROSS JOIN properties p
WHERE p.code = 'ICS' AND (
  (u.email = 'manager.ics@ehms.demo'      AND r.name = 'property_manager') OR
  (u.email = 'frontdesk.ics@ehms.demo'    AND r.name = 'front_desk') OR
  (u.email = 'housekeeping.ics@ehms.demo' AND r.name = 'housekeeping_staff') OR
  (u.email = 'maintenance.ics@ehms.demo'  AND r.name = 'maintenance_staff') OR
  (u.email = 'hr.ics@ehms.demo'           AND r.name = 'hr_manager') OR
  (u.email = 'finance.ics@ehms.demo'      AND r.name = 'finance_manager') OR
  (u.email = 'partner.ics@ehms.demo'      AND r.name = 'executive')
)
ON CONFLICT (user_id, role_id, property_id) DO NOTHING;


-- Register Employee profiles for GWR, CSA, and ICS
-- CSA Employees
INSERT INTO employees (user_id, employee_code, department_id, designation, employment_type, doj, base_salary)
SELECT u.id, 'EMP-CSA-' || LPAD((ROW_NUMBER() OVER(ORDER BY u.email))::text, 4, '0'), d.id, e.designation, 'full_time', CURRENT_DATE - 180, e.salary
FROM users u
JOIN (VALUES
  ('manager.csa@ehms.demo',      'Sales & Marketing', 'Serviced Apartments Manager', 60000.00),
  ('frontdesk.csa@ehms.demo',    'Front Desk',        'Guest Relations Executive',   38000.00),
  ('housekeeping.csa@ehms.demo', 'Housekeeping',      'Housekeeper',                 25000.00),
  ('maintenance.csa@ehms.demo',  'Maintenance',       'HVAC Technician',             32000.00),
  ('hr.csa@ehms.demo',           'Human Resources',   'HR Executive',                45000.00),
  ('finance.csa@ehms.demo',      'Finance',           'Assistant Accountant',        48000.00)
) AS e(email, dept_name, designation, salary) ON u.email = e.email
JOIN departments d ON d.name = e.dept_name AND d.property_id = (SELECT id FROM properties WHERE code='CSA')
ON CONFLICT (employee_code) DO NOTHING;

-- GWR Employees
INSERT INTO employees (user_id, employee_code, department_id, designation, employment_type, doj, base_salary)
SELECT u.id, 'EMP-GWR-' || LPAD((ROW_NUMBER() OVER(ORDER BY u.email))::text, 4, '0'), d.id, e.designation, 'full_time', CURRENT_DATE - 150, e.salary
FROM users u
JOIN (VALUES
  ('manager.gwr@ehms.demo',      'Sales & Marketing', 'Property Manager',            62000.00),
  ('frontdesk.gwr@ehms.demo',    'Front Desk',        'Leasing Executive',           36000.00),
  ('housekeeping.gwr@ehms.demo', 'Housekeeping',      'Housekeeping Assistant',      24000.00),
  ('maintenance.gwr@ehms.demo',  'Maintenance',       'General Plumber',             31000.00),
  ('hr.gwr@ehms.demo',           'Human Resources',   'HR Lead',                     46000.00),
  ('finance.gwr@ehms.demo',      'Finance',           'Finance Administrator',       47000.00)
) AS e(email, dept_name, designation, salary) ON u.email = e.email
JOIN departments d ON d.name = e.dept_name AND d.property_id = (SELECT id FROM properties WHERE code='GWR')
ON CONFLICT (employee_code) DO NOTHING;

-- ICS Employees
INSERT INTO employees (user_id, employee_code, department_id, designation, employment_type, doj, base_salary)
SELECT u.id, 'EMP-ICS-' || LPAD((ROW_NUMBER() OVER(ORDER BY u.email))::text, 4, '0'), d.id, e.designation, 'full_time', CURRENT_DATE - 120, e.salary
FROM users u
JOIN (VALUES
  ('manager.ics@ehms.demo',      'Sales & Marketing', 'Community Director',          65000.00),
  ('frontdesk.ics@ehms.demo',    'Front Desk',        'Community Associate',         37000.00),
  ('housekeeping.ics@ehms.demo', 'Housekeeping',      'Housekeeping Associate',      23000.00),
  ('maintenance.ics@ehms.demo',  'Maintenance',       'Electrician',                 33000.00),
  ('hr.ics@ehms.demo',           'Human Resources',   'HR Manager',                  52000.00),
  ('finance.ics@ehms.demo',      'Finance',           'Accounts Officer',            50000.00)
) AS e(email, dept_name, designation, salary) ON u.email = e.email
JOIN departments d ON d.name = e.dept_name AND d.property_id = (SELECT id FROM properties WHERE code='ICS')
ON CONFLICT (employee_code) DO NOTHING;


-- ── 5. Seed Vendors and Associate Services ──
INSERT INTO vendors (company_name, contact_person, email, phone, tax_id, gst_number, is_compliant, status) VALUES
  ('Laundry Solutions Ltd',  'Manoj Kumar',  'manoj.laundry@corp.in', '+91-9999000001', 'TAX-L1',  'GST-LAUNDRY-1',  true,  'approved'),
  ('HVAC Tech Services',     'Rakesh Gupta', 'rakesh.hvac@corp.in',    '+91-9999000002', 'TAX-H2',  'GST-HVAC-2',     true,  'approved'),
  ('Pest Control Services',  'Sunil Sharma', 'sunil.pest@corp.in',     '+91-9999000003', 'TAX-P3',  'GST-PEST-3',     true,  'approved'),
  ('Plumbing Experts',       'Anil Patel',   'anil.plumbing@corp.in',  '+91-9999000004', 'TAX-PL4', 'GST-PLUMB-4',    true,  'approved'),
  ('Elevator Systems Inc',   'Deepak Rawat', 'deepak.elevator@corp.in','+91-9999000005', 'TAX-EL5', 'GST-ELEV-5',    true,  'approved'),
  ('Catering & F&B Partners','Shweta Singh', 'shweta.fnb@corp.in',     '+91-9999000006', 'TAX-FB6', 'GST-FNB-6',      true,  'approved')
ON CONFLICT DO NOTHING;

-- Associate Vendor Services
INSERT INTO vendor_services (vendor_id, service_type, description, rate, rate_unit)
SELECT v.id, vs.service_type, vs.description, vs.rate, vs.rate_unit
FROM vendors v
CROSS JOIN (VALUES
  ('Laundry Solutions Ltd',   'laundry',      'Daily commercial linens and guest laundry service', 150.00, 'per_visit'),
  ('HVAC Tech Services',      'hvac',         'Air conditioning repair, cleaning, and maintenance', 800.00, 'per_hour'),
  ('Pest Control Services',   'pest_control', 'Monthly pest management and sanitization visits',    3500.00,'per_visit'),
  ('Plumbing Experts',        'plumbing',     'Emergency pipe leakage repairs and sanitaries',      600.00, 'per_hour'),
  ('Elevator Systems Inc',    'elevator',     'Elevator monthly preventative services and AMC',     25000.00,'per_month'),
  ('Catering & F&B Partners', 'catering',     'Catering events, menu setups, and kitchen supplies', 120.00, 'per_room')
) AS vs(vendor_name, service_type, description, rate, rate_unit)
WHERE v.company_name = vs.vendor_name
ON CONFLICT DO NOTHING;

-- Create vendor_user logins
INSERT INTO users (email, phone, password_hash, first_name, last_name, is_active) VALUES
  ('vendor.laundry@ehms.demo',   '+91-9999000011', crypt('Demo@1234', gen_salt('bf')), 'Manoj',    'Laundry',  true),
  ('vendor.hvac@ehms.demo',      '+91-9999000012', crypt('Demo@1234', gen_salt('bf')), 'Rakesh',   'HVAC',     true),
  ('vendor.plumbing@ehms.demo',  '+91-9999000013', crypt('Demo@1234', gen_salt('bf')), 'Anil',     'Plumbing', true),
  ('vendor.elevator@ehms.demo',  '+91-9999000014', crypt('Demo@1234', gen_salt('bf')), 'Deepak',   'Elevator', true)
ON CONFLICT (email) DO NOTHING;

-- Assign vendor_user role
INSERT INTO user_roles (user_id, role_id, property_id)
SELECT u.id, r.id, NULL
FROM users u, roles r
WHERE r.name = 'vendor_user' AND u.email IN (
  'vendor.laundry@ehms.demo',
  'vendor.hvac@ehms.demo',
  'vendor.plumbing@ehms.demo',
  'vendor.elevator@ehms.demo'
)
ON CONFLICT (user_id, role_id, property_id) DO NOTHING;


-- ── 6. Revenue (Invoices & Payments) for Serviced Apartments (CSA) ──
-- Create invoices for all existing CSA bookings
INSERT INTO invoices (property_id, booking_id, guest_id, invoice_number, invoice_date, due_date, status, subtotal, tax_total, grand_total, paid_total, currency)
SELECT
  b.property_id,
  b.id,
  b.guest_id,
  'INV-CSA-' || SUBSTRING(b.id::text, 1, 8),
  b.check_in::date,
  b.check_out::date + 3,
  CASE 
    WHEN b.status = 'checked_out' THEN 'paid'::invoice_status 
    WHEN b.status = 'checked_in' THEN 'paid'::invoice_status
    WHEN b.status = 'cancelled' THEN 'cancelled'::invoice_status
    ELSE 'sent'::invoice_status 
  END,
  b.total_amount * 0.82,
  b.total_amount * 0.18,
  b.total_amount,
  b.paid_amount,
  'INR'
FROM bookings b
JOIN properties p ON b.property_id = p.id
WHERE p.code = 'CSA' AND b.total_amount > 0
ON CONFLICT (invoice_number) DO NOTHING;

-- Create completed payments for all CSA bookings
INSERT INTO payments (property_id, booking_id, invoice_id, payment_method, amount, currency, status, payment_date)
SELECT
  b.property_id,
  b.id,
  inv.id,
  (ARRAY['card','upi','cash','bank_transfer'])[(EXTRACT(epoch FROM b.check_in)::int % 4) + 1],
  b.paid_amount,
  'INR',
  'completed',
  b.check_in + interval '1 hour'
FROM bookings b
JOIN properties p ON b.property_id = p.id
LEFT JOIN invoices inv ON inv.booking_id = b.id
WHERE p.code = 'CSA' AND b.paid_amount > 0 AND b.status IN ('checked_out','checked_in','confirmed')
ON CONFLICT DO NOTHING;


-- ── 7. Bookings and Revenue for Apartment Rental (GWR) ──
-- Insert Lease Agreements for GWR
INSERT INTO lease_agreements (property_id, unit_id, tenant_id, agreement_ref, status, start_date, end_date, rent_amount, security_deposit, notice_period_days, signed_by_tenant, signed_by_owner)
SELECT 
  p.id, 
  u.id, 
  g.id, 
  l.agreement_ref, 
  l.status::lease_status, 
  l.start_date::date, 
  l.end_date::date, 
  l.rent_amount, 
  l.security_deposit, 
  30, 
  true, 
  true
FROM properties p
JOIN units u ON u.floor_id IN (
  SELECT f.id FROM floors f JOIN buildings b ON f.building_id = b.id WHERE b.property_id = p.id
)
JOIN guest_profiles g ON g.email IN ('rajesh.kumar@gmail.com', 'sarah.j@company.com', 'amit.sharma@outlook.com', 'priya.patel@gmail.com', 'vikram.singh@corp.in', 'emily.chen@startup.io')
JOIN (VALUES
  ('101', 'rajesh.kumar@gmail.com', 'LA-GWR-101', 'active', CURRENT_DATE - 180, CURRENT_DATE + 185, 25000.00, 50000.00),
  ('102', 'sarah.j@company.com',    'LA-GWR-102', 'active', CURRENT_DATE - 120, CURRENT_DATE + 245, 32000.00, 64000.00),
  ('201', 'amit.sharma@outlook.com', 'LA-GWR-201', 'active', CURRENT_DATE - 90, CURRENT_DATE + 275, 25000.00, 50000.00),
  ('202', 'priya.patel@gmail.com',   'LA-GWR-202', 'renewal_due', CURRENT_DATE - 350, CURRENT_DATE + 15, 32000.00, 64000.00),
  ('301', 'vikram.singh@corp.in',    'LA-GWR-301', 'signed', CURRENT_DATE + 5, CURRENT_DATE + 370, 25000.00, 50000.00),
  ('302', 'emily.chen@startup.io',   'LA-GWR-302', 'terminated', CURRENT_DATE - 365, CURRENT_DATE - 5, 32000.00, 64000.00)
) AS l(unit_label, email, agreement_ref, status, start_date, end_date, rent_amount, security_deposit)
ON u.unit_label = l.unit_label AND g.email = l.email
WHERE p.code = 'GWR'
ON CONFLICT (agreement_ref) DO NOTHING;

-- Rent Invoices for Lease 1, 2, 3
INSERT INTO rent_invoices (lease_id, invoice_number, period_start, period_end, rent_amount, maintenance_charges, late_fee, paid_amount, due_date, status, paid_at)
SELECT
  la.id,
  'RI-' || la.agreement_ref || '-0' || gs,
  (la.start_date + (gs - 1) * interval '30 days')::date,
  (la.start_date + gs * interval '30 days' - interval '1 day')::date,
  la.rent_amount,
  CASE WHEN la.rent_amount > 28000 THEN 2000.00 ELSE 1500.00 END,
  0.00,
  la.rent_amount + CASE WHEN la.rent_amount > 28000 THEN 2000.00 ELSE 1500.00 END,
  (la.start_date + (gs - 1) * interval '30 days' + interval '5 days')::date,
  'paid'::invoice_status,
  (la.start_date + (gs - 1) * interval '30 days' + interval '2 days')::timestamptz
FROM lease_agreements la
CROSS JOIN generate_series(1, 4) gs
WHERE la.agreement_ref IN ('LA-GWR-101', 'LA-GWR-102', 'LA-GWR-201')
ON CONFLICT (invoice_number) DO NOTHING;

-- Rent Invoices for Lease 4 (12 months)
INSERT INTO rent_invoices (lease_id, invoice_number, period_start, period_end, rent_amount, maintenance_charges, late_fee, paid_amount, due_date, status, paid_at)
SELECT
  la.id,
  'RI-' || la.agreement_ref || '-0' || gs,
  (la.start_date + (gs - 1) * interval '30 days')::date,
  (la.start_date + gs * interval '30 days' - interval '1 day')::date,
  la.rent_amount,
  2000.00,
  CASE WHEN gs = 3 THEN 500.00 ELSE 0.00 END,
  la.rent_amount + 2000.00 + CASE WHEN gs = 3 THEN 500.00 ELSE 0.00 END,
  (la.start_date + (gs - 1) * interval '30 days' + interval '5 days')::date,
  'paid'::invoice_status,
  (la.start_date + (gs - 1) * interval '30 days' + interval '4 days')::timestamptz
FROM lease_agreements la
CROSS JOIN generate_series(1, 11) gs
WHERE la.agreement_ref = 'LA-GWR-202'
ON CONFLICT (invoice_number) DO NOTHING;


-- ── 8. Bookings and Revenue for Workplace (ICS) ──
-- Insert corporate account
INSERT INTO corporate_accounts (name, tax_id, billing_cycle, payment_terms, is_active)
SELECT 'Acme Corp', 'TAX-ACME-99', 'monthly', 30, true
WHERE NOT EXISTS (SELECT 1 FROM corporate_accounts WHERE name = 'Acme Corp')
ON CONFLICT DO NOTHING;

-- Create membership plans
INSERT INTO membership_plans (property_id, name, plan_type, billing_cycle, price, seat_pool, max_meeting_room_hours, amenities)
SELECT p.id, plan.name, plan.plan_type, plan.billing_cycle, plan.price, plan.seat_pool, plan.max_meeting_room_hours, plan.amenities
FROM properties p
CROSS JOIN (VALUES
  ('Hot Desk Pool Plan',     'hot_desk',        'monthly', 8000.00, 10, 10, ARRAY['WiFi', 'Coffee', 'Printing']),
  ('Dedicated Desk Premium',  'dedicated_seat',  'monthly', 12000.00, 1, 15, ARRAY['WiFi', 'Coffee', 'Printing', 'Locker']),
  ('Executive Private Cabin', 'private_office',  'monthly', 45000.00, 1, 20, ARRAY['WiFi', 'Coffee', 'Printing', 'Meeting Room Access', 'Dedicated Assistant'])
) AS plan(name, plan_type, billing_cycle, price, seat_pool, max_meeting_room_hours, amenities)
WHERE p.code = 'ICS'
ON CONFLICT DO NOTHING;

-- Insert corporate memberships
INSERT INTO corporate_memberships (corporate_id, plan_id, start_date, end_date, seat_allocated, seat_used, status)
SELECT c.id, mp.id, CURRENT_DATE - 180, CURRENT_DATE + 185, 10, 8, 'active'
FROM corporate_accounts c
CROSS JOIN membership_plans mp
JOIN properties p ON mp.property_id = p.id
WHERE c.name = 'Acme Corp' AND mp.name = 'Hot Desk Pool Plan' AND p.code = 'ICS'
ON CONFLICT DO NOTHING;

-- Insert membership invoice
INSERT INTO membership_invoices (membership_id, invoice_number, period_start, period_end, base_amount, overage_amount, status, due_date, paid_at)
SELECT cm.id, 'MI-ACME-001', CURRENT_DATE - 30, CURRENT_DATE, 80000.00, 0.00, 'paid', CURRENT_DATE - 25, NOW() - interval '25 days'
FROM corporate_memberships cm
JOIN corporate_accounts c ON cm.corporate_id = c.id
JOIN membership_plans mp ON cm.plan_id = mp.id
JOIN properties p ON mp.property_id = p.id
WHERE c.name = 'Acme Corp' AND mp.name = 'Hot Desk Pool Plan' AND p.code = 'ICS'
ON CONFLICT DO NOTHING;

-- Insert workplace bookings
INSERT INTO workplace_bookings (property_id, unit_id, member_id, booking_type, start_time, end_time, status, total_amount)
SELECT p.id, u.id, g.id, b.booking_type, b.start_time, b.end_time, b.status::booking_status, b.total_amount
FROM properties p
JOIN units u ON u.floor_id IN (SELECT f.id FROM floors f JOIN buildings bd ON f.building_id = bd.id WHERE bd.property_id = p.id)
JOIN guest_profiles g ON g.email IN ('rajesh.kumar@gmail.com', 'sarah.j@company.com', 'amit.sharma@outlook.com', 'priya.patel@gmail.com')
JOIN (VALUES
  ('D-102', 'rajesh.kumar@gmail.com', 'hot_desk', CURRENT_TIMESTAMP - interval '2 hours', CURRENT_TIMESTAMP + interval '6 hours', 'checked_in', 200.00),
  ('D-104', 'sarah.j@company.com',    'hot_desk', CURRENT_TIMESTAMP - interval '1 hour',  CURRENT_TIMESTAMP + interval '4 hours', 'checked_in', 200.00),
  ('S-111', 'amit.sharma@outlook.com', 'dedicated_seat', CURRENT_TIMESTAMP - interval '1 day', CURRENT_TIMESTAMP + interval '29 days', 'confirmed', 12000.00),
  ('MR-203', 'priya.patel@gmail.com',   'meeting_room', CURRENT_TIMESTAMP - interval '30 minutes', CURRENT_TIMESTAMP + interval '90 minutes', 'checked_in', 2000.00)
) AS b(unit_label, email, booking_type, start_time, end_time, status, total_amount)
ON u.unit_label = b.unit_label AND g.email = b.email
WHERE p.code = 'ICS'
ON CONFLICT DO NOTHING;

-- Workplace Invoices
INSERT INTO invoices (property_id, booking_id, guest_id, invoice_number, invoice_date, due_date, status, subtotal, tax_total, grand_total, paid_total, currency)
SELECT
  p.id,
  NULL,
  g.id,
  'INV-ICS-' || SUBSTRING(wb.id::text, 1, 8),
  wb.start_time::date,
  wb.start_time::date + 1,
  'paid',
  wb.total_amount * 0.82,
  wb.total_amount * 0.18,
  wb.total_amount,
  wb.total_amount,
  'INR'
FROM workplace_bookings wb
JOIN properties p ON wb.property_id = p.id
JOIN guest_profiles g ON wb.member_id = g.id
WHERE p.code = 'ICS' AND wb.status = 'checked_in'
ON CONFLICT (invoice_number) DO NOTHING;

-- Workplace Payments
INSERT INTO payments (property_id, booking_id, invoice_id, payment_method, amount, currency, status, payment_date)
SELECT
  p.id,
  NULL,
  inv.id,
  'upi',
  wb.total_amount,
  'INR',
  'completed',
  wb.start_time
FROM workplace_bookings wb
JOIN properties p ON wb.property_id = p.id
JOIN guest_profiles g ON wb.member_id = g.id
JOIN invoices inv ON inv.guest_id = g.id AND inv.grand_total = wb.total_amount
WHERE p.code = 'ICS' AND wb.status = 'checked_in'
ON CONFLICT DO NOTHING;


-- ── 9. Attendance, Shifts and Payroll for Staff ──
-- Shift Rotations
INSERT INTO shift_rotations (property_id, name, start_time, end_time)
SELECT p.id, s.name, s.start_time::time, s.end_time::time
FROM properties p
CROSS JOIN (VALUES
  ('General Shift', '09:00:00', '18:00:00'),
  ('Morning Shift', '07:00:00', '15:00:00'),
  ('Night Shift',   '23:00:00', '07:00:00')
) AS s(name, start_time, end_time)
WHERE p.code IN ('OVH', 'CSA', 'GWR', 'ICS')
ON CONFLICT DO NOTHING;

-- Attendance records
INSERT INTO attendance_records (employee_id, property_id, clock_in, clock_out, status)
SELECT 
  e.id, 
  d.property_id, 
  CURRENT_DATE - 1 + interval '9 hours',
  CURRENT_DATE - 1 + interval '18 hours',
  'present'
FROM employees e
JOIN departments d ON e.department_id = d.id
ON CONFLICT DO NOTHING;

-- Insert payroll run for GWR
INSERT INTO payroll_runs (property_id, period_start, period_end, run_date, status, total_gross, total_deductions, total_net)
SELECT id, (CURRENT_DATE - 30)::date, CURRENT_DATE::date, CURRENT_DATE, 'approved', 0.00, 0.00, 0.00
FROM properties
WHERE code = 'GWR'
ON CONFLICT DO NOTHING;

-- Insert payroll lines for GWR employees
INSERT INTO payroll_lines (payroll_id, employee_id, gross_pay, pf_deduction, esi_deduction, pt_deduction, tds_deduction, other_deductions, overtime_hours, overtime_amount)
SELECT 
  pr.id,
  e.id,
  e.base_salary,
  e.base_salary * 0.12,
  e.base_salary * 0.0175,
  200.00,
  e.base_salary * 0.05,
  0.00,
  2.00,
  500.00
FROM employees e
JOIN departments d ON e.department_id = d.id
JOIN properties p ON d.property_id = p.id
JOIN payroll_runs pr ON pr.property_id = p.id
WHERE p.code = 'GWR' AND pr.period_end = CURRENT_DATE::date
ON CONFLICT DO NOTHING;

-- Update payroll totals
UPDATE payroll_runs pr
SET 
  total_gross = COALESCE((SELECT SUM(gross_pay) FROM payroll_lines WHERE payroll_id = pr.id), 0.00),
  total_deductions = COALESCE((SELECT SUM(pf_deduction + esi_deduction + pt_deduction + tds_deduction) FROM payroll_lines WHERE payroll_id = pr.id), 0.00),
  total_net = COALESCE((SELECT SUM(gross_pay - pf_deduction - esi_deduction - pt_deduction - tds_deduction) FROM payroll_lines WHERE payroll_id = pr.id), 0.00)
WHERE pr.property_id = (SELECT id FROM properties WHERE code = 'GWR') AND pr.period_end = CURRENT_DATE::date;
