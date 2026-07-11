-- =============================================================
-- eHMS Rich Seed Data — v2
-- Run AFTER all 001-012 schema files have been executed
-- Provides 12 months of data for dashboard metrics & charts
-- =============================================================

-- ── Enterprise ────────────────────────────────────────────────
INSERT INTO enterprises (name, code, currency, timezone) VALUES
  ('eHMS Hospitality Group', 'EHG', 'INR', 'Asia/Kolkata')
ON CONFLICT DO NOTHING;

-- ── Region ────────────────────────────────────────────────────
INSERT INTO regions (enterprise_id, name, code, country, state, city)
SELECT id, 'South India', 'SI', 'India', 'Tamil Nadu', 'Chennai'
FROM enterprises WHERE code = 'EHG'
ON CONFLICT DO NOTHING;

-- ── Properties (4 verticals) ──────────────────────────────────
INSERT INTO properties (region_id, name, code, vertical_type, booking_model, address, phone, email, star_rating)
SELECT r.id, p.name, p.code, p.vertical_type::vertical_type, p.booking_model::booking_model, p.address, p.phone, p.email, p.star
FROM regions r, (VALUES
  ('Oceanview Hotel',           'OVH', 'hotel',              'nightly', '12 Marina Beach Rd, Chennai',  '+91-44-1001-0001', 'oceanview@ehms.demo',  5),
  ('Viswa Service Apartments',   'VSA', 'service_apartment',  'nightly', '45 Anna Salai, Chennai',       '+91-44-1001-0002', 'viswa@ehms.demo',  4),
  ('Greenwood Residency',       'GWR', 'rental_apartment',   'lease',   '78 Velachery Main Rd, Chennai','+91-44-1001-0003', 'greenwood@ehms.demo',  NULL),
  ('Innovate Coworking',        'ICS', 'workplace',          'hourly',  '23 OMR Tech Park, Chennai',    '+91-44-1001-0004', 'innovate@ehms.demo',   NULL)
) AS p(name, code, vertical_type, booking_model, address, phone, email, star)
WHERE r.code = 'SI'
ON CONFLICT DO NOTHING;

-- ── Roles ─────────────────────────────────────────────────────
INSERT INTO roles (name, description) VALUES
  ('super_admin',              'Full system access'),
  ('executive',                'Executive read-only across all modules'),
  ('property_manager',         'Manages one or more properties'),
  ('front_desk',               'Front desk operations'),
  ('housekeeping_staff',       'Housekeeping tasks'),
  ('housekeeping_supervisor',  'Supervises housekeeping team'),
  ('maintenance_staff',        'Maintenance tickets'),
  ('maintenance_supervisor',   'Supervises maintenance team'),
  ('hr_manager',               'Human resources management'),
  ('hr_executive',             'HR support role'),
  ('finance_manager',          'Finance and billing'),
  ('finance_executive',        'Finance support role'),
  ('security_staff',           'Security and access control'),
  ('vendor_user',              'External vendor access'),
  ('workplace_facility_manager','Workplace facility management')
ON CONFLICT (name) DO NOTHING;

-- ── Demo users (pgcrypto crypt hashed passwords) ──────────────
INSERT INTO users (email, phone, password_hash, first_name, last_name, is_active) VALUES
  ('raghu.superadmin@ehms.demo',  '+91-9000000000', crypt('Demo@1234', gen_salt('bf')), 'Raghu',  'Superadmin', true),
  ('vishwa.superadmin@ehms.demo', '+91-9000000008', crypt('Demo@1234', gen_salt('bf')), 'Vishwa', 'Superadmin', true),
  ('admin@ehms.demo',        '+91-9000000001', crypt('Demo@1234', gen_salt('bf')), 'Aryan', 'Kapoor',   true),
  ('frontdesk@ehms.demo',    '+91-9000000002', crypt('Demo@1234', gen_salt('bf')), 'Ravi',  'Kumar',    true),
  ('housekeeping@ehms.demo', '+91-9000000003', crypt('Demo@1234', gen_salt('bf')), 'Meena', 'Pillai',   true),
  ('maintenance@ehms.demo',  '+91-9000000004', crypt('Demo@1234', gen_salt('bf')), 'Arjun', 'Sharma',   true),
  ('hr@ehms.demo',           '+91-9000000005', crypt('Demo@1234', gen_salt('bf')), 'Priya', 'Nair',     true),
  ('finance@ehms.demo',      '+91-9000000006', crypt('Demo@1234', gen_salt('bf')), 'Vikram','Iyer',     true),
  ('executive@ehms.demo',    '+91-9000000007', crypt('Demo@1234', gen_salt('bf')), 'Anita', 'Desai',    true)
ON CONFLICT (email) DO NOTHING;

-- ── Assign roles ──────────────────────────────────────────────
INSERT INTO user_roles (user_id, role_id, property_id)
SELECT u.id, r.id, NULL
FROM users u, roles r
WHERE (u.email, r.name) IN (
  ('raghu.superadmin@ehms.demo',   'super_admin'),
  ('vishwa.superadmin@ehms.demo',  'super_admin'),
  ('admin@ehms.demo',        'property_manager'),
  ('frontdesk@ehms.demo',    'front_desk'),
  ('housekeeping@ehms.demo', 'housekeeping_staff'),
  ('maintenance@ehms.demo',  'maintenance_staff'),
  ('hr@ehms.demo',           'hr_manager'),
  ('finance@ehms.demo',      'finance_manager'),
  ('executive@ehms.demo',    'executive')
)
ON CONFLICT (user_id, role_id, property_id) DO NOTHING;

-- Super admin also gets executive role
INSERT INTO user_roles (user_id, role_id, property_id)
SELECT u.id, r.id, NULL FROM users u, roles r
WHERE u.email IN ('raghu.superadmin@ehms.demo', 'vishwa.superadmin@ehms.demo') AND r.name = 'executive'
ON CONFLICT (user_id, role_id, property_id) DO NOTHING;

-- ── Guests (30 profiles) ──────────────────────────────────────
INSERT INTO guest_profiles (first_name, last_name, email, phone, nationality, id_type, id_number, id_verified, tags, loyalty_points, total_stays) VALUES
  ('Rajesh',   'Kumar',     'rajesh.kumar@gmail.com',      '+91-9811000001', 'Indian',      'aadhaar',         'XXXX-1234', true,  ARRAY['VIP'],       1500, 12),
  ('Sarah',    'Johnson',   'sarah.j@company.com',         '+1-202-555-0101','American',    'passport',        'US123456',  true,  ARRAY['corporate'],  800,  5),
  ('Amit',     'Sharma',    'amit.sharma@outlook.com',     '+91-9822000002', 'Indian',      'aadhaar',         'XXXX-5678', true,  ARRAY[]::text[],    200,  2),
  ('Priya',    'Patel',     'priya.patel@gmail.com',       '+91-9833000003', 'Indian',      'passport',        'IN789012',  true,  ARRAY['frequent'],   600,  8),
  ('Vikram',   'Singh',     'vikram.singh@corp.in',        '+91-9844000004', 'Indian',      'aadhaar',         'XXXX-9012', false, ARRAY['corporate'],  100,  1),
  ('Emily',    'Chen',      'emily.chen@startup.io',       '+65-9123-4567',  'Singaporean', 'passport',        'SG345678',  true,  ARRAY[]::text[],    300,  3),
  ('Mohammed', 'Al-Rashid', 'mo.rashid@gulf.ae',           '+971-50-123-456','UAE',         'passport',        'AE901234',  true,  ARRAY['VIP'],        2000, 18),
  ('Ananya',   'Krishnan',  'ananya.k@techfirm.com',       '+91-9855000005', 'Indian',      'driving_license', 'DL-TN123',  true,  ARRAY[]::text[],    400,  4),
  ('Rahul',    'Verma',     'rahul.verma@mnc.com',         '+91-9866000006', 'Indian',      'aadhaar',         'XXXX-3456', true,  ARRAY['corporate'],  700,  7),
  ('Kavya',    'Menon',     'kavya.menon@startup.in',      '+91-9877000007', 'Indian',      'passport',        'IN567890',  true,  ARRAY['frequent'],   900,  10),
  ('Suresh',   'Babu',      'suresh.babu@gmail.com',       '+91-9888000008', 'Indian',      'aadhaar',         'XXXX-7890', true,  ARRAY[]::text[],    150,  2),
  ('Linda',    'Martinez',  'linda.m@hotel.com',           '+1-415-555-0202','American',    'passport',        'US654321',  true,  ARRAY['corporate'],  450,  6),
  ('Karan',    'Mehta',     'karan.mehta@design.in',       '+91-9811000009', 'Indian',      'aadhaar',         'XXXX-2345', true,  ARRAY[]::text[],    250,  3),
  ('Divya',    'Reddy',     'divya.reddy@health.in',       '+91-9822000010', 'Indian',      'passport',        'IN234567',  true,  ARRAY['frequent'],   800,  9),
  ('James',    'Williams',  'james.w@finance.com',         '+44-20-7946-0101','British',    'passport',        'GB789012',  true,  ARRAY['VIP'],        1200, 15),
  ('Nisha',    'Joshi',     'nisha.joshi@media.in',        '+91-9833000011', 'Indian',      'aadhaar',         'XXXX-3456', true,  ARRAY[]::text[],    100,  1),
  ('Arpit',    'Agarwal',   'arpit.ag@logistics.in',       '+91-9844000012', 'Indian',      'aadhaar',         'XXXX-4567', true,  ARRAY['corporate'],  300,  4),
  ('Sita',     'Ramachandran','sita.r@textiles.in',        '+91-9855000013', 'Indian',      'passport',        'IN345678',  true,  ARRAY[]::text[],    200,  2),
  ('Alex',     'Thompson',  'alex.t@consult.com',          '+1-312-555-0303','American',    'passport',        'US345678',  true,  ARRAY['corporate'],  650,  7),
  ('Rekha',    'Iyer',      'rekha.iyer@bank.in',          '+91-9866000014', 'Indian',      'aadhaar',         'XXXX-5678', true,  ARRAY['frequent'],   1100, 11)
ON CONFLICT DO NOTHING;

-- ── Buildings & Floors ────────────────────────────────────────
WITH prop AS (SELECT id FROM properties WHERE code='OVH')
INSERT INTO buildings (property_id, name, code, floors)
SELECT prop.id, 'Main Wing', 'A', 10 FROM prop
ON CONFLICT DO NOTHING;

WITH bld AS (SELECT b.id FROM buildings b JOIN properties p ON b.property_id=p.id WHERE p.code='OVH' AND b.code='A')
INSERT INTO floors (building_id, name, floor_number)
SELECT bld.id, 'Floor '||gs, gs FROM bld, generate_series(1,8) gs
ON CONFLICT DO NOTHING;

-- ── Units (48 rooms across 8 floors) ─────────────────────────
INSERT INTO units (floor_id, unit_type, unit_label, layout_type, sq_ft, max_occupancy, base_rate, status)
SELECT
  f.id,
  CASE WHEN (gs % 6 = 1) THEN 'suite'::unit_type ELSE 'room'::unit_type END,
  (f.floor_number * 100 + gs)::text,
  CASE WHEN (gs % 6 = 1) THEN 'suite' WHEN gs % 3 = 0 THEN 'deluxe' ELSE 'standard' END,
  CASE WHEN gs % 6 = 1 THEN 850 WHEN gs % 3 = 0 THEN 450 ELSE 320 END,
  CASE WHEN gs % 6 = 1 THEN 4 ELSE 2 END,
  CASE WHEN gs % 6 = 1 THEN 12000 WHEN gs % 3 = 0 THEN 6500 ELSE 4200 END,
  CASE
    WHEN gs % 4 = 0 THEN 'occupied'::room_status
    WHEN gs % 7 = 0 THEN 'dirty'::room_status
    WHEN gs % 11 = 0 THEN 'maintenance'::room_status
    ELSE 'vacant'::room_status
  END
FROM floors f, generate_series(1, 6) gs
WHERE f.floor_number <= 8
AND EXISTS (SELECT 1 FROM buildings b JOIN properties p ON b.property_id=p.id WHERE b.id=f.building_id AND p.code='OVH')
ON CONFLICT DO NOTHING;

-- ── Bookings — 12 months of history ──────────────────────────
-- We insert 60 bookings spread across the last 12 months for realistic chart data
WITH
  hotel_prop AS (SELECT id FROM properties WHERE code='OVH'),
  hotel_units AS (
    SELECT u.id, u.base_rate, ROW_NUMBER() OVER(ORDER BY u.unit_label) AS rn
    FROM units u
    JOIN floors f ON u.floor_id=f.id
    JOIN buildings b ON f.building_id=b.id
    JOIN properties p ON b.property_id=p.id
    WHERE p.code='OVH'
  ),
  guest_list AS (
    SELECT id, ROW_NUMBER() OVER(ORDER BY created_at) AS rn FROM guest_profiles
  )
INSERT INTO bookings (property_id, unit_id, guest_id, booking_model, status, source, check_in, check_out, adults, children, total_amount, paid_amount)
SELECT
  (SELECT id FROM hotel_prop),
  (SELECT id FROM hotel_units WHERE rn = (((gs-1) % 20) + 1)),
  (SELECT id FROM guest_list  WHERE rn = (((gs-1) % 20) + 1)),
  'nightly',
  CASE
    WHEN gs % 5 = 0 THEN 'cancelled'
    WHEN gs % 7 = 0 THEN 'pending'
    WHEN months_ago = 0 AND gs % 3 = 0 THEN 'checked_in'
    WHEN months_ago > 0 THEN 'checked_out'
    ELSE 'confirmed'
  END::booking_status,
  (ARRAY['direct','booking.com','expedia','airbnb','agoda'])[(gs % 5)+1],
  NOW() - (months_ago || ' months')::interval + ((gs % 15) || ' days')::interval,
  NOW() - (months_ago || ' months')::interval + ((gs % 15) + 3 || ' days')::interval,
  (gs % 2) + 1,
  gs % 2,
  (SELECT base_rate FROM hotel_units WHERE rn = (((gs-1) % 20) + 1)) * 3,
  CASE
    WHEN gs % 5 = 0 THEN 0
    WHEN gs % 7 = 0 THEN 0
    ELSE (SELECT base_rate FROM hotel_units WHERE rn = (((gs-1) % 20) + 1)) * 3
  END
FROM generate_series(1, 60) gs,
     LATERAL (SELECT gs % 12 AS months_ago) m
ON CONFLICT DO NOTHING;

-- ── Payments (linked to paid bookings, spread over 12 months) ─
INSERT INTO payments (property_id, booking_id, payment_method, amount, currency, status, payment_date)
SELECT
  b.property_id,
  b.id,
  (ARRAY['card','upi','cash','bank_transfer'])[(EXTRACT(epoch FROM b.check_in)::int % 4) + 1],
  b.paid_amount,
  'INR',
  'completed',
  b.check_in + interval '1 hour'
FROM bookings b
WHERE b.paid_amount > 0
  AND b.status IN ('checked_out','checked_in','confirmed')
ON CONFLICT DO NOTHING;

-- ── Departments ───────────────────────────────────────────────
INSERT INTO departments (property_id, name, code)
SELECT p.id, dept.name, dept.code
FROM properties p, (VALUES
  ('Front Desk', 'FD'), ('Housekeeping', 'HK'), ('Maintenance', 'MT'),
  ('Finance', 'FN'), ('Human Resources', 'HR'), ('Food & Beverage', 'FB'),
  ('Security', 'SC'), ('Sales & Marketing', 'SM')
) AS dept(name, code)
WHERE p.code = 'OVH'
ON CONFLICT DO NOTHING;

-- ── Employees ─────────────────────────────────────────────────
INSERT INTO employees (user_id, employee_code, department_id, designation, employment_type, doj, base_salary)
SELECT
  u.id,
  'EMP-' || LPAD(ROW_NUMBER() OVER()::text, 4, '0'),
  d.id,
  e.designation,
  'full_time',
  NOW() - (FLOOR(random() * 365 * 3) || ' days')::interval,
  e.salary
FROM users u
JOIN (VALUES
  ('superadmin@ehms.demo',   'Front Desk',     'System Administrator',     80000),
  ('admin@ehms.demo',        'Sales & Marketing','Property Manager',        55000),
  ('frontdesk@ehms.demo',    'Front Desk',     'Guest Services Executive',  35000),
  ('housekeeping@ehms.demo', 'Housekeeping',   'Housekeeping Supervisor',   28000),
  ('maintenance@ehms.demo',  'Maintenance',    'Maintenance Technician',    32000),
  ('hr@ehms.demo',           'Human Resources','HR Manager',                55000),
  ('finance@ehms.demo',      'Finance',        'Finance Manager',           60000),
  ('executive@ehms.demo',    'Finance',        'Executive Director',        75000)
) AS e(email, dept_name, designation, salary) ON u.email = e.email
JOIN departments d ON d.name = e.dept_name
AND d.property_id = (SELECT id FROM properties WHERE code='OVH')
ON CONFLICT DO NOTHING;

-- ── Housekeeping Tasks ────────────────────────────────────────
WITH hotel_prop AS (SELECT id FROM properties WHERE code='OVH'),
     dirty_units AS (
       SELECT u.id FROM units u
       JOIN floors f ON u.floor_id=f.id
       JOIN buildings b ON f.building_id=b.id
       JOIN properties p ON b.property_id=p.id
       WHERE p.code='OVH' AND u.status IN ('dirty','vacant','occupied')
       LIMIT 12
     ),
     hk_user AS (SELECT id FROM users WHERE email='housekeeping@ehms.demo')
INSERT INTO housekeeping_tasks (unit_id, property_id, assigned_to, task_type, priority, status, scheduled_at)
SELECT
  du.id,
  (SELECT id FROM hotel_prop),
  (SELECT id FROM hk_user),
  t.task_type,
  t.priority::ticket_priority,
  t.status::ticket_status,
  NOW() + (t.offset_hours || ' hours')::interval
FROM dirty_units du
CROSS JOIN (VALUES
  ('deep_clean',     'high',   'open',         '0'),
  ('turnaround',     'medium', 'in_progress',  '1'),
  ('stayover_tidy',  'low',    'open',         '2'),
  ('inspection',     'medium', 'assigned',     '3'),
  ('turnaround',     'high',   'open',         '4'),
  ('deep_clean',     'critical','open',        '-1'),
  ('inspection',     'low',    'resolved',     '-2'),
  ('turnaround',     'medium', 'in_progress',  '0.5'),
  ('stayover_tidy',  'high',   'open',         '6'),
  ('deep_clean',     'medium', 'assigned',     '8'),
  ('turnaround',     'low',    'open',         '12'),
  ('inspection',     'high',   'in_progress',  '2')
) AS t(task_type, priority, status, offset_hours)
LIMIT 12
ON CONFLICT DO NOTHING;

-- ── Maintenance Tickets ───────────────────────────────────────
WITH hotel_prop AS (SELECT id FROM properties WHERE code='OVH'),
     maint_user AS (SELECT id FROM users WHERE email='maintenance@ehms.demo')
INSERT INTO maintenance_tickets (property_id, ticket_number, ticket_type, title, description, priority, status, category, reported_by)
SELECT
  (SELECT id FROM hotel_prop),
  t.ticket_number, t.ticket_type::text,
  t.title, t.description,
  t.priority::ticket_priority,
  t.status::ticket_status,
  t.category,
  (SELECT id FROM maint_user)
FROM (VALUES
  ('MT-001','corrective', 'AC unit malfunction – Room 301',     'AC not cooling. Compressor noise.',      'high',   'open',        'HVAC'),
  ('MT-002','corrective', 'Plumbing leak – Floor 2 corridor',   'Water dripping from ceiling joint.',     'critical','in_progress', 'Plumbing'),
  ('MT-003','preventive', 'Elevator B periodic maintenance',    'Quarterly service due.',                 'medium', 'assigned',    'Elevator'),
  ('MT-004','corrective', 'Smart lock battery – Room 215',      'Lock battery at 5%, replace.',           'low',    'open',        'Electrical'),
  ('MT-005','preventive', 'Pool filtration service',            'Scheduled bi-weekly clean.',             'medium', 'resolved',    'Pool'),
  ('MT-006','corrective', 'Broken window latch – Room 412',     'Latch broken on east-facing window.',    'high',   'open',        'Carpentry'),
  ('MT-007','corrective', 'Water heater failure – Room 507',    'No hot water in room.',                  'critical','in_progress', 'Plumbing'),
  ('MT-008','preventive', 'Fire alarm system check',            'Monthly fire alarm inspection.',         'medium', 'resolved',    'Safety'),
  ('MT-009','corrective', 'TV remote not working – Room 318',   'TV remote batteries dead / unit faulty.','low',    'open',        'Electronics'),
  ('MT-010','preventive', 'Generator monthly test run',         'Monthly load test of backup generator.', 'medium', 'assigned',    'Electrical')
) AS t(ticket_number, ticket_type, title, description, priority, status, category)
ON CONFLICT DO NOTHING;

-- ── Buildings, Floors & Units for Greenwood Residency (GWR) ──
WITH prop AS (SELECT id FROM properties WHERE code='GWR')
INSERT INTO buildings (property_id, name, code, floors)
SELECT prop.id, 'Residency Block 1', 'R1', 5 FROM prop
ON CONFLICT DO NOTHING;

WITH bld AS (SELECT b.id FROM buildings b JOIN properties p ON b.property_id=p.id WHERE p.code='GWR' AND b.code='R1')
INSERT INTO floors (building_id, name, floor_number)
SELECT bld.id, 'Floor '||gs, gs FROM bld, generate_series(1,5) gs
ON CONFLICT DO NOTHING;

INSERT INTO units (floor_id, unit_type, unit_label, layout_type, sq_ft, max_occupancy, base_rate, status)
SELECT
  f.id,
  'apartment'::unit_type,
  'GWR-' || (f.floor_number * 100 + gs)::text,
  'suite',
  1200,
  4,
  35000,
  'occupied'::room_status
FROM floors f, generate_series(1, 4) gs
WHERE f.floor_number <= 5
AND EXISTS (SELECT 1 FROM buildings b JOIN properties p ON b.property_id=p.id WHERE b.id=f.building_id AND p.code='GWR')
ON CONFLICT DO NOTHING;

-- ── Lease Agreements (for Rental vertical) ────────────────────
WITH rental_prop AS (SELECT id FROM properties WHERE code='GWR'),
     rental_units AS (
       SELECT u.id, ROW_NUMBER() OVER(ORDER BY u.unit_label) as rn
       FROM units u
       JOIN floors f ON u.floor_id=f.id
       JOIN buildings b ON f.building_id=b.id
       JOIN properties p ON b.property_id=p.id
       WHERE p.code='GWR'
     ),
     guest_sample AS (
       SELECT id, ROW_NUMBER() OVER(ORDER BY created_at) as rn FROM guest_profiles LIMIT 5
     )
INSERT INTO lease_agreements (property_id, unit_id, tenant_id, agreement_ref, status, start_date, end_date, rent_amount, security_deposit, notice_period_days)
SELECT
  (SELECT id FROM rental_prop),
  (SELECT id FROM rental_units WHERE rn = g.rn LIMIT 1),
  g.id,
  'LS-' || LPAD(g.rn::text, 4, '0'),
  (ARRAY['active','active','active','terminated','terminated'])[g.rn]::lease_status,
  NOW() - ((g.rn * 2) || ' months')::interval,
  NOW() + ((12 - g.rn) || ' months')::interval,
  (25000 + (g.rn * 3000))::numeric,
  (50000 + (g.rn * 5000))::numeric,
  30
FROM guest_sample g
ON CONFLICT DO NOTHING;

-- ── Invoices (finance data) ───────────────────────────────────
INSERT INTO invoices (property_id, booking_id, invoice_number, status, subtotal, tax_total, grand_total, paid_total, currency, due_date)
SELECT
  b.property_id,
  b.id,
  'INV-' || LPAD(ROW_NUMBER() OVER()::text, 5, '0'),
  CASE WHEN b.paid_amount >= b.total_amount THEN 'paid' ELSE 'sent' END::invoice_status,
  b.total_amount * 0.82,
  b.total_amount * 0.18,
  b.total_amount,
  b.paid_amount,
  'INR',
  b.check_out::date + 3
FROM bookings b
WHERE b.total_amount > 0
  AND b.status != 'cancelled'
ON CONFLICT DO NOTHING;

SELECT
  'Seed v2 complete!' AS status,
  (SELECT COUNT(*) FROM bookings)     AS bookings,
  (SELECT COUNT(*) FROM payments)     AS payments,
  (SELECT COUNT(*) FROM guest_profiles) AS guests,
  (SELECT COUNT(*) FROM users)        AS users,
  (SELECT COUNT(*) FROM employees)    AS employees,
  (SELECT COUNT(*) FROM units)        AS units;
