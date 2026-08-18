-- ============================================================================
-- Flat & Room Hierarchy Setup (028)
--   Adds parent_unit_id column to model hierarchical relationships 
--   (e.g., Rooms/Bedrooms nested within a Flat/Apartment) for co-living packing.
-- ============================================================================

-- Step 1: Add parent_unit_id column
ALTER TABLE units ADD COLUMN parent_unit_id UUID REFERENCES units(id) ON DELETE SET NULL;

-- Step 2: Create index for performance
CREATE INDEX IF NOT EXISTS idx_units_parent_unit ON units(parent_unit_id);

-- Step 3: Add constraint ensuring parent/child integrity
-- An apartment has no parent, whereas child bedrooms must point to a parent unit.
ALTER TABLE units ADD CONSTRAINT chk_unit_hierarchy 
CHECK (
    (parent_unit_id IS NULL) OR 
    (unit_type IN ('room', 'suite') AND parent_unit_id IS NOT NULL)
);
