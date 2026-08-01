# Manual 12: Restaurant POS & Kitchen Operations

## 📌 Module Overview

The **Restaurant POS & Kitchen Operations** module handles dining room table management, order entry, Kitchen Order Tickets (KOT), real-time Kitchen Display Systems (KDS), room-charge posting, and F&B menu catalog management for hotel restaurants, cafes, and room service.

---

## 🎯 Key Features & Capabilities

- **Touchscreen Restaurant POS**: Table layout view, quick item search, modifier options (Spicy level, No Onions, Extra Cheese), and split billing.
- **Direct Room Charge Posting**: One-click posting of restaurant bills to checked-in guest room folios with guest signature capture.
- **Kitchen Display System (KDS)**: Digital kitchen screen routing orders instantly to specific preparation stations (Hot Kitchen, Cold Pantry, Bar/Beverage).
- **KOT Generation**: Physical KOT ticket printing for kitchen counters.
- **Menu & Price Category Management**: Dish catalog, dietary tags (Veg, Non-Veg, Vegan, Gluten-Free), time-based menus (Breakfast, Lunch, Dinner, Midnight), and combo offers.

---

## 🧭 Sub-Modules & Operating Procedures

### 1. Restaurant POS (`/dashboard/restaurant`)
- **Navigation**: Sidebar -> Front Desk & Guests -> **Restaurant POS**
- **Operating Instructions**:
  1. **Table Selection**: Select Table Number (e.g., Table 4, Poolside Table 2) or choose `Takeaway` / `Room Service`.
  2. **Order Taking**:
     - Click items from visual category grids (Appetizers, Mains, Desserts, Drinks).
     - Select Item Modifiers / Preparation Notes.
     - Click **Send to Kitchen (KOT)**. Order status moves to `Preparing`.
  3. **Bill Settlement**:
     - Click **Settle Order**.
     - Choose Payment Mode: Cash, Credit/Debit Card, UPI / QR Pay, or **Post to Room Folio**.
     - If **Post to Room Folio** is selected: Enter Room Number, verify guest name, collect digital signature, and post charge directly to room folio ledger.

### 2. Kitchen Display System - KDS (`/dashboard/restaurant/kds`)
- **Navigation**: Sidebar -> Front Desk & Guests -> **KDS**
- **Operating Instructions**:
  1. Screen displays active order tickets in order of entry.
  2. Timer display:
     - 🟩 **Green**: <10 minutes
     - 🟧 **Orange**: 10 – 15 minutes
     - 🟥 **Red**: >15 minutes (Delayed order alert)
  3. Kitchen staff taps order ticket when cooking is complete -> Order status updates to `Ready for Pickup`.
  4. Waiter collects food and taps `Served`.

### 3. Menu Management (`/dashboard/restaurant/menu`)
- **Navigation**: Sidebar -> Revenue & Loyalty -> **Menu Mgmt**
- **Operating Instructions**:
  1. Click **Add Menu Item**.
  2. Enter Item Attributes: Dish Name, Category, Price, Tax %, Preparation Time (Mins), Kitchen Station (Hot/Cold/Bar).
  3. Toggle Item Availability: Mark item as `86 / Out of Stock` if ingredients are unavailable. Item is instantly disabled on POS screens.

---

## 👥 Roles & Permissions Matrix

| Action | Waiter / F&B Staff | Kitchen Chef | Restaurant Mgr | Property Mgr |
| :--- | :---: | :---: | :---: | :---: |
| Take Orders & KOT | ✅ | Read Only | ✅ | ✅ |
| Settle Cash / Card Bills | ✅ | ❌ | ✅ | ✅ |
| Post Bill to Room Folio | ✅ | ❌ | ✅ | ✅ |
| Update KDS Ticket Status | Read Only | ✅ | ✅ | ✅ |
| Edit Menu Items & Prices | ❌ | ❌ | ✅ | ✅ |

---

## 💡 Operational Best Practices

1. **Instant 86 Tagging**: Chef should mark out-of-stock ingredients on the KDS screen immediately so waiters cannot select unavailable dishes at POS counters.
2. **Room Folio Verification**: Always cross-check the guest name on the POS screen with the room number before confirming room charge posting to prevent posting to wrong rooms.

---
*Document Version: 1.0 | Module: Restaurant POS & Kitchen Operations*
