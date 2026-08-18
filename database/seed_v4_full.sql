-- ============================================================================
-- eHMS Comprehensive Seed Data — v4 (Full Workflow Demo)
--   Seeded for ALL 4 properties across ALL modules
--   Each property gets: HR, HK, FD, Maint, Finance, Vendors, Inventory
-- ============================================================================
-- Run AFTER: all 022 migration files (001..022) + previous seed files
-- Usage: psql -f seed_v4_full.sql
-- ============================================================================

DO $$
DECLARE
  -- Property IDs
  ovh_id UUID; csa_id UUID; gwr_id UUID; ics_id UUID;
  -- Employee User IDs
  uid_super_admin UUID; uid_admin UUID; uid_frontdesk UUID;
  uid_hk UUID; uid_maint UUID; uid_hr UUID; uid_finance UUID; uid_exec UUID;
  uid_csa_mgr UUID; uid_csa_fd UUID; uid_csa_hk UUID; uid_csa_mt UUID; uid_csa_hr UUID; uid_csa_fn UUID;
  uid_gwr_mgr UUID; uid_gwr_fd UUID; uid_gwr_hk UUID; uid_gwr_mt UUID; uid_gwr_hr UUID; uid_gwr_fn UUID;
  uid_ics_mgr UUID; uid_ics_fd UUID; uid_ics_hk UUID; uid_ics_mt UUID; uid_ics_hr UUID; uid_ics_fn UUID;
  -- Guest Profile IDs (use first 12)
  gid1 UUID; gid2 UUID; gid3 UUID; gid4 UUID; gid5 UUID; gid6 UUID;
  gid7 UUID; gid8 UUID; gid9 UUID; gid10 UUID; gid11 UUID; gid12 UUID;
  -- Department IDs per property
  dept_ovh_fd UUID; dept_ovh_hk UUID; dept_ovh_mt UUID; dept_ovh_fn UUID; dept_ovh_hr UUID; dept_ovh_fb UUID;
  dept_csa_fd UUID; dept_csa_hk UUID; dept_csa_mt UUID; dept_csa_fn UUID; dept_csa_hr UUID;
  dept_gwr_fd UUID; dept_gwr_hk UUID; dept_gwr_mt UUID; dept_gwr_fn UUID; dept_gwr_hr UUID;
  dept_ics_fd UUID; dept_ics_hk UUID; dept_ics_mt UUID; dept_ics_fn UUID; dept_ics_hr UUID;
  -- Vendor IDs
  vid_laundry UUID; vid_hvac UUID; vid_pest UUID; vid_plumbing UUID; vid_elevator UUID; vid_catering UUID;
  -- Inventory
  inv_cat_cleaning UUID; inv_cat_linen UUID; inv_cat_amenities UUID; inv_cat_maint UUID; inv_cat_fnb UUID;
  wh_main UUID; wh_hk UUID; wh_eng UUID;
  -- Fiscal / Accounts
  fy_2425 UUID; fy_2526 UUID; fy_2627 UUID;
  -- Units
  unit_ovh_1 UUID; unit_ovh_2 UUID; unit_csa_1 UUID; unit_gwr_1 UUID; unit_gwr_2 UUID;

  -- Counters
  rnd real;
  day_offset int;
  booking_id UUID;
  ticket_id UUID;
  task_id UUID;
  invoice_id UUID;
  je_id UUID;
  inv_item_id UUID;
  trans_id UUID;
BEGIN

  -- ==========================================================================
  -- 1. LOOKUP EXISTING IDS
  -- ==========================================================================
  SELECT id INTO ovh_id FROM properties WHERE code = 'OVH';
  SELECT id INTO csa_id FROM properties WHERE code = 'CSA';
  SELECT id INTO gwr_id FROM properties WHERE code = 'GWR';
  SELECT id INTO ics_id FROM properties WHERE code = 'ICS';

  -- User lookups
  SELECT id INTO uid_super_admin FROM users WHERE email = 'superadmin@ehms.demo';
  SELECT id INTO uid_admin FROM users WHERE email = 'admin@ehms.demo';
  SELECT id INTO uid_frontdesk FROM users WHERE email = 'frontdesk@ehms.demo';
  SELECT id INTO uid_hk FROM users WHERE email = 'housekeeping@ehms.demo';
  SELECT id INTO uid_maint FROM users WHERE email = 'maintenance@ehms.demo';
  SELECT id INTO uid_hr FROM users WHERE email = 'hr@ehms.demo';
  SELECT id INTO uid_finance FROM users WHERE email = 'finance@ehms.demo';
  SELECT id INTO uid_exec FROM users WHERE email = 'executive@ehms.demo';

  SELECT id INTO uid_csa_mgr FROM users WHERE email = 'manager.csa@ehms.demo';
  SELECT id INTO uid_csa_fd FROM users WHERE email = 'frontdesk.csa@ehms.demo';
  SELECT id INTO uid_csa_hk FROM users WHERE email = 'housekeeping.csa@ehms.demo';
  SELECT id INTO uid_csa_mt FROM users WHERE email = 'maintenance.csa@ehms.demo';
  SELECT id INTO uid_csa_hr FROM users WHERE email = 'hr.csa@ehms.demo';
  SELECT id INTO uid_csa_fn FROM users WHERE email = 'finance.csa@ehms.demo';

  SELECT id INTO uid_gwr_mgr FROM users WHERE email = 'manager.gwr@ehms.demo';
  SELECT id INTO uid_gwr_fd FROM users WHERE email = 'frontdesk.gwr@ehms.demo';
  SELECT id INTO uid_gwr_hk FROM users WHERE email = 'housekeeping.gwr@ehms.demo';
  SELECT id INTO uid_gwr_mt FROM users WHERE email = 'maintenance.gwr@ehms.demo';
  SELECT id INTO uid_gwr_hr FROM users WHERE email = 'hr.gwr@ehms.demo';
  SELECT id INTO uid_gwr_fn FROM users WHERE email = 'finance.gwr@ehms.demo';

  SELECT id INTO uid_ics_mgr FROM users WHERE email = 'manager.ics@ehms.demo';
  SELECT id INTO uid_ics_fd FROM users WHERE email = 'frontdesk.ics@ehms.demo';
  SELECT id INTO uid_ics_hk FROM users WHERE email = 'housekeeping.ics@ehms.demo';
  SELECT id INTO uid_ics_mt FROM users WHERE email = 'maintenance.ics@ehms.demo';
  SELECT id INTO uid_ics_hr FROM users WHERE email = 'hr.ics@ehms.demo';
  SELECT id INTO uid_ics_fn FROM users WHERE email = 'finance.ics@ehms.demo';

  -- Guest lookups (first 12)
  SELECT id INTO gid1 FROM guest_profiles ORDER BY created_at ASC LIMIT 1 OFFSET 0;
  SELECT id INTO gid2 FROM guest_profiles ORDER BY created_at ASC LIMIT 1 OFFSET 1;
  SELECT id INTO gid3 FROM guest_profiles ORDER BY created_at ASC LIMIT 1 OFFSET 2;
  SELECT id INTO gid4 FROM guest_profiles ORDER BY created_at ASC LIMIT 1 OFFSET 3;
  SELECT id INTO gid5 FROM guest_profiles ORDER BY created_at ASC LIMIT 1 OFFSET 4;
  SELECT id INTO gid6 FROM guest_profiles ORDER BY created_at ASC LIMIT 1 OFFSET 5;
  SELECT id INTO gid7 FROM guest_profiles ORDER BY created_at ASC LIMIT 1 OFFSET 6;
  SELECT id INTO gid8 FROM guest_profiles ORDER BY created_at ASC LIMIT 1 OFFSET 7;
  SELECT id INTO gid9 FROM guest_profiles ORDER BY created_at ASC LIMIT 1 OFFSET 8;
  SELECT id INTO gid10 FROM guest_profiles ORDER BY created_at ASC LIMIT 1 OFFSET 9;
  SELECT id INTO gid11 FROM guest_profiles ORDER BY created_at ASC LIMIT 1 OFFSET 10;
  SELECT id INTO gid12 FROM guest_profiles ORDER BY created_at ASC LIMIT 1 OFFSET 11;

  -- Vendor lookups
  SELECT id INTO vid_laundry FROM vendors WHERE company_name ILIKE '%laundry%' LIMIT 1;
  SELECT id INTO vid_hvac FROM vendors WHERE company_name ILIKE '%hvac%' LIMIT 1;
  SELECT id INTO vid_pest FROM vendors WHERE company_name ILIKE '%pest%' LIMIT 1;
  SELECT id INTO vid_plumbing FROM vendors WHERE company_name ILIKE '%plumbing%' LIMIT 1;
  SELECT id INTO vid_elevator FROM vendors WHERE company_name ILIKE '%elevator%' LIMIT 1;
  SELECT id INTO vid_catering FROM vendors WHERE company_name ILIKE '%catering%' LIMIT 1;

  -- Department lookups per property
  -- OVH
  SELECT id INTO dept_ovh_fd FROM departments WHERE code = 'FD' AND property_id = ovh_id LIMIT 1;
  SELECT id INTO dept_ovh_hk FROM departments WHERE code = 'HK' AND property_id = ovh_id LIMIT 1;
  SELECT id INTO dept_ovh_mt FROM departments WHERE code = 'MT' AND property_id = ovh_id LIMIT 1;
  SELECT id INTO dept_ovh_fn FROM departments WHERE code = 'FN' AND property_id = ovh_id LIMIT 1;
  SELECT id INTO dept_ovh_hr FROM departments WHERE code = 'HR' AND property_id = ovh_id LIMIT 1;
  SELECT id INTO dept_ovh_fb FROM departments WHERE code = 'FB' AND property_id = ovh_id LIMIT 1;

  SELECT id INTO dept_csa_fd FROM departments WHERE code = 'FD' AND property_id = csa_id LIMIT 1;
  SELECT id INTO dept_csa_hk FROM departments WHERE code = 'HK' AND property_id = csa_id LIMIT 1;
  SELECT id INTO dept_csa_mt FROM departments WHERE code = 'MT' AND property_id = csa_id LIMIT 1;
  SELECT id INTO dept_csa_fn FROM departments WHERE code = 'FN' AND property_id = csa_id LIMIT 1;
  SELECT id INTO dept_csa_hr FROM departments WHERE code = 'HR' AND property_id = csa_id LIMIT 1;

  SELECT id INTO dept_gwr_fd FROM departments WHERE code = 'FD' AND property_id = gwr_id LIMIT 1;
  SELECT id INTO dept_gwr_hk FROM departments WHERE code = 'HK' AND property_id = gwr_id LIMIT 1;
  SELECT id INTO dept_gwr_mt FROM departments WHERE code = 'MT' AND property_id = gwr_id LIMIT 1;
  SELECT id INTO dept_gwr_fn FROM departments WHERE code = 'FN' AND property_id = gwr_id LIMIT 1;
  SELECT id INTO dept_gwr_hr FROM departments WHERE code = 'HR' AND property_id = gwr_id LIMIT 1;

  SELECT id INTO dept_ics_fd FROM departments WHERE code = 'FD' AND property_id = ics_id LIMIT 1;
  SELECT id INTO dept_ics_hk FROM departments WHERE code = 'HK' AND property_id = ics_id LIMIT 1;
  SELECT id INTO dept_ics_mt FROM departments WHERE code = 'MT' AND property_id = ics_id LIMIT 1;
  SELECT id INTO dept_ics_fn FROM departments WHERE code = 'FN' AND property_id = ics_id LIMIT 1;
  SELECT id INTO dept_ics_hr FROM departments WHERE code = 'HR' AND property_id = ics_id LIMIT 1;

  SELECT u.id INTO unit_ovh_1 FROM units u JOIN floors f ON f.id = u.floor_id JOIN buildings b ON b.id = f.building_id WHERE b.property_id = ovh_id LIMIT 1 OFFSET 0;
  SELECT u.id INTO unit_ovh_2 FROM units u JOIN floors f ON f.id = u.floor_id JOIN buildings b ON b.id = f.building_id WHERE b.property_id = ovh_id LIMIT 1 OFFSET 1;
  SELECT u.id INTO unit_csa_1 FROM units u JOIN floors f ON f.id = u.floor_id JOIN buildings b ON b.id = f.building_id WHERE b.property_id = csa_id LIMIT 1 OFFSET 0;
  SELECT u.id INTO unit_gwr_1 FROM units u JOIN floors f ON f.id = u.floor_id JOIN buildings b ON b.id = f.building_id WHERE b.property_id = gwr_id LIMIT 1 OFFSET 0;
  SELECT u.id INTO unit_gwr_2 FROM units u JOIN floors f ON f.id = u.floor_id JOIN buildings b ON b.id = f.building_id WHERE b.property_id = gwr_id LIMIT 1 OFFSET 1;

  -- ==========================================================================
  -- 2. CLEAR EXISTING SEED DATA (for tables we'll re-seed)
  -- ==========================================================================
  DELETE FROM journal_lines;
  DELETE FROM journal_entries;
  DELETE FROM inventory_transactions;
  DELETE FROM inventory_items;
  DELETE FROM inventory_categories;
  DELETE FROM warehouses;
  DELETE FROM chart_of_accounts;
  DELETE FROM budget_entries;
  DELETE FROM budget_heads;
  DELETE FROM bill_payments;
  DELETE FROM bill_line_items;
  DELETE FROM vendor_bills;
  DELETE FROM tax_filings;
  DELETE FROM cost_centers;
  DELETE FROM fiscal_years;
  DELETE FROM maintenance_approvals;
  DELETE FROM maintenance_time_entries;
  DELETE FROM maintenance_ticket_parts;
  DELETE FROM maintenance_tickets;
  DELETE FROM preventive_schedules;
  DELETE FROM amc_contracts;
  DELETE FROM housekeeping_inspections;
  DELETE FROM linen_items;
  DELETE FROM linen_transactions;
  DELETE FROM linen_batches;
  DELETE FROM housekeeping_checklists;
  DELETE FROM guest_feedbacks;
  DELETE FROM f_and_b_order_items;
  DELETE FROM f_and_b_orders;
  DELETE FROM guest_requests;
  DELETE FROM parking_allocations;
  DELETE FROM grn_lines;
  DELETE FROM goods_received_notes;
  DELETE FROM purchase_order_lines;
  DELETE FROM purchase_orders;
  DELETE FROM depreciation_schedule;
  DELETE FROM fixed_assets;
  DELETE FROM system_audit_events;
  DELETE FROM timesheets;
  DELETE FROM leave_requests;
  DELETE FROM compliance_records;
  -- Keep existing bookings, invoices, payments, leases etc.
  RAISE NOTICE 'Cleared seed tables.';

  -- ==========================================================================
  -- 3. CHART OF ACCOUNTS (all 4 properties)
  -- ==========================================================================
  -- OVH Chart of Accounts
  INSERT INTO chart_of_accounts (account_code, account_name, account_type, sub_type, property_id, is_active, description, opening_balance) VALUES
    ('1001', 'Cash on Hand', 'asset', 'current_asset', ovh_id, true, 'Petty cash float', 50000),
    ('1002', 'Operating Account', 'asset', 'bank', ovh_id, true, 'HDFC Current Account', 2500000),
    ('1010', 'Accounts Receivable', 'asset', 'receivable', ovh_id, true, 'Guest folio receivables', 450000),
    ('1020', 'Inventory - Supplies', 'asset', 'current_asset', ovh_id, true, 'Housekeeping & F&B supplies', 350000),
    ('1100', 'Fixed Assets - Building', 'asset', 'fixed_asset', ovh_id, true, 'Hotel building at cost', 50000000),
    ('1101', 'Fixed Assets - Furniture', 'asset', 'fixed_asset', ovh_id, true, 'FF&E at cost', 15000000),
    ('1102', 'Fixed Assets - Equipment', 'asset', 'fixed_asset', ovh_id, true, 'Kitchen/Laundry/IT equipment', 8000000),
    ('1103', 'Accum. Depreciation', 'asset', 'contra_asset', ovh_id, true, 'Accumulated depreciation', -12000000),
    ('2001', 'Accounts Payable', 'liability', 'current_liability', ovh_id, true, 'Vendor payables', 320000),
    ('2010', 'GST Payable', 'liability', 'current_liability', ovh_id, true, 'GST collected from guests', 185000),
    ('2020', 'Accrued Salaries', 'liability', 'current_liability', ovh_id, true, 'Salary payable', 1200000),
    ('2030', 'Security Deposits', 'liability', 'non_current_liability', ovh_id, true, 'Guest security deposits', 500000),
    ('3001', 'Retained Earnings', 'equity', 'retained_earnings', ovh_id, true, 'Retained earnings', 25000000),
    ('3002', 'Current Year Earnings', 'equity', 'current_earnings', ovh_id, true, 'CY profit/loss', 0),
    ('4001', 'Room Revenue', 'income', 'operating_revenue', ovh_id, true, 'Room night revenue', 0),
    ('4002', 'F&B Revenue', 'income', 'operating_revenue', ovh_id, true, 'Food & beverage sales', 0),
    ('4003', 'Other Revenue', 'income', 'operating_revenue', ovh_id, true, 'Laundry, parking, misc', 0),
    ('5001', 'COGS - F&B', 'expense', 'cogs', ovh_id, true, 'Food & beverage cost', 0),
    ('6001', 'Salaries & Wages', 'expense', 'operating_expense', ovh_id, true, 'Employee salaries', 0),
    ('6002', 'Housekeeping Supplies', 'expense', 'operating_expense', ovh_id, true, 'Cleaning & linen', 0),
    ('6003', 'Maintenance Expenses', 'expense', 'operating_expense', ovh_id, true, 'Repairs & maintenance', 0),
    ('6004', 'Utilities', 'expense', 'operating_expense', ovh_id, true, 'Electricity, water, gas', 0),
    ('6005', 'Marketing', 'expense', 'operating_expense', ovh_id, true, 'Advertising & promotions', 0),
    ('6006', 'Administrative', 'expense', 'operating_expense', ovh_id, true, 'Office & admin costs', 0),
    ('6007', 'Depreciation', 'expense', 'non_operating_expense', ovh_id, true, 'Depreciation charge', 0);
  RAISE NOTICE 'Seeded OVH Chart of Accounts.';

  -- CSA Chart of Accounts
  INSERT INTO chart_of_accounts (account_code, account_name, account_type, sub_type, property_id, is_active, description, opening_balance) VALUES
    ('1001', 'Cash on Hand', 'asset', 'current_asset', csa_id, true, 'Petty cash', 25000),
    ('1002', 'Operating Account', 'asset', 'bank', csa_id, true, 'ICICI Current Account', 1800000),
    ('1010', 'Accounts Receivable', 'asset', 'receivable', csa_id, true, 'Guest receivables', 350000),
    ('1100', 'Fixed Assets - Building', 'asset', 'fixed_asset', csa_id, true, 'Apartment building', 35000000),
    ('1101', 'Furniture & Fixtures', 'asset', 'fixed_asset', csa_id, true, 'Apartment FF&E', 8000000),
    ('2001', 'Accounts Payable', 'liability', 'current_liability', csa_id, true, 'Vendor payables', 250000),
    ('3001', 'Retained Earnings', 'equity', 'retained_earnings', csa_id, true, 'Retained earnings', 15000000),
    ('4001', 'Room Revenue', 'income', 'operating_revenue', csa_id, true, 'Suite night revenue', 0),
    ('6001', 'Salaries', 'expense', 'operating_expense', csa_id, true, 'Staff salaries', 0),
    ('6002', 'Supplies', 'expense', 'operating_expense', csa_id, true, 'Cleaning & amenities', 0),
    ('6003', 'Maintenance', 'expense', 'operating_expense', csa_id, true, 'Repairs & upkeep', 0),
    ('6004', 'Utilities', 'expense', 'operating_expense', csa_id, true, 'Electricity, water', 0);
  RAISE NOTICE 'Seeded CSA Chart of Accounts.';

  -- GWR Chart of Accounts
  INSERT INTO chart_of_accounts (account_code, account_name, account_type, sub_type, property_id, is_active, description, opening_balance) VALUES
    ('1001', 'Operating Account', 'asset', 'bank', gwr_id, true, 'Bank account', 500000),
    ('1010', 'Rent Receivable', 'asset', 'receivable', gwr_id, true, 'Tenant rent receivables', 120000),
    ('1100', 'Building Asset', 'asset', 'fixed_asset', gwr_id, true, 'Rental property', 20000000),
    ('2001', 'Security Deposits', 'liability', 'current_liability', gwr_id, true, 'Tenant deposits', 300000),
    ('3001', 'Retained Earnings', 'equity', 'retained_earnings', gwr_id, true, 'Retained', 8000000),
    ('4001', 'Rental Income', 'income', 'operating_revenue', gwr_id, true, 'Monthly rent', 0),
    ('6001', 'Property Management', 'expense', 'operating_expense', gwr_id, true, 'Mgmt fees', 0),
    ('6002', 'Maintenance', 'expense', 'operating_expense', gwr_id, true, 'Repairs', 0),
    ('6003', 'Utilities', 'expense', 'operating_expense', gwr_id, true, 'Common utilities', 0);
  RAISE NOTICE 'Seeded GWR Chart of Accounts.';

  -- ICS Chart of Accounts
  INSERT INTO chart_of_accounts (account_code, account_name, account_type, sub_type, property_id, is_active, description, opening_balance) VALUES
    ('1001', 'Operating Account', 'asset', 'bank', ics_id, true, 'Bank account', 750000),
    ('1010', 'Membership Receivable', 'asset', 'receivable', ics_id, true, 'Membership dues', 200000),
    ('1100', 'Leasehold Improvements', 'asset', 'fixed_asset', ics_id, true, 'Office buildout', 5000000),
    ('2001', 'Deferred Revenue', 'liability', 'current_liability', ics_id, true, 'Prepaid memberships', 150000),
    ('3001', 'Retained Earnings', 'equity', 'retained_earnings', ics_id, true, 'Retained', 3000000),
    ('4001', 'Membership Revenue', 'income', 'operating_revenue', ics_id, true, 'Membership fees', 0),
    ('4002', 'Meeting Room Revenue', 'income', 'operating_revenue', ics_id, true, 'Room bookings', 0),
    ('6001', 'Salaries', 'expense', 'operating_expense', ics_id, true, 'Staff salaries', 0),
    ('6002', 'Facilities', 'expense', 'operating_expense', ics_id, true, 'Office maintenance', 0),
    ('6003', 'Utilities', 'expense', 'operating_expense', ics_id, true, 'Electricity, internet', 0);
  RAISE NOTICE 'Seeded ICS Chart of Accounts.';

  -- ==========================================================================
  -- 4. FISCAL YEARS (all properties)
  -- ==========================================================================
  INSERT INTO fiscal_years (property_id, name, start_date, end_date, is_closed) VALUES
    (ovh_id, 'FY 2025-2026', '2025-04-01', '2026-03-31', true),
    (ovh_id, 'FY 2026-2027', '2026-04-01', '2027-03-31', false),
    (csa_id, 'FY 2025-2026', '2025-04-01', '2026-03-31', true),
    (csa_id, 'FY 2026-2027', '2026-04-01', '2027-03-31', false),
    (gwr_id, 'FY 2025-2026', '2025-04-01', '2026-03-31', true),
    (gwr_id, 'FY 2026-2027', '2026-04-01', '2027-03-31', false),
    (ics_id, 'FY 2025-2026', '2025-04-01', '2026-03-31', true),
    (ics_id, 'FY 2026-2027', '2026-04-01', '2027-03-31', false);
  SELECT id INTO fy_2526 FROM fiscal_years WHERE name = 'FY 2025-2026' AND property_id = ovh_id;
  SELECT id INTO fy_2627 FROM fiscal_years WHERE name = 'FY 2026-2027' AND property_id = ovh_id;
  RAISE NOTICE 'Seeded Fiscal Years.';

  -- ==========================================================================
  -- 5. COST CENTERS (per property, per department)
  -- ==========================================================================
  INSERT INTO cost_centers (property_id, code, name, department_id, is_active) VALUES
    (ovh_id, 'CC-FD', 'Front Desk', dept_ovh_fd, true),
    (ovh_id, 'CC-HK', 'Housekeeping', dept_ovh_hk, true),
    (ovh_id, 'CC-MT', 'Maintenance', dept_ovh_mt, true),
    (ovh_id, 'CC-FB', 'Food & Beverage', dept_ovh_fb, true),
    (ovh_id, 'CC-ADM', 'Administration', dept_ovh_hr, true),
    (csa_id, 'CC-FD', 'Front Desk', dept_csa_fd, true),
    (csa_id, 'CC-HK', 'Housekeeping', dept_csa_hk, true),
    (csa_id, 'CC-MT', 'Maintenance', dept_csa_mt, true),
    (csa_id, 'CC-ADM', 'Administration', dept_csa_hr, true),
    (gwr_id, 'CC-PM', 'Property Mgmt', dept_gwr_fd, true),
    (gwr_id, 'CC-MT', 'Maintenance', dept_gwr_mt, true),
    (ics_id, 'CC-OPS', 'Operations', dept_ics_fd, true),
    (ics_id, 'CC-FAC', 'Facilities', dept_ics_mt, true);
  RAISE NOTICE 'Seeded Cost Centers.';

  -- ==========================================================================
  -- 6. JOURNAL ENTRIES (OVH - last 3 months)
  -- ==========================================================================
  FOR day_offset IN 0..89 LOOP
    -- Room revenue journal entry (daily)
    INSERT INTO journal_entries (property_id, entry_date, journal_type, description, created_by)
    VALUES (ovh_id, CURRENT_DATE - day_offset, 'revenue',
            'Daily room revenue ' || (CURRENT_DATE - day_offset)::text, uid_finance)
    RETURNING id INTO je_id;

    rnd := 80000 + random() * 120000;
    INSERT INTO journal_lines (journal_id, account_id, debit, credit, description)
    SELECT je_id, id, 0, rnd, 'Room revenue'
    FROM chart_of_accounts WHERE account_code = '4001' AND property_id = ovh_id;
    INSERT INTO journal_lines (journal_id, account_id, debit, credit, description)
    SELECT je_id, id, rnd, 0, 'Accounts receivable'
    FROM chart_of_accounts WHERE account_code = '1010' AND property_id = ovh_id;
  END LOOP;
  RAISE NOTICE 'Seeded 90 journal entries for OVH.';

  -- CSA journal entries (30 days)
  FOR day_offset IN 0..29 LOOP
    INSERT INTO journal_entries (property_id, entry_date, journal_type, description, created_by)
    VALUES (csa_id, CURRENT_DATE - day_offset, 'revenue',
            'Daily suite revenue', uid_csa_fn)
    RETURNING id INTO je_id;
    rnd := 30000 + random() * 50000;
    INSERT INTO journal_lines (journal_id, account_id, debit, credit, description)
    SELECT je_id, id, 0, rnd, 'Suite revenue'
    FROM chart_of_accounts WHERE account_code = '4001' AND property_id = csa_id;
    INSERT INTO journal_lines (journal_id, account_id, debit, credit, description)
    SELECT je_id, id, rnd, 0, 'Receivables'
    FROM chart_of_accounts WHERE account_code = '1010' AND property_id = csa_id;
  END LOOP;
  RAISE NOTICE 'Seeded 30 journal entries for CSA.';

  -- ==========================================================================
  -- 7. BUDGET HEADS & BUDGET ENTRIES (OVH FY 2026-2027)
  -- ==========================================================================
  INSERT INTO budget_heads (property_id, code, name, is_active) VALUES
    (ovh_id, 'BH-RR', 'Room Revenue Target', true),
    (ovh_id, 'BH-SAL', 'Salaries Budget', true),
    (ovh_id, 'BH-HK', 'HK Supplies Budget', true),
    (ovh_id, 'BH-MT', 'Maintenance Budget', true),
    (ovh_id, 'BH-UTIL', 'Utilities Budget', true);
  -- Monthly budget entries for OVH
  FOR day_offset IN 0..11 LOOP
    INSERT INTO budget_entries (budget_head_id, fiscal_year_id, period_month, budget_amount) VALUES
      ((SELECT id FROM budget_heads WHERE code = 'BH-RR' AND property_id = ovh_id), fy_2627, ((3 + day_offset) % 12) + 1, 3000000 + random() * 500000);
    INSERT INTO budget_entries (budget_head_id, fiscal_year_id, period_month, budget_amount) VALUES
      ((SELECT id FROM budget_heads WHERE code = 'BH-SAL' AND property_id = ovh_id), fy_2627, ((3 + day_offset) % 12) + 1, 1200000 + random() * 100000);
    INSERT INTO budget_entries (budget_head_id, fiscal_year_id, period_month, budget_amount) VALUES
      ((SELECT id FROM budget_heads WHERE code = 'BH-HK' AND property_id = ovh_id), fy_2627, ((3 + day_offset) % 12) + 1, 200000 + random() * 50000);
    INSERT INTO budget_entries (budget_head_id, fiscal_year_id, period_month, budget_amount) VALUES
      ((SELECT id FROM budget_heads WHERE code = 'BH-MT' AND property_id = ovh_id), fy_2627, ((3 + day_offset) % 12) + 1, 150000 + random() * 40000);
  END LOOP;
  RAISE NOTICE 'Seeded budget heads and entries for OVH.';

  -- ==========================================================================
  -- 8. VENDOR BILLS (for existing vendors)
  -- ==========================================================================
  -- Laundry bill
  INSERT INTO vendor_bills (property_id, vendor_id, bill_number, bill_date, due_date, category, subtotal, tax_total, grand_total, paid_total, status, notes, created_by, created_at)
  VALUES (ovh_id, vid_laundry, 'INV-LND-001', CURRENT_DATE - 15, CURRENT_DATE - 1, 'service', 45000, 8100, 53100, 0, 'approved', 'Monthly laundry service - June 2026', uid_finance, CURRENT_DATE - 15);
  INSERT INTO bill_line_items (bill_id, description, quantity, unit_price) VALUES
    ((SELECT id FROM vendor_bills WHERE bill_number = 'INV-LND-001'), 'Linen washing service', 300, 150);
  -- HVAC bill
  INSERT INTO vendor_bills (property_id, vendor_id, bill_number, bill_date, due_date, category, subtotal, tax_total, grand_total, paid_total, status, notes, created_by, created_at)
  VALUES (ovh_id, vid_hvac, 'INV-HVAC-001', CURRENT_DATE - 20, CURRENT_DATE + 10, 'service', 75000, 13500, 88500, 0, 'approved', 'AC maintenance Q2 2026', uid_finance, CURRENT_DATE - 20);
  INSERT INTO bill_line_items (bill_id, description, quantity, unit_price) VALUES
    ((SELECT id FROM vendor_bills WHERE bill_number = 'INV-HVAC-001'), 'Preventive maintenance - 10 units', 10, 7500);
  -- Pest control
  INSERT INTO vendor_bills (property_id, vendor_id, bill_number, bill_date, due_date, category, subtotal, tax_total, grand_total, paid_total, status, notes, created_by, created_at)
  VALUES (ovh_id, vid_pest, 'INV-PST-001', CURRENT_DATE - 10, CURRENT_DATE + 5, 'service', 18000, 3240, 21240, 0, 'pending', 'Quarterly pest control', uid_finance, CURRENT_DATE - 10);
  INSERT INTO bill_line_items (bill_id, description, quantity, unit_price) VALUES
    ((SELECT id FROM vendor_bills WHERE bill_number = 'INV-PST-001'), 'Full property treatment', 1, 18000);
  -- Elevator
  INSERT INTO vendor_bills (property_id, vendor_id, bill_number, bill_date, due_date, category, subtotal, tax_total, grand_total, paid_total, status, notes, created_by, created_at)
  VALUES (csa_id, vid_elevator, 'INV-ELE-001', CURRENT_DATE - 25, CURRENT_DATE - 10, 'service', 95000, 17100, 112100, 112100, 'paid', 'Elevator AMC Q2', uid_csa_fn, CURRENT_DATE - 25);
  INSERT INTO bill_line_items (bill_id, description, quantity, unit_price) VALUES
    ((SELECT id FROM vendor_bills WHERE bill_number = 'INV-ELE-001'), 'Elevator maintenance contract', 2, 47500);
  -- Pay the elevator bill
  INSERT INTO bill_payments (property_id, bill_id, payment_method, reference_number, amount, payment_date, created_by)
  VALUES (csa_id, (SELECT id FROM vendor_bills WHERE bill_number = 'INV-ELE-001'), 'bank_transfer', 'NEFT-20260613', 112100, CURRENT_DATE - 10, uid_csa_fn);
  RAISE NOTICE 'Seeded vendor bills and payments.';

  -- ==========================================================================
  -- 9. FIXED ASSETS (OVH + CSA)
  -- ==========================================================================
  INSERT INTO fixed_assets (property_id, asset_code, asset_name, category, purchase_date, purchase_cost, salvage_value, useful_life_yrs, depreciation_method, status, location) VALUES
    (ovh_id, 'FA-OVH-BLDG-001', 'Hotel Building - Oceanview', 'building', '2020-01-01', 50000000, 5000000, 40, 'straight_line', 'active', 'Main Campus'),
    (ovh_id, 'FA-OVH-EQP-KIT-001', 'Kitchen Equipment Package', 'equipment', '2022-03-15', 3500000, 350000, 10, 'straight_line', 'active', 'Kitchen'),
    (ovh_id, 'FA-OVH-EQP-LAU-001', 'Laundry Machinery', 'equipment', '2021-06-01', 1800000, 180000, 10, 'straight_line', 'active', 'Laundry Room'),
    (ovh_id, 'FA-OVH-FURN-001', 'Guest Room Furniture Set', 'furniture', '2023-01-10', 4200000, 420000, 7, 'straight_line', 'active', 'All Rooms'),
    (ovh_id, 'FA-OVH-IT-001', 'IT Server Infrastructure', 'equipment', '2024-06-01', 1200000, 120000, 5, 'straight_line', 'active', 'Server Room'),
    (ovh_id, 'FA-OVH-VEH-001', 'Company Vehicle - Toyota Innova', 'vehicle', '2022-09-01', 2500000, 250000, 8, 'straight_line', 'active', 'Parking');
  -- Fixed assets for CSA
  INSERT INTO fixed_assets (property_id, asset_code, asset_name, category, purchase_date, purchase_cost, salvage_value, useful_life_yrs, depreciation_method, status, location) VALUES
    (csa_id, 'FA-CSA-BLDG-001', 'Apartment Building', 'building', '2019-06-01', 35000000, 3500000, 40, 'straight_line', 'active', 'Main Campus'),
    (csa_id, 'FA-CSA-FURN-001', 'Furniture Package - All Suites', 'furniture', '2023-04-01', 2500000, 250000, 7, 'straight_line', 'active', 'All Suites');
  -- Depreciation entries
  INSERT INTO depreciation_schedule (asset_id, period_date, amount, is_posted)
  SELECT id, '2026-06-30'::date, ROUND(purchase_cost / useful_life_yrs / 12), false
  FROM fixed_assets WHERE status = 'active';
  RAISE NOTICE 'Seeded fixed assets and depreciation.';

  -- ==========================================================================
  -- 10. TAX FILINGS
  -- ==========================================================================
  INSERT INTO tax_filings (property_id, tax_type, return_type, period_start, period_end, filing_date, due_date, status, total_liability, total_paid, filed_by, remarks) VALUES
    (ovh_id, 'GST', 'quarterly', '2026-04-01', '2026-06-30', CURRENT_DATE - 45, CURRENT_DATE - 30, 'filed', 185000, 185000, uid_finance, 'GST return April-June 2026'),
    (ovh_id, 'GST', 'quarterly', '2026-07-01', '2026-09-30', CURRENT_DATE + 15, CURRENT_DATE + 45, 'pending', 210000, 0, NULL, 'GST return July-Sep 2026'),
    (ovh_id, 'TDS', 'monthly', '2026-05-01', '2026-05-31', CURRENT_DATE - 20, CURRENT_DATE - 10, 'filed', 45000, 45000, uid_finance, 'TDS return May 2026'),
    (csa_id, 'GST', 'quarterly', '2026-04-01', '2026-06-30', CURRENT_DATE - 45, CURRENT_DATE - 30, 'filed', 95000, 95000, uid_csa_fn, 'GST return Q1'),
    (csa_id, 'TDS', 'monthly', '2026-05-01', '2026-05-31', CURRENT_DATE - 20, CURRENT_DATE - 10, 'filed', 28000, 28000, uid_csa_fn, 'TDS May 2026'),
    (gwr_id, 'TDS', 'monthly', '2026-06-01', '2026-06-30', CURRENT_DATE, CURRENT_DATE + 7, 'draft', 15000, 0, NULL, 'TDS on rent payments');
  RAISE NOTICE 'Seeded tax filings.';

  -- ==========================================================================
  -- 11. INVENTORY MODULE (categories, warehouses, items, transactions)
  -- ==========================================================================
  -- Categories
  INSERT INTO inventory_categories (name, description, property_id, is_active) VALUES
    ('Cleaning Supplies', 'Detergents, disinfectants, mops, gloves', ovh_id, true),
    ('Linens & Textiles', 'Bed sheets, towels, bathmats, curtains', ovh_id, true),
    ('Guest Amenities', 'Soap, shampoo, lotion, slippers', ovh_id, true),
    ('Maintenance Parts', 'Electrical, plumbing, hardware', ovh_id, true),
    ('F&B Supplies', 'Coffee, tea, sugar, condiments', ovh_id, true);
  SELECT id INTO inv_cat_cleaning FROM inventory_categories WHERE name = 'Cleaning Supplies' AND property_id = ovh_id LIMIT 1;
  SELECT id INTO inv_cat_linen FROM inventory_categories WHERE name = 'Linens & Textiles' AND property_id = ovh_id LIMIT 1;
  SELECT id INTO inv_cat_amenities FROM inventory_categories WHERE name = 'Guest Amenities' AND property_id = ovh_id LIMIT 1;
  SELECT id INTO inv_cat_maint FROM inventory_categories WHERE name = 'Maintenance Parts' AND property_id = ovh_id LIMIT 1;
  SELECT id INTO inv_cat_fnb FROM inventory_categories WHERE name = 'F&B Supplies' AND property_id = ovh_id LIMIT 1;

  -- CSA categories
  INSERT INTO inventory_categories (name, description, property_id, is_active) VALUES
    ('Cleaning Supplies', 'Cleaning materials', csa_id, true),
    ('Guest Amenities', 'Soap, shampoo etc', csa_id, true),
    ('Maintenance Parts', 'Repair parts', csa_id, true);

  -- Warehouses
  INSERT INTO warehouses (name, code, location, manager_name, phone, property_id, is_active) VALUES
    ('Main Store', 'WH-MAIN', 'Ground Floor - Service Wing', 'Rajesh Kumar', '9988776655', ovh_id, true)
  RETURNING id INTO wh_main;
  INSERT INTO warehouses (name, code, location, manager_name, phone, property_id, is_active) VALUES
    ('Housekeeping Pantry', 'WH-HK', 'Floor 2 - Housekeeping Office', 'Meena Pillai', '9988776656', ovh_id, true)
  RETURNING id INTO wh_hk;
  INSERT INTO warehouses (name, code, location, manager_name, phone, property_id, is_active) VALUES
    ('Engineering Store', 'WH-ENG', 'Basement - Maintenance Workshop', 'Arjun Sharma', '9988776657', ovh_id, true)
  RETURNING id INTO wh_eng;

  -- Inventory items
  INSERT INTO inventory_items (category_id, name, sku, unit, quantity_on_hand, reorder_level, reorder_quantity, unit_cost, warehouse_id, property_id) VALUES
    (inv_cat_cleaning, 'All-Purpose Cleaner 5L', 'CLN-APC-001', 'bottle', 45, 10, 20, 280, wh_main, ovh_id),
    (inv_cat_cleaning, 'Glass Cleaner 5L', 'CLN-GLC-001', 'bottle', 30, 10, 15, 250, wh_main, ovh_id),
    (inv_cat_cleaning, 'Disinfectant Spray 500ml', 'CLN-DIS-001', 'bottle', 120, 20, 30, 85, wh_hk, ovh_id),
    (inv_cat_cleaning, 'Microfiber Cloth Pack', 'CLN-MFC-001', 'pack', 200, 30, 50, 45, wh_hk, ovh_id),
    (inv_cat_cleaning, 'Floor Mop Kit', 'CLN-MOP-001', 'set', 25, 5, 10, 350, wh_hk, ovh_id),
    (inv_cat_linen, 'King Size Bed Sheet - White', 'LIN-KBS-001', 'piece', 150, 30, 50, 1200, wh_main, ovh_id),
    (inv_cat_linen, 'Queen Size Bed Sheet - White', 'LIN-QBS-001', 'piece', 200, 30, 50, 950, wh_main, ovh_id),
    (inv_cat_linen, 'Bath Towel - Premium', 'LIN-BTW-001', 'piece', 300, 50, 100, 450, wh_main, ovh_id),
    (inv_cat_linen, 'Hand Towel', 'LIN-HTW-001', 'piece', 250, 40, 80, 250, wh_main, ovh_id),
    (inv_cat_linen, 'Bath Mat', 'LIN-BMT-001', 'piece', 100, 20, 30, 350, wh_main, ovh_id),
    (inv_cat_linen, 'Pillow Case - Standard', 'LIN-PCS-001', 'piece', 400, 50, 100, 180, wh_main, ovh_id),
    (inv_cat_amenities, 'Shampoo 50ml', 'AME-SHM-001', 'bottle', 500, 100, 200, 35, wh_main, ovh_id),
    (inv_cat_amenities, 'Conditioner 50ml', 'AME-CND-001', 'bottle', 400, 80, 150, 35, wh_main, ovh_id),
    (inv_cat_amenities, 'Body Lotion 50ml', 'AME-BLT-001', 'bottle', 300, 60, 120, 45, wh_main, ovh_id),
    (inv_cat_amenities, 'Soap Bar', 'AME-SBP-001', 'piece', 800, 200, 300, 20, wh_main, ovh_id),
    (inv_cat_amenities, 'Shower Cap Pack', 'AME-SCP-001', 'pack', 600, 100, 200, 15, wh_hk, ovh_id),
    (inv_cat_amenities, 'Slippers Pair', 'AME-SLP-001', 'pair', 200, 50, 100, 80, wh_main, ovh_id),
    (inv_cat_maint, 'LED Bulb 12W', 'MTN-LED-001', 'piece', 80, 15, 30, 120, wh_eng, ovh_id),
    (inv_cat_maint, 'LED Bulb 9W', 'MTN-LED-002', 'piece', 60, 15, 30, 95, wh_eng, ovh_id),
    (inv_cat_maint, 'AC Filter', 'MTN-ACF-001', 'piece', 30, 10, 15, 350, wh_eng, ovh_id),
    (inv_cat_maint, 'PVC Pipe 1inch 3m', 'MTN-PVC-001', 'piece', 20, 5, 10, 280, wh_eng, ovh_id),
    (inv_cat_maint, 'Tap Washer Set', 'MTN-TWS-001', 'set', 50, 10, 20, 65, wh_eng, ovh_id),
    (inv_cat_maint, 'Circuit Breaker 16A', 'MTN-CBR-001', 'piece', 25, 5, 10, 450, wh_eng, ovh_id),
    (inv_cat_fnb, 'Coffee Beans - 1kg', 'FNB-COF-001', 'kg', 15, 5, 10, 850, wh_main, ovh_id),
    (inv_cat_fnb, 'Tea Bags Box 100pk', 'FNB-TEA-001', 'box', 25, 5, 10, 350, wh_main, ovh_id),
    (inv_cat_fnb, 'Sugar Sachets 1000pk', 'FNB-SGR-001', 'box', 10, 3, 5, 450, wh_main, ovh_id);
  RAISE NOTICE 'Seeded inventory items.';

  -- Transactions — stock in
  INSERT INTO inventory_transactions (item_id, transaction_type, quantity, unit_cost, notes, warehouse_id, property_id, created_by, created_at)
  SELECT id, 'purchase_receipt', reorder_quantity * 2, unit_cost, 'Opening stock', warehouse_id, property_id, uid_admin, CURRENT_DATE - 30
  FROM inventory_items WHERE property_id = ovh_id;
  -- Some issue transactions
  INSERT INTO inventory_transactions (item_id, transaction_type, quantity, unit_cost, notes, warehouse_id, property_id, created_by, created_at)
  SELECT id, 'adjustment_subtract', floor(random() * 10 + 1)::int, unit_cost, 'Monthly usage - Housekeeping', warehouse_id, property_id, uid_hk, CURRENT_DATE - 7
  FROM inventory_items WHERE category_id = inv_cat_cleaning OR category_id = inv_cat_amenities ORDER BY random() LIMIT 5;
  RAISE NOTICE 'Seeded inventory transactions.';

  -- ==========================================================================
  -- 12. MAINTENANCE — AMC CONTRACTS
  -- ==========================================================================
  INSERT INTO amc_contracts (property_id, vendor_id, contract_name, contract_ref, start_date, end_date, value, status) VALUES
    (ovh_id, vid_hvac, 'HVAC Preventive Maintenance', 'AMC-HVAC-001', '2026-01-01', '2026-12-31', 300000, 'active'),
    (ovh_id, vid_elevator, 'Elevator Annual Maintenance', 'AMC-ELE-001', '2026-01-01', '2026-12-31', 190000, 'active'),
    (ovh_id, vid_pest, 'Pest Control Contract', 'AMC-PST-001', '2026-03-01', '2027-02-28', 72000, 'active'),
    (ovh_id, vid_plumbing, 'Plumbing Maintenance', 'AMC-PLM-001', '2026-04-01', '2026-09-30', 85000, 'active'),
    (csa_id, vid_hvac, 'HVAC Service Contract', 'AMC-HVAC-CSA-001', '2026-01-01', '2026-12-31', 180000, 'active'),
    (csa_id, vid_elevator, 'Elevator AMC', 'AMC-ELE-CSA-001', '2026-01-01', '2026-12-31', 120000, 'active');

  -- ==========================================================================
  -- 13. PREVENTIVE MAINTENANCE SCHEDULES
  -- ==========================================================================
  INSERT INTO preventive_schedules (property_id, asset_type, frequency_days, task_template, next_due, is_active) VALUES
    (ovh_id, 'HVAC', 30, 'HVAC Filter Cleaning - Room 101 — Replace AC filters monthly', CURRENT_DATE, true),
    (ovh_id, 'HVAC', 30, 'HVAC Filter Cleaning - Room 102', CURRENT_DATE + 2, true),
    (ovh_id, 'safety', 90, 'Fire Alarm Test - Floor 1 — Quarterly fire alarm test', CURRENT_DATE + 5, true),
    (ovh_id, 'equipment', 7, 'Generator Run Test — Weekly generator test', CURRENT_DATE + 1, true),
    (ovh_id, 'equipment', 3, 'Swimming Pool Pump Check — Alternate day pump check', CURRENT_DATE, true),
    (ovh_id, 'elevator', 30, 'Elevator Safety Inspection — Monthly elevator check', CURRENT_DATE + 10, true),
    (csa_id, 'HVAC', 45, 'AC Servicing - All Floors — AC preventive maintenance', CURRENT_DATE + 3, true),
    (csa_id, 'plumbing', 60, 'Water Tank Cleaning — Bi-monthly tank cleaning', CURRENT_DATE + 15, true),
    (ics_id, 'equipment', 1, 'Workstation Sanitization — Daily desk sanitization', CURRENT_DATE, true);

  -- ==========================================================================
  -- 14. MAINTENANCE TICKETS (with time entries, parts, approvals)
  -- ==========================================================================
  -- OVH Tickets
  -- OVH Tickets
  INSERT INTO maintenance_tickets (property_id, unit_id, ticket_number, ticket_type, title, description, category, priority, status, reported_by, assigned_to, created_at) VALUES
    (ovh_id, unit_ovh_1, 'MT-OVH-001', 'corrective', 'AC not cooling - Room 101', 'Guest reported AC not cooling below 25°C despite thermostat at 18°C', 'HVAC', 'critical', 'open', uid_frontdesk, uid_maint, CURRENT_DATE - 2)
  RETURNING id INTO ticket_id;
  INSERT INTO maintenance_time_entries (ticket_id, technician_id, start_time, end_time, notes) VALUES
    (ticket_id, uid_maint, (CURRENT_DATE - 2)::timestamp + time '14:00:00', (CURRENT_DATE - 2)::timestamp + time '15:30:00', 'Initial diagnosis - gas refill needed');
  INSERT INTO maintenance_ticket_parts (ticket_id, part_name, quantity, unit_price) VALUES
    (ticket_id, 'Refrigerant Gas R32', 1, 2500);
  INSERT INTO maintenance_approvals (ticket_id, action, performed_by, comment) VALUES
    (ticket_id, 'assigned', uid_maint, 'Assigned to Arjun Sharma');

  INSERT INTO maintenance_tickets (property_id, unit_id, ticket_number, ticket_type, title, description, category, priority, status, reported_by, assigned_to, created_at) VALUES
    (ovh_id, unit_ovh_2, 'MT-OVH-002', 'corrective', 'Leaking tap - Room 205', 'Bathroom tap dripping continuously, guest complaint', 'plumbing', 'high', 'in_progress', uid_frontdesk, uid_maint, CURRENT_DATE - 1)
  RETURNING id INTO ticket_id;
  INSERT INTO maintenance_time_entries (ticket_id, technician_id, start_time, end_time, notes) VALUES
    (ticket_id, uid_maint, (CURRENT_DATE - 1)::timestamp + time '10:00:00', (CURRENT_DATE - 1)::timestamp + time '10:45:00', 'Replaced tap washer - testing');
  INSERT INTO maintenance_ticket_parts (ticket_id, part_name, quantity, unit_price) VALUES
    (ticket_id, 'Tap Washer Set', 1, 65);
  INSERT INTO maintenance_approvals (ticket_id, action, performed_by, comment) VALUES
    (ticket_id, 'assigned', uid_maint, 'Assigned');

  INSERT INTO maintenance_tickets (property_id, ticket_number, ticket_type, title, description, category, priority, status, reported_by, assigned_to, created_at) VALUES
    (ovh_id, 'MT-OVH-003', 'corrective', 'TV not working in Room 308', 'Guest TV showing no signal, checked connections', 'electrical', 'medium', 'resolved', uid_frontdesk, uid_maint, CURRENT_DATE - 5)
  RETURNING id INTO ticket_id;
  INSERT INTO maintenance_time_entries (ticket_id, technician_id, start_time, end_time, notes) VALUES
    (ticket_id, uid_maint, (CURRENT_DATE - 5)::timestamp + time '09:00:00', (CURRENT_DATE - 5)::timestamp + time '09:30:00', 'Reset set-top box - working now');
  INSERT INTO maintenance_approvals (ticket_id, action, performed_by, comment) VALUES
    (ticket_id, 'assigned', uid_maint, 'Assigned'),
    (ticket_id, 'resolved', uid_maint, 'TV working fine');

  INSERT INTO maintenance_tickets (property_id, ticket_number, ticket_type, title, description, category, priority, status, reported_by, assigned_to, created_at) VALUES
    (ovh_id, 'MT-OVH-004', 'corrective', 'Corridor light flickering Floor 4', 'Multiple corridor lights flickering on 4th floor west wing', 'electrical', 'low', 'closed', uid_hk, uid_maint, CURRENT_DATE - 10)
  RETURNING id INTO ticket_id;
  INSERT INTO maintenance_time_entries (ticket_id, technician_id, start_time, end_time, notes) VALUES
    (ticket_id, uid_maint, (CURRENT_DATE - 10)::timestamp + time '08:00:00', (CURRENT_DATE - 10)::timestamp + time '09:00:00', 'Replaced 3 LED bulbs, checked wiring');
  INSERT INTO maintenance_ticket_parts (ticket_id, part_name, quantity, unit_price) VALUES
    (ticket_id, 'LED Bulb 12W', 3, 120);
  INSERT INTO maintenance_approvals (ticket_id, action, performed_by, comment) VALUES
    (ticket_id, 'assigned', uid_maint, 'Assigned'),
    (ticket_id, 'resolved', uid_maint, 'All lights replaced'),
    (ticket_id, 'closed', uid_admin, 'Verified and closed');

  INSERT INTO maintenance_tickets (property_id, ticket_number, ticket_type, title, description, category, priority, status, reported_by, created_at) VALUES
    (ovh_id, 'MT-OVH-005', 'corrective', 'Water pressure low in Room 401', 'Guest on 4th floor reported very low water pressure in shower', 'plumbing', 'high', 'open', uid_frontdesk, CURRENT_DATE);

  -- CSA Tickets
  INSERT INTO maintenance_tickets (property_id, unit_id, ticket_number, ticket_type, title, description, category, priority, status, reported_by, assigned_to, created_at) VALUES
    (csa_id, unit_csa_1, 'MT-CSA-001', 'corrective', 'Kitchen sink clogged - Suite 101', 'Kitchen sink draining slow, needs plunging', 'plumbing', 'medium', 'open', uid_csa_fd, uid_csa_mt, CURRENT_DATE - 1);
  INSERT INTO maintenance_tickets (property_id, ticket_number, ticket_type, title, description, category, priority, status, reported_by, assigned_to, created_at) VALUES
    (csa_id, 'MT-CSA-002', 'corrective', 'AC not working in Suite 205', 'AC unit making noise and not cooling', 'HVAC', 'critical', 'in_progress', uid_csa_fd, uid_csa_mt, CURRENT_DATE - 3);
  INSERT INTO maintenance_tickets (property_id, ticket_number, ticket_type, title, description, category, priority, status, reported_by, created_at) VALUES
    (csa_id, 'MT-CSA-003', 'corrective', 'Common area light fault', 'Lobby light fixture needs replacement', 'electrical', 'low', 'open', uid_csa_hk, CURRENT_DATE);

  -- GWR Tickets
  INSERT INTO maintenance_tickets (property_id, unit_id, ticket_number, ticket_type, title, description, category, priority, status, reported_by, assigned_to, created_at) VALUES
    (gwr_id, unit_gwr_1, 'MT-GWR-001', 'corrective', 'Geyser not heating - Apt 101', 'Tenant reported no hot water in bathroom', 'plumbing', 'high', 'open', uid_gwr_fd, uid_gwr_mt, CURRENT_DATE);
  INSERT INTO maintenance_tickets (property_id, unit_id, ticket_number, ticket_type, title, description, category, priority, status, reported_by, assigned_to, created_at) VALUES
    (gwr_id, unit_gwr_2, 'MT-GWR-002', 'corrective', 'Window lock broken - Apt 202', 'Bedroom window handle broken, needs replacement', 'general', 'medium', 'in_progress', uid_gwr_fd, uid_gwr_mt, CURRENT_DATE - 2);

  -- ICS Tickets
  INSERT INTO maintenance_tickets (property_id, ticket_number, ticket_type, title, description, category, priority, status, reported_by, assigned_to, created_at) VALUES
    (ics_id, 'MT-ICS-001', 'corrective', 'Meeting room projector bulb', 'MR-203 projector bulb needs replacement, showing dim', 'electrical', 'high', 'open', uid_ics_fd, uid_ics_mt, CURRENT_DATE);
  INSERT INTO maintenance_tickets (property_id, ticket_number, ticket_type, title, description, category, priority, status, reported_by, created_at) VALUES
    (ics_id, 'MT-ICS-002', 'corrective', 'Coffee machine not working', 'Pantry coffee machine display error', 'general', 'medium', 'open', uid_ics_fd, CURRENT_DATE);
  RAISE NOTICE 'Seeded maintenance tickets across all properties.';

  -- ==========================================================================
  -- 15. HOUSEKEEPING — Checklists, Linen, Inspections
  -- ==========================================================================
  -- Checklists (per-task items — link to completed turnaround tasks)
  WITH task AS (
    SELECT id FROM housekeeping_tasks WHERE task_type = 'turnaround' AND status IN ('resolved', 'closed', 'in_progress', 'open') LIMIT 1
  )
  INSERT INTO housekeeping_checklists (task_id, item, is_checked, checked_at, checked_by)
  SELECT task.id, item, true, CURRENT_TIMESTAMP, uid_hk
  FROM task, (VALUES ('Strip bed linens'), ('Make bed with fresh linen'), ('Dust all surfaces'), ('Vacuum floor'), ('Clean bathroom'), ('Replace towels'), ('Restock amenities'), ('Empty trash'), ('Sign off')) AS items(item);

  -- Linen batches
  INSERT INTO linen_batches (batch_id, property_id, item_type, quantity, lifecycle_stage, created_at) VALUES
    ('LNB-20260601', ovh_id, 'bed_sheet_king', 100, 'clean', CURRENT_DATE - 2),
    ('LNB-20260602', ovh_id, 'bed_sheet_queen', 150, 'clean', CURRENT_DATE - 2),
    ('LNB-20260603', ovh_id, 'bath_towel', 200, 'in_use', CURRENT_DATE - 1),
    ('LNB-20260604', ovh_id, 'hand_towel', 150, 'in_laundry', CURRENT_DATE - 1),
    ('LNB-20260605', ovh_id, 'bath_mat', 80, 'clean', CURRENT_DATE - 1),
    ('LNB-20260606', ovh_id, 'pillow_case', 300, 'in_use', CURRENT_DATE),
    ('LNB-CSA-001', csa_id, 'bed_sheet_king', 60, 'clean', CURRENT_DATE - 3),
    ('LNB-CSA-002', csa_id, 'bath_towel', 80, 'in_use', CURRENT_DATE - 1);

  -- Linen items (individual tracking)
  INSERT INTO linen_items (batch_id, rfid_tag, item_type, status, lifecycle_count, property_id)
  SELECT lb.id, 'RFID-' || lb.batch_id || '-' || gs, lb.item_type, 'clean', 0, lb.property_id
  FROM linen_batches lb, generate_series(1, 10) gs
  WHERE lb.property_id = ovh_id;

  -- Linen transactions
  INSERT INTO linen_transactions (batch_id, from_stage, to_stage, quantity, logged_by)
  SELECT id, 'clean', 'in_use', quantity, uid_hk
  FROM linen_batches WHERE property_id = ovh_id AND lifecycle_stage = 'in_use';

  -- Housekeeping inspections
  INSERT INTO housekeeping_inspections (unit_id, inspector_id, checklist_items, score, status, notes, inspected_at, created_at)
  SELECT unit_ovh_1, uid_hk,
     '[{"item":"Bed making","pass":true},{"item":"Bathroom","pass":true},{"item":"Dusting","pass":true},{"item":"Vacuum","pass":false},{"item":"Amenities","pass":true}]'::jsonb, 80, 'pass', 'Minor vacuum issue - edge not clean', CURRENT_DATE - 1, CURRENT_DATE - 1
  UNION ALL
  SELECT unit_ovh_2, uid_hk,
     '[{"item":"Bed making","pass":true},{"item":"Bathroom","pass":true},{"item":"Dusting","pass":true},{"item":"Vacuum","pass":true},{"item":"Amenities","pass":true}]'::jsonb, 100, 'pass', 'Excellent', CURRENT_DATE - 1, CURRENT_DATE - 1
  UNION ALL
  SELECT unit_ovh_1, uid_hk,
     '[{"item":"Bed making","pass":true},{"item":"Bathroom","pass":false},{"item":"Dusting","pass":true},{"item":"Vacuum","pass":true},{"item":"Amenities","pass":false}]'::jsonb, 60, 'fail', 'Bathroom not properly cleaned, missing shampoo', CURRENT_DATE - 1, CURRENT_DATE - 1;

  -- HK Tasks for today
  FOR day_offset IN 0..6 LOOP
    INSERT INTO housekeeping_tasks (property_id, unit_id, task_type, priority, status, assigned_to, notes, scheduled_at, created_at)
    SELECT ovh_id, u.id, CASE WHEN random() < 0.3 THEN 'deep_clean' WHEN random() < 0.6 THEN 'turnaround' ELSE 'stayover_tidy' END,
           (CASE WHEN random() < 0.2 THEN 'high' WHEN random() < 0.6 THEN 'medium' ELSE 'low' END)::ticket_priority,
           (CASE WHEN random() < 0.5 THEN 'resolved' WHEN random() < 0.8 THEN 'in_progress' ELSE 'open' END)::ticket_status,
           uid_hk, 'Routine cleaning', CURRENT_DATE - day_offset, CURRENT_DATE - day_offset
    FROM units u JOIN floors f ON f.id = u.floor_id JOIN buildings b ON b.id = f.building_id
    WHERE b.property_id = ovh_id AND u.unit_type = 'room'
    ORDER BY random() LIMIT 3;
  END LOOP;
  RAISE NOTICE 'Seeded housekeeping tasks, linen, inspections.';

  -- ==========================================================================
  -- 16. FRONT DESK — Guest Requests, Parking, Guest Feedback, F&B
  -- ==========================================================================
  -- Guest Requests
  INSERT INTO guest_requests (booking_id, request_type, description, status, created_at, resolved_at)
  SELECT id, 'housekeeping', 'Guest requested 2 extra pillows', 'resolved', created_at, created_at + interval '15 minutes'
  FROM bookings WHERE status = 'checked_in' AND property_id = ovh_id LIMIT 1;

  INSERT INTO guest_requests (booking_id, request_type, description, status, created_at)
  SELECT id, 'room_service', 'Guest ordered breakfast in room - Room 101', 'in_progress', created_at
  FROM bookings WHERE status = 'checked_in' AND property_id = ovh_id LIMIT 1 OFFSET 1;

  INSERT INTO guest_requests (booking_id, request_type, description, status, created_at)
  SELECT id, 'maintenance', 'TV remote not working', 'pending', created_at
  FROM bookings WHERE status = 'checked_in' AND property_id = ovh_id LIMIT 1 OFFSET 2;

  INSERT INTO guest_requests (booking_id, request_type, description, status, created_at)
  SELECT id, 'other', 'Guest requested checkout at 3PM instead of 11AM', 'pending', CURRENT_DATE
  FROM bookings WHERE status = 'checked_in' AND property_id = ovh_id LIMIT 1;

  -- Parking allocations
  INSERT INTO parking_allocations (booking_id, vehicle_number, slot_number)
  SELECT id, 'TN-01-AB-1234', 'P-12'
  FROM bookings WHERE status = 'checked_in' AND property_id = ovh_id LIMIT 1;

  INSERT INTO parking_allocations (booking_id, vehicle_number, slot_number)
  SELECT id, 'TN-05-CD-5678', 'P-15'
  FROM bookings WHERE status = 'checked_in' AND property_id = ovh_id LIMIT 1 OFFSET 1;

  -- Guest Feedbacks
  INSERT INTO guest_feedbacks (property_id, booking_id, guest_id, rating, department, comments, created_at)
  SELECT b.property_id, b.id, b.guest_id, 4 + floor(random() * 2)::int, 'housekeeping', 'Room was clean and well maintained. Staff was courteous.', b.created_at + interval '1 day'
  FROM bookings b WHERE status = 'checked_out' AND property_id = ovh_id LIMIT 3;

  INSERT INTO guest_feedbacks (property_id, booking_id, guest_id, rating, department, comments, created_at)
  SELECT b.property_id, b.id, b.guest_id, 3, 'maintenance', 'AC was slow to cool but otherwise fine.', b.created_at + interval '1 day'
  FROM bookings b WHERE status = 'checked_out' AND property_id = ovh_id LIMIT 1 OFFSET 1;

  INSERT INTO guest_feedbacks (property_id, booking_id, guest_id, rating, department, comments, created_at)
  SELECT b.property_id, b.id, b.guest_id, 5, 'front_desk', 'Excellent check-in experience, very welcoming staff!', b.created_at + interval '1 day'
  FROM bookings b WHERE status = 'checked_out' AND property_id = ovh_id LIMIT 1 OFFSET 2;

  INSERT INTO guest_feedbacks (property_id, booking_id, guest_id, rating, department, comments, created_at)
  SELECT b.property_id, b.id, b.guest_id, 2, 'housekeeping', 'Bathroom was not properly cleaned on arrival.', b.created_at + interval '1 day'
  FROM bookings b WHERE status = 'checked_out' AND property_id = ovh_id LIMIT 1 OFFSET 3;

  -- F&B Menu Items
  INSERT INTO f_and_b_menu (property_id, item_name, category, description, price, is_available) VALUES
    (ovh_id, 'Continental Breakfast', 'breakfast', 'Toast, eggs, bacon, juice, coffee', 450, true),
    (ovh_id, 'South Indian Thali', 'breakfast', 'Idli, dosa, vada, sambar, chutney', 350, true),
    (ovh_id, 'Club Sandwich', 'snacks', 'Grilled chicken club with fries', 320, true),
    (ovh_id, 'Masala Dosa', 'breakfast', 'Crispy dosa with potato filling', 250, true),
    (ovh_id, 'Chicken Biryani', 'lunch', 'Hyderabadi style with raita', 420, true),
    (ovh_id, 'Grilled Fish with Rice', 'lunch', 'Lemon pepper fish with herb rice', 550, true),
    (ovh_id, 'Caesar Salad', 'snacks', 'Classic caesar with parmesan', 280, true),
    (ovh_id, 'Coffee - Filter', 'beverages', 'South Indian filter coffee', 80, true),
    (ovh_id, 'Tea - Masala Chai', 'beverages', 'Spiced Indian tea', 60, true),
    (ovh_id, 'Fresh Lime Soda', 'beverages', 'Sweet/salted lime soda', 100, true),
    (ovh_id, 'Brownie with Ice Cream', 'desserts', 'Chocolate brownie with vanilla', 220, true);

  -- F&B Orders
  INSERT INTO f_and_b_orders (property_id, booking_id, order_type, status, total_amount, ordered_at)
  SELECT ovh_id, b.id,
         CASE WHEN random() < 0.5 THEN 'room_service' ELSE 'restaurant_dine_in' END,
         CASE WHEN random() < 0.6 THEN 'delivered' WHEN random() < 0.8 THEN 'preparing' ELSE 'pending' END,
         350 + floor(random() * 800)::int, b.created_at + interval '1 day'
  FROM bookings b, generate_series(1, 3) gs
  WHERE b.status = 'checked_in' AND b.property_id = ovh_id LIMIT 2;
  RAISE NOTICE 'Seeded front desk data (requests, feedback, F&B).';

  -- ==========================================================================
  -- 17. AUDIT EVENTS (for audit trail dashboard)
  -- ==========================================================================
  INSERT INTO system_audit_events (event_type, severity, title, description, source, affected_user, metadata, created_at) VALUES
    ('user_login', 'info', 'User login', 'Admin user logged in successfully', 'auth', uid_admin, jsonb_build_object('property_id', ovh_id), CURRENT_DATE - 1),
    ('user_login', 'info', 'User login', 'Front desk user logged in', 'auth', uid_frontdesk, jsonb_build_object('property_id', ovh_id), CURRENT_DATE - 1),
    ('booking_created', 'info', 'New booking created', 'Walk-in booking for Room 301', 'bookings', uid_frontdesk, jsonb_build_object('property_id', ovh_id, 'booking_id', 'BKG-DEMO'), CURRENT_DATE - 1),
    ('booking_checked_in', 'info', 'Guest check-in', 'Guest checked into Room 201', 'frontdesk', uid_frontdesk, jsonb_build_object('property_id', ovh_id), CURRENT_DATE - 1),
    ('maintenance_ticket', 'warning', 'Critical ticket raised', 'AC not cooling - Room 101 marked as critical', 'maintenance', uid_frontdesk, jsonb_build_object('property_id', ovh_id), CURRENT_DATE - 2),
    ('payment_processed', 'info', 'Payment received', 'Advance payment of ₹8,400 received for booking', 'finance', uid_frontdesk, jsonb_build_object('property_id', ovh_id), CURRENT_DATE - 2),
    ('housekeeping', 'info', 'Task completed', 'Room 205 turnaround completed', 'housekeeping', uid_hk, jsonb_build_object('property_id', ovh_id), CURRENT_DATE - 1),
    ('user_created', 'warning', 'New user created', 'New staff account created for housekeeping department', 'admin', uid_admin, jsonb_build_object('property_id', ovh_id), CURRENT_DATE - 3),
    ('backup', 'info', 'Auto-backup completed', 'Daily database backup completed successfully - 2.4 GB', 'system', uid_super_admin, '{}'::jsonb, CURRENT_DATE - 1),
    ('system', 'critical', 'Low inventory alert', 'LED Bulb stock below reorder level (12 remaining)', 'inventory', uid_admin, jsonb_build_object('property_id', ovh_id), CURRENT_DATE),
    ('vendor_bill', 'info', 'Vendor bill approved', 'Laundry service bill approved for ₹53,100', 'finance', uid_finance, jsonb_build_object('property_id', ovh_id), CURRENT_DATE - 14),
    ('security', 'warning', 'Failed login attempt', '3 failed login attempts for finance@ehms.demo from IP 203.x.x.x', 'auth', uid_finance, '{}'::jsonb, CURRENT_DATE - 1),
    ('user_logout', 'info', 'User logged out', 'Session ended for housekeeping user', 'auth', uid_hk, jsonb_build_object('property_id', ovh_id), CURRENT_DATE - 1),
    ('compliance', 'warning', 'Compliance expiry', 'Fire safety certificate expiring in 30 days', 'admin', uid_admin, jsonb_build_object('property_id', ovh_id), CURRENT_DATE + 20),
    ('maintenance_ticket', 'info', 'Ticket resolved', 'TV issue in Room 308 resolved - replaced set-top box', 'maintenance', uid_maint, jsonb_build_object('property_id', ovh_id), CURRENT_DATE - 4);
  RAISE NOTICE 'Seeded audit events.';

  -- ==========================================================================
  -- 18. PURCHASE ORDERS (to vendors with GRN)
  -- ==========================================================================
  INSERT INTO purchase_orders (vendor_id, property_id, po_number, po_date, status, total_amount, notes, created_by, created_at) VALUES
    (vid_laundry, ovh_id, 'PO-2026-001', CURRENT_DATE - 10, 'delivered', 53100, 'Monthly laundry supplies', uid_admin, CURRENT_DATE - 10);
  INSERT INTO purchase_order_lines (po_id, item_description, quantity, unit_price) VALUES
    ((SELECT id FROM purchase_orders WHERE po_number = 'PO-2026-001'), 'Laundry detergent 20L', 10, 2500),
    ((SELECT id FROM purchase_orders WHERE po_number = 'PO-2026-001'), 'Fabric softener 20L', 5, 2000),
    ((SELECT id FROM purchase_orders WHERE po_number = 'PO-2026-001'), 'Stain remover 5L', 5, 2000);
  INSERT INTO goods_received_notes (po_id, grn_number, received_date, received_by, notes) VALUES
    ((SELECT id FROM purchase_orders WHERE po_number = 'PO-2026-001'), 'GRN-2026-001', CURRENT_DATE - 3, uid_admin, 'All items received in good condition');
  INSERT INTO grn_lines (grn_id, po_line_id, received_qty) VALUES
    ((SELECT id FROM goods_received_notes WHERE grn_number = 'GRN-2026-001'),
     (SELECT id FROM purchase_order_lines WHERE po_id = (SELECT id FROM purchase_orders WHERE po_number = 'PO-2026-001') LIMIT 1 OFFSET 0), 10),
    ((SELECT id FROM goods_received_notes WHERE grn_number = 'GRN-2026-001'),
     (SELECT id FROM purchase_order_lines WHERE po_id = (SELECT id FROM purchase_orders WHERE po_number = 'PO-2026-001') LIMIT 1 OFFSET 1), 5),
    ((SELECT id FROM goods_received_notes WHERE grn_number = 'GRN-2026-001'),
     (SELECT id FROM purchase_order_lines WHERE po_id = (SELECT id FROM purchase_orders WHERE po_number = 'PO-2026-001') LIMIT 1 OFFSET 2), 5);

  INSERT INTO purchase_orders (vendor_id, property_id, po_number, po_date, status, total_amount, notes, created_by, created_at) VALUES
    (vid_hvac, ovh_id, 'PO-2026-002', CURRENT_DATE - 5, 'pending', 44250, 'AC filters and refrigerant', uid_admin, CURRENT_DATE - 5);
  INSERT INTO purchase_order_lines (po_id, item_description, quantity, unit_price) VALUES
    ((SELECT id FROM purchase_orders WHERE po_number = 'PO-2026-002'), 'AC Filter - Standard', 20, 350),
    ((SELECT id FROM purchase_orders WHERE po_number = 'PO-2026-002'), 'Refrigerant R32 - 5kg', 3, 8500),
    ((SELECT id FROM purchase_orders WHERE po_number = 'PO-2026-002'), 'AC Coil Cleaner', 5, 1000);
  RAISE NOTICE 'Seeded purchase orders and GRNs.';

  -- ==========================================================================
  -- 19. CHECK-IN CHECKLISTS (per-booking JSONB checklist_items)
  -- ==========================================================================
  -- Link to 2 checked-in bookings
  INSERT INTO checkin_checklists (booking_id, checklist_items, verified_by, verified_at)
  SELECT id,
    '{"ID Proof Collected": true, "Advance Payment Received": true, "Registration Form Signed": true, "Room Key Issued": true, "WiFi Credentials Shared": true, "Parking Slot Allocated": false, "Welcome Kit Provided": true}'::jsonb,
    uid_frontdesk, CURRENT_TIMESTAMP - interval '2 hours'
  FROM bookings WHERE status = 'checked_in' AND property_id = ovh_id LIMIT 1;

  INSERT INTO checkin_checklists (booking_id, checklist_items, verified_by, verified_at)
  SELECT id,
    '{"ID Proof Collected": true, "Security Deposit Taken": true, "Agreement Signed": true, "Key Card Issued": true}'::jsonb,
    uid_csa_fd, CURRENT_TIMESTAMP - interval '1 hour'
  FROM bookings WHERE status = 'checked_in' AND property_id = csa_id LIMIT 1;
  RAISE NOTICE 'Seeded check-in checklists.';

  -- ==========================================================================
  -- 20. TODAY'S ADDITIONAL BOOKINGS (to ensure current dashboards show data)
  -- ==========================================================================
  -- Create 2 today-checked-in bookings + 1 today-checking-out
  INSERT INTO bookings (property_id, unit_id, guest_id, booking_model, source, status, check_in, check_out, adults, total_amount, paid_amount)
  VALUES (ovh_id, unit_ovh_1, gid4, 'nightly', 'direct', 'checked_in', CURRENT_DATE, CURRENT_DATE + 2, 2, 8400, 8400);

  INSERT INTO bookings (property_id, unit_id, guest_id, booking_model, source, status, check_in, check_out, adults, total_amount, paid_amount)
  VALUES (ovh_id, unit_ovh_2, gid5, 'nightly', 'expedia', 'checked_in', CURRENT_DATE - 3, CURRENT_DATE, 1, 5400, 5400);

  INSERT INTO bookings (property_id, unit_id, guest_id, booking_model, source, status, check_in, check_out, adults, total_amount, paid_amount)
  VALUES (ovh_id, unit_ovh_1, gid6, 'nightly', 'booking.com', 'confirmed', CURRENT_DATE + 1, CURRENT_DATE + 4, 2, 12600, 0);

  -- ==========================================================================
  -- 21. HR — Leave Requests + Timesheets (all properties)
  -- ==========================================================================
  -- Leave Requests - OVH
  INSERT INTO leave_requests (employee_id, leave_type_id, start_date, end_date, total_days, reason, status, approved_by, approved_at, created_at)
  SELECT e.id, lt.id, CURRENT_DATE + 10, CURRENT_DATE + 12, 3, 'Family function', 'approved', uid_hr, CURRENT_DATE - 3, CURRENT_DATE - 5
  FROM employees e, leave_types lt
  WHERE e.user_id = uid_frontdesk AND lt.name = 'Casual' LIMIT 1;

  INSERT INTO leave_requests (employee_id, leave_type_id, start_date, end_date, total_days, reason, status, approved_by, approved_at, created_at)
  SELECT e.id, lt.id, CURRENT_DATE + 5, CURRENT_DATE + 5, 1, 'Doctor appointment', 'approved', uid_hr, CURRENT_DATE - 2, CURRENT_DATE - 3
  FROM employees e, leave_types lt
  WHERE e.user_id = uid_hk AND lt.name = 'Sick' LIMIT 1;

  INSERT INTO leave_requests (employee_id, leave_type_id, start_date, end_date, total_days, reason, status, created_at)
  SELECT e.id, lt.id, CURRENT_DATE + 20, CURRENT_DATE + 24, 5, 'Annual vacation - planning trip to Goa', 'pending', CURRENT_DATE
  FROM employees e, leave_types lt
  WHERE e.user_id = uid_maint AND lt.name = 'Annual' LIMIT 1;

  INSERT INTO leave_requests (employee_id, leave_type_id, start_date, end_date, total_days, reason, status, approved_by, approved_at, created_at)
  SELECT e.id, lt.id, CURRENT_DATE - 10, CURRENT_DATE - 10, 1, 'Comp-off for weekend work', 'approved', uid_hr, CURRENT_DATE - 11, CURRENT_DATE - 12
  FROM employees e, leave_types lt
  WHERE e.user_id = uid_frontdesk AND lt.name = 'Comp-off' LIMIT 1;

  -- Leave requests - CSA
  INSERT INTO leave_requests (employee_id, leave_type_id, start_date, end_date, total_days, reason, status, approved_by, approved_at, created_at)
  SELECT e.id, lt.id, CURRENT_DATE + 15, CURRENT_DATE + 16, 2, 'Personal work', 'approved', uid_csa_hr, CURRENT_DATE - 1, CURRENT_DATE - 2
  FROM employees e, leave_types lt
  WHERE e.user_id = uid_csa_fd AND lt.name = 'Personal' LIMIT 1;

  -- Leave requests - GWR
  INSERT INTO leave_requests (employee_id, leave_type_id, start_date, end_date, total_days, reason, status, created_at)
  SELECT e.id, lt.id, CURRENT_DATE + 7, CURRENT_DATE + 7, 1, 'Not feeling well', 'pending', CURRENT_DATE
  FROM employees e, leave_types lt
  WHERE e.user_id = uid_gwr_hk AND lt.name = 'Sick' LIMIT 1;

  -- Timesheets (last 7 days, all property employees)
  FOR day_offset IN 0..6 LOOP
    -- OVH frontdesk
    INSERT INTO timesheets (employee_id, date, clock_in, clock_out, total_hours, status, created_at)
    SELECT e.id, CURRENT_DATE - day_offset, (CURRENT_DATE - day_offset)::timestamp + time '08:00:00', (CURRENT_DATE - day_offset)::timestamp + time '17:00:00', 9, 'approved', CURRENT_DATE - day_offset
    FROM employees e WHERE e.user_id = uid_frontdesk LIMIT 1;
    -- OVH housekeeping
    INSERT INTO timesheets (employee_id, date, clock_in, clock_out, total_hours, status, created_at)
    SELECT e.id, CURRENT_DATE - day_offset, (CURRENT_DATE - day_offset)::timestamp + time '07:00:00', (CURRENT_DATE - day_offset)::timestamp + time '16:00:00', 9, 'approved', CURRENT_DATE - day_offset
    FROM employees e WHERE e.user_id = uid_hk LIMIT 1;
    -- OVH maintenance
    INSERT INTO timesheets (employee_id, date, clock_in, clock_out, total_hours, status, created_at)
    SELECT e.id, CURRENT_DATE - day_offset, (CURRENT_DATE - day_offset)::timestamp + time '09:00:00', (CURRENT_DATE - day_offset)::timestamp + time '18:00:00', 9, 'approved', CURRENT_DATE - day_offset
    FROM employees e WHERE e.user_id = uid_maint LIMIT 1;
    -- CSA frontdesk
    INSERT INTO timesheets (employee_id, date, clock_in, clock_out, total_hours, status, created_at)
    SELECT e.id, CURRENT_DATE - day_offset, (CURRENT_DATE - day_offset)::timestamp + time '08:30:00', (CURRENT_DATE - day_offset)::timestamp + time '17:30:00', 9, 'approved', CURRENT_DATE - day_offset
    FROM employees e WHERE e.user_id = uid_csa_fd LIMIT 1;
  END LOOP;
  RAISE NOTICE 'Seeded HR data (leave requests + timesheets).';

  -- ==========================================================================
  -- 22. COMPLIANCE RECORDS
  -- ==========================================================================
  INSERT INTO compliance_records (property_id, certificate_type, reference_number, issued_date, expiry_date, status) VALUES
    (ovh_id, 'Fire Safety Certificate', 'FSC-OVH-2026', '2025-01-15', '2026-12-31', 'active'),
    (ovh_id, 'Liquor License', 'LL-OVH-2026', '2026-01-01', '2026-07-15', 'active'),
    (ovh_id, 'GST Registration', 'GST-33ABCDE1234F1Z5', '2020-06-01', '2027-05-31', 'active'),
    (ovh_id, 'Pollution Clearance', 'PCB-OVH-2024', '2024-01-10', '2026-01-10', 'expired'),
    (ovh_id, 'RERA Registration', 'RERA-OVH-2025', '2025-03-31', '2027-03-31', 'active'),
    (csa_id, 'Fire Safety Certificate', 'FSC-CSA-2026', '2025-03-01', '2026-10-31', 'active'),
    (csa_id, 'GST Registration', 'GST-33FGHIJ5678K1L9', '2021-04-01', '2027-03-31', 'active'),
    (gwr_id, 'RERA Registration', 'RERA-GWR-2025', '2025-06-01', '2027-06-01', 'active'),
    (ics_id, 'Trade License', 'TL-ICS-2026', '2026-01-01', '2026-12-31', 'active');
  RAISE NOTICE 'Seeded compliance records.';

  -- ==========================================================================
  -- 23. UPDATE UNIT STATUSES FOR REALISM
  -- ==========================================================================
  -- Set some OVH units to occupied for current active bookings
  UPDATE units SET status = 'occupied' WHERE id IN (
    SELECT u.id FROM bookings b JOIN units u ON u.id = b.unit_id
    WHERE b.status = 'checked_in' AND b.property_id = ovh_id AND u.status != 'occupied'
  );
  -- Set some to dirty just checked out
  UPDATE units SET status = 'dirty' WHERE id IN (
    SELECT u.id FROM bookings b JOIN units u ON u.id = b.unit_id
    WHERE b.status = 'checked_out' AND b.check_out >= CURRENT_DATE - 2 AND u.status != 'dirty'
  );

  -- ==========================================================================
  -- 24. UPDATE EMPLOYEE BANK/PF DETAILS
  -- ==========================================================================
  UPDATE employees SET
    bank_account = 'HDFC' || LPAD(floor(random() * 10000000000)::text, 11, '0'),
    bank_ifsc = 'HDFC000' || LPAD(floor(random() * 1000)::text, 4, '0'),
    pan_number = chr(65 + floor(random() * 26)::int) || chr(65 + floor(random() * 26)::int) || 'PPS' || LPAD(floor(random() * 9999)::text, 4, '0') || chr(65 + floor(random() * 26)::int),
    uan_number = LPAD(floor(random() * 999999999999)::text, 12, '0'),
    esi_number = LPAD(floor(random() * 9999999999)::text, 10, '0')
  WHERE bank_account IS NULL;
  RAISE NOTICE 'Updated employee bank/PF/PAN details.';

  RAISE NOTICE '============================================';
  RAISE NOTICE 'SEED V4 COMPLETE — All modules fully seeded!';
  RAISE NOTICE '============================================';
END $$;
