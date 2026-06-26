-- 026 Ticketing & Support System
-- Creates platform-level tables for tenant support ticket management
-- with conversation threads and email communication tracking.
--
-- Tables:
--   support_tickets       — main ticket record (status, priority, assignment)
--   ticket_messages     — conversation thread (admin ↔ tenant replies)
--
-- Workflow Impact:
--   Platform admins can view/manage all tickets across tenants.
--   Each ticket records tenant_code for scoping.
--   Messages track sender type (admin/tenant/system) + is_internal flag.
--
-- Email Communication (Resend):
--   On ticket creation     → email to tenant
--   On admin reply         → email to tenant
--   On tenant reply        → email to assigned admin
--   On status change       → email to tenant + assigned admin

-- ── support_tickets ──
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_code     TEXT NOT NULL REFERENCES public.tenants(code) ON DELETE CASCADE,
  subject         TEXT NOT NULL,
  description     TEXT NOT NULL DEFAULT '',
  status          TEXT NOT NULL DEFAULT 'open'
                  CHECK (status IN ('open','in_progress','awaiting_tenant','resolved','closed')),
  priority        TEXT NOT NULL DEFAULT 'medium'
                  CHECK (priority IN ('low','medium','high','critical')),
  category        TEXT NOT NULL DEFAULT 'general',
  assigned_to     UUID REFERENCES public.platform_admins(id) ON DELETE SET NULL,
  created_by      UUID NOT NULL,
  contact_name    TEXT,
  contact_email   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at     TIMESTAMPTZ,
  closed_at       TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_tenant_code ON public.support_tickets(tenant_code);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to ON public.support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON public.support_tickets(created_at DESC);

-- ── ticket_messages ──
CREATE TABLE IF NOT EXISTS public.ticket_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id       UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_type     TEXT NOT NULL CHECK (sender_type IN ('admin','tenant','system')),
  sender_id       UUID,
  sender_name     TEXT NOT NULL DEFAULT '',
  sender_email    TEXT NOT NULL DEFAULT '',
  message         TEXT NOT NULL,
  is_internal     BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON public.ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_created_at ON public.ticket_messages(created_at ASC);

-- ── auto-update updated_at ──
CREATE OR REPLACE FUNCTION public.update_ticket_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_support_tickets_updated_at ON public.support_tickets;
CREATE TRIGGER trg_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_ticket_timestamp();

-- ── auto-set resolved_at / closed_at ──
CREATE OR REPLACE FUNCTION public.set_ticket_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
    NEW.resolved_at = now();
  END IF;
  IF NEW.status = 'closed' AND OLD.status != 'closed' THEN
    NEW.closed_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_support_tickets_timestamps ON public.support_tickets;
CREATE TRIGGER trg_support_tickets_timestamps
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.set_ticket_timestamps();
