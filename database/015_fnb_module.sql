-- Migration 015: Food & Beverage Module
-- F&B Menu Items
CREATE TABLE IF NOT EXISTS f_and_b_menu (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id     UUID REFERENCES properties(id) ON DELETE CASCADE,
    category        VARCHAR(100) NOT NULL,       -- Breakfast, Appetizers, Main Course, Desserts, Beverages, Room Service Specials
    item_name       VARCHAR(255) NOT NULL,
    description     TEXT,
    price           DECIMAL(10,2) NOT NULL,
    currency        VARCHAR(3) DEFAULT 'INR',
    is_veg          BOOLEAN DEFAULT true,
    is_available    BOOLEAN DEFAULT true,
    prep_time_mins  INT DEFAULT 15,
    photo_url       TEXT,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- F&B Orders
CREATE TABLE IF NOT EXISTS f_and_b_orders (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id     UUID REFERENCES properties(id),
    booking_id      UUID REFERENCES bookings(id),
    order_type      VARCHAR(50) DEFAULT 'room_service',  -- room_service, restaurant, bar, takeaway
    status          VARCHAR(50) DEFAULT 'pending',        -- pending, preparing, ready, delivered, cancelled
    total_amount    DECIMAL(12,2) DEFAULT 0,
    is_complimentary BOOLEAN DEFAULT false,
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

-- F&B Order Line Items
CREATE TABLE IF NOT EXISTS f_and_b_order_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID NOT NULL REFERENCES f_and_b_orders(id) ON DELETE CASCADE,
    menu_item_id    UUID REFERENCES f_and_b_menu(id),
    item_name       VARCHAR(255) NOT NULL,
    quantity        INT DEFAULT 1,
    unit_price      DECIMAL(10,2) NOT NULL,
    line_total      DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    special_request TEXT
);

CREATE INDEX IF NOT EXISTS idx_fnb_menu_category ON f_and_b_menu(category);
CREATE INDEX IF NOT EXISTS idx_fnb_orders_booking ON f_and_b_orders(booking_id);
CREATE INDEX IF NOT EXISTS idx_fnb_orders_status ON f_and_b_orders(status);

ALTER TABLE f_and_b_menu ADD COLUMN IF NOT EXISTS is_veg BOOLEAN DEFAULT true;
ALTER TABLE f_and_b_menu ADD COLUMN IF NOT EXISTS prep_time_mins INT DEFAULT 15;
ALTER TABLE f_and_b_menu ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE f_and_b_orders ADD COLUMN IF NOT EXISTS is_complimentary BOOLEAN DEFAULT false;
ALTER TABLE f_and_b_orders ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE f_and_b_order_items ADD COLUMN IF NOT EXISTS special_request TEXT;

-- Seed sample menu items (common hotel items, no property filter needed for demo)
INSERT INTO f_and_b_menu (category, item_name, description, price, is_veg, prep_time_mins) VALUES
-- Breakfast
('Breakfast', 'Continental Breakfast', 'Assorted breads, butter, jam, orange juice, tea/coffee', 350.00, true, 10),
('Breakfast', 'Full English Breakfast', 'Eggs, toast, sausage, grilled tomato, mushrooms, baked beans', 550.00, false, 20),
('Breakfast', 'South Indian Platter', 'Idli, vada, dosa with sambar and chutneys', 280.00, true, 15),
('Breakfast', 'Fruit Bowl & Yogurt', 'Seasonal fresh fruits with Greek yogurt and honey', 220.00, true, 5),
-- Appetizers
('Appetizers', 'Veg Spring Rolls (6 pcs)', 'Crispy rolls stuffed with seasonal vegetables', 280.00, true, 15),
('Appetizers', 'Chicken Tikka', 'Tandoor-grilled chicken with mint chutney', 420.00, false, 20),
('Appetizers', 'Bruschetta', 'Toasted bread with tomatoes, basil, and olive oil', 250.00, true, 10),
('Appetizers', 'Prawn Cocktail', 'Chilled prawns with Marie Rose sauce', 480.00, false, 10),
-- Main Course
('Main Course', 'Butter Chicken', 'Slow-cooked chicken in creamy tomato-based gravy', 520.00, false, 25),
('Main Course', 'Dal Makhani', 'Black lentils slow-cooked overnight, tempered with cream', 380.00, true, 25),
('Main Course', 'Grilled Salmon', 'Atlantic salmon with lemon butter sauce and seasonal vegetables', 750.00, false, 25),
('Main Course', 'Mushroom Stroganoff', 'Creamy mushroom sauce over pasta or rice', 450.00, true, 20),
('Main Course', 'Chicken Club Sandwich', 'Grilled chicken with bacon, lettuce, tomato on toasted bread', 480.00, false, 15),
('Main Course', 'Paneer Makhani', 'Cottage cheese cubes in rich tomato-cream gravy', 420.00, true, 20),
-- Desserts
('Desserts', 'Gulab Jamun (2 pcs)', 'Soft milk dumplings soaked in rose-flavored sugar syrup', 180.00, true, 5),
('Desserts', 'Tiramisu', 'Classic Italian dessert with mascarpone and coffee', 280.00, true, 5),
('Desserts', 'Fresh Fruit Sorbet', 'House-made seasonal fruit sorbet', 220.00, true, 5),
('Desserts', 'Chocolate Lava Cake', 'Warm chocolate cake with molten center, served with vanilla ice cream', 320.00, true, 15),
-- Beverages
('Beverages', 'Freshly Brewed Coffee', 'Arabica single-origin, choice of espresso or filter', 120.00, true, 5),
('Beverages', 'Fresh Lime Soda', 'Lime, sugar, soda — sweet, salty, or mixed', 100.00, true, 3),
('Beverages', 'Mango Lassi', 'Chilled yogurt with fresh Alphonso mango pulp', 150.00, true, 5),
('Beverages', 'Mineral Water (500ml)', 'Chilled packaged drinking water', 60.00, true, 1),
('Beverages', 'Masala Chai', 'Ginger-cardamom spiced tea with milk', 90.00, true, 5),
-- Room Service Specials
('Room Service Specials', 'Late Night Burger', 'Beef/Veggie burger with fries, available 10pm-6am', 520.00, false, 20),
('Room Service Specials', 'Midnight Noodles', 'Spicy wok-tossed noodles with vegetables and egg', 350.00, false, 15),
('Room Service Specials', 'Cheese Quesadilla', 'Grilled tortilla with melted cheese and salsa', 320.00, true, 15);
