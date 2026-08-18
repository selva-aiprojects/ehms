-- ============================================================================
-- eHMS Workflow Certification Seed — v8
-- "Viswa Grand Hotel" (OVH property) — 50 Rooms, 25 Bookings, Full Workflow
-- Run AFTER all migrations + previous seeds
-- ============================================================================

DO $$
DECLARE
  ovh_id UUID;
  -- Building / Floor IDs
  bld_main UUID;
  fl1 UUID; fl2 UUID; fl3 UUID; fl4 UUID; fl5 UUID;
  -- User IDs
  uid_super UUID; uid_admin UUID; uid_fd UUID;
  uid_hk UUID; uid_maint UUID; uid_hr UUID; uid_fin UUID; uid_exec UUID;
  -- Guest IDs (will create 20)
  g1 UUID; g2 UUID; g3 UUID; g4 UUID; g5 UUID;
  g6 UUID; g7 UUID; g8 UUID; g9 UUID; g10 UUID;
  g11 UUID; g12 UUID; g13 UUID; g14 UUID; g15 UUID;
  g16 UUID; g17 UUID; g18 UUID; g19 UUID; g20 UUID;
  -- Unit IDs (for specific bookings)
  u101 UUID; u102 UUID; u103 UUID; u104 UUID; u105 UUID;
  u201 UUID; u202 UUID; u203 UUID; u204 UUID; u205 UUID;
  u301 UUID; u302 UUID; u303 UUID; u304 UUID; u305 UUID;
  u401 UUID; u402 UUID; u403 UUID; u404 UUID; u405 UUID;
  u501 UUID; u502 UUID; u503 UUID; u504 UUID; u505 UUID;
  -- Booking IDs
  bk1 UUID; bk2 UUID; bk3 UUID; bk4 UUID; bk5 UUID;
  bk6 UUID; bk7 UUID; bk8 UUID; bk9 UUID; bk10 UUID;
  bk11 UUID; bk12 UUID; bk13 UUID; bk14 UUID; bk15 UUID;
  bk16 UUID; bk17 UUID; bk18 UUID; bk19 UUID; bk20 UUID;
  bk21 UUID; bk22 UUID; bk23 UUID; bk24 UUID; bk25 UUID;
  -- HK / Maint task IDs
  hk_id UUID; mt_id UUID;
  -- Invoice / Payment IDs
  inv_id UUID; pay_id UUID; je_id UUID;
  -- Vendor IDs
  vid_hvac UUID; vid_plumb UUID; vid_elev UUID;
  -- Dept IDs
  dept_fd UUID; dept_hk UUID; dept_mt UUID; dept_fn UUID; dept_hr UUID;
  -- Payroll
  pr_id UUID;
  -- Counters
  i INT; rnd REAL;
BEGIN

  -- ==========================================================================
  -- 0. LOOKUP EXISTING IDS
  -- ==========================================================================
  SELECT id INTO ovh_id FROM properties WHERE code = 'OVH';
  IF ovh_id IS NULL THEN
    RAISE EXCEPTION 'OVH property not found. Run base seeds first.';
  END IF;

  SELECT id INTO uid_super FROM users WHERE email = 'superadmin@ehms.demo';
  SELECT id INTO uid_admin FROM users WHERE email = 'admin@ehms.demo';
  SELECT id INTO uid_fd FROM users WHERE email = 'frontdesk@ehms.demo';
  SELECT id INTO uid_hk FROM users WHERE email = 'housekeeping@ehms.demo';
  SELECT id INTO uid_maint FROM users WHERE email = 'maintenance@ehms.demo';
  SELECT id INTO uid_hr FROM users WHERE email = 'hr@ehms.demo';
  SELECT id INTO uid_fin FROM users WHERE email = 'finance@ehms.demo';
  SELECT id INTO uid_exec FROM users WHERE email = 'executive@ehms.demo';

  SELECT id INTO vid_hvac FROM vendors WHERE company_name ILIKE '%hvac%' LIMIT 1;
  SELECT id INTO vid_plumb FROM vendors WHERE company_name ILIKE '%plumb%' LIMIT 1;
  SELECT id INTO vid_elev FROM vendors WHERE company_name ILIKE '%elevator%' LIMIT 1;

  SELECT id INTO dept_fd FROM departments WHERE code = 'FD' AND property_id = ovh_id LIMIT 1;
  SELECT id INTO dept_hk FROM departments WHERE code = 'HK' AND property_id = ovh_id LIMIT 1;
  SELECT id INTO dept_mt FROM departments WHERE code = 'MT' AND property_id = ovh_id LIMIT 1;
  SELECT id INTO dept_fn FROM departments WHERE code = 'FN' AND property_id = ovh_id LIMIT 1;
  SELECT id INTO dept_hr FROM departments WHERE code = 'HR' AND property_id = ovh_id LIMIT 1;

  -- ==========================================================================
  -- 1. RENAME PROPERTY & CONFIGURE FEATURES
  -- ==========================================================================
  UPDATE properties SET
    name = 'Viswa Grand Hotel',
    star_rating = 4,
    config = jsonb_build_object(
      'features', jsonb_build_object(
        'rooms_map', jsonb_build_object('enabled', true, 'label', 'Rooms Map'),
        'rate_card', jsonb_build_object('enabled', true, 'label', 'Rate Card'),
        'restaurant', jsonb_build_object('enabled', true, 'label', 'Restaurant'),
        'bar', jsonb_build_object('enabled', false, 'label', 'Bar'),
        'laundry', jsonb_build_object('enabled', true, 'label', 'Laundry'),
        'maintenance', jsonb_build_object('enabled', true, 'label', 'Maintenance'),
        'gym', jsonb_build_object('enabled', true, 'label', 'Gym'),
        'yoga', jsonb_build_object('enabled', false, 'label', 'Yoga'),
        'swimming_pool', jsonb_build_object('enabled', true, 'label', 'Swimming Pool'),
        'spa', jsonb_build_object('enabled', false, 'label', 'Spa')
      ),
      'settings', jsonb_build_object('timezone', 'Asia/Kolkata', 'currency', 'INR')
    )
  WHERE id = ovh_id;
  RAISE NOTICE '✓ Renamed OVH → Viswa Grand Hotel with feature config.';

  -- ==========================================================================
  -- 2. CLEAR EXISTING OVH ROOM-LEVEL DATA
  -- ==========================================================================
  -- Delete all dependent records for OVH property OR any unit belonging to OVH buildings
  DELETE FROM checkin_checklists WHERE booking_id IN (
    SELECT id FROM bookings WHERE property_id = ovh_id OR unit_id IN (SELECT u.id FROM units u JOIN floors f ON u.floor_id = f.id JOIN buildings b ON f.building_id = b.id WHERE b.property_id = ovh_id)
  );
  DELETE FROM parking_allocations WHERE booking_id IN (
    SELECT id FROM bookings WHERE property_id = ovh_id OR unit_id IN (SELECT u.id FROM units u JOIN floors f ON u.floor_id = f.id JOIN buildings b ON f.building_id = b.id WHERE b.property_id = ovh_id)
  );
  DELETE FROM guest_requests WHERE property_id = ovh_id OR booking_id IN (
    SELECT id FROM bookings WHERE property_id = ovh_id OR unit_id IN (SELECT u.id FROM units u JOIN floors f ON u.floor_id = f.id JOIN buildings b ON f.building_id = b.id WHERE b.property_id = ovh_id)
  );
  DELETE FROM guest_feedbacks WHERE property_id = ovh_id OR booking_id IN (
    SELECT id FROM bookings WHERE property_id = ovh_id OR unit_id IN (SELECT u.id FROM units u JOIN floors f ON u.floor_id = f.id JOIN buildings b ON f.building_id = b.id WHERE b.property_id = ovh_id)
  );
  DELETE FROM booking_guests WHERE booking_id IN (
    SELECT id FROM bookings WHERE property_id = ovh_id OR unit_id IN (SELECT u.id FROM units u JOIN floors f ON u.floor_id = f.id JOIN buildings b ON f.building_id = b.id WHERE b.property_id = ovh_id)
  );
  DELETE FROM invoice_lines WHERE invoice_id IN (SELECT id FROM invoices WHERE property_id = ovh_id);
  DELETE FROM payments WHERE property_id = ovh_id;
  DELETE FROM invoices WHERE property_id = ovh_id;
  DELETE FROM inventory_calendar WHERE unit_id IN (
    SELECT u.id FROM units u JOIN floors f ON u.floor_id = f.id JOIN buildings b ON f.building_id = b.id WHERE b.property_id = ovh_id
  );
  DELETE FROM bookings WHERE property_id = ovh_id OR unit_id IN (
    SELECT u.id FROM units u JOIN floors f ON u.floor_id = f.id JOIN buildings b ON f.building_id = b.id WHERE b.property_id = ovh_id
  );
  DELETE FROM housekeeping_checklists WHERE task_id IN (
    SELECT id FROM housekeeping_tasks WHERE property_id = ovh_id OR unit_id IN (SELECT u.id FROM units u JOIN floors f ON u.floor_id = f.id JOIN buildings b ON f.building_id = b.id WHERE b.property_id = ovh_id)
  );
  DELETE FROM housekeeping_inspections WHERE task_id IN (
    SELECT id FROM housekeeping_tasks WHERE property_id = ovh_id OR unit_id IN (SELECT u.id FROM units u JOIN floors f ON u.floor_id = f.id JOIN buildings b ON f.building_id = b.id WHERE b.property_id = ovh_id)
  ) OR unit_id IN (
    SELECT u.id FROM units u JOIN floors f ON u.floor_id = f.id JOIN buildings b ON f.building_id = b.id WHERE b.property_id = ovh_id
  );
  DELETE FROM housekeeping_tasks WHERE property_id = ovh_id OR unit_id IN (
    SELECT u.id FROM units u JOIN floors f ON u.floor_id = f.id JOIN buildings b ON f.building_id = b.id WHERE b.property_id = ovh_id
  );
  DELETE FROM maintenance_approvals WHERE ticket_id IN (
    SELECT id FROM maintenance_tickets WHERE property_id = ovh_id OR unit_id IN (SELECT u.id FROM units u JOIN floors f ON u.floor_id = f.id JOIN buildings b ON f.building_id = b.id WHERE b.property_id = ovh_id)
  );
  DELETE FROM maintenance_time_entries WHERE ticket_id IN (
    SELECT id FROM maintenance_tickets WHERE property_id = ovh_id OR unit_id IN (SELECT u.id FROM units u JOIN floors f ON u.floor_id = f.id JOIN buildings b ON f.building_id = b.id WHERE b.property_id = ovh_id)
  );
  DELETE FROM maintenance_ticket_parts WHERE ticket_id IN (
    SELECT id FROM maintenance_tickets WHERE property_id = ovh_id OR unit_id IN (SELECT u.id FROM units u JOIN floors f ON u.floor_id = f.id JOIN buildings b ON f.building_id = b.id WHERE b.property_id = ovh_id)
  );
  DELETE FROM maintenance_tickets WHERE property_id = ovh_id OR unit_id IN (
    SELECT u.id FROM units u JOIN floors f ON u.floor_id = f.id JOIN buildings b ON f.building_id = b.id WHERE b.property_id = ovh_id
  );
  DELETE FROM f_and_b_orders WHERE property_id = ovh_id OR unit_id IN (
    SELECT u.id FROM units u JOIN floors f ON u.floor_id = f.id JOIN buildings b ON f.building_id = b.id WHERE b.property_id = ovh_id
  );
  DELETE FROM asset_register WHERE property_id = ovh_id OR unit_id IN (
    SELECT u.id FROM units u JOIN floors f ON u.floor_id = f.id JOIN buildings b ON f.building_id = b.id WHERE b.property_id = ovh_id
  );
  DELETE FROM lease_agreements WHERE property_id = ovh_id OR unit_id IN (
    SELECT u.id FROM units u JOIN floors f ON u.floor_id = f.id JOIN buildings b ON f.building_id = b.id WHERE b.property_id = ovh_id
  );
  DELETE FROM workplace_bookings WHERE property_id = ovh_id OR unit_id IN (
    SELECT u.id FROM units u JOIN floors f ON u.floor_id = f.id JOIN buildings b ON f.building_id = b.id WHERE b.property_id = ovh_id
  );
  DELETE FROM linen_transactions WHERE unit_id IN (
    SELECT u.id FROM units u JOIN floors f ON u.floor_id = f.id JOIN buildings b ON f.building_id = b.id WHERE b.property_id = ovh_id
  );
  UPDATE linen_items SET assigned_unit = NULL WHERE property_id = ovh_id OR assigned_unit IN (
    SELECT u.id FROM units u JOIN floors f ON u.floor_id = f.id JOIN buildings b ON f.building_id = b.id WHERE b.property_id = ovh_id
  );
  DELETE FROM linen_items WHERE property_id = ovh_id;
  DELETE FROM bank_reconciliation WHERE property_id = ovh_id;
  DELETE FROM units WHERE floor_id IN (
    SELECT f.id FROM floors f JOIN buildings b ON f.building_id = b.id WHERE b.property_id = ovh_id
  );
  DELETE FROM floors WHERE building_id IN (SELECT id FROM buildings WHERE property_id = ovh_id);
  DELETE FROM buildings WHERE property_id = ovh_id;
  RAISE NOTICE '✓ Cleared existing OVH room-level data.';

  -- ==========================================================================
  -- 3. CREATE BUILDING + 5 FLOORS
  -- ==========================================================================
  INSERT INTO buildings (property_id, name, code, floors) VALUES
    (ovh_id, 'Main Tower', 'A', 5)
  RETURNING id INTO bld_main;

  INSERT INTO floors (building_id, name, floor_number) VALUES
    (bld_main, 'Ground Floor', 1) RETURNING id INTO fl1;
  INSERT INTO floors (building_id, name, floor_number) VALUES
    (bld_main, 'First Floor', 2) RETURNING id INTO fl2;
  INSERT INTO floors (building_id, name, floor_number) VALUES
    (bld_main, 'Second Floor', 3) RETURNING id INTO fl3;
  INSERT INTO floors (building_id, name, floor_number) VALUES
    (bld_main, 'Third Floor', 4) RETURNING id INTO fl4;
  INSERT INTO floors (building_id, name, floor_number) VALUES
    (bld_main, 'Penthouse Floor', 5) RETURNING id INTO fl5;

  RAISE NOTICE '✓ Created Main Tower with 5 floors.';

  -- ==========================================================================
  -- 4. CREATE 50 ROOMS WITH ATTRIBUTES
  -- ==========================================================================
  -- Floor 1 (Ground) — Budget & Regular rooms
  INSERT INTO units (floor_id, unit_type, unit_label, layout_type, sq_ft, max_occupancy, base_rate, status, attributes) VALUES
    (fl1, 'room', '101', 'standard', 250, 2, 1500.00, 'vacant', '{"ac":false,"wifi":true,"grade":"budget","bed_type":"single","tv":true,"minibar":false,"balcony":false,"safe_locker":false,"coffee_maker":false,"bathtub":false}'::jsonb) RETURNING id INTO u101;
  INSERT INTO units (floor_id, unit_type, unit_label, layout_type, sq_ft, max_occupancy, base_rate, status, attributes) VALUES
    (fl1, 'room', '102', 'standard', 250, 2, 1500.00, 'vacant', '{"ac":false,"wifi":true,"grade":"budget","bed_type":"single","tv":true,"minibar":false,"balcony":false,"safe_locker":false,"coffee_maker":false,"bathtub":false}'::jsonb) RETURNING id INTO u102;
  INSERT INTO units (floor_id, unit_type, unit_label, layout_type, sq_ft, max_occupancy, base_rate, status, attributes) VALUES
    (fl1, 'room', '103', 'standard', 280, 2, 1800.00, 'vacant', '{"ac":false,"wifi":true,"grade":"budget","bed_type":"double","tv":true,"minibar":false,"balcony":false,"safe_locker":false,"coffee_maker":false,"bathtub":false}'::jsonb) RETURNING id INTO u103;
  INSERT INTO units (floor_id, unit_type, unit_label, layout_type, sq_ft, max_occupancy, base_rate, status, attributes) VALUES
    (fl1, 'room', '104', 'standard', 280, 2, 1800.00, 'vacant', '{"ac":true,"wifi":true,"grade":"budget","bed_type":"double","tv":true,"minibar":false,"balcony":false,"safe_locker":false,"coffee_maker":false,"bathtub":false}'::jsonb) RETURNING id INTO u104;
  INSERT INTO units (floor_id, unit_type, unit_label, layout_type, sq_ft, max_occupancy, base_rate, status, attributes) VALUES
    (fl1, 'room', '105', 'standard', 300, 2, 2000.00, 'vacant', '{"ac":true,"wifi":true,"grade":"regular","bed_type":"double","tv":true,"minibar":false,"balcony":false,"safe_locker":true,"coffee_maker":false,"bathtub":false}'::jsonb) RETURNING id INTO u105;
  INSERT INTO units (floor_id, unit_type, unit_label, layout_type, sq_ft, max_occupancy, base_rate, status, attributes) VALUES
    (fl1, 'room', '106', 'standard', 250, 2, 1500.00, 'vacant', '{"ac":false,"wifi":true,"grade":"budget","bed_type":"single","tv":true,"minibar":false,"balcony":false,"safe_locker":false,"coffee_maker":false,"bathtub":false}'::jsonb);
  INSERT INTO units (floor_id, unit_type, unit_label, layout_type, sq_ft, max_occupancy, base_rate, status, attributes) VALUES
    (fl1, 'room', '107', 'standard', 280, 2, 2000.00, 'vacant', '{"ac":true,"wifi":true,"grade":"regular","bed_type":"double","tv":true,"minibar":false,"balcony":false,"safe_locker":false,"coffee_maker":false,"bathtub":false}'::jsonb);
  INSERT INTO units (floor_id, unit_type, unit_label, layout_type, sq_ft, max_occupancy, base_rate, status, attributes) VALUES
    (fl1, 'room', '108', 'standard', 300, 2, 2200.00, 'vacant', '{"ac":true,"wifi":true,"grade":"regular","bed_type":"double","tv":true,"minibar":false,"balcony":false,"safe_locker":true,"coffee_maker":false,"bathtub":false}'::jsonb);
  INSERT INTO units (floor_id, unit_type, unit_label, layout_type, sq_ft, max_occupancy, base_rate, status, attributes) VALUES
    (fl1, 'room', '109', 'standard', 250, 2, 1600.00, 'vacant', '{"ac":false,"wifi":true,"grade":"budget","bed_type":"single","tv":true,"minibar":false,"balcony":false,"safe_locker":false,"coffee_maker":false,"bathtub":false}'::jsonb);
  INSERT INTO units (floor_id, unit_type, unit_label, layout_type, sq_ft, max_occupancy, base_rate, status, attributes) VALUES
    (fl1, 'room', '110', 'standard', 300, 2, 2500.00, 'vacant', '{"ac":true,"wifi":true,"grade":"regular","bed_type":"queen","tv":true,"minibar":false,"balcony":false,"safe_locker":true,"coffee_maker":false,"bathtub":false}'::jsonb);

  -- Floor 2 — Regular & Budget
  INSERT INTO units (floor_id, unit_type, unit_label, layout_type, sq_ft, max_occupancy, base_rate, status, attributes) VALUES
    (fl2, 'room', '201', 'standard', 300, 2, 2500.00, 'vacant', '{"ac":true,"wifi":true,"grade":"regular","bed_type":"double","tv":true,"minibar":false,"balcony":false,"safe_locker":true,"coffee_maker":false,"bathtub":false}'::jsonb) RETURNING id INTO u201;
  INSERT INTO units (floor_id, unit_type, unit_label, layout_type, sq_ft, max_occupancy, base_rate, status, attributes) VALUES
    (fl2, 'room', '202', 'standard', 300, 2, 2500.00, 'vacant', '{"ac":true,"wifi":true,"grade":"regular","bed_type":"double","tv":true,"minibar":false,"balcony":false,"safe_locker":true,"coffee_maker":false,"bathtub":false}'::jsonb) RETURNING id INTO u202;
  INSERT INTO units (floor_id, unit_type, unit_label, layout_type, sq_ft, max_occupancy, base_rate, status, attributes) VALUES
    (fl2, 'room', '203', 'standard', 280, 2, 2000.00, 'vacant', '{"ac":false,"wifi":true,"grade":"budget","bed_type":"double","tv":true,"minibar":false,"balcony":false,"safe_locker":false,"coffee_maker":false,"bathtub":false}'::jsonb) RETURNING id INTO u203;
  INSERT INTO units (floor_id, unit_type, unit_label, layout_type, sq_ft, max_occupancy, base_rate, status, attributes) VALUES
    (fl2, 'room', '204', 'standard', 320, 2, 3000.00, 'vacant', '{"ac":true,"wifi":true,"grade":"regular","bed_type":"queen","tv":true,"minibar":false,"balcony":true,"safe_locker":true,"coffee_maker":false,"bathtub":false}'::jsonb) RETURNING id INTO u204;
  INSERT INTO units (floor_id, unit_type, unit_label, layout_type, sq_ft, max_occupancy, base_rate, status, attributes) VALUES
    (fl2, 'room', '205', 'standard', 320, 2, 3000.00, 'vacant', '{"ac":true,"wifi":true,"grade":"regular","bed_type":"queen","tv":true,"minibar":false,"balcony":true,"safe_locker":true,"coffee_maker":false,"bathtub":false}'::jsonb) RETURNING id INTO u205;
  INSERT INTO units (floor_id, unit_type, unit_label, layout_type, sq_ft, max_occupancy, base_rate, status, attributes) VALUES
    (fl2, 'room', '206', 'standard', 280, 2, 2000.00, 'vacant', '{"ac":false,"wifi":true,"grade":"budget","bed_type":"double","tv":true,"minibar":false,"balcony":false,"safe_locker":false,"coffee_maker":false,"bathtub":false}'::jsonb);
  INSERT INTO units (floor_id, unit_type, unit_label, layout_type, sq_ft, max_occupancy, base_rate, status, attributes) VALUES
    (fl2, 'room', '207', 'standard', 300, 2, 2500.00, 'vacant', '{"ac":true,"wifi":true,"grade":"regular","bed_type":"double","tv":true,"minibar":false,"balcony":false,"safe_locker":true,"coffee_maker":false,"bathtub":false}'::jsonb);
  INSERT INTO units (floor_id, unit_type, unit_label, layout_type, sq_ft, max_occupancy, base_rate, status, attributes) VALUES
    (fl2, 'room', '208', 'standard', 280, 2, 2200.00, 'vacant', '{"ac":false,"wifi":true,"grade":"budget","bed_type":"double","tv":true,"minibar":false,"balcony":false,"safe_locker":false,"coffee_maker":false,"bathtub":false}'::jsonb);
  INSERT INTO units (floor_id, unit_type, unit_label, layout_type, sq_ft, max_occupancy, base_rate, status, attributes) VALUES
    (fl2, 'room', '209', 'standard', 320, 2, 3500.00, 'vacant', '{"ac":true,"wifi":true,"grade":"regular","bed_type":"queen","tv":true,"minibar":true,"balcony":true,"safe_locker":true,"coffee_maker":false,"bathtub":false}'::jsonb);
  INSERT INTO units (floor_id, unit_type, unit_label, layout_type, sq_ft, max_occupancy, base_rate, status, attributes) VALUES
    (fl2, 'room', '210', 'standard', 280, 2, 2200.00, 'vacant', '{"ac":true,"wifi":true,"grade":"budget","bed_type":"double","tv":true,"minibar":false,"balcony":false,"safe_locker":false,"coffee_maker":false,"bathtub":false}'::jsonb);

  -- Floor 3 — Regular, Elite, Premium
  INSERT INTO units (floor_id, unit_type, unit_label, layout_type, sq_ft, max_occupancy, base_rate, status, attributes) VALUES
    (fl3, 'room', '301', 'deluxe', 350, 2, 3500.00, 'vacant', '{"ac":true,"wifi":true,"grade":"regular","bed_type":"queen","tv":true,"minibar":true,"balcony":true,"safe_locker":true,"coffee_maker":false,"bathtub":false}'::jsonb) RETURNING id INTO u301;
  INSERT INTO units (floor_id, unit_type, unit_label, layout_type, sq_ft, max_occupancy, base_rate, status, attributes) VALUES
    (fl3, 'room', '302', 'deluxe', 350, 2, 3500.00, 'vacant', '{"ac":true,"wifi":true,"grade":"regular","bed_type":"queen","tv":true,"minibar":true,"balcony":true,"safe_locker":true,"coffee_maker":false,"bathtub":false}'::jsonb) RETURNING id INTO u302;
  INSERT INTO units (floor_id, unit_type, unit_label, layout_type, sq_ft, max_occupancy, base_rate, status, attributes) VALUES
    (fl3, 'room', '303', 'deluxe', 380, 2, 4500.00, 'vacant', '{"ac":true,"wifi":true,"grade":"elite","bed_type":"king","tv":true,"minibar":true,"balcony":true,"safe_locker":true,"coffee_maker":true,"bathtub":false}'::jsonb) RETURNING id INTO u303;
  INSERT INTO units (floor_id, unit_type, unit_label, layout_type, sq_ft, max_occupancy, base_rate, status, attributes) VALUES
    (fl3, 'room', '304', 'deluxe', 380, 2, 4500.00, 'vacant', '{"ac":true,"wifi":true,"grade":"elite","bed_type":"king","tv":true,"minibar":true,"balcony":true,"safe_locker":true,"coffee_maker":true,"bathtub":false}'::jsonb) RETURNING id INTO u304;
  INSERT INTO units (floor_id, unit_type, unit_label, layout_type, sq_ft, max_occupancy, base_rate, status, attributes) VALUES
    (fl3, 'room', '305', 'deluxe', 400, 3, 5500.00, 'vacant', '{"ac":true,"wifi":true,"grade":"elite","bed_type":"king","tv":true,"minibar":true,"balcony":true,"safe_locker":true,"coffee_maker":true,"bathtub":true}'::jsonb) RETURNING id INTO u305;
  INSERT INTO units (floor_id, unit_type, unit_label, layout_type, sq_ft, max_occupancy, base_rate, status, attributes) VALUES
    (fl3, 'room', '306', 'deluxe', 350, 2, 3500.00, 'vacant', '{"ac":true,"wifi":true,"grade":"regular","bed_type":"queen","tv":true,"minibar":true,"balcony":true,"safe_locker":true,"coffee_maker":false,"bathtub":false}'::jsonb);
  INSERT INTO units (floor_id, unit_type, unit_label, layout_type, sq_ft, max_occupancy, base_rate, status, attributes) VALUES
    (fl3, 'room', '307', 'deluxe', 380, 2, 4500.00, 'vacant', '{"ac":true,"wifi":true,"grade":"elite","bed_type":"king","tv":true,"minibar":true,"balcony":true,"safe_locker":true,"coffee_maker":true,"bathtub":false}'::jsonb);
  INSERT INTO units (floor_id, unit_type, unit_label, layout_type, sq_ft, max_occupancy, base_rate, status, attributes) VALUES
    (fl3, 'room', '308', 'deluxe', 350, 2, 3500.00, 'vacant', '{"ac":false,"wifi":true,"grade":"regular","bed_type":"queen","tv":true,"minibar":false,"balcony":true,"safe_locker":true,"coffee_maker":false,"bathtub":false}'::jsonb);
  INSERT INTO units (floor_id, unit_type, unit_label, layout_type, sq_ft, max_occupancy, base_rate, status, attributes) VALUES
    (fl3, 'room', '309', 'deluxe', 420, 3, 6000.00, 'vacant', '{"ac":true,"wifi":true,"grade":"premium","bed_type":"king","tv":true,"minibar":true,"balcony":true,"safe_locker":true,"coffee_maker":true,"bathtub":true}'::jsonb);
  INSERT INTO units (floor_id, unit_type, unit_label, layout_type, sq_ft, max_occupancy, base_rate, status, attributes) VALUES
    (fl3, 'room', '310', 'deluxe', 420, 3, 6000.00, 'vacant', '{"ac":true,"wifi":true,"grade":"premium","bed_type":"king","tv":true,"minibar":true,"balcony":true,"safe_locker":true,"coffee_maker":true,"bathtub":true}'::jsonb);

  -- Floor 4 — Elite & Premium
  INSERT INTO units (floor_id, unit_type, unit_label, layout_type, sq_ft, max_occupancy, base_rate, status, attributes) VALUES
    (fl4, 'room', '401', 'deluxe', 400, 2, 5000.00, 'vacant', '{"ac":true,"wifi":true,"grade":"elite","bed_type":"king","tv":true,"minibar":true,"balcony":true,"safe_locker":true,"coffee_maker":true,"bathtub":false}'::jsonb) RETURNING id INTO u401;
  INSERT INTO units (floor_id, unit_type, unit_label, layout_type, sq_ft, max_occupancy, base_rate, status, attributes) VALUES
    (fl4, 'room', '402', 'deluxe', 400, 2, 5000.00, 'vacant', '{"ac":true,"wifi":true,"grade":"elite","bed_type":"king","tv":true,"minibar":true,"balcony":true,"safe_locker":true,"coffee_maker":true,"bathtub":false}'::jsonb) RETURNING id INTO u402;
  INSERT INTO units (floor_id, unit_type, unit_label, layout_type, sq_ft, max_occupancy, base_rate, status, attributes) VALUES
    (fl4, 'room', '403', 'deluxe', 420, 2, 5500.00, 'vacant', '{"ac":true,"wifi":true,"grade":"elite","bed_type":"king","tv":true,"minibar":true,"balcony":true,"safe_locker":true,"coffee_maker":true,"bathtub":true}'::jsonb) RETURNING id INTO u403;
  INSERT INTO units (floor_id, unit_type, unit_label, layout_type, sq_ft, max_occupancy, base_rate, status, attributes) VALUES
    (fl4, 'room', '404', 'deluxe', 450, 3, 7000.00, 'vacant', '{"ac":true,"wifi":true,"grade":"premium","bed_type":"king","tv":true,"minibar":true,"balcony":true,"safe_locker":true,"coffee_maker":true,"bathtub":true}'::jsonb) RETURNING id INTO u404;
  INSERT INTO units (floor_id, unit_type, unit_label, layout_type, sq_ft, max_occupancy, base_rate, status, attributes) VALUES
    (fl4, 'room', '405', 'deluxe', 450, 3, 7000.00, 'vacant', '{"ac":true,"wifi":true,"grade":"premium","bed_type":"king","tv":true,"minibar":true,"balcony":true,"safe_locker":true,"coffee_maker":true,"bathtub":true}'::jsonb) RETURNING id INTO u405;
  INSERT INTO units (floor_id, unit_type, unit_label, layout_type, sq_ft, max_occupancy, base_rate, status, attributes) VALUES
    (fl4, 'room', '406', 'deluxe', 400, 2, 5000.00, 'vacant', '{"ac":true,"wifi":true,"grade":"elite","bed_type":"king","tv":true,"minibar":true,"balcony":true,"safe_locker":true,"coffee_maker":true,"bathtub":false}'::jsonb);
  INSERT INTO units (floor_id, unit_type, unit_label, layout_type, sq_ft, max_occupancy, base_rate, status, attributes) VALUES
    (fl4, 'room', '407', 'deluxe', 420, 2, 5500.00, 'vacant', '{"ac":true,"wifi":true,"grade":"elite","bed_type":"king","tv":true,"minibar":true,"balcony":true,"safe_locker":true,"coffee_maker":true,"bathtub":true}'::jsonb);
  INSERT INTO units (floor_id, unit_type, unit_label, layout_type, sq_ft, max_occupancy, base_rate, status, attributes) VALUES
    (fl4, 'room', '408', 'deluxe', 400, 2, 5000.00, 'vacant', '{"ac":true,"wifi":true,"grade":"elite","bed_type":"king","tv":true,"minibar":true,"balcony":true,"safe_locker":true,"coffee_maker":true,"bathtub":false}'::jsonb);
  INSERT INTO units (floor_id, unit_type, unit_label, layout_type, sq_ft, max_occupancy, base_rate, status, attributes) VALUES
    (fl4, 'room', '409', 'deluxe', 480, 3, 8000.00, 'vacant', '{"ac":true,"wifi":true,"grade":"premium","bed_type":"king","tv":true,"minibar":true,"balcony":true,"safe_locker":true,"coffee_maker":true,"bathtub":true}'::jsonb);
  INSERT INTO units (floor_id, unit_type, unit_label, layout_type, sq_ft, max_occupancy, base_rate, status, attributes) VALUES
    (fl4, 'room', '410', 'deluxe', 480, 3, 8500.00, 'vacant', '{"ac":true,"wifi":true,"grade":"premium","bed_type":"king","tv":true,"minibar":true,"balcony":true,"safe_locker":true,"coffee_maker":true,"bathtub":true}'::jsonb);

  -- Floor 5 (Penthouse) — Premium & Suite
  INSERT INTO units (floor_id, unit_type, unit_label, layout_type, sq_ft, max_occupancy, base_rate, status, attributes) VALUES
    (fl5, 'room', '501', 'suite', 500, 3, 8000.00, 'vacant', '{"ac":true,"wifi":true,"grade":"premium","bed_type":"king","tv":true,"minibar":true,"balcony":true,"safe_locker":true,"coffee_maker":true,"bathtub":true}'::jsonb) RETURNING id INTO u501;
  INSERT INTO units (floor_id, unit_type, unit_label, layout_type, sq_ft, max_occupancy, base_rate, status, attributes) VALUES
    (fl5, 'room', '502', 'suite', 500, 3, 8000.00, 'vacant', '{"ac":true,"wifi":true,"grade":"premium","bed_type":"king","tv":true,"minibar":true,"balcony":true,"safe_locker":true,"coffee_maker":true,"bathtub":true}'::jsonb) RETURNING id INTO u502;
  INSERT INTO units (floor_id, unit_type, unit_label, layout_type, sq_ft, max_occupancy, base_rate, status, attributes) VALUES
    (fl5, 'suite', '503', 'suite', 650, 4, 10000.00, 'vacant', '{"ac":true,"wifi":true,"grade":"suite","bed_type":"king","tv":true,"minibar":true,"balcony":true,"safe_locker":true,"coffee_maker":true,"bathtub":true}'::jsonb) RETURNING id INTO u503;
  INSERT INTO units (floor_id, unit_type, unit_label, layout_type, sq_ft, max_occupancy, base_rate, status, attributes) VALUES
    (fl5, 'suite', '504', 'suite', 650, 4, 10000.00, 'vacant', '{"ac":true,"wifi":true,"grade":"suite","bed_type":"king","tv":true,"minibar":true,"balcony":true,"safe_locker":true,"coffee_maker":true,"bathtub":true}'::jsonb) RETURNING id INTO u504;
  INSERT INTO units (floor_id, unit_type, unit_label, layout_type, sq_ft, max_occupancy, base_rate, status, attributes) VALUES
    (fl5, 'suite', '505', 'suite', 800, 4, 12000.00, 'vacant', '{"ac":true,"wifi":true,"grade":"suite","bed_type":"king","tv":true,"minibar":true,"balcony":true,"safe_locker":true,"coffee_maker":true,"bathtub":true}'::jsonb) RETURNING id INTO u505;
  INSERT INTO units (floor_id, unit_type, unit_label, layout_type, sq_ft, max_occupancy, base_rate, status, attributes) VALUES
    (fl5, 'room', '506', 'suite', 500, 3, 8500.00, 'vacant', '{"ac":true,"wifi":true,"grade":"premium","bed_type":"king","tv":true,"minibar":true,"balcony":true,"safe_locker":true,"coffee_maker":true,"bathtub":true}'::jsonb);
  INSERT INTO units (floor_id, unit_type, unit_label, layout_type, sq_ft, max_occupancy, base_rate, status, attributes) VALUES
    (fl5, 'room', '507', 'suite', 520, 3, 9000.00, 'vacant', '{"ac":true,"wifi":true,"grade":"premium","bed_type":"king","tv":true,"minibar":true,"balcony":true,"safe_locker":true,"coffee_maker":true,"bathtub":true}'::jsonb);
  INSERT INTO units (floor_id, unit_type, unit_label, layout_type, sq_ft, max_occupancy, base_rate, status, attributes) VALUES
    (fl5, 'suite', '508', 'suite', 700, 4, 11000.00, 'vacant', '{"ac":true,"wifi":true,"grade":"suite","bed_type":"king","tv":true,"minibar":true,"balcony":true,"safe_locker":true,"coffee_maker":true,"bathtub":true}'::jsonb);
  INSERT INTO units (floor_id, unit_type, unit_label, layout_type, sq_ft, max_occupancy, base_rate, status, attributes) VALUES
    (fl5, 'room', '509', 'suite', 550, 3, 9500.00, 'vacant', '{"ac":true,"wifi":true,"grade":"premium","bed_type":"king","tv":true,"minibar":true,"balcony":true,"safe_locker":true,"coffee_maker":true,"bathtub":true}'::jsonb);
  INSERT INTO units (floor_id, unit_type, unit_label, layout_type, sq_ft, max_occupancy, base_rate, status, attributes) VALUES
    (fl5, 'suite', '510', 'suite', 900, 4, 15000.00, 'vacant', '{"ac":true,"wifi":true,"grade":"suite","bed_type":"king","tv":true,"minibar":true,"balcony":true,"safe_locker":true,"coffee_maker":true,"bathtub":true,"jacuzzi":true}'::jsonb);

  RAISE NOTICE '✓ Created 50 rooms across 5 floors with full attributes.';

  -- ==========================================================================
  -- 5. CREATE 20 GUEST PROFILES
  -- ==========================================================================
  INSERT INTO guest_profiles (first_name, last_name, email, phone, nationality, id_type, id_number, id_verified, tags, loyalty_points, total_stays) VALUES
    ('Arun', 'Krishnamurthy', 'arun.k@gmail.com', '+91-9876543201', 'Indian', 'aadhaar', '9876-1234-5678', true, ARRAY['VIP','frequent'], 2500, 15) RETURNING id INTO g1;
  INSERT INTO guest_profiles (first_name, last_name, email, phone, nationality, id_type, id_number, id_verified, tags, loyalty_points, total_stays) VALUES
    ('Meera', 'Sundaram', 'meera.s@outlook.com', '+91-9876543202', 'Indian', 'aadhaar', '8765-2345-6789', true, ARRAY['corporate'], 1200, 8) RETURNING id INTO g2;
  INSERT INTO guest_profiles (first_name, last_name, email, phone, nationality, id_type, id_number, id_verified, tags, loyalty_points, total_stays) VALUES
    ('David', 'Chen', 'david.chen@techcorp.sg', '+65-91234567', 'Singaporean', 'passport', 'SG-K1234567', true, ARRAY['corporate','VIP'], 3000, 20) RETURNING id INTO g3;
  INSERT INTO guest_profiles (first_name, last_name, email, phone, nationality, id_type, id_number, id_verified, tags, loyalty_points, total_stays) VALUES
    ('Lakshmi', 'Venkatesh', 'lakshmi.v@gmail.com', '+91-9876543204', 'Indian', 'driving_license', 'TN-0120190012345', true, ARRAY['frequent'], 800, 6) RETURNING id INTO g4;
  INSERT INTO guest_profiles (first_name, last_name, email, phone, nationality, id_type, id_number, id_verified, tags, loyalty_points, total_stays) VALUES
    ('Rahul', 'Dravid', 'rahul.d@sports.in', '+91-9876543205', 'Indian', 'passport', 'J1234567', true, ARRAY['VIP'], 5000, 25) RETURNING id INTO g5;
  INSERT INTO guest_profiles (first_name, last_name, email, phone, nationality, id_type, id_number, id_verified, tags, loyalty_points, total_stays) VALUES
    ('Preethi', 'Nair', 'preethi.n@startup.io', '+91-9876543206', 'Indian', 'aadhaar', '7654-3456-7890', true, ARRAY[]::text[], 200, 2) RETURNING id INTO g6;
  INSERT INTO guest_profiles (first_name, last_name, email, phone, nationality, id_type, id_number, id_verified, tags, loyalty_points, total_stays) VALUES
    ('James', 'Wilson', 'james.w@corp.us', '+1-202-5550101', 'American', 'passport', 'US-P12345678', true, ARRAY['corporate'], 1500, 10) RETURNING id INTO g7;
  INSERT INTO guest_profiles (first_name, last_name, email, phone, nationality, id_type, id_number, id_verified, tags, loyalty_points, total_stays) VALUES
    ('Karthik', 'Subramanian', 'karthik.s@infosys.com', '+91-9876543208', 'Indian', 'aadhaar', '6543-4567-8901', true, ARRAY['corporate'], 600, 4) RETURNING id INTO g8;
  INSERT INTO guest_profiles (first_name, last_name, email, phone, nationality, id_type, id_number, id_verified, tags, loyalty_points, total_stays) VALUES
    ('Fatima', 'Al-Rashid', 'fatima@gulf.ae', '+971-50-1234567', 'UAE', 'passport', 'AE-M9876543', true, ARRAY['VIP'], 4000, 18) RETURNING id INTO g9;
  INSERT INTO guest_profiles (first_name, last_name, email, phone, nationality, id_type, id_number, id_verified, tags, loyalty_points, total_stays) VALUES
    ('Suresh', 'Babu', 'suresh.b@gmail.com', '+91-9876543210', 'Indian', 'aadhaar', '5432-5678-9012', false, ARRAY['walk-in'], 50, 1) RETURNING id INTO g10;
  INSERT INTO guest_profiles (first_name, last_name, email, phone, nationality, id_type, id_number, id_verified, tags, loyalty_points, total_stays) VALUES
    ('Ananya', 'Iyer', 'ananya.i@gmail.com', '+91-9876543211', 'Indian', 'aadhaar', '4321-6789-0123', true, ARRAY['frequent'], 900, 7) RETURNING id INTO g11;
  INSERT INTO guest_profiles (first_name, last_name, email, phone, nationality, id_type, id_number, id_verified, tags, loyalty_points, total_stays) VALUES
    ('Raj', 'Malhotra', 'raj.m@business.in', '+91-9876543212', 'Indian', 'passport', 'IN-N2345678', true, ARRAY['corporate','frequent'], 1800, 12) RETURNING id INTO g12;
  INSERT INTO guest_profiles (first_name, last_name, email, phone, nationality, id_type, id_number, id_verified, tags, loyalty_points, total_stays) VALUES
    ('Deepa', 'Sharma', 'deepa.s@hotmail.com', '+91-9876543213', 'Indian', 'driving_license', 'DL-0120170054321', true, ARRAY[]::text[], 100, 1) RETURNING id INTO g13;
  INSERT INTO guest_profiles (first_name, last_name, email, phone, nationality, id_type, id_number, id_verified, tags, loyalty_points, total_stays) VALUES
    ('Sanjay', 'Gupta', 'sanjay.g@pharma.in', '+91-9876543214', 'Indian', 'aadhaar', '3210-7890-1234', true, ARRAY['VIP','corporate'], 3500, 22) RETURNING id INTO g14;
  INSERT INTO guest_profiles (first_name, last_name, email, phone, nationality, id_type, id_number, id_verified, tags, loyalty_points, total_stays) VALUES
    ('Lisa', 'Zhang', 'lisa.z@tech.cn', '+86-13812345678', 'Chinese', 'passport', 'CN-E12345678', true, ARRAY['corporate'], 700, 5) RETURNING id INTO g15;
  INSERT INTO guest_profiles (first_name, last_name, email, phone, nationality, id_type, id_number, id_verified, tags, loyalty_points, total_stays) VALUES
    ('Mohan', 'Raju', 'mohan.r@gmail.com', '+91-9876543216', 'Indian', 'aadhaar', '2109-8901-2345', false, ARRAY['walk-in'], 0, 0) RETURNING id INTO g16;
  INSERT INTO guest_profiles (first_name, last_name, email, phone, nationality, id_type, id_number, id_verified, tags, loyalty_points, total_stays) VALUES
    ('Nithya', 'Ramesh', 'nithya.r@tcs.com', '+91-9876543217', 'Indian', 'aadhaar', '1098-9012-3456', true, ARRAY['corporate'], 400, 3) RETURNING id INTO g17;
  INSERT INTO guest_profiles (first_name, last_name, email, phone, nationality, id_type, id_number, id_verified, tags, loyalty_points, total_stays) VALUES
    ('Ahmed', 'Khan', 'ahmed.k@travel.pk', '+92-300-1234567', 'Pakistani', 'passport', 'PK-AB1234567', true, ARRAY[]::text[], 300, 2) RETURNING id INTO g18;
  INSERT INTO guest_profiles (first_name, last_name, email, phone, nationality, id_type, id_number, id_verified, tags, loyalty_points, total_stays) VALUES
    ('Kavitha', 'Balan', 'kavitha.b@wipro.com', '+91-9876543219', 'Indian', 'aadhaar', '0987-0123-4567', true, ARRAY['frequent','corporate'], 1100, 9) RETURNING id INTO g19;
  INSERT INTO guest_profiles (first_name, last_name, email, phone, nationality, id_type, id_number, id_verified, tags, loyalty_points, total_stays) VALUES
    ('Vivek', 'Oberoi', 'vivek.o@gmail.com', '+91-9876543220', 'Indian', 'driving_license', 'MH-0220180067890', true, ARRAY['VIP'], 2000, 14) RETURNING id INTO g20;

  RAISE NOTICE '✓ Created 20 guest profiles with ID proofs.';

  -- ==========================================================================
  -- 6. CREATE 25 BOOKINGS ACROSS ALL STATUSES
  -- ==========================================================================

  -- ── CHECKED-IN (8 bookings — currently in-house) ──
  INSERT INTO bookings (property_id, unit_id, guest_id, booking_model, status, source, check_in, check_out, adults, children, total_amount, paid_amount, checked_in_at) VALUES
    (ovh_id, u301, g1, 'nightly', 'checked_in', 'direct', NOW() - interval '2 days', NOW() + interval '3 days', 2, 0, 17500, 17500, NOW() - interval '2 days') RETURNING id INTO bk1;
  UPDATE units SET status = 'occupied' WHERE id = u301;

  INSERT INTO bookings (property_id, unit_id, guest_id, booking_model, status, source, check_in, check_out, adults, children, total_amount, paid_amount, checked_in_at) VALUES
    (ovh_id, u404, g3, 'nightly', 'checked_in', 'booking.com', NOW() - interval '1 day', NOW() + interval '4 days', 2, 1, 35000, 20000, NOW() - interval '1 day') RETURNING id INTO bk2;
  UPDATE units SET status = 'occupied' WHERE id = u404;

  INSERT INTO bookings (property_id, unit_id, guest_id, booking_model, status, source, check_in, check_out, adults, children, total_amount, paid_amount, checked_in_at) VALUES
    (ovh_id, u503, g5, 'nightly', 'checked_in', 'direct', NOW() - interval '3 days', NOW() + interval '2 days', 2, 0, 50000, 50000, NOW() - interval '3 days') RETURNING id INTO bk3;
  UPDATE units SET status = 'occupied' WHERE id = u503;

  INSERT INTO bookings (property_id, unit_id, guest_id, booking_model, status, source, check_in, check_out, adults, children, total_amount, paid_amount, checked_in_at) VALUES
    (ovh_id, u201, g7, 'nightly', 'checked_in', 'expedia', NOW() - interval '1 day', NOW() + interval '2 days', 1, 0, 7500, 7500, NOW() - interval '1 day') RETURNING id INTO bk4;
  UPDATE units SET status = 'occupied' WHERE id = u201;

  INSERT INTO bookings (property_id, unit_id, guest_id, booking_model, status, source, check_in, check_out, adults, children, total_amount, paid_amount, checked_in_at) VALUES
    (ovh_id, u105, g9, 'nightly', 'checked_in', 'direct', NOW() - interval '4 days', NOW() + interval '1 day', 2, 0, 10000, 10000, NOW() - interval '4 days') RETURNING id INTO bk5;
  UPDATE units SET status = 'occupied' WHERE id = u105;

  INSERT INTO bookings (property_id, unit_id, guest_id, booking_model, status, source, check_in, check_out, adults, children, total_amount, paid_amount, checked_in_at) VALUES
    (ovh_id, u402, g11, 'nightly', 'checked_in', 'goibibo', NOW() - interval '2 days', NOW() + interval '1 day', 2, 0, 15000, 10000, NOW() - interval '2 days') RETURNING id INTO bk6;
  UPDATE units SET status = 'occupied' WHERE id = u402;

  INSERT INTO bookings (property_id, unit_id, guest_id, booking_model, status, source, check_in, check_out, adults, children, total_amount, paid_amount, checked_in_at) VALUES
    (ovh_id, u303, g14, 'nightly', 'checked_in', 'direct', NOW(), NOW() + interval '5 days', 2, 1, 22500, 15000, NOW()) RETURNING id INTO bk7;
  UPDATE units SET status = 'occupied' WHERE id = u303;

  INSERT INTO bookings (property_id, unit_id, guest_id, booking_model, status, source, check_in, check_out, adults, children, total_amount, paid_amount, checked_in_at) VALUES
    (ovh_id, u501, g20, 'nightly', 'checked_in', 'direct', NOW() - interval '1 day', NOW() + interval '3 days', 2, 0, 32000, 32000, NOW() - interval '1 day') RETURNING id INTO bk8;
  UPDATE units SET status = 'occupied' WHERE id = u501;

  -- ── CONFIRMED (5 bookings — arriving today / tomorrow) ──
  INSERT INTO bookings (property_id, unit_id, guest_id, booking_model, status, source, check_in, check_out, adults, children, total_amount, paid_amount) VALUES
    (ovh_id, u305, g2, 'nightly', 'confirmed', 'direct', NOW(), NOW() + interval '3 days', 2, 0, 16500, 8000) RETURNING id INTO bk9;
  UPDATE units SET status = 'reserved' WHERE id = u305;

  INSERT INTO bookings (property_id, unit_id, guest_id, booking_model, status, source, check_in, check_out, adults, children, total_amount, paid_amount) VALUES
    (ovh_id, u204, g4, 'nightly', 'confirmed', 'booking.com', NOW(), NOW() + interval '2 days', 1, 0, 6000, 3000) RETURNING id INTO bk10;
  UPDATE units SET status = 'reserved' WHERE id = u204;

  INSERT INTO bookings (property_id, unit_id, guest_id, booking_model, status, source, check_in, check_out, adults, children, total_amount, paid_amount) VALUES
    (ovh_id, u401, g8, 'nightly', 'confirmed', 'expedia', NOW() + interval '1 day', NOW() + interval '4 days', 2, 0, 15000, 0) RETURNING id INTO bk11;
  UPDATE units SET status = 'reserved' WHERE id = u401;

  INSERT INTO bookings (property_id, unit_id, guest_id, booking_model, status, source, check_in, check_out, adults, children, total_amount, paid_amount) VALUES
    (ovh_id, u505, g12, 'nightly', 'confirmed', 'direct', NOW() + interval '1 day', NOW() + interval '5 days', 2, 1, 48000, 24000) RETURNING id INTO bk12;
  UPDATE units SET status = 'reserved' WHERE id = u505;

  INSERT INTO bookings (property_id, unit_id, guest_id, booking_model, status, source, check_in, check_out, adults, children, total_amount, paid_amount) VALUES
    (ovh_id, u104, g19, 'nightly', 'confirmed', 'goibibo', NOW(), NOW() + interval '2 days', 1, 0, 3600, 1800) RETURNING id INTO bk13;
  UPDATE units SET status = 'reserved' WHERE id = u104;

  -- ── PENDING (3 bookings — future reservations) ──
  INSERT INTO bookings (property_id, unit_id, guest_id, booking_model, status, source, check_in, check_out, adults, children, total_amount, paid_amount) VALUES
    (ovh_id, NULL, g6, 'nightly', 'pending', 'direct', NOW() + interval '5 days', NOW() + interval '8 days', 2, 0, 10500, 0) RETURNING id INTO bk14;
  INSERT INTO bookings (property_id, unit_id, guest_id, booking_model, status, source, check_in, check_out, adults, children, total_amount, paid_amount) VALUES
    (ovh_id, NULL, g15, 'nightly', 'pending', 'booking.com', NOW() + interval '7 days', NOW() + interval '10 days', 1, 0, 13500, 0) RETURNING id INTO bk15;
  INSERT INTO bookings (property_id, unit_id, guest_id, booking_model, status, source, check_in, check_out, adults, children, total_amount, paid_amount) VALUES
    (ovh_id, NULL, g18, 'nightly', 'pending', 'expedia', NOW() + interval '10 days', NOW() + interval '14 days', 2, 1, 28000, 0) RETURNING id INTO bk16;

  -- ── CHECKED-OUT (5 bookings — past stays, rooms now dirty) ──
  INSERT INTO bookings (property_id, unit_id, guest_id, booking_model, status, source, check_in, check_out, adults, children, total_amount, paid_amount, checked_in_at, checked_out_at) VALUES
    (ovh_id, u101, g10, 'nightly', 'checked_out', 'direct', NOW() - interval '3 days', NOW(), 1, 0, 4500, 4500, NOW() - interval '3 days', NOW() - interval '1 hour') RETURNING id INTO bk17;
  UPDATE units SET status = 'dirty' WHERE id = u101;

  INSERT INTO bookings (property_id, unit_id, guest_id, booking_model, status, source, check_in, check_out, adults, children, total_amount, paid_amount, checked_in_at, checked_out_at) VALUES
    (ovh_id, u202, g13, 'nightly', 'checked_out', 'booking.com', NOW() - interval '4 days', NOW() - interval '1 day', 2, 0, 7500, 7500, NOW() - interval '4 days', NOW() - interval '1 day') RETURNING id INTO bk18;
  UPDATE units SET status = 'dirty' WHERE id = u202;

  INSERT INTO bookings (property_id, unit_id, guest_id, booking_model, status, source, check_in, check_out, adults, children, total_amount, paid_amount, checked_in_at, checked_out_at) VALUES
    (ovh_id, u304, g17, 'nightly', 'checked_out', 'direct', NOW() - interval '5 days', NOW() - interval '2 days', 2, 0, 13500, 13500, NOW() - interval '5 days', NOW() - interval '2 days') RETURNING id INTO bk19;
  UPDATE units SET status = 'cleaning' WHERE id = u304;

  INSERT INTO bookings (property_id, unit_id, guest_id, booking_model, status, source, check_in, check_out, adults, children, total_amount, paid_amount, checked_in_at, checked_out_at) VALUES
    (ovh_id, u403, g4, 'nightly', 'checked_out', 'goibibo', NOW() - interval '6 days', NOW() - interval '3 days', 1, 0, 16500, 16500, NOW() - interval '6 days', NOW() - interval '3 days') RETURNING id INTO bk20;
  UPDATE units SET status = 'dirty' WHERE id = u403;

  INSERT INTO bookings (property_id, unit_id, guest_id, booking_model, status, source, check_in, check_out, adults, children, total_amount, paid_amount, checked_in_at, checked_out_at) VALUES
    (ovh_id, u502, g1, 'nightly', 'checked_out', 'direct', NOW() - interval '7 days', NOW() - interval '4 days', 2, 0, 24000, 24000, NOW() - interval '7 days', NOW() - interval '4 days') RETURNING id INTO bk21;
  UPDATE units SET status = 'vacant' WHERE id = u502; -- already cleaned

  -- ── CANCELLED (2 bookings) ──
  INSERT INTO bookings (property_id, unit_id, guest_id, booking_model, status, source, check_in, check_out, adults, children, total_amount, paid_amount) VALUES
    (ovh_id, NULL, g16, 'nightly', 'cancelled', 'direct', NOW() + interval '3 days', NOW() + interval '5 days', 1, 0, 5000, 2500) RETURNING id INTO bk22;
  INSERT INTO bookings (property_id, unit_id, guest_id, booking_model, status, source, check_in, check_out, adults, children, total_amount, paid_amount) VALUES
    (ovh_id, NULL, g13, 'nightly', 'cancelled', 'expedia', NOW() + interval '2 days', NOW() + interval '4 days', 2, 0, 9000, 0) RETURNING id INTO bk23;

  -- ── NO-SHOW (2 bookings — OTA, reconciliation needed) ──
  INSERT INTO bookings (property_id, unit_id, guest_id, booking_model, status, source, source_booking_ref, check_in, check_out, adults, children, total_amount, paid_amount) VALUES
    (ovh_id, NULL, g15, 'nightly', 'no_show', 'booking.com', 'BCOM-789456', NOW() - interval '1 day', NOW() + interval '2 days', 1, 0, 7500, 7500) RETURNING id INTO bk24;
  INSERT INTO bookings (property_id, unit_id, guest_id, booking_model, status, source, source_booking_ref, check_in, check_out, adults, children, total_amount, paid_amount) VALUES
    (ovh_id, NULL, g18, 'nightly', 'no_show', 'goibibo', 'GI-654321', NOW() - interval '2 days', NOW(), 2, 0, 10000, 10000) RETURNING id INTO bk25;

  RAISE NOTICE '✓ Created 25 bookings across all statuses.';

  -- ==========================================================================
  -- 7. CHECK-IN CHECKLISTS (for checked_in bookings)
  -- ==========================================================================
  INSERT INTO checkin_checklists (booking_id, checklist_items, verified_by) VALUES
    (bk1, '{"id_verified":true,"key_card_issued":true,"hk_clearance":true,"maint_clearance":true,"deposit_collected":true,"welcome_drink":true}'::jsonb, uid_fd),
    (bk2, '{"id_verified":true,"key_card_issued":true,"hk_clearance":true,"maint_clearance":true,"deposit_collected":true,"welcome_drink":true,"parking_allocated":true}'::jsonb, uid_fd),
    (bk3, '{"id_verified":true,"key_card_issued":true,"hk_clearance":true,"maint_clearance":true,"deposit_collected":true,"welcome_drink":true,"vip_amenities":true}'::jsonb, uid_fd),
    (bk4, '{"id_verified":true,"key_card_issued":true,"hk_clearance":true,"maint_clearance":true}'::jsonb, uid_fd),
    (bk5, '{"id_verified":true,"key_card_issued":true,"hk_clearance":true,"maint_clearance":true,"deposit_collected":true}'::jsonb, uid_fd),
    (bk6, '{"id_verified":true,"key_card_issued":true,"hk_clearance":true,"maint_clearance":true}'::jsonb, uid_fd),
    (bk7, '{"id_verified":true,"key_card_issued":true,"hk_clearance":true,"maint_clearance":true,"deposit_collected":true}'::jsonb, uid_fd),
    (bk8, '{"id_verified":true,"key_card_issued":true,"hk_clearance":true,"maint_clearance":true,"deposit_collected":true,"welcome_drink":true,"vip_amenities":true}'::jsonb, uid_fd);

  RAISE NOTICE '✓ Created check-in checklists.';

  -- ==========================================================================
  -- 8. HOUSEKEEPING TASKS WITH SLA
  -- ==========================================================================
  -- Checkout clean tasks (for checked-out rooms) — SLA: 1 hour
  INSERT INTO housekeeping_tasks (unit_id, property_id, assigned_to, task_type, priority, status, scheduled_at, notes) VALUES
    (u101, ovh_id, uid_hk, 'checkout_clean', 'high', 'open', NOW() - interval '1 hour', 'Post-checkout clean for Room 101. SLA: 1 hour.') RETURNING id INTO hk_id;
  INSERT INTO housekeeping_checklists (task_id, item, is_checked) VALUES
    (hk_id, 'Strip bed linens', false), (hk_id, 'Clean bathroom', false), (hk_id, 'Vacuum carpet', false),
    (hk_id, 'Restock minibar', false), (hk_id, 'Replace towels', false), (hk_id, 'Wipe surfaces', false);

  INSERT INTO housekeeping_tasks (unit_id, property_id, assigned_to, task_type, priority, status, scheduled_at, notes) VALUES
    (u202, ovh_id, uid_hk, 'checkout_clean', 'high', 'open', NOW() - interval '30 minutes', 'Post-checkout clean for Room 202. SLA: 1 hour.');

  INSERT INTO housekeeping_tasks (unit_id, property_id, assigned_to, task_type, priority, status, scheduled_at, started_at, notes) VALUES
    (u403, ovh_id, uid_hk, 'checkout_clean', 'high', 'open', NOW() - interval '2 hours', NOW() - interval '1 hour', 'Post-checkout clean for Room 403. SLA: 1 hour. OVERDUE!');

  -- Deep clean (3 rooms) — SLA: 3 hours
  INSERT INTO housekeeping_tasks (unit_id, property_id, assigned_to, task_type, priority, status, scheduled_at, started_at, notes) VALUES
    (u304, ovh_id, uid_hk, 'deep_clean', 'medium', 'in_progress', NOW() - interval '1 hour', NOW() - interval '45 minutes', 'Deep clean Room 304 after extended stay. SLA: 3 hours.') RETURNING id INTO hk_id;
  INSERT INTO housekeeping_checklists (task_id, item, is_checked) VALUES
    (hk_id, 'Strip bed linens', true), (hk_id, 'Clean bathroom', true), (hk_id, 'Vacuum carpet', false),
    (hk_id, 'Shampoo carpet', false), (hk_id, 'Clean AC filters', false), (hk_id, 'Polish furniture', false);

  INSERT INTO housekeeping_tasks (unit_id, property_id, assigned_to, task_type, priority, status, scheduled_at, started_at, notes) VALUES
    (u103, ovh_id, uid_hk, 'deep_clean', 'medium', 'in_progress', NOW() - interval '2 hours', NOW() - interval '1.5 hours', 'Deep clean Room 103. SLA: 3 hours.');
  UPDATE units SET status = 'cleaning' WHERE id = u103;

  INSERT INTO housekeeping_tasks (unit_id, property_id, assigned_to, task_type, priority, status, scheduled_at, notes) VALUES
    (u203, ovh_id, uid_hk, 'deep_clean', 'low', 'open', NOW() + interval '2 hours', 'Scheduled deep clean Room 203.');

  -- Turnaround (4 tasks) — SLA: 2 hours
  INSERT INTO housekeeping_tasks (unit_id, property_id, assigned_to, task_type, priority, status, scheduled_at, notes) VALUES
    (u102, ovh_id, uid_hk, 'turnaround', 'high', 'open', NOW(), 'Turnaround clean for incoming guest. SLA: 2 hours.');
  INSERT INTO housekeeping_tasks (unit_id, property_id, assigned_to, task_type, priority, status, scheduled_at, notes) VALUES
    (u205, ovh_id, uid_hk, 'turnaround', 'high', 'assigned', NOW() + interval '30 minutes', 'Turnaround for Room 205. SLA: 2 hours.');
  INSERT INTO housekeeping_tasks (unit_id, property_id, assigned_to, task_type, priority, status, scheduled_at, started_at, notes) VALUES
    (u302, ovh_id, uid_hk, 'turnaround', 'medium', 'in_progress', NOW() - interval '30 minutes', NOW() - interval '20 minutes', 'Turnaround Room 302. SLA: 2 hours.');
  UPDATE units SET status = 'cleaning' WHERE id = u302;
  INSERT INTO housekeeping_tasks (unit_id, property_id, assigned_to, task_type, priority, status, scheduled_at, notes) VALUES
    (u405, ovh_id, uid_hk, 'turnaround', 'medium', 'open', NOW() + interval '1 hour', 'Turnaround Room 405. SLA: 2 hours.');

  -- Stayover tidy (3 tasks — already resolved)
  INSERT INTO housekeeping_tasks (unit_id, property_id, assigned_to, task_type, priority, status, scheduled_at, started_at, completed_at, notes) VALUES
    (u301, ovh_id, uid_hk, 'stayover_tidy', 'low', 'resolved', NOW() - interval '4 hours', NOW() - interval '3.5 hours', NOW() - interval '3 hours', 'Stayover tidy Room 301. Completed.'),
    (u501, ovh_id, uid_hk, 'stayover_tidy', 'low', 'resolved', NOW() - interval '5 hours', NOW() - interval '4.5 hours', NOW() - interval '4 hours', 'Stayover tidy Room 501 (VIP). Completed.'),
    (u404, ovh_id, uid_hk, 'stayover_tidy', 'low', 'resolved', NOW() - interval '3 hours', NOW() - interval '2.5 hours', NOW() - interval '2 hours', 'Stayover tidy Room 404. Completed.');

  -- Inspection (2 tasks)
  INSERT INTO housekeeping_tasks (unit_id, property_id, assigned_to, task_type, priority, status, scheduled_at, notes) VALUES
    (u304, ovh_id, uid_hk, 'inspection', 'medium', 'open', NOW() + interval '2 hours', 'Post-deep-clean inspection for Room 304.');
  INSERT INTO housekeeping_tasks (unit_id, property_id, assigned_to, task_type, priority, status, scheduled_at, notes) VALUES
    (u302, ovh_id, uid_hk, 'inspection', 'medium', 'open', NOW() + interval '1.5 hours', 'Post-turnaround inspection for Room 302.');

  RAISE NOTICE '✓ Created 17 housekeeping tasks with SLA timers.';

  -- ==========================================================================
  -- 9. MAINTENANCE TICKETS WITH ROOM BLOCKING
  -- ==========================================================================
  -- Critical: AC not cooling Room 409 — room BLOCKED
  INSERT INTO maintenance_tickets (property_id, unit_id, ticket_number, ticket_type, title, description, category, priority, status, reported_by, assigned_to, vendor_id) VALUES
    (ovh_id, u101, 'MT-VGH-001', 'corrective', 'AC compressor failure — Room 101', 'Guest reported AC completely stopped. Compressor noise and no cooling. Room blocked.', 'HVAC', 'critical', 'open', uid_fd, uid_maint, vid_hvac) RETURNING id INTO mt_id;
  -- NOTE: u101 is already 'dirty' from checkout; after HK, will remain blocked for maintenance
  INSERT INTO maintenance_time_entries (ticket_id, technician_id, start_time, notes) VALUES
    (mt_id, uid_maint, NOW() - interval '30 minutes', 'Initial diagnosis — compressor needs replacement. Vendor notified.');
  INSERT INTO maintenance_approvals (ticket_id, action, performed_by, comment) VALUES
    (mt_id, 'assigned', uid_admin, 'Assigned to maintenance team + HVAC vendor');

  -- High: Plumbing leak Room 205 — room BLOCKED
  INSERT INTO maintenance_tickets (property_id, unit_id, ticket_number, ticket_type, title, description, category, priority, status, reported_by, assigned_to, vendor_id) VALUES
    (ovh_id, u205, 'MT-VGH-002', 'corrective', 'Bathroom pipe leak — Room 205', 'Water seeping from bathroom ceiling. Immediate plumbing attention needed.', 'plumbing', 'high', 'in_progress', uid_hk, uid_maint, vid_plumb) RETURNING id INTO mt_id;
  UPDATE units SET status = 'maintenance' WHERE id = u205;
  INSERT INTO maintenance_time_entries (ticket_id, technician_id, start_time, notes) VALUES
    (mt_id, uid_maint, NOW() - interval '2 hours', 'Pipe joint cracked. Vendor plumber dispatched. ETA 1 hour.');
  INSERT INTO maintenance_ticket_parts (ticket_id, part_name, quantity, unit_price) VALUES
    (mt_id, 'PVC Pipe Joint 1inch', 2, 180), (mt_id, 'Sealant Tape', 1, 65);
  INSERT INTO maintenance_approvals (ticket_id, action, performed_by, comment) VALUES
    (mt_id, 'assigned', uid_admin, 'Vendor plumber dispatched');

  -- Medium: TV not working Room 308 — resolved, room released
  INSERT INTO maintenance_tickets (property_id, unit_id, ticket_number, ticket_type, title, description, category, priority, status, reported_by, assigned_to, resolved_at, resolution_notes) VALUES
    (ovh_id, u301, 'MT-VGH-003', 'corrective', 'TV display blank — Room 301', 'Smart TV showing black screen despite power. Reset attempted.', 'electrical', 'medium', 'resolved', uid_fd, uid_maint, NOW() - interval '3 hours', 'HDMI cable was loose. Reconnected and tested — working fine.');

  -- Low: Corridor light — closed
  INSERT INTO maintenance_tickets (property_id, ticket_number, ticket_type, title, description, category, priority, status, reported_by, assigned_to, resolved_at, resolution_notes) VALUES
    (ovh_id, 'MT-VGH-004', 'corrective', 'Floor 2 corridor lights flickering', 'Multiple LED lights on 2nd floor east corridor flickering.', 'electrical', 'low', 'closed', uid_hk, uid_maint, NOW() - interval '1 day', 'Replaced 4 LED bulbs. All working.');

  -- High: Elevator issue — common area, no room blocked
  INSERT INTO maintenance_tickets (property_id, ticket_number, ticket_type, title, description, category, priority, status, reported_by, assigned_to, vendor_id) VALUES
    (ovh_id, 'MT-VGH-005', 'corrective', 'Elevator B intermittent stop at Floor 3', 'Elevator B stops momentarily between floors 3-4. Safety concern.', 'elevator', 'high', 'assigned', uid_fd, uid_maint, vid_elev) RETURNING id INTO mt_id;
  INSERT INTO maintenance_approvals (ticket_id, action, performed_by, comment) VALUES
    (mt_id, 'assigned', uid_admin, 'Elevator vendor notified under AMC. SLA: 4 hours.');

  -- Critical: Fire alarm panel — common area
  INSERT INTO maintenance_tickets (property_id, ticket_number, ticket_type, title, description, category, priority, status, reported_by) VALUES
    (ovh_id, 'MT-VGH-006', 'corrective', 'Fire alarm panel zone 3 fault', 'Zone 3 fire alarm panel showing fault code F-12. No actual fire but panel needs repair.', 'safety', 'critical', 'open', uid_admin);

  RAISE NOTICE '✓ Created 6 maintenance tickets with room blocking.';

  -- ==========================================================================
  -- 10. GUEST FEEDBACK (post-checkout)
  -- ==========================================================================
  INSERT INTO guest_feedbacks (property_id, booking_id, guest_id, department, rating, comments) VALUES
    (ovh_id, bk17, g10, 'Front Desk', 4, 'Quick check-in process. Staff was courteous.'),
    (ovh_id, bk17, g10, 'Housekeeping', 5, 'Room was spotlessly clean every day.'),
    (ovh_id, bk17, g10, 'Overall', 4, 'Good budget stay. Value for money.'),
    (ovh_id, bk18, g13, 'Front Desk', 3, 'Check-in took a bit long due to system issue.'),
    (ovh_id, bk18, g13, 'Housekeeping', 4, 'Clean room but towels were not replaced on day 2.'),
    (ovh_id, bk18, g13, 'Maintenance', 2, 'AC was not cooling well. Reported but took 6 hours to fix.'),
    (ovh_id, bk18, g13, 'Overall', 3, 'Average experience. AC issue was a letdown.'),
    (ovh_id, bk19, g17, 'Front Desk', 5, 'Excellent service. Early check-in accommodated.'),
    (ovh_id, bk19, g17, 'Housekeeping', 5, 'Impeccable housekeeping throughout the stay.'),
    (ovh_id, bk19, g17, 'F&B', 4, 'Good breakfast variety. Would love more South Indian options.'),
    (ovh_id, bk19, g17, 'Overall', 5, 'Wonderful stay. Will definitely come back!'),
    (ovh_id, bk20, g4, 'Front Desk', 4, 'Smooth process. Staff remembered my preferences.'),
    (ovh_id, bk20, g4, 'Overall', 4, 'Consistent quality. Loyal guest.'),
    (ovh_id, bk21, g1, 'Front Desk', 5, 'VIP treatment was outstanding.'),
    (ovh_id, bk21, g1, 'Housekeeping', 5, 'Suite was immaculate.'),
    (ovh_id, bk21, g1, 'Overall', 5, 'Best hotel in Chennai. Period.');

  RAISE NOTICE '✓ Created 16 guest feedback entries.';

  -- ==========================================================================
  -- 11. INVOICES FOR ALL BOOKINGS
  -- ==========================================================================
  -- Auto-create invoices for all bookings
  INSERT INTO invoices (property_id, booking_id, guest_id, invoice_number, invoice_date, due_date, status, subtotal, tax_total, grand_total, paid_total) VALUES
    (ovh_id, bk1, g1, 'INV-VGH-001', CURRENT_DATE - 2, CURRENT_DATE + 3, 'sent', 14831, 2669, 17500, 17500),
    (ovh_id, bk2, g3, 'INV-VGH-002', CURRENT_DATE - 1, CURRENT_DATE + 4, 'sent', 29661, 5339, 35000, 20000),
    (ovh_id, bk3, g5, 'INV-VGH-003', CURRENT_DATE - 3, CURRENT_DATE + 2, 'sent', 42373, 7627, 50000, 50000),
    (ovh_id, bk4, g7, 'INV-VGH-004', CURRENT_DATE - 1, CURRENT_DATE + 2, 'sent', 6356, 1144, 7500, 7500),
    (ovh_id, bk5, g9, 'INV-VGH-005', CURRENT_DATE - 4, CURRENT_DATE + 1, 'sent', 8475, 1525, 10000, 10000),
    (ovh_id, bk6, g11, 'INV-VGH-006', CURRENT_DATE - 2, CURRENT_DATE + 1, 'sent', 12712, 2288, 15000, 10000),
    (ovh_id, bk7, g14, 'INV-VGH-007', CURRENT_DATE, CURRENT_DATE + 5, 'draft', 19068, 3432, 22500, 15000),
    (ovh_id, bk8, g20, 'INV-VGH-008', CURRENT_DATE - 1, CURRENT_DATE + 3, 'sent', 27119, 4881, 32000, 32000),
    (ovh_id, bk9, g2, 'INV-VGH-009', CURRENT_DATE, CURRENT_DATE + 3, 'draft', 13983, 2517, 16500, 8000),
    (ovh_id, bk10, g4, 'INV-VGH-010', CURRENT_DATE, CURRENT_DATE + 2, 'draft', 5085, 915, 6000, 3000),
    (ovh_id, bk17, g10, 'INV-VGH-011', CURRENT_DATE, CURRENT_DATE, 'paid', 3814, 686, 4500, 4500),
    (ovh_id, bk18, g13, 'INV-VGH-012', CURRENT_DATE - 1, CURRENT_DATE - 1, 'paid', 6356, 1144, 7500, 7500),
    (ovh_id, bk19, g17, 'INV-VGH-013', CURRENT_DATE - 2, CURRENT_DATE - 2, 'paid', 11441, 2059, 13500, 13500),
    (ovh_id, bk20, g4, 'INV-VGH-014', CURRENT_DATE - 3, CURRENT_DATE - 3, 'paid', 13983, 2517, 16500, 16500),
    (ovh_id, bk21, g1, 'INV-VGH-015', CURRENT_DATE - 4, CURRENT_DATE - 4, 'paid', 20339, 3661, 24000, 24000);

  RAISE NOTICE '✓ Created 15 invoices.';

  -- ==========================================================================
  -- 12. PAYMENTS (advance, full, channel partner)
  -- ==========================================================================
  INSERT INTO payments (property_id, booking_id, payment_method, amount, currency, status, reconciliation_status, payment_date) VALUES
    (ovh_id, bk1, 'upi', 17500, 'INR', 'completed', 'matched', NOW() - interval '2 days'),
    (ovh_id, bk2, 'card', 20000, 'INR', 'completed', 'pending', NOW() - interval '1 day'),
    (ovh_id, bk3, 'bank_transfer', 50000, 'INR', 'completed', 'matched', NOW() - interval '3 days'),
    (ovh_id, bk4, 'card', 7500, 'INR', 'completed', 'pending', NOW() - interval '1 day'),
    (ovh_id, bk5, 'cash', 10000, 'INR', 'completed', 'matched', NOW() - interval '4 days'),
    (ovh_id, bk6, 'card', 10000, 'INR', 'completed', 'pending', NOW() - interval '2 days'),
    (ovh_id, bk7, 'upi', 15000, 'INR', 'completed', 'matched', NOW()),
    (ovh_id, bk8, 'bank_transfer', 32000, 'INR', 'completed', 'matched', NOW() - interval '1 day'),
    (ovh_id, bk9, 'upi', 8000, 'INR', 'completed', 'matched', NOW()),
    (ovh_id, bk10, 'card', 3000, 'INR', 'completed', 'pending', NOW()),
    (ovh_id, bk13, 'upi', 1800, 'INR', 'completed', 'matched', NOW()),
    (ovh_id, bk12, 'bank_transfer', 24000, 'INR', 'completed', 'matched', NOW()),
    -- Checked-out full payments
    (ovh_id, bk17, 'cash', 4500, 'INR', 'completed', 'matched', NOW() - interval '1 hour'),
    (ovh_id, bk18, 'card', 7500, 'INR', 'completed', 'pending', NOW() - interval '1 day'),
    (ovh_id, bk19, 'upi', 13500, 'INR', 'completed', 'matched', NOW() - interval '2 days'),
    (ovh_id, bk20, 'card', 16500, 'INR', 'completed', 'pending', NOW() - interval '3 days'),
    (ovh_id, bk21, 'bank_transfer', 24000, 'INR', 'completed', 'matched', NOW() - interval '4 days'),
    -- No-show OTA payments (need reconciliation)
    (ovh_id, bk24, 'gateway', 7500, 'INR', 'completed', 'unmatched', NOW() - interval '1 day'),
    (ovh_id, bk25, 'gateway', 10000, 'INR', 'completed', 'unmatched', NOW() - interval '2 days'),
    -- Cancelled refund
    (ovh_id, bk22, 'upi', 2500, 'INR', 'completed', 'matched', NOW() - interval '1 day');

  RAISE NOTICE '✓ Created 20 payments including channel partner reconciliation entries.';

  -- ==========================================================================
  -- 13. BANK RECONCILIATION (OTA channel partner payments)
  -- ==========================================================================
  INSERT INTO bank_reconciliation (property_id, bank_ref, transaction_date, amount, description, status) VALUES
    (ovh_id, 'NEFT-BCOM-20260710', CURRENT_DATE - 1, 20000, 'Booking.com settlement — 3 bookings', 'unmatched'),
    (ovh_id, 'NEFT-EXPD-20260709', CURRENT_DATE - 2, 7500, 'Expedia settlement — 1 booking', 'unmatched'),
    (ovh_id, 'NEFT-GOIB-20260708', CURRENT_DATE - 3, 26500, 'Goibibo settlement — 2 bookings', 'unmatched'),
    (ovh_id, 'UPI-DIRECT-20260711', CURRENT_DATE, 15000, 'Direct UPI collection — Walk-in', 'matched');

  RAISE NOTICE '✓ Created bank reconciliation entries.';

  -- ==========================================================================
  -- 14. GUEST REQUESTS (front desk todo list)
  -- ==========================================================================
  INSERT INTO guest_requests (property_id, booking_id, request_type, description, status, assigned_to_dept) VALUES
    (ovh_id, bk1, 'room_service', 'Extra pillows and blanket requested', 'pending', 'housekeeping'),
    (ovh_id, bk2, 'maintenance', 'Hot water not coming in bathroom', 'in_progress', 'maintenance'),
    (ovh_id, bk3, 'room_service', 'Late checkout requested till 2 PM', 'pending', 'front_desk'),
    (ovh_id, bk5, 'housekeeping', 'Room needs immediate cleaning — spilled coffee', 'in_progress', 'housekeeping'),
    (ovh_id, bk7, 'complaint', 'Noisy neighbors in Room 304', 'pending', 'front_desk'),
    (ovh_id, bk8, 'room_service', 'Welcome fruit basket for VIP guest', 'resolved', 'front_desk');

  RAISE NOTICE '✓ Created 6 guest requests.';

  -- ==========================================================================
  -- 15. HR — ATTENDANCE (last 30 days for all OVH employees)
  -- ==========================================================================
  -- Clear existing attendance for OVH
  DELETE FROM attendance_records WHERE property_id = ovh_id;

  -- Insert 30 days attendance for each employee (with some absences for LOP)
  FOR i IN 0..29 LOOP
    -- Admin (present all days)
    INSERT INTO attendance_records (employee_id, property_id, clock_in, clock_out, status)
    SELECT e.id, ovh_id,
      (CURRENT_DATE - i)::timestamp + time '09:00',
      (CURRENT_DATE - i)::timestamp + time '18:00',
      'present'
    FROM employees e WHERE e.user_id = uid_admin
    ON CONFLICT DO NOTHING;

    -- Front Desk (1 late, 2 absent in 30 days)
    IF i NOT IN (5, 18) THEN
      INSERT INTO attendance_records (employee_id, property_id, clock_in, clock_out, status)
      SELECT e.id, ovh_id,
        (CURRENT_DATE - i)::timestamp + CASE WHEN i = 10 THEN time '09:45' ELSE time '09:00' END,
        (CURRENT_DATE - i)::timestamp + time '18:00',
        CASE WHEN i = 10 THEN 'late' ELSE 'present' END
      FROM employees e WHERE e.user_id = uid_fd
      ON CONFLICT DO NOTHING;
    END IF;

    -- Housekeeping (3 absent — LOP candidate)
    IF i NOT IN (3, 12, 22) THEN
      INSERT INTO attendance_records (employee_id, property_id, clock_in, clock_out, status)
      SELECT e.id, ovh_id,
        (CURRENT_DATE - i)::timestamp + time '07:00',
        (CURRENT_DATE - i)::timestamp + time '15:00',
        'present'
      FROM employees e WHERE e.user_id = uid_hk
      ON CONFLICT DO NOTHING;
    END IF;

    -- Maintenance (2 late, 1 absent)
    IF i != 15 THEN
      INSERT INTO attendance_records (employee_id, property_id, clock_in, clock_out, status)
      SELECT e.id, ovh_id,
        (CURRENT_DATE - i)::timestamp + CASE WHEN i IN (7, 21) THEN time '09:30' ELSE time '09:00' END,
        (CURRENT_DATE - i)::timestamp + time '18:00',
        CASE WHEN i IN (7, 21) THEN 'late' ELSE 'present' END
      FROM employees e WHERE e.user_id = uid_maint
      ON CONFLICT DO NOTHING;
    END IF;

    -- HR Manager (present all days)
    INSERT INTO attendance_records (employee_id, property_id, clock_in, clock_out, status)
    SELECT e.id, ovh_id,
      (CURRENT_DATE - i)::timestamp + time '09:00',
      (CURRENT_DATE - i)::timestamp + time '18:00',
      'present'
    FROM employees e WHERE e.user_id = uid_hr
    ON CONFLICT DO NOTHING;

    -- Finance (1 half day)
    INSERT INTO attendance_records (employee_id, property_id, clock_in, clock_out, status)
    SELECT e.id, ovh_id,
      (CURRENT_DATE - i)::timestamp + time '09:00',
      (CURRENT_DATE - i)::timestamp + CASE WHEN i = 8 THEN time '13:00' ELSE time '18:00' END,
      CASE WHEN i = 8 THEN 'half_day' ELSE 'present' END
    FROM employees e WHERE e.user_id = uid_fin
    ON CONFLICT DO NOTHING;
  END LOOP;

  RAISE NOTICE '✓ Created 30-day attendance records with LOP scenarios.';

  -- ==========================================================================
  -- 16. HR — PAYROLL RUN (current month with LOP deductions)
  -- ==========================================================================
  DELETE FROM payroll_lines WHERE payroll_id IN (SELECT id FROM payroll_runs WHERE property_id = ovh_id AND period_start >= (date_trunc('month', CURRENT_DATE))::date);
  DELETE FROM payroll_runs WHERE property_id = ovh_id AND period_start >= (date_trunc('month', CURRENT_DATE))::date;

  INSERT INTO payroll_runs (property_id, period_start, period_end, run_date, status, processed_by) VALUES
    (ovh_id, (date_trunc('month', CURRENT_DATE))::date, (date_trunc('month', CURRENT_DATE) + interval '1 month - 1 day')::date, CURRENT_DATE, 'draft', uid_hr)
  RETURNING id INTO pr_id;

  -- Insert payroll lines for each employee (with LOP for absent days)
  INSERT INTO payroll_lines (payroll_id, employee_id, gross_pay, pf_deduction, esi_deduction, pt_deduction, tds_deduction, other_deductions, overtime_hours, overtime_amount)
  SELECT
    pr_id,
    e.id,
    -- Gross = base_salary - LOP deduction (daily rate × absent days)
    e.base_salary - (e.base_salary / 30 * CASE
      WHEN e.user_id = uid_hk THEN 3   -- 3 absent days
      WHEN e.user_id = uid_fd THEN 2    -- 2 absent days
      WHEN e.user_id = uid_maint THEN 1 -- 1 absent day
      ELSE 0
    END),
    LEAST(e.base_salary * 0.12, 1800),
    CASE WHEN e.base_salary <= 21000 THEN e.base_salary * 0.0075 ELSE 0 END,
    200,
    CASE WHEN e.base_salary > 25000 THEN e.base_salary * 0.10 ELSE 0 END,
    -- LOP amount stored in other_deductions
    e.base_salary / 30 * CASE
      WHEN e.user_id = uid_hk THEN 3
      WHEN e.user_id = uid_fd THEN 2
      WHEN e.user_id = uid_maint THEN 1
      ELSE 0
    END,
    CASE WHEN e.user_id = uid_maint THEN 4.0 ELSE 0 END,
    CASE WHEN e.user_id = uid_maint THEN 2000 ELSE 0 END
  FROM employees e
  JOIN departments d ON e.department_id = d.id
  WHERE d.property_id = ovh_id AND e.is_active = true;

  -- Update payroll totals
  UPDATE payroll_runs SET
    total_gross = (SELECT COALESCE(SUM(gross_pay), 0) FROM payroll_lines WHERE payroll_id = pr_id),
    total_deductions = (SELECT COALESCE(SUM(pf_deduction + esi_deduction + pt_deduction + tds_deduction + other_deductions), 0) FROM payroll_lines WHERE payroll_id = pr_id),
    total_net = (SELECT COALESCE(SUM(gross_pay - pf_deduction - esi_deduction - pt_deduction - tds_deduction - other_deductions), 0) FROM payroll_lines WHERE payroll_id = pr_id)
  WHERE id = pr_id;

  RAISE NOTICE '✓ Created payroll run with LOP deductions.';

  -- ==========================================================================
  -- 17. FINANCE — JOURNAL ENTRIES (revenue + expense)
  -- ==========================================================================
  -- Daily room revenue entries for last 7 days
  FOR i IN 0..6 LOOP
    INSERT INTO journal_entries (property_id, entry_date, description, created_by)
    VALUES (ovh_id, CURRENT_DATE - i, 'Daily room revenue — ' || (CURRENT_DATE - i)::text, uid_fin)
    RETURNING id INTO je_id;

    rnd := 45000 + random() * 35000;
    INSERT INTO journal_lines (journal_id, account_id, debit, credit, description)
    SELECT je_id, id, rnd, 0, 'Accounts receivable — room revenue'
    FROM chart_of_accounts WHERE account_code = '1010' AND property_id = ovh_id LIMIT 1;
    INSERT INTO journal_lines (journal_id, account_id, debit, credit, description)
    SELECT je_id, id, 0, rnd, 'Room revenue'
    FROM chart_of_accounts WHERE account_code = '4001' AND property_id = ovh_id LIMIT 1;
  END LOOP;

  -- Salary expense journal entry
  INSERT INTO journal_entries (property_id, entry_date, description, created_by)
  VALUES (ovh_id, CURRENT_DATE, 'Monthly salary provision — July 2026', uid_fin)
  RETURNING id INTO je_id;
  INSERT INTO journal_lines (journal_id, account_id, debit, credit, description)
  SELECT je_id, id, (SELECT total_gross FROM payroll_runs WHERE id = pr_id), 0, 'Salary expense'
  FROM chart_of_accounts WHERE account_code = '6001' AND property_id = ovh_id LIMIT 1;
  INSERT INTO journal_lines (journal_id, account_id, debit, credit, description)
  SELECT je_id, id, 0, (SELECT total_gross FROM payroll_runs WHERE id = pr_id), 'Salary payable'
  FROM chart_of_accounts WHERE account_code = '2020' AND property_id = ovh_id LIMIT 1;

  RAISE NOTICE '✓ Created journal entries for revenue + expenses.';

  RAISE NOTICE '══════════════════════════════════════════════════════';
  RAISE NOTICE '✓ WORKFLOW CERTIFICATION SEED COMPLETE';
  RAISE NOTICE '  Property: Viswa Grand Hotel (OVH)';
  RAISE NOTICE '  Rooms: 50 (5 floors × 10)';
  RAISE NOTICE '  Bookings: 25 (all statuses)';
  RAISE NOTICE '  HK Tasks: 17 (with SLA timers)';
  RAISE NOTICE '  Maint Tickets: 6 (2 rooms blocked)';
  RAISE NOTICE '  Guest Feedback: 16 entries';
  RAISE NOTICE '  Attendance: 30 days × 6 employees';
  RAISE NOTICE '  Payroll: 1 run with LOP deductions';
  RAISE NOTICE '══════════════════════════════════════════════════════';
END $$;
