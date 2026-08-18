-- ============================================================
-- seed_v10_all_modules.sql — Populate every empty module table
-- Run AFTER seed_v9_complete_gaps.sql
-- Targets all tables across Admin, HR/Appraisal, Facilities &
-- Assets, F&B / KDS, Laundry, Loyalty & Guests, OTA / Booking
-- Engine, Payments, Pricing, WhatsApp, Multi-Property & Misc.
--
-- Idempotent: each section is guarded so re-runs are safe.
-- ============================================================

-- ============================================================
-- 1. ADMIN & SECURITY
-- ============================================================

-- 1.1 user_sessions
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_sessions) THEN
    INSERT INTO user_sessions (user_id, token_hash, ip_address, user_agent, device_info, is_active, logged_in_at, last_active_at, logged_out_at)
    SELECT u.id, encode(gen_random_bytes(32),'hex'),
           ('192.168.' || (10 + (random()*200)::int) || '.' || (1 + (random()*250)::int))::inet,
           'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0 Safari/537.36',
           'Chrome / Windows 11', true,
           now() - (n || ' days')::interval,
           now() - ((n-1) || ' days')::interval,
           CASE WHEN n > 5 THEN now() - ((n-5) || ' days')::interval ELSE NULL END
    FROM users u
    CROSS JOIN (VALUES (1),(2),(3),(4),(5),(6),(7),(8)) AS d(n)
    WHERE u.email IN ('superadmin@ehms.demo','admin@ehms.demo','frontdesk@ehms.demo','finance@ehms.demo','hr@ehms.demo');
  END IF;
END $$;

-- 1.2 login_attempts
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM login_attempts) THEN
    INSERT INTO login_attempts (email, ip_address, user_agent, success, failure_reason, attempted_at)
    VALUES
      ('superadmin@ehms.demo', '103.42.176.44'::inet, 'Chrome / Windows 11', true, NULL, now() - interval '2 hours'),
      ('admin@ehms.demo', '103.42.176.45'::inet, 'Safari / macOS', true, NULL, now() - interval '1 day'),
      ('frontdesk@ehms.demo', '103.42.176.46'::inet, 'Chrome / Windows 11', true, NULL, now() - interval '3 hours'),
      ('finance@ehms.demo', '103.42.176.47'::inet, 'Firefox / Linux', true, NULL, now() - interval '5 days'),
      ('hr@ehms.demo', '103.42.176.48'::inet, 'Chrome / Windows 11', true, NULL, now() - interval '6 days'),
      ('unknown@ehms.demo', '45.33.12.88'::inet, 'curl/8.0', false, 'invalid_credentials', now() - interval '1 day'),
      ('admin@ehms.demo', '45.33.12.89'::inet, 'curl/8.0', false, 'invalid_password', now() - interval '20 hours');
  END IF;
END $$;

-- 1.3 audit_logs
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM audit_logs) THEN
    INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_state, new_state, ip_address, user_agent, created_at)
    SELECT u.id, a.action, a.entity_type, a.entity_id::uuid, a.old_state::jsonb, a.new_state::jsonb,
           ('103.42.176.' || (40 + n))::inet, 'Chrome / Windows 11', now() - (n || ' days')::interval
    FROM users u
    CROSS JOIN (VALUES
      (1, 'booking.confirm',  'booking',   '55385dee-d7d8-4298-888f-b6f4d3b7ef69', '{"status":"pending"}', '{"status":"confirmed"}'),
      (2, 'checkin.complete', 'booking',   '48e941f9-06a5-4986-b1b8-c94ed610d8c0', '{"status":"confirmed"}', '{"status":"checked_in"}'),
      (3, 'payment.capture',  'payment',   '316cab87-a992-4a0e-9341-10c08e0f792c', '{"status":"authorized"}', '{"status":"completed"}'),
      (4, 'invoice.create',   'invoice',   '45498cec-8ff6-4022-9294-a0ba626a809a', '{}', '{"status":"sent"}'),
      (5, 'user.create',      'user',      'cbb64b2c-fa69-49ec-ac99-a8a8568a00ec', '{}', '{"email":"frontdesk@ehms.demo"}'),
      (6, 'rate.update',      'rate_plan', '56360508-3bae-4405-b980-f1b397493a25', '{"base_rate":5500}', '{"base_rate":5800}')
    ) AS a(n, action, entity_type, entity_id, old_state, new_state)
    WHERE u.email = 'admin@ehms.demo';
  END IF;
END $$;

-- 1.4 system_backups
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM system_backups) THEN
    INSERT INTO system_backups (backup_type, status, file_path, file_size_bytes, started_at, completed_at, error_message, triggered_by, created_at)
    SELECT 'full', 'completed', '/backups/hostsphere-' || to_char(gs, 'YYYYMMDD_HH24MI') || '.dump',
           250000000 + (ROW_NUMBER() OVER (ORDER BY gs) * 5000000)::bigint,
           gs::timestamptz, gs::timestamptz + interval '4 minutes', NULL,
           (SELECT id FROM users WHERE email='superadmin@ehms.demo'),
           gs::timestamptz
    FROM generate_series(now() - interval '10 days', now() - interval '1 day', interval '2 days') AS gs;
  END IF;
END $$;

-- 1.5 admin_notifications
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM admin_notifications) THEN
    INSERT INTO admin_notifications (title, message, notification_type, link, is_read, target_user_id, expires_at, created_at)
    VALUES
      ('New tenant registered', 'TechNova Corp requested a new workspace shard.', 'info', '/dashboard/admin/tenants', false, NULL, now() + interval '30 days', now() - interval '2 hours'),
      ('Database backup completed', 'Automated full backup finished successfully.', 'success', '/dashboard/admin/backup', false, NULL, now() + interval '30 days', now() - interval '5 hours'),
      ('Audit review due', 'Quarterly audit report is due in 5 days.', 'warning', '/dashboard/admin/audit', true, NULL, now() + interval '7 days', now() - interval '1 day'),
      ('High occupancy detected', 'Viswa Grand Hotel crossed 95% occupancy for the weekend.', 'warning', '/dashboard/hotels', false, NULL, now() + interval '7 days', now() - interval '6 hours'),
      ('Subscription expiring', 'Greenwood Residency plan renews in 12 days.', 'warning', '/dashboard/admin/tenants', true, NULL, now() + interval '14 days', now() - interval '2 days');
  END IF;
END $$;

-- ============================================================
-- 2. HR / APPRAISAL / ORG
-- ============================================================

-- 2.1 designations
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM designations) THEN
    INSERT INTO designations (name, code, department_id, level, is_active)
    SELECT d.dname, d.dcode,
           (SELECT dep.id FROM departments dep WHERE dep.code = d.depcode ORDER BY dep.name LIMIT 1),
           d.dlevel, true
    FROM (VALUES
      ('Front Desk Agent',      'FD-AGENT', 'FD', 1),
      ('Front Desk Supervisor', 'FD-SUP',   'FD', 2),
      ('Housekeeping Attendant','HK-ATT',   'HK', 1),
      ('Housekeeping Supervisor','HK-SUP',  'HK', 2),
      ('Maintenance Technician','MT-TECH',  'MT', 1),
      ('Maintenance Supervisor','MT-SUP',   'MT', 2),
      ('Executive Chef',        'FB-CHEF',  'FB', 3),
      ('Chef de Partie',        'FB-CDP',   'FB', 2),
      ('Commis',                'FB-COMMIS','FB', 1),
      ('Restaurant Captain',    'FB-CAP',   'FB', 2),
      ('Accountant',            'FN-ACC',   'FN', 1),
      ('Finance Manager',       'FN-MGR',   'FN', 3),
      ('HR Executive',          'HR-EXEC',  'HR', 1),
      ('HR Manager',            'HR-MGR',   'HR', 3),
      ('Sales Executive',       'SM-EXEC',  'SM', 1),
      ('Security Guard',        'SC-GUARD', 'SC', 1)
    ) AS d(dname, dcode, depcode, dlevel)
    WHERE NOT EXISTS (SELECT 1 FROM designations x WHERE x.code = d.dcode);
  END IF;
END $$;

-- 2.2 appraisal_cycles
DO $$
DECLARE
  v_super UUID; v_prop UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM appraisal_cycles) THEN
    SELECT id INTO v_super FROM users WHERE email='hr@ehms.demo';
    SELECT id INTO v_prop FROM properties WHERE code='OVH';
    INSERT INTO appraisal_cycles (property_id, name, cycle_type, period_start, period_end, rating_scale, status, created_by)
    VALUES
      (v_prop, 'H2 2025 Annual Appraisal', 'annual', '2025-07-01', '2025-12-31', 5, 'completed', v_super),
      (v_prop, 'H1 2026 Mid-Year Review', 'half_yearly', '2026-01-01', '2026-06-30', 5, 'in_progress', v_super),
      (v_prop, 'FY 2026 Annual Appraisal', 'annual', '2026-07-01', '2026-12-31', 5, 'draft', v_super);
  END IF;
END $$;

-- 2.3 appraisal_goals
DO $$
DECLARE
  v_cycle UUID;
  v_emp UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM appraisal_goals) THEN
    SELECT id INTO v_cycle FROM appraisal_cycles ORDER BY created_at LIMIT 1;
    FOR v_emp IN SELECT id FROM employees LIMIT 8 LOOP
      INSERT INTO appraisal_goals (cycle_id, employee_id, goal, weightage, target_date, status)
      VALUES
        (v_cycle, v_emp, 'Improve operational turnaround time by 15%', 40, '2025-12-31', 'completed'),
        (v_cycle, v_emp, 'Complete mandatory compliance trainings', 30, '2025-12-31', 'completed'),
        (v_cycle, v_emp, 'Drive customer satisfaction score above 4.5', 30, '2025-12-31', 'in_progress');
    END LOOP;
  END IF;
END $$;

-- 2.4 appraisal_reviews
DO $$
DECLARE
  v_cycle UUID; v_reviewer UUID; v_emp UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM appraisal_reviews) THEN
    SELECT id INTO v_cycle FROM appraisal_cycles ORDER BY created_at LIMIT 1;
    SELECT id INTO v_reviewer FROM users WHERE email='hr@ehms.demo';
    FOR v_emp IN SELECT id FROM employees LIMIT 8 LOOP
      INSERT INTO appraisal_reviews (cycle_id, employee_id, reviewer_id, self_rating, reviewer_rating, final_rating, self_comment, reviewer_comment, overall_score, status, submitted_at, reviewed_at)
      VALUES
        (v_cycle, v_emp, v_reviewer, 4.0, 4.2, 4.1, 'Consistent performance across the period.', 'Meets expectations with strong consistency.', 82.0, 'completed', now() - interval '20 days', now() - interval '18 days');
    END LOOP;
  END IF;
END $$;

-- 2.5 employee_promotions
DO $$
DECLARE
  v_hr UUID; v_bandA UUID; v_bandB UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM employee_promotions) THEN
    SELECT id INTO v_hr FROM users WHERE email='hr@ehms.demo';
    SELECT id INTO v_bandA FROM employee_bands WHERE code='BAND-A';
    SELECT id INTO v_bandB FROM employee_bands WHERE code='BAND-B';
    INSERT INTO employee_promotions (employee_id, from_designation, to_designation, from_band_id, to_band_id, from_ctc, to_ctc, effective_date, reason, approved_by, approved_at, status)
    SELECT e.id, 'Housekeeping Attendant', 'Housekeeping Supervisor', v_bandA, v_bandB, 240000, 300000, '2026-01-01',
           'Outstanding performance and leadership during peak season.', v_hr, now() - interval '30 days', 'approved'
    FROM employees e
    WHERE e.designation = 'Housekeeping Supervisor'
    LIMIT 1;
  END IF;
END $$;

-- 2.6 increments
DO $$
DECLARE
  v_emp UUID; v_hr UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM increments) THEN
    SELECT id INTO v_emp FROM employees LIMIT 1 OFFSET 2;
    SELECT id INTO v_hr FROM users WHERE email='hr@ehms.demo';
    INSERT INTO increments (employee_id, current_ctc, new_ctc, increment_pct, effective_date, reason, approved_by, approved_at, status)
    SELECT e.id, COALESCE(e.base_salary, 300000) * 12, COALESCE(e.base_salary, 300000) * 12 * 1.12,
           12.0, '2026-04-01', 'Annual performance increment',
           v_hr, now() - interval '10 days', 'approved'
    FROM employees e LIMIT 1 OFFSET 2;
  END IF;
END $$;

-- ============================================================
-- 3. FACILITIES, SERVICES, ROOM CATEGORIES, ASSETS, MATERIALS
-- ============================================================

-- 3.1 facilities
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM facilities) THEN
    INSERT INTO facilities (property_id, name, code, description, is_active)
    SELECT p.id, f.fname, f.fcode, f.fdesc, true
    FROM properties p
    CROSS JOIN (VALUES
      ('Swimming Pool', 'POOL', 'Outdoor temperature-controlled pool'),
      ('Gym & Fitness', 'GYM', '24/7 fitness center with modern equipment'),
      ('Spa & Wellness', 'SPA', 'Full-service spa, sauna and steam'),
      ('Restaurant', 'REST', 'Multi-cuisine restaurant'),
      ('Banquet Hall', 'BANQ', 'Event space for 200+ guests'),
      ('Conference Room', 'CONF', 'AV-equipped meeting rooms'),
      ('Laundry Service', 'LDRY', 'Same-day laundry & dry cleaning'),
      ('Parking', 'PARK', 'Valet & self parking')
    ) AS f(fname, fcode, fdesc)
    WHERE p.code IN ('OVH','CSA')
    AND NOT EXISTS (SELECT 1 FROM facilities x WHERE x.property_id=p.id AND x.code=f.fcode);
  END IF;
END $$;

-- 3.2 services
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM services) THEN
    INSERT INTO services (property_id, name, code, price, is_active)
    SELECT p.id, s.sname, s.scode, s.sprice, true
    FROM properties p
    CROSS JOIN (VALUES
      ('Airport Transfer', 'AIRPORT', 1200),
      ('Airport Transfer (Luxury)', 'AIRPORT-LUX', 2500),
      ('Sightseeing Tour', 'SIGHT', 1800),
      ('Doctor on Call', 'DOCTOR', 800),
      ('Babysitting (per hour)', 'BABY', 400),
      ('Extra Bed', 'EXTRA-BED', 1500),
      ('Spa Voucher', 'SPA-VOUCH', 2000),
      ('Late Checkout (per hour)', 'LATE-CO', 500)
    ) AS s(sname, scode, sprice)
    WHERE p.code IN ('OVH','CSA','GWR')
    AND NOT EXISTS (SELECT 1 FROM services x WHERE x.property_id=p.id AND x.code=s.scode);
  END IF;
END $$;

-- 3.3 room_categories
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM room_categories) THEN
    INSERT INTO room_categories (property_id, name, code, description, base_price, is_active)
    SELECT p.id, r.cat, r.ccode, r.cdesc, r.cprice, true
    FROM properties p
    CROSS JOIN (VALUES
      ('Standard', 'STD', 'Comfortable standard room', 4200),
      ('Deluxe',   'DLX', 'Spacious deluxe room with city view', 5800),
      ('Executive Suite', 'EXEC', 'Suite with lounge access', 8500),
      ('Presidential Suite', 'PRES', 'Premium suite with butler service', 15000),
      ('1BHK Apartment', '1BHK', 'One bedroom serviced apartment', 18000),
      ('2BHK Apartment', '2BHK', 'Two bedroom serviced apartment', 28000),
      ('3BHK Apartment', '3BHK', 'Three bedroom serviced apartment', 42000)
    ) AS r(cat, ccode, cdesc, cprice)
    WHERE p.code = 'OVH'
    AND NOT EXISTS (SELECT 1 FROM room_categories x WHERE x.property_id=p.id AND x.code=r.ccode);
  END IF;
END $$;

-- 3.4 asset_register
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM asset_register) THEN
    INSERT INTO asset_register (unit_id, property_id, asset_type, brand, model, serial_number, purchase_date, warranty_months, depreciation_method, depreciation_rate, current_value, status)
    SELECT u.id, p.id, a.asset_type, a.brand, a.model, a.serial, a.purchase_date, 36,
           'straight_line', 20.0, a.value * 0.7, 'active'
    FROM properties p
    JOIN units u ON u.id = (SELECT uu.id FROM units uu JOIN floors f ON uu.floor_id=f.id JOIN buildings b ON b.id=f.building_id WHERE b.property_id=p.id ORDER BY uu.unit_label LIMIT 1)
    CROSS JOIN (VALUES
      ('air_conditioner','Daikin','FTKM35','DKN-001', '2024-03-01'::date, 45000),
      ('television','Samsung','UA43','SAM-001', '2024-03-01'::date, 32000),
      ('refrigerator','LG','GL-292','LG-001', '2024-04-01'::date, 28000),
      ('water_heater','Racold','AB-15','RCL-001', '2024-04-01'::date, 12000),
      ('minibar','Bosch','MB-88','BOS-001', '2024-05-01'::date, 18000),
      ('safe','Godrej','GS-2','GOD-001', '2024-05-01'::date, 9000)
    ) AS a(asset_type, brand, model, serial, purchase_date, value)
    WHERE p.code = 'OVH'
    AND NOT EXISTS (SELECT 1 FROM asset_register ar WHERE ar.property_id=p.id);
  END IF;
END $$;

-- 3.5 material_types
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM material_types) THEN
    INSERT INTO material_types (name, code, description, is_active)
    VALUES
      ('Cleaning Chemicals', 'CHEM', 'Housekeeping cleaning agents', true),
      ('Linens & Textiles', 'LINEN', 'Bed sheets, towels, uniforms', true),
      ('Guest Amenities', 'AMEN', 'Toiletries, in-room amenities', true),
      ('Maintenance Spares', 'SPARES', 'HVAC, plumbing, electrical spares', true),
      ('Stationery', 'STAT', 'Office and front desk stationery', true),
      ('F&B Consumables', 'FBCON', 'Kitchen and restaurant consumables', true)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- 3.6 materials
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM materials) THEN
    INSERT INTO materials (type_id, name, code, unit_of_measure, reorder_level, is_active)
    SELECT t.id, m.mname, m.mcode, m.uom, m.reorder, true
    FROM material_types t
    CROSS JOIN (VALUES
      ('All-purpose cleaner', 'APC', 'Litre', 20),
      ('Glass cleaner', 'GC', 'Litre', 15),
      ('Disinfectant spray', 'DISP', 'Litre', 25),
      ('Bath towel', 'BTOW', 'Piece', 40),
      ('Hand towel', 'HTOW', 'Piece', 40),
      ('Pillow case', 'PCASE', 'Piece', 60),
      ('Shampoo 30ml', 'SHAM', 'Bottle', 50),
      ('Soap bar', 'SOAP', 'Piece', 50),
      ('LED bulb', 'LED', 'Piece', 30),
      ('Air filter', 'AFILTER', 'Piece', 10)
    ) AS m(mname, mcode, uom, reorder)
    WHERE t.code = 'CHEM' AND m.mcode IN ('APC','GC','DISP');
  END IF;
END $$;

-- 3.7 parts_inventory
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM parts_inventory) THEN
    INSERT INTO parts_inventory (property_id, part_name, part_code, quantity_in_stock, reorder_level, unit_price, vendor_id)
    SELECT p.id, pr.pname, pr.pcode, pr.qty, pr.reorder, pr.price,
           (SELECT id FROM vendors ORDER BY created_at LIMIT 1)
    FROM properties p
    CROSS JOIN (VALUES
      ('HVAC Air Filter', 'HVAC-FLT', 24, 8, 850),
      ('AC Capacitor 3uF', 'AC-CAP3', 12, 5, 450),
      ('AC Capacitor 5uF', 'AC-CAP5', 12, 5, 550),
      ('Water Pump Seal Kit', 'WP-SEAL', 8, 3, 1200),
      ('Bathroom Faucet Cartridge', 'FAUCET', 30, 10, 350),
      ('LED Downlight 9W', 'LED-9W', 40, 15, 180),
      ('Door Lock Cylinder', 'LOCK-CYL', 15, 6, 420),
      ('Room Thermostat', 'THERMO', 10, 4, 1800)
    ) AS pr(pname, pcode, qty, reorder, price)
    WHERE p.code IN ('OVH','CSA','GWR')
    AND NOT EXISTS (SELECT 1 FROM parts_inventory x WHERE x.property_id=p.id AND x.part_code=pr.pcode);
  END IF;
END $$;

-- 3.8 hardware_devices
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM hardware_devices) THEN
    INSERT INTO hardware_devices (property_id, device_type, device_name, serial_number, api_endpoint, api_key_enc, location, is_active, last_heartbeat)
    SELECT p.id, h.dtype, h.dname, h.serial, h.endpoint, 'enc::demo-key', h.loc, true, now() - (n || ' minutes')::interval
    FROM properties p
    CROSS JOIN (VALUES
      ('door_lock', 'Salto Lock Room 101', 'SAL-101-001', 'https://locks.example.com/api', 'Lobby Wing', 12),
      ('door_lock', 'Salto Lock Room 102', 'SAL-102-001', 'https://locks.example.com/api', 'Lobby Wing', 18),
      ('door_lock', 'Salto Lock Room 201', 'SAL-201-001', 'https://locks.example.com/api', 'East Wing', 7),
      ('kiosk',     'Check-in Kiosk 1', 'KIOSK-01', 'https://kiosk.example.com/api', 'Lobby', 5),
      ('printer',   'Folio Printer', 'PRN-01', NULL, 'Front Desk', 30),
      ('cctv',      'CCTV DVR 16ch', 'CCTV-16-01', 'https://cctv.example.com/api', 'Security Room', 1)
    ) AS h(dtype, dname, serial, endpoint, loc, n)
    WHERE p.code = 'OVH'
    AND NOT EXISTS (SELECT 1 FROM hardware_devices x WHERE x.property_id=p.id AND x.serial_number=h.serial);
  END IF;
END $$;

-- ============================================================
-- 4. F&B + RESTAURANT + KDS
-- ============================================================

-- 4.1 meal_plans
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM meal_plans) THEN
    INSERT INTO meal_plans (property_id, code, name, description, includes_breakfast, includes_lunch, includes_dinner)
    SELECT p.id, p.code || '-' || m.mcode, m.mname, m.mdesc, m.mb, m.ml, m.md
    FROM properties p
    CROSS JOIN (VALUES
      ('RO',   'Room Only',      'No meals included', false, false, false),
      ('BB',   'Bed & Breakfast', 'Breakfast included', true, false, false),
      ('HB',   'Half Board',     'Breakfast and dinner', true, false, true),
      ('FB',   'Full Board',     'All three meals', true, true, true),
      ('AI',   'All Inclusive',  'Meals and select beverages', true, true, true)
    ) AS m(mcode, mname, mdesc, mb, ml, md)
    WHERE p.code IN ('OVH','CSA')
    AND NOT EXISTS (SELECT 1 FROM meal_plans x WHERE x.property_id=p.id AND x.code=p.code || '-' || m.mcode);
  END IF;
END $$;

-- 4.2 restaurant_sections
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM restaurant_sections) THEN
    INSERT INTO restaurant_sections (property_id, name, description, sort_order, is_active)
    SELECT p.id, s.sname, s.sdesc, s.sort, true
    FROM properties p
    CROSS JOIN (VALUES
      ('Main Hall', 'Primary dining area', 1),
      ('Private Dinning', 'Private rooms and booths', 2),
      ('Terrace', 'Outdoor seating', 3),
      ('Bar', 'Bar and lounge area', 4)
    ) AS s(sname, sdesc, sort)
    WHERE p.code IN ('OVH','CSA')
    AND NOT EXISTS (SELECT 1 FROM restaurant_sections x WHERE x.property_id=p.id AND x.name=s.sname);
  END IF;
END $$;

-- 4.3 restaurant_tables
DO $$
DECLARE
  v_prop UUID; v_sec UUID;
  v_count INT; v_tnum INT;
BEGIN
  FOR v_prop IN SELECT id FROM properties WHERE code IN ('OVH','CSA')
  LOOP
    SELECT COUNT(*) INTO v_count FROM restaurant_tables WHERE property_id = v_prop;
    IF v_count = 0 THEN
      v_tnum := 0;
      FOR v_sec IN SELECT id FROM restaurant_sections WHERE property_id = v_prop ORDER BY id
      LOOP
        INSERT INTO restaurant_tables (property_id, section_id, table_number, capacity, status, shape, pos_x, pos_y)
        SELECT v_prop, v_sec, 'T' || (v_tnum + t.n), CASE WHEN t.n % 3 = 0 THEN 6 WHEN t.n % 3 = 1 THEN 2 ELSE 4 END, 'available',
               CASE WHEN t.n % 4 = 0 THEN 'round' WHEN t.n % 4 = 1 THEN 'square' ELSE 'rectangle' END,
               ((t.n % 5) * 90)::numeric + 20, ((t.n / 5)::int * 90)::numeric + 20
        FROM generate_series(1, 12) AS t(n);
        v_tnum := v_tnum + 12;
      END LOOP;
    END IF;
  END LOOP;
END $$;

-- 4.4 table_reservations
DO $$
DECLARE
  v_tbl UUID; v_prop UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM table_reservations) THEN
    FOR v_tbl IN SELECT id FROM restaurant_tables LIMIT 5
    LOOP
      SELECT property_id INTO v_prop FROM restaurant_tables WHERE id = v_tbl;
      INSERT INTO table_reservations (property_id, table_id, booking_id, guest_name, guest_phone, party_size, reservation_time, duration_mins, status, notes)
      VALUES
        (v_prop, v_tbl, NULL, 'Walk-in Guest', '9876543210', 2, now() + interval '1 day' + ((random()*6)::int || ' hours')::interval, 90, 'confirmed', 'Window table preferred'),
        (v_prop, v_tbl, NULL, 'Corporate Dinner', '9988776655', 6, now() + interval '2 days', 120, 'pending', 'Allergies: nuts');
    END LOOP;
  END IF;
END $$;

-- 4.5 f_and_b_orders
DO $$
DECLARE
  v_book RECORD;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM f_and_b_orders) THEN
    FOR v_book IN SELECT b.id, b.property_id, b.unit_id FROM bookings b WHERE b.status IN ('checked_in','confirmed') LIMIT 8
    LOOP
      INSERT INTO f_and_b_orders (property_id, booking_id, unit_id, order_type, status, total_amount, is_complimentary, ordered_at, delivered_at, notes)
      VALUES
        (v_book.property_id, v_book.id, v_book.unit_id, 'room_service', 'delivered', 680, false, now() - interval '3 hours', now() - interval '2 hours', 'Room 101'),
        (v_book.property_id, v_book.id, v_book.unit_id, 'room_service', 'delivered', 520, false, now() - interval '1 day', now() - interval '23 hours', 'Breakfast tray');
    END LOOP;
  END IF;
END $$;

-- 4.6 f_and_b_order_items
DO $$
DECLARE
  v_order RECORD; v_item UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM f_and_b_order_items) THEN
    FOR v_order IN SELECT id FROM f_and_b_orders LIMIT 10
    LOOP
      SELECT id INTO v_item FROM f_and_b_menu ORDER BY random() LIMIT 1;
      INSERT INTO f_and_b_order_items (order_id, menu_item_id, quantity, unit_price, subtotal, item_name, special_request)
      SELECT v_order.id, m.id, (q.n), m.price, m.price * q.n, m.item_name, 'Extra spicy'
      FROM f_and_b_menu m
      CROSS JOIN (VALUES (1),(2)) AS q(n)
      ORDER BY m.item_name
      LIMIT 2;
    END LOOP;
  END IF;
END $$;

-- 4.7 split_bills
DO $$
DECLARE
  v_order UUID; v_prop UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM split_bills) THEN
    FOR v_order IN SELECT id FROM f_and_b_orders ORDER BY ordered_at LIMIT 4
    LOOP
      SELECT property_id INTO v_prop FROM f_and_b_orders WHERE id = v_order;
      INSERT INTO split_bills (property_id, order_id, split_type, total_amount, guest_count, status)
      VALUES (v_prop, v_order, 'equal', (SELECT SUM(subtotal) FROM f_and_b_order_items WHERE order_id=v_order), 2, 'paid');
    END LOOP;
  END IF;
END $$;

-- 4.8 split_bill_items
DO $$
DECLARE
  v_split UUID; v_item UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM split_bill_items) THEN
    FOR v_split IN SELECT id FROM split_bills
    LOOP
      INSERT INTO split_bill_items (split_bill_id, order_item_id, label, amount, percentage, is_paid, paid_at, payment_method)
      SELECT v_split, NULL, 'Guest 1', total_amount / 2, 50.00, true, now() - interval '1 hour', 'UPI'
      FROM split_bills WHERE id = v_split;
      INSERT INTO split_bill_items (split_bill_id, order_item_id, label, amount, percentage, is_paid, payment_method)
      SELECT v_split, NULL, 'Guest 2', total_amount / 2, 50.00, false, 'Cash'
      FROM split_bills WHERE id = v_split;
    END LOOP;
  END IF;
END $$;

-- 4.9 kds_stations
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM kds_stations) THEN
    INSERT INTO kds_stations (property_id, name, station_type, is_active, display_order)
    SELECT p.id, s.sname, s.stype, true, s.sort
    FROM properties p
    CROSS JOIN (VALUES
      ('Hot Kitchen', 'hot', 1),
      ('Cold Kitchen', 'cold', 2),
      ('Grill Station', 'grill', 3),
      ('Bar / Beverages', 'bar', 4)
    ) AS s(sname, stype, sort)
    WHERE p.code IN ('OVH','CSA')
    AND NOT EXISTS (SELECT 1 FROM kds_stations x WHERE x.property_id=p.id AND x.name=s.sname);
  END IF;
END $$;

-- 4.10 kds_tickets
DO $$
DECLARE
  v_order RECORD; v_prop UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM kds_tickets) THEN
    FOR v_order IN SELECT id, property_id FROM f_and_b_orders LIMIT 6
    LOOP
      INSERT INTO kds_tickets (property_id, order_id, table_number, priority, status, station, fired_at, acknowledged_at, ready_at, served_at, notes)
      VALUES (v_order.property_id, v_order.id, 'T1', 'normal', 'served', 'Hot Kitchen',
              now() - interval '3 hours', now() - interval '2 hours 50 min', now() - interval '2 hours 30 min', now() - interval '2 hours', 'Fire in order of ticket');
    END LOOP;
  END IF;
END $$;

-- ============================================================
-- 5. LAUNDRY & LINEN
-- ============================================================

-- 5.1 laundry_orders
DO $$
DECLARE
  v_book RECORD;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM laundry_orders) THEN
    FOR v_book IN SELECT b.id, b.property_id, b.unit_id, b.guest_id FROM bookings b WHERE b.status IN ('checked_in','confirmed') LIMIT 6
    LOOP
      INSERT INTO laundry_orders (property_id, booking_id, guest_id, unit_id, order_number, status, total_amount, is_complimentary, special_instructions, estimated_delivery, actual_delivery, vendor_id, created_by)
      VALUES (v_book.property_id, v_book.id, v_book.guest_id, v_book.unit_id,
              'LND-' || to_char(now(),'YYYYMMDD') || '-' || floor(random()*900+100)::int,
              'delivered', 260, false, 'Fold all items, no starch',
              now() - interval '5 hours', now() - interval '3 hours',
              (SELECT id FROM vendors WHERE company_name LIKE '%Laundry%' LIMIT 1),
              (SELECT id FROM users WHERE email='frontdesk@ehms.demo'));
    END LOOP;
  END IF;
END $$;

-- 5.2 laundry_order_items
DO $$
DECLARE
  v_order UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM laundry_order_items) THEN
    FOR v_order IN SELECT id FROM laundry_orders
    LOOP
      INSERT INTO laundry_order_items (order_id, item_name, item_type, quantity, unit_price, wash_type, status, notes)
      VALUES
        (v_order, 'Shirt', 'Clothing', 2, 40, 'regular', 'completed', NULL),
        (v_order, 'Trousers', 'Clothing', 2, 45, 'regular', 'completed', NULL),
        (v_order, 'Suit (2-piece)', 'Clothing', 1, 250, 'dry_clean', 'completed', NULL);
    END LOOP;
  END IF;
END $$;

-- 5.3 linen_items (referenced to existing linen_batches)
DO $$
DECLARE
  v_batch RECORD;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM linen_items) THEN
    FOR v_batch IN SELECT * FROM linen_batches LIMIT 6
    LOOP
      INSERT INTO linen_items (property_id, batch_id, rfid_tag, item_type, status, assigned_unit, last_cleaned, lifecycle_count)
      SELECT v_batch.property_id, v_batch.id, 'RFID-' || v_batch.batch_id || '-' || lpad(n::text,3,'0'),
             v_batch.item_type, 'in_stock', NULL, now() - interval '2 days', 12
      FROM generate_series(1, 6) AS n;
    END LOOP;
  END IF;
END $$;

-- ============================================================
-- 6. LOYALTY & GUEST EXPERIENCE
-- ============================================================

-- 6.1 loyalty_tiers
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM loyalty_tiers) THEN
    INSERT INTO loyalty_tiers (property_id, name, min_stays, min_spend, discount_pct, points_multiplier, benefits, tier_order, is_active)
    SELECT p.id, t.tname, t.min_stays, t.min_spend, t.disc, t.mult, t.benefits, t.torder, true
    FROM properties p
    CROSS JOIN (VALUES
      ('Bronze', 0, 0, 0, 1.0, '["5% off F&B","Welcome drink"]'::jsonb, 1),
      ('Silver', 5, 50000, 5, 1.2, '["10% off F&B","Late checkout","Welcome drink"]'::jsonb, 2),
      ('Gold', 15, 200000, 8, 1.5, '["15% off F&B","Room upgrade","Late checkout","Priority booking"]'::jsonb, 3),
      ('Platinum', 30, 500000, 12, 2.0, '["20% off F&B","Suite upgrade","Butler service","Free airport transfer"]'::jsonb, 4)
    ) AS t(tname, min_stays, min_spend, disc, mult, benefits, torder)
    WHERE p.code = 'OVH'
    AND NOT EXISTS (SELECT 1 FROM loyalty_tiers x WHERE x.property_id=p.id AND x.name=t.tname);
  END IF;
END $$;

-- 6.2 loyalty_rewards
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM loyalty_rewards) THEN
    INSERT INTO loyalty_rewards (property_id, name, description, reward_type, points_required, value, is_active)
    SELECT p.id, r.rname, r.rdesc, r.rtype, r.rpoints, r.rvalue, true
    FROM properties p
    CROSS JOIN (VALUES
      ('Room Upgrade', 'Complimentary upgrade to next room category', 'room_upgrade', 2500, 3000),
      ('Free Breakfast', 'Complimentary breakfast for two', 'free_breakfast', 800, 700),
      ('Spa Credit', 'INR 1000 spa and wellness credit', 'spa_credit', 1500, 1000),
      ('F&B Credit', 'INR 1500 dining credit', 'fb_credit', 2000, 1500),
      ('Free Night', 'Complimentary night on standard room', 'free_night', 5000, 4200),
      ('Late Checkout', 'Complimentary late checkout till 4pm', 'late_checkout', 400, 500)
    ) AS r(rname, rdesc, rtype, rpoints, rvalue)
    WHERE p.code = 'OVH'
    AND NOT EXISTS (SELECT 1 FROM loyalty_rewards x WHERE x.property_id=p.id AND x.name=r.rname);
  END IF;
END $$;

-- 6.3 loyalty_transactions
DO $$
DECLARE
  v_guest UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM loyalty_transactions) THEN
    FOR v_guest IN SELECT id FROM guest_profiles ORDER BY created_at LIMIT 8
    LOOP
      INSERT INTO loyalty_transactions (guest_id, booking_id, points, type, description)
      VALUES
        (v_guest, (SELECT id FROM bookings WHERE guest_id=v_guest LIMIT 1), 120, 'earned', 'Stay points credited'),
        (v_guest, NULL, 50, 'bonus', 'Sign-up bonus'),
        (v_guest, NULL, 25, 'expired', 'Points expired after 12 months');
    END LOOP;
  END IF;
END $$;

-- 6.4 loyalty_redemptions
DO $$
DECLARE
  v_guest UUID; v_reward UUID; v_book UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM loyalty_redemptions) THEN
    FOR v_guest IN SELECT id FROM guest_profiles ORDER BY created_at LIMIT 3
    LOOP
      SELECT id INTO v_reward FROM loyalty_rewards ORDER BY points_required LIMIT 1;
      SELECT id INTO v_book FROM bookings WHERE guest_id=v_guest LIMIT 1;
      INSERT INTO loyalty_redemptions (guest_id, reward_id, booking_id, points_used, redeemed_at, status)
      VALUES (v_guest, v_reward, v_book, 800, now() - interval '5 days', 'fulfilled');
    END LOOP;
  END IF;
END $$;

-- 6.5 guest_preferences
DO $$
DECLARE
  v_guest UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM guest_preferences) THEN
    FOR v_guest IN SELECT id FROM guest_profiles ORDER BY created_at LIMIT 6
    LOOP
      INSERT INTO guest_preferences (guest_id, preference_key, preference_value)
      VALUES
        (v_guest, 'room_floor', 'High floor'),
        (v_guest, 'bed_type', 'King'),
        (v_guest, 'pillow', 'Feather'),
        (v_guest, 'newspaper', 'The Hindu'),
        (v_guest, 'minibar', 'No minibar')
      ON CONFLICT (guest_id, preference_key) DO NOTHING;
    END LOOP;
  END IF;
END $$;

-- 6.6 guest_communications
DO $$
DECLARE
  v_guest UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM guest_communications) THEN
    FOR v_guest IN SELECT id FROM guest_profiles ORDER BY created_at LIMIT 6
    LOOP
      INSERT INTO guest_communications (guest_id, channel, template, sent_at, status, error_message)
      VALUES
        (v_guest, 'email', 'booking_confirmation', now() - interval '10 days', 'sent', NULL),
        (v_guest, 'whatsapp', 'pre_arrival', now() - interval '2 days', 'sent', NULL),
        (v_guest, 'email', 'invoice', now() - interval '1 day', 'sent', NULL);
    END LOOP;
  END IF;
END $$;

-- 6.7 guest_timeline
DO $$
DECLARE
  v_guest UUID; v_book UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM guest_timeline) THEN
    FOR v_guest IN SELECT id FROM guest_profiles ORDER BY created_at LIMIT 6
    LOOP
      SELECT id INTO v_book FROM bookings WHERE guest_id=v_guest LIMIT 1;
      INSERT INTO guest_timeline (guest_id, event_type, event_data, event_at)
      VALUES
        (v_guest, 'booking_created', jsonb_build_object('booking_id', v_book), now() - interval '12 days'),
        (v_guest, 'pre_arrival_email', jsonb_build_object('channel','email'), now() - interval '2 days'),
        (v_guest, 'checked_in', jsonb_build_object('booking_id', v_book), now() - interval '1 day'),
        (v_guest, 'feedback_submitted', jsonb_build_object('rating', 5), now() - interval '5 hours');
    END LOOP;
  END IF;
END $$;

-- 6.8 guest_feedback (table from migration 015, distinct from guest_feedbacks)
DO $$
DECLARE
  v_book RECORD;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM guest_feedback) THEN
    FOR v_book IN SELECT id, property_id FROM bookings WHERE status='checked_out' LIMIT 6
    LOOP
      INSERT INTO guest_feedback (property_id, booking_id, department, rating, comments, submitted_at)
      VALUES
        (v_book.property_id, v_book.id, 'housekeeping', 5, 'Room was spotless and well maintained.', now() - interval '3 days'),
        (v_book.property_id, v_book.id, 'front_desk', 4, 'Check-in was quick and friendly.', now() - interval '2 days'),
        (v_book.property_id, v_book.id, 'f_and_b', 5, 'Excellent breakfast spread.', now() - interval '1 day');
    END LOOP;
  END IF;
END $$;

-- 6.9 booking_guests
DO $$
DECLARE
  v_book RECORD;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM booking_guests) THEN
    FOR v_book IN SELECT id, guest_id FROM bookings LIMIT 8
    LOOP
      INSERT INTO booking_guests (booking_id, guest_id, is_primary)
      VALUES (v_book.id, v_book.guest_id, true);
    END LOOP;
  END IF;
END $$;

-- 6.10 corporate_members
DO $$
DECLARE
  v_corp UUID; v_guest UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM corporate_members) THEN
    SELECT id INTO v_corp FROM corporate_accounts LIMIT 1;
    FOR v_guest IN SELECT id FROM guest_profiles WHERE email LIKE '%@company.com' OR email LIKE '%@corp.in' LIMIT 4
    LOOP
      INSERT INTO corporate_members (corporate_id, guest_id, designation, employee_id, is_approved)
      VALUES (v_corp, v_guest, 'Senior Manager', 'EMP-' || floor(random()*9000+1000)::int, true);
    END LOOP;
  END IF;
END $$;

-- ============================================================
-- 7. OTA / BOOKING ENGINE
-- ============================================================

-- 7.1 booking_engine_config
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM booking_engine_config) THEN
    INSERT INTO booking_engine_config (property_id, hero_image, tagline, description, theme_color, cancellation_policy, payment_methods, require_advance_payment, advance_percentage, min_advance_amount, check_in_time, check_out_time, terms_html, is_active)
    SELECT p.id, '/hostsphere-logo.png', 'Book your perfect stay with ' || p.name,
           'Experience world-class hospitality with instant booking confirmation.',
           '#7BB347', 'Free cancellation up to 24 hours before check-in.',
           '["razorpay","upi","card","cash"]'::jsonb, true, 20, 1000,
           p.check_in_time, p.check_out_time, '<p>Standard hotel terms apply.</p>', true
    FROM properties p
    WHERE p.code IN ('OVH','CSA','GWR')
    AND NOT EXISTS (SELECT 1 FROM booking_engine_config x WHERE x.property_id=p.id);
  END IF;
END $$;

-- 7.2 booking_engine_sessions
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM booking_engine_sessions) THEN
    INSERT INTO booking_engine_sessions (property_id, session_token, guest_name, guest_email, guest_phone, check_in, check_out, adults, children, unit_type, promo_code, created_at, expires_at)
    SELECT p.id, 'sess_' || encode(gen_random_bytes(16),'hex'), g.first_name || ' ' || g.last_name, g.email, COALESCE(g.phone,'9000000000'),
           (CURRENT_DATE + 5), (CURRENT_DATE + 8), 2, 1, u.unit_type::text, 'WELCOME10',
           now() - interval '1 hour', now() + interval '23 hours'
    FROM properties p
    CROSS JOIN guest_profiles g
    JOIN LATERAL (SELECT unit_type FROM units WHERE (SELECT b.property_id FROM buildings b JOIN floors fl ON fl.building_id=b.id JOIN units uu ON uu.floor_id=fl.id WHERE uu.id=units.id) IS NOT NULL LIMIT 1) u ON true
    WHERE p.code='OVH' AND g.id IN (SELECT id FROM guest_profiles ORDER BY created_at LIMIT 3)
    AND NOT EXISTS (SELECT 1 FROM booking_engine_sessions x WHERE x.property_id=p.id)
    LIMIT 3;
  END IF;
END $$;

-- 7.3 ota_channel_config
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM ota_channel_config) THEN
    INSERT INTO ota_channel_config (property_id, channel_name, api_endpoint, api_key_enc, property_mapping, is_active, last_sync_at)
    SELECT p.id, cp.name, 'https://' || lower(replace(cp.name,' ','')) || '.example.com/api', 'enc::demo', ('{"property_ref":"' || p.code || '"}')::jsonb, true, now() - interval '30 minutes'
    FROM properties p
    CROSS JOIN channel_partners cp
    WHERE p.code IN ('OVH','CSA')
    AND NOT EXISTS (SELECT 1 FROM ota_channel_config x WHERE x.property_id=p.id AND x.channel_name=cp.name);
  END IF;
END $$;

-- 7.4 ota_rate_mappings
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM ota_rate_mappings) THEN
    INSERT INTO ota_rate_mappings (property_id, channel_id, unit_type, channel_room_type_code, channel_room_name, rate_multiplier, is_active, last_synced_at)
    SELECT p.id, cp.id, m.utype, m.ccode, m.cname, m.mult, true, now() - interval '30 minutes'
    FROM properties p
    CROSS JOIN channel_partners cp
    CROSS JOIN (VALUES
      ('room', 'ROOM_STD', 'Standard Room', 1.05),
      ('room', 'ROOM_DLX', 'Deluxe Room', 1.08),
      ('suite','ROOM_EXEC', 'Executive Suite', 1.10)
    ) AS m(utype, ccode, cname, mult)
    WHERE p.code = 'OVH' AND cp.name IN ('Booking.com','MakeMyTrip / GoIbibo','Agoda')
    ON CONFLICT (property_id, channel_id, unit_type) DO NOTHING;
  END IF;
END $$;

-- 7.5 ota_commission_rates
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM ota_commission_rates) THEN
    INSERT INTO ota_commission_rates (channel_id, property_id, unit_type, commission_pct, effective_from, effective_to, is_active)
    SELECT cp.id, p.id, m.utype, cp.commission_rate, '2026-01-01'::date, NULL, true
    FROM channel_partners cp
    CROSS JOIN properties p
    CROSS JOIN (VALUES ('room'),('suite'),('apartment')) AS m(utype)
    WHERE p.code IN ('OVH','CSA')
    AND NOT EXISTS (SELECT 1 FROM ota_commission_rates x WHERE x.channel_id=cp.id AND x.property_id=p.id AND x.unit_type=m.utype);
  END IF;
END $$;

-- 7.6 ota_rate_queue
DO $$
DECLARE
  v_map RECORD;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM ota_rate_queue) THEN
    FOR v_map IN SELECT id, property_id FROM ota_rate_mappings LIMIT 6
    LOOP
      INSERT INTO ota_rate_queue (property_id, mapping_id, date, rate, currency, status, error_message, created_at, synced_at)
      SELECT v_map.property_id, v_map.id, d, 4500 + (random()*2000)::int, 'INR', 'synced', NULL,
             now() - interval '1 hour', now() - interval '30 minutes'
      FROM generate_series(CURRENT_DATE, CURRENT_DATE + 14, '1 day') AS d;
    END LOOP;
  END IF;
END $$;

-- 7.7 ota_availability_queue
DO $$
DECLARE
  v_unit UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM ota_availability_queue) THEN
    FOR v_unit IN SELECT id FROM units WHERE unit_type IN ('room','suite') LIMIT 6
    LOOP
      INSERT INTO ota_availability_queue (property_id, unit_id, date, available, rate, min_stay, status, error_message, created_at, synced_at)
      SELECT (SELECT b.property_id FROM floors f JOIN buildings b ON b.id=f.building_id WHERE f.id=u.floor_id), v_unit, d, true, 4500, 1, 'synced', NULL,
             now() - interval '1 hour', now() - interval '30 minutes'
      FROM units u, generate_series(CURRENT_DATE, CURRENT_DATE + 14, '1 day') AS d
      WHERE u.id = v_unit;
    END LOOP;
  END IF;
END $$;

-- 7.8 ota_booking_queue
DO $$
DECLARE
  v_chan UUID; v_prop UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM ota_booking_queue) THEN
    SELECT id INTO v_chan FROM channel_partners WHERE code='booking_com';
    SELECT id INTO v_prop FROM properties WHERE code='OVH';
    INSERT INTO ota_booking_queue (property_id, channel_id, channel_booking_ref, guest_name, guest_email, guest_phone, unit_type, check_in, check_out, adults, children, total_amount, commission, net_amount, status, internal_booking_id, raw_payload, error_message, created_at, processed_at)
    SELECT v_prop, v_chan, 'BK-' || lpad(n::text, 8, '0'), 'OTA Guest ' || n, 'ota.guest' || n || '@mail.com', '98' || lpad(n::text,8,'0'),
           'room', CURRENT_DATE + 3, CURRENT_DATE + 6, 2, 0, 12600, 1890, 10710, 'created',
           (SELECT id FROM bookings WHERE source='booking.com' LIMIT 1),
           jsonb_build_object('channel','booking_com','booking_ref','BK-' || n), NULL,
           now() - (n || ' days')::interval, now() - ((n-1) || ' days')::interval
    FROM generate_series(1, 5) AS n
    WHERE NOT EXISTS (SELECT 1 FROM ota_booking_queue WHERE channel_id=v_chan AND channel_booking_ref='BK-1');
  END IF;
END $$;

-- 7.9 ota_settlements
DO $$
DECLARE
  v_chan RECORD;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM ota_settlements) THEN
    FOR v_chan IN SELECT id FROM channel_partners
    LOOP
      INSERT INTO ota_settlements (property_id, channel_id, settlement_ref, period_start, period_end, gross_amount, commission, net_amount, booking_count, status, paid_at)
      SELECT p.id, v_chan.id, cp.code || '-STL-' || n, (date_trunc('month', CURRENT_DATE) - interval '1 month' + (n || ' months')::interval)::date,
             (date_trunc('month', CURRENT_DATE) + (n-1 || ' months')::interval - interval '1 day')::date,
             120000, 18000, 102000, 12, 'paid', now() - interval '10 days'
      FROM properties p
      CROSS JOIN channel_partners cp
      CROSS JOIN generate_series(0, 2) AS n
      WHERE p.code='OVH' AND cp.id = v_chan.id
      AND NOT EXISTS (SELECT 1 FROM ota_settlements x WHERE x.channel_id=v_chan.id AND x.property_id=p.id AND x.period_start=(date_trunc('month', CURRENT_DATE) - interval '1 month')::date);
    END LOOP;
  END IF;
END $$;

-- 7.10 central_rate_plans
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM central_rate_plans) THEN
    INSERT INTO central_rate_plans (group_id, name, description, is_active, base_rates, seasonal_mult, weekday_rules, weekend_rules, effective_from, effective_to)
    SELECT pg.id, 'Group Standard Plan', 'Default central rate plan for all properties', true,
           '{"room":4200,"suite":8500,"apartment":18000}'::jsonb,
           '{"peak":1.3,"offseason":0.8}'::jsonb,
           '{"mon-3%":true}'::jsonb,
           '{"fri-sun:+15%":true}'::jsonb,
           '2026-01-01'::date, '2027-12-31'::date
    FROM property_groups pg LIMIT 1;
  END IF;
END $$;

-- 7.11 cross_property_guests
DO $$
DECLARE
  v_group UUID; v_guest UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cross_property_guests) THEN
    SELECT id INTO v_group FROM property_groups LIMIT 1;
    FOR v_guest IN SELECT id FROM guest_profiles ORDER BY created_at LIMIT 6
    LOOP
      INSERT INTO cross_property_guests (group_id, master_guest_id, total_stays, total_spend, total_nights, avg_rating, favorite_property_id, last_stay_property_id, last_stay_at, loyalty_points, loyalty_tier, tags, notes)
      VALUES (v_group, v_guest, 4 + floor(random()*10)::int, 60000 + floor(random()*400000)::int, 12 + floor(random()*40)::int,
              4.5, (SELECT id FROM properties ORDER BY random() LIMIT 1), (SELECT id FROM properties ORDER BY random() LIMIT 1),
              now() - interval '20 days', 900 + floor(random()*2000)::int, 'silver', '["frequent","business"]'::jsonb, 'Prefers quiet rooms');
    END LOOP;
  END IF;
END $$;

-- ============================================================
-- 8. PAYMENTS
-- ============================================================

-- 8.1 payment_gateway_config
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM payment_gateway_config) THEN
    INSERT INTO payment_gateway_config (property_id, gateway_name, api_key_enc, webhook_secret, is_active, config)
    SELECT p.id, g.gname, 'enc::demo-key', 'whsec_demo', true,
           ('{"mode":"test","merchant":"' || p.code || '"}')::jsonb
    FROM properties p
    CROSS JOIN (VALUES ('razorpay'), ('cashfree')) AS g(gname)
    WHERE p.code IN ('OVH','CSA','GWR')
    AND NOT EXISTS (SELECT 1 FROM payment_gateway_config x WHERE x.property_id=p.id AND x.gateway_name=g.gname);
  END IF;
END $$;

-- 8.2 payment_gateway_transactions
DO $$
DECLARE
  v_pay RECORD; v_prop UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM payment_gateway_transactions) THEN
    FOR v_pay IN SELECT id, booking_id, property_id, amount FROM payments WHERE status='completed' LIMIT 6
    LOOP
      INSERT INTO payment_gateway_transactions (payment_id, booking_id, property_id, gateway_name, gateway_txn_id, gateway_order_id, amount, currency, status, payment_method, gateway_response, customer_email, customer_phone, description)
      SELECT v_pay.id, v_pay.booking_id, v_pay.property_id, 'razorpay',
             'pay_' || encode(gen_random_bytes(10),'hex'), 'order_' || encode(gen_random_bytes(10),'hex'),
             v_pay.amount, 'INR', 'captured', 'upi',
             '{"status":"captured","acquirer":"sbi"}'::jsonb,
             g.email, g.phone, 'Booking payment via gateway'
      FROM guest_profiles g WHERE g.id = (SELECT guest_id FROM bookings WHERE id=v_pay.booking_id) LIMIT 1;
    END LOOP;
  END IF;
END $$;

-- 8.3 refund_transactions
DO $$
DECLARE
  v_pay UUID; v_user UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM refund_transactions) THEN
    SELECT id INTO v_pay FROM payments ORDER BY created_at LIMIT 1 OFFSET 2;
    SELECT id INTO v_user FROM users WHERE email='finance@ehms.demo';
    INSERT INTO refund_transactions (payment_id, gateway_txn_id, amount, reason, status, processed_by, processed_at)
    SELECT p.id, 'pay_refund_' || encode(gen_random_bytes(8),'hex'), p.amount * 0.5, 'Guest cancellation within policy', 'processed', v_user, now() - interval '3 days'
    FROM payments p WHERE p.id = v_pay;
  END IF;
END $$;

-- ============================================================
-- 9. PRICING / REVENUE
-- ============================================================

-- 9.1 pricing_rules
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pricing_rules) THEN
    INSERT INTO pricing_rules (property_id, name, rule_type, conditions, adjustments, priority, is_active)
    SELECT p.id, r.rname, r.rtype, r.conditions::jsonb, r.adjustments::jsonb, r.prio, true
    FROM properties p
    CROSS JOIN (VALUES
      ('Weekend Surcharge', 'day_of_week', '{"days":["Fri","Sat","Sun"]}', '{"percentage":15}', 10),
      ('Festival Peak', 'festival', '{"months":["Dec"]}', '{"percentage":30}', 5),
      ('Last Minute Discount', 'last_minute', '{"days_before":2}', '{"percentage":-10}', 3),
      ('Long Stay Discount', 'length_of_stay', '{"min_nights":7}', '{"percentage":-15}', 4),
      ('High Occupancy Boost', 'occupancy', '{"threshold":0.85}', '{"percentage":10}', 2),
      ('Minimum Stay Weekend', 'minimum_stay', '{"min_nights":2}', '{"percentage":0}', 8)
    ) AS r(rname, rtype, conditions, adjustments, prio)
    WHERE p.code IN ('OVH','CSA')
    AND NOT EXISTS (SELECT 1 FROM pricing_rules x WHERE x.property_id=p.id AND x.name=r.rname);
  END IF;
END $$;

-- 9.2 pricing_seasons
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pricing_seasons) THEN
    INSERT INTO pricing_seasons (property_id, name, start_date, end_date, multiplier, color, is_active)
    SELECT p.id, s.sname, s.start, s.edate, s.mult, s.color, true
    FROM properties p
    CROSS JOIN (VALUES
      ('New Year Peak', '2026-12-28'::date, '2027-01-03'::date, 1.30, '#EF4444'),
      ('Summer Off-Peak', '2026-06-01'::date, '2026-07-31'::date, 0.85, '#3B82F6'),
      ('Diwali Festival', '2026-11-05'::date, '2026-11-12'::date, 1.25, '#F59E0B'),
      ('Monsoon Season', '2026-07-01'::date, '2026-08-31'::date, 0.80, '#10B981')
    ) AS s(sname, start, edate, mult, color)
    WHERE p.code = 'OVH'
    AND NOT EXISTS (SELECT 1 FROM pricing_seasons x WHERE x.property_id=p.id AND x.name=s.sname);
  END IF;
END $$;

-- 9.3 pricing_audit_log
DO $$
DECLARE
  v_prop UUID; v_unit UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pricing_audit_log) THEN
    SELECT id INTO v_prop FROM properties WHERE code='OVH';
    FOR v_unit IN SELECT id FROM units WHERE unit_type='room' LIMIT 6
    LOOP
      INSERT INTO pricing_audit_log (property_id, room_type, unit_id, date, old_rate, new_rate, rule_applied, triggered_by, triggered_at)
      VALUES (v_prop, 'room', v_unit, CURRENT_DATE, 4200, 4830, 'Weekend Surcharge', 'system', now() - interval '1 day');
    END LOOP;
  END IF;
END $$;

-- 9.4 promo_codes
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM promo_codes) THEN
    INSERT INTO promo_codes (property_id, code, description, discount_type, discount_value, min_nights, min_amount, max_uses, used_count, applicable_room_types, valid_from, valid_to, is_active)
    SELECT p.id, pc.pcode, pc.pdesc, pc.pdisc_type, pc.pdisc, pc.min_nights, pc.min_amt, pc.max_uses, pc.used, pc.rooms, pc.valid_from, pc.valid_to, true
    FROM properties p
    CROSS JOIN (VALUES
      ('WELCOME10', '10% off your first booking', 'percentage', 10, 1, 0, 500, 25, ARRAY['room','suite']::text[], '2026-01-01'::date, '2026-12-31'::date),
      ('STAY5', 'Flat INR 500 off on 2+ nights', 'fixed_amount', 500, 2, 3000, 200, 40, ARRAY['room']::text[], '2026-01-01'::date, '2026-12-31'::date),
      ('LONGFEB25', 'Extra 15% off for stays 7+ nights', 'percentage', 15, 7, 10000, 100, 10, ARRAY['room','suite','apartment']::text[], '2026-01-01'::date, '2026-12-31'::date),
      ('DIWALI25', 'Festive 20% off', 'percentage', 20, 2, 5000, 300, 60, ARRAY['room','suite']::text[], '2026-10-20'::date, '2026-11-20'::date)
    ) AS pc(pcode, pdesc, pdisc_type, pdisc, min_nights, min_amt, max_uses, used, rooms, valid_from, valid_to)
    WHERE p.code = 'OVH'
    AND NOT EXISTS (SELECT 1 FROM promo_codes x WHERE x.property_id=p.id AND x.code=pc.pcode);
  END IF;
END $$;

-- 9.5 promotions_offers
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM promotions_offers) THEN
    INSERT INTO promotions_offers (property_id, offer_code, discount_type, discount_value, title, description, valid_from, valid_until, is_active)
    SELECT p.id, o.ocode, o.otype, o.ovalue, o.otitle, o.odesc, now(), now() + interval '90 days', true
    FROM properties p
    CROSS JOIN (VALUES
      ('BREAKFAST-ON-US', 'percentage', 100, 'Breakfast on us', 'Complimentary breakfast for 2 with 3+ nights booking'),
      ('SPA-2000', 'fixed_amount', 2000, 'Spa Voucher', 'INR 2000 spa credit on suite bookings'),
      ('UPGRADE-PLUS', 'percentage', 0, 'Free room upgrade', 'Complimentary upgrade for returning guests')
    ) AS o(ocode, otype, ovalue, otitle, odesc)
    WHERE p.code IN ('OVH','CSA')
    AND NOT EXISTS (SELECT 1 FROM promotions_offers x WHERE x.property_id=p.id AND x.offer_code=o.ocode);
  END IF;
END $$;

-- 9.6 revenue_ai_audit
DO $$
DECLARE
  v_prop UUID; v_rp UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM revenue_ai_audit) THEN
    SELECT id INTO v_prop FROM properties WHERE code='OVH';
    FOR v_rp IN SELECT id FROM rate_plans WHERE property_id=v_prop LIMIT 4
    LOOP
      INSERT INTO revenue_ai_audit (property_id, rate_plan_id, original_rate, recommended_rate, applied_rate, factors, confidence_score, applied_by, applied_at, notes)
      VALUES (v_prop, v_rp, 4200, 4620, 4620, '[{"factor":"weekend","weight":0.4},{"factor":"occupancy","weight":0.6}]'::jsonb, 92, 'ai_engine', now() - interval '1 day', 'Weekend uplift applied');
    END LOOP;
  END IF;
END $$;

-- ============================================================
-- 10. WHATSAPP
-- ============================================================

-- 10.1 whatsapp_config
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM whatsapp_config) THEN
    INSERT INTO whatsapp_config (property_id, enabled, provider, phone_number_id, whatsapp_business_id, access_token, webhook_verify_token, app_secret, template_namespace, template_language, display_name, about_text, profile_photo_url, auto_welcome, auto_checkin_reminder, auto_checkout_reminder, auto_feedback_request, auto_promo_enabled)
    SELECT p.id, true, 'meta', '123456789', 'waba_987654321', 'enc::demo-token', 'verify-demo', 'appsecret-demo', 'ns_demo', 'en',
           p.name, 'Official channel for bookings, check-ins and support.', '/hostsphere-logo.png',
           true, true, true, true, false
    FROM properties p WHERE p.code IN ('OVH','CSA','GWR')
    AND NOT EXISTS (SELECT 1 FROM whatsapp_config x WHERE x.property_id=p.id);
  END IF;
END $$;

-- 10.2 whatsapp_templates
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM whatsapp_templates) THEN
    INSERT INTO whatsapp_templates (property_id, name, category, language, status, header_type, header_text, body_text, footer_text, variables, buttons, meta_template_id)
    SELECT p.id, t.tname, t.tcat, 'en', 'approved', t.htype, t.htext, t.btext, t.ftext, t.vars, t.btns, 'mt_' || t.tcat
    FROM properties p
    CROSS JOIN (VALUES
      ('booking_confirmation', 'utility', 'text', 'Booking Confirmed', 'Hi {{1}}, your booking at {{2}} is confirmed from {{3}} to {{4}}.', 'Powered by HostSphere', '[{"name":"1"},{"name":"2"},{"name":"3"},{"name":"4"}]'::jsonb, '[]'::jsonb),
      ('pre_arrival', 'utility', 'text', 'Welcome', 'Dear {{1}}, we look forward to hosting you on {{2}}. Reply CHECKIN for digital check-in.', NULL, '[{"name":"1"},{"name":"2"}]'::jsonb, '[]'::jsonb),
      ('digital_key', 'utility', 'text', 'Your Digital Key', 'Your door PIN is {{1}}, valid from {{2}} to {{3}}.', NULL, '[{"name":"1"},{"name":"2"},{"name":"3"}]'::jsonb, '[]'::jsonb),
      ('checkout_reminder', 'utility', 'text', 'Checkout Reminder', 'Dear {{1}}, checkout time is {{2}}. Reply EXTEND to request late checkout.', NULL, '[{"name":"1"},{"name":"2"}]'::jsonb, '[]'::jsonb),
      ('feedback_request', 'utility', 'text', 'How was your stay?', 'Hi {{1}}, please rate your stay at {{2}}. We value your feedback!', NULL, '[{"name":"1"},{"name":"2"}]'::jsonb, '[]'::jsonb)
    ) AS t(tname, tcat, htype, htext, btext, ftext, vars, btns)
    WHERE p.code = 'OVH'
    AND NOT EXISTS (SELECT 1 FROM whatsapp_templates x WHERE x.property_id=p.id AND x.name=t.tname);
  END IF;
END $$;

-- 10.3 whatsapp_conversations
DO $$
DECLARE
  v_guest UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM whatsapp_conversations) THEN
    FOR v_guest IN SELECT id FROM guest_profiles ORDER BY created_at LIMIT 6
    LOOP
      INSERT INTO whatsapp_conversations (property_id, guest_id, booking_id, phone_number, contact_name, status, last_message_at, last_message_preview, unread_count, assigned_to, tags)
      SELECT (SELECT id FROM properties WHERE code='OVH'), g.id, (SELECT id FROM bookings WHERE guest_id=g.id LIMIT 1),
             COALESCE(g.phone,'+91' || 9000000000 + (g.id::text::int % 99999)), g.first_name || ' ' || g.last_name, 'active',
             now() - interval '30 minutes', 'Thank you! Looking forward to my stay.', 1,
             (SELECT id FROM users WHERE email='frontdesk@ehms.demo'), '["guest"]'::jsonb
      FROM guest_profiles g WHERE g.id = v_guest;
    END LOOP;
  END IF;
END $$;

-- 10.4 whatsapp_messages
DO $$
DECLARE
  v_conv RECORD;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM whatsapp_messages) THEN
    FOR v_conv IN SELECT id, property_id, phone_number FROM whatsapp_conversations LIMIT 6
    LOOP
      INSERT INTO whatsapp_messages (conversation_id, property_id, direction, message_type, text_body, media_url, media_type, template_name, template_vars, interactive_id, interactive_title, status, error_message, provider_msg_id, wa_message_id, wa_timestamp, wa_status, sent_by, is_ai_generated)
      VALUES
        (v_conv.id, v_conv.property_id, 'inbound', 'text', 'Hi, I want to confirm my booking details.', NULL, NULL, NULL, NULL, NULL, NULL, 'delivered', NULL, 'wamid_' || encode(gen_random_bytes(6),'hex'), 'wamid_' || encode(gen_random_bytes(6),'hex'), now() - interval '2 hours', 'read', NULL, false),
        (v_conv.id, v_conv.property_id, 'outbound', 'text', 'Sure! Your booking is confirmed. Need anything else?', NULL, NULL, 'template_name', '{"1":"Guest"}', NULL, NULL, 'delivered', NULL, 'wamid_' || encode(gen_random_bytes(6),'hex'), 'wamid_' || encode(gen_random_bytes(6),'hex'), now() - interval '1 hour 50 min', 'delivered', (SELECT id FROM users WHERE email='frontdesk@ehms.demo'), false);
    END LOOP;
  END IF;
END $$;

-- 10.5 whatsapp_campaigns
DO $$
DECLARE
  v_prop UUID; v_tpl UUID; v_user UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM whatsapp_campaigns) THEN
    SELECT id INTO v_prop FROM properties WHERE code='OVH';
    SELECT id INTO v_tpl FROM whatsapp_templates WHERE name='booking_confirmation' AND property_id=v_prop LIMIT 1;
    SELECT id INTO v_user FROM users WHERE email='superadmin@ehms.demo';
    INSERT INTO whatsapp_campaigns (property_id, name, template_id, status, target_filter, recipient_count, scheduled_at, started_at, completed_at, sent_count, delivered_count, read_count, failed_count, click_count, custom_variables, created_by)
    VALUES
      (v_prop, 'Diwali Greeting Campaign', v_tpl, 'completed', '{"segment":"past_guests"}'::jsonb, 120, now() - interval '30 days', now() - interval '30 days', now() - interval '29 days', 120, 118, 96, 2, 41, '{"coupon":"DIWALI25"}'::jsonb, v_user),
      (v_prop, 'Festive Offer Blast', v_tpl, 'scheduled', '{"segment":"corporate"}'::jsonb, 80, now() + interval '2 days', NULL, NULL, 0, 0, 0, 0, 0, '{"coupon":"WELCOME10"}'::jsonb, v_user);
  END IF;
END $$;

-- ============================================================
-- 11. MISCELLANEOUS MODULES
-- ============================================================

-- 11.1 digital_keys
DO $$
DECLARE
  v_book RECORD;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM digital_keys) THEN
    FOR v_book IN SELECT id, property_id, unit_id, guest_id FROM bookings WHERE status='checked_in' LIMIT 6
    LOOP
      INSERT INTO digital_keys (property_id, unit_id, booking_id, guest_id, lock_vendor, pin_code, bluetooth_token, valid_from, valid_to, status)
      VALUES (v_book.property_id, v_book.unit_id, v_book.id, v_book.guest_id, 'Salto Bluetooth/PIN',
              lpad(floor(random()*900000 + 100000)::text, 6, '0'),
              'bt_' || encode(gen_random_bytes(12),'hex'),
              now() - interval '1 day', now() + interval '3 days', 'active');
    END LOOP;
  END IF;
END $$;

-- 11.2 kiosk_config
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM kiosk_config) THEN
    INSERT INTO kiosk_config (property_id, enabled, welcome_message, required_id_types, require_selfie, require_payment, require_form_c, digital_key_enabled, branding_logo_url, branding_color, background_image_url, auto_checkin_enabled, auto_checkout_enabled)
    SELECT p.id, true, 'Welcome to ' || p.name || '! Please check in using this kiosk.',
           '["passport","aadhaar","driving_license"]'::jsonb, true, true, true, true,
           '/hostsphere-logo.png', '#7BB347', NULL, true, true
    FROM properties p WHERE p.code IN ('OVH','CSA')
    AND NOT EXISTS (SELECT 1 FROM kiosk_config x WHERE x.property_id=p.id);
  END IF;
END $$;

-- 11.3 inventory_calendar
DO $$
DECLARE
  v_unit UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM inventory_calendar) THEN
    FOR v_unit IN SELECT id FROM units WHERE unit_type IN ('room','suite') LIMIT 8
    LOOP
      INSERT INTO inventory_calendar (unit_id, date, status, rate, is_blocked, booking_id)
      SELECT v_unit, d,
             CASE WHEN (d::date - CURRENT_DATE) % 4 = 0 THEN 'occupied'::room_status
                  WHEN (d::date - CURRENT_DATE) % 5 = 0 THEN 'maintenance'::room_status
                  ELSE 'vacant'::room_status END,
             4200, false, NULL
      FROM generate_series(CURRENT_DATE, CURRENT_DATE + 30, '1 day') AS d;
    END LOOP;
  END IF;
END $$;

-- 11.4 invoice_lines
DO $$
DECLARE
  v_inv RECORD; v_acct UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM invoice_lines) THEN
    FOR v_inv IN SELECT id FROM invoices LIMIT 5
    LOOP
      SELECT id INTO v_acct FROM chart_of_accounts WHERE property_id = (SELECT property_id FROM invoices WHERE id=v_inv.id) AND account_type='revenue' LIMIT 1;
      INSERT INTO invoice_lines (invoice_id, description, quantity, unit_price, tax_rate, account_id)
      VALUES
        (v_inv.id, 'Room charges', 5, 4200, 18, v_acct),
        (v_inv.id, 'F&B charges', 3, 680, 5, v_acct),
        (v_inv.id, 'Laundry', 1, 260, 5, v_acct);
    END LOOP;
  END IF;
END $$;

-- 11.5 notification_queue
DO $$
DECLARE
  v_tpl UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM notification_queue) THEN
    SELECT id INTO v_tpl FROM notification_templates WHERE template_name='booking_confirmation' LIMIT 1;
    INSERT INTO notification_queue (template_id, recipient, channel, payload, status, sent_at, error_message, retry_count)
    SELECT v_tpl, g.email, 'email', jsonb_build_object('guest', g.first_name, 'booking', (SELECT id FROM bookings WHERE guest_id=g.id LIMIT 1)), 'sent', now() - interval '2 days', NULL, 0
    FROM guest_profiles g WHERE g.id IN (SELECT id FROM guest_profiles ORDER BY created_at LIMIT 5);
  END IF;
END $$;

-- 11.6 parking_allocations
DO $$
DECLARE
  v_book UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM parking_allocations) THEN
    FOR v_book IN SELECT id FROM bookings WHERE status IN ('checked_in','confirmed') LIMIT 5
    LOOP
      INSERT INTO parking_allocations (booking_id, vehicle_number, slot_number, status, allocated_at, released_at)
      VALUES (v_book, 'KA 01 AB ' || lpad(floor(random()*9999)::text,4,'0'), 'P-' || (10 + floor(random()*40)::int), 'active', now() - interval '1 day', NULL);
    END LOOP;
  END IF;
END $$;

-- 11.7 lease_amendments
DO $$
DECLARE
  v_lease UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM lease_amendments) THEN
    SELECT id INTO v_lease FROM lease_agreements WHERE status='active' LIMIT 1;
    INSERT INTO lease_amendments (lease_id, amendment_type, prev_value, new_value, effective_date, approved_by)
    VALUES (v_lease, 'rent_escalation', '{"rent_amount":18000}'::jsonb, '{"rent_amount":19600}'::jsonb, '2026-04-01'::date,
            (SELECT id FROM users WHERE email='finance@ehms.demo'));
  END IF;
END $$;

-- 11.8 move_out_checklist
DO $$
DECLARE
  v_lease UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM move_out_checklist) THEN
    SELECT id INTO v_lease FROM lease_agreements WHERE status='terminated' LIMIT 1;
    INSERT INTO move_out_checklist (lease_id, item, condition, photo_url, is_verified, verified_at)
    VALUES
      (v_lease, 'Walls & Paint', 'good', NULL, true, now() - interval '5 days'),
      (v_lease, 'Flooring', 'good', NULL, true, now() - interval '5 days'),
      (v_lease, 'Kitchen appliances', 'good', NULL, true, now() - interval '5 days'),
      (v_lease, 'Bathroom fixtures', 'good', NULL, true, now() - interval '5 days'),
      (v_lease, 'Furniture inventory', 'good', NULL, false, NULL);
  END IF;
END $$;

-- 11.9 deposit_ledger
DO $$
DECLARE
  v_lease UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM deposit_ledger) THEN
    SELECT id INTO v_lease FROM lease_agreements WHERE status='active' LIMIT 1;
    INSERT INTO deposit_ledger (lease_id, transaction_type, amount, description, transaction_date, created_by)
    SELECT v_lease, l.ltype, l.lamount, l.ldesc, now() - (l.n || ' months')::interval,
           (SELECT id FROM users WHERE email='finance@ehms.demo')
    FROM (VALUES
      (6, 'deposit_received', 36000, 'Security deposit received'),
      (5, 'interest', 240, 'Accrued interest on deposit'),
      (3, 'interest', 240, 'Accrued interest on deposit'),
      (1, 'deduction', 0, 'No deductions')
    ) AS l(n, ltype, lamount, ldesc);
  END IF;
END $$;

-- 11.10 identity_verifications
DO $$
DECLARE
  v_session UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM identity_verifications) THEN
    FOR v_session IN SELECT id FROM checkin_sessions WHERE status='completed' LIMIT 5
    LOOP
      INSERT INTO identity_verifications (checkin_session_id, method, id_type, id_number, id_image_url, selfie_url, face_matched, confidence_score, verified_by, notes)
      VALUES (v_session, 'manual', 'passport', 'P' || floor(random()*90000000 + 10000000)::text, NULL, NULL, true, 95.0,
              (SELECT id FROM users WHERE email='frontdesk@ehms.demo'), 'Verified against booking details');
    END LOOP;
  END IF;
END $$;

-- ============================================================
-- 12. MULTI-PROPERTY DAILY SNAPSHOTS
-- ============================================================
DO $$
DECLARE
  v_prop RECORD;
  v_total INT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM property_daily_snapshots) THEN
    FOR v_prop IN SELECT p.id, p.code FROM properties p
    LOOP
      SELECT COUNT(*) INTO v_total FROM units u JOIN floors f ON u.floor_id=f.id JOIN buildings b ON b.id=f.building_id WHERE b.property_id=v_prop.id;
      IF v_total = 0 THEN v_total := 10; END IF;
      INSERT INTO property_daily_snapshots (property_id, snapshot_date, total_rooms, occupied_rooms, occupancy_pct, adr, revpar, total_revenue, room_revenue, fb_revenue, other_revenue, checkins, checkouts, no_shows, cancellations, avg_guest_rating, complaints)
      SELECT v_prop.id, d,
             v_total,
             GREATEST(0, (v_total * (0.55 + 0.35 * abs(sin(EXTRACT(doy FROM d)::numeric))))::int),
             ROUND((100 * (0.55 + 0.35 * abs(sin(EXTRACT(doy FROM d)::numeric))))::numeric, 2),
             4200 + ((EXTRACT(doy FROM d)::int % 6) * 300),
             ROUND((4200 * (0.55 + 0.35 * abs(sin(EXTRACT(doy FROM d)::numeric))))::numeric, 2),
             120000 + ((EXTRACT(doy FROM d)::int % 20) * 4500),
             100000, 15000, 5000,
             (EXTRACT(doy FROM d)::int % 5),
             (EXTRACT(doy FROM d)::int % 4),
             0, (EXTRACT(doy FROM d)::int % 2),
             4.4 + ((EXTRACT(doy FROM d)::int % 2) * 0.2),
             (EXTRACT(doy FROM d)::int % 3)
      FROM generate_series(CURRENT_DATE - interval '60 days', CURRENT_DATE, '1 day') AS d;
    END LOOP;
  END IF;
END $$;

-- ============================================================
-- 13. HOUSEKEEPING INSPECTIONS & LAUNDRY PRICE LIST
-- ============================================================

-- 13.1 housekeeping_inspections
DO $$
DECLARE
  v_task RECORD; v_inspector UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM housekeeping_inspections) THEN
    SELECT id INTO v_inspector FROM users WHERE email='housekeeping@ehms.demo';
    FOR v_task IN SELECT id, unit_id FROM housekeeping_tasks ORDER BY (status='resolved') DESC LIMIT 6
    LOOP
      INSERT INTO housekeeping_inspections (task_id, unit_id, inspector_id, score, status, notes, checklist_items, inspected_at)
      VALUES (v_task.id, v_task.unit_id, v_inspector, 92 + (random()*8)::int, 'passed',
              'All checklist items verified during inspection.',
              '["beds_made","bathroom_clean","amenities_stocked","minibar"]'::jsonb,
              now() - interval '6 hours');
    END LOOP;
  END IF;
END $$;

-- 13.2 laundry_price_list
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM laundry_price_list) THEN
    INSERT INTO laundry_price_list (property_id, item_name, item_category, wash_type, price, currency, is_active)
    SELECT p.id, l.item, l.cat, l.wtype, l.price, 'INR', true
    FROM properties p
    CROSS JOIN (VALUES
      ('Shirt', 'Clothing', 'regular', 40),
      ('Shirt', 'Clothing', 'dry_clean', 80),
      ('Trousers', 'Clothing', 'regular', 45),
      ('Trousers', 'Clothing', 'dry_clean', 90),
      ('Suit (2-piece)', 'Clothing', 'dry_clean', 250),
      ('Saree', 'Clothing', 'dry_clean', 150),
      ('Blouse', 'Clothing', 'dry_clean', 100),
      ('Bed sheet (King)', 'Linen', 'regular', 60),
      ('Bath towel', 'Linen', 'regular', 35),
      ('T-Shirt', 'Clothing', 'regular', 25)
    ) AS l(item, cat, wtype, price)
    WHERE p.code = 'OVH'
    AND NOT EXISTS (SELECT 1 FROM laundry_price_list x WHERE x.property_id=p.id AND x.item_name=l.item AND x.wash_type=l.wtype);
  END IF;
END $$;
