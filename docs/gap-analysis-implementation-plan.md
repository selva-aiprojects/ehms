# eHMS Gap Analysis & Implementation Plan

> Generated: 24 Jul 2026
> Strategy: AI-Native Hospitality Operating System (not a Stayflexi clone)

---

## Current State Summary

| Metric | Count |
|--------|-------|
| Database Tables | 120+ |
| API Endpoints | 130+ |
| SWR Data Hooks | 80+ |
| Mutation Hooks | 40+ |
| Business Verticals | 4 (Hotels, Apartments, Rental, Workplace) |
| Role Types | 12+ |
| Modules | 15 |

**Estimated coverage: ~60-65% of a competitive modern PMS.**

---

## GAP ANALYSIS

### GAP-1: OTA Channel Manager (CRITICAL)

**Current State:** `ota_channel_config` table exists but is a skeleton. `channel_sync_log` exists. `channel_partners` seeded with Booking.com, Expedia, Agoda, MakeMyTrip, Goibibo, Hotels.com. No actual sync logic, no iCal/XML integration, no rate/inventory push.

**What's Needed:**
- iCal feed import/export per unit (minimum viable for availability sync)
- XML/JSON API adapter pattern for each OTA channel
- Inventory push (room availability + rates by date)
- Rate push (dynamic rates by room type + date)
- Booking pull (new/reservation/cancellation from OTA → create/update/cancel booking)
- Mapping UI: map property units ↔ OTA room types
- Sync scheduler (cron/background job)
- Conflict resolution for double-bookings
- Commission tracking per channel
- Reconciliation: OTA settlements vs bookings

**Tables to Add:**
```sql
ota_rate_mappings (property_id, room_type, channel_id, channel_room_type_code)
ota_rate_push_queue (property_id, unit_id, date, rate, status, pushed_at)
ota_availability_push_queue (property_id, unit_id, date, available, status)
ota_booking_queue (property_id, channel_id, channel_booking_ref, payload, status)
ota_commission_rates (channel_id, room_type, commission_pct)
ota_settlements (property_id, channel_id, period_start, period_end, gross_amount, commission, net_amount, status)
```

**Effort: 4-5 weeks**

---

### GAP-2: Direct Booking Engine (CRITICAL)

**Current State:** No public booking page. Guests can only book via internal front desk.

**What's Needed:**
- Public-facing booking page (property-branded)
- Availability calendar (real-time)
- Room type cards with photos, amenities, pricing
- Date picker (check-in/check-out)
- Promo code / coupon input
- Tax calculation (GST/ST)
- Payment gateway integration
- Booking confirmation (email + SMS)
- My Booking page (view/cancel)
- Embeddable widget for hotel website

**Effort: 3-4 weeks**

---

### GAP-3: Dynamic Pricing Engine (HIGH)

**Current State:** `rate_plans` table exists with `is_dynamic` flag and `rules` JSONB. `inventory_calendar` stores per-date rates. `lib/revenue-ai.ts` exists (basic). No actual dynamic pricing logic.

**What's Needed:**
- Rule-based pricing (occupancy thresholds, day-of-week, season, festival)
- Season definitions (peak, shoulder, low, festival)
- Last-minute discount logic
- Length-of-stay pricing (3+ nights, 7+ nights, 30+ nights)
- Minimum/maximum rate caps
- AI-assisted rate recommendations
- Bulk rate editor (Excel-like grid)
- Rate effective date ranges

**Effort: 3-4 weeks**

---

### GAP-4: Visual Reservation Calendar (HIGH)

**Current State:** `useReservations` returns a flat list. No drag-and-drop calendar.

**What's Needed:**
- Gantt-style horizontal calendar
- Each row = a unit (101, 102, 103...)
- Each column = a date
- Color-coded by booking status
- Drag-and-drop to move bookings between rooms
- Click to create booking on empty cell
- Filter by floor, building, room type
- Today marker
- Zoom: day / week / month

**Effort: 3-4 weeks**

---

### GAP-5: Guest CRM & Loyalty (HIGH)

**Current State:** `guest_profiles` exists with `tags`, `preferences`, `loyalty_points`, `total_stays`. No loyalty tiers, no reward redemption.

**What's Needed:**
- Loyalty tier engine (Silver → Gold → Platinum)
- Points earning rules
- Points redemption
- Guest preference capture
- Guest timeline (all bookings, spend, complaints, feedback)
- Birthday/anniversary reminders
- Auto-tagging

**Effort: 2-3 weeks**

---

### GAP-6: Payment Gateway Integration (HIGH)

**Current State:** `payment_gateway_config` table exists (skeleton). No actual gateway integration.

**What's Needed:**
- Razorpay integration (India primary)
- Stripe integration (international)
- UPI QR code generation
- Split payment
- Partial payments
- Refund processing
- Payment link generation
- Auto-reconciliation

**Effort: 3-4 weeks**

---

### GAP-7: WhatsApp Automation (HIGH)

**Current State:** `notification_templates` and `notification_queue` tables exist. No WhatsApp integration.

**What's Needed:**
- WhatsApp Business API integration
- Pre-booking, Post-booking, Pre-arrival, During stay, Post-checkout messages
- AI chatbot for common queries
- Template management UI
- Message delivery tracking

**Effort: 3-4 weeks**

---

### GAP-8: AI Concierge (HIGH — Differentiator)

**Current State:** `guest_requests` table exists. No AI layer.

**What's Needed:**
- Natural language guest interface (WhatsApp/SMS/in-app)
- Intent recognition
- Auto-routing to appropriate department
- Multi-language support
- Staff-side AI assistant

**Effort: 4-5 weeks**

---

### GAP-9: Revenue Dashboard & Analytics (MEDIUM)

**Current State:** Basic dashboard stats. No hotel-specific KPIs.

**What's Needed:**
- ADR, RevPAR, Occupancy %
- Booking source mix
- Revenue by room type / OTA channel
- Forecast revenue
- Comparison: this year vs last year
- Export to Excel/PDF

**Effort: 2-3 weeks**

---

### GAP-10: Self Check-in & Digital KYC (MEDIUM)

**Current State:** `checkin_checklists` exists. `guest_profiles` has KYC fields. `digital_keys` exists.

**What's Needed:**
- Mobile-friendly self check-in link
- Identity document upload + OCR
- Face match
- Police Form-C auto-fill
- Payment completion + digital key delivery

**Effort: 3-4 weeks**

---

### GAP-11: Maintenance Enhancement (MEDIUM)

**Current State:** Good foundation with tickets, AMC, preventive schedules, parts, time entries.

**What's Needed:**
- SLA tracking
- Auto-assign technician
- Cost tracking per ticket
- Recurring maintenance auto-generation
- Vendor performance scoring

**Effort: 1-2 weeks**

---

### GAP-12: Laundry Module (MEDIUM)

**Current State:** Internal linen tracking only.

**What's Needed:**
- Guest laundry order workflow
- Laundry vendor management
- Price list per item
- Lost item tracking
- Billing integration

**Effort: 1-2 weeks**

---

### GAP-13: Multi-Property Dashboard (MEDIUM)

**What's Needed:**
- Group dashboard
- Property comparison
- Central rate management
- Cross-property guest profile

**Effort: 2-3 weeks**

---

### GAP-14: Restaurant POS Enhancement (MEDIUM)

**Current State:** Basic F&B menu and orders.

**What's Needed:**
- Table management (floor plan)
- Kitchen Display System
- Split bills, happy hours, combos
- End-of-day reconciliation

**Effort: 2-3 weeks**

---

### GAP-15: Mobile Apps (LOW for MVP)

**Recommendation:** Defer native apps. Focus on PWA.

**Effort: 2-3 weeks PWA; 8-12 weeks native**

---

### GAP-16: Banquet/Event Management (LOW)

**Effort: 2-3 weeks**

---

## DIFFERENTIATION: AI-Native Hospital OS

| AI Feature | Description | Priority |
|------------|-------------|----------|
| **AI Concierge** | Guest asks via WhatsApp → AI responds | P1 |
| **AI Revenue Manager** | Optimal rates based on occupancy/season | P1 |
| **AI Front Desk Assistant** | Staff NLP queries | P2 |
| **AI Predictive Maintenance** | Equipment failure prediction | P2 |
| **AI Guest Sentiment** | Feedback analysis | P2 |
| **AI Housekeeping Optimizer** | Room assignment optimization | P3 |
| **AI Expense Analyzer** | Spending pattern detection | P3 |
| **AI BI Chat** | Conversational analytics | P3 |

---

## IMPLEMENTATION ROADMAP

### Phase 1: Core PMS Completion (Weeks 1-8)

| Week | Module | Deliverables |
|------|--------|-------------|
| 1-2 | Visual Reservation Calendar | Drag-and-drop Gantt calendar |
| 2-3 | Guest CRM Enhancement | Loyalty tiers, preferences, timeline |
| 3-4 | Payment Gateway | Razorpay + Stripe integration |
| 4-5 | Dynamic Pricing Engine | Rule-based pricing, season mgmt |
| 5-6 | Revenue Dashboard | ADR, RevPAR, occupancy charts |
| 6-7 | Maintenance Enhancement | SLA tracking, cost analytics |
| 7-8 | Laundry Module | Guest laundry workflow |

### Phase 2: OTA & Direct Booking (Weeks 9-16)

| Week | Module | Deliverables |
|------|--------|-------------|
| 9-12 | OTA Channel Manager | iCal sync, rate mapping, XML adapters |
| 12-15 | Direct Booking Engine | Public booking page, payment |
| 15-16 | WhatsApp Automation | Business API, templates |

### Phase 3: Revenue & Intelligence (Weeks 17-24)

| Week | Module | Deliverables |
|------|--------|-------------|
| 17-18 | Multi-Property Dashboard | Group dashboard |
| 19-20 | Restaurant POS | Table mgmt, KDS, split bills |
| 21-22 | Loyalty Program | Points redemption, referral |
| 23-24 | AI Revenue Manager | Rate recommendations |

### Phase 4: AI Operating System (Weeks 25-36)

| Week | Module | Deliverables |
|------|--------|-------------|
| 25-27 | AI Concierge | NLP interface, intent recognition |
| 27-29 | AI Front Desk | Staff NLP queries |
| 31-33 | AI Predictive Maintenance | Failure prediction |
| 33-35 | AI BI Chat | Conversational analytics |

### Phase 5: Scale & Polish (Weeks 37-44)

| Week | Module | Deliverables |
|------|--------|-------------|
| 37-38 | Performance Optimization | Caching, CDN, lazy loading |
| 39-40 | Reporting Suite | 20+ reports, custom builder |
| 41-42 | Import/Excel Tools | Bulk upload tools |
| 43-44 | Documentation & Training | API docs, user guides |

---

## NEW DEPENDENCIES

```
# Payment
razorpay
stripe

# WhatsApp
twilio

# AI
openai

# Calendar/DnD
@dnd-kit/core

# OCR
tesseract.js

# Export
xlsx
jspdf
```

---

## EFFORT SUMMARY

| Phase | Dev-Days | Duration (1 dev) | Duration (2 devs) |
|-------|----------|-------------------|--------------------|
| Phase 1 | 60-70 | 14 weeks | 7 weeks |
| Phase 2 | 65-75 | 15 weeks | 7.5 weeks |
| Phase 3 | 60-70 | 14 weeks | 7 weeks |
| Phase 4 | 80-90 | 18 weeks | 9 weeks |
| Phase 5 | 40-50 | 10 weeks | 5 weeks |
| **Total** | **305-355** | **~71 weeks** | **~36 weeks** |

---

## PRIORITY MATRIX

| Priority | Feature | Business Impact | Effort | ROI |
|----------|---------|----------------|--------|-----|
| P0 | Visual Reservation Calendar | Direct UX | Medium | Very High |
| P0 | OTA Channel Manager | Revenue multiplier | High | Very High |
| P0 | Payment Gateway | Blocks revenue | Low | Critical |
| P1 | Direct Booking Engine | Commission savings | Medium | Very High |
| P1 | Dynamic Pricing | Revenue optimization | Medium | High |
| P1 | AI Concierge | Key differentiator | High | Very High |
| P1 | WhatsApp Automation | Guest experience | Medium | High |
| P2 | Guest CRM & Loyalty | Retention | Medium | High |
| P2 | Revenue Dashboard | Decision support | Low | High |
| P2 | Self Check-in & KYC | Efficiency | Medium | Medium |
| P3 | Restaurant POS | Ancillary revenue | Medium | Medium |
| P3 | Multi-Property Dashboard | Scalability | Medium | Medium |
| P3 | Laundry Module | Operational | Low | Medium |
| P4 | Banquet/Events | Ancillary revenue | Medium | Medium |
| P4 | Mobile PWA | Experience | Medium | Medium |

---

## DATABASE MIGRATIONS NEEDED

| Migration | Tables Added | Module |
|-----------|-------------|--------|
| 030 | 6 | OTA Channel Manager |
| 031 | 3 | Booking Engine |
| 032 | 3 | Dynamic Pricing |
| 033 | 5 | Loyalty & CRM |
| 034 | 2 | Payment Gateway |
| 035 | 3 | WhatsApp Automation |
| 036 | 3 | AI Concierge |
| 037 | 3 | Guest Feedback Aggregation |
| 038 | 2 | Restaurant POS |
| 039 | 4 | Banquet/Events |
| 040 | 2 | Multi-Property Dashboard |
| 041 | 3 | Self Check-in & KYC |
| 042 | 2 | Laundry Service |
| **Total** | **41** | |
