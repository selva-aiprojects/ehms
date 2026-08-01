# Manual 02: Hotels & Serviced Apartments Management

## 📌 Module Overview

The **Hotels & Serviced Apartments Management** module empowers Property Managers and Operations Directors to set up, configure, and operate hotel properties and serviced apartment buildings. It encompasses room category management, unit allocation, pricing matrix rules, and granular property feature toggle configurations.

---

## 🎯 Key Features & Capabilities

- **Multi-Hotel & Apartment Portfolio Management**: Centralized management of multiple hotel properties, resorts, and serviced apartment towers.
- **Room & Unit Directory**: Granular tracking of physical units (Room numbers, Floor levels, Wings, Blocks, Bed configurations, Unit sizes in sq. ft.).
- **Category & Grade Management**: Flexible room categorization (Standard, Deluxe, Executive Suite, Presidential Suite, Studio Apartment, 2BHK Serviced Unit).
- **Dynamic Feature Toggles**: Per-property feature activation (Rooms Map, Rate Card, Restaurant POS, Bar, Laundry, Maintenance, Gym, Yoga, Swimming Pool, Spa).
- **Rate Card Matrix**: Day-of-week pricing, seasonal multipliers, weekend surcharges, and length-of-stay discounts.

---

## 🧭 Sub-Modules & Operating Procedures

### 1. Hotels Overview (`/dashboard/hotels`)
- **Navigation**: Sidebar -> Properties & Verticals -> **Hotels**
- **Operating Instructions**:
  1. View overall hotel metrics: Active Properties, Total Room Capacity, Average Occupancy %, Daily Revenue.
  2. Click **Add New Hotel** to register a new property entity.
  3. Enter Property Name, Address, Timezone, Default Currency (e.g., `INR`, `USD`), Primary Contact, and Total Capacity.

### 2. Serviced Apartments Overview (`/dashboard/apartments`)
- **Navigation**: Sidebar -> Properties & Verticals -> **Apartments**
- **Operating Instructions**:
  1. View apartment complexes and serviced tower listings.
  2. Manage long-stay vs. short-stay unit inventory allocations.
  3. Set up unit utility meters (Electricity, Water, Gas meter IDs) for serviced apartment monthly billing.

### 3. Rooms & Units Inventory (`/dashboard/rooms-inventory`)
- **Navigation**: Sidebar -> Properties & Verticals -> **Rooms & Units**
- **Operating Instructions**:
  1. View complete grid of all physical rooms/units across properties.
  2. Filter by Property, Category, Floor, Status (Clean, Dirty, Inspected, Out of Order).
  3. Click **Add Room**:
     - Room Number / Code (e.g., `101`, `A-204`)
     - Category (Select from standard master categories)
     - Floor Number (e.g., Floor 1, Floor 2)
     - Status: `vacant_clean`, `vacant_dirty`, `occupied`, `maintenance`
     - Base Price per Night

### 4. Property Configuration & Feature Toggles (`/dashboard/admin/properties/[id]`)
- **Navigation**: Sidebar -> Administration -> **Workspaces** -> Select Property -> **Configuration Tab**
- **Operating Instructions**:
  1. Navigate to Property Detail page.
  2. Under the **Feature Settings** tab, toggle individual operational modules ON or OFF based on property amenities:
     - 🏨 `rooms_map`: Interactive visual room map
     - 💳 `rate_card`: Dynamic rate card calculation
     - 🍽️ `restaurant`: F&B & Dining POS module
     - 🍸 `bar`: Bar management
     - 🧺 `laundry`: Laundry service management
     - 🛠️ `maintenance`: Work order ticketing
     - 🏋️ `gym`: Fitness center access log
     - 🧘 `yoga`: Wellness session management
     - 🏊 `swimming_pool`: Pool access & pass management
     - 💆 `spa`: Spa booking & therapy management
  3. Click **Save Configuration**. The UI sidebar and dashboard immediately update to hide disabled feature items for users scoped to this property.

---

## 👥 Roles & Permissions Matrix

| Action | Property Manager | Executive | Super Admin | Front Desk |
| :--- | :---: | :---: | :---: | :---: |
| Register New Property | ❌ | ✅ | ✅ | ❌ |
| Configure Feature Toggles | ✅ | ✅ | ✅ | ❌ |
| Edit Room Master Data | ✅ | ✅ | ✅ | Read Only |
| Update Room Operational Status | ✅ | ✅ | ✅ | ✅ |

---

## 💡 Operational Best Practices

1. **Feature Scoping**: Disable non-applicable feature toggles (e.g., disable `spa` or `restaurant` for standard long-stay serviced apartments) to streamline the user interface for staff.
2. **Preventive Maintenance Blocks**: Mark room status as `Out of Order / Maintenance` prior to scheduled renovations so rooms are automatically excluded from availability searches.

---
*Document Version: 1.0 | Module: Hotels & Serviced Apartments*
