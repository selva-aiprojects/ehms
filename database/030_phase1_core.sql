-- ============================================================
-- 030_phase1_core.sql
-- Phase 1: Loyalty, Dynamic Pricing, Laundry, Guest Enhancements
-- ============================================================

-- ── 1. LOYALTY TIERS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS loyalty_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  min_stays INT NOT NULL DEFAULT 0,
  min_spend DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount_pct DECIMAL(5,2) NOT NULL DEFAULT 0,
  points_multiplier DECIMAL(3,1) NOT NULL DEFAULT 1.0,
  benefits JSONB NOT NULL DEFAULT '[]'::jsonb,
  tier_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (property_id, name)
);

-- ── 2. LOYALTY TRANSACTIONS ───────────────────────────────
CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id UUID NOT NULL REFERENCES guest_profiles(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  points DECIMAL(10,2) NOT NULL,
  type VARCHAR(30) NOT NULL CHECK (type IN ('earned','redeemed','adjusted','expired','bonus')),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_loyalty_tx_guest ON loyalty_transactions(guest_id);

-- ── 3. LOYALTY REWARDS ────────────────────────────────────
CREATE TABLE IF NOT EXISTS loyalty_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  reward_type VARCHAR(50) NOT NULL CHECK (reward_type IN ('room_upgrade','free_breakfast','spa_credit','fb_credit','free_night','late_checkout')),
  points_required INT NOT NULL DEFAULT 0,
  value DECIMAL(10,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 4. LOYALTY REDEMPTIONS ────────────────────────────────
CREATE TABLE IF NOT EXISTS loyalty_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id UUID NOT NULL REFERENCES guest_profiles(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES loyalty_rewards(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  points_used INT NOT NULL,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','fulfilled','cancelled'))
);

-- ── 5. GUEST PREFERENCES ──────────────────────────────────
CREATE TABLE IF NOT EXISTS guest_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id UUID NOT NULL REFERENCES guest_profiles(id) ON DELETE CASCADE,
  preference_key VARCHAR(100) NOT NULL,
  preference_value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (guest_id, preference_key)
);
CREATE INDEX IF NOT EXISTS idx_guest_pref_guest ON guest_preferences(guest_id);

-- ── 6. GUEST TIMELINE ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS guest_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id UUID NOT NULL REFERENCES guest_profiles(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  event_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_guest_timeline_guest ON guest_timeline(guest_id, event_at DESC);

-- ── 7. PRICING RULES ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  rule_type VARCHAR(50) NOT NULL CHECK (rule_type IN ('occupancy','day_of_week','season','length_of_stay','last_minute','festival','minimum_stay')),
  conditions JSONB NOT NULL DEFAULT '{}'::jsonb,
  adjustments JSONB NOT NULL DEFAULT '{}'::jsonb,
  priority INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_prop ON pricing_rules(property_id, is_active);

-- ── 8. PRICING SEASONS ────────────────────────────────────
CREATE TABLE IF NOT EXISTS pricing_seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  multiplier DECIMAL(4,2) NOT NULL DEFAULT 1.00,
  color VARCHAR(20) DEFAULT '#3B82F6',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_date >= start_date)
);
CREATE INDEX IF NOT EXISTS idx_pricing_seasons_prop ON pricing_seasons(property_id, start_date, end_date);

-- ── 9. PRICING AUDIT LOG ──────────────────────────────────
CREATE TABLE IF NOT EXISTS pricing_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  room_type VARCHAR(50),
  unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  old_rate DECIMAL(10,2),
  new_rate DECIMAL(10,2) NOT NULL,
  rule_applied VARCHAR(255),
  triggered_by VARCHAR(50) DEFAULT 'system',
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pricing_audit_prop ON pricing_audit_log(property_id, date);

-- ── 10. PAYMENT TRANSACTIONS (Gateway) ────────────────────
CREATE TABLE IF NOT EXISTS payment_gateway_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  gateway_name VARCHAR(50) NOT NULL,
  gateway_txn_id VARCHAR(255),
  gateway_order_id VARCHAR(255),
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'INR',
  status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','authorized','captured','failed','refunded','partially_refunded')),
  payment_method VARCHAR(50),
  gateway_response JSONB,
  customer_email VARCHAR(255),
  customer_phone VARCHAR(20),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pgtx_payment ON payment_gateway_transactions(payment_id);
CREATE INDEX IF NOT EXISTS idx_pgtx_booking ON payment_gateway_transactions(booking_id);
CREATE INDEX IF NOT EXISTS idx_pgtx_gateway_id ON payment_gateway_transactions(gateway_txn_id);

-- ── 11. REFUND TRANSACTIONS ───────────────────────────────
CREATE TABLE IF NOT EXISTS refund_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  gateway_txn_id VARCHAR(255),
  amount DECIMAL(12,2) NOT NULL,
  reason TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processed','failed')),
  processed_by UUID REFERENCES users(id),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 12. LAUNDRY ORDERS ────────────────────────────────────
CREATE TABLE IF NOT EXISTS laundry_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  guest_id UUID REFERENCES guest_profiles(id) ON DELETE SET NULL,
  unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','picked_up','in_progress','ready','delivered','cancelled')),
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  is_complimentary BOOLEAN NOT NULL DEFAULT false,
  special_instructions TEXT,
  estimated_delivery TIMESTAMPTZ,
  actual_delivery TIMESTAMPTZ,
  vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_laundry_prop ON laundry_orders(property_id, status);
CREATE INDEX IF NOT EXISTS idx_laundry_booking ON laundry_orders(booking_id);

-- ── 13. LAUNDRY ORDER ITEMS ───────────────────────────────
CREATE TABLE IF NOT EXISTS laundry_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES laundry_orders(id) ON DELETE CASCADE,
  item_name VARCHAR(255) NOT NULL,
  item_type VARCHAR(100),
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  line_total DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  wash_type VARCHAR(50) DEFAULT 'regular' CHECK (wash_type IN ('regular','dry_clean','iron_only','stain_removal')),
  status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','returned','lost')),
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_laundry_items_order ON laundry_order_items(order_id);

-- ── 14. LAUNDRY PRICE LIST ────────────────────────────────
CREATE TABLE IF NOT EXISTS laundry_price_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  item_name VARCHAR(255) NOT NULL,
  item_category VARCHAR(100),
  wash_type VARCHAR(50) NOT NULL DEFAULT 'regular',
  price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'INR',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (property_id, item_name, wash_type)
);

-- ── SEED: Default loyalty tiers for existing properties ────
DO $$
DECLARE
  prop RECORD;
BEGIN
  FOR prop IN SELECT id FROM properties WHERE is_active = true LOOP
    INSERT INTO loyalty_tiers (property_id, name, min_stays, min_spend, discount_pct, points_multiplier, tier_order, benefits)
    VALUES
      (prop.id, 'Silver',   0,   0,      0,  1.0, 1, '["Welcome drink","Early check-in subject to availability"]'::jsonb),
      (prop.id, 'Gold',     5,   50000,  5,  1.5, 2, '["Welcome drink","Priority check-in","Room upgrade subject to availability","10% F&B discount"]'::jsonb),
      (prop.id, 'Platinum', 15,  200000, 10, 2.0, 3, '["Welcome drink","Guaranteed late checkout","Guaranteed room upgrade","20% F&B discount","Complimentary breakfast","Spa credit ₹500"]'::jsonb)
    ON CONFLICT (property_id, name) DO NOTHING;
  END LOOP;
END $$;

-- ── SEED: Default laundry price list for existing properties ──
DO $$
DECLARE
  prop RECORD;
BEGIN
  FOR prop IN SELECT id FROM properties WHERE is_active = true AND vertical_type IN ('hotel','service_apartment') LOOP
    INSERT INTO laundry_price_list (property_id, item_name, item_category, wash_type, price)
    VALUES
      (prop.id, 'Shirt',           'Clothing',  'regular',    40),
      (prop.id, 'Shirt',           'Clothing',  'dry_clean',  80),
      (prop.id, 'Trousers',        'Clothing',  'regular',    45),
      (prop.id, 'Trousers',        'Clothing',  'dry_clean',  90),
      (prop.id, 'Suit (2-piece)',  'Clothing',  'dry_clean', 250),
      (prop.id, 'Dress',           'Clothing',  'regular',    60),
      (prop.id, 'Dress',           'Clothing',  'dry_clean', 120),
      (prop.id, 'Bedsheet',        'Linen',     'regular',    30),
      (prop.id, 'Pillowcase',      'Linen',     'regular',    15),
      (prop.id, 'Towel (Bath)',    'Linen',     'regular',    20),
      (prop.id, 'Towel (Hand)',    'Linen',     'regular',    10),
      (prop.id, 'Jacket',          'Clothing',  'dry_clean', 150),
      (prop.id, 'Saree',           'Clothing',  'dry_clean', 120),
      (prop.id, 'Kurta',           'Clothing',  'regular',    50),
      (prop.id, 'Blanket',         'Linen',     'regular',    80),
      (prop.id, 'Duvet Cover',     'Linen',     'regular',    60)
    ON CONFLICT (property_id, item_name, wash_type) DO NOTHING;
  END LOOP;
END $$;
