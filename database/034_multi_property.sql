-- 034_multi_property.sql — Multi-Property Group Dashboard, Cross-Property Analytics
-- Run in tenant schema

-- ── Property Groups ──
CREATE TABLE IF NOT EXISTS property_groups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  logo_url    TEXT,
  owner_id    UUID REFERENCES users(id),
  config      JSONB DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Link properties to groups
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='properties' AND column_name='group_id') THEN
    ALTER TABLE properties ADD COLUMN group_id UUID REFERENCES property_groups(id);
  END IF;
END $$;

-- ── Central Rate Management ──
CREATE TABLE IF NOT EXISTS central_rate_plans (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id      UUID NOT NULL REFERENCES property_groups(id),
  name          TEXT NOT NULL,
  description   TEXT,
  is_active     BOOLEAN DEFAULT true,

  -- Rate rules (JSONB for flexibility)
  base_rates    JSONB DEFAULT '{}'::jsonb,    -- { "single": 2500, "double": 3500, "suite": 6000 }
  seasonal_mult JSONB DEFAULT '{}'::jsonb,    -- { "peak": 1.3, "offseason": 0.8 }
  weekday_rules JSONB DEFAULT '{}'::jsonb,
  weekend_rules JSONB DEFAULT '{}'::jsonb,

  effective_from DATE,
  effective_to   DATE,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── Cross-Property Guest Profiles ──
CREATE TABLE IF NOT EXISTS cross_property_guests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id        UUID NOT NULL REFERENCES property_groups(id),
  master_guest_id UUID NOT NULL REFERENCES guest_profiles(id),

  -- Aggregated stats
  total_stays     INT DEFAULT 0,
  total_spend     NUMERIC(14,2) DEFAULT 0,
  total_nights    INT DEFAULT 0,
  avg_rating      NUMERIC(3,2),
  favorite_property_id UUID REFERENCES properties(id),
  last_stay_property_id UUID REFERENCES properties(id),
  last_stay_at    TIMESTAMPTZ,

  loyalty_points  INT DEFAULT 0,
  loyalty_tier    TEXT DEFAULT 'standard',

  -- Cross-property tags
  tags            JSONB DEFAULT '[]'::jsonb,
  notes           TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── Daily Property Snapshots (for analytics) ──
CREATE TABLE IF NOT EXISTS property_daily_snapshots (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id   UUID NOT NULL REFERENCES properties(id),
  snapshot_date DATE NOT NULL,

  total_rooms     INT,
  occupied_rooms  INT,
  occupancy_pct   NUMERIC(5,2),
  adr             NUMERIC(10,2),     -- Average Daily Rate
  revpar          NUMERIC(10,2),     -- Revenue per Available Room
  total_revenue   NUMERIC(14,2),
  room_revenue    NUMERIC(14,2),
  fb_revenue      NUMERIC(14,2),
  other_revenue   NUMERIC(14,2),

  checkins        INT DEFAULT 0,
  checkouts       INT DEFAULT 0,
  no_shows        INT DEFAULT 0,
  cancellations   INT DEFAULT 0,

  avg_guest_rating NUMERIC(3,2),
  complaints      INT DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(property_id, snapshot_date)
);

-- ── Indexes ──
CREATE INDEX IF NOT EXISTS idx_property_groups_owner ON property_groups(owner_id);
CREATE INDEX IF NOT EXISTS idx_central_rates_group ON central_rate_plans(group_id);
CREATE INDEX IF NOT EXISTS idx_cross_property_group ON cross_property_guests(group_id);
CREATE INDEX IF NOT EXISTS idx_cross_property_guest ON cross_property_guests(master_guest_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_property ON property_daily_snapshots(property_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_date ON property_daily_snapshots(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_properties_group ON properties(group_id);

-- ── Seed a default group ──
INSERT INTO property_groups (name, description)
SELECT 'Default Group', 'Auto-created property group'
WHERE NOT EXISTS (SELECT 1 FROM property_groups LIMIT 1);

-- ── Backfill snapshots for last 7 days (empty data) ──
INSERT INTO property_daily_snapshots (property_id, snapshot_date, total_rooms)
SELECT p.id, gs::date,
  (SELECT COUNT(*) FROM units u JOIN floors fl ON u.floor_id = fl.id JOIN buildings b ON fl.building_id = b.id WHERE b.property_id = p.id AND u.is_active = true)
FROM properties p
CROSS JOIN generate_series(CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE - INTERVAL '1 day', '1 day') AS gs
WHERE NOT EXISTS (
  SELECT 1 FROM property_daily_snapshots s WHERE s.property_id = p.id AND s.snapshot_date = gs::date
)
ON CONFLICT (property_id, snapshot_date) DO NOTHING;
