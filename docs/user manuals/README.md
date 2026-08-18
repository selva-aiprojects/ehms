# eHMS Workspace Feature User Manuals

Welcome to the comprehensive User Manual library for **eHMS (Enterprise Hospitality Management System)**. This documentation directory contains dedicated, feature-by-feature operational guides designed for system administrators, department heads, managers, and operational staff.

---

## 📚 Table of Contents

| Manual ID | Workspace Feature Module | Target Audience / Roles | Description & Coverage |
| :--- | :--- | :--- | :--- |
| **[Manual 01](01-front-desk-operations.md)** | **Front Desk & Guest Operations** | Front Desk Staff, Property Managers, Super Admins | Command Center, Reservations Calendar, Guest Profiles, Check-In/Out, Folios & Billing, F&B Pantry, Guest Requests, Feedback & QR Self-Service. |
| **[Manual 02](02-hotels-and-serviced-apartments.md)** | **Hotels & Serviced Apartments** | Property Managers, Revenue Managers, Front Desk | Hotel management, Serviced Apartments operations, Room & Unit inventory, Category mapping, Dynamic rate cards & Feature toggles. |
| **[Manual 03](03-apartment-rental-management.md)** | **Apartment Long-Term Rental** | Property Managers, Leasing Agents, Finance Managers | Long-term residential rental, Tenant onboarding, Lease agreements, Automated monthly rent invoicing, Security deposits & Refund tracking. |
| **[Manual 04](04-workplace-and-facility-services.md)** | **Workplace & Facility Services** | Facility Managers, Desk Managers, Security Staff | Office & co-working desk management, Membership plans, Visitor pass issuance, Security access logs, Desk allocations & Hot-desking. |
| **[Manual 05](05-housekeeping-operations.md)** | **Housekeeping Operations** | HK Supervisors, HK Staff, Property Managers | Real-time room cleaning matrix, Task assignment & tracking, Linen & guest supplies inventory, Quality inspections & Staff roster. |
| **[Manual 06](06-maintenance-and-asset-management.md)** | **Maintenance & Asset Operations** | Maintenance Supervisors, Technicians, Facility Managers | Work orders & ticket dispatch, Spare parts inventory, Fixed asset registry, Preventive maintenance scheduling & Equipment history. |
| **[Manual 07](07-finance-and-accounting.md)** | **Finance & Accounts Module** | Finance Managers, Accountants, Executives, Super Admins | Chart of Accounts, Journal entries, General Ledger, Accounts Receivable (AR), Accounts Payable (AP/Bills), Budgets, Tax Filings, Fixed Asset Depreciation, Bank Reconciliation & Financial Reports (Trial Balance, P&L, Balance Sheet). |
| **[Manual 08](08-hrms-and-payroll.md)** | **HRMS & Payroll Module** | HR Managers, Executives, Department Managers | Employee directory, Attendance & Timesheets, Leave management, Shift rotations, Automated payroll execution, Salary slips, Statutory compliance (PF/ESI/TDS), Performance appraisals & HR policies. |
| **[Manual 09](09-procurement-and-vendors.md)** | **Procurement & Vendor Operations** | Procurement Officers, Vendor Managers, Finance Managers | Vendor directory, Purchase Orders (PO), Goods Receipt Notes (GRN), Vendor Services catalog & Vendor purchase orders. |
| **[Manual 10](10-inventory-and-warehousing.md)** | **Inventory & Stock Management** | Warehouse Managers, Inventory Clerks, Department Supervisors | Master item catalog, Multi-warehouse storage, Stock transactions (Inward/Outward/Transfer/Adjustment) & Category hierarchy. |
| **[Manual 11](11-revenue-management-and-ai-pricing.md)** | **Revenue Management & AI Pricing** | Revenue Managers, Executives, Super Admins | Dynamic revenue dashboard, AI pricing engine recommendations, Rate card rules, Loyalty program, OTA channel manager & WhatsApp guest engagement. |
| **[Manual 12](12-restaurant-pos-and-fnb.md)** | **Restaurant POS & Kitchen Operations** | F&B Staff, Kitchen Staff, Front Desk, Restaurant Managers | Restaurant POS table ordering, Kitchen Display System (KDS) order routing, Menu catalog & Price category management. |
| **[Manual 13](13-workspace-and-system-admin.md)** | **Workspace & System Administration** | Super Admins, Property Managers, Platform Superadmin | Multi-tenant schema sharding, Multi-property setup & Feature toggles, Role-Based Access Control (RBAC), Audit trail logs, Backup & Restore, Session management, Compliance & Support ticketing. |

---

## 🔑 Business Verticals & Scope Matrix

eHMS operates on strict business vertical isolation. Features and navigation adapt according to the active vertical context selected during login:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      ACTIVE VERTICAL JOURNEY                            │
├───────────────┬───────────────────────┬───────────────────┬─────────────┤
│ 🏨 HOTELS     │ 🏬 SERVICED APTS      │ 🏢 APARTMENT RENT │ 💼 WORKPLACE│
├───────────────┼───────────────────────┼───────────────────┼─────────────┤
│ • Command Ctr │ • Command Ctr         │ • Leases & Rent   │ • Desk Alloc│
│ • Rooms & Rates│ • Unit Inventory     │ • Tenant Invoices │ • Visitor Pass│
│ • HK & Maint  │ • HK & Maintenance    │ • Security Deposit│ • Memberships│
│ • Restaurant POS│ • Linen & Pantry    │ • Maintenance     │ • Security Log│
│ • Finance/HR  │ • Finance & HRMS      │ • Finance & HRMS  │ • Finance/HR│
└───────────────┴───────────────────────┴───────────────────┴─────────────┘
```

---

## 🛠 Support & Escalation

For operational issues or feature questions not covered in these manuals:
- **In-App Ticketing**: Navigate to **Admin -> My Tickets** (`/dashboard/tickets`) or **Support Tickets** (`/dashboard/admin/tickets`).
- **Emergency System Support**: Contact your Platform Superadmin at `admin@ehms.co`.

---
*Document Version: 2.5 | System Release: eHMS Production 2026*
