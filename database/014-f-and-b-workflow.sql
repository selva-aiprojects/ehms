-- 014-f-and-b-workflow.sql

-- 1. Meal Plans / Inclusions
CREATE TABLE IF NOT EXISTS meal_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    code VARCHAR(20) NOT NULL UNIQUE, -- e.g. 'EP', 'CP', 'MAP', 'AP'
    name VARCHAR(100) NOT NULL, -- e.g. 'Continental Plan'
    description TEXT,
    includes_breakfast BOOLEAN DEFAULT false,
    includes_lunch BOOLEAN DEFAULT false,
    includes_dinner BOOLEAN DEFAULT false
);

-- 2. F&B Menu
CREATE TABLE IF NOT EXISTS f_and_b_menu (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL, -- e.g. 'breakfast', 'beverages', 'main_course'
    item_name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    is_available BOOLEAN DEFAULT true
);

-- 3. F&B Orders
CREATE TABLE IF NOT EXISTS f_and_b_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
    order_type VARCHAR(20) CHECK (order_type IN ('room_service', 'restaurant_dine_in', 'takeaway')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'out_for_delivery', 'delivered', 'cancelled')),
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    is_complimentary BOOLEAN DEFAULT false,
    ordered_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMPTZ,
    notes TEXT
);

-- 4. F&B Order Items
CREATE TABLE IF NOT EXISTS f_and_b_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES f_and_b_orders(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES f_and_b_menu(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL
);

-- Link Meal Plan to Bookings (Optional: adding column if it doesn't exist)
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS meal_plan_id UUID REFERENCES meal_plans(id);

-- Insert standard meal plans
INSERT INTO meal_plans (property_id, code, name, description, includes_breakfast, includes_lunch, includes_dinner)
SELECT p.id, 'EP', 'European Plan', 'Room Only', false, false, false
FROM properties p WHERE p.code = 'OVH' ON CONFLICT DO NOTHING;

INSERT INTO meal_plans (property_id, code, name, description, includes_breakfast, includes_lunch, includes_dinner)
SELECT p.id, 'CP', 'Continental Plan', 'Room with Breakfast', true, false, false
FROM properties p WHERE p.code = 'OVH' ON CONFLICT DO NOTHING;

INSERT INTO meal_plans (property_id, code, name, description, includes_breakfast, includes_lunch, includes_dinner)
SELECT p.id, 'MAP', 'Modified American Plan', 'Room with Breakfast & One Major Meal', true, true, false
FROM properties p WHERE p.code = 'OVH' ON CONFLICT DO NOTHING;

-- Insert dummy menu items
INSERT INTO f_and_b_menu (property_id, category, item_name, description, price)
SELECT p.id, 'breakfast', 'Continental Breakfast Combo', 'Toast, Eggs, Juice, Coffee', 450.00
FROM properties p WHERE p.code = 'OVH';

INSERT INTO f_and_b_menu (property_id, category, item_name, description, price)
SELECT p.id, 'beverages', 'Fresh Orange Juice', 'Freshly squeezed', 150.00
FROM properties p WHERE p.code = 'OVH';

INSERT INTO f_and_b_menu (property_id, category, item_name, description, price)
SELECT p.id, 'main_course', 'Club Sandwich', 'Chicken, Bacon, Lettuce, Tomato with Fries', 350.00
FROM properties p WHERE p.code = 'OVH';
