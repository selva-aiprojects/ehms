-- =============================================================
-- eHMS Demo Seed Data
-- Run AFTER all 001-012 schema files have been executed
-- =============================================================

-- Enterprise
INSERT INTO enterprises (name, code, currency, timezone) VALUES
  ('eHMS Hospitality Group', 'EHG', 'INR', 'Asia/Kolkata')
ON CONFLICT DO NOTHING;

-- Region
INSERT INTO regions (enterprise_id, name, code, country, state, city)
SELECT id, 'South India', 'SI', 'India', 'Tamil Nadu', 'Chennai'
FROM enterprises WHERE code = 'EHG'
ON CONFLICT DO NOTHING;

-- Properties (4 verticals)
INSERT INTO properties (region_id, name, code, vertical_type, booking_model, address, phone, email, star_rating)
SELECT r.id, p.name, p.code, p.vertical_type::vertical_type, p.booking_model::booking_model, p.address, p.phone, p.email, p.star
FROM regions r, (VALUES
  ('Oceanview Hotel', 'OVH', 'hotel', 'nightly', '12 Marina Beach Rd, Chennai', '+91-44-1001-0001', 'oceanview@ehms.demo', 5),
  ('Viswa Service Apartments', 'VSA', 'service_apartment', 'nightly', '45 Anna Salai, Chennai', '+91-44-1001-0002', 'viswa@ehms.demo', 4),
  ('Greenwood Residency', 'GWR', 'rental_apartment', 'lease', '78 Velachery Main Rd, Chennai', '+91-44-1001-0003', 'greenwood@ehms.demo', NULL),
  ('Innovate Coworking', 'ICS', 'workplace', 'hourly', '23 OMR Tech Park, Chennai', '+91-44-1001-0004', 'innovate@ehms.demo', NULL)
) AS p(name, code, vertical_type, booking_model, address, phone, email, star)
WHERE r.code = 'SI'
ON CONFLICT DO NOTHING;

-- Auth users (Supabase Auth — created via Supabase dashboard or auth.admin.createUser)
-- Demo app users (insert into public.users after creating auth users)
INSERT INTO users (email, phone, password_hash, first_name, last_name, is_active) VALUES
  ('superadmin@ehms.demo',   '+91-9000000000', crypt('Demo@1234', gen_salt('bf')), 'Joan',  'Smith',    true),
  ('admin@ehms.demo',        '+91-9000000001', crypt('Demo@1234', gen_salt('bf')), 'Admin', 'User',     true),
  ('frontdesk@ehms.demo',    '+91-9000000002', crypt('Demo@1234', gen_salt('bf')), 'Ravi',  'Kumar',    true),
  ('housekeeping@ehms.demo', '+91-9000000003', crypt('Demo@1234', gen_salt('bf')), 'Meena', 'Pillai',   true),
  ('maintenance@ehms.demo',  '+91-9000000004', crypt('Demo@1234', gen_salt('bf')), 'Arjun', 'Sharma',   true),
  ('hr@ehms.demo',           '+91-9000000005', crypt('Demo@1234', gen_salt('bf')), 'Priya', 'Nair',     true),
  ('finance@ehms.demo',      '+91-9000000006', crypt('Demo@1234', gen_salt('bf')), 'Vikram','Iyer',     true),
  ('executive@ehms.demo',    '+91-9000000007', crypt('Demo@1234', gen_salt('bf')), 'Anita', 'Desai',    true)
ON CONFLICT (email) DO NOTHING;

-- Assign roles to demo users (matches ROLE_ACCESS keys in role-access.ts)
INSERT INTO user_roles (user_id, role_id, property_id)
SELECT u.id, r.id, NULL
FROM users u, roles r
WHERE (u.email, r.name) IN (
  ('superadmin@ehms.demo',   'super_admin'),
  ('admin@ehms.demo',        'property_manager'),
  ('frontdesk@ehms.demo',    'front_desk'),
  ('housekeeping@ehms.demo', 'housekeeping_staff'),
  ('maintenance@ehms.demo',  'maintenance_staff'),
  ('hr@ehms.demo',           'hr_manager'),
  ('finance@ehms.demo',      'finance_manager'),
  ('executive@ehms.demo',    'executive')
)
ON CONFLICT (user_id, role_id, property_id) DO NOTHING;

-- Give super_admin also the executive role for full access
INSERT INTO user_roles (user_id, role_id, property_id)
SELECT u.id, r.id, NULL
FROM users u, roles r
WHERE u.email = 'superadmin@ehms.demo' AND r.name = 'executive'
ON CONFLICT (user_id, role_id, property_id) DO NOTHING;

-- Guest profiles (20 sample guests)
INSERT INTO guest_profiles (first_name, last_name, email, phone, nationality, id_type, id_number, id_verified, tags, loyalty_points, total_stays) VALUES
  ('Rajesh',   'Kumar',     'rajesh.kumar@gmail.com',    '+91-9811000001', 'Indian',    'aadhaar',    'XXXX-1234', true,  ARRAY['VIP'],       1500, 12),
  ('Sarah',    'Johnson',   'sarah.j@company.com',       '+1-202-555-0101','American',  'passport',   'US123456',  true,  ARRAY['corporate'],  800,  5),
  ('Amit',     'Sharma',    'amit.sharma@outlook.com',   '+91-9822000002', 'Indian',    'aadhaar',    'XXXX-5678', true,  ARRAY[]::text[],    200,  2),
  ('Priya',    'Patel',     'priya.patel@gmail.com',     '+91-9833000003', 'Indian',    'passport',   'IN789012',  true,  ARRAY['frequent'],   600,  8),
  ('Vikram',   'Singh',     'vikram.singh@corp.in',      '+91-9844000004', 'Indian',    'aadhaar',    'XXXX-9012', false, ARRAY['corporate'],  100,  1),
  ('Emily',    'Chen',      'emily.chen@startup.io',     '+65-9123-4567',  'Singaporean','passport',  'SG345678',  true,  ARRAY[]::text[],    300,  3),
  ('Mohammed', 'Al-Rashid', 'mo.rashid@gulf.ae',         '+971-50-123-456','UAE',       'passport',   'AE901234',  true,  ARRAY['VIP'],        2000, 18),
  ('Ananya',   'Krishnan',  'ananya.k@techfirm.com',     '+91-9855000005', 'Indian',    'driving_license','DL-TN123', true, ARRAY[]::text[], 400,  4),
  ('Rahul',    'Verma',     'rahul.verma@mnc.com',       '+91-9866000006', 'Indian',    'aadhaar',    'XXXX-3456', true,  ARRAY['corporate'],  700,  7),
  ('Kavya',    'Menon',     'kavya.menon@startup.in',    '+91-9877000007', 'Indian',    'passport',   'IN567890',  true,  ARRAY['frequent'],   900,  10)
ON CONFLICT DO NOTHING;

-- Buildings & Floors for Oceanview Hotel
WITH prop AS (SELECT id FROM properties WHERE code='OVH')
INSERT INTO buildings (property_id, name, code, floors)
SELECT prop.id, 'Main Wing', 'A', 10 FROM prop
ON CONFLICT DO NOTHING;

WITH bld AS (SELECT b.id FROM buildings b JOIN properties p ON b.property_id=p.id WHERE p.code='OVH' AND b.code='A')
INSERT INTO floors (building_id, name, floor_number)
SELECT bld.id, 'Floor '||gs, gs FROM bld, generate_series(1,5) gs
ON CONFLICT DO NOTHING;

-- Units for Oceanview Hotel (30 rooms across 5 floors)
INSERT INTO units (floor_id, unit_type, unit_label, layout_type, sq_ft, max_occupancy, base_rate, status)
SELECT
  f.id,
  CASE WHEN (gs % 10 = 1) THEN 'suite'::unit_type ELSE 'room'::unit_type END,
  (f.floor_number * 100 + gs)::text,
  CASE WHEN (gs % 10 = 1) THEN 'suite' WHEN gs % 3 = 0 THEN 'deluxe' ELSE 'standard' END,
  CASE WHEN gs % 10 = 1 THEN 650 ELSE 320 END,
  CASE WHEN gs % 10 = 1 THEN 4 ELSE 2 END,
  CASE WHEN gs % 10 = 1 THEN 8500 ELSE 4200 END,
  CASE
    WHEN gs % 5 = 0 THEN 'occupied'::room_status
    WHEN gs % 7 = 0 THEN 'dirty'::room_status
    WHEN gs % 11 = 0 THEN 'maintenance'::room_status
    ELSE 'vacant'::room_status
  END
FROM floors f, generate_series(1, 6) gs
WHERE f.floor_number <= 5
AND EXISTS (SELECT 1 FROM buildings b JOIN properties p ON b.property_id=p.id WHERE b.id=f.building_id AND p.code='OVH')
ON CONFLICT DO NOTHING;

-- Sample bookings (recent + upcoming)
WITH hotel_prop AS (SELECT id FROM properties WHERE code='OVH'),
     hotel_units AS (SELECT u.id FROM units u JOIN floors f ON u.floor_id=f.id JOIN buildings b ON f.building_id=b.id JOIN properties p ON b.property_id=p.id WHERE p.code='OVH' LIMIT 10),
     guests AS (SELECT id FROM guest_profiles LIMIT 6)
INSERT INTO bookings (property_id, unit_id, guest_id, booking_model, status, source, check_in, check_out, adults, children, total_amount, paid_amount)
SELECT
  (SELECT id FROM hotel_prop),
  (SELECT id FROM hotel_units ORDER BY random() LIMIT 1),
  g.id,
  'nightly',
  b.status::booking_status,
  b.source,
  b.check_in::timestamptz,
  b.check_out::timestamptz,
  b.adults, 0,
  b.total_amount, b.paid_amount
FROM guests g,
(VALUES
  ('checked_in',  'direct',      now() - interval '2 days', now() + interval '2 days', 2, 33600, 33600),
  ('confirmed',   'booking.com', now() + interval '1 day',  now() + interval '5 days', 1, 16800, 8400),
  ('checked_out', 'direct',      now() - interval '5 days', now() - interval '1 day',  2, 42000, 42000),
  ('confirmed',   'expedia',     now() + interval '3 days', now() + interval '7 days', 2, 16800, 0),
  ('pending',     'direct',      now() + interval '7 days', now() + interval '10 days',1, 12600, 0),
  ('cancelled',   'direct',      now() - interval '10 days',now() - interval '6 days', 2, 33600, 0)
) AS b(status, source, check_in, check_out, adults, total_amount, paid_amount)
LIMIT 6
ON CONFLICT DO NOTHING;

-- Housekeeping tasks
WITH hotel_prop AS (SELECT id FROM properties WHERE code='OVH'),
     dirty_units AS (SELECT u.id FROM units u JOIN floors f ON u.floor_id=f.id JOIN buildings b ON f.building_id=b.id JOIN properties p ON b.property_id=p.id WHERE p.code='OVH' AND u.status IN ('dirty','vacant') LIMIT 5),
     hk_user AS (SELECT id FROM users WHERE email='housekeeping@ehms.demo')
INSERT INTO housekeeping_tasks (unit_id, property_id, assigned_to, task_type, priority, status, scheduled_at)
SELECT
  du.id,
  (SELECT id FROM hotel_prop),
  (SELECT id FROM hk_user),
  t.task_type,
  t.priority::ticket_priority,
  t.status::ticket_status,
  now() + (t.offset_hours || ' hours')::interval
FROM dirty_units du,
(VALUES
  ('deep_clean',     'high',   'open',        '0'),
  ('turnaround',     'medium', 'in_progress',  '1'),
  ('stayover_tidy',  'low',    'open',         '2'),
  ('inspection',     'medium', 'assigned',     '3'),
  ('turnaround',     'high',   'open',         '4')
) AS t(task_type, priority, status, offset_hours)
LIMIT 5
ON CONFLICT DO NOTHING;

-- Maintenance tickets
WITH hotel_prop AS (SELECT id FROM properties WHERE code='OVH'),
     maint_user AS (SELECT id FROM users WHERE email='maintenance@ehms.demo')
INSERT INTO maintenance_tickets (property_id, ticket_number, ticket_type, title, description, priority, status, category, reported_by)
SELECT
  (SELECT id FROM hotel_prop),
  t.ticket_number, t.ticket_type,
  t.title, t.description,
  t.priority::ticket_priority,
  t.status::ticket_status,
  t.category,
  (SELECT id FROM maint_user)
FROM (VALUES
  ('MT-001', 'corrective',  'AC unit malfunction – Room 301',    'AC not cooling. Compressor noise.', 'high',   'open',        'HVAC'),
  ('MT-002', 'corrective',  'Plumbing leak – Floor 2 corridor',  'Water dripping from ceiling joint.','critical','in_progress', 'Plumbing'),
  ('MT-003', 'preventive',  'Elevator B periodic maintenance',   'Quarterly service due.',            'medium', 'assigned',    'Elevator'),
  ('MT-004', 'corrective',  'Smart lock battery – Room 215',     'Lock battery at 5%, replace.',      'low',    'open',        'Electrical'),
  ('MT-005', 'preventive',  'Pool filtration service',           'Scheduled bi-weekly clean.',        'medium', 'resolved',    'Pool')
) AS t(ticket_number, ticket_type, title, description, priority, status, category)
ON CONFLICT DO NOTHING;

-- Payments (linked to bookings)
INSERT INTO payments (property_id, booking_id, payment_method, amount, currency, status)
SELECT
  b.property_id,
  b.id,
  CASE WHEN random() > 0.5 THEN 'card' ELSE 'upi' END,
  b.paid_amount,
  'INR',
  'completed'
FROM bookings b
WHERE b.paid_amount > 0
ON CONFLICT DO NOTHING;

-- Departments
INSERT INTO departments (property_id, name, code)
SELECT p.id, dept.name, dept.code
FROM properties p, (VALUES
  ('Front Desk', 'FD'), ('Housekeeping', 'HK'), ('Maintenance', 'MT'),
  ('Finance', 'FN'), ('Human Resources', 'HR'), ('Food & Beverage', 'FB')
) AS dept(name, code)
WHERE p.code = 'OVH'
ON CONFLICT DO NOTHING;

-- Employees
INSERT INTO employees (user_id, employee_code, department_id, designation, employment_type, doj, base_salary)
SELECT
  u.id,
  'EMP-' || LPAD(ROW_NUMBER() OVER()::text, 4, '0'),
  d.id,
  e.designation,
  'full_time',
  now() - (random() * 365 * 3 || ' days')::interval,
  e.salary
FROM users u
JOIN (VALUES
  ('superadmin@ehms.demo',    'Front Desk',  'System Administrator',    80000),
  ('admin@ehms.demo',         'Front Desk',  'Property Administrator',  45000),
  ('frontdesk@ehms.demo',    'Front Desk',   'Guest Services Executive', 35000),
  ('housekeeping@ehms.demo', 'Housekeeping', 'Housekeeping Supervisor',  28000),
  ('maintenance@ehms.demo',  'Maintenance',  'Maintenance Technician',   32000),
  ('hr@ehms.demo',           'Human Resources','HR Manager',             55000),
  ('finance@ehms.demo',      'Finance',      'Finance Manager',          60000),
  ('executive@ehms.demo',    'Finance',      'Executive Director',       75000)
) AS e(email, dept_name, designation, salary) ON u.email = e.email
JOIN departments d ON d.name = e.dept_name
ON CONFLICT DO NOTHING;

-- Shift Rotations
INSERT INTO shift_rotations (property_id, name, start_time, end_time)
SELECT p.id, s.name, s.start_time::time, s.end_time::time
FROM properties p, (VALUES
  ('Morning', '06:00', '14:00'),
  ('Afternoon', '14:00', '22:00'),
  ('Night', '22:00', '06:00')
) AS s(name, start_time, end_time)
WHERE p.code = 'OVH'
ON CONFLICT DO NOTHING;

-- Leave Balances (allocate for each employee)
INSERT INTO leave_balances (employee_id, leave_type_id, total_allocated, used, pending)
SELECT e.id, lt.id, lt.days_per_year, (random() * lt.days_per_year * 0.4)::int, 0
FROM employees e
CROSS JOIN leave_types lt
ON CONFLICT DO NOTHING;

-- Sample Attendance Records (last 30 days)
INSERT INTO attendance_records (employee_id, property_id, clock_in, clock_out, status)
SELECT
  e.id,
  (SELECT p.id FROM properties p WHERE p.code = 'OVH' LIMIT 1),
  (now() - (d.offset || ' days')::interval)::date + time '09:00',
  (now() - (d.offset || ' days')::interval)::date + time '18:00',
  CASE WHEN random() < 0.85 THEN 'present' WHEN random() < 0.5 THEN 'late' ELSE 'present' END
FROM employees e
CROSS JOIN (SELECT generate_series(0, 29) AS offset) d
WHERE random() < 0.95
ON CONFLICT DO NOTHING;

-- Sample Payroll Run (current month)
INSERT INTO payroll_runs (property_id, period_start, period_end, status, processed_by)
SELECT p.id, date_trunc('month', now())::date, (date_trunc('month', now()) + interval '1 month - 1 day')::date, 'paid', u.id
FROM properties p
CROSS JOIN users u
WHERE p.code = 'OVH' AND u.email = 'hr@ehms.demo'
ON CONFLICT DO NOTHING;

-- Payroll Lines for each employee
INSERT INTO payroll_lines (payroll_id, employee_id, gross_pay, pf_deduction, esi_deduction, pt_deduction, tds_deduction, other_deductions)
SELECT
  pr.id,
  e.id,
  e.base_salary / 2,
  LEAST(e.base_salary * 0.5 * 0.12, 1800),
  CASE WHEN e.base_salary <= 21000 THEN e.base_salary * 0.0075 ELSE 0 END,
  200,
  CASE WHEN e.base_salary > 25000 THEN e.base_salary * 0.10 ELSE 0 END,
  0
FROM payroll_runs pr
CROSS JOIN employees e
WHERE pr.status = 'paid' AND e.is_active = true
ON CONFLICT DO NOTHING;

SELECT 'Seed complete! eHMS demo data loaded.' AS status;
