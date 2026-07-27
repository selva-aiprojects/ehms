-- ── Buildings & Floors for CSA ──────────────────────────────────
WITH prop AS (SELECT id FROM properties WHERE code='CSA')
INSERT INTO buildings (property_id, name, code, floors)
SELECT prop.id, 'Main Tower', 'A', 5 FROM prop
ON CONFLICT DO NOTHING;

WITH bld AS (SELECT b.id FROM buildings b JOIN properties p ON b.property_id=p.id WHERE p.code='CSA' AND b.code='A')
INSERT INTO floors (building_id, name, floor_number)
SELECT bld.id, 'Floor '||gs, gs FROM bld, generate_series(1,5) gs
ON CONFLICT DO NOTHING;

-- ── Units for CSA: Parent Apartments + Child Rooms (Hierarchy) ──
-- Step 1: Insert parent apartments (type='apartment', no parent)
WITH csa_floor AS (
  SELECT f.id AS floor_id, f.floor_number
  FROM floors f
  JOIN buildings b ON f.building_id = b.id
  JOIN properties p ON b.property_id = p.id
  WHERE p.code = 'CSA'
)
INSERT INTO units (floor_id, unit_type, unit_label, layout_type, sq_ft, max_occupancy, base_rate, status, attributes)
SELECT
  cf.floor_id,
  'apartment'::unit_type,
  (cf.floor_number * 100 + ap)::text,
  CASE
    WHEN ap = 1 THEN '2BHK'
    WHEN ap = 2 THEN '1BHK'
    ELSE 'Studio'
  END,
  CASE
    WHEN ap = 1 THEN 950
    WHEN ap = 2 THEN 650
    ELSE 400
  END,
  CASE
    WHEN ap = 1 THEN 5
    WHEN ap = 2 THEN 3
    ELSE 2
  END,
  CASE
    WHEN ap = 1 THEN 12000
    WHEN ap = 2 THEN 8500
    ELSE 5500
  END,
  'vacant'::room_status,
  CASE
    WHEN ap = 1 THEN '{"ac": true, "kitchen": true, "balcony": true, "bedrooms": 2}'::jsonb
    WHEN ap = 2 THEN '{"ac": true, "kitchen": true, "balcony": false, "bedrooms": 1}'::jsonb
    ELSE '{"ac": true, "kitchen": false, "balcony": false, "bedrooms": 0}'::jsonb
  END
FROM csa_floor cf
CROSS JOIN generate_series(1, 2) ap
WHERE cf.floor_number <= 5
ON CONFLICT DO NOTHING;

-- Step 2: Insert child rooms (type='room', parent_unit_id = parent apartment)
WITH parent_apts AS (
  SELECT u.id AS parent_id, u.floor_id, u.unit_label AS apt_label,
         ROW_NUMBER() OVER(ORDER BY u.unit_label) AS rn
  FROM units u
  JOIN floors f ON u.floor_id = f.id
  JOIN buildings b ON f.building_id = b.id
  JOIN properties p ON b.property_id = p.id
  WHERE p.code = 'CSA' AND u.unit_type = 'apartment'
)
INSERT INTO units (floor_id, unit_type, unit_label, layout_type, sq_ft, max_occupancy, base_rate, status, parent_unit_id, attributes)
SELECT
  pa.floor_id,
  'room'::unit_type,
  pa.apt_label || '-' || chr(64 + cr.child_num),
  CASE
    WHEN cr.child_num = 1 THEN 'Master Bedroom'
    ELSE 'Bedroom ' || cr.child_num
  END,
  CASE
    WHEN cr.child_num = 1 THEN 350
    ELSE 250
  END,
  CASE
    WHEN cr.child_num = 1 THEN 2
    ELSE 1
  END,
  CASE
    WHEN cr.child_num = 1 THEN 5500
    ELSE 3500
  END,
  'vacant'::room_status,
  pa.parent_id,
  CASE
    WHEN cr.child_num = 1 THEN '{"ac": true, "bed_type": "queen", "attached_bath": true}'::jsonb
    ELSE '{"ac": true, "bed_type": "single", "attached_bath": false}'::jsonb
  END
FROM parent_apts pa
CROSS JOIN generate_series(1, 2) cr(child_num)
ON CONFLICT DO NOTHING;

-- ── Bookings for CSA (on child rooms and whole apartments) ──────
WITH
  csa_prop AS (SELECT id FROM properties WHERE code='CSA'),
  csa_units AS (
    SELECT u.id, u.unit_type, u.base_rate,
           ROW_NUMBER() OVER(PARTITION BY u.unit_type ORDER BY u.unit_label) AS rn
    FROM units u
    JOIN floors f ON u.floor_id=f.id
    JOIN buildings b ON f.building_id=b.id
    JOIN properties p ON b.property_id=p.id
    WHERE p.code='CSA'
  ),
  guest_list AS (
    SELECT id, ROW_NUMBER() OVER(ORDER BY created_at) AS rn FROM guest_profiles
  )
INSERT INTO bookings (property_id, unit_id, guest_id, booking_model, status, source, check_in, check_out, adults, children, total_amount, paid_amount)
SELECT
  (SELECT id FROM csa_prop),
  (SELECT id FROM csa_units WHERE unit_type = 'room' AND rn = (((gs-1) % 10) + 1)),
  (SELECT id FROM guest_list  WHERE rn = (((gs-1) % 20) + 1)),
  'nightly'::booking_model,
  CASE
    WHEN gs % 4 = 0 THEN 'pending'
    WHEN gs % 3 = 0 THEN 'checked_in'
    WHEN months_ago > 0 THEN 'checked_out'
    ELSE 'confirmed'
  END::booking_status,
  (ARRAY['direct','booking.com','corporate'])[(gs % 3)+1],
  NOW() - (months_ago || ' months')::interval + ((gs % 15) || ' days')::interval,
  NOW() - (months_ago || ' months')::interval + ((gs % 15) + (14 + gs % 10) || ' days')::interval,
  (gs % 2) + 1,
  0,
  (SELECT base_rate FROM csa_units WHERE unit_type = 'room' AND rn = (((gs-1) % 10) + 1)) * (14 + gs % 10),
  CASE
    WHEN gs % 4 = 0 THEN 0
    ELSE (SELECT base_rate FROM csa_units WHERE unit_type = 'room' AND rn = (((gs-1) % 10) + 1)) * (14 + gs % 10)
  END
FROM generate_series(1, 30) gs,
     LATERAL (SELECT gs % 6 AS months_ago) m
ON CONFLICT DO NOTHING;

-- ── Maintenance Tickets for CSA ───────────────────────────────────────
WITH csa_prop AS (SELECT id FROM properties WHERE code='CSA'),
     maint_user AS (SELECT id FROM users WHERE email='maintenance@ehms.demo'),
     csa_rooms AS (
       SELECT u.id FROM units u
       JOIN floors f ON u.floor_id=f.id
       JOIN buildings b ON f.building_id=b.id
       JOIN properties p ON b.property_id=p.id
       WHERE p.code='CSA' AND u.unit_type='room'
       ORDER BY u.unit_label LIMIT 3
     )
INSERT INTO maintenance_tickets (property_id, ticket_number, ticket_type, title, description, priority, status, category, reported_by)
SELECT
  (SELECT id FROM csa_prop),
  t.ticket_number, t.ticket_type::text,
  t.title, t.description,
  t.priority::ticket_priority,
  t.status::ticket_status,
  t.category,
  (SELECT id FROM maint_user)
FROM (VALUES
  ('MT-CSA-001','corrective', 'AC unit malfunction – Room 101-A',  'AC not cooling.', 'high',   'open',        'HVAC'),
  ('MT-CSA-002','corrective', 'Plumbing leak – Room 202-B',        'Water dripping.', 'critical','in_progress', 'Plumbing'),
  ('MT-CSA-003','preventive', 'Elevator periodic maintenance',     'Service due.',    'medium', 'assigned',    'Elevator')
) AS t(ticket_number, ticket_type, title, description, priority, status, category)
ON CONFLICT DO NOTHING;

-- ── Guest requests for CSA (Housekeeping) ──────────────────────────────
WITH csa_prop AS (SELECT id FROM properties WHERE code='CSA'),
     csa_rooms AS (
       SELECT u.id FROM units u
       JOIN floors f ON u.floor_id=f.id
       JOIN buildings b ON f.building_id=b.id
       JOIN properties p ON b.property_id=p.id
       WHERE p.code='CSA' AND u.unit_type='room'
       ORDER BY u.unit_label LIMIT 3
     ),
     hk_user AS (SELECT id FROM users WHERE email='housekeeping@ehms.demo')
INSERT INTO housekeeping_tasks (unit_id, property_id, assigned_to, task_type, priority, status, notes)
SELECT
  cr.id,
  (SELECT id FROM csa_prop),
  (SELECT id FROM hk_user),
  'guest_request',
  t.priority::ticket_priority,
  t.status::ticket_status,
  t.request
FROM csa_rooms cr
CROSS JOIN (VALUES
  ('Extra towels needed', 'medium', 'open'),
  ('Late checkout requested', 'low', 'in_progress'),
  ('Airport transfer booking', 'high', 'open')
) AS t(request, priority, status)
LIMIT 3
ON CONFLICT DO NOTHING;
