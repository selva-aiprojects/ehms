# Manual 11: Revenue Management & AI Pricing

## 📌 Module Overview

The **Revenue Management & AI Pricing** module leverages predictive analytics, artificial intelligence rate recommendations, multi-channel distribution (OTA), dynamic rate cards, loyalty rewards, and automated WhatsApp guest marketing to maximize RevPAR (Revenue Per Available Room) and direct booking conversions.

---

## 🎯 Key Features & Capabilities

- **Executive Revenue Dashboard**: Real-time tracking of ADR (Average Daily Rate), RevPAR, Occupancy %, Pace Analysis, Pickup Trends, and Channel Yield.
- **AI Dynamic Pricing Engine**: Machine learning algorithms predicting optimal room rates based on historical occupancy, seasonal demand, local event calendars, and competitor price tracking.
- **Dynamic Rate Cards**: Rule-based pricing multipliers (Weekend surcharges, Holiday peak pricing, Minimum length-of-stay rules, Early bird discounts).
- **OTA Channel Manager**: Real-time 2-way sync with Online Travel Agencies (MakeMyTrip, Goibibo, Booking.com, Agoda, Expedia) to eliminate overbookings.
- **Loyalty Program & Tiers**: Member tier tracking (Silver, Gold, Platinum, VIP), reward points accumulation, instant redemption at Front Desk, and birthday/anniversary promotions.
- **WhatsApp Guest Engagement**: Automated transactional messages (Booking Confirmation, Pre-arrival Reminders, Self Check-in Link, Digital Folio Invoice, Review Request).

---

## 🧭 Sub-Modules & Operating Procedures

### 1. Revenue Dashboard (`/dashboard/revenue`)
- **Navigation**: Sidebar -> Revenue & Loyalty -> **Revenue Dashboard**
- **Operating Instructions**:
  1. Review KPIs: Total Monthly Revenue, ADR, RevPAR, Direct vs. OTA Mix %, Average Lead Time (Days).
  2. Revenue Pace Graph: Compare current month booking pace against the same period last year (YoY Comparison).

### 2. AI Pricing Engine (`/dashboard/revenue/ai`)
- **Navigation**: Sidebar -> Revenue & Loyalty -> **Revenue AI**
- **Operating Instructions**:
  1. View AI-suggested room rates for the next 30, 60, and 90 days.
  2. The AI algorithm analyzes:
     - 📈 **Demand Forecast**: High demand predicted for local conference/concert weekend.
     - 📉 **Pace Drop**: Unusually low bookings detected for mid-week period.
  3. Review recommendation details (e.g., *"Increase Deluxe Room rate by +15% for Oct 12-14"*).
  4. Click **Apply AI Rate Recommendation** to push updated rates across all connected OTA channels and direct booking engines instantly.

### 3. Rate Cards & Pricing Toggles (`/dashboard/pricing`)
- **Navigation**: Sidebar -> Revenue & Loyalty -> **Pricing**
- **Operating Instructions**:
  1. Click **Create Rate Card**.
  2. Configure Rate Rules:
     - Base Tariff per Room Category
     - Day of Week Adjustment (e.g., +20% on Friday & Saturday nights)
     - Extra Person / Child Charges
     - Inclusions (Complimentary Breakfast, Airport Transfer, Spa Credit)
  3. Set Minimum Length of Stay (MLOS) rules for long weekends.

### 4. Loyalty Program (`/dashboard/loyalty`)
- **Navigation**: Sidebar -> Revenue & Loyalty -> **Loyalty**
- **Operating Instructions**:
  1. Define Tier Thresholds:
     - 🥈 **Silver**: 0 – 5,000 Points (5% discount on F&B)
     - 🥇 **Gold**: 5,001 – 15,000 Points (10% discount + Free Room Upgrade)
     - 💎 **Platinum**: >15,000 Points (15% discount + Late Checkout + Complimentary Breakfast)
  2. View guest points ledger and process manual point adjustments or redemptions.

### 5. OTA Channels (`/dashboard/ota`)
- **Navigation**: Sidebar -> Revenue & Loyalty -> **OTA Channels**
- **Operating Instructions**:
  1. View live status of connected channel managers (MakeMyTrip, Goibibo, Booking.com, Agoda).
  2. Click **Sync Inventory Now** to trigger an immediate inventory and rate refresh.
  3. View sync logs and resolve mapping errors.

### 6. WhatsApp Guest Engagement (`/dashboard/whatsapp`)
- **Navigation**: Sidebar -> Revenue & Loyalty -> **WhatsApp**
- **Operating Instructions**:
  1. Manage automated message triggers:
     - 📩 `Booking Confirmation`: Sent immediately upon reservation creation.
     - 🔑 `Self Check-in Link`: Sent 24 hours prior to arrival.
     - 🧾 `Digital Invoice`: Sent upon checkout settlement.
     - ⭐ `Feedback Survey`: Sent 2 hours after checkout.
  2. Broadcast promotional campaigns to past guests.

---

## 👥 Roles & Permissions Matrix

| Action | Revenue Mgr | Property Mgr | Executive | Super Admin | Front Desk |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Apply AI Rate Suggestions | ✅ | ✅ | ✅ | ✅ | Read Only |
| Modify Rate Cards & Seasons | ✅ | ✅ | ✅ | ✅ | Read Only |
| Configure OTA Channels | ✅ | ❌ | ✅ | ✅ | ❌ |
| Redeem Loyalty Points | Read Only | ✅ | ✅ | ✅ | ✅ |
| Send WhatsApp Campaigns | ✅ | ✅ | ✅ | ✅ | ❌ |

---

## 💡 Operational Best Practices

1. **Daily Pace Review**: Run the **AI Pricing Engine** daily at 09:00 AM to review demand fluctuations and accept dynamic rate optimizations.
2. **Channel Parity Maintenance**: Ensure rate cards match across all OTA channels to avoid parity breach penalties from major OTA partners.

---
*Document Version: 1.0 | Module: Revenue Management & AI Pricing*
