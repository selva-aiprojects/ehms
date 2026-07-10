-- ============================================================================
-- seed_v6_platform_and_workflows.sql
-- Seeds Platform Provider Broadcasts, Advertisements, Support Tickets,
-- and ensures complete operational demo data across all 4 verticals.
-- ============================================================================

-- ── 1. Platform Schema (public) Seed Data ──
SET search_path TO public;

-- Ensure sample platform super admin exists
INSERT INTO public.platform_admins (email, password_hash, first_name, last_name, is_active)
VALUES (
  'provider@ehms.demo',
  crypt('Demo@1234', gen_salt('bf')),
  'Platform',
  'Provider',
  true
)
ON CONFLICT (email) DO NOTHING;

-- Seed Platform Broadcasts & Advertisements
WITH pa AS (SELECT id FROM public.platform_admins WHERE email = 'provider@ehms.demo' LIMIT 1)
INSERT INTO public.platform_broadcasts (title, content, category, priority, target_vertical, target_tenant_code, action_url, action_label, is_active, created_by)
SELECT
  t.title, t.content, t.category, t.priority, t.target_vertical, t.target_tenant_code, t.action_url, t.action_label, true, pa.id
FROM pa, (VALUES
  (
    'eHMS AI Assistant 2.0 Released!',
    'Experience automated room allocation, preventive maintenance predictions, and dynamic rate cards powered by Next-Gen AI. Available now across all verticals.',
    'feature',
    'high',
    'all',
    NULL::text,
    'https://ehms.demo/docs/ai-assistant',
    'Explore AI Features'
  ),
  (
    'Q3 Promotional Upgrade: 20% Off Multi-Property Shards',
    'Expand your hospitality business! Add Serviced Apartments or Workplace Coworking workspaces to your tenant subscription this month and get 20% off.',
    'advertisement',
    'normal',
    'all',
    NULL::text,
    'https://ehms.demo/billing/upgrades',
    'Claim 20% Discount'
  ),
  (
    'Scheduled Maintenance: Neon Serverless Database Optimization',
    'Routine maintenance is scheduled for this Sunday from 02:00 AM to 03:00 AM IST. Brief disconnects (<30s) may occur.',
    'maintenance',
    'urgent',
    'all',
    NULL::text,
    NULL::text,
    NULL::text
  ),
  (
    'Serviced Apartment Automation Update',
    'New housekeeping turnaround workflows and extended lease invoicing have been enabled for Serviced Apartment and Long-term Rental workspaces.',
    'announcement',
    'normal',
    'apartments',
    NULL::text,
    'https://ehms.demo/docs/apartments',
    'Read Documentation'
  ),
  (
    'Quarterly Subscription Invoice & Renewal Notice',
    'Your tenant subscription invoice for Q3 is generated and available in the Billing Portal. Please ensure timely payment to maintain uninterrupted access.',
    'billing_reminder',
    'high',
    'all',
    'VISWA',
    '/dashboard/admin/settings',
    'View Invoice'
  )
) AS t(title, content, category, priority, target_vertical, target_tenant_code, action_url, action_label)
WHERE NOT EXISTS (SELECT 1 FROM public.platform_broadcasts pb WHERE pb.title = t.title);

-- Seed Platform Support Tickets (Tenants calling Service Provider support)
WITH pa AS (SELECT id FROM public.platform_admins WHERE email = 'provider@ehms.demo' LIMIT 1)
INSERT INTO public.support_tickets (tenant_code, subject, description, category, priority, status, contact_name, contact_email, created_by)
SELECT
  t.tenant_code, t.subject, t.description, t.category, t.priority, t.status, t.contact_name, t.contact_email, pa.id
FROM pa, (VALUES
  ('VISWA', 'Assistance needed for enabling AI Rate Card on Oceanview Hotel', 'We would like to configure dynamic seasonal rate cards on our Oceanview property. Need support guidance.', 'Feature Request', 'high', 'in_progress', 'Vishwa Superadmin', 'superadmin@ehms.demo'),
  ('VISWA', 'API Integration inquiry for Biometric Access at Innovate Coworking', 'Can we connect workplace turnstiles to eHMS membership check-ins via webhook?', 'Technical Support', 'medium', 'open', 'Aryan Kapoor', 'admin@ehms.demo'),
  ('VISWA', 'Subscription billing cycle change request', 'Requesting to switch from monthly invoicing to annual billing with fiscal year discount.', 'Billing & Subscription', 'low', 'resolved', 'Raghu Admin', 'raghu.superadmin@ehms.demo')
) AS t(tenant_code, subject, description, category, priority, status, contact_name, contact_email)
WHERE NOT EXISTS (SELECT 1 FROM public.support_tickets st WHERE st.subject = t.subject AND st.tenant_code = t.tenant_code);


-- ── 2. Tenant Schema (viswa) Seed Data ──
SET search_path TO viswa, public;

-- Ensure Property Admin (admin@ehms.demo) has explicit workspace assignments for testing scoped workflows
WITH u AS (SELECT id FROM viswa.users WHERE email = 'admin@ehms.demo' LIMIT 1),
     r AS (SELECT id FROM viswa.roles WHERE name = 'property_manager' LIMIT 1),
     p AS (SELECT id FROM viswa.properties WHERE code IN ('OVH', 'CSA', 'GWR', 'ICS'))
INSERT INTO viswa.user_roles (user_id, role_id, property_id)
SELECT u.id, r.id, p.id
FROM u, r, p
WHERE NOT EXISTS (
  SELECT 1 FROM viswa.user_roles ur WHERE ur.user_id = u.id AND ur.role_id = r.id AND ur.property_id = p.id
);

-- Seed sample Membership Plans for Innovate Coworking (ICS)
WITH ics AS (SELECT id FROM viswa.properties WHERE code = 'ICS' LIMIT 1)
INSERT INTO viswa.membership_plans (property_id, name, plan_type, billing_cycle, price, seat_pool, max_meeting_room_hours, amenities, is_active)
SELECT ics.id, p.name, p.plan_type, p.billing_cycle, p.price, p.seat_pool, p.max_meeting_room_hours, ARRAY['High-speed WiFi', 'Coffee/Tea', 'Printing', '24/7 Access'], true
FROM ics, (VALUES
  ('Dedicated Desk Pro', 'dedicated_seat', 'monthly', 12000.00, 1, 10),
  ('Hot Desk Starter',   'hot_desk',       'monthly', 6500.00,  1, 5),
  ('Private Cabin 4-Seat','private_office', 'monthly', 45000.00, 4, 25)
) AS p(name, plan_type, billing_cycle, price, seat_pool, max_meeting_room_hours)
WHERE NOT EXISTS (
  SELECT 1 FROM viswa.membership_plans mp WHERE mp.property_id = ics.id AND mp.name = p.name
);

SELECT 'seed_v6_platform_and_workflows complete!' AS status;
