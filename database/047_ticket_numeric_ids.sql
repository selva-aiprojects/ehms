-- 047_ticket_numeric_ids.sql
-- Adds human-readable numeric ticket_number to support_tickets and guest_requests,
-- and creates a shared sequence-based generator for all ticket types.

-- ============================================================
-- 1. SUPPORT TICKETS: Add ticket_number column (TKT-NNNNN)
-- ============================================================
ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS ticket_number VARCHAR(20);

-- Sequence for platform support tickets (public schema)
CREATE SEQUENCE IF NOT EXISTS public.support_ticket_seq START 1;

-- Backfill existing rows
UPDATE public.support_tickets
SET ticket_number = 'TKT-' || LPAD(nextval('public.support_ticket_seq')::TEXT, 5, '0')
WHERE ticket_number IS NULL;

-- Make NOT NULL after backfill
ALTER TABLE public.support_tickets
  ALTER COLUMN ticket_number SET NOT NULL,
  ALTER COLUMN ticket_number SET DEFAULT 'TKT-' || LPAD(nextval('public.support_ticket_seq')::TEXT, 5, '0');

CREATE UNIQUE INDEX IF NOT EXISTS idx_support_tickets_number ON public.support_tickets(ticket_number);

-- ============================================================
-- 2. GUEST REQUESTS: Add ticket_number column (GR-NNNNN)
-- ============================================================
-- Guest requests live in tenant schemas, so we add via DO block
DO $$
DECLARE
  sch TEXT;
BEGIN
  FOR sch IN SELECT schema_name FROM public.tenants WHERE is_active = true
  LOOP
    -- Create sequence per tenant schema
    EXECUTE format('CREATE SEQUENCE IF NOT EXISTS %I.guest_request_seq START 1', sch);

    -- Add column if missing
    EXECUTE format('ALTER TABLE %I.guest_requests ADD COLUMN IF NOT EXISTS ticket_number VARCHAR(20)', sch);

    -- Backfill existing rows
    EXECUTE format(
      'UPDATE %I.guest_requests SET ticket_number = ''GR-'' || LPAD(nextval(%L)::TEXT, 5, ''0'') WHERE ticket_number IS NULL',
      sch, sch || '.guest_request_seq'
    );

    -- Set NOT NULL + default
    EXECUTE format('ALTER TABLE %I.guest_requests ALTER COLUMN ticket_number SET NOT NULL', sch);
    EXECUTE format(
      'ALTER TABLE %I.guest_requests ALTER COLUMN ticket_number SET DEFAULT ''GR-'' || LPAD(nextval(%L)::TEXT, 5, ''0'')',
      sch, sch || '.guest_request_seq'
    );

    -- Unique index
    EXECUTE format('CREATE UNIQUE INDEX IF NOT EXISTS idx_guest_requests_number ON %I.guest_requests(ticket_number)', sch);

    RAISE NOTICE 'Migrated guest_requests in schema: %', sch;
  END LOOP;
END $$;

-- ============================================================
-- 3. MAINTENANCE TICKETS: Standardize format to MT-NNNNN
--    (Keep existing ticket_number, but add sequence for new ones)
-- ============================================================
DO $$
DECLARE
  sch TEXT;
  max_num INT;
  next_start INT;
BEGIN
  FOR sch IN SELECT schema_name FROM public.tenants WHERE is_active = true
  LOOP
    -- Create sequence per tenant schema
    EXECUTE format('CREATE SEQUENCE IF NOT EXISTS %I.maintenance_ticket_seq START 1', sch);

    -- Find highest existing numeric suffix to avoid collisions
    EXECUTE format(
      'SELECT COALESCE(MAX(NULLIF(REGEXP_REPLACE(ticket_number, ''^MT-'', '''', ''g''), '''')::INT), 0) FROM %I.maintenance_tickets',
      sch
    ) INTO max_num;

    next_start := GREATEST(max_num + 1, 1);
    EXECUTE format('ALTER SEQUENCE %I.maintenance_ticket_seq RESTART WITH %s', sch, next_start);

    RAISE NOTICE 'Migrated maintenance_tickets in schema: %, next seq: %', sch, next_start;
  END LOOP;
END $$;

-- ============================================================
-- 4. HELPER FUNCTION: generate_ticket_number(prefix, seq_name, schema)
--    Used by API routes for atomic number generation
-- ============================================================
-- Note: Since each API route runs in its own transaction via Neon,
-- we rely on PostgreSQL sequences which are transaction-safe.
-- The sequences created above (support_ticket_seq, guest_request_seq,
-- maintenance_ticket_seq) provide the atomic counter.
