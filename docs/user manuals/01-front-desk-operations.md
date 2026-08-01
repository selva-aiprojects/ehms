# Manual 01: Front Desk & Guest Operations

## 📌 Module Overview

The **Front Desk & Guest Operations** module is the nerve center of hospitality management in eHMS. Designed for Front Desk Executives, Night Auditors, and Property Managers, this module provides real-time visibility into property arrivals, departures, guest stays, folios, pantry orders, service requests, and automated self-check-in/check-out workflows.

---

## 🎯 Key Features & Capabilities

- **Front Desk Command Center**: Real-time KPI summary (Occupied Rooms, Today's Check-ins, Today's Check-outs, Pending Requests, ADR, RevPAR).
- **Reservation Calendar & Grid**: Visual room night matrix with drag-and-drop availability, reservation filtering, and status highlights.
- **Guest Profiles Database**: Centralized CRM maintaining guest identity, VIP tier, preferences, stay history, contact details, and document attachments (ID proofs).
- **Check-In & Check-Out Workflows**: Streamlined guest registration, room assignment, key card allocation, billing settlement, and instant checkout.
- **Folio & Guest Billing**: Detailed line-item guest ledger tracking room tariff, tax breakdown, F&B charges, laundry services, and payment receipts.
- **F&B & Pantry Ordering**: Quick order placement for room service, breakfast add-ons, and pantry items directly posted to guest folios.
- **Guest Requests & Concierge**: Real-time logging, assignment, and SLA tracking for guest requests (extra towels, room maintenance, luggage handling).
- **Guest Feedback & Ratings**: Post-stay feedback collection, net promoter scores (NPS), and sentiment tracking.
- **Contactless QR Self-Check-in & Check-out**: Guest self-registration via mobile QR scanner, reducing counter wait times.

---

## 🧭 Sub-Modules & Operating Procedures

### 1. Command Center (`/dashboard/front-desk`)
- **Navigation**: Sidebar -> Front Desk & Guests -> **Command Center**
- **Screen Layout**:
  - **Metric Cards**: Total Rooms, Occupied, Vacant, Arrival Count, Departure Count, Dirty Units.
  - **Quick Action Bar**: New Booking, Quick Check-in, Add Guest Order, Log Guest Request.
  - **Live Feed**: Real-time list of guest arrivals due today and active service requests.
- **Operating Instructions**:
  1. Click **New Booking** to launch the reservation drawer.
  2. Select guest profile or create a new guest entry with mandatory fields: Name, Phone, Email, ID Type, ID Number.
  3. Choose Room Category, Check-in Date, Check-out Date, and Price Tier.
  4. Confirm booking to generate a unique Reservation Code (e.g., `RES-10492`).

### 2. Reservation Calendar (`/dashboard/front-desk/calendar`)
- **Navigation**: Sidebar -> Front Desk & Guests -> **Calendar**
- **Operating Instructions**:
  1. View rooms on the Y-axis and dates on the X-axis.
  2. Color coding:
     - 🟩 **Green**: Confirmed / Reserved
     - 🟦 **Blue**: Checked-In / Occupied
     - 🟧 **Orange**: Pending Payment / Deposit Due
     - 🟥 **Red**: Blocked for Maintenance
  3. Click any calendar cell to quickly initiate a new reservation for that room on that date.

### 3. Guest Profiles (`/dashboard/front-desk/guests`)
- **Navigation**: Sidebar -> Front Desk & Guests -> **Guest Profiles**
- **Operating Instructions**:
  1. Search guests by phone number, email, or name.
  2. View complete stay history, lifetime spend, total visits, and preference tags (e.g., "High Floor", "Non-Smoking", "Vegetarian").
  3. Click **Upload ID Document** to attach passport/Aadhaar/driver license scans.

### 4. Check-Ins (`/dashboard/front-desk/check-ins`)
- **Navigation**: Sidebar -> Front Desk & Guests -> **Check-Ins**
- **Operating Instructions**:
  1. Locate guest in the **Due Today** tab.
  2. Verify ID documents and collect security advance deposit (cash, UPI, credit card).
  3. Select an available clean room from the dropdown list.
  4. Click **Complete Check-In**. Room status changes from Vacant-Clean to Occupied.

### 5. Billing & Guest Folio (`/dashboard/front-desk/billing`)
- **Navigation**: Sidebar -> Front Desk & Guests -> **Billing & Folio**
- **Operating Instructions**:
  1. Select room number or guest reservation.
  2. Review itemized folio charges (Room Rate, Taxes, Restaurant orders, Laundry, Damage fees).
  3. Click **Add Extra Charge** to post manual fees.
  4. Click **Settle Bill** to record payment, choose payment mode (Cash, Card, Bank Transfer, City Ledger), and generate printable PDF Invoices.

### 6. F&B / Pantry (`/dashboard/front-desk/f-and-b`)
- **Navigation**: Sidebar -> Front Desk & Guests -> **F&B / Pantry**
- **Operating Instructions**:
  1. Select occupied room.
  2. Choose menu items from Tea, Coffee, Snacks, Beverages, or Dining catalog.
  3. Select payment option: **Post to Room Folio** or **Direct Cash Payment**.
  4. Order routes instantly to kitchen/pantry staff.

### 7. Guest Requests (`/dashboard/front-desk/requests`)
- **Navigation**: Sidebar -> Front Desk & Guests -> **Requests**
- **Operating Instructions**:
  1. Click **Log Request** for incoming phone calls or walk-in requests.
  2. Select Category: Housekeeping (extra blankets/towels), Maintenance (AC issue, TV remote), Concierge (taxi booking).
  3. Assign priority (Low, Medium, High, Urgent) and target department staff.
  4. Monitor SLA countdown timer. Status updates automatically when staff completes the task.

### 8. Self Check-in & Self Check-out (`/dashboard/front-desk/checkin`, `/dashboard/front-desk/checkout`)
- **Navigation**: Sidebar -> Front Desk & Guests -> **Self Check-in** / **Self Check-out**
- **Operating Instructions**:
  1. Present QR Code on lobby tablet or kiosk.
  2. Guest scans QR code or enters Booking Ref / Phone Number.
  3. Guest completes digital registration card and uploads photo ID.
  4. Mobile web app generates digital key / PIN code upon successful check-in.

---

## 👥 Roles & Permissions Matrix

| Action | Front Desk | Property Manager | Super Admin | HK / Maint |
| :--- | :---: | :---: | :---: | :---: |
| Create Reservations | ✅ | ✅ | ✅ | ❌ |
| Perform Check-In / Out | ✅ | ✅ | ✅ | ❌ |
| Settle & Void Folios | Read/Settle | ✅ Full Void | ✅ Full Void | ❌ |
| Log Guest Service Request | ✅ | ✅ | ✅ | ✅ |
| Override Room Rate | ❌ | ✅ | ✅ | ❌ |

---

## 💡 Operational Best Practices

1. **Morning Shift Handover**: Always review the **Command Center** metric cards at 07:00 AM to verify expected check-outs and ensure housekeeping has prioritized room cleaning.
2. **Night Audit Reconciliation**: Ensure all pending F&B and Laundry charges are posted to room folios before closing daily financial batches at midnight.
3. **ID Document Compliance**: Mandatory regulatory requirement to upload valid photo ID for all adult guests before completing check-in.

---
*Document Version: 1.0 | Module: Front Desk & Guests*
