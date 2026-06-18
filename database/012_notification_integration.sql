-- SAMP Notifications & Integrations (BRD Section 5)

CREATE TABLE notification_templates (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel         VARCHAR(50) NOT NULL,           -- email, whatsapp, sms, push
    template_name   VARCHAR(100) NOT NULL,
    subject         VARCHAR(255),
    body_template   TEXT NOT NULL,
    variables       TEXT[],                         -- list of variable names
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE notification_queue (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id     UUID REFERENCES notification_templates(id),
    recipient       VARCHAR(255) NOT NULL,
    channel         VARCHAR(50) NOT NULL,
    payload         JSONB NOT NULL,
    status          VARCHAR(50) DEFAULT 'pending',  -- pending, sent, failed
    sent_at         TIMESTAMPTZ,
    error_message   TEXT,
    retry_count     INT DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE payment_gateway_config (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id     UUID REFERENCES properties(id),
    gateway_name    VARCHAR(50) NOT NULL,           -- stripe, razorpay, adyen
    api_key_enc     TEXT NOT NULL,
    webhook_secret  TEXT,
    is_active       BOOLEAN DEFAULT true,
    config          JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ota_channel_config (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id     UUID NOT NULL REFERENCES properties(id),
    channel_name    VARCHAR(50) NOT NULL,            -- booking.com, expedia, agoda
    api_endpoint    TEXT,
    api_key_enc     TEXT,
    property_mapping JSONB,
    is_active       BOOLEAN DEFAULT true,
    last_sync_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE(property_id, channel_name)
);

CREATE TABLE hardware_devices (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id     UUID NOT NULL REFERENCES properties(id),
    device_type     VARCHAR(50) NOT NULL,           -- smart_lock, lpr_camera, turnstile, pos_terminal
    device_name     VARCHAR(255),
    serial_number   VARCHAR(100) UNIQUE NOT NULL,
    api_endpoint    TEXT,
    api_key_enc     TEXT,
    location        TEXT,
    is_active       BOOLEAN DEFAULT true,
    last_heartbeat  TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- Seed notification templates
INSERT INTO notification_templates (channel, template_name, subject, body_template, variables) VALUES
    ('whatsapp', 'pre_arrival', 'Your stay is coming up!', 'Hi {{guest_name}}, your check-in at {{property_name}} is tomorrow at {{check_in_time}}. Complete your pre-arrival: {{link}}', ARRAY['guest_name', 'property_name', 'check_in_time', 'link']),
    ('email', 'booking_confirmation', 'Booking Confirmed - {{property_name}}', 'Dear {{guest_name}}, your booking #{{booking_ref}} at {{property_name}} is confirmed. Check-in: {{check_in}}, Check-out: {{check_out}}.', ARRAY['guest_name', 'property_name', 'booking_ref', 'check_in', 'check_out']),
    ('whatsapp', 'digital_key', 'Your Digital Key is Ready', 'Your room {{room_number}} is ready. Digital key: {{key_link}}. Valid from {{check_in_time}}.', ARRAY['room_number', 'key_link', 'check_in_time']),
    ('email', 'invoice', 'Invoice #{{invoice_number}}', 'Your invoice #{{invoice_number}} for {{amount}} is attached.', ARRAY['invoice_number', 'amount']);
