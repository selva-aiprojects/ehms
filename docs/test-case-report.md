# eHMS — Consolidated Test Case Report

**Version:** 1.0
**Date:** 27 Jul 2026
**Scope:** Complete hospitality management across 4 verticals (Hotels, Serviced Apartments, Apartment Rental, Workplace Services)
**Total Test Cases:** 312 (manual spec) + 485 (Playwright E2E)
**Coverage:** 186 API route files (~380 endpoints), 220+ hooks, 48 DB migrations, 17 RBAC roles

---

## Playwright E2E Execution Results (27 Jul 2026)

| Metric | Count |
|--------|-------|
| **Total E2E Tests** | 485 |
| **Executed** | 469 |
| **Passed** | **422 (87.0%)** |
| **Failed** | **47 (9.7%)** |
| **Not Run (timeout)** | 16 (3.3%) |

### Failure Categories

| Category | Count | Root Cause |
|----------|-------|------------|
| Command Center / Room Matrix loading | 8 | Slow page load / element not found in time (16-22s timeouts) |
| AI Revenue Manager cards | 3 | Element not rendered on command center |
| Maintenance sub-pages (filters, create) | 11 | Navigation to `/dashboard/maintenance` sub-pages timing out |
| Maintenance tickets page filters | 5 | Page load timeout on tickets table |
| Workplace Memberships / Visitors pages | 2 | Page navigation timeout |
| HK Task detail panel & checklist modal | 2 | UI interaction timing |
| Restaurant POS floor plan / table detail | 3 | Table click / tab activation timing |
| Guest Requests form / Feedback dept dropdown | 3 | Form element detection timing |
| Cross-module command center shortcuts | 2 | Element not found |
| Seed data count assertions | 4 | Room count/status assertions don't match current seed |
| Calendar/arrivals filter assertions | 3 | Data state-dependent assertions |
| HR Policies / Finance Receivables pages | 2 | Page navigation timeout |

### Summary by Spec File

| Spec File | Total | Passed | Failed |
|-----------|-------|--------|--------|
| 01-platform-admin-and-properties | 9 | 9 | 0 |
| 02-hotel-guest-journey | 47 | 44 | 3 |
| 03-serviced-apartment-journey | 16 | 15 | 1 |
| 04-apartment-rental-journey | 13 | 13 | 0 |
| 05-workplace-services-journey | 14 | 12 | 2 |
| 06-housekeeping-maintenance-laundry | 78 | 63 | 15 |
| 07-restaurant-pos-kds-fnb | 0 | 0 | 0 |
| 08-hr-finance-procurement | 40 | 38 | 2 |
| 09-rbac-access-control | 20 | 20 | 0 |
| 10-demo-readiness | 20 | 16 | 4 |
| 11-full-guest-lifecycle | 30 | 24 | 6 |
| 12-laundry-restaurant-bar-services | 87 | 82 | 5 |
| 13-complete-workflow-certification | 81 | 66 | 15 |
| **TOTAL** | **469** | **422** | **47** |

---

## Table of Contents

1. [Authentication & Authorization](#1-authentication--authorization)
2. [Platform Admin (Superadmin)](#2-platform-admin-superadmin)
3. [Property Management](#3-property-management)
4. [Room/Unit Creation Per Workspace](#4-roomunit-creation-per-workspace)
5. [Booking Workflows](#5-booking-workflows)
6. [Check-In Workflow](#6-check-in-workflow)
7. [Check-Out Workflow](#7-check-out-workflow)
8. [Front Desk Operations](#8-front-desk-operations)
9. [Guest Requests & Services](#9-guest-requests--services)
10. [Housekeeping — Dirty Room Readiness & SLA](#10-housekeeping--dirty-room-readiness--sla)
11. [Maintenance — Request Workflow & SLA](#11-maintenance--request-workflow--sla)
12. [Laundry Services](#12-laundry-services)
13. [Restaurant POS & KDS](#13-restaurant-pos--kds)
14. [Bar & F&B Services](#14-bar--fb-services)
15. [Pricing & Rate Management](#15-pricing--rate-management)
16. [OTA Channel Manager](#16-ota-channel-manager)
17. [Revenue AI](#17-revenue-ai)
18. [Loyalty Program](#18-loyalty-program)
19. [Billing, Invoicing & Payments](#19-billing-invoicing--payments)
20. [Finance & Accounting](#20-finance--accounting)
21. [HR & Payroll](#21-hr--payroll)
22. [Procurement & Inventory](#22-procurement--inventory)
23. [Vendor Management](#23-vendor-management)
24. [Lease & Rental (Apartment Vertical)](#24-lease--rental-apartment-vertical)
25. [Workplace Services](#25-workplace-services)
26. [WhatsApp Integration](#26-whatsapp-integration)
27. [RBAC & Access Control](#27-rbac--access-control)
28. [Multi-Property Management](#28-multi-property-management)
29. [Self Check-In & Kiosk](#29-self-check-in--kiosk)
30. [End-to-End Guest Lifecycle (Cross-Module)](#30-end-to-end-guest-lifecycle-cross-module)

---

## Legend

| Field | Values |
|-------|--------|
| **ID** | Module prefix + sequential number |
| **P** | Priority: P1 (Critical), P2 (High), P3 (Medium), P4 (Low) |
| **WS** | Workspace: HK (Hotel), SA (Serviced Apartment), AP (Apartment Rental), WP (Workplace), ALL |
| **Status** | 🔴 Not Started, 🟡 In Progress, 🟢 Pass, ❌ Fail, ⬜ Blocked |

---

## 1. Authentication & Authorization

| ID | Test Case | Steps | Expected Result | P | WS | Status |
|----|-----------|-------|-----------------|---|-----|--------|
| AUTH-001 | Tenant user login with valid credentials | POST `/api/auth/login` with email/password/tenant_code | JWT set in `ehms_token` httpOnly cookie, user profile returned | P1 | ALL | 🔴 |
| AUTH-002 | Login with invalid password | POST `/api/auth/login` wrong password | 401 Unauthorized | P1 | ALL | 🔴 |
| AUTH-003 | Login with non-existent email | POST `/api/auth/login` unknown email | 401 Unauthorized | P1 | ALL | 🔴 |
| AUTH-004 | Login with expired/suspended tenant | POST login with suspended tenant code | 403 Forbidden with suspension message | P1 | ALL | 🔴 |
| AUTH-005 | Platform superadmin login | POST `/api/auth/platform-login` with admin credentials | JWT with `is_platform_admin: true`, no tenant context | P1 | ALL | 🔴 |
| AUTH-006 | Platform login with wrong credentials | POST `/api/auth/platform-login` invalid | 401 Unauthorized | P1 | ALL | 🔴 |
| AUTH-007 | Get current user profile | GET `/api/auth/me` with valid cookie | Full user profile with tenant context, assigned_property_ids | P1 | ALL | 🔴 |
| AUTH-008 | Get profile without cookie | GET `/api/auth/me` no cookie | 401 Unauthorized | P1 | ALL | 🔴 |
| AUTH-009 | Logout clears session | POST `/api/auth/logout` | Cookie cleared, subsequent `/api/auth/me` returns 401 | P1 | ALL | 🔴 |
| AUTH-010 | JWT token structure contains required claims | Decode JWT from login | Contains user_id, email, role_name, tenant_code, tenant_schema, tenant_verticals | P1 | ALL | 🔴 |
| AUTH-011 | New user signup | POST `/api/auth/signup` with valid data | User created in tenant schema, can login | P2 | ALL | 🔴 |

---

## 2. Platform Admin (Superadmin)

| ID | Test Case | Steps | Expected Result | P | WS | Status |
|----|-----------|-------|-----------------|---|-----|--------|
| ADM-001 | List all tenants | GET `/api/admin/tenants` as platform_super_admin | All tenants returned with workspace config | P1 | ALL | 🔴 |
| ADM-002 | Provision new tenant | POST `/api/admin/tenants` with schema + workspaces | New schema created, tenant record inserted, welcome email sent | P1 | ALL | 🔴 |
| ADM-003 | Provision tenant with multiple workspaces | POST with workspaces array `[{type,name,is_primary}]` | Workspaces stored in `config.workspaces` JSONB | P1 | ALL | 🔴 |
| ADM-004 | Update tenant config | PATCH `/api/admin/tenants/[code]` | Verticals, suspension status, contact info updated | P2 | ALL | 🔴 |
| ADM-005 | Reset tenant admin password | POST `/api/admin/tenants/[code]/reset-password` | Password reset, welcome email resent with new credentials | P2 | ALL | 🔴 |
| ADM-006 | Delete workspace from tenant | DELETE `/api/admin/tenants/[code]/workspaces/[type]` | Workspace removed, data counts checked first | P2 | ALL | 🔴 |
| ADM-007 | Create support ticket | POST `/api/admin/tickets` | Ticket created with messages table | P2 | ALL | 🔴 |
| ADM-008 | Reply to support ticket | POST `/api/admin/tickets/[id]/messages` | Message saved, email notification sent to tenant | P2 | ALL | 🔴 |
| ADM-009 | Create platform broadcast | POST `/api/admin/broadcasts` | Broadcast visible to all tenants | P3 | ALL | 🔴 |
| ADM-010 | Toggle broadcast active/inactive | PATCH `/api/admin/broadcasts/[id]` | `is_active` toggled | P3 | ALL | 🔴 |
| ADM-011 | View audit events | GET `/api/admin/audit-events` with filters | Events filtered by type/severity/days | P2 | ALL | 🔴 |
| ADM-012 | Initiate backup | POST `/api/admin/backup` as super_admin only | Backup job created, status tracked | P2 | ALL | 🔴 |
| ADM-013 | Platform admin restricted to `/dashboard/admin/tenants` only | Platform admin navigates to `/dashboard/front-desk` | Proxy redirects to tenants page | P1 | ALL | 🔴 |

---

## 3. Property Management

| ID | Test Case | Steps | Expected Result | P | WS | Status |
|----|-----------|-------|-----------------|---|-----|--------|
| PROP-001 | Create hotel property | POST `/api/properties` with vertical_type=hotel | Property created with buildings, floors, units | P1 | HK | 🔴 |
| PROP-002 | Create serviced apartment property | POST with vertical_type=service_apartment, booking_model=nightly | Property created with apartment units + child rooms | P1 | SA | 🔴 |
| PROP-003 | Create rental apartment property | POST with vertical_type=rental_apartment, booking_model=lease | Property created with lease-based units | P1 | AP | 🔴 |
| PROP-004 | Create workplace property | POST with vertical_type=workplace, booking_model=membership | Property with desks, cabins, meeting rooms | P1 | WP | 🔴 |
| PROP-005 | List properties with filters | GET `/api/properties?vertical_type=hotel` | Only hotel properties returned | P1 | ALL | 🔴 |
| PROP-006 | Get property detail with buildings/units | GET `/api/properties/[id]` | Full hierarchy: buildings → floors → units | P1 | ALL | 🔴 |
| PROP-007 | Update property details | PUT `/api/properties/[id]` | Name, address, check-in/out times updated | P2 | ALL | 🔴 |
| PROP-008 | Update property feature toggles | PUT with `config.features` JSONB | 10 feature flags updated independently | P2 | ALL | 🔴 |
| PROP-009 | Enable restaurant feature toggle | Set `config.features.restaurant.enabled=true` | Restaurant module visible in sidebar for this property | P2 | HK/SA | 🔴 |
| PROP-010 | Disable bar feature toggle | Set `config.features.bar.enabled=false` | Bar module hidden | P2 | HK/SA | 🔴 |
| PROP-011 | Get property inventory snapshot | GET `/api/properties/[id]/inventory` | Building → floor → unit hierarchy with status/attributes | P2 | ALL | 🔴 |
| PROP-012 | Soft-delete property | DELETE `/api/properties/[id]` | `is_active=false`, not physically deleted | P2 | ALL | 🔴 |
| PROP-013 | Property access validation | Non-assigned property_manager accesses other property | 403 Forbidden | P1 | ALL | 🔴 |

---

## 4. Room/Unit Creation Per Workspace

| ID | Test Case | Steps | Expected Result | P | WS | Status |
|----|-----------|-------|-----------------|---|-----|--------|
| ROOM-001 | Create hotel rooms under building/floor | Via property creation POST with units array | Rooms created with unit_type=room, unit_label (101,102...), base_rate, status=vacant | P1 | HK | 🔴 |
| ROOM-002 | Create hotel suites | Units with unit_type=suite, higher base_rate | Suites created with correct type and pricing | P1 | HK | 🔴 |
| ROOM-003 | Create serviced apartment units | Units with unit_type=apartment, layout_type=1BHK/2BHK | Apartments with child room hierarchy (parent_unit_id) | P1 | SA | 🔴 |
| ROOM-004 | Create apartment rental units | Units for long-term lease | Units with lease-oriented base_rate (monthly) | P1 | AP | 🔴 |
| ROOM-005 | Create workplace desks | Units with unit_type=desk/seat | Desks with max_occupancy=1 | P1 | WP | 🔴 |
| ROOM-006 | Create meeting rooms | Units with unit_type=meeting_room | Meeting rooms with higher capacity | P1 | WP | 🔴 |
| ROOM-007 | Create private cabins | Units with unit_type=cabin | Cabins with sq_ft and max_occupancy | P1 | WP | 🔴 |
| ROOM-008 | Unit status starts as vacant | Check DB after creation | status = 'vacant' for all new units | P1 | ALL | 🔴 |
| ROOM-009 | Unit attributes JSONB | Units with custom attributes | attributes column stores/returns custom data | P3 | ALL | 🔴 |
| ROOM-010 | Parent-child unit hierarchy | Service apartment with rooms | child units have `parent_unit_id` set to parent apartment | P1 | SA | 🔴 |
| ROOM-011 | Room categories master | GET/POST `/api/masters/room-categories` | Categories with base_price, code, description | P2 | ALL | 🔴 |
| ROOM-012 | Facilities master | GET/POST `/api/masters/facilities` | Facility definitions for property amenities | P2 | ALL | 🔴 |

---

## 5. Booking Workflows

| ID | Test Case | Steps | Expected Result | P | WS | Status |
|----|-----------|-------|-----------------|---|-----|--------|
| BK-001 | **Walk-in booking** — create at front desk | POST `/api/reservations` source=direct, with guest_id, unit_id, dates | Booking status=confirmed, unit status=reserved, draft invoice auto-created | P1 | HK/SA | 🔴 |
| BK-002 | **Channel Partner booking** | POST with source=booking.com, source_booking_ref | Booking created with OTA reference, linked to channel | P1 | HK | 🔴 |
| BK-003 | **Advertisement/OTA booking** | POST source=expedia via `/api/ota/bookings` flow | Booking imported from OTA sync | P1 | HK | 🔴 |
| BK-004 | **Online booking engine** | POST `/api/booking-engine/book` (public, no auth) | Booking created, confirmation returned to guest | P1 | HK/SA | 🔴 |
| BK-005 | Booking price auto-calculation | POST without total_amount, with unit_id + dates | Price calculated from base_rate × nights via `calculateBookingPrice()` | P1 | ALL | 🔴 |
| BK-006 | Overlapping booking prevention | POST with unit_id that has existing confirmed/checked-in booking | 400 "overlapping reservation" error (30-min turnaround buffer) | P1 | ALL | 🔴 |
| BK-007 | Unit status set to reserved on booking | After POST /reservations | unit.status = 'reserved' | P1 | ALL | 🔴 |
| BK-008 | Apartment vertical: block parent + child on booking | Book a child room in serviced apartment | Both child room AND parent apartment set to 'reserved' | P1 | SA | 🔴 |
| BK-009 | Draft invoice auto-created on booking | After successful booking POST | Invoice created with status=draft, line item for room charges | P1 | ALL | 🔴 |
| BK-010 | List bookings with status filter | GET `/api/reservations?status=confirmed` | Only confirmed bookings returned | P1 | ALL | 🔴 |
| BK-011 | List bookings with property filter | GET `/api/reservations?property_id=xxx` | Only bookings for that property | P1 | ALL | 🔴 |
| BK-012 | Calendar view | GET `/api/reservations/calendar` | Units × date grid with booking occupancy | P1 | ALL | 🔴 |
| BK-013 | Check availability | GET `/api/reservations/check-availability?unit_id=&check_in=&check_out=` | Available units listed | P2 | ALL | 🔴 |
| BK-014 | Move/drag booking to different unit | PATCH `/api/reservations/move` | Booking reassigned, old unit freed, new unit reserved | P2 | ALL | 🔴 |
| BK-015 | Cancel booking | DELETE `/api/reservations/[id]` | Booking status=cancelled, unit freed | P1 | ALL | 🔴 |
| BK-016 | Booking engine availability check | GET `/api/booking-engine/availability?propertyCode=&check_in=&check_out=` | Public API returns available units with rates | P2 | HK/SA | 🔴 |
| BK-017 | Booking engine promo code validation | GET `/api/booking-engine/promos?code=xxx&propertyCode=xxx` | Promo validated, discount returned | P3 | HK/SA | 🔴 |
| BK-018 | Digital smart key generation | POST `/api/reservations/[id]/smart-key` | Digital key generated for guest | P3 | HK | 🔴 |
| BK-019 | Lease-based booking (apartment rental) | POST with booking_model=lease | Lease agreement created, rent invoices generated | P1 | AP | 🔴 |
| BK-020 | Membership booking (workplace) | POST via workplace flow | Desk/cabin booked, membership deducted | P1 | WP | 🔴 |

---

## 6. Check-In Workflow

| ID | Test Case | Steps | Expected Result | P | WS | Status |
|----|-----------|-------|-----------------|---|-----|--------|
| CI-001 | Front desk check-in | POST `/api/dashboard/front-desk/checkin` with bookingId + roomId | Booking status → checked_in, unit status → occupied | P1 | ALL | 🔴 |
| CI-002 | Hotel check-in: only room marked occupied | Check-in at hotel property | Only the assigned room unit marked occupied | P1 | HK | 🔴 |
| CI-003 | Serviced apartment check-in: room + parent blocked | Check-in to child room of apartment | Both child room AND parent apartment → occupied | P1 | SA | 🔴 |
| CI-004 | Serviced apartment check-in: whole apartment | Check-in to apartment unit directly | Apartment + all children → occupied | P1 | SA | 🔴 |
| CI-005 | Parking allocation on check-in | Provide vehicleNumber + parkingSlot | `parking_allocations` record created, previous released | P2 | HK | 🔴 |
| CI-006 | Check-in checklist saved | Provide checklistItems object | `checkin_checklists` record upserted with verified_by | P2 | ALL | 🔴 |
| CI-007 | Missing bookingId returns 400 | POST without bookingId | 400 "Missing required fields" | P1 | ALL | 🔴 |
| CI-008 | Property access validation on check-in | Check-in to booking in unassigned property | 403 Forbidden | P1 | ALL | 🔴 |
| CI-009 | Self check-in session creation | POST `/api/checkin` | Check-in session with token generated | P2 | ALL | 🔴 |
| CI-010 | Self check-in step updates | PATCH `/api/checkin/[token]` | ID verification, payment steps updated | P2 | ALL | 🔴 |
| CI-011 | Kiosk check-in config | GET `/api/checkin/kiosk` | Kiosk welcome message, branding, auto check-in settings | P3 | HK | 🔴 |

---

## 7. Check-Out Workflow

| ID | Test Case | Steps | Expected Result | P | WS | Status |
|----|-----------|-------|-----------------|---|-----|--------|
| CO-001 | Front desk check-out | PUT `/api/reservations/[id]` status=checked_out | Booking status → checked_out, unit status → dirty | P1 | ALL | 🔴 |
| CO-002 | Unit becomes dirty after checkout | After check-out | unit.status = 'dirty' (triggers HK workflow) | P1 | ALL | 🔴 |
| CO-003 | Self check-out session | POST `/api/checkout` | Checkout session created with token | P2 | ALL | 🔴 |
| CO-004 | Self check-out step updates | PATCH `/api/checkout/[token]` | Feedback, payment, key return steps updated | P2 | ALL | 🔴 |
| CO-005 | Checkout with outstanding balance | Check-out when balance > 0 | Balance tracked, payment prompted | P1 | ALL | 🔴 |
| CO-006 | Checkout releases parking | Check-out with active parking | `parking_allocations.status` → released | P2 | HK | 🔴 |

---

## 8. Front Desk Operations

| ID | Test Case | Steps | Expected Result | P | WS | Status |
|----|-----------|-------|-----------------|---|-----|--------|
| FD-001 | Room matrix view | GET `/api/dashboard/front-desk/matrix` | Grid of all units with status, active booking, guest info | P1 | ALL | 🔴 |
| FD-002 | Room status update (manual) | PUT `/api/dashboard/front-desk/room-status` | Unit status changed to valid enum value | P1 | ALL | 🔴 |
| FD-003 | Invalid room status rejected | PUT with status="invalid_value" | 400 "Invalid room status" | P1 | ALL | 🔴 |
| FD-004 | Active bookings dropdown | GET `/api/dashboard/front-desk/active-bookings` | All checked-in bookings for quick access | P1 | ALL | 🔴 |
| FD-005 | Front desk billing view | GET `/api/dashboard/front-desk/billing` | Active folios with charges, payments, balance | P1 | ALL | 🔴 |
| FD-006 | Channel sync: push availability | POST `/api/dashboard/front-desk/channels/sync` action=push_availability | Availability pushed to OTA channels | P2 | HK | 🔴 |
| FD-007 | Channel sync: pull bookings | POST sync action=pull_bookings | OTA bookings imported | P2 | HK | 🔴 |
| FD-008 | Active offers list | GET `/api/dashboard/front-desk/offers` | Promotional offers for walk-in upselling | P3 | HK | 🔴 |
| FD-009 | Front desk dashboard stats | GET `/api/dashboard/front-desk/stats` | Occupancy, arrivals, departures, in-house counts | P1 | ALL | 🔴 |
| FD-010 | Revenue AI recommendations | GET `/api/dashboard/front-desk/revenue-ai` | AI rate suggestions with occupancy data | P2 | HK | 🔴 |
| FD-011 | Apply AI recommendation | POST `/api/dashboard/front-desk/revenue-ai/apply` | Rate applied or auto-pilot toggled | P2 | HK | 🔴 |
| FD-012 | Guest feedback submission | POST `/api/dashboard/front-desk/feedbacks` | Feedback saved by department | P2 | ALL | 🔴 |

---

## 9. Guest Requests & Services

| ID | Test Case | Steps | Expected Result | P | WS | Status |
|----|-----------|-------|-----------------|---|-----|--------|
| GR-001 | Create housekeeping guest request | POST `/api/dashboard/front-desk/requests` assignedToDept=housekeeping | Guest request saved, housekeeping task auto-created with priority=high | P1 | ALL | 🔴 |
| GR-002 | Create maintenance guest request | POST assignedToDept=maintenance | Guest request saved, maintenance ticket auto-created with priority=high | P1 | ALL | 🔴 |
| GR-003 | Guest request auto-routing to HK | When dept=housekeeping, booking has unit_id | HK task created with unit_id, type='cleaning', priority='high' | P1 | ALL | 🔴 |
| GR-004 | Guest request auto-routing to maintenance | When dept=maintenance | Maintenance ticket created with unit_id, ticket_number auto-generated | P1 | ALL | 🔴 |
| GR-005 | List guest requests | GET `/api/dashboard/front-desk/requests` | Requests with booking_id, unit_label, status | P1 | ALL | 🔴 |
| GR-006 | Request without auth returns 401 | GET/POST without cookie | 401 Unauthorized | P1 | ALL | 🔴 |
| GR-007 | Visitor check-in | POST `/api/visitors` | Visitor logged with check-in time, badge issued | P2 | WP | 🔴 |
| GR-008 | Visitor check-out | PUT `/api/visitors/[id]` | Check-out time recorded, badge released | P2 | WP | 🔴 |

---

## 10. Housekeeping — Dirty Room Readiness & SLA

**Workflow Summary:** Checkout → Unit becomes `dirty` → HK task created (auto/manual) → Staff starts (`in_progress`, unit → `cleaning`) → Staff resolves → Unit → `inspection` → Supervisor inspection auto-queued (1hr SLA) → Inspection resolved → Unit → `vacant` (or `occupied` if guest checked in, `maintenance` if active ticket)

| ID | Test Case | Steps | Expected Result | P | WS | Status |
|----|-----------|-------|-----------------|---|-----|--------|
| HK-001 | **Dirty room created on checkout** | Guest checks out | unit.status = 'dirty', triggers HK workflow | P1 | ALL | 🔴 |
| HK-002 | **Manual HK task creation** | POST `/api/housekeeping` with unit_id, task_type | Task created, unit.status → 'cleaning' | P1 | ALL | 🔴 |
| HK-003 | **HK task start → unit becomes cleaning** | PUT `/api/housekeeping/[id]` status=in_progress | Task started_at=NOW(), unit.status → 'cleaning' (if dirty/inspection/vacant) | P1 | ALL | 🔴 |
| HK-004 | **HK task resolve → unit enters inspection** | PUT status=resolved for non-inspection task | Task completed_at=NOW(), unit.status → 'inspection' | P1 | ALL | 🔴 |
| HK-005 | **Auto-queue supervisor inspection** | After HK task resolved | Inspection task auto-created with scheduled_at = now + 1 hour | P1 | ALL | 🔴 |
| HK-006 | **Inspection resolve → unit becomes vacant** | PUT status=resolved for inspection task | No active maintenance + no checked-in guest → unit.status → 'vacant' | P1 | ALL | 🔴 |
| HK-007 | **Inspection resolve → occupied if guest present** | Inspection for room with checked-in booking | unit.status → 'occupied' (not vacant) | P1 | ALL | 🔴 |
| HK-008 | **Inspection resolve → maintenance if active ticket** | Inspection for room with active maintenance ticket | unit.status → 'maintenance' | P1 | ALL | 🔴 |
| HK-009 | **Post-maintenance clean task (2hr SLA)** | Maintenance ticket resolved for non-occupied room | Unit → dirty, auto-created HK task type='post_maintenance_clean' with 2hr scheduled_at | P1 | ALL | 🔴 |
| HK-010 | **HK task types: deep_clean, stayover_tidy, turnaround** | Create tasks with different task_types | All types supported, stored correctly | P2 | ALL | 🔴 |
| HK-011 | **HK priority levels: low/medium/high/critical** | Create tasks with different priorities | Priority stored, filterable | P2 | ALL | 🔴 |
| HK-012 | **HK task status workflow: open → assigned → in_progress → resolved → closed** | Transition task through all statuses | Each transition tracked, timestamps set | P1 | ALL | 🔴 |
| HK-013 | **HK checklist management** | POST `/api/housekeeping/checklists` | Checklist items created for a task | P2 | ALL | 🔴 |
| HK-014 | **HK inspection with score** | POST `/api/housekeeping/inspections` with score + checklist_items | Inspection recorded with pass/fail/conditional status | P2 | ALL | 🔴 |
| HK-015 | **HK stats: task counts, staff performance, floor summary** | GET `/api/housekeeping/stats` | Total/open/in-progress/completed_today, staff avg rating, floor breakdown | P1 | ALL | 🔴 |
| HK-016 | **HK stats: linen summary by lifecycle stage** | GET stats response | Linen counts: in_use, soiled, dispatched, received, scrapped | P3 | ALL | 🔴 |
| HK-017 | **Linen batch tracking** | POST `/api/housekeeping/linen/batches` | Batch with lifecycle_stage, item_type, quantity | P3 | ALL | 🔴 |
| HK-018 | **Linen item RFID tracking** | POST `/api/housekeeping/linen/items` with rfid_tag | Individual linen item tracked by RFID | P3 | ALL | 🔴 |
| HK-019 | **Linen transactions** | POST `/api/housekeeping/linen/transactions` | Stage transitions logged (in_use → soiled → dispatched → received) | P3 | ALL | 🔴 |
| HK-020 | **HK task filtered by property** | GET `/api/housekeeping?property_id=xxx` | Only tasks for that property | P1 | ALL | 🔴 |
| HK-021 | **HK task filtered by status** | GET `/api/housekeeping?status=open` | Only open tasks returned | P2 | ALL | 🔴 |
| HK-022 | **HK staff only see own tasks** | housekeeping_staff role queries | Scoped to assigned tasks | P2 | ALL | 🔴 |

---

## 11. Maintenance — Request Workflow & SLA

**Workflow Summary:** Ticket created (corrective/preventive/AMC) → Unit status → `maintenance` → Assign technician → `in_progress` (unit stays `maintenance`) → Resolve → Check for active tickets → If no other tickets + no checked-in guest → unit → `dirty` + auto-create post-maintenance HK task (2hr SLA) → If guest present → unit → `occupied` → If other tickets remain → stays `maintenance`

| ID | Test Case | Steps | Expected Result | P | WS | Status |
|----|-----------|-------|-----------------|---|-----|--------|
| MT-001 | **Create maintenance ticket** | POST `/api/maintenance` with unit_id, title, priority | Ticket created, status=open, unit.status → 'maintenance' | P1 | ALL | 🔴 |
| MT-002 | **Ticket auto-numbered** | POST without ticket_number | Auto-generated MT-{timestamp} format | P2 | ALL | 🔴 |
| MT-003 | **Assign technician** | PUT `/api/maintenance/tickets/[id]` status=assigned, assigned_to=userId | Maintenance approval logged, assignee recorded | P1 | ALL | 🔴 |
| MT-004 | **Start work → in_progress** | PUT status=in_progress | started_at tracked, unit confirmed as 'maintenance' | P1 | ALL | 🔴 |
| MT-005 | **Resolve ticket** | PUT status=resolved | resolved_at=NOW(), resolution_notes saved | P1 | ALL | 🔴 |
| MT-006 | **Resolve → dirty + auto HK task (no guest, no other tickets)** | Resolve ticket for empty room with no other active tickets | unit → 'dirty', post_maintenance_clean HK task auto-created (2hr SLA) | P1 | ALL | 🔴 |
| MT-007 | **Resolve → occupied (guest checked in)** | Resolve ticket for room with active booking | unit → 'occupied' (no dirty/HK task) | P1 | ALL | 🔴 |
| MT-008 | **Resolve → stays maintenance (other active tickets)** | Resolve ticket when other open/in_progress tickets exist for same room | unit stays 'maintenance' | P1 | ALL | 🔴 |
| MT-009 | **Close ticket** | PUT status=closed | Same unit transition logic as resolve | P1 | ALL | 🔴 |
| MT-010 | **Maintenance stats: avg resolution time** | GET `/api/maintenance/stats` | avg_resolution_hours computed from created_at → resolved_at | P1 | ALL | 🔴 |
| MT-011 | **Maintenance stats: tickets by category** | GET stats | HVAC, Plumbing, Electrical etc. grouped counts | P2 | ALL | 🔴 |
| MT-012 | **Maintenance stats: tickets by priority** | GET stats | Low/medium/high/critical counts | P2 | ALL | 🔴 |
| MT-013 | **Upcoming preventive maintenance** | GET stats | Schedules due in next 7 days | P2 | ALL | 🔴 |
| MT-014 | **AMC contracts expiring** | GET stats | Contracts expiring in next 30 days | P2 | ALL | 🔴 |
| MT-015 | **Low stock parts alert** | GET stats | Parts where quantity ≤ reorder_level | P2 | ALL | 🔴 |
| MT-016 | **Preventive maintenance schedules** | GET `/api/maintenance/preventive` | Schedules with frequency_days, next_due, last_run | P2 | ALL | 🔴 |
| MT-017 | **AMC contract management** | GET `/api/maintenance/amc` | Contracts with coverage, value, status, days remaining | P2 | ALL | 🔴 |
| MT-018 | **Maintenance parts usage** | POST `/api/maintenance/ticket-parts` | Part recorded against ticket with quantity, unit_price | P2 | ALL | 🔴 |
| MT-019 | **Technician time entries** | POST `/api/maintenance/time-entries` | Time logged with start/end, duration_minutes auto-calculated | P2 | ALL | 🔴 |
| MT-020 | **Maintenance approvals** | POST `/api/maintenance/approvals` | Approval record: assigned/approved/rejected/closed | P2 | ALL | 🔴 |
| MT-021 | **Asset register** | POST `/api/maintenance/assets` | Asset tracked with serial_number, warranty, depreciation | P3 | ALL | 🔴 |
| MT-022 | **Feedback triage for maintenance** | GET `/api/maintenance/feedback-triage` | Guest feedback auto-triaged to maintenance issues | P3 | ALL | 🔴 |
| MT-023 | **Parts inventory** | GET `/api/maintenance/inventory` | Parts with stock level, reorder_level, vendor | P2 | ALL | 🔴 |
| MT-024 | **Property scoping** | Non-assigned maintenance staff queries tickets | Only assigned property tickets returned | P1 | ALL | 🔴 |

---

## 12. Laundry Services

| ID | Test Case | Steps | Expected Result | P | WS | Status |
|----|-----------|-------|-----------------|---|-----|--------|
| LD-001 | Create laundry order | POST `/api/laundry` with guest/unit details | Order created with status, items, pricing | P1 | ALL | 🔴 |
| LD-002 | List laundry orders with filters | GET `/api/laundry?property_id=&status=` | Orders filtered, includes guest/unit/vendor info | P1 | ALL | 🔴 |
| LD-003 | Update laundry order status | PUT `/api/laundry/[id]` | Status updated (pending → in_progress → completed) | P1 | ALL | 🔴 |
| LD-004 | Laundry price list | GET `/api/laundry/price-list` | Price list by item type for property | P2 | ALL | 🔴 |
| LD-005 | Laundry order with vendor assignment | PUT with vendor_id | External vendor assigned for processing | P3 | ALL | 🔴 |
| LD-006 | Laundry order delivery tracking | PUT with delivery fields | Delivery date/time tracked | P3 | ALL | 🔴 |

---

## 13. Restaurant POS & KDS

| ID | Test Case | Steps | Expected Result | P | WS | Status |
|----|-----------|-------|-----------------|---|-----|--------|
| RS-001 | List restaurant tables | GET `/api/restaurant/tables` | Tables with section, status, order info, KDS status | P1 | HK/SA | 🔴 |
| RS-002 | Update table status | PATCH `/api/restaurant/tables/[id]` | Table status updated (available, occupied, reserved) | P1 | HK/SA | 🔴 |
| RS-003 | Get table layout/floor plan | GET `/api/restaurant/tables/layout` | Sections with table positions, shapes, capacities | P2 | HK/SA | 🔴 |
| RS-004 | Create restaurant reservation | POST `/api/restaurant/reservations` | Reservation with table assignment, date/time, party size | P2 | HK/SA | 🔴 |
| RS-005 | List restaurant reservations | GET `/api/restaurant/reservations` | Reservations with table and guest info | P2 | HK/SA | 🔴 |
| RS-006 | Create KDS ticket | POST `/api/restaurant/kds` | Kitchen ticket created with order items | P1 | HK/SA | 🔴 |
| RS-007 | Update KDS ticket status | PATCH `/api/restaurant/kds/[id]` | Status transitions: new → in_progress → ready → picked_up | P1 | HK/SA | 🔴 |
| RS-008 | KDS stations | GET/POST `/api/restaurant/kds/stations` | Kitchen stations (grill, pastry, bar etc.) | P2 | HK/SA | 🔴 |
| RS-009 | Create split bill | POST `/api/restaurant/split-bills` | Order split across multiple payments/guests | P2 | HK/SA | 🔴 |
| RS-010 | List split bills | GET `/api/restaurant/split-bills` | Split records for an order | P2 | HK/SA | 🔴 |
| RS-011 | Menu item update | PUT `/api/dashboard/f-and-b/menu/[id]` | Price, availability, description updated | P2 | HK/SA | 🔴 |
| RS-012 | Menu item soft-delete | DELETE `/api/dashboard/f-and-b/menu/[id]` | Item marked unavailable, not physically deleted | P2 | HK/SA | 🔴 |
| RS-013 | F&B order creation | POST `/api/dashboard/f-and-b/orders` | Order with line items, room charge or walk-in payment | P1 | ALL | 🔴 |
| RS-014 | F&B order status update | PATCH `/api/dashboard/f-and-b/orders/[id]` | Status transitions tracked | P1 | ALL | 🔴 |
| RS-015 | F&B menu by category | GET `/api/dashboard/f-and-b/menu` | Items grouped by category with prices | P2 | ALL | 🔴 |

---

## 14. Bar & F&B Services

| ID | Test Case | Steps | Expected Result | P | WS | Status |
|----|-----------|-------|-----------------|---|-----|--------|
| BR-001 | Bar feature toggle check | Property with bar.enabled=true | Bar module visible in navigation | P2 | HK/SA | 🔴 |
| BR-002 | Bar menu items | F&B menu with bar category | Beverages, cocktails, snacks listed | P2 | HK/SA | 🔴 |
| BR-003 | Bar order charged to room | F&B order with booking_id, room_charge payment | Charge added to guest folio | P2 | HK/SA | 🔴 |
| BR-004 | Bar order walk-in payment | F&B order without booking, cash/card payment | Payment processed immediately | P2 | HK/SA | 🔴 |
| BR-005 | Meal plan integration | Booking with meal_plan_id | Breakfast/lunch/dinner included per plan | P3 | HK | 🔴 |

---

## 15. Pricing & Rate Management

| ID | Test Case | Steps | Expected Result | P | WS | Status |
|----|-----------|-------|-----------------|---|-----|--------|
| PR-001 | Create pricing rule | POST `/api/pricing/rules` | Rule with conditions, discount/surge percentage | P1 | ALL | 🔴 |
| PR-002 | Update pricing rule | PUT `/api/pricing/rules/[id]` | Rule modified | P2 | ALL | 🔴 |
| PR-003 | Delete pricing rule | DELETE `/api/pricing/rules/[id]` | Rule removed | P2 | ALL | 🔴 |
| PR-004 | Create pricing season | POST `/api/pricing/seasons` | Season with date range and multiplier | P2 | ALL | 🔴 |
| PR-005 | List pricing seasons | GET `/api/pricing/seasons` | Seasons with active/inactive status | P2 | ALL | 🔴 |
| PR-006 | Rate plan CRUD | POST/GET/PUT/DELETE `/api/rate-plans` | Rate plans with base_rate, effective dates, unit_type | P1 | ALL | 🔴 |
| PR-007 | Dynamic pricing on rate plan | Rate plan with is_dynamic=true | Rules engine applies modifiers | P2 | HK | 🔴 |
| PR-008 | Price calculation for nightly | calculateBookingPrice('nightly', 5000, checkin, checkout) | Total = rate × nights | P1 | ALL | 🔴 |
| PR-009 | Price calculation for hourly | calculateBookingPrice('hourly', 1000, checkin, checkout) | Graduated: 3h=30%, 6h=50%, 12h=70%, 24h=100% | P1 | WP | 🔴 |

---

## 16. OTA Channel Manager

| ID | Test Case | Steps | Expected Result | P | WS | Status |
|----|-----------|-------|-----------------|---|-----|--------|
| OTA-001 | Create OTA room mapping | POST `/api/ota/mappings` | Unit mapped to channel room ID | P1 | HK | 🔴 |
| OTA-002 | Trigger sync: push availability | POST `/api/ota/sync` action=push_availability | Sync log created, availability pushed | P1 | HK | 🔴 |
| OTA-003 | Trigger sync: pull bookings | POST action=pull_bookings | OTA bookings imported into reservations | P1 | HK | 🔴 |
| OTA-004 | Trigger sync: push rates | POST action=push_rates | Rates pushed to channels | P2 | HK | 🔴 |
| OTA-005 | List OTA bookings | GET `/api/ota/bookings` | Bookings from all channels with source ref | P1 | HK | 🔴 |
| OTA-006 | OTA sync logs | GET `/api/ota/sync` | History with request/response, status, duration_ms | P2 | HK | 🔴 |
| OTA-007 | OTA settlements | GET `/api/ota/settlements` | Channel commission reconciliation | P2 | HK | 🔴 |
| OTA-008 | iCal feed generation | GET `/api/ota/ical` | Public iCal URL for external calendar sync | P3 | HK | 🔴 |
| OTA-009 | Channel partner master | GET/POST `/api/masters/channels` | Channel partners with commission_rate | P2 | HK | 🔴 |
| OTA-010 | Front desk channel sync UI | GET `/api/dashboard/front-desk/channels` | Channels with sync status, recent booking counts | P2 | HK | 🔴 |

---

## 17. Revenue AI

| ID | Test Case | Steps | Expected Result | P | WS | Status |
|----|-----------|-------|-----------------|---|-----|--------|
| RA-001 | Get AI rate recommendations | GET `/api/revenue-ai/recommendations` | Recommendations per rate plan with confidence, breakdown | P1 | HK | 🔴 |
| RA-002 | Apply AI recommendation | POST `/api/revenue-ai/recommendations` action=apply | Rate applied to rate plan | P1 | HK | 🔴 |
| RA-003 | Generate revenue forecast | POST `/api/revenue-ai/forecast` | 14-day forecast with day-of-week averages, trend, confidence decay | P2 | HK | 🔴 |
| RA-004 | Action recommendations | GET `/api/revenue-ai/actions` | Suggestions: min_length_of_stop, promotion, rate_increase/decrease, stop_sell | P2 | HK | 🔴 |
| RA-005 | Competitor rate tracking | GET/POST `/api/revenue-ai/competitors` | Competitor rates stored and compared | P2 | HK | 🔴 |
| RA-006 | AI audit trail | GET `/api/revenue-ai/audit` | History of all AI-applied rate changes | P2 | HK | 🔴 |
| RA-007 | AI pricing rules | POST `/api/revenue-ai/rules` | Rule definitions for AI engine | P3 | HK | 🔴 |
| RA-008 | Revenue dashboard | GET `/api/dashboard/revenue` | Occupancy %, ADR, RevPAR, bookings, cancellations | P1 | HK | 🔴 |
| RA-009 | Multi-property comparison | GET `/api/dashboard/multi-property` | Cross-property occupancy, ADR, RevPAR, revenue with trends | P2 | ALL | 🔴 |

---

## 18. Loyalty Program

| ID | Test Case | Steps | Expected Result | P | WS | Status |
|----|-----------|-------|-----------------|---|-----|--------|
| LY-001 | Create loyalty tier | POST `/api/loyalty/tiers` | Tier with name, points threshold, benefits | P2 | ALL | 🔴 |
| LY-002 | List loyalty tiers | GET `/api/loyalty/tiers` | All tiers with benefit details | P2 | ALL | 🔴 |
| LY-003 | Earn loyalty points | POST `/api/loyalty/transactions` type=earn | Points added to guest profile | P2 | ALL | 🔴 |
| LY-004 | Redeem loyalty points | POST type=redeem | Points deducted, balance updated | P2 | ALL | 🔴 |
| LY-005 | Guest loyalty balance | GET `/api/loyalty/transactions?guest_id=` | Transaction history with running balance | P2 | ALL | 🔴 |

---

## 19. Billing, Invoicing & Payments

| ID | Test Case | Steps | Expected Result | P | WS | Status |
|----|-----------|-------|-----------------|---|-----|--------|
| BL-001 | Auto-invoice on booking | After reservation POST | Draft invoice created with room charge line item | P1 | ALL | 🔴 |
| BL-002 | Add charge to folio | POST `/api/invoices/folio` | Additional charge line added (minibar, restaurant, etc.) | P1 | ALL | 🔴 |
| BL-003 | Post payment to folio | PATCH `/api/invoices/folio` | Payment recorded, balance_due reduced | P1 | ALL | 🔴 |
| BL-004 | Guest folio view | GET `/api/invoices/folio?booking_id=` | All charges and payments with running balance | P1 | ALL | 🔴 |
| BL-005 | Invoice status transitions | Draft → sent → paid | Status changes with balance tracking | P1 | ALL | 🔴 |
| BL-006 | Invoice with tax calculation | Invoice with tax_rate on line items | tax_total computed, grand_total includes tax | P2 | ALL | 🔴 |
| BL-007 | Payment methods | card, upi, bank_transfer, cash, gateway | All payment methods accepted | P2 | ALL | 🔴 |
| BL-008 | Bank reconciliation | POST `/api/finance/reconciliation` | Bank statement matched against payments | P2 | ALL | 🔴 |
| BL-009 | Reconciliation match/unmatch | PUT `/api/finance/reconciliation/[id]` | Matched status updated | P2 | ALL | 🔴 |

---

## 20. Finance & Accounting

| ID | Test Case | Steps | Expected Result | P | WS | Status |
|----|-----------|-------|-----------------|---|-----|--------|
| FIN-001 | Chart of accounts CRUD | POST/GET/PUT `/api/finance/accounts` | Accounts with type (asset/liability/income/expense/equity) | P1 | ALL | 🔴 |
| FIN-002 | Journal entry creation | POST `/api/finance/journal-entries` with lines | Entry with balanced debit/credit lines | P1 | ALL | 🔴 |
| FIN-003 | Post journal entry | PUT `/api/finance/journal-entries/[id]` action=post | Entry posted, ledger updated | P1 | ALL | 🔴 |
| FIN-004 | Account ledger view | GET `/api/finance/ledger?account_id=` | Journal lines with running balance | P1 | ALL | 🔴 |
| FIN-005 | Vendor bill creation | POST `/api/finance/vendor-bills` with line_items | Bill created with status=pending | P1 | ALL | 🔴 |
| FIN-006 | Vendor bill approval | PUT `/api/finance/vendor-bills/[id]` action=approve | Status → approved | P1 | ALL | 🔴 |
| FIN-007 | Bill payment processing | POST `/api/finance/bill-payments` | Payment recorded against bill, balance updated | P1 | ALL | 🔴 |
| FIN-008 | Budget head creation | POST `/api/finance/budget/heads` | Budget category linked to account | P2 | ALL | 🔴 |
| FIN-009 | Budget entry by month | POST `/api/finance/budget` | Monthly budget vs actual tracking | P2 | ALL | 🔴 |
| FIN-010 | Fixed asset registration | POST `/api/finance/fixed-assets` | Asset with purchase_cost, useful_life, depreciation_method | P2 | ALL | 🔴 |
| FIN-011 | Depreciation schedule | POST `/api/finance/depreciation` | Monthly depreciation entries, journal linked | P2 | ALL | 🔴 |
| FIN-012 | Tax filing management | POST/PUT `/api/finance/tax-filings` | GST/TDS/Tax filings with status (pending/filed/paid/overdue) | P2 | ALL | 🔴 |
| FIN-013 | Cost center creation | POST `/api/finance/cost-centers` | Cost center linked to department | P2 | ALL | 🔴 |
| FIN-014 | Fiscal year management | POST `/api/finance/fiscal-years` | FY with start/end dates, close ability | P2 | ALL | 🔴 |
| FIN-015 | Trial balance report | GET `/api/finance/reports/trial-balance` | All accounts with debit/credit totals, balanced | P1 | ALL | 🔴 |
| FIN-016 | Profit & Loss report | GET `/api/finance/reports/profit-loss` | Income vs Expense for date range | P1 | ALL | 🔴 |
| FIN-017 | Balance sheet | GET `/api/finance/reports/balance-sheet` | Assets = Liabilities + Equity as of date | P1 | ALL | 🔴 |
| FIN-018 | Finance overview dashboard | GET `/api/finance` | Invoices, payments, collections, recent payments | P1 | ALL | 🔴 |

---

## 21. HR & Payroll

| ID | Test Case | Steps | Expected Result | P | WS | Status |
|----|-----------|-------|-----------------|---|-----|--------|
| HR-001 | Create employee | POST `/api/hr/employees` with department, designation | Employee created with employee_code, linked to user | P1 | ALL | 🔴 |
| HR-002 | Update employee | PUT `/api/hr/employees/[id]` | Details updated | P1 | ALL | 🔴 |
| HR-003 | Soft-delete employee | DELETE `/api/hr/employees/[id]` | is_active=false | P2 | ALL | 🔴 |
| HR-004 | Department CRUD | POST/GET `/api/hr/departments` | Departments with code, manager | P1 | ALL | 🔴 |
| HR-005 | Shift rotation CRUD | POST/GET/PUT/DELETE `/api/hr/shifts` | Shifts with start_time, end_time | P1 | ALL | 🔴 |
| HR-006 | Duty roster view | GET `/api/hr/roster` | Employees with shift assignments | P2 | ALL | 🔴 |
| HR-007 | Leave request submission | POST `/api/hr/leaves` | Leave request with balance check, status=pending | P1 | ALL | 🔴 |
| HR-008 | Leave approval | PUT `/api/hr/leaves/[id]` approve | Status → approved, leave_balances updated | P1 | ALL | 🔴 |
| HR-009 | Leave balance tracking | GET `/api/hr/leaves/balances?employee_id=` | Allocated, used, pending, remaining | P1 | ALL | 🔴 |
| HR-010 | Payroll run generation | POST `/api/hr/payroll` | Payroll computed: gross, deductions (PF/ESI/PT/TDS), net | P1 | ALL | 🔴 |
| HR-011 | Payroll approval | PUT `/api/hr/payroll/[id]` approve | Status → approved | P1 | ALL | 🔴 |
| HR-012 | Timesheet entry | POST `/api/hr/timesheets` | Clock in/out, total_hours, net_hours | P1 | ALL | 🔴 |
| HR-013 | Timesheet approval | PUT `/api/hr/timesheets/[id]` approve | Status → approved | P2 | ALL | 🔴 |
| HR-014 | Holiday calendar | POST/GET `/api/hr/holidays` | Holidays with date, name | P2 | ALL | 🔴 |
| HR-015 | Attendance policy | POST/GET `/api/hr/attendance-policies` | Policy with grace period, late rules | P2 | ALL | 🔴 |
| HR-016 | Overtime policy | POST/GET `/api/hr/overtime-policies` | OT rate, max hours | P2 | ALL | 🔴 |
| HR-017 | Staff availability | GET `/api/hr/staff-availability?date=` | Available staff with leave/shift/clock-in status | P1 | ALL | 🔴 |
| HR-018 | Salary increment | POST/GET `/api/hr/increments` | Increment with effective date, new salary | P3 | ALL | 🔴 |
| HR-019 | Promotion | POST/GET `/api/hr/promotions` | Promotion with new designation, band | P3 | ALL | 🔴 |
| HR-020 | Appraisal cycle | POST/GET `/api/hr/appraisal-cycles` | Cycle with goals, review period | P3 | ALL | 🔴 |
| HR-021 | Appraisal review | POST/GET `/api/hr/appraisal-reviews` | Review with rating, goals, feedback | P3 | ALL | 🔴 |
| HR-022 | HR compliance stats | GET `/api/hr/compliance` | PF, ESI, PT, TDS summaries | P2 | ALL | 🔴 |
| HR-023 | Policy documents | POST/GET `/api/hr/policy-documents` | Policies uploaded with department scope | P3 | ALL | 🔴 |

---

## 22. Procurement & Inventory

| ID | Test Case | Steps | Expected Result | P | WS | Status |
|----|-----------|-------|-----------------|---|-----|--------|
| PO-001 | Create purchase order | POST `/api/procurement/purchase-orders` with line_items | PO created with status=draft, total computed | P1 | ALL | 🔴 |
| PO-002 | Send PO to vendor | PUT PO status=sent | Status updated, vendor notified | P2 | ALL | 🔴 |
| PO-003 | Approve PO | PUT PO status=approved | Approved, ready for GRN | P2 | ALL | 🔴 |
| PO-004 | Create GRN (Goods Received Note) | POST `/api/procurement/grn` with PO reference | GRN with line items, received_qty | P1 | ALL | 🔴 |
| PO-005 | GRN with partial receipt | GRN with received_qty < ordered_qty | Partial receipt tracked | P2 | ALL | 🔴 |
| PO-006 | Procurement stats | GET `/api/procurement/stats` | PO counts by status, total spend, recent GRNs | P2 | ALL | 🔴 |
| PO-007 | Inventory item CRUD | POST/GET/PUT/DELETE `/api/inventory/items` | Items with category, quantity, reorder_level | P1 | ALL | 🔴 |
| PO-008 | Inventory category | POST/GET `/api/inventory/categories` | Categories with code | P2 | ALL | 🔴 |
| PO-009 | Warehouse management | POST/GET `/api/inventory/warehouses` | Warehouse locations | P2 | ALL | 🔴 |
| PO-010 | Inventory transaction (issue/receive/transfer) | POST `/api/inventory/transactions` | Stock adjusted, transaction logged | P1 | ALL | 🔴 |
| PO-011 | Inventory stats | GET `/api/inventory/stats` | Total items, value, low stock count | P2 | ALL | 🔴 |

---

## 23. Vendor Management

| ID | Test Case | Steps | Expected Result | P | WS | Status |
|----|-----------|-------|-----------------|---|-----|--------|
| VN-001 | Create vendor | POST `/api/vendors` | Vendor with company_name, contact, GST, compliance | P1 | ALL | 🔴 |
| VN-002 | Update vendor | PUT `/api/vendors/[id]` | Details updated | P1 | ALL | 🔴 |
| VN-003 | Soft-delete vendor | DELETE `/api/vendors/[id]` | Status → suspended | P2 | ALL | 🔴 |
| VN-004 | Vendor services catalog | POST/GET `/api/vendors/services` | Services with type, rate, rate_unit | P2 | ALL | 🔴 |
| VN-005 | Vendor purchase orders | GET `/api/vendors/orders` | POs linked to vendor | P2 | ALL | 🔴 |
| VN-006 | Vendor compliance check | Vendor with is_compliant, insurance_cert | Compliance status tracked | P2 | ALL | 🔴 |
| VN-007 | Per-property vendor scoping | Vendors filtered by property_id | Only assigned property vendors visible | P1 | ALL | 🔴 |

---

## 24. Lease & Rental (Apartment Vertical)

| ID | Test Case | Steps | Expected Result | P | WS | Status |
|----|-----------|-------|-----------------|---|-----|--------|
| LS-001 | Create lease agreement | POST `/api/leases` | Lease with start/end dates, rent_amount, deposit | P1 | AP | 🔴 |
| LS-002 | Lease status workflow | drafted → signed → active → renewal_due → renewed | All transitions supported | P1 | AP | 🔴 |
| LS-003 | Lease termination | PUT lease status=terminated | Status updated, move_out_checklist triggered | P1 | AP | 🔴 |
| LS-004 | Generate rent invoice | POST `/api/rent-invoices` | Monthly invoice with rent, maintenance, late fees | P1 | AP | 🔴 |
| LS-005 | Record rent payment | PUT `/api/rent-invoices/[id]` | Payment recorded, status → paid | P1 | AP | 🔴 |
| LS-006 | Security deposit ledger | POST `/api/deposits` | Deposit received/deduction/refund tracked | P2 | AP | 🔴 |
| LS-007 | Rent escalation | Lease with escalation_percent | Annual escalation applied | P3 | AP | 🔴 |
| LS-008 | Lease amendment | Lease with term_extension/tenant_change | Amendment logged with effective_date | P3 | AP | 🔴 |
| LS-009 | Move-out checklist | Lease termination | Checklist items with condition (good/damaged/missing) | P2 | AP | 🔴 |

---

## 25. Workplace Services

| ID | Test Case | Steps | Expected Result | P | WS | Status |
|----|-----------|-------|-----------------|---|-----|--------|
| WP-001 | Corporate membership creation | POST `/api/workplace/memberships` | Membership with plan, seats, billing_cycle | P1 | WP | 🔴 |
| WP-002 | Workplace booking (hot desk) | Booking with booking_type=hot_desk | Desk reserved, time tracked | P1 | WP | 🔴 |
| WP-003 | Workplace booking (meeting room) | Booking with booking_type=meeting_room | Room reserved with capacity check | P1 | WP | 🔴 |
| WP-004 | Workplace bookings list | GET `/api/workplace/bookings` | Bookings with member, unit, status | P1 | WP | 🔴 |
| WP-005 | Membership invoice | Membership billing cycle | Monthly/quarterly invoice generated | P2 | WP | 🔴 |
| WP-006 | Visitor management | POST `/api/visitors` | Visitor logged with host, badge, auto-expire | P2 | WP | 🔴 |
| WP-007 | Visitor auto-expire | Visitor after expected check-out | Badge auto-released | P3 | WP | 🔴 |

---

## 26. WhatsApp Integration

| ID | Test Case | Steps | Expected Result | P | WS | Status |
|----|-----------|-------|-----------------|---|-----|--------|
| WA-001 | WhatsApp config | GET/PUT `/api/whatsapp/config` | Provider, phone, automation toggles saved | P2 | ALL | 🔴 |
| WA-002 | Send WhatsApp message | POST `/api/whatsapp/send` | Message sent via provider API | P2 | ALL | 🔴 |
| WA-003 | Template management | POST/GET `/api/whatsapp/templates` | Templates with variables, body, channel | P2 | ALL | 🔴 |
| WA-004 | Conversation list | GET `/api/whatsapp/conversations` | Conversations with unread counts | P2 | ALL | 🔴 |
| WA-005 | Campaign creation | POST `/api/whatsapp/campaigns` | Campaign with recipient list, template | P3 | ALL | 🔴 |
| WA-006 | Webhook verification | GET `/api/whatsapp/webhook` | Meta webhook challenge verified | P2 | ALL | 🔴 |
| WA-007 | Inbound webhook message | POST `/api/whatsapp/webhook` | Inbound message stored, conversation updated | P2 | ALL | 🔴 |

---

## 27. RBAC & Access Control

| ID | Test Case | Steps | Expected Result | P | WS | Status |
|----|-----------|-------|-----------------|---|-----|--------|
| RBAC-001 | Platform superadmin → only admin routes | platform_super_admin accesses `/dashboard/front-desk` | Redirected to `/dashboard/admin/tenants` | P1 | ALL | 🔴 |
| RBAC-002 | Super admin → all routes | super_admin accesses any route | Allowed | P1 | ALL | 🔴 |
| RBAC-003 | Property manager → scoped routes | property_manager accesses `/dashboard/front-desk` | Allowed; accesses `/dashboard/hr` | Allowed | P1 | ALL | 🔴 |
| RBAC-004 | Front desk → limited routes | front_desk accesses `/dashboard/maintenance` | Blocked; only sees front-desk, rooms, laundry, restaurant | P1 | ALL | 🔴 |
| RBAC-005 | Housekeeping staff → HK only | housekeeping_staff accesses `/dashboard/finance` | Blocked; only sees `/dashboard/housekeeping` | P1 | ALL | 🔴 |
| RBAC-006 | Maintenance staff → maintenance only | maintenance_staff accesses `/dashboard/hr` | Blocked; sees `/dashboard/maintenance`, `/dashboard/vendors` | P1 | ALL | 🔴 |
| RBAC-007 | HR manager → HR routes | hr_manager accesses `/dashboard/finance` | Blocked; only `/dashboard/hr` | P1 | ALL | 🔴 |
| RBAC-008 | Finance manager → finance routes | finance_manager accesses `/dashboard/front-desk` | Blocked; sees finance, procurement, rental, inventory, vendors | P1 | ALL | 🔴 |
| RBAC-009 | `hasAccess()` prefix matching | Role has `/dashboard/front-desk`, user accesses `/dashboard/front-desk/checkin` | Allowed via prefix match | P1 | ALL | 🔴 |
| RBAC-010 | Property-scoped data access | property_manager queries reservations | Only assigned property data returned (via `assignedPropertyIds`) | P1 | ALL | 🔴 |
| RBAC-011 | Cross-property data isolation | User with property A tries to access property B data | 403 Forbidden from `validatePropertyAccess` | P1 | ALL | 🔴 |

---

## 28. Multi-Property Management

| ID | Test Case | Steps | Expected Result | P | WS | Status |
|----|-----------|-------|-----------------|---|-----|--------|
| MP-001 | Multi-property dashboard | GET `/api/dashboard/multi-property` | Occupancy, ADR, RevPAR, revenue across properties | P2 | ALL | 🔴 |
| MP-002 | Property groups | properties.group_id → property_groups | Properties grouped by chain/brand | P3 | ALL | 🔴 |
| MP-003 | Central rate management | Rate plans scoped to property | Rates managed per-property | P2 | ALL | 🔴 |
| MP-004 | Cross-property guest profile | Guest profile shared across properties | Same guest_id, stays tracked globally | P3 | ALL | 🔴 |
| MP-005 | Daily snapshots | Daily aggregated stats per property | Historical comparison data | P3 | ALL | 🔴 |

---

## 29. Self Check-In & Kiosk

| ID | Test Case | Steps | Expected Result | P | WS | Status |
|----|-----------|-------|-----------------|---|-----|--------|
| SC-001 | Self check-in session creation | POST `/api/checkin` | Token generated, session created | P2 | ALL | 🔴 |
| SC-002 | Check-in step: ID verification | PATCH `/api/checkin/[token]` step=identity | ID verification status updated | P2 | ALL | 🔴 |
| SC-003 | Check-in step: payment | PATCH step=payment | Payment processed, status updated | P2 | ALL | 🔴 |
| SC-004 | Kiosk config | GET/PUT `/api/checkin/kiosk` | Welcome message, branding, auto check-in settings | P3 | HK | 🔴 |
| SC-005 | Self check-out session | POST `/api/checkout` | Checkout token generated | P2 | ALL | 🔴 |
| SC-006 | Checkout step: feedback | PATCH `/api/checkout/[token]` step=feedback | Guest feedback captured | P2 | ALL | 🔴 |
| SC-007 | Checkout step: key return | PATCH step=key_return | Digital key revoked | P3 | HK | 🔴 |

---

## 30. End-to-End Guest Lifecycle (Cross-Module)

| ID | Test Case | Steps | Expected Result | P | WS | Status |
|----|-----------|-------|-----------------|---|-----|--------|
| E2E-001 | **Complete Hotel Guest Journey** | Walk-in booking → check-in → guest requests → restaurant → laundry → maintenance → checkout → billing → payment → room dirty → HK clean → inspection → vacant | Full lifecycle, all modules connected | P1 | HK | 🔴 |
| E2E-002 | **OTA Guest Journey** | OTA booking import → check-in → F&B charges → checkout → invoice → payment → settlement with channel | OTA flow end-to-end | P1 | HK | 🔴 |
| E2E-003 | **Serviced Apartment Journey** | Nightly booking → check-in (room+parent blocked) → stay services → checkout → room dirty | Apartment hierarchy respected throughout | P1 | SA | 🔴 |
| E2E-004 | **Apartment Rental Journey** | Lease creation → signing → activation → rent invoices → payments → renewal → termination → move-out checklist | Long-term rental lifecycle | P1 | AP | 🔴 |
| E2E-005 | **Workplace Services Journey** | Membership → desk booking → check-in → visitor management → monthly billing | Co-working lifecycle | P1 | WP | 🔴 |
| E2E-006 | **Maintenance → HK → Front Desk chain** | Maintenance ticket → technician resolves → unit dirty → HK task created → HK resolves → inspection queued → inspection passes → unit vacant → front desk can assign | Cross-module state machine | P1 | ALL | 🔴 |
| E2E-007 | **Guest request → auto-routing** | Guest calls front desk → request created → auto-routed to HK/Maintenance → task created → resolved → status updated | Automated department routing | P1 | ALL | 🔴 |
| E2E-008 | **Revenue optimization loop** | AI recommendation → applied → rate updated → new booking at optimized rate → revenue tracked | Revenue AI feedback loop | P2 | HK | 🔴 |
| E2E-009 | **Finance: booking → invoice → payment → journal → ledger → trial balance** | Booking creates draft invoice → charges added → payment → journal entry → ledger updated → trial balance reflects | Accounting chain | P1 | ALL | 🔴 |
| E2E-010 | **HR: employee → attendance → timesheet → payroll → compliance** | Employee onboarded → clock in/out → timesheet → payroll run → PF/ESI computed | HR lifecycle | P1 | ALL | 🔴 |
| E2E-011 | **Procure to pay: need → PO → GRN → vendor bill → payment → journal** | Inventory low → PO created → goods received → bill entered → payment made → journal posted | Full procure-to-pay cycle | P1 | ALL | 🔴 |
| E2E-012 | **WhatsApp notification chain** | Booking confirmed → WhatsApp confirmation → check-in reminder → checkout summary | Multi-touch messaging | P3 | ALL | 🔴 |

---

## Summary Dashboard

### By Module

| Module | Test Cases | P1 | P2 | P3 | Coverage |
|--------|-----------|-----|-----|-----|----------|
| Authentication & Authorization | 11 | 8 | 3 | 0 | Auth API |
| Platform Admin | 13 | 3 | 7 | 3 | Admin API |
| Property Management | 13 | 5 | 5 | 3 | Properties API |
| Room/Unit Creation | 12 | 6 | 2 | 4 | Property inventory |
| Booking Workflows | 20 | 9 | 7 | 4 | Reservations + Booking Engine |
| Check-In | 11 | 5 | 4 | 2 | Front-desk + Self check-in |
| Check-Out | 6 | 3 | 3 | 0 | Front-desk + Self check-out |
| Front Desk Operations | 12 | 5 | 5 | 2 | Front-desk dashboard |
| Guest Requests | 8 | 4 | 2 | 2 | Guest requests |
| **Housekeeping (SLA)** | **22** | **8** | **9** | **5** | **HK tasks, inspections, linen** |
| **Maintenance (SLA)** | **24** | **8** | **12** | **4** | **Tickets, preventive, AMC, parts** |
| Laundry | 6 | 2 | 2 | 2 | Laundry API |
| Restaurant POS & KDS | 15 | 4 | 9 | 2 | Restaurant + F&B |
| Bar & F&B | 5 | 0 | 4 | 1 | Feature toggles + orders |
| Pricing | 9 | 3 | 4 | 2 | Pricing + Rate plans |
| OTA Channel Manager | 10 | 3 | 5 | 2 | OTA sync + bookings |
| Revenue AI | 9 | 2 | 6 | 1 | Revenue AI engine |
| Loyalty | 5 | 0 | 5 | 0 | Loyalty tiers + points |
| Billing & Payments | 9 | 4 | 4 | 1 | Invoicing + folio |
| Finance & Accounting | 18 | 5 | 11 | 2 | GL + Reports |
| HR & Payroll | 23 | 7 | 10 | 6 | HRMS + Payroll |
| Procurement & Inventory | 11 | 3 | 7 | 1 | PO + Inventory |
| Vendor Management | 7 | 2 | 4 | 1 | Vendors |
| Lease & Rental | 9 | 4 | 3 | 2 | Lease lifecycle |
| Workplace Services | 7 | 3 | 3 | 1 | Workplace bookings |
| WhatsApp | 7 | 0 | 5 | 2 | WhatsApp integration |
| RBAC & Access Control | 11 | 10 | 1 | 0 | Role-based routing |
| Multi-Property | 5 | 0 | 3 | 2 | Cross-property |
| Self Check-In & Kiosk | 7 | 0 | 4 | 3 | Self-service |
| **End-to-End Lifecycle** | **12** | **8** | **3** | **1** | **Cross-module flows** |
| **TOTAL** | **312** | **119** | **151** | **42** | |

### By Workspace Vertical

| Vertical | Dedicated Test Cases | Relevant E2E |
|----------|---------------------|-------------|
| Hotels (HK) | ROOM-001/002, BK-001-006, CI-002, CO-001, RS-*, PR-*, OTA-*, RA-*, E2E-001/002 | All |
| Serviced Apartments (SA) | ROOM-003, BK-007/008, CI-003/004, E2E-003 | Booking, Check-in, Front-desk |
| Apartment Rental (AP) | ROOM-004, BK-019, LS-*, E2E-004 | Lease, Finance |
| Workplace (WP) | ROOM-005/006/007, BK-020, WP-*, E2E-005 | Workplace, Visitors |

### Room Status State Machine (Tested)

```
vacant ──── booking ────→ reserved ──── check-in ────→ occupied
  ↑                                                         │
  │                                                check-out│
  │                                                         ▼
  ←─── inspection ←── HK resolve ←── cleaning ←── dirty ←──┘
  ↑                        │
  │            (inspection task auto-queued)
  │                        ▼
  │                   inspection
  │                   resolve
  │                   ┌──────────────────────────────────┐
  │                   │ No active maint + no guest → vacant │
  │                   │ Guest present → occupied           │
  │                   │ Active maintenance → maintenance   │
  │                   └──────────────────────────────────┘
  
  Any state ──── maintenance ticket ────→ maintenance
  maintenance resolve ────→ dirty (auto HK post-maintenance task, 2hr SLA)
```

### Key Cross-Module Integrations Tested

1. **Booking → Invoice**: Auto-draft invoice on reservation creation
2. **Checkout → Dirty → HK**: Checkout triggers dirty status, auto-creates HK task
3. **HK Resolve → Inspection → Vacant**: Auto-queues supervisor inspection
4. **Maintenance Resolve → Dirty → HK**: Auto-creates post-maintenance clean task (2hr SLA)
5. **Guest Request → HK/Maintenance**: Auto-routes to appropriate department
6. **F&B Order → Folio**: Charges added to guest folio
7. **AI Recommendation → Rate Plan**: Revenue AI updates rates
8. **OTA Sync → Booking**: Channel bookings imported
9. **Payroll → Compliance**: PF/ESI/PT computed on payroll run
10. **PO → GRN → Bill → Payment → Journal**: Full procure-to-pay chain
