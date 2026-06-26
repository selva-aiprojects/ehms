# eHMS — Enterprise Hospitality Management System
## Complete Technical Architecture, Workflow & Functional Document

> **Platform:** eHMS — Multi-Vertical Enterprise Hospitality & Facilities Management  
> **Verticals:** Hotels & Resorts | Service Apartments | Apartment Leasing & Rental | Workplace & Managed Offices  
> **Tech Stack:** Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · NeonDB (PostgreSQL 16) · SWR  
> **Auth:** JWT (httpOnly cookie) · bcryptjs · RBAC  
> **Last Updated:** 25 June 2026

---

## Table of Contents

1. [Technology Stack](#1-technology-stack)
2. [System Architecture Overview](#2-system-architecture-overview)
3. [Technical Data Flow: UI → API → DB](#3-technical-data-flow-ui--api--db)
4. [Authentication & Authorization Architecture](#4-authentication--authorization-architecture)
5. [Hotel & Resort Management — Complete Module](#5-hotel--resort-management--complete-module)
6. [Service Apartment Management — Complete Module](#6-service-apartment-management--complete-module)
7. [Apartment Leasing & Rent Services — Complete Module](#7-apartment-leasing--rent-services--complete-module)
8. [Workplace & Managed Office Management — Complete Module](#8-workplace--managed-office-management--complete-module)
9. [Cross-Cutting Operational Modules](#9-cross-cutting-operational-modules)
10. [Database Schema Map](#10-database-schema-map)
11. [Property Configuration & Feature Toggles](#11-property-configuration--feature-toggles)
12. [Architecture Diagrams](#12-architecture-diagrams)
13. [API Endpoint Reference](#13-api-endpoint-reference)
14. [Test Users & User Journeys by Workspace](#14-test-users--user-journeys-by-workspace)

---

## 1. Technology Stack

### 1.1 Core Framework

| Category | Technology | Version | Purpose |
|---|---|---|---|
| **Framework** | Next.js | 16.2.9 | App Router, SSR, API routes, middleware |
| **UI Library** | React | 19.2.4 | Component model, hooks, context |
| **Language** | TypeScript | ^5 | Type safety across the stack |
| **Styling** | Tailwind CSS | ^4 | Utility-first responsive design |
| **Package Manager** | npm | — | Dependency management |

### 1.2 Database & Backend

| Category | Technology | Version | Purpose |
|---|---|---|---|
| **Database** | PostgreSQL (NeonDB) | 16 | Serverless Postgres with connection pooling |
| **DB Driver** | @neondatabase/serverless | ^1.1.0 | SQL-over-HTTP, tagged template queries |
| **Auth** | jsonwebtoken | ^9.0.3 | JWT token sign/verify |
| **Auth** | bcryptjs | ^3.0.3 | Password hashing & comparison |

### 1.3 Frontend Libraries

| Category | Technology | Version | Purpose |
|---|---|---|---|
| **Data Fetching** | swr | ^2.4.1 | Caching, revalidation, mutations |
| **Icons** | lucide-react | ^1.21.0 | Icon component library |
| **Charts** | recharts | ^3.8.1 | Revenue/occupancy charts |
| **Toast** | react-hot-toast | ^2.6.0 | Toast notifications |
| **Radix UI** | @radix-ui/* | ^1.x | Accessible dialog, dropdown, tabs |
| **Legacy** | @supabase/* | ^0.6.1 | Retained for reference only |

### 1.4 Infrastructure

| Component | Technology |
|---|---|
| **Hosting** | Vercel |
| **Database Hosting** | NeonDB (AWS us-east-1) |
| **CI/CD** | Vercel Git Integration |
| **Version Control** | Git (GitHub) |

---

## 2. System Architecture Overview

### 2.1 High-Level Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                          BROWSER (Client)                                      │
│                                                                                │
│  ┌──────────────────────────────────────────────────────────────────┐        │
│  │              Next.js App (React 19 · TypeScript)                  │        │
│  │                                                                   │        │
│  │  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  ┌──────────┐  │        │
│  │  │ Auth Context │  │Journey Prov.│  │ SWR Hooks  │  │ UI Comp. │  │        │
│  │  │ (JWT token)  │  │(Vertical    │  │(Data Fetch)│  │(Card,    │  │        │
│  │  │              │  │ Isolation)  │  │            │  │ Table)   │  │        │
│  │  └──────┬───────┘  └──────┬──────┘  └─────┬──────┘  └──────────┘  │        │
│  └─────────┼─────────────────┼───────────────┼───────────────────────┘        │
└────────────┼─────────────────┼───────────────┼────────────────────────────────┘
             │                 │               │
             ▼                 ▼               ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                          NEXT.JS SERVER (Vercel Edge/Node)                     │
│                                                                                │
│  ┌─────────────────────────────────────────────────────────────────────┐      │
│  │                      MIDDLEWARE (proxy.ts)                           │      │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────────┐   │      │
│  │  │ JWT Verify   │  │ RBAC Check   │  │ Header Injection        │   │      │
│  │  │ (cookie:     │  │ (ROLE_ACCESS │  │ (x-user-id, x-user-role,│   │      │
│  │  │  ehms_token) │  │  map)        │  │  x-user-email)          │   │      │
│  │  └──────────────┘  └──────────────┘  └─────────────────────────┘   │      │
│  └─────────────────────────────────────────────────────────────────────┘      │
│                                    │                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐      │
│  │                      API ROUTE HANDLERS (100+ route.ts)              │      │
│  │                                                                       │      │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │      │
│  │  │ Auth     │ │Properties│ │Reservtn  │ │Housekeep │ │Maintnce  │  │      │
│  │  │ /api/auth│ │/api/prop │ │/api/resv │ │/api/hk   │ │/api/maint│  │      │
│  │  ├──────────┤ ├──────────┤ ├──────────┤ ├──────────┤ ├──────────┤  │      │
│  │  │ Finance  │ │ HRMS     │ │ Leases   │ │Workplace │ │Guests    │  │      │
│  │  │/api/fin  │ │ /api/hr  │ │/api/leas │ │/api/work │ │/api/guest│  │      │
│  │  ├──────────┤ ├──────────┤ ├──────────┤ ├──────────┤ ├──────────┤  │      │
│  │  │ Vendors  │ │Inventory │ │Admin     │ │Masters   │ │Settings  │  │      │
│  │  │/api/vend │ │/api/inv  │ │/api/admin│ │/api/mstr │ │/api/set  │  │      │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │      │
│  └─────────────────────────────────────────────────────────────────────┘      │
│                                    │                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐      │
│  │                    DATA ACCESS LAYER                                 │      │
│  │                                                                       │      │
│  │         getDb() — @neondatabase/serverless  (Singleton)              │      │
│  │         Raw SQL via tagged template literals                          │      │
│  │         Connection caching enabled (fetchConnectionCache = true)      │      │
│  └─────────────────────────────────────────────────────────────────────┘      │
│                                    │                                          │
└────────────────────────────────────┼──────────────────────────────────────────┘
                                     │
                                     ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                      DATA LAYER (NeonDB · PostgreSQL 16)                      │
│                                                                                │
│  ┌──────────────────────────────────────────────────────────────────────┐     │
│  │  ┌────────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐  │     │
│  │  │ Enterprise │ │ Users &  │ │ Guest    │ │ Bookings │ │ Units  │  │     │
│  │  │  Hierarchy │ │ Roles    │ │ Profiles │ │ & Reserv │ │ (Rooms/ │  │     │
│  │  │            │ │ (RBAC)   │ │ (CRM)    │ │ vations  │ │  Desks) │  │     │
│  │  └────────────┘ └──────────┘ └──────────┘ └──────────┘ └────────┘  │     │
│  │  ┌────────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐  │     │
│  │  │ Finance    │ │ Housekeep│ │Maintenanc│ │ HRMS &   │ │ Leases │  │     │
│  │  │ & Accnts   │ │ ing      │ │ e        │ │ Payroll  │ & Tenancy│  │     │
│  │  └────────────┘ └──────────┘ └──────────┘ └──────────┘ └────────┘  │     │
│  │                                                                      │     │
│  │  ~85+ tables across 22 SQL migrations + seed data                    │     │
│  │  Row-Level Security enabled on properties, units, bookings           │     │
│  └──────────────────────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Multi-Vertical Configuration Model

```
                         ┌──────────────────────┐
                         │   GLOBAL ENTERPRISE  │
                         │   (eHMS Platform)    │
                         └──────────┬───────────┘
                                    │
                         ┌──────────▼───────────┐
                         │       REGION         │
                         │   (India / APAC)     │
                         └──────────┬───────────┘
                                    │
                         ┌──────────▼───────────┐
                         │      PROPERTY        │
                         │                      │
                         │  Vertical Type:      │
                         │  ┌─────────────────┐ │
                         │  │ hotel           │ │
                         │  │ service_apt     │ │
                         │  │ rental_apt      │ │
                         │  │ workplace       │ │
                         │  └─────────────────┘ │
                         │                      │
                         │  Booking Model:      │
                         │  nightly | lease     │
                         │  membership | hourly │
                         └──────────┬───────────┘
                                    │
                  ┌─────────────────┼────────────────────┐
                  │                 │                    │
         ┌────────▼────────┐ ┌─────▼──────┐  ┌─────────▼────────┐
         │    BUILDING     │ │  BUILDING  │  │    BUILDING      │
         │  (Hotel Wing)   │ │ (Apt Tower)│  │ (Office Campus)  │
         └────────┬────────┘ └─────┬──────┘  └─────────┬────────┘
                  │                │                    │
         ┌────────▼────────┐ ┌─────▼──────┐             │
         │     FLOOR       │ │   FLOOR    │             │
         └────────┬────────┘ └─────┬──────┘             │
                  │                │                    │
         ┌────────▼────────┐ ┌─────▼──────┐  ┌─────────▼────────┐
         │  ROOM / UNIT    │ │  UNIT      │  │  DESK / SEAT /   │
         │  (Guest Room)   │ │ (Apartment)│  │  MEETING ROOM    │
         │  unit_type: room │ │ unit_type: │  │  unit_type: desk │
         │                 │ │ apartment  │  │  seat, cabin     │
         └─────────────────┘ └────────────┘  └──────────────────┘
```

### 2.3 Vertical Isolation Strategy

Each business vertical operates as a **strictly isolated context** within the same codebase, achieved through:

| Isolation Mechanism | Implementation |
|---|---|
| **Journey Context** | `JourneyProvider.tsx` — persists `activeJourney` in localStorage |
| **Sidebar Filtering** | `JOURNEY_ALLOWED_ITEMS` map filters nav items per vertical |
| **Property Scoping** | All queries filter by `property_id` + `vertical_type` |
| **URL Routing** | `/dashboard/{hotels|apartments|rental|workplace}` |
| **Authentication** | Login page has vertical selector — redirects to scoped dashboard |
| **RBAC Layers** | `ROLE_ACCESS[role_name]` + per-vertical nav filtering |

---

## 3. Technical Data Flow: UI → API → DB

### 3.1 Standard Read Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          READ DATA FLOW                                      │
│                                                                              │
│  Browser (React Component)                                                   │
│    │                                                                         │
│    │  const { data, isLoading } = useSWR('/api/reservations?status=active') │
│    │                                                                         │
│    ▼                                                                         │
│  SWR Hook (lib/hooks/index.ts)                                               │
│    │  const fetcher = (url) => fetch(url).then(r => r.json())               │
│    │  SWR caches, dedupes, revalidates every 15-30s                         │
│    │                                                                         │
│    ▼                                                                         │
│  Next.js API Route (app/api/reservations/route.ts)                          │
│    │                                                                         │
│    │  1. [OPTIONAL] Extract JWT from cookies, verify token                   │
│    │     const token = req.cookies.get("ehms_token")                         │
│    │     const user = verifyToken(token)                                     │
│    │                                                                         │
│    │  2. Extract query params from URL                                       │
│    │     const { searchParams } = new URL(req.url)                           │
│    │     const status = searchParams.get("status")                           │
│    │     const propertyId = searchParams.get("property_id")                  │
│    │                                                                         │
│    │  3. Build SQL query using tagged template                               │
│    │     const sql = getDb()                                                 │
│    │     const rows = await sql`SELECT * FROM bookings                       │
│    │       WHERE 1=1                                                         │
│    │       ${status ? sql`AND status = ${status}` : sql``}                  │
│    │       ORDER BY created_at DESC                                          │
│    │       LIMIT ${limit} OFFSET ${offset}`                                  │
│    │                                                                         │
│    │  4. Transform & return JSON                                             │
│    │     return NextResponse.json({ data: rows })                            │
│    │                                                                         │
│    ▼                                                                         │
│  NeonDB (PostgreSQL 16)                                                      │
│    │  Serverless SQL-over-HTTP                                               │
│    │  Connection caching (fetchConnectionCache = true)                      │
│    │                                                                         │
│    ▼                                                                         │
│  Response flows back:                                                        │
│    NeonDB → API Route → SWR Hook → React Component (re-render)              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Standard Write Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          WRITE DATA FLOW                                     │
│                                                                              │
│  Browser (React Component)                                                   │
│    │                                                                         │
│    │  const { trigger } = useSWRMutation('/api/leases', postFetcher)        │
│    │  await trigger({ property_id, unit_id, tenant_id, ... })               │
│    │                                                                         │
│    ▼                                                                         │
│  Mutation Hook (lib/hooks/mutations.ts)                                      │
│    │  POST fetcher with JSON body                                            │
│    │  Auto-invalidates related SWR caches on success                         │
│    │                                                                         │
│    ▼                                                                         │
│  Next.js API Route (app/api/leases/route.ts)                               │
│    │  export async function POST(req: NextRequest) {                         │
│    │                                                                         │
│    │  1. Validate authentication                                             │
│    │     const token = req.cookies.get("ehms_token")?.value                 │
│    │     const user = verifyToken(token)                                     │
│    │     if (!user) return NextResponse.json({error: "Unauthorized"}, 401)  │
│    │                                                                         │
│    │  2. Parse request body                                                  │
│    │     const body = await req.json()                                       │
│    │                                                                         │
│    │  3. Execute SQL INSERT (transaction for multi-step writes)            │
│    │     const sql = getDb()                                                 │
│    │     await sql`BEGIN` (implicit transaction via single query)            │
│    │     const result = await sql`INSERT INTO lease_agreements (...)         │
│    │       VALUES (...) RETURNING *`                                         │
│    │                                                                         │
│    │     [Optionally update dependent tables]                                │
│    │     await sql`UPDATE units SET status = 'occupied' WHERE id = ...`     │
│    │                                                                         │
│    │  4. Return created resource                                             │
│    │     return NextResponse.json({ data: result[0] }, { status: 201 })     │
│    │  }                                                                      │
│    │                                                                         │
│    ▼                                                                         │
│  NeonDB confirms write                                                       │
│    │                                                                         │
│    ▼                                                                         │
│  Response flows back:                                                        │
│    NeonDB → API Route (201) → Mutation Hook →                              │
│    ├── toast.success("Created")                                              │
│    └── SWR cache invalidation → pages re-render with fresh data             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Authentication Flow

#### Path A: Regular Tenant (SHARD) User

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION FLOW — REGULAR TENANT USER                      │
│                                                                                   │
│  Step 1: Tenant Selection                                                         │
│  ┌──────────┐    GET /api/admin/tenants    ┌──────────────┐                       │
│  │  /login  │ ──────────────────────────►  │ Fetch tenants │                      │
│  │          │    (no ?tenant= param)       │ from public   │                      │
│  │          │ ◄──────────────────────────  │ .tenants      │                      │
│  │          │   [org cards with verts]     └──────────────┘                       │
│  │          │                                                                     │
│  │  User picks org → URL: /login?tenant=VISWA                                     │
│  └──────────┘                                                                     │
│                                                                                   │
│  Step 2: Login                                                                    │
│  ┌──────────────────┐    POST /api/auth/login     ┌──────────────────┐            │
│  │  /login?tenant=  │ ──────────────────────────►  │   API Route      │            │
│  │  VISWA           │    {email, password,         │                  │            │
│  │  Login Form      │     tenant_code: "VISWA"}    └──────┬───────────┘            │
│  └──────────────────┘                                     │                        │
│                    ▲                            ┌─────────▼─────────┐              │
│                    │                            │  1. Resolve tenant │             │
│                    │                            │  SELECT code,      │             │
│                    │                            │  schema FROM       │             │
│                    │                            │  public.tenants    │             │
│                    │                            │  WHERE code = $1   │             │
│                    │                            └─────────┬─────────┘              │
│                    │                                      │                        │
│                    │                            ┌─────────▼─────────┐              │
│                    │                            │  2. Set search_path│             │
│                    │                            │  = viswa, public  │              │
│                    │                            └─────────┬─────────┘              │
│                    │                                      │                        │
│                    │                            ┌─────────▼─────────┐              │
│                    │                            │  3. Lookup user    │             │
│                    │                            │  SELECT * FROM     │             │
│                    │                            │  viswa.users       │             │
│                    │                            │  WHERE email = $1  │             │
│                    │                            └─────────┬─────────┘              │
│                    │                                      │                        │
│                    │                            ┌─────────▼─────────┐              │
│                    │                            │  4. bcrypt compare │             │
│                    │                            │  (password, hash)  │             │
│                    │                            └─────────┬─────────┘              │
│                    │                                      │                        │
│                    │                            ┌─────────▼─────────┐              │
│                    │                            │  5. Fetch role     │             │
│                    │                            │  JOIN user_roles   │             │
│                    │                            │  JOIN roles        │             │
│                    │                            └─────────┬─────────┘              │
│                    │                                      │                        │
│                    │                            ┌─────────▼─────────┐              │
│                    │                            │  6. Sign JWT       │             │
│                    │                            │  {user_id, email,  │             │
│                    │                            │   role_name,       │             │
│                    │                            │   role_id, fn,     │             │
│                    │                            │   ln, avatar,      │             │
│                    │                            │   tenant_code,     │             │
│                    │                            │   tenant_schema,   │             │
│                    │                            │   tenant_name,     │             │
│                    │                            │   tenant_verticals}│             │
│                    │                            │  expires: 7d       │             │
│                    │                            └─────────┬─────────┘              │
│                    │                                      │                        │
│                    │   Set-Cookie: ehms_token=<JWT>        │                        │
│                    │   httpOnly, secure, path=/,           │                        │
│                    │   sameSite=lax                        │                        │
│                    │                                      │                        │
│                    │                            ┌─────────▼─────────┐              │
│                    │                            │  7. Redirect to    │             │
│                    └────────────────────────────│  /dashboard/       │             │
│                                                 │  {vertical}        │             │
│                                                 └───────────────────┘              │
│                                                                                   │
│  Step 3: Every Subsequent Request                                                  │
│  ┌──────────┐  request with Cookie:   ┌────────────────┐                          │
│  │ Browser  │  ehms_token             │  Middleware     │                          │
│  │          │ ──────────────────────►  │  (proxy.ts)    │                          │
│  └──────────┘                          └───────┬────────┘                          │
│                                                │                                  │
│                                        ┌───────▼────────┐                         │
│                                        │ 1. Verify JWT   │                        │
│                                        │ 2. Check RBAC   │                        │
│                                        │    (ROLE_ACCESS │                        │
│                                        │     map)        │                        │
│                                        │ 3. Set headers: │                        │
│                                        │    x-user-id    │                        │
│                                        │    x-user-role  │                        │
│                                        │    x-user-email │                        │
│                                        │    x-tenant-    │                        │
│                                        │    schema       │                        │
│                                        │    x-tenant-    │                        │
│                                        │    code         │                        │
│                                        └───────┬────────┘                         │
│                                                │                                  │
│                                                ▼                                  │
│                                        ┌────────────────┐                         │
│                                        │ API Route or   │                         │
│                                        │ Page Request   │                         │
│                                        └────────────────┘                         │
└──────────────────────────────────────────────────────────────────────────────────┘
```

#### Path B: Platform Superadmin

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION FLOW — PLATFORM SUPERADMIN                       │
│                                                                                   │
│  Step 1: Platform Admin Login                                                     │
│  ┌──────────────────┐    POST /api/auth/platform-login  ┌──────────────────┐      │
│  │  /login           │ ───────────────────────────────►  │   API Route      │      │
│  │  Platform Modal   │    {email, password}              │                  │      │
│  └──────────────────┘                                    └──────┬───────────┘      │
│                    ▲                                     ┌───────▼───────────┐    │
│                    │                                     │  1. Lookup admin  │    │
│                    │                                     │  SELECT * FROM    │    │
│                    │                                     │  public.          │    │
│                    │                                     │  platform_admins  │    │
│                    │                                     │  WHERE email = $1 │    │
│                    │                                     └───────┬───────────┘    │
│                    │                                               │              │
│                    │                                     ┌───────▼───────────┐    │
│                    │                                     │  2. bcrypt compare│    │
│                    │                                     └───────┬───────────┘    │
│                    │                                               │              │
│                    │                                     ┌───────▼───────────┐    │
│                    │                                     │  3. Sign JWT       │    │
│                    │                                     │  {email,           │    │
│                    │                                     │   is_platform_     │    │
│                    │                                     │   admin: true,     │    │
│                    │                                     │   role: "platform_ │    │
│                    │                                     │   super_admin"}    │    │
│                    │                                     │  expires: 7d       │    │
│                    │                                     └───────┬───────────┘    │
│                    │                                               │              │
│                    │   Set-Cookie: ehms_token=<JWT>                 │              │
│                    │   httpOnly, secure, path=/,                    │              │
│                    │   sameSite=lax                                 │              │
│                    │                                               │              │
│                    │                                     ┌───────▼───────────┐    │
│                    │                                     │  4. Redirect to    │    │
│                    │                                     │  /dashboard/      │    │
│                    └─────────────────────────────────────│  admin/tenants    │    │
│                                                          └───────────────────┘    │
│                                                                                   │
│  Key differences from regular login:                                              │
│  - No tenant selection / tenant_code required                                     │
│  - Authenticates against public.platform_admins (not shard's users table)         │
│  - JWT has is_platform_admin: true, no tenant context fields                      │
│  - Redirects to /dashboard/admin/tenants (not /dashboard)                         │
│  - proxy.ts restricts platform admin to /dashboard/admin/* only                   │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Authentication & Authorization Architecture

### 4.1 JWT Token Structure

#### Regular Tenant User

```typescript
interface JwtPayload {
  user_id: string;          // UUID from shard's users table
  email: string;            // user@example.com
  role_name: string;        // super_admin, front_desk, etc.
  role_id: string;          // UUID from shard's roles table
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  tenant_code: string;      // "VISWA" — tenant short code
  tenant_schema: string;    // "viswa" — PostgreSQL schema name
  tenant_name: string;      // "Viswa Group of Estates"
  tenant_verticals: string[]; // ["hotels", "apartments", ...]
}
// Signed with HS256, expires 7 days
```

#### Platform Superadmin

```typescript
interface PlatformAdminJwtPayload {
  email: string;                  // admin@ehms.co
  is_platform_admin: true;        // distinguishes from shard users
  role: "platform_super_admin";   // fixed role
  // No tenant fields — operates at platform level
}
// Signed with HS256, expires 7 days
```

### 4.2 Role-Based Access Control (RBAC) Matrix

| Role | Dashboard | Front Desk | Hotels | Apts | Rental | Workplace | HK | Maint | Finance | HRMS | Admin | Vendors | Inventory |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| super_admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| executive | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| property_manager | ✅ | — | ✅ | ✅ | ✅ | ✅ | — | — | — | — | ✅ | ✅ | ✅ |
| front_desk | ✅ | ✅ | — | — | — | — | — | — | — | — | — | — | — |
| housekeeping_supervisor | ✅ | — | — | — | — | — | ✅ | — | — | — | — | — | — |
| housekeeping_staff | ✅ | — | — | — | — | — | ✅ | — | — | — | — | — | — |
| maintenance_staff | ✅ | — | — | — | — | — | — | ✅ | — | — | — | — | — |
| maintenance_supervisor | ✅ | — | — | — | — | — | — | ✅ | — | — | — | — | ✅ |
| hr_manager | ✅ | — | — | — | — | — | — | — | — | ✅ | — | — | — |
| hr_executive | ✅ | — | — | — | — | — | — | — | — | ✅ | — | — | — |
| finance_manager | ✅ | — | — | — | — | — | — | — | ✅ | — | — | ✅ | ✅ |
| finance_executive | ✅ | — | — | — | — | — | — | — | ✅ | — | — | — | — |
| security_staff | ✅ | — | — | — | — | ✅ | — | — | — | — | — | — | — |
| workplace_facility_mgr | ✅ | — | — | — | — | ✅ | — | — | — | — | — | — | — |
| vendor_user | ✅ | — | — | — | — | — | — | — | — | — | — | — | — |

### 4.3 Vertical-Based Navigation Filtering

Navigation items are filtered by BOTH role AND active journey:

```
JOURNEY_ALLOWED_ITEMS:
  all:      [all 52 nav items]
  hotels:   [hotel + ops + finance + hr + admin]
  apartments: [apt + ops + finance + hr + admin]  
  rental:   [rental + hk + maint + finance + hr + admin]
  workplace: [workplace + hk + maint + finance + hr + admin]
```

---

## 5. Hotel & Resort Management — Complete Module

### 5.1 Vertical Overview

**Vertical Type:** `hotel`  
**Booking Model:** `nightly`  
**Unit Types:** `room`, `suite`  
**Target Audience:** Star-rated hotels, boutique resorts, business hotels

### 5.2 Functional Workflow

```
                     HOTEL & RESORT MANAGEMENT - END-TO-END WORKFLOW

  ┌─────────────────────────────────────────────────────────────────────────────┐
  │                         BOOKING & RESERVATION                               │
  │                                                                             │
  │  OTA Channel (Booking.com/Expedia/Agoda)                                    │
  │    │                                                                        │
  │    ├── Direct Booking (via website/widget)                                  │
  │    ├── Walk-in (at front desk)                                              │
  │    └── Corporate Booking (via corporate account)                            │
  │         │                                                                   │
  │         ▼                                                                   │
  │    ┌─────────────────┐                                                      │
  │    │  Rate Plan       │  ← base_rate, dynamic pricing, seasonal rules       │
  │    │  Selector        │                                                     │
  │    └────────┬────────┘                                                      │
  │             │                                                               │
  │    ┌────────▼────────┐                                                      │
  │    │  Booking Created │  → status: confirmed, status: pending               │
  │    │  (bookings table)│  → inventory_calendar updated (blocked)             │
  │    └────────┬────────┘                                                      │
  └─────────────┼───────────────────────────────────────────────────────────────┘
                │
  ┌─────────────▼───────────────────────────────────────────────────────────────┐
  │                          PRE-ARRIVAL                                        │
  │                                                                             │
  │   24h before: Automated triggers                                            │
  │     ├── Guest communication (WhatsApp/Email)                                │
  │     ├── KYC reminder (ID proof upload)                                      │
  │     ├── Room preference collection                                          │
  │     └── Parking pre-booking                                                 │
  └─────────────────────────────────────────────────────────────────────────────┘
                │
  ┌─────────────▼───────────────────────────────────────────────────────────────┐
  │                          CHECK-IN (FRONT DESK)                              │
  │                                                                             │
  │   Front Desk Console:                                                       │
  │     ├── Visual Room Matrix (floor-wise grid)                                │
  │     ├── Select Unit → Click "Check-In"                                      │
  │     ├── Guest Verification (ID check)                                       │
  │     ├── Check-in Checklist (ID proof, parking, preferences)                 │
  │     │                                                                       │
  │     │  DB Operations (transactional):                                       │
  │     │  1. UPDATE bookings SET status = 'checked_in', checked_in_at = NOW()  │
  │     │  2. UPDATE units SET status = 'occupied'                              │
  │     │  3. INSERT checkin_checklists (if provided)                           │
  │     │  4. UPSERT parking_allocations (if vehicle)                           │
  │     │                                                                       │
  │     └── Room status changes to "Occupied"                                   │
  │         → Housekeeping queue notified (clean → occupied transition)         │
  │         → Maintenance records triggered                                     │
  │         → Billing folio created                                             │
  └─────────────────────────────────────────────────────────────────────────────┘
                │
  ┌─────────────▼───────────────────────────────────────────────────────────────┐
  │                           IN-STAY OPERATIONS                                │
  │                                                                             │
  │   ┌─────────────────────────────────────────────────────────────────────┐   │
  │   │  FRONT DESK          │  HOUSEKEEPING         │  MAINTENANCE        │   │
  │   │                                                                     │   │
  │   │  ● Guest Requests    │  ● Daily Cleaning     │  ● Ticket Creation  │   │
  │   │  ● Billing / Folio   │  ● Linen Change       │  ● Part Usage       │   │
  │   │  ● F&B Ordering      │  ● Room Inspection    │  ● Vendor Dispatch  │   │
  │   │  ● Room Transfer     │  ● VIP Protocols      │  ● AMC Check       │   │
  │   │  ● Extension/Late CO │  ● Deep Clean Sched   │  ● Preventive Maint │   │
  │   └─────────────────────────────────────────────────────────────────────┘   │
  └─────────────────────────────────────────────────────────────────────────────┘
                │
  ┌─────────────▼───────────────────────────────────────────────────────────────┐
  │                          CHECK-OUT                                          │
  │                                                                             │
  │   Front Desk Console:                                                       │
  │     ├── Select Occupied Unit → Click "Check-Out"                            │
  │     ├── Folio Review (charges, payments, balance)                           │
  │     ├── Settlement (cash/card/UPI/invoice)                                  │
  │     ├── Feedback Collection                                                 │
  │     │                                                                       │
  │     │  DB Operations (transactional):                                       │
  │     │  1. UPDATE bookings SET status = 'checked_out', checked_out_at=NOW()  │
  │     │  2. UPDATE units SET status = 'dirty'                                 │
  │     │  3. UPDATE invoices SET status = 'paid'                               │
  │     │  4. UPDATE parking_allocations SET status = 'released'                │
  │     │                                                                       │
  │     └── Room status: Occupied → Dirty                                       │
  │         → Housekeeping notified for cleaning                                │
  └─────────────────────────────────────────────────────────────────────────────┘
                │
  ┌─────────────▼───────────────────────────────────────────────────────────────┐
  │                          POST-STAY                                          │
  │                                                                             │
  │   Housekeeping cleans unit                                                  │
  │     ├── Room status: Dirty → Cleaning → Inspection → Vacant                 │
  │     │                                                                       │
  │     │  DB Operations:                                                       │
  │     │  ├── UPDATE housekeeping_tasks SET status = 'completed'               │
  │     │  ├── INSERT housekeeping_inspections (if inspection done)             │
  │     │  └── UPDATE units SET status = 'vacant'                               │
  │     │                                                                       │
  │     └── Unit available for next booking                                     │
  │                                                                             │
  │   Guest loyalty points updated                                              │
  │   Guest communication: Thank you + review link                              │
  └─────────────────────────────────────────────────────────────────────────────┘
```

### 5.3 Roles & Responsibilities (Hotel Vertical)

| Role | Responsibilities | Key Actions |
|---|---|---|
| **Front Desk** | Check-in/out, walk-in booking, room assignment, guest requests, billing | `useCheckIn()`, `useCheckOut()`, `useCreateReservation()`, `useCreateGuest()` |
| **Housekeeping Staff** | Room cleaning, linen change, amenity restocking | `useUpdateHousekeepingTask()` |
| **Housekeeping Supervisor** | Task allocation, quality inspection, linen audit, deep clean scheduling | `useCreateHousekeepingTask()`, inspection checklists |
| **Maintenance Staff** | Ticket resolution, preventive tasks, part replacement | Ticket CRUD, AMC lookup |
| **Maintenance Supervisor** | Work order approval, vendor coordination, asset management | Parts, AMC, approvals |
| **Property Manager** | Yield management, compliance, staff scheduling, escalation handling | Property config, compliance vault |
| **Finance Manager** | Invoice settlement, revenue reconciliation, tax filing | Ledger, receivables, GL |
| **HR Manager** | Staff attendance, shift planning, payroll | Employee, timesheet, leave |
| **Executive** | Portfolio analytics, P&L review, strategic decisions | Dashboard, finance reports |
| **Super Admin** | Global config, property onboarding, audit, user management | Admin module |

### 5.4 UI → API → DB Flow Example: Check-In Process

```
1. UI: Front Desk Agent clicks room card → "Check In" button
       ▼
2. Component: app/dashboard/front-desk/page.tsx
   const checkInMutation = useCheckIn()
   await checkInMutation.trigger({ bookingId, roomId, parkingSlot, ... })
       ▼
3. Mutation Hook: lib/hooks/mutations.ts
   export function useCheckIn() {
     return useSWRMutation('/api/dashboard/front-desk/checkin', postFetcher, {
       onSuccess: () => { mutate('/api/reservations'); mutate('/api/dashboard/front-desk/matrix'); }
     })
   }
       ▼
4. API Route: app/api/dashboard/front-desk/checkin/route.ts
   POST handler:
     - Verify JWT token from cookie
     - Parse body: { bookingId, roomId, parkingSlot, vehicleNumber, checklistItems }
     - Execute transactional SQL:
       a. UPDATE bookings SET status='checked_in', unit_id=$roomId WHERE id=$bookingId
       b. UPDATE units SET status='occupied' WHERE id=$roomId
       c. INSERT checkin_checklists (booking_id, checklist_items, verified_by)
       d. UPSERT parking_allocations
     - Return { success: true }
       ▼
5. DB Tables affected:
   bookings         → status changes to 'checked_in'
   units            → status changes to 'occupied'
   checkin_checklists → new row inserted
   parking_allocations → new allocation created
       ▼
6. Response → SWR cache invalidation → UI re-render:
   - Room Matrix updates (room shows occupied)
   - In-House list refreshes
   - Arrivals count decreases
```

### 5.5 Hotel-Specific API Routes

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/dashboard/hotels` | GET | Hotel property stats, occupancy, revenue, arrivals/departures |
| `/api/dashboard/front-desk/matrix` | GET | Room grid with statuses |
| `/api/dashboard/front-desk/checkin` | POST | Process check-in with transactional steps |
| `/api/dashboard/front-desk/billing` | GET/POST | Folio management |
| `/api/dashboard/front-desk/active-bookings` | GET | Currently checked-in bookings |
| `/api/dashboard/front-desk/requests` | GET/POST | Guest requests CRUD |
| `/api/dashboard/front-desk/feedbacks` | GET/POST | Guest feedback CRUD |
| `/api/reservations` | GET/POST | Booking engine (CRUD with pagination) |
| `/api/guests` | GET/POST | Guest profile management |
| `/api/dashboard/f-and-b/*` | GET/POST | F&B menu & orders |

### 5.6 Hotel DB Tables (Primary)

| Table | Key Columns | Usage |
|---|---|---|
| `properties` | id, name, vertical_type='hotel', star_rating, config | Property definition |
| `units` | id, floor_id, unit_type='room', unit_label, status, base_rate | Room inventory |
| `bookings` | id, property_id, unit_id, guest_id, status, check_in, check_out | Reservations |
| `rate_plans` | id, property_id, unit_type, base_rate, is_dynamic | Pricing rules |
| `guest_profiles` | id, first_name, last_name, email, phone, id_type, tags | Guest CRM |
| `inventory_calendar` | unit_id, date, status, rate, is_blocked | Availability |
| `guest_requests` | id, booking_id, request_type, status | Service requests |
| `guest_feedbacks` | id, booking_id, rating, comments | Post-stay feedback |
| `f_and_b_menu` | id, property_id, category, item_name, price | F&B offerings |
| `f_and_b_orders` | id, booking_id, order_type, status, total_amount | Room service |

---

## 6. Service Apartment Management — Complete Module

### 6.1 Vertical Overview

**Vertical Type:** `service_apartment`  
**Booking Model:** `nightly` (with extended-stay support)  
**Unit Types:** `suite`, `apartment`  
**Target Audience:** Corporate travelers, extended-stay guests, families

### 6.2 Functional Workflow

```
              SERVICE APARTMENT MANAGEMENT - END-TO-END WORKFLOW

  ┌─────────────────────────────────────────────────────────────────────────────┐
  │                     BOOKING & RESERVATION                                   │
  │                                                                             │
  │  Same booking engine as Hotels but with:                                   │
  │    ├── Extended-stay discounts (7+ nights, 30+ nights)                     │
  │    ├── Corporate account billing                                           │
  │    ├── Apartment-style unit selection (kitchen, living room)               │
  │    ├── Monthly maid service included in rate                               │
  │    └── Utilities (electricity, water, WiFi) assessed differently           │
  │         │                                                                  │
  │         ▼                                                                  │
  │    booking_model = 'nightly' (or 'lease' for long-term)                   │
  │    unit_type = 'suite' or 'apartment'                                     │
  └─────────────────────────────────────────────────────────────────────────────┘
                │
  ┌─────────────▼───────────────────────────────────────────────────────────────┐
  │                     GUEST EXPERIENCE                                        │
  │                                                                             │
  │  CHECK-IN (Similar to Hotel):                                              │
  │    ├── Unit handover with amenity briefing (kitchen appliances, WiFi)      │
  │    ├── Parking allocation (if applicable)                                  │
  │    └── Regular HK schedule setup (e.g., twice-weekly cleaning)            │
  │                                                                             │
  │  MID-STAY:                                                                 │
  │    ├── Scheduled housekeeping (not daily like hotels)                      │
  │    ├── Linen exchange (weekly, not daily)                                  │
  │    ├── Utility readings (if billed separately)                             │
  │    ├── Extended-stay rate renegotiation at thresholds                     │
  │    └── Guest requests (maintenance, supplies, F&B)                        │
  │                                                                             │
  │  CHECK-OUT (Similar to Hotel):                                             │
  │    ├── Unit inspection (inventory check: kitchen, appliances)              │
  │    ├── Utility bill settlement (if separate)                               │
  │    ├── Deposit refund (if collected)                                       │
  │    └── Feedback on apartment experience                                    │
  └─────────────────────────────────────────────────────────────────────────────┘
                │
  ┌─────────────▼───────────────────────────────────────────────────────────────┐
  │                     DOWNSTREAM OPERATIONS                                   │
  │                                                                             │
  │  Housekeeping:                                                             │
  │    ├── Less frequent but deeper cleaning                                   │
  │    ├── Full kitchen & bathroom sanitation                                  │
  │    ├── Linen swap (weekly batches)                                         │
  │    └── Deep-cleaning rotation for long-stay units                          │
  │                                                                             │
  │  Maintenance:                                                              │
  │    ├── Same ticket system as hotels                                        │
  │    ├── Priority for kitchen appliances (fridge, stove, microwave)          │
  │    └── AMC for HVAC, geyser, washing machine                               │
  │                                                                             │
  │  Billing:                                                                  │
  │    ├── Room charges (nightly rate × nights)                                │
  │    ├── Utility charges (meter reading based)                               │
  │    ├── Service charges (extra cleaning, F&B)                               │
  │    └── Corporate invoice (if booked via corporate account)                 │
  └─────────────────────────────────────────────────────────────────────────────┘
```

### 6.3 Roles & Responsibilities (Service Apt Vertical)

Same role structure as Hotels, with additional focus on:

| Role | Specific Responsibilities |
|---|---|
| **Front Desk** | Extended-stay check-in, utility billing, weekly HK scheduling |
| **Housekeeping** | Bi-weekly deep cleaning, kitchen sanitation, linen exchange |
| **Maintenance** | Appliance-focused repairs (fridge, AC, washing machine, microwave) |
| **Finance** | Split billing (room + utilities), corporate account invoices |

### 6.4 Service Apartment SQL Tables

Same hotel tables (`units`, `bookings`, `guest_profiles`, `housekeeping_tasks`, `maintenance_tickets`) with `property_id` linking to properties where `vertical_type = 'service_apartment'`.

Additional considerations in schema:
- `units.layout_type` — studio, 1BHK, 2BHK, 3BHK
- `units.attributes` — JSONB for kitchen type, furnishing level, appliance list
- `bookings.check_in / check_out` — can span weeks or months
- `bookings.booking_model = 'nightly'`

---

## 7. Apartment Leasing & Rent Services — Complete Module

### 7.1 Vertical Overview

**Vertical Type:** `rental_apartment`  
**Booking Model:** `lease`  
**Unit Types:** `apartment`  
**Target Audience:** Long-term residential tenants

### 7.2 Complete Lease Lifecycle Workflow

```
           APARTMENT LEASING & RENT - COMPLETE TENANT LIFECYCLE

  ┌─────────────────────────────────────────────────────────────────────────────┐
  │                    PRE-LEASE (PROSPECTING)                                  │
  │                                                                             │
  │  1. Unit Discovery                                                         │
  │     ├── Vacant unit listing (filter by layout, price, location)           │
  │     ├── Virtual tour / photos                                               │
  │     └── Rent comparison (similar units)                                    │
  │                                                                             │
  │  2. Application & KYC                                                      │
  │     ├── Tenant profile creation (guest_profiles table)                     │
  │     ├── KYC documents upload (ID proof, employment letter)                 │
  │     ├── Income verification                                                 │
  │     └── Background check (if applicable)                                   │
  └─────────────────────────────────────────────────────────────────────────────┘
                │
  ┌─────────────▼───────────────────────────────────────────────────────────────┐
  │                      LEASE CREATION                                         │
  │                                                                             │
  │  3. Lease Agreement Generation                                             │
  │     ├── INSERT lease_agreements:                                           │
  │     │     property_id (→ rental property)                                  │
  │     │     unit_id (→ apartment unit)                                       │
  │     │     tenant_id (→ guest_profile)                                      │
  │     │     agreement_ref (auto-generated, e.g., 'L-2026-001')               │
  │     │     status = 'drafted'                                               │
  │     │     start_date, end_date                                             │
  │     │     rent_amount (monthly)                                            │
  │     │     security_deposit                                                 │
  │     │     lock_in_period_months                                            │
  │     │     notice_period_days (default 30)                                  │
  │     │     escalation_percent, escalation_frequency_months                  │
  │     │     furnishing_inventory (JSONB)                                     │
  │     │                                                                       │
  │     ├── INSERT deposit_ledger (security deposit received)                  │
  │     ├── UPDATE units SET status = 'reserved'                               │
  │     └── Generate lease document (PDF) for e-signature                     │
  │                                                                             │
  │  4. Lease States:                                                          │
  │     drafted → signed → active → renewal_due → renewed / terminated         │
  └─────────────────────────────────────────────────────────────────────────────┘
                │
  ┌─────────────▼───────────────────────────────────────────────────────────────┐
  │                      ACTIVE LEASE (TENANCY)                                │
  │                                                                             │
  │  5. Move-In                                                                 │
  │     ├── Unit inspection (move_out_checklist items, photos)                 │
  │     ├── Keys handover                                                        │
  │     ├── Utilities transfer (electricity, water, gas)                       │
  │     ├── Gate pass / parking registration                                   │
  │     ├── UPDATE units SET status = 'occupied'                               │
  │     └── Lease status remains 'active'                                      │
  │                                                                             │
  │  6. Monthly Rent Collection                                                │
  │     ├── Auto-generate rent_invoice:                                        │
  │     │     period_start, period_end                                         │
  │     │     rent_amount (from lease)                                         │
  │     │     maintenance_charges (if any)                                     │
  │     │     late_fee (if applicable)                                         │
  │     │     total_amount = rent + maint + late_fee                           │
  │     │     due_date = 5th of month                                          │
  │     │     status = 'draft' → 'sent'                                        │
  │     │                                                                       │
  │     ├── Payment processing:                                                 │
  │     │     UPDATE rent_invoices SET paid_amount, paid_at, status='paid'     │
  │     │     → Links to finance module (journal entry created)                │
  │     │                                                                       │
  │     ├── Late payment handling:                                              │
  │     │     IF payment > due_date:                                           │
  │     │       late_fee = rent_amount × 0.02 (2% per month)                   │
  │     │       Notification sent to tenant                                    │
  │                                                                             │
  │  7. Rent Escalation (if applicable)                                        │
  │     ├── At escalation_frequency_months interval:                           │
  │     │     new_rent = rent_amount × (1 + escalation_percent/100)            │
  │     │     INSERT lease_amendments (amendment_type='rent_escalation')       │
  │     │     UPDATE lease_agreements SET rent_amount = new_rent               │
  │                                                                             │
  │  8. During Tenancy:                                                        │
  │     ├── Maintenance requests (same engine as hotels)                       │
  │     ├── Housekeeping requests (optional, paid service)                     │
  │     ├── Rent receipts (downloadable)                                       │
  │     └── Tenant communication (message center)                              │
  └─────────────────────────────────────────────────────────────────────────────┘
                │
  ┌─────────────▼───────────────────────────────────────────────────────────────┐
  │                      RENEWAL / TERMINATION                                  │
  │                                                                             │
  │  9. Renewal Notice Period                                                  │
  │     ├── Notifications at: T-90, T-60, T-30 days before end_date           │
  │     ├── Lease status: 'active' → 'renewal_due'                             │
  │     ├── Renewal options:                                                   │
  │     │   ├── Same terms → extend lease                                      │
  │     │   ├── New terms → create lease_amendments                            │
  │     │   └── Decline → move-out process                                     │
  │     │                                                                       │
  │     └── On renewal:                                                        │
  │           INSERT lease_amendments (amendment_type='term_extension')        │
  │           UPDATE lease_agreements SET status='renewed', end_date=new_end   │
  │                                                                             │
  │  10. Move-Out Process                                                      │
  │      ├── Notice period: tenant gives notice (INSERT notice in system)      │
  │      ├── Notice period tracked in NOTICE_PERIOD_TRACKING                   │
  │      ├── Move-out inspection:                                              │
  │      │     INSERT move_out_checklist items: condition, photos              │
  │      │     Damages assessed → deductions from deposit                      │
  │      ├── Final utility bills settlement                                    │
  │      ├── Security deposit settlement:                                      │
  │      │     INSERT deposit_ledger (deduction / refund)                      │
  │      │     Process payment (refund)                                        │
  │      ├── UPDATE lease_agreements SET status = 'terminated'                 │
  │      ├── UPDATE units SET status = 'vacant'                                │
  │      └── Unit available for next tenant                                    │
  └─────────────────────────────────────────────────────────────────────────────┘
```

### 7.3 Roles & Responsibilities (Rental Vertical)

| Role | Responsibilities | Key Actions |
|---|---|---|
| **Property Manager** | Lease creation, renewals, rent escalation, deposit management | `useCreateLease()`, lease dashboard |
| **Finance Manager** | Rent collection tracking, late fee application, deposit ledger, refunds | Rent roll, deposit ledger |
| **Maintenance Staff** | Apartment repairs (plumbing, electrical, appliance) | Ticket system |
| **Housekeeping** | Deep-clean between tenancies, paid cleaning services | HK tasks, inspections |
| **HR Manager** | Staff across rental properties (attendance, payroll) | Employee management |
| **Tenant (via portal)** | View lease, pay rent, raise requests, renew notice | Future: tenant mobile app |
| **Executive** | Portfolio performance, occupancy trends, revenue forecast | Rental dashboard |

### 7.4 UI → API → DB Flow Example: Create Lease

```
1. UI: Property Manager clicks "New Lease" → fills form → submits
       ▼
2. Component: app/dashboard/rental/page.tsx
   const createLease = useCreateLease()
   await createLease({
     property_id, unit_id, tenant_id,
     start_date, end_date,
     rent_amount, security_deposit,
     notice_period_days: 30
   })
       ▼
3. Mutation Hook: lib/hooks/mutations.ts
   export function useCreateLease() {
     return useSWRMutation('/api/leases', postFetcher, {
       onSuccess: () => { mutate('/api/leases') }
     })
   }
       ▼
4. API Route: app/api/leases/route.ts
   POST handler:
     - Parse body
     - SQL: INSERT INTO lease_agreements (...) VALUES (...) RETURNING *
     - SQL: UPDATE units SET status='occupied' WHERE id=$unitId
     - SQL: INSERT INTO deposit_ledger (transaction_type='deposit_received')
     - Return 201 with agreement_ref
       ▼
5. DB Tables affected:
   lease_agreements   → new row (status: 'active')
   units              → status→'occupied'
   deposit_ledger     → deposit record
       ▼
6. Response → SWR invalidation → UI re-render with new lease
```

### 7.5 Rental-Specific API Routes

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/leases` | GET | List lease agreements with filters (status, property) |
| `/api/leases` | POST | Create new lease (transactional) |
| `/api/leases/[id]` | GET/PUT | Single lease detail & update |

### 7.6 Rental DB Tables (Primary)

| Table | Key Columns | Usage |
|---|---|---|
| `lease_agreements` | id, property_id, unit_id, tenant_id, agreement_ref, status, start_date, end_date, rent_amount, security_deposit, escalation_percent, notice_period_days, furnishing_inventory | Core lease data |
| `lease_amendments` | id, lease_id, amendment_type, prev_value, new_value, effective_date | Rent changes, extensions |
| `rent_invoices` | id, lease_id, invoice_number, period_start, period_end, rent_amount, maintenance_charges, late_fee, total_amount, paid_amount, status | Monthly billing |
| `deposit_ledger` | id, lease_id, transaction_type, amount, description | Security deposit tracking |
| `move_out_checklist` | id, lease_id, item, condition, photo_url, is_verified | Move-out inspection |

---

## 8. Workplace & Managed Office Management — Complete Module

### 8.1 Vertical Overview

**Vertical Type:** `workplace`  
**Booking Model:** `membership` or `hourly`  
**Unit Types:** `desk`, `seat`, `meeting_room`, `cabin`  
**Target Audience:** Startups, remote workers, corporate teams, enterprises

### 8.2 Functional Workflow

```
           WORKPLACE & MANAGED OFFICE - COMPLETE WORKFLOW

  ┌─────────────────────────────────────────────────────────────────────────────┐
  │                      MEMBERSHIP ONBOARDING                                  │
  │                                                                             │
  │  1. Corporate Account Creation                                              │
  │     ├── Register company (corporate_accounts table)                         │
  │     ├── Select Membership Plan:                                            │
  │     │   ├── Hot Desk Pool (x seats, hot-desking)                           │
  │     │   ├── Dedicated Seats (fixed desks)                                  │
  │     │   ├── Private Cabin (lockable office)                                │
  │     │   └── Virtual Office (mailing address + meeting credits)             │
  │     │                                                                       │
  │     ├── Billing: monthly / quarterly / yearly                              │
  │     ├── INSERT corporate_memberships (seat_allocated, status='active')     │
  │     └── Member users added (guest_profiles with tags)                      │
  └─────────────────────────────────────────────────────────────────────────────┘
                │
  ┌─────────────▼───────────────────────────────────────────────────────────────┐
  │                      DAILY OPERATIONS                                       │
  │                                                                             │
  │  2. Desk / Room Booking                                                    │
  │     ├── Member logs in                                                      │
  │     ├── Views Interactive Floor Plan                                       │
  │     │     Grid of desks (D-01 to D-N), Cabins (C-01), Meeting Rooms (MR)  │
  │     │     Color-coded: Available (green), Occupied (blue), Booked (yellow) │
  │     │                                                                       │
  │     ├── Selects space → Confirms                                           │
  │     ├── INSERT workplace_bookings:                                         │
  │     │     property_id, unit_id, member_id                                  │
  │     │     booking_type: hot_desk / dedicated_seat / private_cabin /        │
  │     │                   meeting_room                                        │
  │     │     start_time, end_time                                              │
  │     │     status: 'confirmed' → 'checked_in'                               │
  │     │     is_recurring (optional), recurring_pattern (weekly/daily)        │
  │     │                                                                       │
  │     ├── Calendar sync (Outlook/Google via calendar_event_id)               │
  │     └── UPDATE corporate_memberships SET seat_used = seat_used + 1         │
  │                                                                             │
  │  3. Access Control                                                         │
  │     ├── Digital credential issued (QR code / NFC)                          │
  │     ├── Integration with turnstile / smart lock systems                     │
  │     └── Visitor management:                                                │
  │           ├── Pre-registration (INSERT visitor_logs)                       │
  │           ├── Check-in (QR scan)                                           │
  │           ├── Badge printing (optional)                                    │
  │           └── Auto-expire at end of visit                                  │
  │                                                                             │
  │  4. Amenities & Services                                                   │
  │     ├── Meeting room booking (with AV equipment)                           │
  │     ├── Pantry / Coffee (included or metered)                              │
  │     ├── IT support (WiFi, printing)                                        │
  │     └── Mail handling (for virtual office members)                         │
  └─────────────────────────────────────────────────────────────────────────────┘
                │
  ┌─────────────▼───────────────────────────────────────────────────────────────┐
  │                      BILLING & REPORTING                                    │
  │                                                                             │
  │  5. Membership Invoicing                                                    │
  │     ├── Auto-generate membership_invoice:                                  │
  │     │     membership_id, period_start, period_end                          │
  │     │     base_amount (plan price)                                          │
  │     │     overage_amount (usage beyond seat pool)                          │
  │     │     total_amount = base + overage                                    │
  │     │     status: 'draft' → 'sent' → 'paid'                                │
  │     │                                                                       │
  │     ├── Overage calculation:                                                │
  │     │     IF seat_used > seat_allocated:                                   │
  │     │       overage = (seat_used - seat_allocated) × per_seat_rate         │
  │     │                                                                       │
  │     └── Links to finance module (GL account credited)                      │
  │                                                                             │
  │  6. Workplace Analytics                                                    │
  │     ├── Seat utilization percentage                                         │
  │     ├── Peak usage hours / days                                             │
  │     ├── Meeting room booking frequency                                      │
  │     ├── Monthly revenue per property                                        │
  │     └── Visitor stats (frequency, peak times)                              │
  └─────────────────────────────────────────────────────────────────────────────┘
                │
  ┌─────────────▼───────────────────────────────────────────────────────────────┐
  │                      FACILITY MANAGEMENT                                    │
  │                                                                             │
  │  7. Helpdesk (shared with Hotel maintenance engine)                        │
  │     ├── IT support tickets                                                  │
  │     ├── Facility maintenance (AC, lighting, plumbing)                      │
  │     └── SLA tracking per ticket priority                                   │
  │                                                                             │
  │  8. Housekeeping                                                            │
  │     ├── Daily desk sanitization                                             │
  │     ├── Meeting room cleaning between bookings                              │
  │     ├── Cabin cleaning (weekly)                                             │
  │     └── Linen (if nap/bed pods available)                                  │
  └─────────────────────────────────────────────────────────────────────────────┘
```

### 8.3 Roles & Responsibilities (Workplace Vertical)

| Role | Responsibilities | Key Actions |
|---|---|---|
| **Workplace Facility Manager** | Seat utilization, membership billing, access control, visitor management, SLAs | Facility dashboard |
| **Security Staff** | Visitor check-in/out, badge issuance, access monitoring | `useVisitors()`, visitor log |
| **Front Desk (Workplace)** | Meeting room bookings, helpdesk, member inquiries | Booking management |
| **Finance Manager** | Membership invoicing, overage billing, revenue reporting | Finance module |
| **Maintenance Staff** | Facility repairs (shared engine) | Ticket system |
| **Housekeeping** | Desk sanitization, meeting room cleaning | HK tasks |

### 8.4 UI → API → DB Flow Example: Seat Booking

```
1. UI: Member clicks desk on floor plan → confirms booking
       ▼
2. Component: app/dashboard/workplace/page.tsx
   const { trigger } = useSWRMutation('/api/workplace/bookings', postFetcher)
   await trigger({ unit_id, member_id, start_time, end_time, booking_type: 'hot_desk' })
       ▼
3. API Route: app/api/workplace/bookings/route.ts
   POST handler:
     - INSERT INTO workplace_bookings (...) VALUES (...)
     - UPDATE corporate_memberships SET seat_used = seat_used + 1
     - Return { data: booking }
       ▼
4. DB Tables affected:
   workplace_bookings     → new booking (status: 'confirmed')
   corporate_memberships  → seat_used incremented
       ▼
5. Response → Floor plan refreshes → Desk shows "Booked" (yellow)
```

### 8.5 Workplace-Specific API Routes

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/workplace/bookings` | GET/POST | Desk/room bookings |
| `/api/workplace/memberships` | GET | Corporate memberships list |

### 8.6 Workplace DB Tables (Primary)

| Table | Key Columns | Usage |
|---|---|---|
| `workplace_bookings` | id, property_id, unit_id, member_id, corporate_id, booking_type, start_time, end_time, status, is_recurring | Desk/room reservations |
| `membership_plans` | id, property_id, name, plan_type, billing_cycle, price, seat_pool, amenities | Plan definitions |
| `corporate_memberships` | id, corporate_id, plan_id, start_date, seat_allocated, seat_used, status | Active memberships |
| `membership_invoices` | id, membership_id, period_start, period_end, base_amount, overage_amount, status | Billing |
| `visitor_logs` | id, property_id, visitor_name, host_employee_id, check_in, check_out, badge_issued | Visitor management |

---

## 9. Cross-Cutting Operational Modules

### 9.1 Front Desk (Shared Across Hotels & Service Apartments)

**Page:** `/dashboard/front-desk/`  
**Components:** CheckInModal, WalkInModal, FolioModal, LogRequestModal, OffersCard, ChannelPartnersCard  
**APIs:** `/api/dashboard/front-desk/*` (checkin, billing, requests, feedbacks, matrix, offers, channels)  
**Hooks:** `useReservations()`, `useRoomMatrix()`, `useActiveBookings()`, `useGuests()`  
**Mutations:** `useCheckIn()`, `useCheckOut()`, `useCreateReservation()`, `useCreateGuest()`

### 9.2 Housekeeping (Shared Across All Verticals)

**Page:** `/dashboard/housekeeping/` (tasks, linen, inspections, staff)  
**APIs:** `/api/housekeeping/*` (CRUD, checklists, inspections, linen, stats)  
**Key Tables:** `housekeeping_tasks`, `housekeeping_checklists`, `housekeeping_inspections`, `linen_batches`, `linen_items`

### 9.3 Maintenance (Shared Across All Verticals)

**Page:** `/dashboard/maintenance/` (tickets, parts, assets)  
**APIs:** `/api/maintenance/*` (CRUD, preventive, amc, approvals, ticket-parts, time-entries, stats)  
**Key Tables:** `maintenance_tickets`, `asset_register`, `amc_contracts`, `preventive_schedules`, `parts_inventory`, `maintenance_ticket_parts`, `maintenance_time_entries`, `maintenance_approvals`

### 9.4 Finance & Accounts (Shared, Per-Property Scoped)

**Pages (11):** Accounts, Journal, Ledger, Receivables, Payables, Budget, Tax, Fixed Assets, Reports, Settings  
**APIs (20+):** `/api/finance/*` (accounts, journal-entries, ledger, vendor-bills, bill-payments, budget, fixed-assets, depreciation, tax-filings, cost-centers, fiscal-years, reports/*)  
**Hooks (20):** `useAccounts()`, `useJournalEntries()`, `useLedger()`, `useVendorBills()`, `useBudget()`, `useFixedAssets()`, `useTaxFilings()`, `useTrialBalance()`, `useProfitLoss()`, `useBalanceSheet()`  
**Mutations (15):** `useCreateAccount()`, `useCreateJournalEntry()`, `usePostJournalEntry()`, `useCreateVendorBill()`, `useApproveVendorBill()`, `useCreateBillPayment()`, `useCreateFixedAsset()`, `useRecordDepreciation()`, `useCreateTaxFiling()`, `useFileTaxReturn()`, `useCreateBudgetHead()`, `useCreateBudgetEntry()`, `useCreateFiscalYear()`, `useCreateCostCenter()`

### 9.5 HRMS (Shared, Per-Property Scoped)

**Pages (12):** Employees, Timesheet, Leave, Payroll, Compliance, Shifts, Settings, Masters, Policies, Appraisal, Compensation  
**APIs (20+):** `/api/hr/*` (employees, departments, shifts, timesheets, leaves, payroll, compliance, holidays, overtime-policies, attendance-policies, document-types, policy-documents, appraisal-cycles, appraisal-goals, appraisal-reviews, increments, promotions)  
**Key Tables:** `employees`, `departments`, `attendance_records`, `leave_types`, `leave_requests`, `leave_balances`, `timesheets`, `payroll_runs`, `payroll_lines`, `shift_rotations`, `appraisal_cycles`, `appraisal_goals`, `appraisal_reviews`, `increments`, `employee_promotions`, `holiday_calendar`, `overtime_policies`, `attendance_policies`

### 9.6 Vendors (Shared, Per-Property Scoped)

**Page:** `/dashboard/vendors/`  
**APIs:** `/api/vendors/*` (CRUD, services, orders)  
**Key Tables:** `vendors`, `vendor_services`, `purchase_orders`, `purchase_order_lines`, `goods_received_notes`, `grn_lines`

### 9.7 Inventory (Shared, Per-Property Scoped)

**Page:** `/dashboard/inventory/` (items, transactions)  
**APIs:** `/api/inventory/*` (categories, items, warehouses, transactions, stats)  
**Key Tables:** `inventory_categories`, `inventory_items`, `warehouses`, `inventory_transactions`

### 9.8 Property Configuration (Per-Property)

**Pages (2):** Property Detail (`/dashboard/admin/properties/[id]`), Properties (extended)  
**APIs:** `POST/PUT /api/properties` — accepts `config` payload; `PUT /api/properties/[id]` — partial config merge  
**Hooks:** `usePropertyFeatures(propertyId)`, `useUpdatePropertyConfig()`

### 9.9 Admin (Global)

**Pages (7):** Overview, Roles, Audit, Backup, Properties, Users, Masters  
**APIs:** `/api/admin/*` (users, compliance, roles, sessions, backup, audit-events)  
**Hooks (8):** `useAdminUsers()`, `useAdminUser()`, `useAdminRoles()`, `useAdminSessions()`, `useAdminBackups()`, `useAdminAuditEvents()`, `useProperty()`, `useProperties()`

---

## 10. Database Schema Map

### 10.1 Complete Table Inventory (23 Migrations, ~85+ Tables)

| Migration # | File | Key Tables | Domain |
|---|---|---|---|
| 001 | `001_core_schema.sql` | enterprises, regions, properties, buildings, floors, units, asset_register, compliance_records | Core Hierarchy |
| 002 | `002_rbac_identity.sql` | roles, users, user_roles, audit_logs | Identity & Access |
| 003 | `003_guest_crm.sql` | guest_profiles, corporate_accounts, corporate_members, guest_communications | Guest CRM |
| 004 | `004_reservation_booking.sql` | rate_plans, bookings, booking_guests, inventory_calendar, channel_sync_log | Reservations |
| 005 | `005_finance_gl.sql` | chart_of_accounts, journal_entries, journal_lines, invoices, invoice_lines, payments, bank_reconciliation | Finance GL |
| 006 | `006_housekeeping.sql` | housekeeping_tasks, housekeeping_checklists, linen_batches, linen_transactions | Housekeeping |
| 007 | `007_maintenance_asset.sql` | maintenance_tickets, amc_contracts, preventive_schedules, parts_inventory | Maintenance |
| 008 | `008_vendor_procurement.sql` | vendors, vendor_services, purchase_orders, purchase_order_lines, goods_received_notes, grn_lines | Vendors |
| 009 | `009_hrms_payroll.sql` | departments, employees, attendance_records, payroll_runs, payroll_lines, shift_rotations | HRMS |
| 010 | `010_lease_tenancy.sql` | lease_agreements, lease_amendments, rent_invoices, deposit_ledger, move_out_checklist | Leases |
| 011 | `011_workplace.sql` | workplace_bookings, membership_plans, corporate_memberships, membership_invoices, visitor_logs | Workplace |
| 012 | `012_notification.sql` | notification_templates, notification_queue, payment_gateway_config, ota_channel_config, hardware_devices | Notifications |
| 013 | `013_master_data.sql` | room_categories, facilities, services, channel_partners, promotions, materials, designations, employee_bands, salary_structures | Masters |
| 014 | `014-f-and-b.sql` | meal_plans, f_and_b_menu, f_and_b_orders, f_and_b_order_items | F&B |
| 015 | `015-guest-feedback.sql` | guest_feedbacks | Feedback |
| 016 | `016_system_settings.sql` | system_settings | Settings |
| 017 | `017_hrms_extensions.sql` | leave_types, leave_balances, leave_requests, timesheets | HR Extensions |
| 018 | `018_masters_policies.sql` | holidays, overtime_policies, attendance_policies, document_types, policy_documents, tax_slabs, payment_modes, booking_sources, id_proof_types, asset_categories, uom, countries, states, cities, appraisal_cycles, appraisal_goals, appraisal_reviews, increments, employee_promotions | Extended Masters |
| 019 | `019_hk_maint_workflows.sql` | linen_items, housekeeping_inspections, maintenance_ticket_parts, maintenance_time_entries, maintenance_approvals | HK/Maint WFs |
| 020 | `020_admin_module.sql` | user_sessions, login_attempts, system_backups, system_audit_events, admin_notifications | Admin Module |
| 021 | `021_accounts_module.sql` | fiscal_years, cost_centers, vendor_bills, bill_line_items, bill_payments, budget_heads, budget_entries, fixed_assets, depreciation_schedule, tax_filings | Accounts Module |
| 022 | `022_inventory_module.sql` | inventory_categories, warehouses, inventory_items, inventory_transactions | Inventory Module |
| 025 | `025_property_config_features.sql` | (Documents `properties.config` JSONB schema — no new tables) | Property Config |

### 10.2 Entity Relationship (Core Tables)

```
enterprises (1) ──→ (N) regions (1) ──→ (N) properties (1)
                                                          │
                                    ┌─────────────────────┼────────────────────┐
                                    │                     │                    │
                              buildings             lease_agreements    membership_plans
                                    │                     │                    │
                              floors                 rent_invoices     corporate_memberships
                                    │                     │                    │
                              units                deposit_ledger     workplace_bookings
                               │ │ │                     │                    │
                    ┌──────────┘ │ └──────────┐     move_out_checklist  visitor_logs
                    │            │            │
            inventory_calendar  bookings   asset_register
                    │            │
               (availability)    │
                          ┌──────┼──────┐
                          │      │      │
                   booking_guests  housekeeping_tasks  maintenance_tickets
                          │      │      │
                   guest_profiles   checkins  maintenance_ticket_parts
                          │                   maintenance_time_entries
                   corporate_accounts         maintenance_approvals
                   guest_communications
                   guest_requests
                   guest_feedbacks
```

---

## 11. Property Configuration & Feature Toggles

### 11.1 Overview

Per-property feature configuration system that toggles optional modules (restaurant, bar, gym, spa, etc.) on/off at the property level. Uses the existing `properties.config` JSONB column.

### 11.2 Config Schema

```json
{
  "features": {
    "rooms_map":     { "enabled": true,  "label": "Rooms Map" },
    "rate_card":     { "enabled": true,  "label": "Rate Card" },
    "restaurant":    { "enabled": false, "label": "Restaurant" },
    "bar":           { "enabled": false, "label": "Bar" },
    "laundry":       { "enabled": true,  "label": "Laundry" },
    "maintenance":   { "enabled": true,  "label": "Maintenance" },
    "gym":           { "enabled": false, "label": "Gym" },
    "yoga":          { "enabled": false, "label": "Yoga" },
    "swimming_pool": { "enabled": false, "label": "Swimming Pool" },
    "spa":           { "enabled": false, "label": "Spa" }
  },
  "settings": { "timezone": "Asia/Kolkata", "currency": "INR" }
}
```

### 11.3 Database

| Migration | Purpose |
|-----------|---------|
| `025_property_config_features.sql` | Documents the `properties.config` JSONB schema; no new tables |

### 11.4 API Endpoints

| Endpoint | Change | Details |
|----------|--------|---------|
| `POST /api/properties` | Extended | Accepts optional `config` payload; auto-applies default features |
| `PUT /api/properties/[id]` | Extended | Supports partial config merge via JSONB `\|\|` operator |
| `GET /api/properties` | Rewritten | Changed from tagged template literals to `sql.query()` to fix driver issue |

### 11.5 UI Pages

| Page | Path | Features |
|------|------|----------|
| **Property Detail** | `/dashboard/admin/properties/[id]` | Two tabs: **Overview** (property details, buildings, feature status sidebar) + **Configuration** (10 grouped feature toggles with save/reset) |
| **Properties** (extended) | `/dashboard/admin/properties` | Collapsible "Configure Feature Settings" section in Add/Edit modal; Settings icon navigates to detail page |

### 11.6 Hooks

| Hook | Returns | Purpose |
|------|---------|---------|
| `usePropertyFeatures(propertyId)` | `{ features, isFeatureEnabled(key), isLoading }` | Any module can conditionally render UI based on feature state |
| `useUpdatePropertyConfig()` | mutation | Update config without touching other property fields |

### 11.7 Architecture

- **Storage**: Existing `properties.config` JSONB column (was unused before)
- **Migration**: Applied via `scripts/apply-025.mjs`
- **Workflow Integration**: `isFeatureEnabled("restaurant")` pattern for conditional rendering
- **Build**: Zero type errors, 149 static routes

---

## 12. Architecture Diagrams

### 11.1 Full System Architecture (Text Diagram)

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                                        BROWSER                                                │
│                                                                                                │
│   ┌────────────────────────────────────────────────────────────────────────────────────┐     │
│   │                           Next.js Application (React 19)                             │     │
│   │                                                                                      │     │
│   │  ┌──────────────────────┐  ┌───────────────────┐  ┌────────────────────────────┐   │     │
│   │  │   AuthProvider        │  │  JourneyProvider   │  │  SettingsProvider          │   │     │
│   │  │  (auth-context.tsx)   │  │  (Vertical Context)│  │  (Global Config)          │   │     │
│   │  └──────────┬───────────┘  └────────┬──────────┘  └─────────────┬──────────────┘   │     │
│   │             │                       │                           │                   │     │
│   │  ┌──────────▼───────────────────────▼───────────────────────────▼────────────────┐  │     │
│   │  │                          Dashboard Layout                                       │  │     │
│   │  │  ┌──────────────────────────────────────────────────────────────────────────┐ │  │     │
│   │  │  │  Sidebar (collapsible)  │  Header (profile, search, notifications)       │ │  │     │
│   │  │  │  ┌────────────────────┐ │  ┌──────────────────────────────────────────┐  │ │  │     │
│   │  │  │  │ Logo               │ │  │  Workspace Badge │ Search │ 🔔 │ 👤 │   │  │ │     │
│   │  │  │  │────────────────────│ │  └──────────────────────────────────────────┘  │ │  │     │
│   │  │  │  │ Nav Items          │ │  ┌──────────────────────────────────────────┐  │ │  │     │
│   │  │  │  │ (Role+Journey      │ │  │  Main Content Area                        │  │ │  │     │
│   │  │  │  │  filtered, 52      │ │  │  ┌────────────────────────────────────┐  │  │ │     │
│   │  │  │  │  items)            │ │  │  │  Page Components                    │  │  │ │     │
│   │  │  │  │────────────────────│ │  │  │  ● Card / Badge / Button / Table   │  │  │ │     │
│   │  │  │  │ User Email Footer  │ │  │  │  ● Modals (CheckIn, WalkIn, Folio) │  │  │ │     │
│   │  │  └────────────────────┘ │ │  │  └────────────────────────────────────┘  │  │ │     │
│   │  │  └──────────────────────────────────────────────────────────────────────────┘ │  │     │
│   │  └───────────────────────────────────────────────────────────────────────────────┘  │     │
│   │                                                                                      │     │
│   │  ┌──────────────────────────────────────────────────────────────────────────────┐   │     │
│   │  │                         SWR Data Fetching Layer                                │   │     │
│   │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │   │     │
│   │  │  │ useSWR   │ │ useSWR   │ │ useSWR   │ │ Mutations│ │ Auto-refresh     │   │   │     │
│   │  │  │ (GET)    │ │ (GET)    │ │ (GET)    │ │ (POST/   │ │ (15-30s interval │   │   │     │
│   │  │  │          │ │          │ │          │ │  PUT/    │ │  for live data)  │   │   │     │
│   │  │  │          │ │          │ │          │ │  DELETE) │ │                  │   │   │     │
│   │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │   │     │
│   └──────────────────────────────────────────────────────────────────────────────┘   │     │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          │ HTTP/HTTPS (fetch)
                                          │ Cookie: ehms_token (httpOnly)
                                          ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                                      NEXT.JS SERVER                                           │
│                                                                                                │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────┐ │
│  │  MIDDLEWARE (proxy.ts)                                                                   │ │
│  │  ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────────────────┐   │ │
│  │  │ Path Matching      │  │ JWT Verification   │  │ RBAC Route Protection          │   │ │
│  │  │ (excludes _next/,  │  │ verifyToken(cookie) │  │ hasAccess(role, pathname)      │   │ │
│  │  │  favicon, static)  │  │                    │  │ ROLE_ACCESS[role_name]          │   │ │
│  │  └────────────────────┘  └────────────────────┘  └────────────────────────────────┘   │ │
│  │                                                                                          │ │
│  │  ┌─────────────────────────────────────────────────────────────────────────────────┐   │ │
│  │  │  Request Header Injection                                                        │   │ │
│  │  │  x-user-id, x-user-email, x-user-role  →  Available in API Route Handlers       │   │ │
│  │  └─────────────────────────────────────────────────────────────────────────────────┘   │ │
│  └─────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                          │                                                    │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────┐ │
│  │  API ROUTE HANDLERS (app/api/**/route.ts)                                                │ │
│  │                                                                                          │ │
│  │  ┌────────┬────────┬────────┬────────┬────────┬────────┬────────┬────────┬────────┐   │ │
│  │  │ auth   │ admin  │ fin    │ hr     │ hk     │ maint  │ vend   │ inv    │ prop   │   │ │
│  │  ├────────┼────────┼────────┼────────┼────────┼────────┼────────┼────────┼────────┤   │ │
│  │  │ login  │ users  │ accnts │ emp    │ task   │ ticket │ vend   │ categ  │ proper │   │ │
│  │  │ logout │ roles  │ jrnl   │ dept   │ check  │ asset  │ serv   │ items  │ unit   │   │ │
│  │  │ me     │ backup │ ledger │ timesh │ linen  │ amc    │ orders │ whse   │ floor  │   │ │
│  │  │ signup │ audit  │ vbills │ leave  │ inspec │ parts  │ services│trans  │ bldg  │   │ │
│  │  │        │ sess   │ budget │ payrl  │ stats  │ pre    │        │ stats  │        │   │ │
│  │  │        │        │ fa     │ compl  │        │ approv │        │        │        │   │ │
│  │  │        │        │ tax    │ appr   │        │        │        │        │        │   │ │
│  │  └────────┴────────┴────────┴────────┴────────┴────────┴────────┴────────┴────────┘   │ │
│  │                                                                                          │ │
│  │  ┌────────┬────────┬────────┬────────┬────────┬────────┬────────┬────────┬────────┐   │ │
│  │  │ reserv │ guests │ lease  │ workpl │ dashb  │ master │ sett   │ f&b    │ visitor│   │ │
│  │  ├────────┼────────┼────────┼────────┼────────┼────────┼────────┼────────┼────────┤   │ │
│  │  │ GET    │ GET    │ GET    │ book   │ hotels │ tax    │ system │ menu   │ GET    │   │ │
│  │  │ POST   │ POST   │ POST   │ memb   │ apts   │ pay    │        │ orders │ POST   │   │ │
│  │  │ PUT    │ PUT    │ PUT    │        │ stats  │ rate   │        │        │        │   │ │
│  │  └────────┴────────┴────────┴────────┴────────┴────────┴────────┴────────┴────────┘   │ │
│  └─────────────────────────────────────────────────────────────────────────────────────────┘ │
│                                          │                                                    │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────┐ │
│  │  DATA ACCESS LAYER (lib/db.ts)                                                           │ │
│  │                                                                                          │ │
│  │  getDb() → neon(DATABASE_URL)  (Singleton, connection cache enabled)                    │ │
│  │  SQL via Tagged Template Literals:  await sql`SELECT * FROM table WHERE id = ${id}`     │ │
│  │  No ORM — Direct SQL for performance and control                                         │ │
│  │  Transactions via single SQL string or sequential queries                                │ │
│  └─────────────────────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    NEONDB (PostgreSQL 16)                                     │
│                                                                                                │
│  ┌─────────────────────────────────────────────────────────────────────────────────────────┐ │
│  │  Serverless Postgres — SQL-over-HTTP with connection pooling                              │ │
│  │                                                                                          │ │
│  │  ┌──────────────────────────────────────────────────────────────────────────────────┐   │ │
│  │  │  SCHEMAS (by domain)                                                               │   │ │
│  │  │                                                                                    │   │ │
│  │  │  enterprise        │  Tables: enterprises, regions                                 │   │ │
│  │  │  property_mgmt     │  Tables: properties, buildings, floors, units, amenities      │   │ │
│  │  │  identity          │  Tables: users, roles, user_roles, user_sessions              │   │ │
│  │  │  guest_crm         │  Tables: guest_profiles, corporate_accounts, corp_members     │   │ │
│  │  │  reservations      │  Tables: bookings, booking_guests, rate_plans, inv_calendar   │   │ │
│  │  │  housekeeping      │  Tables: hk_tasks, hk_checklists, linen, inspections          │   │ │
│  │  │  maintenance       │  Tables: maint_tickets, assets, amc, preventive, parts        │   │ │
│  │  │  finance           │  Tables: coa, journal_entries, journal_lines, invoices, pays  │   │ │
│  │  │  vendors           │  Tables: vendors, vendor_services, pos, grns                  │   │ │
│  │  │  hrms              │  Tables: employees, depts, attendance, leaves, payroll, appr  │   │ │
│  │  │  leases            │  Tables: lease_agreements, rent_invoices, deposit_ledger      │   │ │
│  │  │  workplace         │  Tables: workplace_bookings, memberships, visitor_logs        │   │ │
│  │  │  admin             │  Tables: audit_logs, backup_jobs, admin_notifications         │   │ │
│  │  │  inventory         │  Tables: inv_categories, inv_items, warehouses, transactions  │   │ │
│  │  └──────────────────────────────────────────────────────────────────────────────────┘   │ │
│  │                                                                                          │ │
│  │  Row-Level Security on: properties, units, bookings                                      │ │
│  │  ENUMS: vertical_type, unit_type, booking_model, booking_status, room_status,            │ │
│  │         lease_status, ticket_priority, ticket_status, invoice_status                     │ │
│  └─────────────────────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 11.2 Technical Architecture Diagram (Component/Hook level)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND COMPONENT ARCHITECTURE                    │
│                                                                           │
│  app/layout.tsx (Root)                                                   │
│  ├── SettingsProvider (global config)                                     │
│  ├── JourneyProvider (vertical context)                                   │
│  └── {children}                                                           │
│       │                                                                   │
│       └── app/page.tsx (Login)                                           │
│            ├── Vertical Selector                                          │
│            ├── Email/Password Form                                        │
│            └── Demo User Autofill                                         │
│                                                                           │
│  app/dashboard/layout.tsx                                                │
│  └── AuthProvider (user context)                                          │
│       ├── Sidebar (collapsible, role+journey filtered)                    │
│       ├── Header (profile, search, notifications)                         │
│       ├── MobileNav (5-item bottom nav for mobile)                        │
│       └── {children} (page content)                                       │
│                                                                           │
│  Vertical Pages:                                                          │
│  ├── /dashboard/hotels → useHotelStats() → /api/dashboard/hotels         │
│  ├── /dashboard/apartments → useApartmentStats() → /api/dashboard/apartments│
│  ├── /dashboard/rental → useLeases() → /api/leases                        │
│  ├── /dashboard/workplace → useMemberships() → /api/workplace/memberships│
│  ├── /dashboard/front-desk → useReservations() + useRoomMatrix()         │
│  ├── /dashboard/front-desk/check-ins → useReservations({status})         │
│  └── (all other pages) → specific SWR hooks                              │
│                                                                           │
│  Shared Components:                                                       │
│  ├── Card, CardHeader (components/ui/card.tsx)                            │
│  ├── Badge (components/ui/badge.tsx)                                      │
│  ├── Button (components/ui/button.tsx)                                    │
│  ├── Table (components/ui/table.tsx)                                      │
│  ├── CheckInModal, WalkInModal, FolioModal, LogRequestModal              │
│  └── OffersCard, ChannelPartnersCard                                      │
└──────────────────────────────────────────────────────────────────────────┘
```

### 11.3 Auth & Session Flow Diagram

```
┌──────────┐     POST /api/auth/login      ┌──────────────┐
│  LOGIN   │ ──── {email, password} ──────►│  verifyUser  │
│  PAGE    │                                │  (bcrypt)    │
└──────────┘                                └──────┬───────┘
     ▲                                              │
     │                                              ▼
     │                                    ┌──────────────────┐
     │                                    │  sign JWT        │
     │                                    │  (7-day expiry)  │
     │                                    └────────┬─────────┘
     │                                             │
     │   Set-Cookie: ehms_token=<JWT>              │
     │   httpOnly, secure, path=/, sameSite=lax    │
     │                                             │
     │   Redirect to /dashboard/{vertical}         │
     └─────────────────────────────────────────────┘

  ┌────────────────┐   Every Request    ┌─────────────────┐
  │  BROWSER       │ ─────────────────►│  proxy.ts       │
  │  Cookie:       │                    │  (Middleware)   │
  │  ehms_token    │◄──────────────────│                 │
  └────────────────┘   Response         └────────┬────────┘
                                                 │
                                    ┌────────────▼───────────┐
                                    │  verifyToken(cookie)    │
                                    │  → JwtPayload | null    │
                                    └────────────┬───────────┘
                                                 │
                                    ┌────────────▼───────────┐
                                    │  isPublic(pathname)?    │
                                    │  │                      │
                                    │  ├── True → bypass     │
                                    │  └── False → check auth│
                                    └────────────┬───────────┘
                                                 │
                                    ┌────────────▼───────────┐
                                    │  RBAC Check            │
                                    │  ROLE_ACCESS[role]      │
                                    │  .some(p => pathname   │
                                    │    startsWith(p))      │
                                    └────────────┬───────────┘
                                                 │
                                    ┌────────────▼───────────┐
                                    │  Set Headers:          │
                                    │  x-user-id             │
                                    │  x-user-email          │
                                    │  x-user-role           │
                                    └────────────┬───────────┘
                                                 │
                                    ┌────────────▼───────────┐
                                    │  NextResponse.next()   │
                                    │  → Route Handler       │
                                    └────────────────────────┘
```

---

## 13. API Endpoint Reference

### 12.1 Complete API Endpoint Inventory

| Category | Endpoint | Methods | Description |
|---|---|---|---|
| **Auth** | `/api/auth/login` | POST | Email/password authentication, returns JWT cookie |
| | `/api/auth/logout` | POST | Clears JWT cookie |
| | `/api/auth/me` | GET | Returns current user profile from JWT |
| | `/api/auth/signup` | POST | New user registration |
| **Dashboard** | `/api/dashboard/stats` | GET | Global executive dashboard stats |
| | `/api/dashboard/hotels` | GET | Hotel vertical stats & performance |
| | `/api/dashboard/apartments` | GET | Service apartment stats |
| | `/api/dashboard/front-desk/matrix` | GET | Room grid with statuses |
| | `/api/dashboard/front-desk/checkin` | POST | Check-in (transactional) |
| | `/api/dashboard/front-desk/active-bookings` | GET | Active checked-in bookings |
| | `/api/dashboard/front-desk/billing` | GET/POST | Folio/billing operations |
| | `/api/dashboard/front-desk/requests` | GET/POST | Guest request management |
| | `/api/dashboard/front-desk/feedbacks` | GET/POST | Guest feedback management |
| | `/api/dashboard/front-desk/channels` | GET | Channel partners list |
| | `/api/dashboard/front-desk/offers` | GET | Active promotions/offers |
| | `/api/dashboard/masters/[category]` | GET | Masters by category |
| | `/api/dashboard/f-and-b/menu` | GET | F&B menu items |
| | `/api/dashboard/f-and-b/orders` | GET/POST | F&B order management |
| **Reservations** | `/api/reservations` | GET/POST | Booking CRUD with pagination |
| | `/api/reservations/[id]` | GET/PUT | Single booking operations |
| **Guests** | `/api/guests` | GET/POST | Guest profile CRUD |
| | `/api/guests/[id]` | GET/PUT | Single guest operations |
| **Properties** | `/api/properties` | GET/POST | List all properties (rewritten with sql.query()) + create with optional config |
| | `/api/properties/[id]` | GET/PUT | Single property operations + partial config merge via JSONB `\|\|` |
| **Leases** | `/api/leases` | GET/POST | Lease agreement CRUD |
| **Housekeeping** | `/api/housekeeping` | GET/POST | HK task CRUD |
| | `/api/housekeeping/[id]` | GET/PUT | Single HK task |
| | `/api/housekeeping/checklists` | GET/POST | HK checklists |
| | `/api/housekeeping/inspections` | GET/POST | HK inspections |
| | `/api/housekeeping/linen/batches` | GET/POST | Linen batch management |
| | `/api/housekeeping/linen/items` | GET/POST | Individual linen items |
| | `/api/housekeeping/linen/transactions` | GET/POST | Lien movement tracking |
| | `/api/housekeeping/stats` | GET | Housekeeping statistics |
| **Maintenance** | `/api/maintenance` | GET | Maintenance ticket list |
| | `/api/maintenance/tickets` | GET/POST | Ticket CRUD |
| | `/api/maintenance/tickets/[id]` | GET/PUT | Single ticket operations |
| | `/api/maintenance/assets` | GET | Asset register |
| | `/api/maintenance/preventive` | GET | Preventive schedules |
| | `/api/maintenance/amc` | GET | AMC contracts |
| | `/api/maintenance/approvals` | GET/POST | Maintenance approvals |
| | `/api/maintenance/ticket-parts` | GET/POST | Parts used on tickets |
| | `/api/maintenance/time-entries` | GET/POST | Technician time tracking |
| | `/api/maintenance/inventory` | GET | Parts inventory |
| | `/api/maintenance/vendors` | GET | Maintenance vendors |
| | `/api/maintenance/stats` | GET | Maintenance statistics |
| | `/api/maintenance/feedback-triage` | GET | Feedback triage list |
| **HRMS** | `/api/hr/employees` | GET/POST | Employee CRUD |
| | `/api/hr/employees/[id]` | GET/PUT | Single employee |
| | `/api/hr/departments` | GET | Department list |
| | `/api/hr/shifts` | GET/POST | Shift management |
| | `/api/hr/timesheets` | GET/POST | Timesheet records |
| | `/api/hr/timesheets/[id]` | GET/PUT | Single timesheet |
| | `/api/hr/leaves` | GET/POST | Leave requests |
| | `/api/hr/leaves/[id]` | GET/PUT | Single leave request |
| | `/api/hr/payroll` | GET/POST | Payroll runs |
| | `/api/hr/payroll/[id]` | GET/PUT | Single payroll run |
| | `/api/hr/compliance` | GET | Compliance records |
| | `/api/hr/holidays` | GET | Holiday calendar |
| | `/api/hr/overtime-policies` | GET | OT policies |
| | `/api/hr/attendance-policies` | GET | Attendance policies |
| | `/api/hr/document-types` | GET | Document types |
| | `/api/hr/policy-documents` | GET | Policy documents |
| | `/api/hr/appraisal-cycles` | GET/POST | Appraisal cycles |
| | `/api/hr/appraisal-goals` | GET/POST | Appraisal goals |
| | `/api/hr/appraisal-reviews` | GET/POST | Appraisal reviews |
| | `/api/hr/increments` | GET/POST | Salary increments |
| | `/api/hr/promotions` | GET/POST | Employee promotions |
| **Finance** | `/api/finance` | GET | Finance dashboard overview |
| | `/api/finance/accounts` | GET/POST | Chart of accounts |
| | `/api/finance/accounts/[id]` | GET/PUT | Single account |
| | `/api/finance/journal-entries` | GET/POST | Journal entries |
| | `/api/finance/journal-entries/[id]` | GET/PUT | Single journal entry |
| | `/api/finance/ledger` | GET | General ledger |
| | `/api/finance/vendor-bills` | GET/POST | Vendor bills |
| | `/api/finance/vendor-bills/[id]` | GET/PUT | Single vendor bill |
| | `/api/finance/bill-payments` | GET/POST | Bill payments |
| | `/api/finance/budget` | GET/POST | Budget management |
| | `/api/finance/budget/heads` | GET/POST | Budget heads |
| | `/api/finance/fixed-assets` | GET/POST | Fixed assets |
| | `/api/finance/fixed-assets/[id]` | GET/PUT | Single fixed asset |
| | `/api/finance/depreciation` | GET/POST | Depreciation records |
| | `/api/finance/tax-filings` | GET/POST | Tax filings |
| | `/api/finance/tax-filings/[id]` | GET/PUT | Single tax filing |
| | `/api/finance/cost-centers` | GET/POST | Cost centers |
| | `/api/finance/fiscal-years` | GET/POST | Fiscal years |
| | `/api/finance/reports/trial-balance` | GET | Trial balance report |
| | `/api/finance/reports/profit-loss` | GET | P&L statement |
| | `/api/finance/reports/balance-sheet` | GET | Balance sheet |
| **Vendors** | `/api/vendors` | GET/POST | Vendor CRUD |
| | `/api/vendors/[id]` | GET/PUT | Single vendor |
| | `/api/vendors/services` | GET | Vendor services |
| | `/api/vendors/orders` | GET/POST | Purchase orders |
| **Inventory** | `/api/inventory/categories` | GET/POST | Inventory categories |
| | `/api/inventory/items` | GET/POST | Inventory items |
| | `/api/inventory/items/[id]` | GET/PUT | Single inventory item |
| | `/api/inventory/warehouses` | GET/POST | Warehouse management |
| | `/api/inventory/transactions` | GET/POST | Inventory transactions |
| | `/api/inventory/stats` | GET | Inventory statistics |
| **Workplace** | `/api/workplace/bookings` | GET/POST | Desk/room bookings |
| | `/api/workplace/memberships` | GET | Corporate memberships |
| **Admin** | `/api/admin/users` | GET/POST | Admin user management |
| | `/api/admin/users/[id]` | GET/PUT/DELETE | Single admin user |
| | `/api/admin/roles` | GET | Role management |
| | `/api/admin/sessions` | GET | Active user sessions |
| | `/api/admin/backup` | GET/POST | Backup jobs |
| | `/api/admin/audit-events` | GET | Audit trail |
| | `/api/admin/audit-logs` | GET | Audit logs |
| | `/api/admin/compliance` | GET/POST | Compliance records |
| | `/api/admin/compliance/[id]` | GET/PUT | Single compliance record |
| **Other** | `/api/visitors` | GET/POST | Workplace visitor logs |
| | `/api/invoices/folio` | GET/POST | Folio-based invoicing |
| | `/api/settings` | GET/PUT | System settings |
| | `/api/masters/*` | GET | Master data (tax-slabs, payment-modes, etc.) |

---

## Appendix: Key Architectural Decisions

| Decision | Rationale |
|---|---|
| **Raw SQL over ORM** | NeonDB serverless driver is SQL-over-HTTP; raw SQL gives maximum control, 0 overhead, and easy optimization |
| **SWR over React Query** | Lighter weight, auto-revalidation, mutation support, built-in cache deduplication |
| **JWT in httpOnly cookie** | Prevents XSS token theft, automatically sent with requests, works with SSR |
| **No middleware.ts** | Consolidated into `proxy.ts` to avoid Next.js middleware limitations with serverless |
| **Single Repo** | All 4 verticals share the same codebase → consistent UX, shared components, unified API |
| **Property-based Scoping** | No separate DB per vertical; `property_id` + `vertical_type` filter ensures isolation |
| **JourneyProvider** | Client-side vertical context without URL complexity; persists in localStorage |
| **No ORM Migrations** | Raw SQL migrations in numbered sequence; full control over schema evolution |

---

---

## 14. Test Users & User Journeys by Workspace

This section defines **sample test users** for each vertical workspace, with complete **user journey walkthroughs** that test end-to-end business flows. All passwords use the common demo password: **`Demo@1234`**

### 14.1 Common/Shared System Demo Users (Pre-Seeded)

These 8 demo users exist in the database seed data and can access any vertical:

| Test User | Email | Role | Vertical Access | Key Purpose |
|---|---|---|---|---|
| **Super Admin** | `superadmin@ehms.demo` | super_admin | all | Global system config, audit, user mgmt, backup |
| **Executive** | `executive@ehms.demo` | executive | all | Cross-vertical P&L, portfolio analytics, approvals |
| **Property Manager** | `admin@ehms.demo` | property_manager | hotels, apartments, rental, workplace | Property setup, compliance, staff oversight |
| **Front Desk Agent** | `frontdesk@ehms.demo` | front_desk | hotels, apartments, workplace | Check-in/out, walk-in booking, folio |
| **Housekeeping Staff** | `housekeeping@ehms.demo` | housekeeping_staff | hotels, apartments, rental, workplace | Task completion, status updates |
| **Maintenance Staff** | `maintenance@ehms.demo` | maintenance_staff | hotels, apartments, rental, workplace | Ticket resolution, parts usage |
| **HR Manager** | `hr@ehms.demo` | hr_manager | all (per-property) | Employee records, payroll run, leave mgmt |
| **Finance Manager** | `finance@ehms.demo` | finance_manager | all (per-property) | GL, invoices, vendor bills, budget |

---

### 14.2 Vertical: Hotels & Resorts — Test Users & Journeys

#### 14.2.1 Hotel-Specific Test Users

| Test User | Email | Role | Property Context | Purpose |
|---|---|---|---|---|
| **Rajesh (Front Desk Sup.)** | `frontdesk.ovh@ehms.demo` | front_desk | Oceanview Grand Hotel | Check-in/out, walk-in, room assignment |
| **Lakshmi (HK Staff)** | `housekeeping.ovh@ehms.demo` | housekeeping_staff | Oceanview Grand Hotel | Room cleaning, amenity restock |
| **Meena (HK Supervisor)** | `hksupervisor.ovh@ehms.demo` | housekeeping_supervisor | Oceanview Grand Hotel | Inspections, task allocation, linen audit |
| **Arun (Maint Staff)** | `maintenance.ovh@ehms.demo` | maintenance_staff | Oceanview Grand Hotel | Ticket fixes, preventive rounds |
| **Suresh (Maint Sup.)** | `maintenancesup.ovh@ehms.demo` | maintenance_supervisor | Oceanview Grand Hotel | Approvals, AMC, parts inventory |
| **Priya (Property Mgr)** | `manager.ovh@ehms.demo` | property_manager | Oceanview Grand Hotel | Yield mgmt, compliance, staff oversight |
| **Ananya (Finance)** | `finance.ovh@ehms.demo` | finance_manager | Oceanview Grand Hotel | Hotel revenue, invoices, settlement |
| **Vikram (HR)** | `hr.ovh@ehms.demo` | hr_manager | Oceanview Grand Hotel | Hotel staff attendance, shifts, payroll |
| **Guest: John Smith** | `john.smith@guest.demo` | guest | Oceanview Grand Hotel | Pre-arrival, check-in, stay, check-out |

#### 14.2.2 Hotel User Journey 1: Full Guest Cycle (Booking → Check-In → Stay → Check-Out)

```
JOURNEY: Hotel Full Guest Cycle
PRIMARY ACTORS: Front Desk Agent (Rajesh), Guest (John Smith)
SUPPORTING: Housekeeping (Lakshmi), Maintenance (Arun), Finance (Ananya)

STEP 1: PRE-ARRIVAL (Guest perspective — via future mobile portal)
  └── Guest books room via OTA (Booking.com) → DB: INSERT bookings (status: confirmed)
  └── Pre-arrival email/WhatsApp sent 24h prior

STEP 2: CHECK-IN (Front Desk Console)
  └── Login as: frontdesk.ovh@ehms.demo / Demo@1234
  └── Navigate to: /dashboard/front-desk
  └── Visual Room Matrix shows floor grid (Floor 1 / 2 / 3)
  └── Click vacant room → "Check In" button
  └── Verify guest ID → Fill checklist items (ID proof, parking, preferences)
  └── Submit → DB operations:
       ├── UPDATE bookings SET status='checked_in', checked_in_at=NOW()
       ├── UPDATE units SET status='occupied'
       ├── INSERT checkin_checklists
       └── INSERT parking_allocations (if vehicle)
  └── Verify: Room card turns to "Occupied" (blue), In-House count increments

STEP 3: IN-STAY GUEST REQUEST
  └── Login as: john.smith@guest.demo (via portal)
  └── Submit request: "Extra towels needed" → DB: INSERT guest_requests
  └── Or Front Desk logs request on guest's behalf
  └── Request visible in: /dashboard/front-desk/requests

STEP 4: HOUSEKEEPING TRIGGER
  └── Login as: housekeeping.ovh@ehms.demo / Demo@1234
  └── Navigate to: /dashboard/housekeeping/tasks
  └── View assigned tasks → Click task → Update status to "in_progress"
  └── Perform cleaning → Mark as "completed"
  └── Verify: Dashboard shows updated progress

STEP 5: F&B ORDER (Room Service)
  └── Login as: frontdesk.ovh@ehms.demo
  └── Navigate to: /dashboard/front-desk/f-and-b
  └── Select menu item → Create order for guest's room
  └── DB: INSERT f_and_b_orders + f_and_b_order_items
  └── Order status: pending → preparing → delivered

STEP 6: MAINTENANCE TICKET (if guest reports issue)
  └── Login as: maintenance.ovh@ehms.demo / Demo@1234
  └── Navigate to: /dashboard/maintenance/tickets
  └── Create ticket: "AC not cooling in Room 102" (priority: high)
  └── DB: INSERT maintenance_tickets (status: open, priority: high)
  └── Ticket assigned → status: assigned → in_progress → resolved
  └── Parts used logged: INSERT maintenance_ticket_parts
  └── Time tracked: INSERT maintenance_time_entries

STEP 7: CHECK-OUT + BILL SETTLEMENT
  └── Login as: frontdesk.ovh@ehms.demo
  └── Click occupied room → "Check Out"
  └── Preview folio (room charges + F&B + services)
  └── Process payment (cash/card/UPI)
  └── Collect feedback (rating 1-5)
  └── Submit → DB operations:
       ├── UPDATE bookings SET status='checked_out', checked_out_at=NOW()
       ├── UPDATE units SET status='dirty'
       ├── UPDATE invoices SET status='paid'
       └── INSERT guest_feedbacks
  └── Verify: Room turns "Dirty" (yellow), Departure list updated

STEP 8: POST-STAY CLEANING (Housekeeping)
  └── Login as: housekeeping.ovh@ehms.demo
  └── Task appears: "Clean Room 102 (Check-out)"
  └── Clean → Mark completed → Unit status: dirty → cleaning → inspection → vacant
  └── Supervisor inspects: INSERT housekeeping_inspections (score, checklist)
  └── Unit available for next booking

TEST ASSERTIONS:
  ├── bookings.status transitions: confirmed → checked_in → checked_out
  ├── units.status transitions: vacant → occupied → dirty → cleaning → vacant
  ├── Total revenue reflects in /dashboard/finance
  ├── Housekeeping stats update in /dashboard/housekeeping
  └── Feedback appears in /dashboard/front-desk/feedbacks
```

#### 14.2.3 Hotel User Journey 2: Housekeeping Linen & Inspection Workflow

```
JOURNEY: Hotel Housekeeping Linen & Quality Control
PRIMARY ACTORS: HK Supervisor (Meena), HK Staff (Lakshmi)

STEP 1: LINEN BATCH MANAGEMENT
  └── Login as: hksupervisor.ovh@ehms.demo / Demo@1234
  └── Navigate to: /dashboard/housekeeping/linen
  └── View linen batches (sheets, towels, pillowcases)
  └── Create new batch → Assign RFID tags → INSERT linen_batches + linen_items
  └── Dispatch soiled linen to laundry → INSERT linen_transactions (type: 'dispatch')
  └── Receive clean linen back → INSERT linen_transactions (type: 'receive')
  └── Log damaged linen → Update linen_items.status = 'damaged'

STEP 2: TASK ALLOCATION
  └── Create tasks for staff: INSERT housekeeping_tasks (unit_id, assigned_to, priority)
  └── Staff views tasks sorted by floor/priority

STEP 3: QUALITY INSPECTION
  └── After staff completes cleaning:
  └── Supervisor inspects → INSERT housekeeping_inspections
  └── Checklist items: {item: "Bathroom sanitized", passed: true}
  └── Score calculated → Pass/Fail/Conditional Pass
  └── If failed → Re-assign task for re-cleaning

TEST ASSERTIONS:
  ├── Linen item lifecycle: in_stock → in_use → in_laundry → in_stock
  ├── Inspection score tracked per task
  └── Failed inspections trigger re-cleaning tasks
```

---

### 14.3 Vertical: Service Apartments — Test Users & Journeys

#### 14.3.1 Service Apartment-Specific Test Users

| Test User | Email | Role | Property Context | Purpose |
|---|---|---|---|---|
| **Deepa (Front Desk)** | `frontdesk.csa@ehms.demo` | front_desk | Casa Serene Apartments | Extended-stay check-in, utility billing |
| **Ravi (HK Staff)** | `housekeeping.csa@ehms.demo` | housekeeping_staff | Casa Serene Apartments | Bi-weekly deep cleaning, kitchen sanitation |
| **Kavita (HK Sup.)** | `hksupervisor.csa@ehms.demo` | housekeeping_supervisor | Casa Serene Apartments | Inspection, linen exchange schedule |
| **Ganesh (Maint)** | `maintenance.csa@ehms.demo` | maintenance_staff | Casa Serene Apartments | Appliance repair (fridge, AC, washing machine) |
| **Sita (Property Mgr)** | `manager.csa@ehms.demo` | property_manager | Casa Serene Apartments | Extended-stay rate management, compliance |
| **Anand (Finance)** | `finance.csa@ehms.demo` | finance_manager | Casa Serene Apartments | Split billing (room + utilities), corp invoicing |
| **Guest: Robert Brown** | `robert.brown@guest.demo` | guest | Casa Serene Apartments | 14-day extended stay with utility billing |

#### 14.3.2 Service Apartment User Journey 1: Extended Stay Booking → Check-In → Stay → Check-Out

```
JOURNEY: Service Apartment Extended Stay
PRIMARY ACTORS: Front Desk (Deepa), Guest (Robert Brown)
SUPPORTING: Housekeeping (Ravi), Maintenance (Ganesh), Finance (Anand)

STEP 1: BOOKING (Extended Stay)
  └── Guest books suite for 14 nights → booking_model: 'nightly', check_in/check_out span 14 days
  └── Rate plan applies extended-stay discount (10% off for 7+ nights)
  └── DB: INSERT bookings (status: confirmed, adults: 2, special_requests: "weekly cleaning only")

STEP 2: CHECK-IN (Service Apartment Style)
  └── Login as: frontdesk.csa@ehms.demo / Demo@1234
  └── Navigate to: /dashboard/front-desk
  └── Select apartment suite → "Check In"
  └── Additional steps vs hotel:
       ├── Unit handover briefing (kitchen appliances, WiFi password, washing machine)
       ├── Utility meter reading (electricity, water) — recorded for end-of-stay billing
       ├── Parking allocation
       └── Housekeeping schedule setup: "Bi-weekly cleaning (Tue & Fri)"
  └── Submit → DB: Same transactional updates as hotel check-in

STEP 3: SCHEDULED HOUSEKEEPING (Bi-weekly)
  └── System auto-creates HK tasks for Tue & Fri
  └── Login as: housekeeping.csa@ehms.demo
  └── View tasks → Navigate to apartment → Perform deep cleaning:
       ├── Full kitchen sanitation (fridge, oven, microwave, stovetop)
       ├── Bathroom deep clean
       ├── Bed linen change (weekly)
       ├── Vacuuming and mopping
       └── Restock supplies (toilet paper, soap, dishwasher pods)
  └── Mark task complete → DB: UPDATE housekeeping_tasks SET status = 'completed'

STEP 4: MAINTENANCE REQUEST (Appliance Issue)
  └── Guest reports: "Refrigerator not cooling properly"
  └── Login as: maintenance.csa@ehms.demo
  └── Navigate to: /dashboard/maintenance/tickets
  └── Ticket created (priority: high, category: appliance)
  └── Visit apartment → Diagnose: compressor issue → Log parts used
  └── Update status: in_progress → resolved
  └── Note in ticket: "Compressor replaced under AMC"

STEP 5: MID-STAY UTILITY READING
  └── Login as: frontdesk.csa@ehms.demo
  └── Record mid-stay utility reading (for long stays >7 days)
  └── Data stored for end-of-stay comparison

STEP 6: CHECK-OUT + UTILITY BILL SETTLEMENT
  └── Login as: frontdesk.csa@ehms.demo
  └── Click occupied suite → "Check Out"
  └── Additional steps vs hotel:
       ├── Unit inspection (inventory check: kitchen items, appliances)
       ├── Final utility meter reading → Calculate consumption charges
       ├── Deduct any damages from deposit
       └── Split invoice: Room charges + Utility charges + Service charges
  └── Process payment → DB updates same as hotel
  └── Feedback collected

TEST ASSERTIONS:
  ├── Extended booking spans >7 days with correct nightly rate × nights
  ├── Utility charges calculated and added to total invoice
  ├── HK tasks auto-generated on bi-weekly schedule
  ├── Maintenance ticket linked to appliance AMC contract
  └── Split invoice shows room + utilities + services as line items
```

---

### 14.4 Vertical: Apartment Leasing & Rent — Test Users & Journeys

#### 14.4.1 Rental-Specific Test Users

| Test User | Email | Role | Property Context | Purpose |
|---|---|---|---|---|
| **Amit (Property Mgr)** | `manager.gwr@ehms.demo` | property_manager | Greenwood Residency | Lease creation, renewals, deposit mgmt |
| **Sunita (Finance)** | `finance.gwr@ehms.demo` | finance_manager | Greenwood Residency | Rent roll, deposit ledger, refunds |
| **Manoj (Maint)** | `maintenance.gwr@ehms.demo` | maintenance_staff | Greenwood Residency | Apartment repairs (plumbing, electrical) |
| **Geeta (HK Staff)** | `housekeeping.gwr@ehms.demo` | housekeeping_staff | Greenwood Residency | Unit turnover cleaning between tenancies |
| **Tenant: Priya Sharma** | `priya.sharma@tenant.demo` | tenant | Greenwood Residency (3BHK-05) | Pay rent, request maintenance, renew lease |
| **Tenant: Rohan Mehta** | `rohan.mehta@tenant.demo` | tenant | Greenwood Residency (2BHK-12) | Test late payment flow, notice period |

#### 14.4.2 Rental User Journey 1: Complete Tenant Lifecycle (Prospect → Move-In → Pay Rent → Maintenance → Renew → Move-Out)

```
JOURNEY: Rental Tenant Full Lifecycle
PRIMARY ACTORS: Property Manager (Amit), Tenant (Priya Sharma)
SUPPORTING: Finance (Sunita), Maintenance (Manoj), Housekeeping (Geeta)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 1: LEASE CREATION & MOVE-IN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 1: CREATE GUEST PROFILE (if not existing)
  └── Login as: manager.gwr@ehms.demo / Demo@1234
  └── Navigate to: /dashboard/front-desk/guests
  └── Create new guest: "Priya Sharma", email, phone, ID proof (Aadhaar)
  └── DB: INSERT guest_profiles

STEP 2: CREATE LEASE AGREEMENT
  └── Navigate to: /dashboard/rental
  └── Click "New Lease" — Fill form:
       ├── Tenant: Priya Sharma
       ├── Property: Greenwood Residency
       ├── Unit: 3BHK-05 (vacant)
       ├── Start Date: 01 Jul 2026
       ├── End Date: 30 Jun 2027 (12 months)
       ├── Monthly Rent: ₹28,000
       ├── Security Deposit: ₹56,000 (2 months)
       ├── Notice Period: 30 days
       └── Escalation: 10% annually
  └── Submit → DB operations (transactional):
       ├── INSERT lease_agreements (status: 'active', agreement_ref auto-generated)
       ├── UPDATE units SET status = 'occupied' WHERE id = $unitId
       ├── INSERT deposit_ledger (type: 'deposit_received', amount: 56000)
       └── First rent_invoice auto-generated for July 2026

TEST: Verify lease appears in table → Status shows "active" (green badge)
TEST: Verify unit status changed to occupied
TEST: Verify deposit ledger shows ₹56,000 received

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 2: ACTIVE TENANCY — RENT PAYMENT & MAINTENANCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 3: MONTHLY RENT INVOICE GENERATION (Auto)
  └── System auto-generates rent_invoice on 1st of each month
  └── Invoice: period_start, period_end, rent_amount=28000, due_date=5th
  └── Status: 'draft' → 'sent'

STEP 4: RENT PAYMENT (Tenant Portal)
  └── Login as: priya.sharma@tenant.demo / Demo@1234
  └── View outstanding invoice → Make payment (via gateway)
  └── DB: UPDATE rent_invoices SET paid_amount=28000, status='paid', paid_at=NOW()
  └── Finance module: Corresponding journal entry created
  └── Rent roll updated: "Priya Sharma — ₹28,000 — Paid (teal badge)"

TEST: Verify rent_invoices.status = 'paid'
TEST: Verify rent roll shows payment in /dashboard/rental
TEST: Verify deposit ledger unchanged (this is rent, not deposit)

STEP 5: LATE PAYMENT TEST (Second Tenant)
  └── Tenant Rohan Mehta (rohan.mehta@tenant.demo) doesn't pay by due date (5th)
  └── After 5th: System applies late_fee = 2% of rent (₹22,000 × 0.02 = ₹440)
  └── DB: UPDATE rent_invoices SET late_fee = 440, total_amount = 22440
  └── Rent roll shows: "Rohan Mehta — ₹22,440 — Overdue (red badge)"

TEST: Verify late fee calculation in rent_invoices
TEST: Verify overdue badge in rent roll

STEP 6: MAINTENANCE REQUEST (Tenant)
  └── Tenant raises: "Water leakage in bathroom sink"
  └── Login as: maintenance.gwr@ehms.demo
  └── Ticket created (property_id: Greenwood Residency, priority: high)
  └── Plumber dispatched → Fix completed → Parts used: PVC pipe, sealant
  └── Ticket status: resolved
  └── If unit is under AMC → Vendor dispatched instead

TEST: Verify maintenance ticket linked to rental property
TEST: Verify parts inventory decremented for used parts

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 3: RENEWAL & MOVE-OUT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 7: RENEWAL NOTIFICATION
  └── At T-60 days before lease end: System sets lease.status = 'renewal_due'
  └── Renewal due list in /dashboard/rental shows the lease with amber badge
  └── Property Manager reviews and negotiates terms

STEP 8: LEASE RENEWAL (with Escalation)
  └── Login as: manager.gwr@ehms.demo
  └── Apply 10% escalation: new rent = ₹28,000 × 1.10 = ₹30,800
  └── INSERT lease_amendments (amendment_type: 'rent_escalation')
  └── UPDATE lease_agreements SET rent_amount = 30800, status = 'renewed', end_date = extended
  └── Verify: Dashboard shows renewed status, new rent reflects

STEP 9: MOVE-OUT PROCESS (for terminating tenant)
  └── Tenant gives 30-day notice → Logged in system
  └── Notice period tracking visible in /dashboard/rental
  └── Move-out inspection scheduled:
       ├── INSERT move_out_checklist items with condition + photos
       ├── If damages: INSERT deposit_ledger (type: 'deduction', amount: X)
       └── If no damages: Full deposit refund
  └── Final utility settlement
  └── UPDATE lease_agreements SET status = 'terminated'
  └── UPDATE units SET status = 'vacant'
  └── Housekeeping dispatched for unit turnover cleaning

TEST: Verify lease state machine: active → renewal_due → renewed / terminated
TEST: Verify deposit ledger balances: deposit - deductions = refund
TEST: Verify unit returns to 'vacant' status
TEST: Verify move_out_checklist documented with condition records

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 4: FINANCIAL CLOSE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 10: RENT COLLECTION REPORTING
  └── Login as: finance.gwr@ehms.demo / Demo@1234
  └── Navigate to: /dashboard/finance/receivables
  └── View all rent invoices grouped by property
  └── Collection rate: paid_count / total_count × 100
  └── Export rent roll report

STEP 11: DEPOSIT REFUND PROCESSING
  └── Login as: finance.gwr@ehms.demo
  └── Navigate to: /dashboard/rental — Deposit Ledger card
  └── "Process Refund" → Enters amount → System creates payment
  └── DB: INSERT deposit_ledger (type: 'refund', amount: -deductions)
  └── Payment processed via finance gateway

TEST: Verify rent collection percentage calculated correctly
TEST: Verify deposit refund reduces held deposit balance
```

#### 14.4.3 Rental User Journey 2: Multi-Property Portfolio Management

```
JOURNEY: Rental Portfolio Overview & Property Comparison
PRIMARY ACTOR: Property Manager (Amit)

STEP 1: PORTFOLIO DASHBOARD
  └── Login as: manager.gwr@ehms.demo
  └── Navigate to: /dashboard/rental
  └── View all rental properties in portfolio:
       ├── Greenwood Residency — 24 units, 87% occ, ₹5.6L rev
       ├── Lakeview Apartments — 12 units, 83% occ, ₹3.8L rev
       └── Cityscape Residences — 18 units, 83% occ, ₹4.2L rev

STEP 2: PERFORMANCE COMPARISON
  └── Property Comparison table shows:
       ├── Occupancy % per property (bar graph)
       ├── Average Rent per property
       ├── Collection rate per property
       ├── Satisfaction score
       └── Monthly Revenue

STEP 3: INCOME FORECAST
  └── 3-month projection view:
       ├── Jul 2026: ₹1,65,000 expected, 2 new leases, 1 expiring
       ├── Aug 2026: ₹1,72,000 expected, 1 new lease
       └── Sep 2026: ₹1,80,000 expected, 1 new lease, 2 expiring

TEST: Verify portfolio-level aggregation across properties
TEST: Verify forecast calculations based on active + upcoming leases
```

---

### 14.5 Vertical: Workplace & Managed Offices — Test Users & Journeys

#### 14.5.1 Workplace-Specific Test Users

| Test User | Email | Role | Property Context | Purpose |
|---|---|---|---|---|
| **Farhan (Facility Mgr)** | `facility.ics@ehms.demo` | workplace_facility_manager | Innovate Coworking Space | Seat utilization, memberships, access control |
| **Suresh (Security)** | `security.ics@ehms.demo` | security_staff | Innovate Coworking Space | Visitor check-in/out, badge issuance |
| **Member: Neha** | `neha@member.demo` | member (corporate) | Innovate Coworking Space | Desk booking, meeting room, amenities |
| **Member: Arjun** | `arjun@member.demo` | member (corporate) | Innovate Coworking Space | Dedicated seat, recurring booking |
| **Visitor: Ankit** | `ankit@visitor.demo` | visitor | Innovate Coworking Space | Day-pass visitor, pre-registration |
| **Priya (Finance)** | `finance.ics@ehms.demo` | finance_manager | Innovate Coworking Space | Membership billing, overage invoicing |

#### 14.5.2 Workplace User Journey 1: Corporate Membership → Desk Booking → Visit → Billing

```
JOURNEY: Workplace Coworking Full Cycle
PRIMARY ACTORS: Facility Manager (Farhan), Member (Neha), Security (Suresh), Finance (Priya)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 1: MEMBERSHIP ONBOARDING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 1: CORPORATE ACCOUNT CREATION
  └── Login as: facility.ics@ehms.demo / Demo@1234
  └── Navigate to: /dashboard/workplace
  └── Click "New Membership" → Fill form:
       ├── Company: TechStart Inc
       ├── Plan: Dedicated Seats (5 seats)
       ├── Billing: Monthly @ ₹12,000/seat
       ├── Start Date: 01 Jul 2026
       └── Auto-renew: Yes
  └── DB operations:
       ├── INSERT corporate_accounts (name: 'TechStart Inc')
       ├── INSERT membership_plans (plan_type: 'dedicated_seat', price: 12000)
       └── INSERT corporate_memberships (seat_allocated: 5, seat_used: 0, status: 'active')

STEP 2: ADD MEMBER USERS
  └── Add Neha and Arjun as members under TechStart Inc corporate membership
  └── DB: INSERT guest_profiles with tags=['workplace_member', 'TechStart']
  └── DB: INSERT corporate_members (corporate_id, guest_id, designation, employee_id)

TEST: Verify membership count increments on dashboard stat cards
TEST: Verify seat_pool shows 5 allocated, 0 used

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 2: DAILY DESK BOOKING & USAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 3: MEMBER DESK BOOKING
  └── Login as: neha@member.demo / Demo@1234
  └── Navigate to: /dashboard/workplace
  └── Interactive Floor Plan displayed (grid of desks D-01 to D-N, cabins C-01, MR-01)
  └── Color legend: Available (green) | Occupied (blue) | Booked (yellow)
  └── Click available desk "D-05" → "Book Now"
  └── Select time: 9:00 AM to 6:00 PM
  └── Confirm → DB operations:
       ├── INSERT workplace_bookings (unit_id: D-05 unit, booking_type: 'dedicated_seat',
       │     start_time, end_time, status: 'confirmed', is_recurring: false)
       └── UPDATE corporate_memberships SET seat_used = seat_used + 1

TEST: Verify floor plan shows D-05 as "Booked" (yellow)
TEST: Verify seat_used increments (0 → 1)

STEP 4: RECURRING BOOKING (Arjun — weekly schedule)
  └── Login as: arjun@member.demo
  └── Select dedicated seat "DS-01" → "Book Weekly"
  └── Pattern: Mon-Fri, 9 AM-6 PM, repeat every week
  └── DB: workplace_bookings with is_recurring: true, recurring_pattern: { frequency: 'weekly', days: [1,2,3,4,5] }

STEP 5: MEETING ROOM BOOKING
  └── Login as: neha@member.demo
  └── Click "MR-01" (available) → Book for 2 hours (2 PM - 4 PM)
  └── Add: "Client presentation — AV setup required"
  └── DB: INSERT workplace_bookings (booking_type: 'meeting_room')

TEST: Verify meeting room shows as booked in floor plan
TEST: Verify booking appears in /dashboard/workplace

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 3: ACCESS CONTROL & VISITOR MANAGEMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 6: DAY-OF CHECK-IN (Member)
  └── Member arrives → Checks in at kiosk/turnstile
  └── DB: UPDATE workplace_bookings SET status = 'checked_in', checked_in_at = NOW()
  └── Digital access credential issued

STEP 7: VISITOR PRE-REGISTRATION
  └── Login as: facility.ics@ehms.demo
  └── Pre-register visitor: "Ankit Jain — Meeting with Neha"
  └── DB: INSERT visitor_logs (visitor_name, host_employee_id, purpose, check_in: future)
  └── QR code generated → Sent to visitor's email

STEP 8: VISITOR CHECK-IN
  └── Security (Suresh) at front desk:
  └── Login as: security.ics@ehms.demo / Demo@1234
  └── Scan visitor QR → Verify ID → Issue badge
  └── DB: UPDATE visitor_logs SET check_in = NOW(), badge_issued = true

STEP 9: VISITOR CHECK-OUT
  └── Visitor leaves → Security scans out
  └── DB: UPDATE visitor_logs SET check_out = NOW()
  └── Badge deactivated, auto-expire set

TEST: Verify visitor_logs.check_in and check_out timestamps recorded
TEST: Verify visitor appears in active visitor list during visit

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 4: MEMBERSHIP BILLING & OVERAGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 10: MONTHLY MEMBERSHIP INVOICE
  └── System auto-generates membership_invoice on 1st of month:
       ├── base_amount: 5 seats × ₹12,000 = ₹60,000
       ├── seat_used this month: 7 (2 over allocated)
       ├── overage_amount: 2 × ₹15,000 (per-seat overage rate) = ₹30,000
       └── total_amount: ₹90,000
  └── DB: INSERT membership_invoices (status: 'draft' → 'sent')

STEP 11: OVERAGE BILLING
  └── Login as: finance.ics@ehms.demo / Demo@1234
  └── Navigate to: /dashboard/finance/receivables
  └── View TechStart Inc invoice: ₹90,000 total (₹60K base + ₹30K overage)
  └── Process payment → Links to GL

TEST: Verify overage calculated as (seat_used - seat_allocated) × overage_rate
TEST: Verify invoice flows to finance module properly

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 5: FACILITY MANAGEMENT ANALYTICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 12: SEAT UTILIZATION DASHBOARD
  └── Login as: facility.ics@ehms.demo
  └── View stat cards:
       ├── Seat Utilization: 71% (5/7)
       ├── Active Members: 7
       ├── Meeting Rooms: 1/3 Free
       └── Monthly Revenue: ₹8.4L
  └── View membership table with all active memberships
  └── View visitor history with check-in/out times

TEST: Verify utilization percentage = (used/allocated) × 100
TEST: Verify stat cards reflect real-time data
```

---

### 14.6 Cross-Vertical HR Workflow — Test User Journey

```
JOURNEY: Cross-Vertical HR — Employee Lifecycle (Applicable to ALL 4 Verticals)
PRIMARY ACTOR: HR Manager (Vikram — hr.ovh@ehms.demo / hr@ehms.demo)

STEP 1: EMPLOYEE ONBOARDING
  └── Login as: hr@ehms.demo / Demo@1234
  └── Navigate to: /dashboard/hr/employees
  └── Create new employee:
       ├── Name, Email, Phone
       ├── Department: Housekeeping
       ├── Designation: Senior Housekeeping Staff
       ├── Band: B2
       ├── Shift: General (9 AM - 6 PM)
       ├── Reporting Manager: Meena (HK Supervisor)
       └── Joining Date: 01 Jul 2026
  └── DB: INSERT employees

STEP 2: SHIFT ASSIGNMENT
  └── Navigate to: /dashboard/hr/shifts
  └── Assign rotating shifts to hotel housekeeping staff
  └── DB: INSERT shift_rotations

STEP 3: ATTENDANCE & TIMESHEET
  └── Employee marks attendance (or HR marks on behalf)
  └── Navigate to: /dashboard/hr/timesheet
  └── View timesheet for current month
  └── DB: INSERT attendance_records, INSERT timesheets

STEP 4: LEAVE REQUEST
  └── Employee requests leave → HR approves
  └── Navigate to: /dashboard/hr/leave
  └── Approve/Reject pending requests
  └── DB: INSERT leave_requests (status: 'approved')

STEP 5: PAYROLL RUN
  └── Navigate to: /dashboard/hr/payroll
  └── Create payroll run for current month
  └── View payroll lines per employee
  └── Process payroll → DB: INSERT payroll_runs + payroll_lines

STEP 6: APPRAISAL CYCLE
  └── Navigate to: /dashboard/hr/appraisal
  └── Create appraisal cycle (H2 2026)
  └── Set goals for employees → INSERT appraisal_goals
  └── Manager reviews → INSERT appraisal_reviews
  └── Process increments → INSERT increments

TEST ASSERTIONS:
  ├── Employee record created with correct department/designation
  ├── Shift rotation assigns correct staff to correct shifts
  ├── Leave balance decremented on approval
  ├── Payroll calculates salary correctly (base + HRA + deductions)
  └── Appraisal score triggers increment percentage
```

### 14.7 Cross-Vertical Finance Workflow — Test User Journey

```
JOURNEY: Cross-Vertical Finance — Month-End Close (Applicable to ALL 4 Verticals)
PRIMARY ACTOR: Finance Manager (Ananya — finance.ovh@ehms.demo / finance@ehms.demo)

STEP 1: JOURNAL ENTRIES
  └── Login as: finance@ehms.demo / Demo@1234
  └── Navigate to: /dashboard/finance/journal
  └── Create journal entry for monthly revenue accrual:
       ├── Debit: Accounts Receivable (₹5,00,000)
       ├── Credit: Room Revenue (₹5,00,000)
       └── DB: INSERT journal_entries + INSERT journal_lines

STEP 2: VENDOR BILL PROCESSING
  └── Navigate to: /dashboard/finance/payables
  └── Enter vendor bill: "Laundry Services — ₹45,000"
  └── DB: INSERT vendor_bills + INSERT bill_line_items
  └── Approve bill → DB: UPDATE vendor_bills SET status = 'approved'
  └── Create bill payment → DB: INSERT bill_payments

STEP 3: CUSTOMER INVOICE
  └── Navigate to: /dashboard/finance/receivables
  └── View invoice for corporate booking (Acme Corp — ₹1,20,000)
  └── Mark as sent → Record payment received

STEP 4: LEDGER REVIEW
  └── Navigate to: /dashboard/finance/ledger
  └── View general ledger filtered by account/property
  └── Verify trial balance: Debits = Credits

STEP 5: FINANCIAL REPORTS
  └── Navigate to: /dashboard/finance/reports
  └── Run Trial Balance → Verify debits = credits
  └── Run P&L Statement → View revenue vs expenses
  └── Run Balance Sheet → View assets, liabilities, equity

TEST ASSERTIONS:
  ├── Journal entry balanced (total debits = total credits)
  ├── Vendor bill flows through approval → payment lifecycle
  ├── Invoice payment updates customer balance
  ├── Ledger reflects all transactions chronologically
  └── Reports reconcile correctly
```

### 14.8 Cross-Vertical Admin — Test User Journey (Including Property Configuration)

```
JOURNEY: Admin Module — System Configuration & Monitoring
PRIMARY ACTOR: Super Admin (superadmin@ehms.demo)

STEP 1: PROPERTY MANAGEMENT
  └── Login as: superadmin@ehms.demo / Demo@1234
  └── Navigate to: /dashboard/admin/properties
  └── View all properties across all verticals
  └── Create new property: "New OVH Beach Resort" (vertical: hotel)
  └── DB: INSERT properties + configure check-in/out times, star rating

STEP 2: USER MANAGEMENT
  └── Navigate to: /dashboard/admin/users
  └── Create new user: "New FD Staff" → Assign role: front_desk → Assign to OVH
  └── DB: INSERT users + INSERT user_roles

STEP 3: ROLE PERMISSIONS
  └── Navigate to: /dashboard/admin/roles
  └── View all system roles and their descriptions
  └── (System roles are fixed, but reviewable)

STEP 4: AUDIT TRAIL
  └── Navigate to: /dashboard/admin/audit
  └── View audit events: user logins, booking changes, financial transactions
  └── Filter by date range, entity type, user

STEP 5: BACKUP
  └── Navigate to: /dashboard/admin/backup
  └── View backup job history
  └── Trigger new backup → DB: INSERT system_backups

STEP 6: PROPERTY CONFIGURATION (Feature Toggles)
  └── Navigate to: /dashboard/admin/properties → Click property card Settings icon
  └── View Property Detail page → Configuration tab
  └── Toggle features: Enable "Restaurant", Disable "Bar"
  └── Click Save → DB: UPDATE properties SET config = config || '{"features":{"restaurant":...,"bar":...}}'::jsonb
  └── Verify: Feature status badges update in Overview tab
  └── Verify: Modules can check isFeatureEnabled("restaurant") to conditionally render UI

TEST ASSERTIONS:
  ├── Property created reflects in all dropdowns
  ├── New user can login with assigned role permissions
  ├── Audit trail captures all CREATE/UPDATE/DELETE actions
  ├── Backup job recorded in system_backups table
  └── Property feature config persisted and retrievable via GET endpoint
```

---

### 14.9 Test Data Summary Matrix

| Vertical | User Journey | Test Users Involved | Key Pages Tested | API Endpoints Hit |
|---|---|---|---|---|
| **Hotels** | Guest Full Cycle | Rajesh, John, Lakshmi, Arun, Ananya | front-desk, housekeeping, maintenance, finance | checkin, reservations, housekeeping, maintenance, f-and-b |
| **Hotels** | Linen & Inspection | Meena, Lakshmi | housekeeping/linen, inspections | linen/batches, linen/items, inspections |
| **Service Apts** | Extended Stay | Deepa, Robert, Ravi, Ganesh, Anand | front-desk, housekeeping, maintenance, finance | Same as hotel + utility billing |
| **Rental** | Tenant Lifecycle | Amit, Priya, Manoj, Geeta, Sunita | rental, maintenance, finance | leases, maintenance, housekeeping |
| **Rental** | Portfolio Mgmt | Amit | rental | leases, dashboard/rental |
| **Workplace** | Coworking Full Cycle | Farhan, Neha, Arjun, Suresh, Ankit, Priya | workplace, finance | workplace/bookings, memberships, visitors |
| **Cross** | HR Lifecycle | Vikram | hr/* | hr/employees, shifts, timesheets, leaves, payroll |
| **Cross** | Finance Close | Ananya | finance/* | finance/journal-entries, ledger, reports/* |
| **Cross** | Admin Config | Super Admin | admin/* | admin/users, roles, audit-events, backup |

### 14.10 Login Credentials Quick Reference

| Persona | Email | Password | Role | Best For Testing |
|---|---|---|---|---|
| **Super Admin** | `superadmin@ehms.demo` | `Demo@1234` | super_admin | System config, audit, any page |
| **Executive** | `executive@ehms.demo` | `Demo@1234` | executive | Cross-vertical analytics, reports |
| **Property Manager** | `admin@ehms.demo` | `Demo@1234` | property_manager | Any vertical dashboard, properties |
| **Front Desk** | `frontdesk@ehms.demo` | `Demo@1234` | front_desk | Check-in/out, room matrix, billing |
| **Housekeeping** | `housekeeping@ehms.demo` | `Demo@1234` | housekeeping_staff | Tasks, cleaning, status updates |
| **Maintenance** | `maintenance@ehms.demo` | `Demo@1234` | maintenance_staff | Tickets, parts, time entries |
| **HR Manager** | `hr@ehms.demo` | `Demo@1234` | hr_manager | Employees, payroll, leave |
| **Finance Manager** | `finance@ehms.demo` | `Demo@1234` | finance_manager | GL, invoices, bills, reports |

**Per-Property Hotel Users:**

| Persona | Email | Role | Property |
|---|---|---|---|
| Front Desk Supervisor | `frontdesk.ovh@ehms.demo` | front_desk | Oceanview Grand Hotel |
| HK Staff | `housekeeping.ovh@ehms.demo` | housekeeping_staff | Oceanview Grand Hotel |
| HK Supervisor | `hksupervisor.ovh@ehms.demo` | housekeeping_supervisor | Oceanview Grand Hotel |
| Maintenance Staff | `maintenance.ovh@ehms.demo` | maintenance_staff | Oceanview Grand Hotel |
| Maintenance Supervisor | `maintenancesup.ovh@ehms.demo` | maintenance_supervisor | Oceanview Grand Hotel |
| Property Manager | `manager.ovh@ehms.demo` | property_manager | Oceanview Grand Hotel |
| Finance | `finance.ovh@ehms.demo` | finance_manager | Oceanview Grand Hotel |
| HR | `hr.ovh@ehms.demo` | hr_manager | Oceanview Grand Hotel |

**Per-Property Service Apartment Users:**

| Persona | Email | Role | Property |
|---|---|---|---|
| Front Desk | `frontdesk.csa@ehms.demo` | front_desk | Casa Serene Apartments |
| HK Staff | `housekeeping.csa@ehms.demo` | housekeeping_staff | Casa Serene Apartments |
| HK Supervisor | `hksupervisor.csa@ehms.demo` | housekeeping_supervisor | Casa Serene Apartments |
| Maintenance | `maintenance.csa@ehms.demo` | maintenance_staff | Casa Serene Apartments |
| Property Manager | `manager.csa@ehms.demo` | property_manager | Casa Serene Apartments |
| Finance | `finance.csa@ehms.demo` | finance_manager | Casa Serene Apartments |

**Per-Property Rental Users:**

| Persona | Email | Role | Property |
|---|---|---|---|
| Property Manager | `manager.gwr@ehms.demo` | property_manager | Greenwood Residency |
| Finance | `finance.gwr@ehms.demo` | finance_manager | Greenwood Residency |
| Maintenance | `maintenance.gwr@ehms.demo` | maintenance_staff | Greenwood Residency |
| HK Staff | `housekeeping.gwr@ehms.demo` | housekeeping_staff | Greenwood Residency |

**Per-Property Workplace Users:**

| Persona | Email | Role | Property |
|---|---|---|---|
| Facility Manager | `facility.ics@ehms.demo` | workplace_facility_manager | Innovate Coworking Space |
| Security | `security.ics@ehms.demo` | security_staff | Innovate Coworking Space |
| Finance | `finance.ics@ehms.demo` | finance_manager | Innovate Coworking Space |

**Guest/Tenant/Member Test Accounts (External Personas):**

| Persona | Email | Context | Journey |
|---|---|---|---|
| John Smith (Hotel Guest) | `john.smith@guest.demo` | Oceanview Grand Hotel | Book → Check-in → Stay → Check-out |
| Robert Brown (SA Guest) | `robert.brown@guest.demo` | Casa Serene Apartments | Extended stay with utility billing |
| Priya Sharma (Tenant) | `priya.sharma@tenant.demo` | Greenwood Residency | Lease → Pay rent → Maintenance → Renew |
| Rohan Mehta (Tenant) | `rohan.mehta@tenant.demo` | Greenwood Residency | Late payment, notice period |
| Neha (Workplace Member) | `neha@member.demo` | Innovate Coworking Space | Desk booking, meeting room |
| Arjun (Workplace Member) | `arjun@member.demo` | Innovate Coworking Space | Recurring booking, dedicated seat |
| Ankit (Workplace Visitor) | `ankit@visitor.demo` | Innovate Coworking Space | Pre-registration, check-in/out |

---

*Document generated from eHMS codebase analysis — 25 June 2026*  
*Source: `d:\Training\working\HMS` — 23 SQL migrations, 100+ API routes, 40+ pages, 80+ hooks*
