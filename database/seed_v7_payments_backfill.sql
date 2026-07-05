-- ============================================================================
-- eHMS Seed v7 — Payments Backfill + Guest Feedbacks + Live Activity
-- Run AFTER seed_v5_yearly.sql
-- Purpose: Populate the payments table so dashboard revenue KPIs show real data
-- ============================================================================
SET search_path TO viswa, public;

DO $$
DECLARE
  prop_id UUID;
  uid_finance UUID;
  uid_admin UUID;
  uid_hk UUID;
  uid_maint UUID;
  uid_frontdesk UUID;
  uid_csa_fn UUID;
  uid_gwr_fn UUID;
  total_backfilled INT := 0;
  total_feedbacks INT := 0;
BEGIN

  -- ── 1. COLLECT USER IDs ────────────────────────────────────────────────────
  SELECT id INTO uid_finance    FROM users WHERE email = 'finance@ehms.demo';
  SELECT id INTO uid_admin      FROM users WHERE email = 'admin@ehms.demo';
  SELECT id INTO uid_hk         FROM users WHERE email = 'housekeeping@ehms.demo';
  SELECT id INTO uid_maint      FROM users WHERE email = 'maintenance@ehms.demo';
  SELECT id INTO uid_frontdesk  FROM users WHERE email = 'frontdesk@ehms.demo';
  SELECT id INTO uid_csa_fn     FROM users WHERE email = 'finance.csa@ehms.demo';
  SELECT id INTO uid_gwr_fn     FROM users WHERE email = 'finance.gwr@ehms.demo';

  RAISE NOTICE 'Starting seed_v7: payments backfill, feedbacks, and live activity data';

  -- ── 2. BACKFILL PAYMENTS FROM CHECKED-OUT BOOKINGS ─────────────────────────
  -- For every booking that is checked_out or checked_in with paid_amount > 0
  -- but has NO row in the payments table, insert a completed payment.
  INSERT INTO payments (
    property_id, booking_id, invoice_id, payment_method,
    amount, currency, status, payment_date, created_at
  )
  SELECT
    b.property_id,
    b.id                 AS booking_id,
    inv.id               AS invoice_id,
    -- Cycle through realistic payment methods
    CASE (EXTRACT(epoch FROM b.check_in)::int % 4)
      WHEN 0 THEN 'card'
      WHEN 1 THEN 'upi'
      WHEN 2 THEN 'cash'
      ELSE 'bank_transfer'
    END                  AS payment_method,
    b.paid_amount        AS amount,
    'INR'                AS currency,
    'completed'          AS status,
    -- Payment date = check_in + 30 min (realistic: paid at arrival)
    b.check_in + interval '30 minutes' AS payment_date,
    b.check_in + interval '30 minutes' AS created_at
  FROM bookings b
  LEFT JOIN invoices inv ON inv.booking_id = b.id
  WHERE b.status IN ('checked_out', 'checked_in')
    AND b.paid_amount > 0
    -- Only insert where payment doesn't already exist for this booking
    AND NOT EXISTS (
      SELECT 1 FROM payments p2
      WHERE p2.booking_id = b.id AND p2.status = 'completed'
    )
  ON CONFLICT DO NOTHING;

  GET DIAGNOSTICS total_backfilled = ROW_COUNT;
  RAISE NOTICE 'Backfilled % payment rows from bookings.', total_backfilled;

  -- ── 3. BACKFILL PAYMENTS FROM WORKPLACE BOOKINGS ────────────────────────────
  INSERT INTO payments (
    property_id, booking_id, invoice_id, payment_method,
    amount, currency, status, payment_date, created_at
  )
  SELECT
    wb.property_id,
    NULL                 AS booking_id,
    inv.id               AS invoice_id,
    'upi'                AS payment_method,
    COALESCE(wb.total_amount, 500)  AS amount,
    'INR'                AS currency,
    'completed'          AS status,
    wb.start_time        AS payment_date,
    wb.start_time        AS created_at
  FROM workplace_bookings wb
  LEFT JOIN invoices inv ON inv.guest_id = wb.member_id
    AND inv.grand_total = COALESCE(wb.total_amount, 500)
  WHERE wb.status = 'checked_in'
    AND COALESCE(wb.total_amount, 0) > 0
    AND NOT EXISTS (
      SELECT 1 FROM payments p2
      WHERE p2.invoice_id = inv.id AND p2.status = 'completed'
    )
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Backfilled workplace booking payments.';

  -- ── 4. BACKFILL PAYMENTS FROM RENT INVOICES (GWR) ───────────────────────────
  INSERT INTO payments (
    property_id, booking_id, invoice_id, payment_method,
    amount, currency, status, payment_date, created_at
  )
  SELECT
    la.property_id,
    NULL             AS booking_id,
    NULL             AS invoice_id,
    'bank_transfer'  AS payment_method,
    ri.paid_amount   AS amount,
    'INR'            AS currency,
    'completed'      AS status,
    COALESCE(ri.paid_at, ri.due_date)::timestamptz AS payment_date,
    COALESCE(ri.paid_at, ri.due_date)::timestamptz AS created_at
  FROM rent_invoices ri
  JOIN lease_agreements la ON la.id = ri.lease_id
  WHERE ri.status = 'paid'
    AND ri.paid_amount > 0
    AND NOT EXISTS (
      SELECT 1 FROM payments p2
      WHERE p2.property_id = la.property_id
        AND p2.payment_date::date = COALESCE(ri.paid_at, ri.due_date)::date
        AND p2.amount = ri.paid_amount
        AND p2.payment_method = 'bank_transfer'
    )
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Backfilled rent invoice payments for GWR.';

  -- ── 5. CREATE INVOICES FOR BOOKINGS MISSING THEM ────────────────────────────
  -- Some bookings from seed_v5 don't have invoice rows — create them
  INSERT INTO invoices (
    property_id, booking_id, guest_id, invoice_number,
    invoice_date, due_date, status, subtotal, tax_total, grand_total, paid_total, currency
  )
  SELECT
    b.property_id,
    b.id,
    b.guest_id,
    'INV-' || UPPER(SUBSTRING(p.code, 1, 3)) || '-' || SUBSTRING(b.id::text, 1, 8),
    b.check_in::date,
    b.check_out::date + 3,
    CASE
      WHEN b.status = 'checked_out' THEN 'paid'::invoice_status
      WHEN b.status = 'checked_in'  THEN 'sent'::invoice_status
      ELSE 'draft'::invoice_status
    END,
    b.total_amount * 0.82,
    b.total_amount * 0.18,
    b.total_amount,
    b.paid_amount,
    'INR'
  FROM bookings b
  JOIN properties p ON p.id = b.property_id
  WHERE b.total_amount > 0
    AND NOT EXISTS (
      SELECT 1 FROM invoices i WHERE i.booking_id = b.id
    )
  ON CONFLICT (invoice_number) DO NOTHING;

  RAISE NOTICE 'Created missing invoice rows for bookings.';

  -- ── 6. GUEST FEEDBACKS — 12 months of ratings ───────────────────────────────
  -- Insert guest feedbacks for a representative sample of completed stays
  INSERT INTO guest_feedbacks (
    property_id, guest_id, booking_id, rating, department, comments,
    created_at
  )
  SELECT
    b.property_id,
    b.guest_id,
    b.id,
    -- Mostly positive ratings (4-5 stars), some 3-star based on day of month
    CASE (EXTRACT(day FROM b.check_out)::int % 10)
      WHEN 0 THEN 3
      WHEN 1 THEN 3
      WHEN 2 THEN 4
      WHEN 3 THEN 5
      WHEN 4 THEN 5
      WHEN 5 THEN 4
      WHEN 6 THEN 5
      WHEN 7 THEN 4
      WHEN 8 THEN 5
      ELSE 4
    END AS rating,
    CASE (EXTRACT(month FROM b.check_out)::int % 5)
      WHEN 0 THEN 'Housekeeping'
      WHEN 1 THEN 'Front Desk'
      WHEN 2 THEN 'Maintenance'
      WHEN 3 THEN 'Food & Beverage'
      ELSE 'Overall'
    END AS department,
    CASE (EXTRACT(day FROM b.check_out)::int % 8)
      WHEN 0 THEN 'Excellent stay! The room was very clean and staff was helpful.'
      WHEN 1 THEN 'Great service overall. Will definitely come back.'
      WHEN 2 THEN 'Good experience. Minor issues with AC but quickly resolved.'
      WHEN 3 THEN 'Wonderful hospitality. Highly recommend this property.'
      WHEN 4 THEN 'Room was clean and comfortable. Breakfast was good.'
      WHEN 5 THEN 'Staff was very courteous and professional.'
      WHEN 6 THEN 'Satisfactory stay. Could improve the check-in process.'
      ELSE 'Loved the location and amenities. Perfect for business travel.'
    END AS comments,
    b.check_out + interval '2 hours' AS created_at
  FROM bookings b
  WHERE b.status = 'checked_out'
    AND b.check_out >= CURRENT_DATE - interval '12 months'
    -- Sample ~60% of stays using random (append-only)
    AND random() < 0.6
    AND NOT EXISTS (
      SELECT 1 FROM guest_feedbacks gf WHERE gf.booking_id = b.id
    )
  ON CONFLICT DO NOTHING;

  GET DIAGNOSTICS total_feedbacks = ROW_COUNT;
  RAISE NOTICE 'Created % guest feedback rows.', total_feedbacks;

  -- ── 7. TODAY'S LIVE ACTIVITY — Check-ins, HK Tasks, Maintenance ─────────────
  -- Ensure some bookings show as "checked_in" today for a live feel
  UPDATE bookings
  SET status = 'checked_in'
  WHERE status = 'confirmed'
    AND check_in::date = CURRENT_DATE
    AND random() < 0.5;

  -- Ensure a few bookings are checking in today (set check_in to today if close)
  UPDATE bookings
  SET status = 'confirmed',
      check_in = CURRENT_DATE::timestamp + interval '14:00:00',
      check_out = CURRENT_DATE::timestamp + interval '3 days' + interval '12:00:00'
  WHERE status = 'pending'
    AND check_in BETWEEN CURRENT_DATE AND CURRENT_DATE + 2
    AND random() < 0.3
  ;

  RAISE NOTICE 'Updated booking statuses for live activity.';

  -- ── 8. OPEN HOUSEKEEPING TASKS FOR TODAY ────────────────────────────────────
  -- Make sure there are open HK tasks today for the "Outstanding Issues" widget
  WITH ovh AS (SELECT id FROM properties WHERE code = 'OVH'),
       room_sample AS (
         SELECT u.id AS unit_id
         FROM units u
         JOIN floors f ON f.id = u.floor_id
         JOIN buildings b ON b.id = f.building_id
         JOIN properties p ON p.id = b.property_id
         WHERE p.code = 'OVH' AND u.unit_type = 'room'
         ORDER BY u.unit_label
         LIMIT 5
       )
  INSERT INTO housekeeping_tasks (
    property_id, unit_id, task_type, priority, status, assigned_to,
    notes, scheduled_at, created_at
  )
  SELECT
    (SELECT id FROM ovh),
    rs.unit_id,
    t.task_type,
    t.priority::ticket_priority,
    'open'::ticket_status,
    uid_hk,
    t.notes,
    CURRENT_DATE::timestamp + interval '8:00:00',
    CURRENT_TIMESTAMP
  FROM room_sample rs
  CROSS JOIN (VALUES
    ('turnaround',    'high',   'Room turnover — guest checked out today'),
    ('stayover_tidy', 'medium', 'Stayover tidy for arriving guest'),
    ('deep_clean',    'high',   'Deep clean requested by guest'),
    ('inspection',    'low',    'Pre-arrival inspection'),
    ('deep_clean',    'medium', 'Monthly deep clean schedule')
  ) AS t(task_type, priority, notes)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Seeded open housekeeping tasks for today.';

  -- ── 9. OPEN MAINTENANCE TICKETS FOR TODAY ───────────────────────────────────
  WITH ovh_id AS (SELECT id FROM properties WHERE code = 'OVH'),
       csa_id AS (SELECT id FROM properties WHERE code = 'CSA')
  INSERT INTO maintenance_tickets (
    property_id, ticket_number, ticket_type, title, description,
    category, priority, status, reported_by, assigned_to, created_at
  )
  VALUES
    ((SELECT id FROM ovh_id), 'MT-LIVE-001', 'corrective',
     'AC not cooling — Room 205',
     'Guest reported AC temperature stuck above 28°C',
     'HVAC', 'critical'::ticket_priority, 'open'::ticket_status, uid_frontdesk, uid_maint, CURRENT_TIMESTAMP - interval '2 hours'),
    ((SELECT id FROM ovh_id), 'MT-LIVE-002', 'corrective',
     'Bathroom tap dripping — Room 312',
     'Continuous drip from hot water tap',
     'plumbing', 'high'::ticket_priority, 'in_progress'::ticket_status, uid_frontdesk, uid_maint, CURRENT_TIMESTAMP - interval '4 hours'),
    ((SELECT id FROM ovh_id), 'MT-LIVE-003', 'corrective',
     'Corridor light out — Floor 3',
     'Three ceiling lights not working on Floor 3 east wing',
     'electrical', 'medium'::ticket_priority, 'open'::ticket_status, uid_hk, uid_maint, CURRENT_TIMESTAMP - interval '1 hour'),
    ((SELECT id FROM csa_id), 'MT-LIVE-004', 'corrective',
     'Kitchen appliance malfunction — Suite 102',
     'Microwave not heating, guest reported this morning',
     'general', 'high'::ticket_priority, 'open'::ticket_status, uid_maint, uid_maint, CURRENT_TIMESTAMP - interval '3 hours')
  ON CONFLICT (ticket_number) DO NOTHING;

  RAISE NOTICE 'Seeded live maintenance tickets.';

  -- ── 10. PENDING GUEST REQUESTS ───────────────────────────────────────────────
  -- Add some open guest requests for the "Other" issues category
  INSERT INTO guest_requests (
    property_id, booking_id, request_type, description, status, created_at
  )
  SELECT
    b.property_id,
    b.id,
    t.request_type,
    t.description,
    'open',
    CURRENT_TIMESTAMP - (random() * interval '3 hours')
  ) AS t(request_type, description) ON true
  WHERE b.status = 'checked_in'
    AND NOT EXISTS (
      SELECT 1 FROM guest_requests gr WHERE gr.booking_id = b.id AND gr.request_type = t.request_type
    )
  LIMIT 8
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Seeded pending guest requests.';

  -- ── 11. PENDING VENDOR BILLS ─────────────────────────────────────────────────
  -- Ensure there are vendor bills in pending/overdue status for the Vendor Issues widget
  WITH ovh_id AS (SELECT id FROM properties WHERE code = 'OVH'),
       vid_hvac AS (SELECT id FROM vendors WHERE company_name ILIKE '%hvac%' LIMIT 1),
       vid_pest AS (SELECT id FROM vendors WHERE company_name ILIKE '%pest%' LIMIT 1),
       vid_laundry AS (SELECT id FROM vendors WHERE company_name ILIKE '%laundry%' LIMIT 1),
       uid_fn AS (SELECT id FROM users WHERE email = 'finance@ehms.demo')
  INSERT INTO vendor_bills (
    property_id, vendor_id, bill_number, bill_date, due_date,
    category, subtotal, tax_total, grand_total, paid_total, status, notes, created_by, created_at
  )
  VALUES
    ((SELECT id FROM ovh_id), (SELECT id FROM vid_hvac),
     'INV-LIVE-HVAC-001', CURRENT_DATE - 5, CURRENT_DATE - 1,
     'service', 65000, 11700, 76700, 0, 'approved',
     'HVAC quarterly maintenance — overdue for payment',
     (SELECT id FROM uid_fn), CURRENT_DATE - 5),
    ((SELECT id FROM ovh_id), (SELECT id FROM vid_pest),
     'INV-LIVE-PEST-001', CURRENT_DATE - 2, CURRENT_DATE + 5,
     'service', 18000, 3240, 21240, 0, 'pending',
     'Monthly pest control service',
     (SELECT id FROM uid_fn), CURRENT_DATE - 2),
    ((SELECT id FROM ovh_id), (SELECT id FROM vid_laundry),
     'INV-LIVE-LND-001', CURRENT_DATE, CURRENT_DATE + 15,
     'service', 42000, 7560, 49560, 0, 'pending',
     'Weekly laundry service — current month',
     (SELECT id FROM uid_fn), CURRENT_DATE)
  ON CONFLICT (bill_number) DO NOTHING;

  RAISE NOTICE 'Seeded pending vendor bills for Outstanding Issues widget.';

  RAISE NOTICE '=== seed_v7 complete ===';
  RAISE NOTICE 'Summary: backfilled payments, % feedbacks created, live HK/maint tasks added', total_feedbacks;

END $$;
