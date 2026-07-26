-- 033_whatsapp_integration.sql — WhatsApp Business API, Templates, Conversation Tracking
-- Run in tenant schema

-- ── WhatsApp Business Config ──
CREATE TABLE IF NOT EXISTS whatsapp_config (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id       UUID NOT NULL REFERENCES properties(id) UNIQUE,

  enabled           BOOLEAN DEFAULT false,
  provider          TEXT DEFAULT 'meta' CHECK (provider IN ('meta','twilio','gupshup','360dialog')),

  -- Meta / WhatsApp Business API
  phone_number_id   TEXT,
  whatsapp_business_id TEXT,
  access_token      TEXT,       -- encrypted in production
  webhook_verify_token TEXT,
  app_secret        TEXT,

  -- Template config
  template_namespace TEXT,
  template_language  TEXT DEFAULT 'en',

  -- Business profile
  display_name      TEXT,
  about_text        TEXT,
  profile_photo_url TEXT,

  -- Auto-messaging
  auto_welcome      BOOLEAN DEFAULT true,
  auto_checkin_reminder BOOLEAN DEFAULT true,
  auto_checkout_reminder BOOLEAN DEFAULT true,
  auto_feedback_request BOOLEAN DEFAULT true,
  auto_promo_enabled BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── WhatsApp Message Templates ──
CREATE TABLE IF NOT EXISTS whatsapp_templates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id   UUID NOT NULL REFERENCES properties(id),

  name          TEXT NOT NULL,
  category      TEXT NOT NULL DEFAULT 'utility'
                CHECK (category IN ('utility','marketing','authentication','session')),
  language      TEXT DEFAULT 'en',
  status        TEXT DEFAULT 'draft' CHECK (status IN ('draft','pending','approved','rejected')),

  -- Template body (handlebars-style variables)
  header_type   TEXT CHECK (header_type IN ('text','image','video','document','none')),
  header_text   TEXT,
  body_text     TEXT NOT NULL,
  footer_text   TEXT,

  -- Variables: [{ name, example }]
  variables     JSONB DEFAULT '[]'::jsonb,

  -- Buttons
  buttons       JSONB DEFAULT '[]'::jsonb,

  -- Meta template ID (after approval)
  meta_template_id TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(property_id, name)
);

-- ── WhatsApp Conversations ──
CREATE TABLE IF NOT EXISTS whatsapp_conversations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id       UUID NOT NULL REFERENCES properties(id),
  guest_id          UUID REFERENCES guest_profiles(id),
  booking_id      UUID REFERENCES bookings(id),

  phone_number      TEXT NOT NULL,
  contact_name      TEXT,
  status            TEXT DEFAULT 'active' CHECK (status IN ('active','paused','closed')),

  -- Conversation context
  last_message_at   TIMESTAMPTZ,
  last_message_preview TEXT,
  unread_count      INT DEFAULT 0,
  assigned_to       UUID REFERENCES users(id),

  -- Tags
  tags              JSONB DEFAULT '[]'::jsonb,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── WhatsApp Messages ──
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id   UUID NOT NULL REFERENCES whatsapp_conversations(id),
  property_id       UUID NOT NULL REFERENCES properties(id),

  direction         TEXT NOT NULL CHECK (direction IN ('inbound','outbound')),
  message_type      TEXT DEFAULT 'text' CHECK (message_type IN ('text','image','video','audio','document','template','interactive','location','reaction')),

  -- Content
  text_body         TEXT,
  media_url         TEXT,
  media_type        TEXT,
  template_name     TEXT,
  template_vars     JSONB,
  interactive_id    TEXT,
  interactive_title TEXT,

  -- Status
  status            TEXT DEFAULT 'sent' CHECK (status IN ('sent','delivered','read','failed','pending')),
  error_message     TEXT,
  provider_msg_id   TEXT,

  -- WhatsApp metadata
  wa_message_id     TEXT,
  wa_timestamp      TIMESTAMPTZ,
  wa_status         TEXT,

  -- Staff context
  sent_by           UUID REFERENCES users(id),
  is_ai_generated   BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── WhatsApp Broadcast Campaigns ──
CREATE TABLE IF NOT EXISTS whatsapp_campaigns (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id       UUID NOT NULL REFERENCES properties(id),

  name              TEXT NOT NULL,
  template_id       UUID REFERENCES whatsapp_templates(id),
  status            TEXT DEFAULT 'draft' CHECK (status IN ('draft','scheduled','sending','completed','failed','cancelled')),

  -- Target audience
  target_filter     JSONB DEFAULT '{}'::jsonb,  -- { guest_tags, loyalty_tiers, date_range, etc }
  recipient_count   INT DEFAULT 0,

  -- Schedule
  scheduled_at      TIMESTAMPTZ,
  started_at        TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,

  -- Stats
  sent_count        INT DEFAULT 0,
  delivered_count   INT DEFAULT 0,
  read_count        INT DEFAULT 0,
  failed_count      INT DEFAULT 0,
  click_count       INT DEFAULT 0,

  -- Content override
  custom_variables  JSONB DEFAULT '{}'::jsonb,

  created_by        UUID REFERENCES users(id),
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- ── Indexes ──
CREATE INDEX IF NOT EXISTS idx_wa_conversations_property ON whatsapp_conversations(property_id);
CREATE INDEX IF NOT EXISTS idx_wa_conversations_phone ON whatsapp_conversations(phone_number);
CREATE INDEX IF NOT EXISTS idx_wa_conversations_status ON whatsapp_conversations(status);
CREATE INDEX IF NOT EXISTS idx_wa_messages_conversation ON whatsapp_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_wa_messages_property ON whatsapp_messages(property_id);
CREATE INDEX IF NOT EXISTS idx_wa_messages_created ON whatsapp_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_wa_templates_property ON whatsapp_templates(property_id);
CREATE INDEX IF NOT EXISTS idx_wa_campaigns_property ON whatsapp_campaigns(property_id);

-- ── Seed default templates (only if properties exist) ──
DO $$
DECLARE
  prop_id UUID;
BEGIN
  SELECT id INTO prop_id FROM properties LIMIT 1;
  IF prop_id IS NOT NULL THEN
    INSERT INTO whatsapp_templates (property_id, name, category, body_text, variables, status) VALUES
    (prop_id, 'welcome', 'utility',
     'Hello {{1}}! Welcome to {{2}}. We''re delighted to have you. Reply HELP for assistance or TYPE to chat with our team.',
     '[{"name":"guest_name","example":"Rahul"},{"name":"property_name","example":"Grand Hotel"}]',
     'approved'),
    (prop_id, 'checkin_reminder', 'utility',
     'Hi {{1}}! Your check-in at {{2}} is tomorrow ({{3}}). Self check-in is available via: {{4}}. See you soon!',
     '[{"name":"guest_name","example":"Rahul"},{"name":"property_name","example":"Grand Hotel"},{"name":"checkin_date","example":"25 Jul 2026"},{"name":"kiosk_url","example":"https://..."}]',
     'approved'),
    (prop_id, 'checkout_reminder', 'utility',
     'Hi {{1}}! A reminder that your check-out at {{2}} is tomorrow ({{3}}). You can complete self check-out via: {{4}}. Thank you for staying with us!',
     '[{"name":"guest_name","example":"Rahul"},{"name":"property_name","example":"Grand Hotel"},{"name":"checkout_date","example":"27 Jul 2026"},{"name":"checkout_url","example":"https://..."}]',
     'approved'),
    (prop_id, 'feedback_request', 'utility',
     'Hi {{1}}! Thank you for staying at {{2}}. We''d love your feedback! Rate your experience (1-5): {{3}}. Your input helps us serve you better.',
     '[{"name":"guest_name","example":"Rahul"},{"name":"property_name","example":"Grand Hotel"},{"name":"feedback_url","example":"https://..."}]',
     'approved'),
    (prop_id, 'promotional', 'marketing',
     'Hi {{1}}! Exclusive offer from {{2}}: {{3}}. Book now and save! Valid until {{4}}. Reply STOP to opt out.',
     '[{"name":"guest_name","example":"Rahul"},{"name":"property_name","example":"Grand Hotel"},{"name":"offer_text","example":"20% off weekend stays"},{"name":"expiry_date","example":"31 Aug 2026"}]',
     'approved')
    ON CONFLICT (property_id, name) DO NOTHING;
  END IF;
END $$;
