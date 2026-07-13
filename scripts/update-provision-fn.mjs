import { neon } from "@neondatabase/serverless";
import fs from "fs";

const envText = fs.readFileSync('.env.local', 'utf8');
const dbUrlMatch = envText.match(/DATABASE_URL=["']?([^"'\s]+)["']?/);
if (!dbUrlMatch) {
  console.error("No DATABASE_URL found in .env.local");
  process.exit(1);
}
const sql = neon(dbUrlMatch[1]);

async function updateFn() {
  console.log("=== Updating public.provision_tenant_schema in NeonDB ===");
  await sql.query(`
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

        -- Register tenant
        INSERT INTO public.tenants (name, code, schema_name, config)
        VALUES (p_tenant_name, p_tenant_code, p_schema_name, '{"vertical_types": ["hotel", "service_apartment", "rental_apartment", "workplace"]}'::jsonb)
        RETURNING id INTO v_tenant_id;

        RETURN v_tenant_id;
    END $$;
  `);
  console.log("✓ Successfully updated public.provision_tenant_schema in NeonDB.");
}

updateFn().catch(console.error);
