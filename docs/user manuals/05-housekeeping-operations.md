# Manual 05: Housekeeping Operations

## 📌 Module Overview

The **Housekeeping Operations** module coordinates daily room cleaning, linen tracking, quality inspections, and staff scheduling across hotels, serviced apartments, and rental properties. It provides real-time room cleanliness statuses to the Front Desk to accelerate room turnarounds and guest check-ins.

---

## 🎯 Key Features & Capabilities

- **Real-Time Room Status Matrix**: Dynamic state tracking (`Vacant-Clean`, `Vacant-Dirty`, `Occupied-Dirty`, `Inspected-Ready`, `Out-of-Service`).
- **Automated Task Dispatch**: Auto-assignment of turnover cleaning tasks upon guest checkout and stay-over cleaning tasks for multi-night stays.
- **Linen & Supply Management**: Tracking linen issues, laundry dispatch/return, stock levels, and guest amenity consumption.
- **Supervisor Quality Inspections**: Digital audit checklists for room cleanliness verification before releasing rooms to guest inventory.
- **Staff Roster & Productivity**: Daily workload distribution, task completion timers, and housekeeping staff performance metrics.

---

## 🧭 Sub-Modules & Operating Procedures

### 1. Housekeeping Dashboard (`/dashboard/housekeeping`)
- **Navigation**: Sidebar -> Housekeeping -> **Housekeeping**
- **Operating Instructions**:
  1. View key metrics: Clean Rooms, Dirty Rooms, Pending Inspections, Out-of-Service Count, Active HK Staff On Duty.
  2. Filter rooms by Floor, Block, or Status.

### 2. Housekeeping Tasks (`/dashboard/housekeeping/tasks`)
- **Navigation**: Sidebar -> Housekeeping -> **HK Tasks**
- **Operating Instructions**:
  1. **Task Assignment**: Supervisor selects pending dirty rooms and assigns them to specific HK attendants.
  2. Task Priority Levels:
     - 🔥 `VIP Departure`: High priority turnover for incoming VIP arrival
     - ⚡ `Checkout Turnover`: Standard checkout cleaning
     - 🧹 `Stayover Touchup`: Daily cleaning for occupied guest room
     - 🧽 `Deep Clean`: Periodic comprehensive deep cleaning
  3. **Attendant Execution**: HK attendant marks task status as `In Progress`, performs cleaning according to SOP, and updates status to `Completed (Pending Inspection)`.

### 3. Linen Management (`/dashboard/housekeeping/linen`)
- **Navigation**: Sidebar -> Housekeeping -> **Linen**
- **Operating Instructions**:
  1. Track linen items: Bed sheets, Pillowcases, Bath towels, Hand towels, Duvets, Bathmats.
  2. Click **Dispatch to Commercial Laundry**: Enter quantity of soiled linen sent out, select laundry vendor, and generate Gate Pass.
  3. Click **Receive from Laundry**: Verify received clean linen count, log torn/damaged linen, and post laundry service expense bill.

### 4. Quality Inspections (`/dashboard/housekeeping/inspections`)
- **Navigation**: Sidebar -> Housekeeping -> **Inspections**
- **Operating Instructions**:
  1. Supervisor selects room in `Pending Inspection` state.
  2. Conduct digital checklist inspection (Bedding neatness, Bathroom sanitation, Dusting, Floor vacuuming, Mini-bar check, AC/TV operation).
  3. Pass/Fail scoring:
     - **PASSED**: Room status changes to `Vacant-Inspected / Ready for Check-in`. Front Desk can now assign the room.
     - **FAILED**: Supervisor adds notes/photos and re-assigns task to HK attendant for re-cleaning.

### 5. HK Staffing & Performance (`/dashboard/housekeeping/staff`)
- **Navigation**: Sidebar -> Housekeeping -> **HK Staff**
- **Operating Instructions**:
  1. Assign floor zones to attendants at start of morning shift.
  2. View average cleaning time per room (Target: 30 minutes for stayover, 45 minutes for checkout turnover).
  3. Monitor supervisor audit pass rates per staff member.

---

## 👥 Roles & Permissions Matrix

| Action | HK Staff | HK Supervisor | Property Manager | Front Desk |
| :--- | :---: | :---: | :---: | :---: |
| View Assigned Tasks | ✅ | ✅ | ✅ | Read Only |
| Mark Cleaning Complete | ✅ | ✅ | ✅ | ❌ |
| Conduct Room Inspections | ❌ | ✅ | ✅ | ❌ |
| Dispatch Linen to Laundry | ❌ | ✅ | ✅ | ❌ |
| Change Room Status to Inspected | ❌ | ✅ | ✅ | ❌ |

---

## 💡 Operational Best Practices

1. **Priority Room Clean List**: Supervisors must review Front Desk expected arrival times at 08:00 AM and assign rooms with early arrival requests to the first cleaning batch.
2. **Linen Loss Reconciliation**: Perform a physical linen stock count on the last day of every month to reconcile against system inventory and track laundry shrinkage.

---
*Document Version: 1.0 | Module: Housekeeping Operations*
