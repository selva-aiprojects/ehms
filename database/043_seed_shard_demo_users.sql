-- Demo Users Seed for Tenant Shards (043)
-- File: database/043_seed_shard_demo_users.sql
-- Purpose: Seed demo users + role assignments into every tenant shard schema
--          so demo logins (Password: Demo@1234) work out of the box, and update
--          public.provision_tenant_schema to copy demo users when provisioning
--          new tenant shards.
-- Date: 2026-08-13

-- ============================================================
-- STEP 1: Seed demo users + roles into all existing tenant shards
-- ============================================================
DO $$
DECLARE
    t RECORD;
    u RECORD;
    v_user_id uuid;
    v_role_id uuid;
BEGIN
    FOR t IN
        SELECT schema_name FROM public.tenants WHERE is_active = true
    LOOP
        PERFORM set_config('search_path', t.schema_name || ', public', true);

        -- 1a. Ensure the full set of roles exists (idempotent)
        INSERT INTO roles (id, name, description, is_system)
        SELECT gen_random_uuid(), r.name, r.description, true
        FROM (VALUES
            ('super_admin',              'Full access to all tenant features'),
            ('executive',                'Executive access'),
            ('property_manager',         'Scoped access to assigned workspaces'),
            ('front_desk',               'Front desk operator'),
            ('housekeeping_supervisor',  'Housekeeping supervisor'),
            ('housekeeping_staff',       'Housekeeping staff'),
            ('maintenance_supervisor',   'Maintenance supervisor'),
            ('maintenance_staff',        'Maintenance staff'),
            ('hr_manager',               'HR manager'),
            ('hr_executive',             'HR executive'),
            ('employee_manager',         'Employee manager'),
            ('finance_manager',          'Finance manager'),
            ('finance_executive',        'Finance executive'),
            ('security_staff',           'Security staff'),
            ('vendor_user',              'Vendor'),
            ('workplace_facility_manager','Workplace facility manager')
        ) AS r(name, description)
        WHERE NOT EXISTS (SELECT 1 FROM roles WHERE roles.name = r.name);

        -- 1b. Seed demo users (Password: Demo@1234)
        INSERT INTO users (id, email, phone, password_hash, first_name, last_name, is_active, mfa_enabled)
        SELECT gen_random_uuid(), demo.email, demo.phone, public.crypt('Demo@1234', public.gen_salt('bf')), demo.first_name, demo.last_name, true, false
        FROM (VALUES
            ('raghu.superadmin@ehms.demo', '+91-9000000000', 'Raghu',  'Superadmin'),
            ('vishwa.superadmin@ehms.demo', '+91-9000000008', 'Vishwa', 'Superadmin'),
            ('superadmin@ehms.demo',        '+91-9000000000', 'System', 'Superadmin'),
            ('admin@ehms.demo',             '+91-9000000001', 'Aryan',  'Kapoor'),
            ('executive@ehms.demo',         '+91-9000000007', 'Anita',  'Desai'),
            ('frontdesk@ehms.demo',         '+91-9000000002', 'Ravi',   'Kumar'),
            ('housekeeping@ehms.demo',      '+91-9000000003', 'Meena',  'Pillai'),
            ('maintenance@ehms.demo',       '+91-9000000004', 'Arjun',  'Sharma'),
            ('hr@ehms.demo',                '+91-9000000005', 'Priya',  'Nair'),
            ('finance@ehms.demo',           '+91-9000000006', 'Vikram', 'Iyer')
        ) AS demo(email, phone, first_name, last_name)
        ON CONFLICT (email) DO NOTHING;

        -- 1c. Assign roles matching DEMO_ROLE_MAP in lib/role-access.ts
        FOR u IN
            SELECT m.email, m.role_name
            FROM (VALUES
                ('raghu.superadmin@ehms.demo', 'super_admin'),
                ('vishwa.superadmin@ehms.demo', 'super_admin'),
                ('superadmin@ehms.demo',        'super_admin'),
                ('admin@ehms.demo',             'property_manager'),
                ('executive@ehms.demo',         'executive'),
                ('frontdesk@ehms.demo',         'front_desk'),
                ('housekeeping@ehms.demo',      'housekeeping_staff'),
                ('maintenance@ehms.demo',       'maintenance_staff'),
                ('hr@ehms.demo',                'hr_manager'),
                ('finance@ehms.demo',           'finance_manager')
            ) AS m(email, role_name)
        LOOP
            SELECT id INTO v_user_id FROM users WHERE email = u.email;
            SELECT id INTO v_role_id FROM roles WHERE name = u.role_name;
            IF v_user_id IS NOT NULL AND v_role_id IS NOT NULL
               AND NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = v_user_id AND role_id = v_role_id AND property_id IS NULL) THEN
                INSERT INTO user_roles (id, user_id, role_id, granted_at) VALUES (gen_random_uuid(), v_user_id, v_role_id, now());
            END IF;
        END LOOP;
    END LOOP;
END $$;

-- ============================================================
-- STEP 2: Update provision_tenant_schema to seed demo users
--         for newly provisioned tenant shards
-- ============================================================
CREATE OR REPLACE FUNCTION public.provision_tenant_schema(
    p_tenant_name  VARCHAR(255),
    p_tenant_code  VARCHAR(50),
    p_schema_name  VARCHAR(63)
) RETURNS UUID
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = 'public'
AS $$
DECLARE
    v_tenant_id UUID;
    v_tbl       TEXT;
    v_seq       TEXT;
    v_typ       TEXT;
    v_vals      TEXT;
BEGIN
    -- Check tenant doesn't exist
    IF EXISTS (SELECT 1 FROM public.tenants WHERE code = p_tenant_code) THEN
        RAISE EXCEPTION 'Tenant with code % already exists', p_tenant_code;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = p_schema_name) THEN
        RAISE EXCEPTION 'Schema % already exists', p_schema_name;
    END IF;

    -- Create schema
    EXECUTE format('CREATE SCHEMA %I', p_schema_name);

    -- Copy ENUM types from template via dynamic query
    FOR v_typ IN
        SELECT t.typname::text
        FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'viswa' AND t.typtype = 'e'
    LOOP
        EXECUTE format(
            'SELECT string_agg(quote_literal(v), '','') FROM (SELECT unnest(enum_range(NULL::%I.%I))::text AS v) sub',
            'viswa', v_typ
        ) INTO v_vals;
        EXECUTE format('CREATE TYPE %I.%I AS ENUM (%s)', p_schema_name, v_typ, v_vals);
    END LOOP;

    -- Copy all tables with indexes, defaults, constraints
    FOR v_tbl IN
        SELECT table_name::text
        FROM information_schema.tables
        WHERE table_schema = 'viswa' AND table_type = 'BASE TABLE'
        ORDER BY table_name
    LOOP
        EXECUTE format('CREATE TABLE %I.%I (LIKE viswa.%I INCLUDING ALL)', p_schema_name, v_tbl, v_tbl);
        EXECUTE format('CREATE SEQUENCE IF NOT EXISTS %I.%I_%I_seq', p_schema_name, v_tbl, 'id');
    END LOOP;

    -- Copy foundational master data from template schema
    EXECUTE format('INSERT INTO %I.roles SELECT * FROM viswa.roles ON CONFLICT DO NOTHING;', p_schema_name);
    EXECUTE format('INSERT INTO %I.enterprises SELECT * FROM viswa.enterprises ON CONFLICT DO NOTHING;', p_schema_name);
    EXECUTE format('INSERT INTO %I.regions SELECT * FROM viswa.regions ON CONFLICT DO NOTHING;', p_schema_name);
    EXECUTE format('INSERT INTO %I.properties SELECT * FROM viswa.properties ON CONFLICT DO NOTHING;', p_schema_name);
    EXECUTE format('INSERT INTO %I.departments SELECT * FROM viswa.departments ON CONFLICT DO NOTHING;', p_schema_name);
    EXECUTE format('INSERT INTO %I.leave_types SELECT * FROM viswa.leave_types ON CONFLICT DO NOTHING;', p_schema_name);
    EXECUTE format('INSERT INTO %I.fiscal_years SELECT * FROM viswa.fiscal_years ON CONFLICT DO NOTHING;', p_schema_name);
    EXECUTE format('INSERT INTO %I.cost_centers SELECT * FROM viswa.cost_centers ON CONFLICT DO NOTHING;', p_schema_name);
    EXECUTE format('INSERT INTO %I.rate_plans SELECT * FROM viswa.rate_plans ON CONFLICT DO NOTHING;', p_schema_name);

    -- Copy demo users and their role assignments so demo logins work in new shards
    EXECUTE format(
        'INSERT INTO %I.users (id, email, phone, password_hash, first_name, last_name, avatar_url, is_active, mfa_enabled, mfa_secret, last_login_at, created_at, updated_at) '
        || 'SELECT id, email, phone, password_hash, first_name, last_name, avatar_url, is_active, mfa_enabled, mfa_secret, last_login_at, created_at, updated_at '
        || 'FROM viswa.users ON CONFLICT (email) DO NOTHING;',
        p_schema_name
    );
    EXECUTE format(
        'INSERT INTO %I.user_roles (id, user_id, role_id, property_id, granted_at, granted_by) '
        || 'SELECT id, user_id, role_id, property_id, granted_at, granted_by '
        || 'FROM viswa.user_roles '
        || 'WHERE NOT EXISTS (SELECT 1 FROM %I.user_roles t WHERE t.user_id = viswa.user_roles.user_id AND t.role_id = viswa.user_roles.role_id AND t.property_id IS NOT DISTINCT FROM viswa.user_roles.property_id);',
        p_schema_name, p_schema_name
    );

    -- Register tenant
    INSERT INTO public.tenants (name, code, schema_name, config)
    VALUES (p_tenant_name, p_tenant_code, p_schema_name, '{"vertical_types": ["hotel", "service_apartment", "rental_apartment", "workplace"]}'::jsonb)
    RETURNING id INTO v_tenant_id;

    RETURN v_tenant_id;
END $$;
