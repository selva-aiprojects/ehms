-- ============================================================
-- seed_v9_complete_gaps.sql — Fill every remaining data gap
-- Run AFTER seed_v8_workflow_certification.sql
-- Targets: rate_plans, visitor_logs, checkin/checkout_sessions,
--          employee_bands, salary_structures, policy_documents,
--          competitor_rates, revenue_ai_rules/forecasts,
--          promotions, channel_sync_log, tax_filings (ICS),
--          holiday/overtime/attendance policies (CSA)
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- 1. RATE PLANS (required by revenue-ai, front-desk revenue views)
-- ──────────────────────────────────────────────────────────────
DO $$ BEGIN
  INSERT INTO rate_plans (property_id, unit_type, name, base_rate, is_active, effective_from, effective_to)
  SELECT p.id, t.utype::unit_type, t.name, t.rate, true, '2026-01-01'::date, '2027-12-31'::date
  FROM properties p
  CROSS JOIN (VALUES
    ('room',   'Standard Room', 4200),
    ('room',   'Deluxe Room',   5800),
    ('suite',  'Executive Suite', 8500),
    ('suite',  'Presidential Suite', 15000)
  ) AS t(utype, name, rate)
  WHERE p.code = 'OVH'
  ON CONFLICT DO NOTHING;

  INSERT INTO rate_plans (property_id, unit_type, name, base_rate, is_active, effective_from, effective_to)
  SELECT p.id, t.utype::unit_type, t.name, t.rate, true, '2026-01-01'::date, '2027-12-31'::date
  FROM properties p
  CROSS JOIN (VALUES
    ('apartment', 'Standard Suite',  5400),
    ('apartment', 'Deluxe Suite',    7200),
    ('suite',     'Premium Suite',   9800),
    ('suite',     'Penthouse',      16000)
  ) AS t(utype, name, rate)
  WHERE p.code = 'CSA'
  ON CONFLICT DO NOTHING;

  INSERT INTO rate_plans (property_id, unit_type, name, base_rate, is_active, effective_from, effective_to)
  SELECT p.id, t.utype::unit_type, t.name, t.rate, true, '2026-01-01'::date, '2027-12-31'::date
  FROM properties p
  CROSS JOIN (VALUES
    ('apartment', '1BHK Apartment',  18000),
    ('apartment', '2BHK Apartment',  28000),
    ('apartment', '3BHK Apartment',  42000)
  ) AS t(utype, name, rate)
  WHERE p.code = 'GWR'
  ON CONFLICT DO NOTHING;

  INSERT INTO rate_plans (property_id, unit_type, name, base_rate, is_active, effective_from, effective_to)
  SELECT p.id, t.utype::unit_type, t.name, t.rate, true, '2026-01-01'::date, '2027-12-31'::date
  FROM properties p
  CROSS JOIN (VALUES
    ('desk',          'Hot Desk',           500),
    ('desk',          'Fixed Desk',        1200),
    ('cabin',         'Private Cabin',     3500),
    ('meeting_room',  'Meeting Room',      5000)
  ) AS t(utype, name, rate)
  WHERE p.code = 'ICS'
  ON CONFLICT DO NOTHING;
END $$;

-- ──────────────────────────────────────────────────────────────
-- 2. EMPLOYEE BANDS & SALARY STRUCTURES (required by HR module)
-- ──────────────────────────────────────────────────────────────
DO $$ BEGIN
  INSERT INTO employee_bands (name, code, description, is_active)
  VALUES
    ('Entry Level',     'BAND-A', 'Junior staff — housekeeping, front desk assistants', true),
    ('Associate',       'BAND-B', 'Experienced associates — senior housekeeping, front desk leads', true),
    ('Specialist',      'BAND-C', 'Specialized roles — maintenance technicians, HR coordinators', true),
    ('Senior Specialist','BAND-D','Senior specialists — shift supervisors, finance analysts', true),
    ('Manager',         'BAND-E', 'Department managers — HK manager, maintenance manager', true),
    ('Senior Manager',  'BAND-F', 'Senior management — property manager, finance manager', true)
  ON CONFLICT (code) DO NOTHING;

  INSERT INTO salary_structures (band_id, name, base_percentage, hra_percentage, pf_applicable, is_active)
  SELECT b.id, b.name || ' Structure', 
    CASE b.code
      WHEN 'BAND-A' THEN 55.00 WHEN 'BAND-B' THEN 52.00 WHEN 'BAND-C' THEN 50.00
      WHEN 'BAND-D' THEN 48.00 WHEN 'BAND-E' THEN 45.00 WHEN 'BAND-F' THEN 42.00
    END,
    CASE b.code
      WHEN 'BAND-A' THEN 20.00 WHEN 'BAND-B' THEN 22.00 WHEN 'BAND-C' THEN 25.00
      WHEN 'BAND-D' THEN 27.00 WHEN 'BAND-E' THEN 30.00 WHEN 'BAND-F' THEN 32.00
    END,
    true, true
  FROM employee_bands b
  WHERE NOT EXISTS (SELECT 1 FROM salary_structures s WHERE s.band_id = b.id)
  ON CONFLICT DO NOTHING;
END $$;

-- ──────────────────────────────────────────────────────────────
-- 3. POLICY DOCUMENTS (required by HR policy page)
-- ──────────────────────────────────────────────────────────────
DO $$ BEGIN
  INSERT INTO policy_documents (property_id, category, title, description, department, version, effective_date, is_active, uploaded_by)
  SELECT p.id, t.cat, t.title, t.descr, t.dept, t.ver, '2026-01-01'::date, true,
    (SELECT id FROM users WHERE email = 'hr@ehms.demo' LIMIT 1)
  FROM properties p
  CROSS JOIN (VALUES
    ('policy',     'Leave Policy',          'Annual leave entitlements, sick leave, casual leave rules',                'all',          '2.0'),
    ('policy',     'Attendance Policy',     'Punch-in requirements, late marking rules, overtime policy',               'all',          '1.5'),
    ('handbook',   'Employee Handbook',     'Onboarding guide, code of conduct, workplace culture',                    'all',          '3.0'),
    ('compliance', 'POSHE Policy',          'Prevention of Sexual Harassment at Workplace — mandatory annual training', 'all',          '1.0'),
    ('training',   'Fire Safety Training',  'Annual fire evacuation drill schedule and procedures',                     'housekeeping', '1.2'),
    ('form',       'Increment Request Form', 'Standard form for salary revision requests — manager + HR sign-off',      'all',          '1.0')
  ) AS t(cat, title, descr, dept, ver)
  WHERE p.code IN ('OVH', 'CSA')
  ON CONFLICT DO NOTHING;
END $$;

-- ──────────────────────────────────────────────────────────────
-- 4. VISITOR LOGS (required by workplace dashboard)
-- ──────────────────────────────────────────────────────────────
DO $$ BEGIN
  INSERT INTO visitor_logs (property_id, host_employee_id, visitor_name, visitor_phone, purpose, check_in, check_out, badge_issued)
  SELECT p.id,
    (SELECT id FROM users WHERE email = 'frontdesk@ehms.demo' LIMIT 1),
    v.name, v.phone, v.purpose,
    NOW() - (v.days_ago || ' days')::interval + (v.hour || ' hours')::interval,
    CASE WHEN v.stayed THEN NOW() - (v.days_ago || ' days')::interval + ((v.hour + v.dur) || ' hours')::interval ELSE NULL END,
    true
  FROM properties p
  CROSS JOIN (VALUES
    ('Ankit Jain',    '+91-9876500001', 'Client meeting',        0, 10, true,  2),
    ('Sneha Patel',   '+91-9876500002', 'Interview — Developer', 0, 12, true,  1),
    ('Rahul Verma',   '+91-9876500003', 'Vendor delivery',       0, 14, false, 0),
    ('Meera Singh',   '+91-9876500004', 'Investor walkthrough',  1, 11, true,  3),
    ('Deepak Nair',   '+91-9876500005', 'IT support visit',      1, 15, false, 0),
    ('Kavitha Reddy', '+91-9876500006', 'Client demo',           2, 10, true,  2),
    ('Sanjay Gupta',  '+91-9876500007', 'Audit — quarterly',     2, 13, true,  4),
    ('Priyanka Das',  '+91-9876500008', 'Legal consultation',    3, 11, true,  1),
    ('Arvind Menon',  '+91-9876500009', 'Contractor site visit', 3, 16, false, 0),
    ('Nisha Kumari',  '+91-9876500010', 'Guest of member',       4, 10, true,  2)
  ) AS v(name, phone, purpose, days_ago, hour, stayed, dur)
  WHERE p.code = 'ICS'
  ON CONFLICT DO NOTHING;
END $$;

-- ──────────────────────────────────────────────────────────────
-- 5. CHECKIN / CHECKOUT SESSIONS (required by front-desk self-service views)
-- ──────────────────────────────────────────────────────────────
DO $$ BEGIN
  INSERT INTO checkin_sessions (property_id, booking_id, guest_id, status, id_type, id_number, id_verified, completed_at)
  SELECT b.property_id, b.id, b.guest_id,
    CASE WHEN b.status = 'checked_in' THEN 'completed' ELSE 'expired' END,
    'aadhaar', 'XXXX-XXXX-' || LPAD(floor(random()*9999)::int::text, 4, '0'),
    true,
    b.check_in
  FROM bookings b
  WHERE b.status = 'checked_in'
    AND b.property_id IN (SELECT id FROM properties WHERE code IN ('OVH', 'CSA'))
  ON CONFLICT DO NOTHING;

  INSERT INTO checkout_sessions (property_id, booking_id, status, total_charges, total_payments, balance_due, payment_method, payment_status, completed_at)
  SELECT b.property_id, b.id, 'completed',
    COALESCE(b.total_amount, 0),
    COALESCE(b.paid_amount, 0),
    GREATEST(COALESCE(b.total_amount, 0) - COALESCE(b.paid_amount, 0), 0),
    'card', 'paid',
    b.check_out
  FROM bookings b
  WHERE b.status = 'checked_out'
    AND b.property_id IN (SELECT id FROM properties WHERE code IN ('OVH', 'CSA'))
    AND b.check_out IS NOT NULL
  ON CONFLICT DO NOTHING;
END $$;

-- ──────────────────────────────────────────────────────────────
-- 6. COMPETITOR RATES (required by revenue-ai actions page)
-- ──────────────────────────────────────────────────────────────
DO $$ BEGIN
  INSERT INTO competitor_rates (property_id, competitor_name, competitor_rating, distance_km, room_type, rate, source, scraped_at)
  SELECT p.id, c.name, c.rating, c.dist, c.rtype, c.rate, 'OTA Aggregator', NOW() - ((random() * 7)::int || ' days')::interval
  FROM properties p
  CROSS JOIN (VALUES
    ('Taj Connemara',       4.7, 2.3, 'standard',  5200),
    ('Taj Connemara',       4.7, 2.3, 'deluxe',    7800),
    ('The Leela Palace',    4.8, 5.1, 'standard',  6500),
    ('The Leela Palace',    4.8, 5.1, 'suite',    12000),
    ('ITC Grand Chola',     4.6, 3.8, 'standard',  4800),
    ('ITC Grand Chola',     4.6, 3.8, 'deluxe',    7200),
    ('Hyatt Regency',       4.5, 4.2, 'standard',  4500),
    ('Hyatt Regency',       4.5, 4.2, 'suite',    10500),
    ('Radisson BLU',        4.3, 1.8, 'standard',  3800),
    ('Radisson BLU',        4.3, 1.8, 'deluxe',    5600),
    ('Ramada Plaza',        4.1, 2.9, 'standard',  3200),
    ('Ramada Plaza',        4.1, 2.9, 'suite',     7000)
  ) AS c(name, rating, dist, rtype, rate)
  WHERE p.code IN ('OVH', 'CSA')
  ON CONFLICT DO NOTHING;
END $$;

-- ──────────────────────────────────────────────────────────────
-- 7. REVENUE AI RULES (required by revenue-ai settings page)
-- ──────────────────────────────────────────────────────────────
DO $$ BEGIN
  INSERT INTO revenue_ai_rules (property_id, rule_type, name, config, is_active, priority)
  SELECT p.id, r.rtype, r.name, r.cfg::jsonb, true, r.pri
  FROM properties p
  CROSS JOIN (VALUES
    ('occupancy_threshold', 'Low Occupancy Discount',    '{"min_occupancy":30,"discount_pct":15}',  1),
    ('occupancy_threshold', 'High Occupancy Premium',    '{"min_occupancy":80,"surge_pct":20}',     2),
    ('day_of_week',         'Weekend Surge',             '{"days":["sat","sun"],"surge_pct":12}',   3),
    ('seasonal',            'Peak Season Premium',       '{"months":[10,11,12],"surge_pct":25}',    4),
    ('seasonal',            'Monsoon Discount',          '{"months":[6,7,8],"discount_pct":10}',    5),
    ('competitor',          'Match Competitor Average',  '{"strategy":"match_avg","tolerance":5}',  6),
    ('length_of_stay',      'Extended Stay Discount',    '{"min_nights":7,"discount_pct":12}',      7),
    ('event',               'Festival Surge',            '{"events":["diwali","pongal"],"surge_pct":30}', 8)
  ) AS r(rtype, name, cfg, pri)
  WHERE p.code IN ('OVH', 'CSA')
  ON CONFLICT DO NOTHING;
END $$;

-- ──────────────────────────────────────────────────────────────
-- 8. REVENUE AI FORECASTS (required by revenue-ai forecast chart)
-- ──────────────────────────────────────────────────────────────
DO $$ BEGIN
  INSERT INTO revenue_ai_forecasts (property_id, forecast_date, predicted_occupancy, predicted_adr, predicted_revpar, confidence)
  SELECT p.id,
    (CURRENT_DATE + d.day::int)::date,
    -- Occupancy: sinusoidal pattern around 65-85%
    (65 + 20 * sin(d.day * 0.15) + (random() * 8 - 4))::numeric(5,2),
    -- ADR: base + seasonal variation
    (4200 + 800 * sin(d.day * 0.12) + (random() * 500 - 250))::numeric(10,2),
    -- RevPAR = occupancy * ADR / 100
    ((65 + 20 * sin(d.day * 0.15)) * (4200 + 800 * sin(d.day * 0.12)) / 100)::numeric(10,2),
    -- Confidence: 70-95%
    (75 + 20 * sin(d.day * 0.08))::int
  FROM properties p
  CROSS JOIN generate_series(0, 44) AS d(day)
  WHERE p.code = 'OVH'
  ON CONFLICT (property_id, forecast_date) DO NOTHING;

  INSERT INTO revenue_ai_forecasts (property_id, forecast_date, predicted_occupancy, predicted_adr, predicted_revpar, confidence)
  SELECT p.id,
    (CURRENT_DATE + d.day::int)::date,
    (60 + 18 * sin(d.day * 0.14) + (random() * 6 - 3))::numeric(5,2),
    (5400 + 900 * sin(d.day * 0.11) + (random() * 600 - 300))::numeric(10,2),
    ((60 + 18 * sin(d.day * 0.14)) * (5400 + 900 * sin(d.day * 0.11)) / 100)::numeric(10,2),
    (72 + 18 * sin(d.day * 0.09))::int
  FROM properties p
  CROSS JOIN generate_series(0, 44) AS d(day)
  WHERE p.code = 'CSA'
  ON CONFLICT (property_id, forecast_date) DO NOTHING;
END $$;

-- ──────────────────────────────────────────────────────────────
-- 9. PROMOTIONS (required by front-desk promotions view)
-- ──────────────────────────────────────────────────────────────
DO $$ BEGIN
  INSERT INTO promotions (property_id, name, code, discount_pct, start_date, end_date, is_active)
  SELECT p.id, t.name, t.code, t.disc, '2026-01-01'::date, '2026-12-31'::date, true
  FROM properties p
  CROSS JOIN (VALUES
    ('Early Bird Offer',      'EARLY15', 15.00),
    ('Long Stay Discount',    'LONGSTAY', 12.00),
    ('Weekend Getaway',       'WKND20',  20.00),
    ('Corporate Rate',        'CORP10',  10.00),
    ('Festival Special',      'FEST25',  25.00),
    ('Referral Bonus',        'REF10',   10.00)
  ) AS t(name, code, disc)
  WHERE p.code IN ('OVH', 'CSA')
  ON CONFLICT (code) DO NOTHING;
END $$;

-- ──────────────────────────────────────────────────────────────
-- 10. CHANNEL SYNC LOG (required by channel manager page)
-- ──────────────────────────────────────────────────────────────
DO $$ BEGIN
  INSERT INTO channel_sync_log (property_id, channel, action, response_status, duration_ms, synced_at)
  SELECT p.id, ch.channel, ch.action, ch.status, ch.dur,
    NOW() - (ch.days_ago || ' days')::interval - (ch.hours_ago || ' hours')::interval
  FROM properties p
  CROSS JOIN (VALUES
    ('booking.com',  'push_availability',  200, 340, 0, 2),
    ('booking.com',  'push_rate',          200, 280, 0, 5),
    ('booking.com',  'booking_received',   201, 520, 0, 8),
    ('expedia',      'push_availability',  200, 410, 1, 3),
    ('expedia',      'push_rate',          200, 350, 1, 6),
    ('expedia',      'booking_received',   201, 490, 1, 12),
    ('agoda',        'push_availability',  200, 380, 2, 4),
    ('agoda',        'push_rate',          200, 290, 2, 7),
    ('goibibo',      'push_availability',  200, 440, 3, 1),
    ('goibibo',      'push_rate',          502, 850, 3, 9),
    ('makemytrip',   'push_availability',  200, 320, 0, 6),
    ('makemytrip',   'booking_received',   201, 460, 0, 11)
  ) AS ch(channel, action, status, dur, days_ago, hours_ago)
  WHERE p.code IN ('OVH', 'CSA')
  ON CONFLICT DO NOTHING;
END $$;

-- ──────────────────────────────────────────────────────────────
-- 11. TAX FILINGS for ICS (workplace has no filings yet)
-- ──────────────────────────────────────────────────────────────
DO $$ BEGIN
  INSERT INTO tax_filings (property_id, tax_type, period_start, period_end, due_date, status, total_liability, total_paid, filed_by)
  SELECT p.id, t.tax_type, t.pstart, t.pend, t.pend, t.status, t.liability, t.paid,
    (SELECT id FROM users WHERE email = 'finance@ehms.demo' LIMIT 1)
  FROM properties p
  CROSS JOIN (VALUES
    ('gst',  '2026-01-01'::date, '2026-03-31'::date, 'filed', 185000, 185000),
    ('gst',  '2026-04-01'::date, '2026-06-30'::date, 'filed', 210000, 210000),
    ('tds',  '2026-04-01'::date, '2026-06-30'::date, 'filed', 45000,  45000),
    ('gst',  '2026-07-01'::date, '2026-09-30'::date, 'pending', 195000, 0)
  ) AS t(tax_type, pstart, pend, status, liability, paid)
  WHERE p.code = 'ICS'
  ON CONFLICT DO NOTHING;
END $$;

-- ──────────────────────────────────────────────────────────────
-- 12. HOLIDAY, OVERTIME & ATTENDANCE POLICIES for CSA
-- ──────────────────────────────────────────────────────────────
DO $$ BEGIN
  INSERT INTO holiday_calendar (property_id, name, date, type, applicable_to, is_active)
  SELECT p.id, h.name, h.date, h.htype, 'all', true
  FROM properties p
  CROSS JOIN (VALUES
    ('Republic Day',          '2026-01-26'::date, 'public'),
    ('Maha Shivaratri',      '2026-02-26'::date, 'public'),
    ('Holi',                 '2026-03-10'::date, 'public'),
    ('Good Friday',          '2026-04-03'::date, 'public'),
    ('May Day',              '2026-05-01'::date, 'public'),
    ('Independence Day',     '2026-08-15'::date, 'public'),
    ('Ganesh Chaturthi',     '2026-08-26'::date, 'public'),
    ('Gandhi Jayanti',       '2026-10-02'::date, 'public'),
    ('Dussehra',             '2026-10-19'::date, 'public'),
    ('Diwali',               '2026-11-07'::date, 'public'),
    ('Christmas',            '2026-12-25'::date, 'public')
  ) AS h(name, date, htype)
  WHERE p.code = 'CSA'
  ON CONFLICT (property_id, date) DO NOTHING;

  INSERT INTO overtime_policies (property_id, name, multiplier, min_hours, max_hours_per_day, applicable_shifts, is_active)
  SELECT p.id, o.name, o.mult, o.min_h, o.max_h, 'all', true
  FROM properties p
  CROSS JOIN (VALUES
    ('Weekday OT — CSA',  1.5, 1, 4),
    ('Weekend OT — CSA',  2.0, 1, 4),
    ('Holiday OT — CSA',  2.5, 1, 3)
  ) AS o(name, mult, min_h, max_h)
  WHERE p.code = 'CSA'
  ON CONFLICT DO NOTHING;

  INSERT INTO attendance_policies (property_id, name, late_threshold, half_day_threshold, early_exit_threshold, grace_period, is_active)
  SELECT p.id, 'Standard — CSA', 15, 120, 15, 5, true
  FROM properties p
  WHERE p.code = 'CSA'
  ON CONFLICT DO NOTHING;
END $$;

-- ──────────────────────────────────────────────────────────────
-- 13. BANK RECONCILIATION for CSA (OVH already has data from seed_v8)
-- ──────────────────────────────────────────────────────────────
DO $$ BEGIN
  INSERT INTO bank_reconciliation (property_id, bank_ref, transaction_date, amount, description, status)
  SELECT p.id, t.bank_ref, t.tdate, t.amount, t.descr, t.status
  FROM properties p
  CROSS JOIN (VALUES
    ('HDFC-CSA-2026-001', '2026-06-01'::date, 325000, 'Booking.com June settlement',     'matched'),
    ('HDFC-CSA-2026-002', '2026-06-05'::date, 180000, 'Expedia June settlement',          'matched'),
    ('HDFC-CSA-2026-003', '2026-06-10'::date,  95000, 'Direct corporate payment',          'matched'),
    ('HDFC-CSA-2026-004', '2026-06-15'::date, 142000, 'Goibibo settlement — disputed',     'unmatched')
  ) AS t(bank_ref, tdate, amount, descr, status)
  WHERE p.code = 'CSA'
  ON CONFLICT DO NOTHING;
END $$;

-- ──────────────────────────────────────────────────────────────
-- 14. VENDOR BILLS for CSA (OVH already has data)
-- ──────────────────────────────────────────────────────────────
DO $$ BEGIN
  INSERT INTO vendor_bills (property_id, vendor_id, bill_number, bill_date, due_date, grand_total, status)
  SELECT p.id,
    (SELECT id FROM vendors WHERE property_id = p.id AND name LIKE '%Elevator%' LIMIT 1),
    'VB-CSA-' || LPAD(gs::text, 4, '0'),
    (CURRENT_DATE - (gs * 30 || ' days')::interval)::date,
    (CURRENT_DATE - ((gs * 30 - 15) || ' days')::interval)::date,
    (80000 + gs * 15000)::decimal(12,2),
    CASE WHEN gs <= 2 THEN 'paid' WHEN gs = 3 THEN 'pending' ELSE 'overdue' END
  FROM properties p, generate_series(1, 5) gs
  WHERE p.code = 'CSA'
    AND EXISTS (SELECT 1 FROM vendors WHERE property_id = p.id)
  ON CONFLICT DO NOTHING;
END $$;

-- ──────────────────────────────────────────────────────────────
-- 15. BUDGET ENTRIES for CSA (OVH already has some from seed_v5)
-- ──────────────────────────────────────────────────────────────
DO $$ BEGIN
  INSERT INTO budget_entries (budget_head_id, fiscal_year_id, period_month, budget_amount, actual_amount, notes)
  SELECT bh.id, fy.id, m.m,
    CASE bh.code
      WHEN 'SAL' THEN 650000 WHEN 'UTL' THEN 120000 WHEN 'MAINT' THEN 85000
      WHEN 'MKTG' THEN 150000 WHEN 'FOOD' THEN 200000 WHEN 'HOUSE' THEN 100000
      ELSE 50000
    END,
    CASE bh.code
      WHEN 'SAL' THEN 635000 WHEN 'UTL' THEN 115000 WHEN 'MAINT' THEN 92000
      WHEN 'MKTG' THEN 130000 WHEN 'FOOD' THEN 185000 WHEN 'HOUSE' THEN 98000
      ELSE 48000
    END,
    bh.name || ' — ' || TO_CHAR(TO_DATE(m.m::text, 'MM'), 'Mon') || ' 2026'
  FROM budget_heads bh
  CROSS JOIN fiscal_years fy
  CROSS JOIN generate_series(1, 6) m(m)
  WHERE fy.name = 'FY 2026-27'
    AND NOT EXISTS (
      SELECT 1 FROM budget_entries be
      WHERE be.budget_head_id = bh.id AND be.fiscal_year_id = fy.id AND be.period_month = m.m
    )
  ON CONFLICT DO NOTHING;
END $$;

-- ──────────────────────────────────────────────────────────────
-- 16. FISCAL YEARS (required by accounts settings page)
-- ──────────────────────────────────────────────────────────────
DO $$ BEGIN
  INSERT INTO fiscal_years (property_id, name, start_date, end_date)
  SELECT p.id, fy.name, fy.sdate, fy.edate
  FROM properties p
  CROSS JOIN (VALUES
    ('FY 2025-26', '2025-04-01'::date, '2026-03-31'::date),
    ('FY 2026-27', '2026-04-01'::date, '2027-03-31'::date)
  ) AS fy(name, sdate, edate)
  WHERE p.code IN ('OVH', 'CSA', 'GWR', 'ICS')
  ON CONFLICT DO NOTHING;
END $$;

-- ──────────────────────────────────────────────────────────────
-- 17. COST CENTERS (required by cost center reports)
-- ──────────────────────────────────────────────────────────────
DO $$ BEGIN
  INSERT INTO cost_centers (property_id, code, name, is_active)
  SELECT p.id, t.code, t.name, true
  FROM properties p
  CROSS JOIN (VALUES
    ('CC-FRONT', 'Front Office'),
    ('CC-HK',    'Housekeeping'),
    ('CC-MAINT', 'Maintenance'),
    ('CC-FNB',   'F&B / Restaurant'),
    ('CC-HR',    'Human Resources'),
    ('CC-FIN',   'Finance & Accounts'),
    ('CC-MKTG',  'Marketing')
  ) AS t(code, name)
  WHERE p.code IN ('OVH', 'CSA')
  ON CONFLICT (property_id, code) DO NOTHING;
END $$;

-- ──────────────────────────────────────────────────────────────
-- Done — print summary
-- ──────────────────────────────────────────────────────────────
DO $$ BEGIN
  RAISE NOTICE 'seed_v9_complete_gaps.sql completed.';
  RAISE NOTICE '  rate_plans:          % rows', (SELECT count(*) FROM rate_plans);
  RAISE NOTICE '  employee_bands:      % rows', (SELECT count(*) FROM employee_bands);
  RAISE NOTICE '  salary_structures:   % rows', (SELECT count(*) FROM salary_structures);
  RAISE NOTICE '  policy_documents:    % rows', (SELECT count(*) FROM policy_documents);
  RAISE NOTICE '  visitor_logs:        % rows', (SELECT count(*) FROM visitor_logs);
  RAISE NOTICE '  checkin_sessions:    % rows', (SELECT count(*) FROM checkin_sessions);
  RAISE NOTICE '  checkout_sessions:   % rows', (SELECT count(*) FROM checkout_sessions);
  RAISE NOTICE '  competitor_rates:    % rows', (SELECT count(*) FROM competitor_rates);
  RAISE NOTICE '  revenue_ai_rules:    % rows', (SELECT count(*) FROM revenue_ai_rules);
  RAISE NOTICE '  revenue_ai_forecasts:% rows', (SELECT count(*) FROM revenue_ai_forecasts);
  RAISE NOTICE '  promotions:          % rows', (SELECT count(*) FROM promotions);
  RAISE NOTICE '  channel_sync_log:    % rows', (SELECT count(*) FROM channel_sync_log);
  RAISE NOTICE '  tax_filings:         % rows', (SELECT count(*) FROM tax_filings);
  RAISE NOTICE '  bank_reconciliation: % rows', (SELECT count(*) FROM bank_reconciliation);
  RAISE NOTICE '  budget_entries:      % rows', (SELECT count(*) FROM budget_entries);
END $$;
