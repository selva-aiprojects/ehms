-- 016_system_settings.sql
-- Creates the global configuration table for HostSphere

CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255) NOT NULL DEFAULT 'HostSphere',
    logo_url VARCHAR(255) NOT NULL DEFAULT '/hostsphere-logo.png',
    primary_color VARCHAR(50) NOT NULL DEFAULT '#D4AF37',
    secondary_color VARCHAR(50) NOT NULL DEFAULT '#0F172A',
    currency_symbol VARCHAR(10) NOT NULL DEFAULT '₹',
    timezone VARCHAR(100) NOT NULL DEFAULT 'Asia/Kolkata',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Insert a default configuration row if the table is empty
INSERT INTO system_settings (
    company_name, 
    logo_url, 
    primary_color, 
    secondary_color, 
    currency_symbol, 
    timezone
)
SELECT 
    'HostSphere', 
    '/hostsphere-logo.png', 
    '#D4AF37', 
    '#0F172A', 
    '₹', 
    'Asia/Kolkata'
WHERE NOT EXISTS (
    SELECT 1 FROM system_settings LIMIT 1
);
