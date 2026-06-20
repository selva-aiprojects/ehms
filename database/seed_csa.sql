-- ── Buildings & Floors for CSA ──────────────────────────────────
WITH prop AS (SELECT id FROM properties WHERE code='CSA')
INSERT INTO buildings (property_id, name, code, floors)
SELECT prop.id, 'Main Tower', 'A', 5 FROM prop
ON CONFLICT DO NOTHING;

WITH bld AS (SELECT b.id FROM buildings b JOIN properties p ON b.property_id=p.id WHERE p.code='CSA' AND b.code='A')
INSERT INTO floors (building_id, name, floor_number)
SELECT bld.id, 'Floor '||gs, gs FROM bld, generate_series(1,5) gs
ON CONFLICT DO NOTHING;

-- ── Units for CSA (25 units across 5 floors) ─────────────────────────
INSERT INTO units (floor_id, unit_type, unit_label, layout_type, sq_ft, max_occupancy, base_rate, status)
SELECT
  f.id,
  'suite'::unit_type,
  (f.floor_number * 100 + gs)::text,
  CASE WHEN (gs % 3 = 1) THEN 'deluxe' ELSE 'suite' END,
  CASE WHEN gs % 3 = 1 THEN 650 ELSE 450 END,
  CASE WHEN gs % 3 = 1 THEN 4 ELSE 2 END,
  CASE WHEN gs % 3 = 1 THEN 8500 ELSE 5400 END,
  CASE
    WHEN gs % 3 = 0 THEN 'occupied'::room_status
    WHEN gs % 5 = 0 THEN 'dirty'::room_status
    ELSE 'vacant'::room_status
  END
FROM floors f, generate_series(1, 5) gs
WHERE f.floor_number <= 5
AND EXISTS (SELECT 1 FROM buildings b JOIN properties p ON b.property_id=p.id WHERE b.id=f.building_id AND p.code='CSA')
ON CONFLICT DO NOTHING;

-- ── Bookings for CSA ────────────────────────────────────────────────
WITH
  csa_prop AS (SELECT id FROM properties WHERE code='CSA'),
  csa_units AS (
    SELECT u.id, u.base_rate, ROW_NUMBER() OVER(ORDER BY u.unit_label) AS rn
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
  (SELECT id FROM csa_units WHERE rn = (((gs-1) % 20) + 1)),
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
  NOW() - (months_ago || ' months')::interval + ((gs % 15) + (14 + gs % 10) || ' days')::interval, -- Extended stays (14-23 days)
  (gs % 2) + 1,
  0,
  (SELECT base_rate FROM csa_units WHERE rn = (((gs-1) % 20) + 1)) * (14 + gs % 10),
  CASE
    WHEN gs % 4 = 0 THEN 0
    ELSE (SELECT base_rate FROM csa_units WHERE rn = (((gs-1) % 20) + 1)) * (14 + gs % 10)
  END
FROM generate_series(1, 40) gs,
     LATERAL (SELECT gs % 6 AS months_ago) m
ON CONFLICT DO NOTHING;

-- ── Maintenance Tickets for CSA ───────────────────────────────────────
WITH csa_prop AS (SELECT id FROM properties WHERE code='CSA'),
     maint_user AS (SELECT id FROM users WHERE email='maintenance@ehms.demo')
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
  ('MT-CSA-001','corrective', 'AC unit malfunction – Unit 301',     'AC not cooling.', 'high',   'open',        'HVAC'),
  ('MT-CSA-002','corrective', 'Plumbing leak – Unit 105',           'Water dripping.', 'critical','in_progress', 'Plumbing'),
  ('MT-CSA-003','preventive', 'Elevator periodic maintenance',      'Service due.',    'medium', 'assigned',    'Elevator')
) AS t(ticket_number, ticket_type, title, description, priority, status, category)
ON CONFLICT DO NOTHING;

-- ── Guest requests for CSA (Housekeeping) ──────────────────────────────
WITH csa_prop AS (SELECT id FROM properties WHERE code='CSA'),
     csa_units AS (SELECT u.id FROM units u JOIN floors f ON u.floor_id=f.id JOIN buildings b ON f.building_id=b.id JOIN properties p ON b.property_id=p.id WHERE p.code='CSA' LIMIT 3),
     hk_user AS (SELECT id FROM users WHERE email='housekeeping@ehms.demo')
INSERT INTO housekeeping_tasks (unit_id, property_id, assigned_to, task_type, priority, status, notes)
SELECT
  du.id,
  (SELECT id FROM csa_prop),
  (SELECT id FROM hk_user),
  'guest_request',
  t.priority::ticket_priority,
  t.status::ticket_status,
  t.request
FROM csa_units du
CROSS JOIN (VALUES
  ('Extra towels needed', 'medium', 'open'),
  ('Late checkout requested', 'low', 'in_progress'),
  ('Airport transfer booking', 'high', 'open')
) AS t(request, priority, status)
LIMIT 3
ON CONFLICT DO NOTHING;
