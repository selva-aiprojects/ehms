# Manual 06: Maintenance & Asset Operations

## 📌 Module Overview

The **Maintenance & Asset Operations** module ensures peak operational efficiency of facility equipment, guest rooms, MEP (Mechanical, Electrical, Plumbing) infrastructure, and high-value assets. It automates reactive work order ticketing, preventive maintenance (PPM) schedules, spare parts inventory control, and vendor service dispatch.

---

## 🎯 Key Features & Capabilities

- **Work Order & Ticket Dispatch**: Reactive ticket creation from Front Desk, Housekeeping, or guest complaints, with priority routing to engineering technicians.
- **Preventive Maintenance (PPM)**: Automated recurring maintenance schedules for HVAC units, elevators, diesel generators, fire suppression systems, and boilers.
- **Spare Parts Inventory**: Stock management for plumbing fittings, electrical switches, light bulbs, paint, HVAC filters, and refrigeration components.
- **Asset Lifecycle Registry**: Detailed register of physical assets (Model, Serial Number, Purchase Date, Warranty Expiration, Location, Depreciation Schedule, Maintenance History).

---

## 🧭 Sub-Modules & Operating Procedures

### 1. Maintenance Dashboard (`/dashboard/maintenance`)
- **Navigation**: Sidebar -> Maintenance -> **Maintenance**
- **Operating Instructions**:
  1. View key metrics: Open Tickets, In-Progress Tickets, SLA Breaches, Pending PPM Jobs, Low Stock Spare Parts.
  2. Filter by Category: Electrical, Plumbing, HVAC, Carpentry, Masonry, IT/AV, Appliance.

### 2. Maintenance Tickets (`/dashboard/maintenance/tickets`)
- **Navigation**: Sidebar -> Maintenance -> **Tickets**
- **Operating Instructions**:
  1. **Log New Ticket**:
     - Location (Room 302, Main Kitchen, Gym, Elevator 2)
     - Issue Category & Description (e.g., "Air Conditioner not cooling", "Water tap leaking")
     - Priority: `Low`, `Medium`, `High`, `Emergency`
     - Asset Affected (Optional dropdown)
  2. **Technician Assignment**: Supervisor assigns ticket to a technician or external vendor.
  3. **Resolution & Sign-off**: Technician completes repair, attaches spare parts used from inventory, updates resolution notes, and marks status as `Resolved`.

### 3. Spare Parts Catalog (`/dashboard/maintenance/parts`)
- **Navigation**: Sidebar -> Maintenance -> **Parts**
- **Operating Instructions**:
  1. View stock levels of technical spare parts.
  2. Log stock inward when receiving items from procurement.
  3. System automatically decrements part quantities when technicians log part usage against work order tickets.
  4. Automatic low-stock alert when quantity drops below predefined Reorder Level.

### 4. Assets Registry (`/dashboard/maintenance/assets`)
- **Navigation**: Sidebar -> Maintenance -> **Assets**
- **Operating Instructions**:
  1. Click **Add New Asset**.
  2. Enter Asset Details:
     - Asset Name & Code (e.g., `CHILLER-01`, `GENSET-100KVA`)
     - Category (HVAC, Power, Safety, Kitchen Equipment, IT)
     - Location (Roof Deck, Basement Electrical Room)
     - Manufacturer, Model, Serial Number
     - Purchase Date & Cost
     - Warranty Expiration Date
     - Preventive Maintenance Interval (e.g., Monthly, Quarterly, Bi-Annually)
  3. View complete service history and repair expenses accumulated over the asset lifetime.

---

## 👥 Roles & Permissions Matrix

| Action | Maintenance Staff | Maint Supervisor | Property Manager | Super Admin |
| :--- | :---: | :---: | :---: | :---: |
| View Assigned Work Orders | ✅ | ✅ | ✅ | ✅ |
| Create New Tickets | ✅ | ✅ | ✅ | ✅ |
| Assign Tickets & Vendors | ❌ | ✅ | ✅ | ✅ |
| Manage Asset Registry & PPM | ❌ | ✅ | ✅ | ✅ |
| Close & Verify Tickets | ✅ | ✅ | ✅ | ✅ |

---

## 💡 Operational Best Practices

1. **Emergency Isolation**: For emergency water leaks or electrical outages, mark the affected room or floor as `Out of Order` immediately in the system to prevent room assignment by Front Desk.
2. **Warranty Verification**: Before logging external vendor repair bills, check the **Asset Registry** to verify if the machine or component is still covered under OEM warranty or AMC contract.

---
*Document Version: 1.0 | Module: Maintenance & Asset Operations*
