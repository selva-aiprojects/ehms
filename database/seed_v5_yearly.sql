-- ============================================================================
-- eHMS Yearly Demo Data — v5 (1-2 Years of Historical Workflow Data)
--   Adds 12-24 months of transactional data across ALL modules
--   Run AFTER seed_v4_full.sql (or any seed that sets up static data)
--   Designed as APPEND-ONLY — does NOT clear existing data
-- ============================================================================
-- Usage: psql -d <DATABASE_URL> -f database/seed_v5_yearly.sql
--        Or via: node -e "require('./scripts/run-seed-v5.js')"
-- ============================================================================

SET search_path TO viswa, public;

DO $$
DECLARE
  -- Property IDs
  ovh_id UUID; csa_id UUID; gwr_id UUID; ics_id UUID;
  -- User IDs (for created_by references)
  uid_admin UUID; uid_frontdesk UUID; uid_hk UUID; uid_maint UUID; uid_hr UUID; uid_finance UUID;
  uid_csa_fd UUID; uid_csa_hk UUID; uid_csa_mt UUID; uid_csa_hr UUID; uid_csa_fn UUID;
  uid_gwr_fd UUID; uid_gwr_hk UUID; uid_gwr_mt UUID; uid_gwr_fn UUID;
  uid_ics_fd UUID; uid_ics_mt UUID;
  -- Rate plan IDs
  rp_standard UUID; rp_deluxe UUID; rp_suite UUID; rp_weekly UUID; rp_weekly_std UUID;
  -- OVH room unit IDs (array for random assignment)
  ovh_rooms UUID[]; csa_suites UUID[]; gwr_apts UUID[]; ics_desks UUID[];
  -- Guest IDs (for booking references)
  guest_ids UUID[]; gid UUID;
  -- Employee IDs (for HR data)
  emp_ovh_fd UUID; emp_ovh_hk UUID; emp_ovh_mt UUID; emp_ovh_hr UUID; emp_ovh_fn UUID;
  emp_csa_fd UUID; emp_csa_hk UUID; emp_csa_mt UUID;
  -- Fiscal year IDs
  fy_2526_ovh UUID; fy_2627_ovh UUID;
  -- Chart of account IDs per property
  coa_ovh_room_rev UUID; coa_ovh_ar UUID; coa_ovh_fb_rev UUID;
  coa_csa_suite_rev UUID; coa_csa_ar UUID;
  -- Cost center IDs per property
  cc_ovh_fd UUID; cc_ovh_hk UUID; cc_ovh_mt UUID; cc_ovh_fb UUID;
  cc_csa_fd UUID; cc_csa_hk UUID; cc_csa_mt UUID;
  -- Vendor IDs
  vid_laundry UUID; vid_hvac UUID; vid_pest UUID; vid_plumbing UUID; vid_elevator UUID;
  -- Fixed Asset IDs
  fa_ovh_bldg UUID; fa_ovh_kitchen UUID; fa_ovh_laundry UUID; fa_ovh_furniture UUID; fa_ovh_it UUID; fa_ovh_vehicle UUID;
  fa_csa_bldg UUID; fa_csa_furniture UUID;
  -- Department IDs
  dept_ovh_fd UUID; dept_ovh_hk UUID; dept_ovh_mt UUID; dept_ovh_fn UUID; dept_ovh_hr UUID;
  -- Leave type ID
  lt_casual UUID; lt_sick UUID; lt_annual UUID; lt_comp_off UUID; lt_personal UUID;

  -- Loop variables
  rec record;
  i INT; j INT; m INT; w INT; d INT;
  year_start DATE := '2025-01-01';
  base_date DATE;
  curr_date DATE;
  je_id UUID;
  ticket_id UUID;
  task_id UUID;
  invoice_id UUID;
  payrun_id UUID;
  bill_id UUID;
  asset_id UUID;
  booking_id UUID;
  rent_inv_id UUID;
  rnd_val NUMERIC;
  day_offset INT;
  guest_count INT;
  adults INT;
  room_rate NUMERIC;
  checkin_date DATE;
  checkout_date DATE;
  stay_nights INT;
  unit_idx INT;
  existing_count INT;
BEGIN

  -- ==========================================================================
  -- 1. LOOKUP EXISTING IDs
  -- ==========================================================================
  SELECT id INTO ovh_id FROM properties WHERE code = 'OVH';
  SELECT id INTO csa_id FROM properties WHERE code = 'CSA';
  SELECT id INTO gwr_id FROM properties WHERE code = 'GWR';
  SELECT id INTO ics_id FROM properties WHERE code = 'ICS';

  SELECT id INTO uid_admin FROM users WHERE email = 'admin@ehms.demo';
  SELECT id INTO uid_frontdesk FROM users WHERE email = 'frontdesk@ehms.demo';
  SELECT id INTO uid_hk FROM users WHERE email = 'housekeeping@ehms.demo';
  SELECT id INTO uid_maint FROM users WHERE email = 'maintenance@ehms.demo';
  SELECT id INTO uid_hr FROM users WHERE email = 'hr@ehms.demo';
  SELECT id INTO uid_finance FROM users WHERE email = 'finance@ehms.demo';
  SELECT id INTO uid_csa_fd FROM users WHERE email = 'frontdesk.csa@ehms.demo';
  SELECT id INTO uid_csa_hk FROM users WHERE email = 'housekeeping.csa@ehms.demo';
  SELECT id INTO uid_csa_mt FROM users WHERE email = 'maintenance.csa@ehms.demo';
  SELECT id INTO uid_csa_hr FROM users WHERE email = 'hr.csa@ehms.demo';
  SELECT id INTO uid_csa_fn FROM users WHERE email = 'finance.csa@ehms.demo';
  SELECT id INTO uid_gwr_fd FROM users WHERE email = 'frontdesk.gwr@ehms.demo';
  SELECT id INTO uid_gwr_hk FROM users WHERE email = 'housekeeping.gwr@ehms.demo';
  SELECT id INTO uid_gwr_mt FROM users WHERE email = 'maintenance.gwr@ehms.demo';
  SELECT id INTO uid_gwr_fn FROM users WHERE email = 'finance.gwr@ehms.demo';
  SELECT id INTO uid_ics_fd FROM users WHERE email = 'frontdesk.ics@ehms.demo';
  SELECT id INTO uid_ics_mt FROM users WHERE email = 'maintenance.ics@ehms.demo';

  -- Rate plans
  SELECT id INTO rp_standard FROM rate_plans WHERE name = 'Standard' AND unit_type = 'room' AND property_id = ovh_id LIMIT 1;
  SELECT id INTO rp_deluxe FROM rate_plans WHERE name = 'Deluxe' AND unit_type = 'room' AND property_id = ovh_id LIMIT 1;
  SELECT id INTO rp_suite FROM rate_plans WHERE name = 'Suite' AND unit_type = 'room' AND property_id = ovh_id LIMIT 1;
  SELECT id INTO rp_weekly FROM rate_plans WHERE name ILIKE '%week%' AND property_id = csa_id LIMIT 1;
  SELECT id INTO rp_weekly_std FROM rate_plans WHERE name ILIKE '%weekly%standard%' AND property_id = csa_id LIMIT 1;

  -- Collect unit IDs into arrays
  SELECT array_agg(u.id ORDER BY u.unit_label) INTO ovh_rooms
  FROM units u JOIN floors f ON f.id = u.floor_id JOIN buildings b ON b.id = f.building_id WHERE b.property_id = ovh_id AND u.unit_type = 'room';
  SELECT array_agg(u.id ORDER BY u.unit_label) INTO csa_suites
  FROM units u JOIN floors f ON f.id = u.floor_id JOIN buildings b ON b.id = f.building_id WHERE b.property_id = csa_id;
  SELECT array_agg(u.id ORDER BY u.unit_label) INTO gwr_apts
  FROM units u JOIN floors f ON f.id = u.floor_id JOIN buildings b ON b.id = f.building_id WHERE b.property_id = gwr_id;
  SELECT array_agg(u.id ORDER BY u.unit_label) INTO ics_desks
  FROM units u JOIN floors f ON f.id = u.floor_id JOIN buildings b ON b.id = f.building_id WHERE b.property_id = ics_id;

  -- Fiscal years
  SELECT id INTO fy_2526_ovh FROM fiscal_years WHERE name = 'FY 2025-2026' AND property_id = ovh_id LIMIT 1;
  SELECT id INTO fy_2627_ovh FROM fiscal_years WHERE name = 'FY 2026-2027' AND property_id = ovh_id LIMIT 1;

  -- Chart of accounts
  SELECT id INTO coa_ovh_room_rev FROM chart_of_accounts WHERE account_code = '4001' AND property_id = ovh_id LIMIT 1;
  SELECT id INTO coa_ovh_ar FROM chart_of_accounts WHERE account_code = '1010' AND property_id = ovh_id LIMIT 1;
  SELECT id INTO coa_ovh_fb_rev FROM chart_of_accounts WHERE account_code = '4002' AND property_id = ovh_id LIMIT 1;
  SELECT id INTO coa_csa_suite_rev FROM chart_of_accounts WHERE account_code = '4001' AND property_id = csa_id LIMIT 1;
  SELECT id INTO coa_csa_ar FROM chart_of_accounts WHERE account_code = '1010' AND property_id = csa_id LIMIT 1;

  -- Cost centers
  SELECT id INTO cc_ovh_fd FROM cost_centers WHERE code = 'CC-FD' AND property_id = ovh_id LIMIT 1;
  SELECT id INTO cc_ovh_hk FROM cost_centers WHERE code = 'CC-HK' AND property_id = ovh_id LIMIT 1;
  SELECT id INTO cc_ovh_mt FROM cost_centers WHERE code = 'CC-MT' AND property_id = ovh_id LIMIT 1;
  SELECT id INTO cc_ovh_fb FROM cost_centers WHERE code = 'CC-FB' AND property_id = ovh_id LIMIT 1;

  -- Vendors
  SELECT id INTO vid_laundry FROM vendors WHERE company_name ILIKE '%laundry%' LIMIT 1;
  SELECT id INTO vid_hvac FROM vendors WHERE company_name ILIKE '%hvac%' LIMIT 1;
  SELECT id INTO vid_pest FROM vendors WHERE company_name ILIKE '%pest%' LIMIT 1;
  SELECT id INTO vid_plumbing FROM vendors WHERE company_name ILIKE '%plumbing%' LIMIT 1;
  SELECT id INTO vid_elevator FROM vendors WHERE company_name ILIKE '%elevator%' LIMIT 1;

  -- Fixed assets
  SELECT id INTO fa_ovh_bldg FROM fixed_assets WHERE asset_code = 'FA-OVH-BLDG-001' LIMIT 1;
  SELECT id INTO fa_ovh_kitchen FROM fixed_assets WHERE asset_code = 'FA-OVH-EQP-KIT-001' LIMIT 1;
  SELECT id INTO fa_ovh_laundry FROM fixed_assets WHERE asset_code = 'FA-OVH-EQP-LAU-001' LIMIT 1;
  SELECT id INTO fa_ovh_furniture FROM fixed_assets WHERE asset_code = 'FA-OVH-FURN-001' LIMIT 1;
  SELECT id INTO fa_ovh_it FROM fixed_assets WHERE asset_code = 'FA-OVH-IT-001' LIMIT 1;
  SELECT id INTO fa_ovh_vehicle FROM fixed_assets WHERE asset_code = 'FA-OVH-VEH-001' LIMIT 1;
  SELECT id INTO fa_csa_bldg FROM fixed_assets WHERE asset_code = 'FA-CSA-BLDG-001' LIMIT 1;
  SELECT id INTO fa_csa_furniture FROM fixed_assets WHERE asset_code = 'FA-CSA-FURN-001' LIMIT 1;

  -- Employees
  SELECT e.id INTO emp_ovh_fd FROM employees e JOIN users u ON u.id = e.user_id WHERE u.email = 'frontdesk@ehms.demo' LIMIT 1;
  SELECT e.id INTO emp_ovh_hk FROM employees e JOIN users u ON u.id = e.user_id WHERE u.email = 'housekeeping@ehms.demo' LIMIT 1;
  SELECT e.id INTO emp_ovh_mt FROM employees e JOIN users u ON u.id = e.user_id WHERE u.email = 'maintenance@ehms.demo' LIMIT 1;
  SELECT e.id INTO emp_ovh_hr FROM employees e JOIN users u ON u.id = e.user_id WHERE u.email = 'hr@ehms.demo' LIMIT 1;
  SELECT e.id INTO emp_ovh_fn FROM employees e JOIN users u ON u.id = e.user_id WHERE u.email = 'finance@ehms.demo' LIMIT 1;
  SELECT e.id INTO emp_csa_fd FROM employees e JOIN users u ON u.id = e.user_id WHERE u.email = 'frontdesk.csa@ehms.demo' LIMIT 1;
  SELECT e.id INTO emp_csa_hk FROM employees e JOIN users u ON u.id = e.user_id WHERE u.email = 'housekeeping.csa@ehms.demo' LIMIT 1;
  SELECT e.id INTO emp_csa_mt FROM employees e JOIN users u ON u.id = e.user_id WHERE u.email = 'maintenance.csa@ehms.demo' LIMIT 1;

  -- Departments
  SELECT id INTO dept_ovh_fd FROM departments WHERE code = 'FD' AND property_id = ovh_id LIMIT 1;
  SELECT id INTO dept_ovh_hk FROM departments WHERE code = 'HK' AND property_id = ovh_id LIMIT 1;
  SELECT id INTO dept_ovh_mt FROM departments WHERE code = 'MT' AND property_id = ovh_id LIMIT 1;
  SELECT id INTO dept_ovh_fn FROM departments WHERE code = 'FN' AND property_id = ovh_id LIMIT 1;
  SELECT id INTO dept_ovh_hr FROM departments WHERE code = 'HR' AND property_id = ovh_id LIMIT 1;

  -- Leave types
  SELECT id INTO lt_casual FROM leave_types WHERE code = 'CASUAL' LIMIT 1;
  SELECT id INTO lt_sick FROM leave_types WHERE code = 'SICK' LIMIT 1;
  SELECT id INTO lt_annual FROM leave_types WHERE code = 'ANNUAL' LIMIT 1;
  SELECT id INTO lt_comp_off FROM leave_types WHERE code = 'COMPOFF' LIMIT 1;
  SELECT id INTO lt_personal FROM leave_types WHERE code = 'PERSONAL' LIMIT 1;

  RAISE NOTICE 'Lookup complete. Properties: OVH=%, CSA=%, GWR=%, ICS=%', ovh_id, csa_id, gwr_id, ics_id;
  RAISE NOTICE 'OVH rooms count: %, CSA suites: %, GWR apts: %, ICS desks: %',
    array_length(ovh_rooms, 1), array_length(csa_suites, 1), array_length(gwr_apts, 1), array_length(ics_desks, 1);

  -- ==================================================================
  -- 2. GUEST PROFILES (+100 additional guests across India)
  -- ==================================================================
  SELECT COUNT(*) INTO existing_count FROM guest_profiles;
  RAISE NOTICE 'Existing guests: %. Adding 100 more...', existing_count;

  INSERT INTO guest_profiles (first_name, last_name, email, phone, id_type, id_number, nationality) VALUES
    ('Aarav', 'Sharma', 'aarav.sharma@email.com', '9812345670', 'Aadhaar', '1234-5678-9012', 'Indian'),
    ('Vivaan', 'Verma', 'vivaan.verma@email.com', '9812345671', 'Aadhaar', '1234-5678-9013', 'Indian'),
    ('Aditya', 'Patel', 'aditya.patel@email.com', '9812345672', 'Aadhaar', '1234-5678-9014', 'Indian'),
    ('Vihaan', 'Singh', 'vihaan.singh@email.com', '9812345673', 'Passport', 'Z1234567', 'Indian'),
    ('Arjun', 'Reddy', 'arjun.reddy@email.com', '9812345674', 'Aadhaar', '1234-5678-9015', 'Indian'),
    ('Sai', 'Kumar', 'sai.kumar@email.com', '9812345675', 'Aadhaar', '1234-5678-9016', 'Indian'),
    ('Anaya', 'Gupta', 'anaya.gupta@email.com', '9812345676', 'Passport', 'Z1234568', 'Indian'),
    ('Ishita', 'Joshi', 'ishita.joshi@email.com', '9812345677', 'Aadhaar', '1234-5678-9017', 'Indian'),
    ('Myra', 'Nair', 'myra.nair@email.com', '9812345678', 'Passport', 'Z1234569', 'Indian'),
    ('Aanya', 'Desai', 'aanya.desai@email.com', '9812345679', 'Aadhaar', '1234-5678-9018', 'Indian'),
    ('Kabir', 'Malhotra', 'kabir.malhotra@email.com', '9823456780', 'Passport', 'Z1234570', 'Indian'),
    ('Reyansh', 'Bose', 'reyansh.bose@email.com', '9823456781', 'Aadhaar', '1234-5678-9019', 'Indian'),
    ('Aarav', 'Menon', 'aarav.menon@email.com', '9823456782', 'Passport', 'Z1234571', 'Indian'),
    ('Ananya', 'Rao', 'ananya.rao@email.com', '9823456783', 'Aadhaar', '1234-5678-9020', 'Indian'),
    ('Diya', 'Iyer', 'diya.iyer@email.com', '9823456784', 'Aadhaar', '1234-5678-9021', 'Indian'),
    ('Ishaan', 'Chatterjee', 'ishaan.chatterjee@email.com', '9823456785', 'Passport', 'Z1234572', 'Indian'),
    ('Krishna', 'Shetty', 'krishna.shetty@email.com', '9823456786', 'Aadhaar', '1234-5678-9022', 'Indian'),
    ('Ayaan', 'Aggarwal', 'ayaan.aggarwal@email.com', '9823456787', 'Passport', 'Z1234573', 'Indian'),
    ('Pari', 'Mishra', 'pari.mishra@email.com', '9823456788', 'Aadhaar', '1234-5678-9023', 'Indian'),
    ('Shanaya', 'Kaur', 'shanaya.kaur@email.com', '9823456789', 'Aadhaar', '1234-5678-9024', 'Indian'),
    ('Dhruv', 'Nayar', 'dhruv.nayar@email.com', '9834567890', 'Passport', 'Z1234574', 'Indian'),
    ('Shaurya', 'Bajaj', 'shaurya.bajaj@email.com', '9834567891', 'Aadhaar', '1234-5678-9025', 'Indian'),
    ('Rudra', 'Saxena', 'rudra.saxena@email.com', '9834567892', 'Aadhaar', '1234-5678-9026', 'Indian'),
    ('Prisha', 'Pillai', 'prisha.pillai@email.com', '9834567893', 'Passport', 'Z1234575', 'Indian'),
    ('Sara', 'Thakur', 'sara.thakur@email.com', '9834567894', 'Aadhaar', '1234-5678-9027', 'Indian'),
    ('Anvi', 'Gokhale', 'anvi.gokhale@email.com', '9834567895', 'Aadhaar', '1234-5678-9028', 'Indian'),
    ('Yash', 'Bhatt', 'yash.bhatt@email.com', '9834567896', 'Aadhaar', '1234-5678-9029', 'Indian'),
    ('Aarush', 'Pandey', 'aarush.pandey@email.com', '9834567897', 'Passport', 'Z1234576', 'Indian'),
    ('Saanvi', 'Tripathi', 'saanvi.tripathi@email.com', '9834567898', 'Aadhaar', '1234-5678-9030', 'Indian'),
    ('Navya', 'Chopra', 'navya.chopra@email.com', '9834567899', 'Aadhaar', '1234-5678-9031', 'Indian'),
    ('Aadhya', 'Srinivas', 'aadhya.srinivas@email.com', '9845678900', 'Passport', 'Z1234577', 'Indian'),
    ('Advik', 'Raman', 'advik.raman@email.com', '9845678901', 'Aadhaar', '1234-5678-9032', 'Indian'),
    ('Atharv', 'Krishnan', 'atharv.krishnan@email.com', '9845678902', 'Aadhaar', '1234-5678-9033', 'Indian'),
    ('Darsh', 'Prabhu', 'darsh.prabhu@email.com', '9845678903', 'Passport', 'Z1234578', 'Indian'),
    ('Dhriti', 'Kohli', 'dhriti.kohli@email.com', '9845678904', 'Aadhaar', '1234-5678-9034', 'Indian'),
    ('Hrishita', 'Sethi', 'hrishita.sethi@email.com', '9845678905', 'Aadhaar', '1234-5678-9035', 'Indian'),
    ('Kiara', 'Rawat', 'kiara.rawat@email.com', '9845678906', 'Aadhaar', '1234-5678-9036', 'Indian'),
    ('Kiaan', 'Das', 'kiaan.das@email.com', '9845678907', 'Passport', 'Z1234579', 'Indian'),
    ('Madhav', 'Dutta', 'madhav.dutta@email.com', '9845678908', 'Aadhaar', '1234-5678-9037', 'Indian'),
    ('Rohan', 'Khanna', 'rohan.khanna@email.com', '9845678909', 'Aadhaar', '1234-5678-9038', 'Indian'),
    ('Neha', 'Mehta', 'neha.mehta@email.com', '9856789010', 'Passport', 'Z1234580', 'Indian'),
    ('Ravi', 'Shankar', 'ravi.shankar@email.com', '9856789011', 'Aadhaar', '1234-5678-9039', 'Indian'),
    ('Priya', 'Subramaniam', 'priya.sub@email.com', '9856789012', 'Aadhaar', '1234-5678-9040', 'Indian'),
    ('Amit', 'Bharadwaj', 'amit.bharadwaj@email.com', '9856789013', 'Aadhaar', '1234-5678-9041', 'Indian'),
    ('Sunita', 'Pillai', 'sunita.pillai@email.com', '9856789014', 'Passport', 'Z1234581', 'Indian'),
    ('Vikram', 'Seth', 'vikram.seth@email.com', '9856789015', 'Aadhaar', '1234-5678-9042', 'Indian'),
    ('Deepa', 'Venkatesh', 'deepa.venkatesh@email.com', '9856789016', 'Aadhaar', '1234-5678-9043', 'Indian'),
    ('Manoj', 'Tiwari', 'manoj.tiwari@email.com', '9856789017', 'Passport', 'Z1234582', 'Indian'),
    ('Lalitha', 'Gopal', 'lalitha.gopal@email.com', '9856789018', 'Aadhaar', '1234-5678-9044', 'Indian'),
    ('Suresh', 'Naidu', 'suresh.naidu@email.com', '9856789019', 'Aadhaar', '1234-5678-9045', 'Indian'),
    ('Kavita', 'Jain', 'kavita.jain@email.com', '9867890120', 'Passport', 'Z1234583', 'Indian'),
    ('Prakash', 'Shinde', 'prakash.shinde@email.com', '9867890121', 'Aadhaar', '1234-5678-9046', 'Indian'),
    ('Geeta', 'Nambiar', 'geeta.nambiar@email.com', '9867890122', 'Aadhaar', '1234-5678-9047', 'Indian'),
    ('Rajesh', 'Bhatia', 'rajesh.bhatia@email.com', '9867890123', 'Passport', 'Z1234584', 'Indian'),
    ('Anjali', 'Dixit', 'anjali.dixit@email.com', '9867890124', 'Aadhaar', '1234-5678-9048', 'Indian'),
    ('Sanjay', 'Gill', 'sanjay.gill@email.com', '9867890125', 'Aadhaar', '1234-5678-9049', 'Indian'),
    ('Meena', 'Prakash', 'meena.prakash@email.com', '9867890126', 'Aadhaar', '1234-5678-9050', 'Indian'),
    ('Vijay', 'Kulkarni', 'vijay.kulkarni@email.com', '9867890127', 'Passport', 'Z1234585', 'Indian'),
    ('Aruna', 'Sundaram', 'aruna.sundaram@email.com', '9867890128', 'Aadhaar', '1234-5678-9051', 'Indian'),
    ('Nitin', 'Wagh', 'nitin.wagh@email.com', '9867890129', 'Aadhaar', '1234-5678-9052', 'Indian'),
    ('Pooja', 'More', 'pooja.more@email.com', '9878901230', 'Passport', 'Z1234586', 'Indian'),
    ('Karthik', 'Rajan', 'karthik.rajan@email.com', '9878901231', 'Aadhaar', '1234-5678-9053', 'Indian'),
    ('Divya', 'Rathore', 'divya.rathore@email.com', '9878901232', 'Aadhaar', '1234-5678-9054', 'Indian'),
    ('Akash', 'Mistry', 'akash.mistry@email.com', '9878901233', 'Aadhaar', '1234-5678-9055', 'Indian'),
    ('Shweta', 'Kar', 'shweta.kar@email.com', '9878901234', 'Passport', 'Z1234587', 'Indian'),
    ('Abhishek', 'Lal', 'abhishek.lal@email.com', '9878901235', 'Aadhaar', '1234-5678-9056', 'Indian'),
    ('Tanvi', 'Bapat', 'tanvi.bapat@email.com', '9878901236', 'Aadhaar', '1234-5678-9057', 'Indian'),
    ('Rahul', 'Choudhury', 'rahul.choudhury@email.com', '9878901237', 'Aadhaar', '1234-5678-9058', 'Indian'),
    ('Shreya', 'Parikh', 'shreya.parikh@email.com', '9878901238', 'Passport', 'Z1234588', 'Indian'),
    ('Varun', 'Shetgaonkar', 'varun.shet@email.com', '9878901239', 'Aadhaar', '1234-5678-9059', 'Indian'),
    ('Nandini', 'Patwardhan', 'nandini.pat@email.com', '9889012340', 'Aadhaar', '1234-5678-9060', 'Indian'),
    ('Gaurav', 'Sood', 'gaurav.sood@email.com', '9889012341', 'Passport', 'Z1234589', 'Indian'),
    ('Tara', 'Balan', 'tara.balan@email.com', '9889012342', 'Aadhaar', '1234-5678-9061', 'Indian'),
    ('Uday', 'Chawla', 'uday.chawla@email.com', '9889012343', 'Aadhaar', '1234-5678-9062', 'Indian'),
    ('Lavanya', 'Kini', 'lavanya.kini@email.com', '9889012344', 'Aadhaar', '1234-5678-9063', 'Indian'),
    ('Arvind', 'Swamy', 'arvind.swamy@email.com', '9889012345', 'Passport', 'Z1234590', 'Indian'),
    ('Sneha', 'Biswas', 'sneha.biswas@email.com', '9889012346', 'Aadhaar', '1234-5678-9064', 'Indian'),
    ('Dinesh', 'Yadav', 'dinesh.yadav@email.com', '9889012347', 'Aadhaar', '1234-5678-9065', 'Indian'),
    ('Ritu', 'Mukherjee', 'ritu.mukherjee@email.com', '9889012348', 'Aadhaar', '1234-5678-9066', 'Indian'),
    ('Mahesh', 'Kini', 'mahesh.kini@email.com', '9889012349', 'Passport', 'Z1234591', 'Indian'),
    ('Bhavna', 'Sahni', 'bhavna.sahni@email.com', '9890123450', 'Aadhaar', '1234-5678-9067', 'Indian'),
    ('Harish', 'Babu', 'harish.babu@email.com', '9890123451', 'Aadhaar', '1234-5678-9068', 'Indian'),
    ('Chitra', 'Anand', 'chitra.anand@email.com', '9890123452', 'Aadhaar', '1234-5678-9069', 'Indian'),
    ('Venkatesh', 'Rao', 'venkatesh.rao@email.com', '9890123453', 'Passport', 'Z1234592', 'Indian'),
    ('Vandana', 'Suri', 'vandana.suri@email.com', '9890123454', 'Aadhaar', '1234-5678-9070', 'Indian'),
    ('Murugan', 'Pillai', 'murugan.pillai@email.com', '9890123455', 'Aadhaar', '1234-5678-9071', 'Indian'),
    ('Shweta', 'Dubey', 'shweta.dubey@email.com', '9890123456', 'Aadhaar', '1234-5678-9072', 'Indian'),
    ('Ganesh', 'Hegde', 'ganesh.hegde@email.com', '9890123457', 'Passport', 'Z1234593', 'Indian'),
    ('Radhika', 'Shenoy', 'radhika.shenoy@email.com', '9890123458', 'Aadhaar', '1234-5678-9073', 'Indian'),
    ('Siddharth', 'Kapoor', 'siddharth.kapoor@email.com', '9890123459', 'Aadhaar', '1234-5678-9074', 'Indian');
  RAISE NOTICE 'Added 85 guest profiles.';

  -- Collect new guest IDs into array
  SELECT array_agg(id ORDER BY created_at DESC) INTO guest_ids
  FROM guest_profiles
  WHERE email LIKE '%@email.com';
  guest_count := array_length(guest_ids, 1);
  RAISE NOTICE 'Total guest pool: %', guest_count;

  -- ==================================================================
  -- 3. BOOKINGS — OVH (5-8 per week for 18 months = ~500 bookings)
  -- ==================================================================
  RAISE NOTICE 'Generating OVH bookings...';
  base_date := '2025-06-01';

  FOR w IN 0..77 LOOP  -- 78 weeks ≈ 18 months
    -- Generate 5-8 bookings per week (random)
    j := 5 + (random() * 3)::int;
    FOR i IN 1..j LOOP
      -- Pick random guest
      gid := guest_ids[1 + (random() * (guest_count - 1))::int];
      -- Pick random room
      unit_idx := 1 + (random() * (array_length(ovh_rooms, 1) - 1))::int;
      -- Generate booking dates (2-5 night stays)
      stay_nights := 2 + (random() * 3)::int;
      checkin_date := base_date + (w * 7) + (random() * 6)::int;
      checkout_date := checkin_date + stay_nights;
      adults := 1 + (random() * 2)::int;
      room_rate := CASE
        WHEN random() < 0.3 THEN 2800 + random() * 500  -- standard
        WHEN random() < 0.6 THEN 3500 + random() * 800  -- deluxe
        ELSE 4500 + random() * 1500  -- suite
      END;
      rnd_val := room_rate * stay_nights;

      -- Insert booking — past bookings are checked_out, recent are mixed
      IF checkout_date < CURRENT_DATE - 60 THEN
        INSERT INTO bookings (property_id, unit_id, guest_id, source, booking_model, status, check_in, check_out, adults, total_amount, paid_amount, created_at)
        VALUES (ovh_id, ovh_rooms[unit_idx], gid,
          CASE WHEN random() < 0.3 THEN 'direct' WHEN random() < 0.5 THEN 'booking.com' WHEN random() < 0.7 THEN 'expedia' ELSE 'makemytrip' END,
          'nightly'::booking_model,
          'checked_out'::booking_status, checkin_date, checkout_date, adults, rnd_val, rnd_val,
          checkin_date - interval '30 days')
        ON CONFLICT DO NOTHING;
      ELSIF checkout_date < CURRENT_DATE THEN
        INSERT INTO bookings (property_id, unit_id, guest_id, source, booking_model, status, check_in, check_out, adults, total_amount, paid_amount, created_at)
        VALUES (ovh_id, ovh_rooms[unit_idx], gid,
          CASE WHEN random() < 0.3 THEN 'direct' WHEN random() < 0.5 THEN 'booking.com' WHEN random() < 0.7 THEN 'expedia' ELSE 'goibibo' END,
          'nightly'::booking_model,
          (CASE WHEN random() < 0.7 THEN 'checked_out' ELSE 'checked_in' END)::booking_status,
          checkin_date, checkout_date, adults, rnd_val,
          CASE WHEN random() < 0.8 THEN rnd_val ELSE rnd_val * 0.3 END,
          checkin_date - interval '14 days')
        ON CONFLICT DO NOTHING;
      ELSE
        INSERT INTO bookings (property_id, unit_id, guest_id, source, booking_model, status, check_in, check_out, adults, total_amount, paid_amount, created_at)
        VALUES (ovh_id, ovh_rooms[unit_idx], gid,
          CASE WHEN random() < 0.3 THEN 'direct' WHEN random() < 0.4 THEN 'booking.com' ELSE 'makemytrip' END,
          'nightly'::booking_model,
          (CASE WHEN random() < 0.5 THEN 'confirmed' ELSE 'pending' END)::booking_status,
          checkin_date, checkout_date, adults, rnd_val, 0,
          CURRENT_DATE - (random() * 30)::int)
        ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;
    IF w % 13 = 0 THEN
      RAISE NOTICE '  OVH bookings: week %/78 done', w;
    END IF;
  END LOOP;
  RAISE NOTICE 'OVH bookings generated.';

  -- ==================================================================
  -- 4. BOOKINGS — CSA (3-5 per week for 12 months = ~200 bookings)
  -- ==================================================================
  RAISE NOTICE 'Generating CSA bookings...';
  base_date := '2025-12-01';

  FOR w IN 0..51 LOOP  -- 52 weeks = 12 months
    j := 3 + (random() * 2)::int;
    FOR i IN 1..j LOOP
      gid := guest_ids[1 + (random() * (guest_count - 1))::int];
      unit_idx := 1 + (random() * (array_length(csa_suites, 1) - 1))::int;
      stay_nights := 3 + (random() * 7)::int;  -- longer stays for apartments
      checkin_date := base_date + (w * 7) + (random() * 5)::int;
      checkout_date := checkin_date + stay_nights;
      adults := 1 + (random() * 3)::int;
      room_rate := 2000 + random() * 2000;
      rnd_val := room_rate * stay_nights;

      IF checkout_date < CURRENT_DATE - 30 THEN
        INSERT INTO bookings (property_id, unit_id, guest_id, source, booking_model, status, check_in, check_out, adults, total_amount, paid_amount, created_at)
        VALUES (csa_id, csa_suites[unit_idx], gid,
          CASE WHEN random() < 0.4 THEN 'direct' WHEN random() < 0.6 THEN 'booking.com' ELSE 'makemytrip' END,
          'nightly'::booking_model,
          'checked_out'::booking_status, checkin_date, checkout_date, adults, rnd_val, rnd_val,
          checkin_date - interval '14 days')
        ON CONFLICT DO NOTHING;
      ELSIF checkout_date < CURRENT_DATE THEN
        INSERT INTO bookings (property_id, unit_id, guest_id, source, booking_model, status, check_in, check_out, adults, total_amount, paid_amount, created_at)
        VALUES (csa_id, csa_suites[unit_idx], gid,
          CASE WHEN random() < 0.4 THEN 'direct' ELSE 'booking.com' END,
          'nightly'::booking_model,
          (CASE WHEN random() < 0.6 THEN 'checked_out' ELSE 'checked_in' END)::booking_status,
          checkin_date, checkout_date, adults, rnd_val, rnd_val * 0.5,
          checkin_date - interval '7 days')
        ON CONFLICT DO NOTHING;
      ELSE
        INSERT INTO bookings (property_id, unit_id, guest_id, source, booking_model, status, check_in, check_out, adults, total_amount, paid_amount, created_at)
        VALUES (csa_id, csa_suites[unit_idx], gid,
          'direct',
          'nightly'::booking_model,
          (CASE WHEN random() < 0.4 THEN 'confirmed' ELSE 'pending' END)::booking_status,
          checkin_date, checkout_date, adults, rnd_val, 0, CURRENT_DATE)
        ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;
    IF w % 13 = 0 THEN RAISE NOTICE '  CSA bookings: week %/52 done', w; END IF;
  END LOOP;
  RAISE NOTICE 'CSA bookings generated.';

  -- ==================================================================
  -- 5. BOOKINGS — ICS Workplace (10-15 per week for 12 months)
  -- ==================================================================
  RAISE NOTICE 'Generating ICS workplace bookings...';
  base_date := '2026-01-01';

  FOR w IN 0..51 LOOP
    j := 10 + (random() * 5)::int;
    FOR i IN 1..j LOOP
      gid := guest_ids[1 + (random() * (guest_count - 1))::int];
      unit_idx := 1 + (random() * (array_length(ics_desks, 1) - 1))::int;
      checkin_date := base_date + (w * 7) + (random() * 4)::int;
      -- Day pass or half-day
      INSERT INTO workplace_bookings (property_id, unit_id, member_id, booking_type, start_time, end_time, status, created_at)
      VALUES (ics_id, ics_desks[unit_idx], gid,
        CASE WHEN random() < 0.7 THEN 'dedicated_seat' ELSE 'meeting_room' END,
        (checkin_date + time '09:00:00')::timestamp,
        (checkin_date + CASE WHEN random() < 0.5 THEN time '18:00:00' ELSE time '13:00:00' END)::timestamp,
        (CASE WHEN checkin_date < CURRENT_DATE THEN 'checked_in' ELSE 'confirmed' END)::booking_status,
        checkin_date - interval '3 days')
      ON CONFLICT DO NOTHING;
    END LOOP;
    IF w % 13 = 0 THEN RAISE NOTICE '  ICS bookings: week %/52 done', w; END IF;
  END LOOP;
  RAISE NOTICE 'ICS workplace bookings generated.';

  -- ==================================================================
  -- 6. LEASE AGREEMENTS — GWR (12 leases over 18 months)
  -- ==================================================================
  RAISE NOTICE 'Generating GWR lease agreements...';
  FOR i IN 1..12 LOOP
    gid := guest_ids[1 + (random() * (guest_count - 1))::int];
    unit_idx := 1 + (random() * (array_length(gwr_apts, 1) - 1))::int;
    base_date := '2025-03-01'::date + (i * 40);
    rnd_val := 18000 + random() * 15000;  -- monthly rent 18k-33k

    INSERT INTO lease_agreements (property_id, unit_id, tenant_id, start_date, end_date, rent_amount, security_deposit, status, created_at, agreement_ref)
    VALUES (gwr_id, gwr_apts[unit_idx], gid, base_date, base_date + interval '11 months', rnd_val, rnd_val * 2,
      (CASE WHEN base_date + interval '11 months' < CURRENT_DATE THEN 'terminated' ELSE 'active' END)::lease_status,
      base_date - interval '14 days',
      'AGR-GWR-' || LPAD(i::text, 4, '0'))
    ON CONFLICT DO NOTHING
    RETURNING id INTO rent_inv_id;

    -- Generate monthly rent invoices for active-terminated leases
    IF rent_inv_id IS NOT NULL THEN
      FOR m IN 0..11 LOOP
        curr_date := base_date + (m * interval '1 month');
        IF curr_date < CURRENT_DATE THEN
          INSERT INTO rent_invoices (lease_id, invoice_number, period_start, period_end, rent_amount, due_date, status, paid_amount, paid_at)
          VALUES (rent_inv_id, 'RENT-INV-GWR-' || LPAD(i::text, 3, '0') || '-' || LPAD((m+1)::text, 2, '0'),
            curr_date, curr_date + interval '1 month' - interval '1 day', rnd_val, curr_date + 5,
            (CASE WHEN curr_date + 5 < CURRENT_DATE THEN 'paid' ELSE 'sent' END)::invoice_status,
            CASE WHEN curr_date + 5 < CURRENT_DATE THEN rnd_val ELSE 0 END,
            CASE WHEN curr_date + 5 < CURRENT_DATE THEN curr_date + 5 + (random() * 3)::int ELSE NULL END)
          ON CONFLICT DO NOTHING;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
  RAISE NOTICE 'GWR lease agreements generated.';

  -- ==================================================================
  -- 7. JOURNAL ENTRIES — OVH (weekly revenue for 18 months = ~78 entries)
  -- ==================================================================
  RAISE NOTICE 'Generating OVH journal entries...';
  FOR w IN 0..77 LOOP
    IF coa_ovh_room_rev IS NOT NULL AND coa_ovh_ar IS NOT NULL THEN
      curr_date := '2025-06-01'::date + (w * 7);
      rnd_val := 300000 + random() * 400000;  -- weekly room revenue
      INSERT INTO journal_entries (property_id, entry_date, journal_type, description, created_by)
      VALUES (ovh_id, curr_date, 'revenue', 'Weekly room revenue ' || curr_date::text, uid_finance)
      RETURNING id INTO je_id;
      INSERT INTO journal_lines (journal_id, account_id, debit, credit, description)
      VALUES (je_id, coa_ovh_room_rev, 0, rnd_val, 'Room revenue week ' || curr_date::text);
      INSERT INTO journal_lines (journal_id, account_id, debit, credit, description)
      VALUES (je_id, coa_ovh_ar, rnd_val, 0, 'Accounts receivable');
    END IF;
    IF w % 13 = 0 THEN RAISE NOTICE '  OVH JE: week %/78 done', w; END IF;
  END LOOP;
  RAISE NOTICE 'OVH journal entries generated.';

  -- ==================================================================
  -- 8. JOURNAL ENTRIES — CSA (biweekly for 12 months)
  -- ==================================================================
  IF coa_csa_suite_rev IS NOT NULL AND coa_csa_ar IS NOT NULL THEN
    FOR w IN 0..25 LOOP
      curr_date := '2026-01-01'::date + (w * 14);
      rnd_val := 100000 + random() * 150000;
      INSERT INTO journal_entries (property_id, entry_date, journal_type, description, created_by)
      VALUES (csa_id, curr_date, 'revenue', 'Suite revenue ' || curr_date::text, uid_csa_fn)
      RETURNING id INTO je_id;
      INSERT INTO journal_lines (journal_id, account_id, debit, credit, description)
      VALUES (je_id, coa_csa_suite_rev, 0, rnd_val, 'Suite revenue');
      INSERT INTO journal_lines (journal_id, account_id, debit, credit, description)
      VALUES (je_id, coa_csa_ar, rnd_val, 0, 'Receivables');
    END LOOP;
    RAISE NOTICE 'CSA journal entries generated.';
  END IF;

  -- ==================================================================
  -- 9. BUDGET ENTRIES — OVH FY 2026-2027 (monthly, all heads)
  -- ==================================================================
  IF fy_2627_ovh IS NOT NULL THEN
    FOR m IN 0..11 LOOP
      FOR rec IN
        SELECT id FROM budget_heads WHERE property_id = ovh_id
      LOOP
        INSERT INTO budget_entries (budget_head_id, fiscal_year_id, period_month, budget_amount)
        VALUES (rec.id, fy_2627_ovh, ((3 + m) % 12) + 1,
          CASE WHEN (SELECT code FROM budget_heads WHERE id = rec.id) = 'BH-RR' THEN 3000000 + random() * 500000
               WHEN (SELECT code FROM budget_heads WHERE id = rec.id) = 'BH-SAL' THEN 1200000 + random() * 100000
               WHEN (SELECT code FROM budget_heads WHERE id = rec.id) = 'BH-HK' THEN 200000 + random() * 50000
               WHEN (SELECT code FROM budget_heads WHERE id = rec.id) = 'BH-MT' THEN 150000 + random() * 40000
               ELSE 100000 + random() * 30000 END)
        ON CONFLICT DO NOTHING;
      END LOOP;
    END LOOP;
    RAISE NOTICE 'Budget entries generated.';
  END IF;

  -- ==================================================================
  -- 10. MAINTENANCE TICKETS — OVH (2-3 per month for 12 months)
  -- ==================================================================
  RAISE NOTICE 'Generating OVH maintenance tickets...';
  FOR m IN 0..17 LOOP
    base_date := '2025-06-01'::date + (m * 30);
    j := 2 + (random() * 2)::int;
    FOR i IN 1..j LOOP
      unit_idx := 1 + (random() * (array_length(ovh_rooms, 1) - 1))::int;
      curr_date := base_date + (random() * 27)::int;
      INSERT INTO maintenance_tickets (property_id, unit_id, ticket_number, ticket_type, title, description, category, priority, status, reported_by, assigned_to, created_at)
      VALUES (ovh_id, ovh_rooms[unit_idx],
        'MT-OVH-H-' || LPAD((m * 3 + i)::text, 4, '0'),
        'corrective',
        CASE (random() * 4)::int
          WHEN 0 THEN 'AC not cooling properly'
          WHEN 1 THEN 'Leaking faucet in bathroom'
          WHEN 2 THEN 'Light bulb replacement needed'
          WHEN 3 THEN 'TV remote not working'
          ELSE 'Door lock issue' END,
        'Guest reported issue during stay',
        CASE (random() * 3)::int WHEN 0 THEN 'HVAC' WHEN 1 THEN 'plumbing' WHEN 2 THEN 'electrical' ELSE 'general' END,
        (CASE (random() * 3)::int WHEN 0 THEN 'critical' WHEN 1 THEN 'high' WHEN 2 THEN 'medium' ELSE 'low' END)::ticket_priority,
        (CASE WHEN curr_date < CURRENT_DATE - 60 THEN 'closed'
             WHEN curr_date < CURRENT_DATE - 30 THEN 'resolved'
             WHEN curr_date < CURRENT_DATE - 7 THEN 'in_progress'
             ELSE 'open' END)::ticket_status,
        uid_frontdesk, uid_maint, curr_date)
      ON CONFLICT (ticket_number) DO NOTHING
      RETURNING id INTO ticket_id;

      -- Add time entry for resolved/closed tickets
      IF ticket_id IS NOT NULL AND curr_date < CURRENT_DATE - 30 THEN
        INSERT INTO maintenance_time_entries (ticket_id, technician_id, start_time, end_time, notes)
        VALUES (ticket_id, uid_maint, (curr_date + 1)::timestamp + time '10:00:00', (curr_date + 1)::timestamp + time '11:00:00', 'Diagnosed and fixed issue');
        INSERT INTO maintenance_approvals (ticket_id, action, performed_by, comment)
        VALUES (ticket_id, 'assigned', uid_maint, 'Auto-assigned'),
               (ticket_id, 'resolved', uid_maint, 'Issue resolved');
        IF curr_date < CURRENT_DATE - 60 THEN
          INSERT INTO maintenance_approvals (ticket_id, action, performed_by, comment)
          VALUES (ticket_id, 'closed', uid_admin, 'Verified closed');
        END IF;
      END IF;
    END LOOP;
    IF m % 6 = 0 THEN RAISE NOTICE '  Maintenance: month %/18 done', m; END IF;
  END LOOP;
  RAISE NOTICE 'OVH maintenance tickets generated.';

  -- ==================================================================
  -- 11. MAINTENANCE TICKETS — CSA (1-2 per month for 12 months)
  -- ==================================================================
  FOR m IN 0..11 LOOP
    base_date := '2026-01-01'::date + (m * 30);
    j := 1 + (random() * 2)::int;
    FOR i IN 1..j LOOP
      unit_idx := 1 + (random() * (array_length(csa_suites, 1) - 1))::int;
      curr_date := base_date + (random() * 27)::int;
      INSERT INTO maintenance_tickets (property_id, unit_id, ticket_number, ticket_type, title, description, category, priority, status, reported_by, assigned_to, created_at)
      VALUES (csa_id, csa_suites[unit_idx],
        'MT-CSA-H-' || LPAD((m * 2 + i)::text, 4, '0'),
        'corrective',
        CASE (random() * 3)::int
          WHEN 0 THEN 'Kitchen appliance issue'
          WHEN 1 THEN 'AC servicing needed'
          WHEN 2 THEN 'Plumbing leak'
          ELSE 'Electrical fault' END,
        'Maintenance request from suite',
        CASE (random() * 3)::int WHEN 0 THEN 'HVAC' WHEN 1 THEN 'plumbing' WHEN 2 THEN 'electrical' ELSE 'general' END,
        (CASE (random() * 3)::int WHEN 0 THEN 'high' WHEN 1 THEN 'medium' ELSE 'low' END)::ticket_priority,
        (CASE WHEN curr_date < CURRENT_DATE - 60 THEN 'closed' WHEN curr_date < CURRENT_DATE - 14 THEN 'resolved' ELSE 'in_progress' END)::ticket_status,
        uid_csa_fd, uid_csa_mt, curr_date)
      ON CONFLICT (ticket_number) DO NOTHING;
    END LOOP;
  END LOOP;
  RAISE NOTICE 'CSA maintenance tickets generated.';

  -- ==================================================================
  -- 12. HOUSEKEEPING TASKS — OVH (3 per day, weekly samples for 12 months)
  -- ==================================================================
  RAISE NOTICE 'Generating OVH housekeeping tasks...';
  FOR w IN 0..51 LOOP
    base_date := '2026-01-06'::date + (w * 7);  -- Start Mondays
    FOR d IN 0..6 LOOP  -- 7 days per week
      curr_date := base_date + d;
      IF curr_date <= CURRENT_DATE THEN
        FOR i IN 1..3 LOOP
          unit_idx := 1 + (random() * (array_length(ovh_rooms, 1) - 1))::int;
          INSERT INTO housekeeping_tasks (property_id, unit_id, task_type, priority, status, assigned_to, notes, scheduled_at, created_at)
          VALUES (ovh_id, ovh_rooms[unit_idx],
            CASE (random() * 3)::int WHEN 0 THEN 'deep_clean' WHEN 1 THEN 'turnaround' WHEN 2 THEN 'stayover_tidy' ELSE 'deep_clean' END,
            (CASE (random() * 3)::int WHEN 0 THEN 'high' WHEN 1 THEN 'medium' ELSE 'low' END)::ticket_priority,
            (CASE WHEN curr_date < CURRENT_DATE - 7 THEN 'closed'
                 WHEN curr_date < CURRENT_DATE THEN
                   CASE (random() * 2)::int WHEN 0 THEN 'closed' WHEN 1 THEN 'in_progress' ELSE 'open' END
                 ELSE 'open' END)::ticket_status,
            uid_hk, 'Scheduled cleaning', curr_date, curr_date - interval '1 day')
          ON CONFLICT DO NOTHING;
        END LOOP;
      END IF;
    END LOOP;
    IF w % 13 = 0 THEN RAISE NOTICE '  HK tasks: week %/52 done', w; END IF;
  END LOOP;
  RAISE NOTICE 'OVH housekeeping tasks generated.';

  -- ==================================================================
  -- 13. TIMESHEETS — OVH employees (weekly for 12 months)
  -- ==================================================================
  RAISE NOTICE 'Generating timesheets...';
  FOR w IN 0..51 LOOP
    base_date := '2026-01-06'::date + (w * 7);
    IF base_date > CURRENT_DATE THEN EXIT; END IF;

    -- Front desk
    INSERT INTO timesheets (employee_id, date, clock_in, clock_out, total_hours, status, created_at)
    SELECT emp_ovh_fd, base_date + gs,
      (base_date + gs)::timestamp + time '08:00:00',
      (base_date + gs)::timestamp + time '17:00:00', 9, 'approved', base_date
    FROM generate_series(0, 4) gs(gs) WHERE base_date + gs <= CURRENT_DATE
    ON CONFLICT DO NOTHING;

    -- Housekeeping
    INSERT INTO timesheets (employee_id, date, clock_in, clock_out, total_hours, status, created_at)
    SELECT emp_ovh_hk, base_date + gs,
      (base_date + gs)::timestamp + time '07:00:00',
      (base_date + gs)::timestamp + time '16:00:00', 9, 'approved', base_date
    FROM generate_series(0, 5) gs(gs) WHERE base_date + gs <= CURRENT_DATE
    ON CONFLICT DO NOTHING;

    -- Maintenance
    INSERT INTO timesheets (employee_id, date, clock_in, clock_out, total_hours, status, created_at)
    SELECT emp_ovh_mt, base_date + gs,
      (base_date + gs)::timestamp + time '09:00:00',
      (base_date + gs)::timestamp + time '18:00:00', 9, 'approved', base_date
    FROM generate_series(0, 5) gs(gs) WHERE base_date + gs <= CURRENT_DATE
    ON CONFLICT DO NOTHING;

    IF w % 13 = 0 THEN RAISE NOTICE '  Timesheets: week %/52 done', w; END IF;
  END LOOP;
  RAISE NOTICE 'Timesheets generated.';

  -- ==================================================================
  -- 14. PAYROLL RUNS — OVH (monthly for 12 months)
  -- ==================================================================
  RAISE NOTICE 'Generating payroll runs...';
  FOR m IN 0..11 LOOP
    curr_date := '2026-01-01'::date + (m * 30);
    IF curr_date > CURRENT_DATE THEN EXIT; END IF;

    INSERT INTO payroll_runs (property_id, period_start, period_end, status, created_at)
    VALUES (ovh_id,
      curr_date,
      CASE WHEN m = 11 THEN curr_date + 30 ELSE curr_date + 29 END,
      CASE WHEN curr_date + 30 < CURRENT_DATE THEN 'approved' ELSE 'draft' END,
      curr_date + 25)
    RETURNING id INTO payrun_id;

    -- Add payroll lines for key employees
    INSERT INTO payroll_lines (payroll_id, employee_id, gross_pay, pf_deduction, esi_deduction, pt_deduction, tds_deduction, other_deductions)
    VALUES (payrun_id, emp_ovh_fd, 42000, 1800, 750, 200, 700, 750),
           (payrun_id, emp_ovh_hk, 30000, 1250, 550, 200, 500, 700),
           (payrun_id, emp_ovh_mt, 37000, 1500, 650, 200, 600, 850),
           (payrun_id, emp_ovh_hr, 59000, 2500, 1000, 200, 800, 1000),
           (payrun_id, emp_ovh_fn, 68000, 3000, 1200, 200, 800, 1000);
  END LOOP;
  RAISE NOTICE 'Payroll runs generated.';

  -- ==================================================================
  -- 15. LEAVE REQUESTS (spread across 12 months)
  -- ==================================================================
  RAISE NOTICE 'Generating leave requests...';
  FOR i IN 1..20 LOOP
    curr_date := '2026-01-15'::date + ((i - 1) * 17);
    IF curr_date > CURRENT_DATE THEN EXIT; END IF;

    INSERT INTO leave_requests (employee_id, leave_type_id, start_date, end_date, total_days, reason, status, approved_by, approved_at, created_at)
    VALUES (
      CASE (random() * 4)::int
        WHEN 0 THEN emp_ovh_fd WHEN 1 THEN emp_ovh_hk WHEN 2 THEN emp_ovh_mt WHEN 3 THEN emp_ovh_fn ELSE emp_ovh_hr END,
      CASE (random() * 4)::int
        WHEN 0 THEN lt_casual WHEN 1 THEN lt_sick WHEN 2 THEN lt_annual WHEN 3 THEN lt_comp_off ELSE lt_personal END,
      curr_date, curr_date + (random() * 2)::int,
      ((curr_date + (random() * 2)::int) - curr_date) + 1,
      CASE (random() * 4)::int
        WHEN 0 THEN 'Personal work' WHEN 1 THEN 'Not feeling well' WHEN 2 THEN 'Family function'
        WHEN 3 THEN 'Doctor appointment' ELSE 'Vacation' END,
      CASE WHEN curr_date < CURRENT_DATE - 30 THEN 'approved' WHEN curr_date < CURRENT_DATE THEN 'approved' ELSE 'pending' END,
      uid_hr, curr_date - 3, curr_date - 5)
    ON CONFLICT DO NOTHING;
  END LOOP;
  RAISE NOTICE 'Leave requests generated.';

  -- ==================================================================
  -- 16. VENDOR BILLS (monthly recurring for 12 months)
  -- ==================================================================
  IF vid_laundry IS NOT NULL AND vid_hvac IS NOT NULL THEN
    FOR m IN 0..11 LOOP
      curr_date := '2026-01-15'::date + (m * 30);
      IF curr_date > CURRENT_DATE THEN EXIT; END IF;

      -- Monthly laundry bill
      rnd_val := 35000 + random() * 15000;
      INSERT INTO vendor_bills (property_id, vendor_id, bill_number, bill_date, due_date, category, subtotal, tax_total, grand_total, paid_total, status, notes, created_by, created_at)
      VALUES (ovh_id, vid_laundry, 'INV-LND-M' || LPAD((m + 1)::text, 3, '0'),
        curr_date, curr_date + 15, 'service', rnd_val, rnd_val * 0.18, rnd_val * 1.18,
        CASE WHEN curr_date + 15 < CURRENT_DATE THEN rnd_val * 1.18 ELSE 0 END,
        CASE WHEN curr_date + 15 < CURRENT_DATE THEN 'paid' ELSE 'approved' END,
        'Monthly laundry - ' || to_char(curr_date, 'Mon YYYY'), uid_finance, curr_date - 2)
      RETURNING id INTO bill_id;
      INSERT INTO bill_line_items (bill_id, description, quantity, unit_price)
      VALUES (bill_id, 'Laundry processing ' || to_char(curr_date, 'Mon YYYY'), floor(rnd_val / 150)::int, 150);

      -- Bill payment if paid
      IF curr_date + 15 < CURRENT_DATE THEN
        INSERT INTO bill_payments (property_id, bill_id, payment_method, reference_number, amount, payment_date, created_by)
        VALUES (ovh_id, bill_id, 'bank_transfer', 'NEFT-LND-' || LPAD((m + 1)::text, 3, '0'),
          rnd_val * 1.18, curr_date + 15 + (random() * 3)::int, uid_finance);
      END IF;
    END LOOP;

    -- Quarterly HVAC bills
    FOR m IN 0..3 LOOP
      curr_date := '2026-03-15'::date + (m * 90);
      IF curr_date > CURRENT_DATE THEN EXIT; END IF;
      rnd_val := 60000 + random() * 30000;
      INSERT INTO vendor_bills (property_id, vendor_id, bill_number, bill_date, due_date, category, subtotal, tax_total, grand_total, paid_total, status, notes, created_by, created_at)
      VALUES (ovh_id, vid_hvac, 'INV-HVAC-Q' || (m + 1)::text,
        curr_date, curr_date + 30, 'service', rnd_val, rnd_val * 0.18, rnd_val * 1.18,
        CASE WHEN curr_date + 30 < CURRENT_DATE THEN rnd_val * 1.18 ELSE 0 END,
        CASE WHEN curr_date + 30 < CURRENT_DATE THEN 'paid' ELSE 'approved' END,
        'Quarterly HVAC ' || 'Q' || (m + 1)::text || ' ' || to_char(curr_date, 'YYYY'), uid_finance, curr_date - 2)
      RETURNING id INTO bill_id;
      INSERT INTO bill_line_items (bill_id, description, quantity, unit_price)
      VALUES (bill_id, 'HVAC maintenance Q' || (m + 1)::text, 10, rnd_val / 10);
    END LOOP;
    RAISE NOTICE 'Vendor bills generated.';
  END IF;

  -- ==================================================================
  -- 17. DEPRECIATION SCHEDULE (monthly for 12 months)
  -- ==================================================================
  RAISE NOTICE 'Generating depreciation...';
  FOR m IN 0..11 LOOP
    curr_date := '2026-01-31'::date + (m * 30);
    IF curr_date > CURRENT_DATE THEN EXIT; END IF;

    FOR asset_id IN
      SELECT id FROM fixed_assets WHERE status = 'active'
    LOOP
      INSERT INTO depreciation_schedule (asset_id, period_date, amount, is_posted)
      SELECT asset_id, curr_date, ROUND(purchase_cost / useful_life_yrs / 12), false
      FROM fixed_assets WHERE id = asset_id
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
  RAISE NOTICE 'Depreciation entries generated.';

  -- ==================================================================
  -- 18. TAX FILINGS (quarterly for 2 years)
  -- ==================================================================
  IF uid_finance IS NOT NULL THEN
    FOR m IN 0..7 LOOP
      curr_date := '2025-06-30'::date + (m * 90);
      IF curr_date > CURRENT_DATE THEN EXIT; END IF;

      INSERT INTO tax_filings (property_id, tax_type, return_type, period_start, period_end, filing_date, due_date, status, total_liability, total_paid, filed_by, remarks)
      VALUES (ovh_id, 'GST', 'quarterly',
        (curr_date - interval '2 months')::date, curr_date,
        curr_date - 15, curr_date,
        CASE WHEN curr_date < CURRENT_DATE THEN 'filed' ELSE 'pending' END,
        150000 + random() * 80000,
        CASE WHEN curr_date < CURRENT_DATE THEN 150000 + random() * 80000 ELSE 0 END,
        CASE WHEN curr_date < CURRENT_DATE THEN uid_finance ELSE NULL END,
        'GST return ' || to_char(curr_date, 'Mon YYYY'))
      ON CONFLICT DO NOTHING;

      INSERT INTO tax_filings (property_id, tax_type, return_type, period_start, period_end, filing_date, due_date, status, total_liability, total_paid, filed_by, remarks)
      VALUES (csa_id, 'GST', 'quarterly',
        (curr_date - interval '2 months')::date, curr_date,
        curr_date - 15, curr_date,
        CASE WHEN curr_date < CURRENT_DATE THEN 'filed' ELSE 'pending' END,
        60000 + random() * 40000,
        CASE WHEN curr_date < CURRENT_DATE THEN 60000 + random() * 40000 ELSE 0 END,
        CASE WHEN curr_date < CURRENT_DATE THEN uid_csa_fn ELSE NULL END,
        'GST return CSA ' || to_char(curr_date, 'Mon YYYY'))
      ON CONFLICT DO NOTHING;
    END LOOP;
    RAISE NOTICE 'Tax filings generated.';
  END IF;

  -- ==================================================================
  -- 19. AUDIT EVENTS (scattered across months)
  -- ==================================================================
  RAISE NOTICE 'Generating audit events...';
  FOR i IN 1..30 LOOP
    curr_date := '2026-01-05'::date + ((i - 1) * 12);
    IF curr_date > CURRENT_DATE THEN EXIT; END IF;

    INSERT INTO system_audit_events (event_type, severity, title, description, source, affected_user, metadata, created_at)
    VALUES (
      CASE (random() * 5)::int
        WHEN 0 THEN 'user_login' WHEN 1 THEN 'booking_created' WHEN 2 THEN 'payment_processed'
        WHEN 3 THEN 'maintenance_ticket' WHEN 4 THEN 'housekeeping' ELSE 'vendor_bill' END,
      CASE (random() * 3)::int WHEN 0 THEN 'info' WHEN 1 THEN 'warning' ELSE 'info' END,
      CASE (random() * 4)::int
        WHEN 0 THEN 'User login recorded'
        WHEN 1 THEN 'Booking processed'
        WHEN 2 THEN 'Payment received'
        WHEN 3 THEN 'Ticket updated'
        ELSE 'Task completed' END,
      'System activity on ' || curr_date::text,
      CASE (random() * 3)::int WHEN 0 THEN 'booking' WHEN 1 THEN 'payment' WHEN 2 THEN 'ticket' ELSE 'task' END,
      CASE (random() * 3)::int
        WHEN 0 THEN uid_frontdesk WHEN 1 THEN uid_hk WHEN 2 THEN uid_maint ELSE uid_finance END,
      jsonb_build_object('entity_id', 'ID-' || LPAD((i * 7)::text, 6, '0'), 'property_id',
        CASE WHEN random() < 0.7 THEN ovh_id::text ELSE csa_id::text END),
      curr_date)
    ON CONFLICT DO NOTHING;
  END LOOP;
  RAISE NOTICE 'Audit events generated.';

  -- ==================================================================
  -- 20. GUEST FEEDBACK — linked to checked_out bookings
  -- ==================================================================
  RAISE NOTICE 'Generating guest feedback...';
  FOR rec IN
    SELECT b.id AS booking_id, b.guest_id, b.property_id
    FROM bookings b
    WHERE b.status = 'checked_out' AND b.property_id = ovh_id
    AND NOT EXISTS (SELECT 1 FROM guest_feedbacks gf WHERE gf.booking_id = b.id)
    ORDER BY random()
    LIMIT 50
  LOOP
    INSERT INTO guest_feedbacks (property_id, booking_id, guest_id, rating, department, comments, created_at)
    VALUES (rec.property_id, rec.booking_id, rec.guest_id,
      3 + (random() * 2)::int,
      CASE (random() * 3)::int WHEN 0 THEN 'housekeeping' WHEN 1 THEN 'maintenance' WHEN 2 THEN 'front_desk' ELSE 'restaurant' END,
      CASE (random() * 3)::int
        WHEN 0 THEN 'Great experience, would recommend!'
        WHEN 1 THEN 'Good stay, minor issues with room cleaning'
        WHEN 2 THEN 'Excellent service and friendly staff'
        ELSE 'Comfortable stay, will visit again' END,
      CURRENT_DATE - (random() * 90)::int)
    ON CONFLICT DO NOTHING;
  END LOOP;
  RAISE NOTICE 'Guest feedback generated.';

  -- ==================================================================
  -- 21. UNIT STATUS UPDATE — sync occupied units with active bookings
  -- ==================================================================
  UPDATE units SET status = 'occupied' WHERE id IN (
    SELECT DISTINCT u.id
    FROM bookings b JOIN units u ON u.id = b.unit_id
    WHERE b.status IN ('checked_in', 'confirmed')
    AND b.check_in <= CURRENT_DATE
    AND b.check_out >= CURRENT_DATE
    AND u.status != 'maintenance'
  );
  UPDATE units SET status = 'cleaning' WHERE id IN (
    SELECT DISTINCT u.id FROM housekeeping_tasks h JOIN units u ON u.id = h.unit_id
    WHERE h.status IN ('in_progress', 'open')
    AND h.scheduled_at::date = CURRENT_DATE
    AND u.status NOT IN ('maintenance', 'cleaning')
  );
  UPDATE units SET status = 'cleaning' WHERE id IN (
    SELECT u.id FROM units u
    WHERE u.status = 'dirty'
    AND u.id IN (SELECT unit_id FROM housekeeping_tasks WHERE status = 'resolved' AND completed_at::date = CURRENT_DATE)
    LIMIT (SELECT GREATEST(2, COUNT(*)/10) FROM units WHERE status IN ('vacant', 'occupied'))
  );
  RAISE NOTICE 'Unit statuses synced with active bookings and cleaning tasks.';

  -- ==================================================================
  -- SUMMARY
  -- ==================================================================
  RAISE NOTICE '============================================';
  RAISE NOTICE 'SEED V5 COMPLETE — 1-2 years data added!';
  RAISE NOTICE '============================================';

END $$;
