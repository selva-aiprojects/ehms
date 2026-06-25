-- ============================================================================
-- Platform Super Admins (024)
--   Creates a separate auth table in `public` schema for eHMS platform
--   administrators who manage tenants (create/suspend/provision verticals)
--   but are NOT tied to any specific tenant shard.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.platform_admins (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   TEXT NOT NULL,
    first_name      VARCHAR(255) NOT NULL DEFAULT 'Platform',
    last_name       VARCHAR(255),
    avatar_url      TEXT,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_platform_admins_email ON public.platform_admins(email);

-- Seed default platform superadmin (password: Platform@1234)
INSERT INTO public.platform_admins (email, password_hash, first_name, last_name)
VALUES (
    'admin@ehms.co',
    crypt('Platform@1234', gen_salt('bf')),
    'Platform',
    'Superadmin'
)
ON CONFLICT (email) DO NOTHING;
