-- ============================================================================
-- Multi-Tenant Schema Sharding (023)
--   Moves eHMS from single-schema to schema-per-tenant architecture.
--   Creates the tenants registry, the first tenant (Viswa Group of Estates),
--   and a helper function to provision new tenant schemas.
-- ============================================================================
-- Run AFTER all 022 migration files have created tables in the public schema.
-- This migration moves every table, type, and sequence from public → viswa.
-- ============================================================================

-- ── 1. Tenants Registry (in public, visible across all schemas) ──
CREATE TABLE IF NOT EXISTS public.tenants (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    code            VARCHAR(50) UNIQUE NOT NULL,
    schema_name     VARCHAR(63) UNIQUE NOT NULL,
    logo_url        TEXT,
    domain          VARCHAR(255),
    contact_email   VARCHAR(255),
    contact_phone   VARCHAR(20),
    is_active       BOOLEAN DEFAULT true,
    config          JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tenants_code ON public.tenants(code);
CREATE INDEX IF NOT EXISTS idx_tenants_schema ON public.tenants(schema_name);

-- ── 2. Create viswa schema (first tenant shard) ──
CREATE SCHEMA IF NOT EXISTS viswa;

-- ── 3. Move all objects from public → viswa ──
DO $$
DECLARE
    obj RECORD;
BEGIN
    -- Move ENUM types
    FOR obj IN
        SELECT t.typname AS name
        FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'public'
          AND t.typtype = 'e'
    LOOP
        EXECUTE format('ALTER TYPE public.%I SET SCHEMA viswa;', obj.name);
    END LOOP;

    -- Move all BASE TABLEs (exclude registry tables that must stay in public)
    FOR obj IN
        SELECT table_name AS name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_type = 'BASE TABLE'
          AND table_name NOT IN ('tenants', 'platform_admins')
    LOOP
        EXECUTE format('ALTER TABLE IF EXISTS public.%I SET SCHEMA viswa;', obj.name);
    END LOOP;

    -- Move all SEQUENCEs
    FOR obj IN
        SELECT sequence_name AS name
        FROM information_schema.sequences
        WHERE sequence_schema = 'public'
    LOOP
        EXECUTE format('ALTER SEQUENCE IF EXISTS public.%I SET SCHEMA viswa;', obj.name);
    END LOOP;
END $$;

-- ── 4. Seed Viswa Group of Estates tenant ──
INSERT INTO public.tenants (name, code, schema_name, config)
VALUES (
    'Viswa Group of Estates',
    'VISWA',
    'viswa',
    '{
        "is_primary": true,
        "display_name": "Viswa Group of Estates",
        "vertical_types": ["hotel", "service_apartment", "rental_apartment", "workplace"],
        "timezone": "Asia/Kolkata",
        "currency": "INR",
        "verticals": ["hotels", "apartments", "rental", "workplace"],
        "workspaces": [
            {"type": "hotels", "name": "Vishwa Hotels & Resorts", "is_primary": true},
            {"type": "apartments", "name": "Vishwa Service Apartments", "is_primary": false},
            {"type": "rental", "name": "Vishwa Rental Properties", "is_primary": false},
            {"type": "workplace", "name": "Vishwa Workplace Solutions", "is_primary": false}
        ]
    }'::jsonb
)
ON CONFLICT (code) DO NOTHING;

-- ── 5. Helper function: create a new tenant schema from viswa template ──
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

    -- Copy ENUM types from template
    FOR v_typ IN
        SELECT t.typname::text
        FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'viswa' AND t.typtype = 'e'
    LOOP
        EXECUTE format('CREATE TYPE %I.%I AS ENUM (SELECT unnest(enum_range(NULL::%I.%I))::text)', p_schema_name, v_typ, 'viswa', v_typ);
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

    -- Register tenant
    INSERT INTO public.tenants (name, code, schema_name, config)
    VALUES (p_tenant_name, p_tenant_code, p_schema_name, '{"vertical_types": ["hotel", "service_apartment", "rental_apartment", "workplace"]}'::jsonb)
    RETURNING id INTO v_tenant_id;

    RETURN v_tenant_id;
END $$;
