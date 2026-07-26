CREATE TABLE IF NOT EXISTS restaurant_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS restaurant_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  section_id UUID REFERENCES restaurant_sections(id) ON DELETE SET NULL,
  table_number VARCHAR(20) NOT NULL,
  capacity INT NOT NULL DEFAULT 4,
  status VARCHAR(30) DEFAULT 'available' CHECK (status IN ('available','occupied','reserved','cleaning','out_of_service')),
  pos_x DECIMAL(5,1) DEFAULT 0,
  pos_y DECIMAL(5,1) DEFAULT 0,
  width DECIMAL(5,1) DEFAULT 60,
  height DECIMAL(5,1) DEFAULT 60,
  shape VARCHAR(20) DEFAULT 'square' CHECK (shape IN ('square','round','rectangle')),
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  occupied_at TIMESTAMPTZ,
  guest_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(property_id, table_number)
);

CREATE TABLE IF NOT EXISTS table_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  table_id UUID NOT NULL REFERENCES restaurant_tables(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  guest_name VARCHAR(255),
  guest_phone VARCHAR(30),
  party_size INT NOT NULL DEFAULT 2,
  reservation_time TIMESTAMPTZ NOT NULL,
  duration_mins INT DEFAULT 120,
  status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending','confirmed','seated','completed','cancelled','no_show')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS split_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES f_and_b_orders(id) ON DELETE CASCADE,
  split_type VARCHAR(20) NOT NULL DEFAULT 'equal' CHECK (split_type IN ('equal','by_item','custom','percentage')),
  total_amount DECIMAL(12,2) NOT NULL,
  guest_count INT NOT NULL DEFAULT 2,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','paid','partial')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS split_bill_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  split_bill_id UUID NOT NULL REFERENCES split_bills(id) ON DELETE CASCADE,
  order_item_id UUID REFERENCES f_and_b_order_items(id) ON DELETE SET NULL,
  label VARCHAR(255) DEFAULT 'Guest',
  amount DECIMAL(12,2) NOT NULL,
  percentage DECIMAL(5,2),
  is_paid BOOLEAN DEFAULT false,
  paid_at TIMESTAMPTZ,
  payment_method VARCHAR(30),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS kds_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES f_and_b_orders(id) ON DELETE CASCADE,
  table_number VARCHAR(20),
  priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('low','normal','high','rush')),
  status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new','in_progress','ready','served','cancelled')),
  station VARCHAR(100) DEFAULT 'all',
  fired_at TIMESTAMPTZ DEFAULT now(),
  acknowledged_at TIMESTAMPTZ,
  ready_at TIMESTAMPTZ,
  served_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS kds_stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  station_type VARCHAR(50) DEFAULT 'all',
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rt_property ON restaurant_tables(property_id);
CREATE INDEX IF NOT EXISTS idx_rt_status ON restaurant_tables(status);
CREATE INDEX IF NOT EXISTS idx_rt_section ON restaurant_tables(section_id);
CREATE INDEX IF NOT EXISTS idx_rs_property ON restaurant_sections(property_id);
CREATE INDEX IF NOT EXISTS idx_tres_property ON table_reservations(property_id);
CREATE INDEX IF NOT EXISTS idx_tres_time ON table_reservations(reservation_time);
CREATE INDEX IF NOT EXISTS idx_sb_order ON split_bills(order_id);
CREATE INDEX IF NOT EXISTS idx_sbi_split ON split_bill_items(split_bill_id);
CREATE INDEX IF NOT EXISTS idx_kds_property ON kds_tickets(property_id);
CREATE INDEX IF NOT EXISTS idx_kds_status ON kds_tickets(status);
CREATE INDEX IF NOT EXISTS idx_kds_station ON kds_tickets(station);

DO $$
DECLARE
  prop_rec RECORD;
BEGIN
  FOR prop_rec IN SELECT id FROM properties LIMIT 1
  LOOP
    IF NOT EXISTS (SELECT 1 FROM restaurant_sections WHERE property_id = prop_rec.id) THEN
      INSERT INTO restaurant_sections (property_id, name, description, sort_order)
      VALUES (prop_rec.id, 'Main Hall', 'Primary dining area', 1);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM restaurant_tables WHERE property_id = prop_rec.id) THEN
      DECLARE
        sec_id UUID;
      BEGIN
        SELECT id INTO sec_id FROM restaurant_sections WHERE property_id = prop_rec.id AND name = 'Main Hall' LIMIT 1;
        INSERT INTO restaurant_tables (property_id, section_id, table_number, capacity, shape, pos_x, pos_y)
        VALUES
          (prop_rec.id, sec_id, 'T1', 4, 'square', 20, 20),
          (prop_rec.id, sec_id, 'T2', 4, 'square', 120, 20),
          (prop_rec.id, sec_id, 'T3', 6, 'round', 220, 20),
          (prop_rec.id, sec_id, 'T4', 8, 'rectangle', 20, 120);
      END;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM kds_stations WHERE property_id = prop_rec.id) THEN
      INSERT INTO kds_stations (property_id, name, station_type, display_order)
      VALUES
        (prop_rec.id, 'Hot Kitchen', 'hot', 1),
        (prop_rec.id, 'Cold Kitchen / Bar', 'cold', 2);
    END IF;
  END LOOP;
END $$;
