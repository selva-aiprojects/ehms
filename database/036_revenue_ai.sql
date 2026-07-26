CREATE TABLE IF NOT EXISTS revenue_ai_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  rule_type VARCHAR(50) NOT NULL CHECK (rule_type IN ('occupancy_threshold','day_of_week','seasonal','competitor','length_of_stay','event','custom')),
  name VARCHAR(255) NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  priority INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS revenue_ai_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  rate_plan_id UUID,
  original_rate DECIMAL(10,2),
  recommended_rate DECIMAL(10,2),
  applied_rate DECIMAL(10,2),
  factors JSONB DEFAULT '[]'::jsonb,
  confidence_score INT,
  applied_by VARCHAR(100) DEFAULT 'ai_engine',
  applied_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT
);

CREATE TABLE IF NOT EXISTS revenue_ai_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  forecast_date DATE NOT NULL,
  predicted_occupancy DECIMAL(5,2),
  predicted_adr DECIMAL(10,2),
  predicted_revpar DECIMAL(10,2),
  confidence INT,
  generated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(property_id, forecast_date)
);

CREATE TABLE IF NOT EXISTS competitor_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  competitor_name VARCHAR(255) NOT NULL,
  competitor_rating DECIMAL(2,1),
  distance_km DECIMAL(5,1),
  room_type VARCHAR(50),
  rate DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'INR',
  source VARCHAR(100),
  scraped_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rair_property ON revenue_ai_rules(property_id);
CREATE INDEX IF NOT EXISTS idx_raia_property ON revenue_ai_audit(property_id);
CREATE INDEX IF NOT EXISTS idx_raf_property ON revenue_ai_forecasts(property_id);
CREATE INDEX IF NOT EXISTS idx_raf_date ON revenue_ai_forecasts(forecast_date);
CREATE INDEX IF NOT EXISTS idx_cr_property ON competitor_rates(property_id);
CREATE INDEX IF NOT EXISTS idx_cr_room_type ON competitor_rates(room_type);
