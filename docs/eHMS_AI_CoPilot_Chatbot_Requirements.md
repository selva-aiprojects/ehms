# HostSphere (eHMS) AI Co-Pilot & ChatBot — End-User Use-Case Requirements

Welcome to the **HostSphere AI Co-Pilot & ChatBot Requirements Document**. This document defines the complete set of chatbot use cases for **HostSphere — Cybelinx Enterprise Hospitality Management System (eHMS)**. It is written for front desk agents, housekeeping and maintenance staff, HR and finance teams, property managers, revenue managers, tenant super admins, and the platform superadmin.

Every use case is defined against the **RBAC matrix** and scoped to the **active business vertical (workspace perspective)** — Hotels, Serviced Apartments, Apartment Rental, or Workplace Services.

---

## 1. Executive Summary & Overview

The **HostSphere AI Co-Pilot** is an intelligent, real-time operational assistant embedded directly inside the eHMS application. Powered by Retrieval-Augmented Generation (RAG) over the tenant's isolated schema, it enables natural-language queries, text-to-action execution, guest lookup, guest-preference safety warnings, multilingual guest communication, Vision AI document parsing, voice dictation, and text-to-speech.

### Core Capabilities at a Glance
- 🏨 **Real-Time Operational Context**: Occupancy, today's arrivals/departures, dirty rooms, open maintenance tickets, low-stock alerts, and payroll status — all in natural language.
- 🔍 **Guest & Booking Lookup (RAG)**: Instant stay history, preferences, folio balance, and reservation summaries by phone number, email, booking reference, or room number.
- ⚡ **Text-to-Action Execution**: Book reservations, perform check-in/check-out, post folio charges, assign housekeeping tasks, create maintenance tickets, apply leave, record payments, run payroll, and sync OTA channels — via simple chat commands.
- ⚠️ **Guest Preference & Safety Warnings**: Automatic flagging of VIP tiers, dietary restrictions, allergy notes, blacklists, and duplicate-ID registrations when making bookings or posting charges.
- 🌐 **Multilingual Guest Communication Translation**: Translate folio notes, room-service instructions, and check-out summaries into Hindi, Tamil, Spanish, French, Arabic, and more.
- 📸 **Vision AI Document Parsing**: Upload ID proofs, vendor invoices, delivery challans, prescription-style amenity lists, or handwritten notes for instant OCR extraction.
- 🎤 **Hands-Free Voice Dictation & Text-to-Speech**: Speak prompts in busy front-desk or housekeeping environments and listen to audio responses.

### Why it Matters (Differentiator)
The Co-Pilot turns the 13+ operational modules (Front Desk, HK, Maintenance, Finance, HR, Procurement, Inventory, Revenue/AI Pricing, OTA, Restaurant POS, Laundry, Loyalty, Admin) into a single conversational surface. It enforces the same **3-layer access model** as the sidebar — Role Gate → RBAC Gate → Journey Gate — so a housekeeping attendant can never accidentally mutate finance data, and a front desk agent in a Hotels workspace never sees rental-lease commands.

---

## 2. Widget Navigation & Interface Controls

The AI Assistant widget appears in the lower-right corner of every dashboard page.

- **Open / Close Widget**: Click the floating **MessageSquare** icon at the bottom-right of the screen.
- **Reposition Widget (Drag & Drop)**: Click and hold the `⠿ DRAG` handle bar to move the widget anywhere on the window. Position is remembered per browser.
- **Quick Suggestion Chips**: Horizontal pill buttons below the chat header, e.g. `📋 Today's Arrivals`, `🧹 Dirty Rooms`, `🔧 Open Tickets`, `🔍 Guest Lookup`, `💰 Folio Balance`, `📅 My Shift`, `🏷 Apply AI Rate` — rendered **dynamically based on the caller's role and active journey**.
- **Role & Workspace Context Badge**: The chat header always shows the current user, role, tenant, and active vertical journey (e.g., `front_desk • Hotels • Grand Resort`). The assistant scopes every answer and every action to this context.

---

## 3. Workspace (Vertical) Perspective & Scoping Model

HostSphere enforces strict business-vertical isolation. The Co-Pilot must respect the same isolation.

### 3.1 The Four Business Verticals

| Vertical | Code | Primary Workspace Features | Typical Roles in this Workspace |
| :--- | :--- | :--- | :--- |
| **Hotels & Resorts** | `hotels` | Command Center, Room Calendar, Reservations, Check-In/Out, Folio & Billing, Restaurant POS/KDS, Laundry, Rate Cards, OTA Channels, Revenue AI, Loyalty | `front_desk`, `housekeeping_*`, `maintenance_*`, `finance_*`, `hr_*`, `property_manager` |
| **Serviced Apartments** | `apartments` | Unit inventory, Long/Short-stay allocations, Utility meters, Linen & Pantry, F&B, Housekeeping, Maintenance | `front_desk`, `housekeeping_*`, `maintenance_*`, `property_manager`, `finance_*` |
| **Apartment Rental** | `rental` | Tenant onboarding, Leases, Monthly Rent Invoices, Security Deposits, Move-out checklists | `property_manager`, `finance_manager`, `executive`, `maintenance_*` |
| **Workplace Services** | `workplace` | Desk/Zone allocation, Memberships, Visitor passes, Security logs, Meeting-room bookings | `workplace_facility_manager`, `security_staff`, `property_manager`, `housekeeping_*` |

### 3.2 How the Chatbot Resolves Context

1. **Tenant (Shard) Scope** — From the JWT `tenant_code` / `tenant_schema`. The Co-Pilot ONLY queries the caller's tenant schema (`viswa`, `grt`, etc.). Cross-tenant data is impossible.
2. **Property / Workspace Scope** — From `user_roles.property_id` (or the active journey property filter). All lookups and mutations are filtered by this property.
3. **Vertical Journey Scope** — From the active journey (`useJourney()`). The assistant's **intent catalog** is filtered per vertical:
   - `hotels` / `apartments` → booking, check-in/out, folio, room/HK, F&B, laundry, rate, OTA commands.
   - `rental` → lease, rent-invoice, deposit, move-out commands.
   - `workplace` → membership, visitor, desk, security-log commands.
   - `all` → union for `super_admin` / `executive`.
4. **Role Scope** — The assistant rejects any text-to-action intent that the caller's role is not permitted to execute (mirrors `lib/role-access.ts` + `ROLE_ACCESS` route map).

### 3.3 Vertical-Specific Quick Chips

| Active Journey | Chips Shown |
| :--- | :--- |
| `hotels` | Arrivals Today, Vacant Clean Rooms, Restaurant Orders, Laundry Pending, RevPAR/ADR, OTA Sync Status, Apply AI Rate |
| `apartments` | Unit Availability, Utility Meter Status, Linen Stock, Long-stay Bookings, Folio Balances |
| `rental` | Overdue Rent, Lease Expiries (60 days), Deposit Balances, Vacant Units, Rent Collection YTD |
| `workplace` | Occupied Desks, Today's Visitors, Meeting-room Utilization, Membership Expiries, Security Alerts |

---

## 4. Real-Time Operational Context Queries

Staff can ask about live metrics in natural language. All numbers are computed from the tenant schema in real time and scoped to the active property/journey.

### 4.1 Front Desk & Rooms (Hotels / Apartments)
- `"How many rooms are available right now?"` → Total, occupied, vacant-clean, vacant-dirty, out-of-service counts.
- `"Who is arriving today?"` → List of expected arrivals with room category, source (direct/OTA), deposit status.
- `"List due departures for today."` → Guest name, room, checkout time, folio balance pending settlement.
- `"Show dirty rooms needing cleaning."` → Room list, floor, priority (VIP departure etc.).
- `"How many guests are in-house?"` → In-house count + occupancy %.

### 4.2 Housekeeping
- `"Show pending housekeeping tasks."` → Task count by priority and status, assigned attendant.
- `"Which rooms are ready for inspection?"` → Pending-inspection rooms with room status.
- `"Linen stock status?"` → On-hand, soiled, in-laundry, reorder alerts.
- `"Who is on shift today?"` → On-duty HK staff and zone assignments.

### 4.3 Maintenance
- `"Show open maintenance tickets."` → Count by priority/category, SLA breaches, oldest tickets.
- `"List pending preventive maintenance (PPM) jobs."` → Due PPM jobs for HVAC/elevator/DG etc.
- `"Spare parts below reorder level."` → Part codes, stock vs reorder level, warehouse.
- `"Asset health summary."` → Assets with expiring warranties / overdue service.

### 4.4 Finance
- `"Today's revenue?"` → Room revenue, F&B, laundry, total collected, outstanding.
- `"AR aging summary."` → Current, 1–30, 31–60, 61–90, >90 days buckets.
- `"AP bills due this week."` → Vendor bills by due date, amount, payment status.
- `"Budget utilization for Housekeeping this month."` → Budget vs actual variance.

### 4.5 HR
- `"Who is absent today?"` → Absent employees by department.
- `"Attendance % for today."` → Present vs total headcount.
- `"Open leave requests needing approval."` → List of pending leave requests.
- `"Monthly payroll liability."` → Gross/net payroll estimate for the month.

### 4.6 Procurement & Inventory
- `"Low stock inventory items."` → SKU, category, stock level, reorder level.
- `"Pending purchase orders awaiting GRN."` → Open POs, vendor, value, days since dispatch.
- `"Inventory valuation."` → Total stock value, count by warehouse.

### 4.7 Revenue, OTA & Loyalty
- `"What's today's ADR and RevPAR?"` → ADR, RevPAR, occupancy %, channel mix.
- `"Show OTA sync status."` → Booking.com / MakeMyTrip / Agoda / Expedia sync health.
- `"What rate does AI recommend for next weekend?"` → AI pricing suggestion with demand reason.
- `"Top loyalty guests this month."` → Platinum/Gold members, points, spend.

### 4.8 Workplace (Workplace Services only)
- `"How many desks are occupied right now?"` → Desk capacity vs occupancy by zone.
- `"Who is on-site today?"` → Active visitors/members count.
- `"Meeting room utilization this week."` → Booked vs free meeting rooms.

---

## 5. Guest & Booking Lookup (RAG Guest Summarization)

To summarize any guest's complete history without opening multiple screens, include a **unique identifier** in the query — phone number, email, booking reference (e.g., `RES-10492`), or room number.

### Recommended Prompts
- `"Show guest summary for phone 98765 43210"`
- `"Summarize stay history for booking RES-10492"`
- `"Who is staying in room 302 and what is their folio balance?"`

### What the AI Retrieves & Summarizes
1. **Identity & KYC**: Name, phone, email, ID type/number, verification status, blacklist/flag status.
2. **Preferences & Profile Tags**: `High Floor`, `Non-Smoking`, `Vegetarian`, `Extra Towels`, VIP tier, loyalty tier & points.
3. **Stay History**: Past bookings, total visits, lifetime spend, favorite room categories.
4. **Current Stay**: Reservation, room, check-in/out, source (direct/OTA), deposit status.
5. **Folio Ledger**: Itemized charges (room, F&B, laundry, damage), payments, outstanding balance.
6. **Open Guest Requests**: Pending concierge/HK/maintenance requests and SLA status.
7. **Feedback & NPS**: Recent post-stay ratings and sentiment.

### Privacy Guardrail
Guest PII lookups require an explicit identifier and are restricted to roles with Front Desk/Guest access (`front_desk`, `property_manager`, `executive`, `super_admin`). Responses never expose full ID numbers or payment-card data; they render masked values.

---

## 6. Text-to-Action Execution Guide

Authorized staff can perform operations directly from chat. Every action requires role permission and writes through the same API layer with full audit logging.

### 6.1 Front Desk (Hotels / Apartments)
- **New Reservation** — `"Book a Deluxe room for 3 nights starting 2026-08-05 for phone 9876543210"` → Creates reservation, returns `RES-xxxxx` confirmation badge (✅ Action Completed).
- **Check-In** — `"Check in reservation RES-10492 to room 302"` → Assigns clean room, issues digital key/Smart-Lock PIN valid for stay window.
- **Check-Out & Settle** — `"Check out room 302 and settle folio by UPI"` → Generates invoice, records payment, changes room to vacant-dirty.
- **Post Charge** — `"Post ₹1,200 minibar to room 302 folio"` → Adds folio line item with reason.
- **Log Guest Request** — `"Log request for room 302: extra towels, High priority, assign to HK"` → Creates tracked `guest_request` with SLA timer.
- **Redeem Loyalty Points** — `"Redeem 500 points for guest 9876543210 against F&B bill"` → Validates tier balance and posts redemption.

### 6.2 Housekeeping
- **Assign Tasks** — `"Assign checkout turnover for rooms 401, 402 to Priya"` → Creates/assigns `housekeeping_tasks` with priority.
- **Update Status** — `"Mark task 4512 completed"` → Sets `completed → pending inspection`.
- **Inspection Pass/Fail** — `"Pass inspection for room 405"` / `"Fail inspection for room 406 with note: bed sheet stained"` → Updates room to `vacant_clean`/`inspected` or reassigns for re-clean.
- **Linen Dispatch** — `"Dispatch 40 bedsheets to laundry vendor L1 with gate pass"` → Creates linen dispatch + laundry order.

### 6.3 Maintenance
- **Create Ticket** — `"Create ticket: AC not cooling in room 302, High priority"` → Opens maintenance ticket.
- **Assign & Dispatch** — `"Assign ticket 8842 to Rajesh"` / `"Assign ticket 8842 to vendor ACME"`.
- **Log Parts Usage** — `"Log 2 LED bulbs from parts stock against ticket 8842"` → Decrements spare-parts inventory.
- **Resolve & Close** — `"Resolve ticket 8842 with notes: replaced compressor"` → Adds resolution notes and closes.

### 6.4 HR
- **Apply Leave** — `"Apply casual leave for me from 2026-08-10 to 2026-08-11"` → Creates `leave_request` for the caller (self-service).
- **Approve Leave** — `"Approve leave request 553 for Anitha"` (HR/manager roles only).
- **Timesheet Approval** — `"Approve timesheet week 33 for department Housekeeping"`.
- **Execute Payroll** — `"Run payroll for August 2026"` (HR Manager / Super Admin only) → Runs payroll engine, generates payslips.

### 6.5 Finance
- **Record Payment** — `"Record ₹45,000 payment from ACME Corp against invoice INV-2210 via NEFT ref NX883"` → Clears AR line.
- **Vendor Bill** — `"Record vendor bill from Ramesh Electricals for ₹12,500, due in 30 days"` → Creates AP bill (pending approval).
- **Post Journal Entry** — `"Post journal entry ₹10,000 debit Bank, credit Owner Equity"` → Validates balance and posts.
- **Approve Bill** — `"Approve vendor bill VB-118"` (Finance Manager only).

### 6.6 Procurement & Inventory
- **Create PO** — `"Create PO for 50kg rice from FreshMart at ₹60/kg"` → Drafts PO with line items (routing approval per threshold).
- **Submit GRN** — `"Receive GRN for PO-332: accept 45kg, reject 5kg damaged"` → Updates stock and creates draft vendor bill.
- **Stock Issue** — `"Issue 20 units of Shampoo-30ml to Housekeeping store"` → Posts inventory transaction.

### 6.7 Revenue & OTA
- **Apply AI Rate** — `"Apply AI rate recommendation for Deluxe for Oct 12–14"` → Pushes updated rates to direct + OTA channels.
- **Sync OTA** — `"Sync inventory to all OTA channels now"` → Triggers channel-manager broadcast.
- **Broadcast WhatsApp** — `"Send check-in link WhatsApp to all arrivals tomorrow"` → Queues WhatsApp template messages.

### 6.8 Rental (Apartment Rental workspace only)
- **Create Lease** — `"Create lease for unit B-204 with Mr. Kumar, ₹18,000/month, 11 months, 5% escalation"` → Drafts lease agreement.
- **Generate Rent Invoices** — `"Generate rent invoices for this month"` → Runs monthly rent-invoice batch.
- **Record Rent Payment** — `"Record ₹18,000 rent payment from lease LT-77 via UPI"`.
- **Process Deposit Refund** — `"Process deposit settlement for lease LT-77 with zero deductions"` → Computes net refund and closes lease.

### 6.9 Workplace (Workplace Services workspace only)
- **Create Membership** — `"Add membership for ACME Corp, Hot Desk Monthly, 5 seats"`.
- **Register Visitor** — `"Pre-register visitor John from ACME arriving 3 PM, host Priya"`.
- **Visitor Check-In** — `"Check in visitor John Smith (mobile 9988776655)"` → Generates pass + notifies host.
- **Visitor Check-Out** — `"Check out visitor John Smith"`.
- **Book Desk** — `"Book desk D-12 for tomorrow for member M-204"`.

### 6.10 Admin & Platform
- **Create User** — `"Create user Ramesh, front_desk role, Grand Resort property"` (Super Admin / Property Manager only).
- **Reset Password** — `"Reset password for user ramesh@..."`.
- **Revoke Session** — `"Revoke session for suspicious login from IP 203.0.113.9"` (Super Admin only).
- **Run Backup** — `"Run an instant backup now"` (Super Admin / Executive).
- **Create Tenant** (Platform Superadmin only) — `"Provision new tenant schema 'GRT' with hotels vertical"` → Executes `provision_tenant_schema()`.

### 6.11 Action Confirmation & Audit
- Every text-to-action returns a confirmation badge (✅ Action Completed) with the generated reference number.
- Actions that are read-only display 🔍 info responses.
- All mutations are written to `audit_logs` / `system_audit_events` with actor email, IP, timestamp, and before/after JSON diff — exactly as if performed in the UI.

---

## 7. Guest Preference & Safety Warnings

When creating bookings, assigning rooms, or posting charges, the AI automatically screens the guest profile and flags:

- **VIP / Blacklist Flags**: `⚠️ GUEST FLAGGED: Profile marked BLACKLISTED — contact Duty Manager before serving.`
- **Dietary Restrictions**: If a guest profile has `Vegetarian`/`Vegan`/`Jain` tags and a non-veg F&B item is being posted — `⚠️ DIETARY WARNING: Guest prefers VEGETARIAN — confirm before posting this F&B charge.`
- **Allergy Notes**: Free-text allergy/sensitivity notes (e.g., dust/pollen) surfaced when assigning rooms or triggering deep-clean HK tasks.
- **Duplicate ID Check**: `⚠️ DUPLICATE ID: This ID number is already registered to another profile — verify identity before check-in.`
- **Deposit/Advance Rule**: `⚠️ PAYMENT GATE: Room category Deluxe requires ₹2,000 security deposit — collect before check-in.`
- **Overlapping Booking**: `⚠️ CONFLICT: Guest already has an active booking — open booking found RES-10490.`

---

## 8. Multilingual Guest Communication Translation

Translate operational messages for non-native-speaking guests or staff.

### Recommended Prompts
- `"Translate folio note for room 302 into Hindi"`
- `"Translate checkout summary for booking RES-10492 into Tamil"`
- `"Translate into Arabic: Your laundry will be delivered by 6 PM."`
- `"Write a Hindi welcome message for Mr. Sharma arriving tomorrow."`

Supported targets include Hindi, Tamil, Spanish, French, German, Arabic, and Japanese. Translations never replace the source text in the system — they are delivered as guest-communication drafts (WhatsApp/email) for staff review.

---

## 9. Financial & Billing Queries

### Recommended Prompts
- `"Folio balance for room 302"` → Itemized balance + outstanding.
- `"Show security deposit status for booking RES-10492"` → Collected, held, refundable.
- `"Outstanding corporate balance for ACME Corp"` → City-ledger aging.
- `"What is the GST component on today's revenue?"` → Output tax summary.
- `"When is the next statutory filing due?"` → PF/ESI/TDS/GST calendar.

---

## 10. Vision AI Document Scan & File Attachments

Upload images or PDFs for instant OCR/AI extraction:

1. Click the **Paperclip (📎)** icon next to the chat input.
2. Select an image (`.png`, `.jpg`, `.jpeg`) or PDF (`.pdf`).
3. View the attachment thumbnail preview.
4. Type an optional prompt, e.g., `"Extract vendor invoice fields and propose an AP bill"` or `"Extract the ID proof and pre-fill a guest profile"`, and click **Send**.
5. The Vision model parses the document and returns structured data; staff confirm before any write happens.

### Use Cases by Role
| Role | Typical Scan | Outcome |
| :--- | :--- | :--- |
| Front Desk | Guest ID proof (Aadhaar/Passport/DL) | Pre-fill guest profile + KYC verification |
| Front Desk | Handwritten amenity/damage note | Structured folio line item draft |
| Finance | Vendor invoice / delivery challan | Draft AP bill matched against GRN |
| Maintenance | Warranty card / equipment label | Draft fixed-asset / asset register entry |
| Procurement | Delivery challan photo | GRN acceptance draft with rejected-qty capture |

---

## 11. Hands-Free Voice Commands & Audio Playback

### Voice Dictation (Speech-to-Text)
1. Click the **Microphone (🎤)** button.
2. Button pulses red with **"Listening…"**.
3. Speak your prompt (e.g., *"Show arrivals for tomorrow"*).
4. Click again or pause to auto-populate the prompt.

### Audio Playback (Text-to-Speech / TTS)
- Below any assistant response bubble, click **🔊 Listen** to hear the answer.
- Click **🔇 Stop** to silence playback.

---

## 12. RBAC Matrix — Chatbot Capabilities by Role & Workspace

The Co-Pilot must expose **exactly** the same capability surface as the sidebar. The matrix below is the single source of truth for the chatbot intent catalog.

**Legend:** 🔍 Read/Query · ⚡ Text-to-Action · ● Full Module · ◐ Partial / Scoped · — No Access

### 12.1 Hotels & Serviced Apartments (`hotels` / `apartments`)

| Role | Guest Lookup | Reservations / Check-in-Out | Folio & Billing | Guest Requests | HK Tasks | Maintenance | F&B / Laundry | Loyalty / OTA / Revenue | Finance & Accounts | HRMS |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `super_admin` | ● | ● | ● | ● | ● | ● | ● | ● | ● | ● |
| `executive` | ● | ● | ◐ (no void) | ● | ● | ● | ◐ | ◐ | ● | ● |
| `property_manager` | ● (scoped) | ● (scoped) | ◐ (no void) | ● | ● | ● | ● | ◐ (no OTA config) | ◐ (read) | ● (scoped) |
| `front_desk` | ● | ● | ◐ (settle, no void) | ● | 🔍 | 🔍 (create) | ◐ | ◐ (redeem) | — | — |
| `housekeeping_supervisor` | 🔍 (room status) | — | — | 🔍 | ⚡ assign/inspect | — | 🔍 | — | — | — |
| `housekeeping_staff` | — | — | — | 🔍 | ⚡ own tasks | — | — | — | — | — |
| `maintenance_supervisor` | — | — | — | 🔍 | — | ● (assign/close) | — | — | 🔍 parts | — |
| `maintenance_staff` | — | — | — | 🔍 | — | ◐ (own tickets, create) | — | — | 🔍 parts | — |
| `finance_manager` | 🔍 folio | — | ● (pay/void) | — | — | — | — | ◐ revenue read | ● | — |
| `finance_executive` | 🔍 folio | — | ◐ (pay) | — | — | — | — | — | ◐ | — |
| `hr_manager` | — | — | — | — | — | — | — | — | — | ● |
| `hr_executive` | — | — | — | — | — | — | — | — | — | ◐ |
| `employee_manager` | — | — | — | — | — | — | — | — | — | ◐ (timesheet/leave) |
| `workplace_facility_manager` | — | — | — | — | 🔍 | 🔍 | — | — | — | — |
| `security_staff` | — | — | — | — | — | 🔍 | — | — | — | — |
| `vendor_user` | — | — | — | — | — | 🔍 own jobs | — | — | — | — |

### 12.2 Apartment Rental (`rental`)

| Role | Tenant/Lease Lookup | Lease Create/Terminate | Rent Invoices | Rent Payment | Deposit Refund | Move-Out / Utility | Maintenance | Finance & Accounts | HRMS |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `super_admin` | ● | ● | ● | ● | ● | ● | ● | ● | ● |
| `executive` | ● | ● | ● | ● | ● | ● | ● | ● | ● |
| `property_manager` | ● (scoped) | ● (scoped) | ● | ● | ● | ● | ● | ◐ read | ● (scoped) |
| `finance_manager` | 🔍 | 🔍 (read) | ● | ● | ● | 🔍 | — | ● | — |
| `finance_executive` | 🔍 | — | ◐ | ● | ◐ | — | — | ◐ | — |
| `maintenance_*` | — | — | — | — | — | — | ● | — | — |
| `hr_*` | — | — | — | — | — | — | — | — | ● |

### 12.3 Workplace Services (`workplace`)

| Role | Member Lookup | Memberships | Desk/Zone | Visitor Reg/Check-in-Out | Security Logs | Meeting Rooms | HK / Maintenance | Finance | HRMS |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `super_admin` | ● | ● | ● | ● | ● | ● | ● | ● | ● |
| `executive` | ● | ● | ● | ● | ● | ● | ● | ● | ● |
| `property_manager` | ● (scoped) | ● | ● | ● | ● | ● | ● | ◐ read | ● (scoped) |
| `workplace_facility_manager` | ● | ● | ● | ● | ● | ● | 🔍 | — | — |
| `security_staff` | 🔍 | — | 🔍 | ● | ● | 🔍 | — | — | — |
| `front_desk` | 🔍 | — | — | ◐ | — | — | — | — | — |
| `finance_manager` | 🔍 | ◐ (invoices) | — | — | — | — | — | ● | — |
| `housekeeping_*` | — | — | — | — | — | — | ● | — | — |
| `hr_*` | — | — | — | — | — | — | — | — | ● |

### 12.4 Platform Superadmin (no tenant context)

| Capability | Access |
| :--- | :---: |
| Tenant provisioning / suspension | ● (`provision_tenant_schema()`) |
| Subscription & billing oversight | ● |
| Platform support tickets | ● |
| Platform broadcasts | ● |
| Cross-tenant analytics (usage metrics) | ◐ (aggregate only, never row-level) |
| Any tenant operational module | — (no shard context) |

### 12.5 Permission-Enforcement Rules for the Chatbot
1. **Role Gate** — Intent → role → permitted if the equivalent sidebar route `hasAccess(role, href)` returns true.
2. **Action Level (write) Guard** — Even where a role can read a module, write intents are rejected unless the role has the matching mutation (e.g., `front_desk` can view folios but cannot void them; `maintenance_staff` can create tickets but cannot assign vendors).
3. **Property Scope Guard** — Every SQL write appends `property_id = <caller's property scope>`; attempts to reference other properties are refused.
4. **Vertical Guard** — `rental`/`workplace`-only intents are unavailable in `hotels`/`apartments` journeys and vice versa.
5. **Audit** — All write intents are audited with actor, role, IP, and payload.

---

## 13. Prompt Cheat Sheet by Role & Workspace

| User Role | Workspace | Useful Prompt Example | Expected Result |
| :--- | :--- | :--- | :--- |
| **Front Desk Agent** | Hotels | `"Book a Deluxe room for 2 nights for phone 9876543210 starting tomorrow"` | Creates reservation & returns `RES-xxxxx` |
| **Front Desk Agent** | Hotels | `"Check in RES-10492 to room 302 and issue smart lock PIN"` | Room occupied + digital key/PIN issued |
| **Front Desk Agent** | Hotels/Apts | `"Folio balance for room 302"` | Itemized balance & outstanding |
| **Front Desk Agent** | Hotels | `"Log request for room 302: extra towels, High, assign HK"` | Tracked guest request with SLA timer |
| **HK Supervisor** | Hotels | `"Assign checkout turnover for rooms 401–403 to Priya"` | Tasks created & assigned |
| **HK Staff** | Hotels | `"My tasks for today"` | Personal task list with room & priority |
| **HK Supervisor** | Hotels | `"Pass inspection for room 405"` | Room status → ready for check-in |
| **Maintenance Supervisor** | Hotels/Apts | `"Open tickets by priority"` | Ticket queue with SLA status |
| **Maintenance Staff** | Hotels | `"Create ticket: water tap leaking in room 202, High"` | Ticket created |
| **Property Manager** | Rental | `"Overdue rent and lease expiries in 60 days"` | Dunning + renewal list |
| **Property Manager** | Rental | `"Create lease for unit B-204 with Mr. Kumar, ₹18,000/month, 11 months"` | Draft lease agreement |
| **Finance Manager** | Rental | `"Record ₹18,000 rent from lease LT-77 via UPI"` | Rent invoice cleared |
| **Finance Manager** | Hotels | `"AR aging summary"` | Aging buckets 0-30/31-60/61-90/>90 |
| **Finance Manager** | Hotels | `"Approve vendor bill VB-118"` | AP bill approved |
| **HR Manager** | Any | `"Approve leave request 553 for Anitha"` | Leave approved & balance updated |
| **HR Manager** | Any | `"Run payroll for August 2026"` | Payroll run + payslips generated |
| **Facility Manager** | Workplace | `"Pre-register visitor John from ACME at 3 PM, host Priya"` | Visitor preregistered |
| **Security Staff** | Workplace | `"Check in visitor 9988776655"` | Pass issued + host notified |
| **Revenue Manager** | Hotels | `"What AI rate is recommended for Oct 12–14?"` | AI pricing recommendation |
| **Revenue Manager** | Hotels | `"Apply AI rate for Deluxe for Oct 12–14 and sync OTA"` | Rates pushed across channels |
| **Super Admin** | Any | `"Run an instant backup"` | Backup job created |
| **Super Admin** | Any | `"Show recent suspicious sessions"` | Session list with IP/user-agent |
| **Platform Superadmin** | Platform | `"Provision tenant 'GRT' with hotels vertical"` | Shard provisioned & demo users seeded |

---

## 14. Security, Privacy & Compliance Guidelines

- **Tenant Shard Isolation**: The Co-Pilot is strictly scoped to the caller's tenant schema. It cannot access or infer data from any other organization.
- **Role-Enforced Data Access**: All queries and actions are gated by the RBAC matrix (Section 12). The assistant never bypasses `ROLE_ACCESS`.
- **PII Masking**: Guest contact details, ID numbers, and payment data are masked in responses; full values are only available in the originating module UI with proper permission.
- **Write Confirmation & Undo**: Destructive intents (voids, refunds, cancellations, payroll runs) require a typed confirmation phrase (e.g., *"Confirm void invoice INV-2210"*). Void/cancel operations record audit diffs.
- **Human-in-the-Loop for High-Risk Actions**: Refunds, deposit settlements, high-value vendor payments (>₹100,000 / $5,000), payroll execution, and OTA rate broadcasts require manager approval even when initiated by chat.
- **Auditability**: Every assistant mutation is appended to `audit_logs`/`system_audit_events` with actor, role, IP, timestamp, and before/after JSON.
- **Clinical/Operational Responsibility**: AI outputs are decision support only. Final operational decisions (rate changes, payment approvals, guest-facing actions) remain the responsibility of the licensed staff member.
- **Session & Consent**: The assistant never retains prompts beyond the audit requirement and cannot be used to export bulk tenant data.

---

## 15. Implementation Blueprint (Suggested)

| Layer | Component | Notes |
| :--- | :--- | :--- |
| Frontend | Floating chat widget in dashboard layout | Mirrors sample reference: drag handle, chips, voice, attachments |
| Intent Catalog | Vertical-aware skill registry | One skill per module; filtered by `JOURNEY_ALLOWED_ITEMS` + `ROLE_ACCESS` |
| RAG Index | Tenant-schema vector store over guests, bookings, folios, tickets | Built from shard tables (see DB list below); refreshed on write |
| Actions | Server actions / existing API routes (`/api/front-desk`, `/api/housekeeping`, `/api/maintenance`, `/api/hr`, `/api/finance`, `/api/procurement`, `/api/admin`, etc.) | Reuse existing endpoints for text-to-action |
| Safety | Permission middleware + property-scope guard + confirmation phrases | Mirrors sidebar 3-layer filter |
| Audit | `audit_logs` / `system_audit_events` for every write | Automatic |
| LLM stack | RAG (tenant-scoped) + function calling + Vision model + TTS/STT | Provider-agnostic |

### Primary Data Sources (tenant shard)
`guest_profiles`, `guest_preferences`, `guest_requests`, `guest_feedback`, `bookings`, `units`, `room_categories`, `properties`, `buildings`, `floors`, `payments`, `invoices`, `invoice_lines`, `housekeeping_tasks`, `housekeeping_inspections`, `linen_items`, `linen_transactions`, `maintenance_tickets`, `maintenance_ticket_parts`, `parts_inventory`, `asset_register`, `preventive_schedules`, `chart_of_accounts`, `journal_entries`, `journal_lines`, `vendor_bills`, `bill_payments`, `budget_entries`, `tax_filings`, `fixed_assets`, `employees`, `timesheets`, `attendance_records`, `leave_requests`, `payroll_runs`, `payroll_lines`, `purchase_orders`, `goods_received_notes`, `grn_lines`, `vendors`, `vendor_services`, `inventory_items`, `inventory_transactions`, `warehouses`, `lease_agreements`, `rent_invoices`, `deposit_ledger`, `membership_plans`, `corporate_memberships`, `visitor_logs`, `workplace_bookings`, `loyalty_tiers`, `loyalty_transactions`, `rate_plans`, `pricing_rules`, `revenue_ai_forecasts`, `ota_channel_config`, `channel_sync_log`, `whatsapp_templates`, `f_and_b_menu`, `f_and_b_orders`, `laundry_orders`, `restaurant_tables`, `table_reservations`, `user_sessions`, `audit_logs`.

---

## 16. Acceptance Criteria (High-Level)

1. **Context correctness** — A user in the `rental` journey never receives hotel-only intents; property-scoped users never see other properties' data.
2. **RBAC enforcement** — Every read/write intent is denied when the caller's role lacks permission, with a clear `⛔ Permission Denied — contact your supervisor` response.
3. **Text-to-action reliability** — All write intents create real records (verifiable via UI/DB) and return a reference number.
4. **Audit completeness** — 100% of write intents appear in audit logs with actor + payload.
5. **Multilingual & voice** — Voice dictation, TTS, and translation work offline-tolerant and match the widget reference behavior.
6. **Vision accuracy** — ID/invoice scans pre-fill forms with a confirmation step before persistence.

---

## 17. Related Documents

| Document | Purpose |
| :--- | :--- |
| `docs/chatbot-intent-catalog.json` | Machine-readable spec of all 106 chatbot intents — roles, verticals, risk, endpoints, entities, confirmation rules. Single source of truth for the intent engine. |
| `docs/eHMS_AI_CoPilot_Implementation_Plan.md` | Engineering plan for the `POST /api/chat` route — pipeline, guards, executor reuse matrix, confirmation flow, security, testing, rollout phases. |

---

*HostSphere AI Co-Pilot & ChatBot — Use-Case Requirements v1.0 • Prepared for Cybelinx Enterprise Hospitality Management System (eHMS) • August 2026*
