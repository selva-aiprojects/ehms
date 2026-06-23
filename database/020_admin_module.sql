-- Admin Module Extensions

-- 1. User Sessions (active login tracking)
CREATE TABLE IF NOT EXISTS user_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash      TEXT NOT NULL,
    ip_address      INET,
    user_agent      TEXT,
    device_info     VARCHAR(255),
    is_active       BOOLEAN DEFAULT true,
    logged_in_at    TIMESTAMPTZ DEFAULT now(),
    last_active_at  TIMESTAMPTZ DEFAULT now(),
    logged_out_at   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON user_sessions(is_active);

-- 2. Login Attempts (security monitoring)
CREATE TABLE IF NOT EXISTS login_attempts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) NOT NULL,
    ip_address      INET,
    user_agent      TEXT,
    success         BOOLEAN NOT NULL DEFAULT false,
    failure_reason  VARCHAR(100),
    attempted_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_time ON login_attempts(attempted_at);

-- 3. System Backup Jobs
CREATE TABLE IF NOT EXISTS system_backups (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    backup_type     VARCHAR(50) NOT NULL DEFAULT 'full',  -- full, incremental, config, media
    status          VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, running, completed, failed
    file_path       TEXT,
    file_size_bytes BIGINT,
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    error_message   TEXT,
    triggered_by    UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_backups_status ON system_backups(status);

-- 4. System Audit Events (structured event log beyond audit_logs)
CREATE TABLE IF NOT EXISTS system_audit_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type      VARCHAR(100) NOT NULL,         -- config_change, security_alert, backup, system_error
    severity        VARCHAR(20) DEFAULT 'info',    -- info, warning, error, critical
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    source          VARCHAR(100),                   -- module or service name
    affected_user   UUID REFERENCES users(id),
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_events_type ON system_audit_events(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_events_severity ON system_audit_events(severity);
CREATE INDEX IF NOT EXISTS idx_audit_events_created ON system_audit_events(created_at);

-- 5. Admin Notifications (system-level alerts for admins)
CREATE TABLE IF NOT EXISTS admin_notifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           VARCHAR(255) NOT NULL,
    message         TEXT,
    notification_type VARCHAR(50) NOT NULL DEFAULT 'info',  -- info, warning, alert, action_required
    link            VARCHAR(500),
    is_read         BOOLEAN DEFAULT false,
    target_user_id  UUID REFERENCES users(id) ON DELETE CASCADE,
    expires_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_notifs_unread ON admin_notifications(target_user_id, is_read) WHERE NOT is_read;

-- Seed some initial audit event types
INSERT INTO system_audit_events (event_type, severity, title, description, source)
SELECT 'system_startup', 'info', 'Admin Module Activated', 'Admin module migration 020 deployed successfully', 'system'
WHERE NOT EXISTS (SELECT 1 FROM system_audit_events LIMIT 1);

-- ============================================================
-- PER-PROPERTY SCOPING ENHANCEMENTS
-- ============================================================

-- Add property_id to vendors table (per-property vendor scoping)
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES properties(id) ON DELETE CASCADE;

-- Add property_id to employees table (per-property employee scoping)
ALTER TABLE employees ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES properties(id) ON DELETE CASCADE;

-- Add property_id to goods_received_notes (per-property GRN tracking)
ALTER TABLE goods_received_notes ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES properties(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_vendors_property ON vendors(property_id);
CREATE INDEX IF NOT EXISTS idx_employees_property ON employees(property_id);
