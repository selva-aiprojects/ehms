-- Property Configuration & Features
-- Uses the existing properties.config JSONB column
-- Defines a standard schema for feature toggles per property
--
-- Config Schema:
-- {
--   "features": {
--     "rooms_map":     { "enabled": true,  "label": "Rooms Map" },
--     "rate_card":     { "enabled": true,  "label": "Rate Card" },
--     "restaurant":    { "enabled": false, "label": "Restaurant" },
--     "bar":           { "enabled": false, "label": "Bar" },
--     "laundry":       { "enabled": true,  "label": "Laundry" },
--     "maintenance":   { "enabled": true,  "label": "Maintenance" },
--     "gym":           { "enabled": false, "label": "Gym" },
--     "yoga":          { "enabled": false, "label": "Yoga" },
--     "swimming_pool": { "enabled": false, "label": "Swimming Pool" },
--     "spa":           { "enabled": false, "label": "Spa" },
--     "restaurant":    { "enabled": false, "label": "Restaurant" },
--     "bar":           { "enabled": false, "label": "Bar" },
--     "laundry":       { "enabled": true,  "label": "Laundry" }
--   },
--   "settings": {
--     "timezone": "Asia/Kolkata",
--     "currency": "INR"
--   }
-- }
--
-- Workflow Impact:
-- - rooms_map:      Enables room diagram / floor plan view in front desk
-- - rate_card:      Enables dynamic pricing / rate plan management
-- - restaurant:     Enables F&B module (restaurant POS, menu, orders)
-- - bar:            Enables bar-specific module
-- - laundry:        Enables laundry service requests & tracking
-- - maintenance:    Enables maintenance ticket system (global fallback: always on)
-- - gym:            Enables gym/fitness center booking
-- - yoga:           Enables yoga class scheduling
-- - swimming_pool:  Enables pool access management
-- - spa:            Enables spa booking & services

-- Set default config for existing properties that have empty config
UPDATE properties
SET config = jsonb_set(
  config,
  '{features}',
  '{
    "rooms_map":     {"enabled": true,  "label": "Rooms Map"},
    "rate_card":     {"enabled": true,  "label": "Rate Card"},
    "restaurant":    {"enabled": false, "label": "Restaurant"},
    "bar":           {"enabled": false, "label": "Bar"},
    "laundry":       {"enabled": true,  "label": "Laundry"},
    "maintenance":   {"enabled": true,  "label": "Maintenance"},
    "gym":           {"enabled": false, "label": "Gym"},
    "yoga":          {"enabled": false, "label": "Yoga"},
    "swimming_pool": {"enabled": false, "label": "Swimming Pool"},
    "spa":           {"enabled": false, "label": "Spa"}
  }'::jsonb
)
WHERE config = '{}' OR config IS NULL OR NOT (config ? 'features');
