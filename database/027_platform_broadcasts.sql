-- ============================================================================
-- 027 Platform Provider Broadcasting & Advertisements
-- Creates public.platform_broadcasts for eHMS Service Provider announcements,
-- feature promotions, system maintenance alerts, and subscription payment reminders.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.platform_broadcasts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title               TEXT NOT NULL,
  content             TEXT NOT NULL,
  category            TEXT NOT NULL DEFAULT 'announcement'
                      CHECK (category IN ('announcement', 'feature', 'advertisement', 'maintenance', 'billing_reminder')),
  priority            TEXT NOT NULL DEFAULT 'normal'
                      CHECK (priority IN ('normal', 'high', 'urgent')),
  target_vertical     TEXT DEFAULT 'all',
  target_tenant_code  TEXT DEFAULT NULL,
  action_url          TEXT DEFAULT NULL,
  action_label        TEXT DEFAULT NULL,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  expires_at          TIMESTAMPTZ DEFAULT NULL,
  created_by          UUID REFERENCES public.platform_admins(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_platform_broadcasts_active ON public.platform_broadcasts(is_active);
CREATE INDEX IF NOT EXISTS idx_platform_broadcasts_target ON public.platform_broadcasts(target_vertical, target_tenant_code);
CREATE INDEX IF NOT EXISTS idx_platform_broadcasts_created_at ON public.platform_broadcasts(created_at DESC);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_platform_broadcasts_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_platform_broadcasts_updated_at ON public.platform_broadcasts;
CREATE TRIGGER trg_platform_broadcasts_updated_at
  BEFORE UPDATE ON public.platform_broadcasts
  FOR EACH ROW EXECUTE FUNCTION public.update_platform_broadcasts_timestamp();
