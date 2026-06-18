# SAMP — System Architecture & UI Screen Flows

> **Platform:** Service Apartments Management Platform (Multi-Vertical Hospitality & Space Management)
> **Verticals:** Star Hotels & Resorts | Service Apartments | Apartment Rental & Tenancy | Workplace & Managed Offices
> **Color Palette:** `#0E243D` (Primary Dark) · `#2A9D8F` (Secondary Teal) · `#FFC107` (Accent Amber) · `#F4F6F8` (Background Light)

---

## 1. System Architecture

### 1.1 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                               │
│                                                                         │
│  ┌──────────────────┐  ┌──────────────┐  ┌──────────┐  ┌───────────┐  │
│  │  Admin Web        │  │ Operations   │  │ Guest /  │  │ Vendor    │  │
│  │  Console          │  │ Mobile App   │  │ Resident │  │ Portal    │  │
│  │  (Next.js +       │  │ (React       │  │ Mobile   │  │ (Web)     │  │
│  │   Tailwind)       │  │  Native)     │  │ (React   │  │           │  │
│  └────────┬─────────┘  └──────┬───────┘  │  Native) │  └─────┬─────┘  │
│           │                   │           └────┬─────┘        │        │
│           └───────────────────┼────────────────┼──────────────┘        │
└───────────────────────────────┼────────────────┼───────────────────────┘
                                │                │
┌───────────────────────────────▼────────────────▼───────────────────────┐
│                        API GATEWAY LAYER                                │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │          Kong API Gateway / Azure APIM                           │   │
│  │  ● Auth & RBAC Enforcement  ● Rate Limiting  ● Request Routing  │   │
│  │  ● API Versioning           ● Request/Response Transformation   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                │
┌───────────────────────────────▼───────────────────────────────────────┐
│                      MICROSERVICES LAYER                               │
│                                                                        │
│  ┌────────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐        │
│  │ Identity & │  │ Property │  │Reservation│  │  Guest/CRM   │        │
│  │ Access     │  │ & Asset  │  │& Booking  │  │  Service     │        │
│  │ (OAuth2 /  │  │ Mgmt     │  │ Engine    │  │              │        │
│  │  Keycloak) │  └────┬─────┘  └────┬─────┘  └──────┬───────┘        │
│  └────────────┘       │             │               │                 │
│                       │             │               │                 │
│  ┌────────────┐  ┌────▼─────┐  ┌────▼─────┐  ┌──────▼───────┐        │
│  │ Finance &  │  │Housekeep │  │Maintenance│  │ Vendor &     │        │
│  │ Billing    │  │ing &     │  │ & Asset   │  │ Procurement  │        │
│  │ (GL/Ledger)│  │Linen     │  │ Mgmt      │  │ Portal       │        │
│  └────────────┘  └──────────┘  └──────────┘  └──────────────┘        │
│                                                                        │
│  ┌────────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐        │
│  │ HRMS &     │  │  Lease & │  │Workplace │  │ Notification │        │
│  │ Payroll    │  │  Tenancy │  │ Mgmt     │  │ Service      │        │
│  │            │  │  Mgmt    │  │          │  │ (Twilio/WApp)│        │
│  └────────────┘  └──────────┘  └──────────┘  └──────────────┘        │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                   Integration Service Layer                       │  │
│  │  ● OTA Channel Manager (Booking.com, Agoda, Expedia)             │  │
│  │  ● Payment Gateways (Stripe, Razorpay, Adyen)                    │  │
│  │  ● ERP Sync (Tally, Zoho Books)                                  │  │
│  │  ● Hardware (Assa Abloy, Salto smart locks, LPR cameras)         │  │
│  │  ● Identity (DigiLocker, Aadhaar, Passport OCR)                  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                │
┌───────────────────────────────▼───────────────────────────────────────┐
│                         DATA LAYER                                     │
│                                                                         │
│  ┌──────────────────────┐  ┌────────────────┐  ┌──────────────────┐   │
│  │  PostgreSQL          │  │  Redis          │  │  Kafka /         │   │
│  │  (Multi-tenant RLS)  │  │  (Cache /       │  │  RabbitMQ        │   │
│  │                      │  │   Sessions)     │  │  (Event Bus)     │   │
│  └──────────────────────┘  └────────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                │
┌───────────────────────────────▼───────────────────────────────────────┐
│                      INFRASTRUCTURE LAYER                              │
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  ┌───────────┐   │
│  │  Kubernetes  │  │  Terraform   │  │  Prometheus│  │  ELK /    │   │
│  │  (Stateless  │  │  (IaC)       │  │  /Grafana  │  │  OpenSearch│  │
│  │  Containers) │  │              │  │  (Metrics) │  │  (Logging) │   │
│  └──────────────┘  └──────────────┘  └────────────┘  └───────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Multi-Vertical Configuration Model

```
                         ┌──────────────────────┐
                         │   GLOBAL ENTERPRISE  │
                         └──────────┬───────────┘
                                    │
                         ┌──────────▼───────────┐
                         │       REGION         │
                         └──────────┬───────────┘
                                    │
                         ┌──────────▼───────────┐
                         │      PROPERTY        │
                         │  Vertical Type:      │
                         │  ┌─────────────────┐ │
                         │  │ Hotel / Resort   │ │
                         │  │ Service Apt      │ │
                         │  │ Rental Apt       │ │
                         │  │ Workplace        │ │
                         │  └─────────────────┘ │
                         └──────────┬───────────┘
                                    │
                  ┌─────────────────┼────────────────────┐
                  │                 │                    │
         ┌────────▼────────┐ ┌─────▼──────┐  ┌─────────▼────────┐
         │     BUILDING    │ │  BUILDING  │  │    BUILDING      │
         │  (Hotel Wing)   │ │ (Apt Tower)│  │ (Office Campus)  │
         └────────┬────────┘ └─────┬──────┘  └─────────┬────────┘
                  │                │                    │
         ┌────────▼────────┐ ┌─────▼──────┐             │
         │     FLOOR       │ │   FLOOR    │             │
         └────────┬────────┘ └─────┬──────┘             │
                  │                │                    │
         ┌────────▼────────┐ ┌─────▼──────┐  ┌─────────▼────────┐
         │  ROOM / UNIT    │ │  APARTMENT │  │  DESK / SEAT /   │
         │  (Guest Room)   │ │  (Lease)   │  │  MEETING ROOM    │
         └─────────────────┘ └────────────┘  └──────────────────┘

         Billing Model:     Billing Model:     Billing Model:
         Nightly / Short-stay  Monthly/Lease   Hourly/Membership
```

### 1.3 Event-Driven Architecture

```
┌──────────┐       ┌──────────────────┐       ┌────────────────┐
│ Booking  │──────►│    Event Bus     │──────►│  Housekeeping  │
│ Service  │       │    (Kafka)       │       │  Service       │
└──────────┘       └────────┬─────────┘       └────────────────┘
                            │
                   ┌────────▼─────────┐
                   │  Channel Manager │
                   │  (OTA Sync)      │
                   └──────────────────┘
                   ┌────────▼─────────┐
                   │  Billing Service │
                   └──────────────────┘
                   ┌────────▼─────────┐
                   │  Notification    │
                   │  Service         │
                   └──────────────────┘

Events:
• booking.created       • booking.cancelled
• checkin.completed     • checkout.completed
• maintenance.raised    • maintenance.resolved
• payment.received      • lease.signed
```

### 1.4 Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Web Console** | React (Next.js) + Tailwind CSS | Fast iteration, SSR for dashboards, component ecosystem |
| **Mobile Apps** | React Native | Single codebase for Guest, Resident, Operations, Facility apps |
| **Backend** | Node.js (NestJS) | Modular monolith → microservices, TypeScript, decorator-based |
| **Primary DB** | PostgreSQL (Row-Level Security) | Relational integrity, multi-tenant data isolation |
| **Cache** | Redis | Sub-200ms read targets, session management |
| **Event Bus** | Kafka | Durable event streaming, pub/sub for cross-service workflows |
| **API Gateway** | Kong | Centralized auth, rate limiting, routing |
| **Auth** | Keycloak (OAuth2/OIDC) + MFA | RBAC + MFA without building from scratch |
| **Infra** | Kubernetes (AKS/EKS/GKE) | Auto-scaling, stateless containers |
| **CI/CD** | GitHub Actions + ArgoCD | GitOps, repeatable deploys |
| **Observability** | Prometheus/Grafana + ELK | Metrics, logging, alerting |

---

## 2. Color Palette & Design System

### 2.1 Color Definitions

```css
/* Primary Color Palette */
--color-navy:       #0E243D;  /* Primary Dark — headers, nav, primary buttons, footers */
--color-teal:       #2A9D8F;  /* Secondary — active states, success, links, icons */
--color-amber:      #FFC107;  /* Accent — CTAs, highlights, warnings, badges */
--color-light:      #F4F6F8;  /* Background — page backgrounds, cards, containers */

/* Extended Usage */
--color-white:      #FFFFFF;  /* Text on dark backgrounds, card backgrounds */
--color-text:       #1A2332;  /* Body text on light backgrounds */
--color-text-muted: #6B7A8D;  /* Secondary text, labels, placeholders */
--color-border:     #DEE2E6;  /* Dividers, borders, inputs */
--color-danger:     #DC3545;  /* Errors, cancellations, delete actions */
--color-success:    #28A745;  /* Confirmations, check-in status */
```

### 2.2 Component Styling Rules

| Element | Style |
|---|---|
| **Top Navigation Bar** | Background `#0E243D`, white text, amber hover states |
| **Primary Buttons** | Background `#0E243D`, white text, `#2A9D8F` hover |
| **Secondary Buttons** | Background `#2A9D8F`, white text |
| **CTA / Action Buttons** | Background `#FFC107`, dark text `#0E243D` |
| **Page Background** | `#F4F6F8` |
| **Card / Panel** | White background, subtle shadow, `#DEE2E6` border |
| **Success States** | `#2A9D8F` (teal) — checkmarks, confirmed statuses |
| **Warning States** | `#FFC107` (amber) — pending, attention-required |
| **Sidebar Navigation** | `#0E243D` background, white icons, teal active indicator |
| **Data Tables** | Header `#0E243D`, white rows, zebra `#F4F6F8` |
| **Status Badges** | Teal=Active, Amber=Pending, Red=Overdue, Gray=Inactive |

---

## 3. UI Screen Flows by Vertical

### 3.1 Universal Auth & Dashboard Flow

```
                        ┌───────────────────────┐
                        │     LOGIN SCREEN       │
                        │  [Email / Phone]       │
                        │  [Password]            │
                        │  [Sign In]             │
                        │  [Forgot Password]     │
                        └───────────┬───────────┘
                                    │
                        ┌───────────▼───────────┐
                        │   MFA VERIFICATION     │
                        │  (TOTP / SMS Push)     │
                        └───────────┬───────────┘
                                    │
                        ┌───────────▼───────────┐
                        │    DASHBOARD LANDING   │
                        │  Role-Based Routing    │
                        └───────────┬───────────┘
                                    │
         ┌──────────────────────────┼──────────────────────────┐
         │                          │                          │
  ┌──────▼──────┐          ┌───────▼────────┐       ┌────────▼──────┐
  │ Super Admin │          │  Property      │       │  Operations   │
  │ Global View │          │  Manager View  │       │  Staff View   │
  └─────────────┘          └────────────────┘       └───────────────┘
```

---

### 3.2 Super Admin / Executive Dashboard Flow

```
┌──────────────────────────────────────────────────────────────────┐
│  [SAMP Logo]  Dashboard  │  Analytics  │  Users  │  Audit  │ 👤 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  KEY METRICS ROW            │  #0E243D background          │ │
│  │  ┌──────┐ ┌──────┐ ┌──────┐│  ┌──────┐ ┌────────────────┐│ │
│  │  │Occ % │ │ ADR  │ │RevPAR││  │Vendor│ │  Pending       ││ │
│  │  │78.4% │ │$145  │ │$113 ││  │Outflw│ │  Escalations   ││ │
│  │  └──────┘ └──────┘ └──────┘│  └──────┘ └────────────────┘│ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌──────────────────────┐  ┌──────────────────────────────────┐  │
│  │ VERTICAL PERFORMANCE │  │ PROPERTY OCCUPANCY HEATMAP       │  │
│  │ ┌─────┐ ┌─────┐     │  │                                  │  │
│  │ │Hotel│ │Svc  │     │  │  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ │  │
│  │ │82%  │ │Apt  │     │  │  │P1│ │P2│ │P3│ │P4│ │P5│ │P6│ │  │
│  │ ├─────┤ │74%  │     │  │  └──┘ └──┘ └──┘ └──┘ └──┘ └──┘ │  │
│  │ │Rent │ │Work │     │  │                                  │  │
│  │ │91%  │ │place│     │  │  ██ 80-100%  ▓ 60-79%  ░ <60%   │  │
│  └──────┘ │65%  │     │  └──────────────────────────────────┘  │
│           └─────┘     │                                         │
│                       │  ┌──────────────────────────────────┐  │
│  ┌───────────────────┐│  │ AI PREDICTIVE FORECAST           │  │
│  │ CHANNEL REVENUE   ││  │ ┌──────────────────────────────┐ │  │
│  │ ▓ Direct ▓ OTA    ││  │ │ Projected Occupancy: 82%    │ │  │
│  │ ▓ Corporate        ││  │ │ Next Week                    │ │  │
│  └───────────────────┘│  │ │ Maintenance Risk Alert:      │ │  │
│                       │  │ │ HVAC @ Bldg A — 3 units      │ │  │
│                       │  │ └──────────────────────────────┘ │  │
│                       │  └──────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

**Screens:** Login → Global Dashboard → Property Overview → Drill-down Analytics → User Management → Audit Logs

---

### 3.3 Hotel / Service Apartment — Guest Mobile App Flow

```
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│  SPLASH   │   │ ONBOARD  │   │  HOME    │   │ BOOKING  │   │ PRE-     │
│  SCREEN   │──►│ / LOGIN  │──►│ DASH-    │──►│ FLOW     │──►│ ARRIVAL  │
│           │   │          │   │ BOARD    │   │          │   │          │
└──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘
                                                              │
                    ┌──────────┐   ┌──────────┐   ┌──────────┘
                    │  DIGITAL │   │ IN-STAY  │   │ CHECK-IN
                    │  KEY     │◄──│ SERVICES │◄──│ (Express)
                    │  (Assa   │   │          │   │
                    │   Abloy) │   └────┬─────┘   └──────────┐
                    └──────────┘        │                    │
                                        │           ┌────────▼────────┐
                                        │           │  PROFILE & KYC  │
                                        │           │  (Aadhaar/      │
                                        │           │   Passport OCR) │
                                        │           └─────────────────┘
                              ┌─────────▼────────┐
                              │  SERVICE REQUEST │
                              │  ┌──────────────┐│
                              │  │ Housekeeping  ││
                              │  │ Maintenance   ││
                              │  │ F&B Order     ││
                              │  │ Late Stayout  ││
                              │  └──────────────┘│
                              └─────────┬────────┘
                                        │
                              ┌─────────▼────────┐
                              │   CHECKOUT       │
                              │  ● Express       │
                              │  ● View Bill     │
                              │  ● Rate Stay     │
                              │  ● Digital Recpt │
                              └──────────────────┘
```

**Key Screens:** Splash/Login → Home (Current/Upcoming Booking) → Search & Book → Pre-arrival (KYC Upload, Room Preference) → Digital Key → In-Stay Dashboard → Service Requests → Billing → Checkout → Review

---

### 3.4 Front Desk Operations (Web Console) Flow

```
┌──────────────────────────────────────────────────────────────────┐
│  [SAMP]  Front Desk  │  Arrivals  │  In-House  │  Departures  │ │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │  PROPERTY: Oceanview Hotel    |    DATE: 18 Jun 2026        ││
│  │  ┌──────────────────────────────────────────────────────────┐││
│  │  │  VISUAL ROOM MATRIX (Drag & Drop)                      │││
│  │  │                                                         │││
│  │  │  ┌──────┐   ┌──────┐   ┌──────┐   ┌──────┐            │││
│  │  │  │ 101  │   │ 102  │   │ 103  │   │ 104  │            │││
│  │  │  │GUEST │   │▬▬▬▬▬│   │GUEST │   │ DIRTY│            │││
│  │  │  │Smith │   │MAINT │   │Jones │   │      │            │││
│  │  │  └──────┘   └──────┘   └──────┘   └──────┘            │││
│  │  │  ┌──────┐   ┌──────┐   ┌──────┐   ┌──────┐            │││
│  │  │  │ 201  │   │ 202  │   │ 203  │   │ 204  │            │││
│  │  │  │VACANT│   │GUEST │   │GUEST │   │READY │            │││
│  │  │  │      │   │Lee   │   │Park  │   │      │            │││
│  │  │  └──────┘   └──────┘   └──────┘   └──────┘            │││
│  │  │                                                         │││
│  │  │  LEGEND: [🟢 Vacant] [🔵 Occupied] [🟡 Dirty]         │││
│  │  │          [🟠 Maintenance] [⚪ Reserved]                 │││
│  │  └──────────────────────────────────────────────────────────┘││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │ ARRIVALS     │  │ IN-HOUSE     │  │ DEPARTURES             │ │
│  │ ───────────  │  │ ───────────  │  │ ─────────────────────  │ │
│  │ Smith, John  │  │ Lee, Sarah   │  │ Park, Kim              │ │
│  │ Check-in: 3P │  │ Room 202     │  │ Room 203 — Due 11A     │ │
│  │ [Check-in]   │  │ Bill: $1,240 │  │ [Check-out] [Bill]    │ │
│  │              │  │ Extend Stay  │  │ Late check-out: $50    │ │
│  ├──────────────┤  ├──────────────┤  ├────────────────────────┤ │
│  │ WALK-IN      │  │ DND: Rm 105  │  │ SPLIT BILL: Rm 102    │ │
│  │ [New Booking]│  │ Luggage: 302 │  │ [Process Refund]       │ │
│  └──────────────┘  └──────────────┘  └────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

**Key Screens:** Login → Property Selector → Front Desk Dashboard → Room Matrix → Check-in Wizard → Guest Folio → Check-out → Walk-in Booking → Room Transfer → Late Checkout

---

### 3.5 Housekeeping Operations (Mobile App) Flow

```
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│  LOGIN    │   │  TASK    │   │  ROOM    │   │  CLEAN   │   │  STATUS  │
│  (Face    │──►│  DASH-   │──►│  DETAIL  │──►│  PROTO-  │──►│  UPDATE  │
│   Auth)   │   │  BOARD   │   │          │   │  COL     │   │          │
└──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘
                   │                                              │
                   │                                              │
          ┌────────▼────────┐                           ┌─────────▼────────┐
          │ TASK PRIORITIES  │                           │  ROOM STATUS     │
          │                  │                           │  PROGRESSION     │
          │ ⚡ VIP: Rm 1201  │                           │                   │
          │    (10th Floor)  │                           │ Dirty ──►        │
          │                  │                           │ In Progress ──►  │
          │ ⚡ Checkout: 203 │                           │ Quality Check ──►│
          │ ⚡ Stayover: 105 │                           │ Ready ✔          │
          │                  │                           │                   │
          │ ┌──────────────┐│                           │ LINEN STATUS     │
          │ │ GEO-LOCATION ││                           │ ● Dispatch Soiled │
          │ │ TRACKING     ││                           │ ● Receive Fresh   │
          │ │ Floor 10 (3) ││                           │ ● Damaged Logged  │
          │ │ Floor 2  (2) ││                           └───────────────────┘
          │ └──────────────┘│
          └─────────────────┘
```

**Key Screens:** Face Auth Login → Task Dashboard (Prioritized List) → Room Details → Cleaning Protocol Checklist → Status Change → Linen Scan → Quality Inspection

---

### 3.6 Maintenance Operations Flow

```
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│  LOGIN    │   │  TICKET  │   │ TICKET   │   │  WORK    │   │  RESOLVE │
│          │──►│  DASH-   │──►│  DETAIL   │──►│  EXECUTE │──►│  & CLOSE │
│          │   │  BOARD   │   │          │   │          │   │          │
└──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘
                   │                                              │
          ┌────────▼────────┐                           ┌─────────▼────────┐
          │  TICKET TYPES    │                           │  AMC CHECK       │
          │                  │                           │                   │
          │ ⚠ CRITICAL (2)  │                           │ ● Under Warranty │
          │   ● AC Failure   │                           │ → Route to Vendor│
          │     Room 1204    │                           │ ● Out of Warranty│
          │   ● Geyser Leak  │                           │ → Approve Cost   │
          │     Room 305     │                           │ ● Preventive Due │
          │                  │                           │ → Schedule       │
          │ 🔧 Preventive(5)│                           └───────────────────┘
          │   ● HVAC: 90d    │
          │   ● Fire Alarm   │
          │                  │
          │ ● AMC Monitor    │
          └──────────────────┘
```

**Key Screens:** Login → Ticket Dashboard (Critical → Preventive sorted) → Ticket Detail (Photos, Location, Priority) → Work Execution → Parts/Inventory Log → AMC Verification → Resolve & Close

---

### 3.7 Apartment Rental — Tenant Lifecycle Flow

```
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│  DISCOVER │   │  APPLY   │   │  SIGN    │   │  MOVE-IN │   │  PAY     │
│  Units    │──►│  + KYC   │──►│  LEASE   │──►│  INSPECT │──►│  RENT    │
│          │   │          │   │  (e-Sig) │   │          │   │          │
└──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘
                                                                  │
                         ┌──────────┐   ┌──────────┐   ┌──────────┘
                         │  REVIEW  │   │  MOVE-   │   │ SERVICE
                         │  & RENEW │◄──│  OUT     │◄──│ REQUEST
                         │          │   │          │   │
                         └──────────┘   └──────────┘   └──────────┐
                                                                  │
                         ┌──────────┐   ┌──────────┐   ┌──────────┘
                         │  NOTICE   │   │ DEPOSIT  │
                         │  PERIOD   │   │ SETTLE-  │
                         │  TRACKER  │   │ MENT     │
                         └──────────┘   └──────────┘

LEASE STATES: Drafted → Signed → Active → Renewal-Due → Renewed / Terminated
```

**Key Screens (Tenant Mobile):** Login → Dashboard (Lease Status, Due Rent) → Rent Payment → Service Request → Lease Documents → Renewal/Notice → Move-out Checklist
**Key Screens (Property Manager Web):** Dashboard → Lease Workbench → Rent Roll → Deposit Ledger → Notice Tracking → Inspection Scheduler

---

### 3.8 Workplace Management Flow

```
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│  LOGIN    │   │  BOOK    │   │  ACCESS  │   │  AMENITY │   │  BILLING │
│  (Member) │──►│  DESK /  │──►│  CONTROL │──►│  REQUEST │──►│  (Corp)  │
│          │   │  ROOM    │   │  (Digital│   │          │   │          │
│          │   │          │   │   Key)   │   │          │   │          │
└──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘
                   │
          ┌────────▼────────┐
          │  BOOKING TYPES   │
          │                  │
          │ □ Hot Desk       │
          │ □ Dedicated Seat │
          │ □ Private Cabin  │
          │ □ Meeting Room   │
          │                  │
          │ FLOOR PLAN VIEW  │
          │ ┌── ── ── ──┐   │
          │ │ ░ █ ░ ░ █ │   │
          │ │ ░ ░ █ ░ ░ │   │
          │ │ █ ░ ░ ░ ░ │   │
          │ └── ── ── ──┘   │
          │ ░ Available  █ Taken │
          └──────────────────┘
```

**Key Screens (Member):** Login → Floor Plan (Interactive) → Desk/Room Booking → Calendar Sync → Access Credentials → Helpdesk
**Key Screens (Facility Manager):** Dashboard → Seat Utilization → Membership Management → Access Control → Visitor Pre-reg → Facility Helpdesk → SLA Monitoring

---

## 4. Navigation & Component Library

### 4.1 Global Navigation Structure (Web Console)

```
┌────────────────────────────────────────────────────────────────────┐
│ #0E243D    ┌──────────┐  ┌──────────────────────────────────────┐ │
│ ▐☰▐       │ SAMP LOGO│  │  Search properties, guests...  🔔 👤│ │
│            └──────────┘  └──────────────────────────────────────┘ │
├──────────┬────────────────────────────────────────────────────────┤
│ SIDEBAR  │  MAIN CONTENT AREA                                     │
│ #0E243D  │  Background: #F4F6F8                                   │
│          │                                                        │
│ 📊 Dash. │  ┌──────────────────────────────────────────────────┐  │
│ 🏢 Prop. │  │  CARD / PANEL — White bg, #DEE2E6 border         │  │
│ 📅 Book. │  │  ┌────────────────────────────────────────────┐  │  │
│ 👥 Guest │  │  │  Title (#0E243D)                          │  │  │
│ 🧹 HK    │  │  │  Content                                   │  │  │
│ 🔧 Maint │  │  │  [Primary #0E243D] [Secondary #2A9D8F]    │  │  │
│ 💰 Fin.  │  │  │  [CTA #FFC107]                             │  │  │
│ 👤 HRMS  │  │  └────────────────────────────────────────────┘  │  │
│ 📋 Leases│  └──────────────────────────────────────────────────┘  │
│ 🏢 Work. │                                                        │
│ 📈 Rprts │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                  │
│ ⚙ Admin  │  │KPI   │ │KPI   │ │KPI   │ │KPI   │                  │
│          │  │#0E243D│ │#2A9D8F│ │#0E243D│ │#FFC107│                  │
│          │  └──────┘ └──────┘ └──────┘ └──────┘                  │
│ ACTIVE   │                                                        │
│ INDICATOR│  ┌──────────────────────────────────────────────────┐  │
│ #2A9D8F  │  │  TABLE: Header #0E243D, Zebra #F4F6F8          │  │
│ ───────  │  │  ┌──────┬──────┬──────┬────────┬───────────┐   │  │
│          │  │  │Name  │Room  │Status│Check-in│ Actions   │   │  │
│          │  │  ├──────┼──────┼──────┼────────┼───────────┤   │  │
│          │  │  │Smith │101   │🟢 In │18 Jun  │ [View]    │   │  │
│          │  │  │Lee   │102   │🟡 Due │19 Jun  │ [View]    │   │  │
│          │  │  └──────┴──────┴──────┴────────┴───────────┘   │  │
│          │  └──────────────────────────────────────────────────┘  │
└──────────┴────────────────────────────────────────────────────────┘
```

### 4.2 Mobile Navigation Structure

```
┌─────────────────────────────┐
│  ┌───────────────────────┐  │
│  │  STATUS BAR           │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │  APP BAR — #0E243D    │  │
│  │  ← Title       🔔    │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │  CONTENT AREA         │  │
│  │  Background: #F4F6F8  │  │
│  │                       │  │
│  │  ┌─────────────────┐  │  │
│  │  │  White Card      │  │  │
│  │  │  #2A9D8F Accent  │  │  │
│  │  └─────────────────┘  │  │
│  │                       │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │  BOTTOM NAV BAR       │  │
│  │  Background: #FFFFFF  │  │
│  │                       │  │
│  │ 🏠  📅  🔧  💳  👤  │  │
│  │Home Bkng Serv Bill Prof│  │
│  │          ┃             │  │
│  │    Active: #2A9D8F     │  │
│  │    Inactive: #6B7A8D   │  │
│  └───────────────────────┘  │
└─────────────────────────────┘
```

---

## 5. Screen Mapping by Role

| Role | Primary Screens | Interface |
|---|---|---|
| **Super Admin** | Global Dashboard, User Mgmt, Audit Logs, System Config, Property Onboarding | Web Console |
| **Executive** | Macro Dashboard, P&L Reports, CapEx Approval, Portfolio Analytics | Web + Executive Mobile |
| **Property Manager** | Property Dashboard, Yield Reports, Compliance Vault, Escalations, Staff Scheduling | Web + Manager Mobile |
| **Front Desk** | Room Matrix, Check-in/out, Walk-in Booking, Folio Mgmt, Room Transfers | Web Console |
| **Housekeeping Sup.** | Task Board, Linen Audit, Deep Clean Schedule, Inspection Queue | Ops Mobile App |
| **Housekeeping Staff** | Task List (Geo-sorted), Room Status Update, Amenity Log | Ops Mobile App |
| **Maintenance Staff** | Ticket Dashboard, Work Orders, AMC Lookup, Parts Inventory | Ops Mobile App |
| **Security Staff** | LPR Dashboard, Parking Bay Map, Visitor Log, Gate Control | Ops Mobile App |
| **Finance Manager** | GL Dashboard, Invoice Matching, Tax Reports, Bank Reconciliation, Payroll | Web Console |
| **HR Manager** | Attendance Dashboard, Shift Planner, Payroll Run, Compliance Calc | Web Console |
| **Vendor** | Compliance Upload, Invoice Submit, Quote Response, SLA Dashboard | Vendor Portal |
| **Guest (Hotel/Svc Apt)** | Booking, Pre-arrival, Digital Key, Service Requests, Bill, Checkout | Guest Mobile App |
| **Tenant (Rental Apt)** | Lease View, Rent Pay, Service Request, Renewal/Notice, Move-out | Resident Mobile App |
| **Workplace Member** | Desk/Room Booking, Floor Plan, Access Credentials, Helpdesk | Facility Mobile App |
| **Workplace Facility Mgr** | Seat Utilization, Membership Billing, Access Control, Visitor Mgmt, SLAs | Web + Facility Mobile |

---

## 6. Key User Journeys

### J1: Guest Touchless Journey (Hotel / Service Apartment)
```
1. Guest searches & books via OTA or Direct
   └─► Channel Manager syncs inventory (≤1200ms)
2. Pre-arrival trigger: WhatsApp/Email 24h prior
   └─► Guest completes profile + KYC (Aadhaar/Passport OCR)
3. Auto-gate pass generated (LPR for parking)
4. Arrival: Digital key sent to phone (Assa Abloy/Salto)
   └─► Room status: Vacant → Occupied (Housekeeping triggered)
5. During stay: Service requests via mobile app
   └─► F&B, Housekeeping, Maintenance (photo attach)
6. Checkout: Express checkout via app
   └─► Bill settled, digital receipt, loyalty points credited
   └─► Room status: Occupied → Dirty (HK queue updated)
```

### J2: Lease-to-Move-Out (Apartment Rental)
```
1. Prospect discovers unit → Applies → KYC completed
2. Lease generated (Draft) → e-Signed → Active
   └─► Security deposit ledger created
3. Move-in: Unit inspection recorded (photo evidence)
4. Monthly: Auto-rent invoice → Payment via gateway
   └─► Late penalty auto-applied if > due date
5. Service request: Tenant raises via app
   └─► Routes to same maintenance engine as hotel
6. Renewal notice: 90/60/30 day alerts before expiry
7. Move-out: Notice period tracked → Inspection → Deposit settlement
   └─► Lease state: Terminated
```

### J3: Workplace Desk Booking (Managed Office)
```
1. Member logs in → Views interactive floor plan
2. Selects hot desk / meeting room slot
   └─► Conflict detection runs → Confirmed
3. Calendar synced (Outlook/Google)
4. Day-of: Digital access credential issued
   └─► Turnstile/lock integration
5. Usage logged → Overage billing if beyond plan
6. Helpdesk: IT/AV/Pantry requests via app
   └─► SLA timers: Workplace-grade response
```

---

## 7. Responsive Breakpoints

| Breakpoint | Target | Layout |
|---|---|---|
| **≥1200px** | Desktop Web | Full sidebar + content + detail panels |
| **992–1199px** | Small Desktop | Collapsed sidebar, scrollable content |
| **768–991px** | Tablet | Bottom nav, single column cards |
| **<768px** | Mobile | Bottom nav, stacked cards, full-width tables scroll horizontally |

---

## 8. Deliverable Summary

| Artifact | File |
|---|---|
| Enterprise BRD/SRS | `docs/requirements/HMS_Enterprise_BRD_SRS_MultiVertical.docx` |
| Solution Development Approach | `docs/requirements/HMS_Solution_Development_Approach.docx` |
| **Architecture & UI Screen Flows** | **`docs/architecture/SAMP_Architecture_UI_Flow.md`** |

---

*Generated from SAMP BRD/SRS — Architecture designed for multi-vertical scalability with configurable Vertical Type templates on a unified core, event-driven state propagation, and API-first design.*
