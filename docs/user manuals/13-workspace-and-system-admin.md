# Manual 13: Workspace & System Administration

## 📌 Module Overview

The **Workspace & System Administration** module is the backbone of the eHMS platform. It enables Multi-Tenant Schema Sharding, Property/Workspace Provisioning, Role-Based Access Control (RBAC), Audit Trail logging, Automated Database Backups, User Management, Active Session Monitoring, System Compliance, and Support Ticketing.

---

## 🎯 Key Features & Capabilities

- **Multi-Tenant Shard Provisioning**: Isolated PostgreSQL database schemas per organization (e.g., `viswa`, `grt`) ensuring 100% data separation.
- **Multi-Property Workspace Setup**: Workspace creation with custom feature toggles, timezone, currency, and address configurations.
- **Role-Based Access Control (RBAC)**: Fine-grained permission assignments per user role (`super_admin`, `property_manager`, `front_desk`, `housekeeping_supervisor`, `hr_manager`, `finance_manager`, etc.).
- **Immutable Audit Trail**: Security log recording every mutation event (user logins, folio voids, room rate changes, payroll runs, DB updates) with IP address and timestamp.
- **Database Backup & Disaster Recovery**: Automated scheduled backups, manual snapshot generation, and one-click database restoration jobs.
- **User & Session Management**: User account creation, role assignment, password resets, active session termination, and login attempt tracking.
- **System Broadcasts & Support Tickets**: Platform-wide announcement popups and ticketing workflow for technical support.

---

## 🧭 Sub-Modules & Operating Procedures

### 1. Admin Dashboard (`/dashboard/admin`)
- **Navigation**: Sidebar -> Administration -> **Admin**
- **Operating Instructions**:
  1. Overview Metrics: Total Workspaces, Active Users, Active Sessions, Open System Tickets, System Health Status, Database Storage Used.
  2. Quick navigation tiles to System Administration sub-modules.

### 2. Tenant Shard Management (`/dashboard/admin/tenants`)
- **Navigation**: Sidebar -> Administration -> **Tenants**
- **Target Audience**: **Platform Superadmin** (`admin@ehms.co`)
- **Operating Instructions**:
  1. Click **Provision New Tenant Shard**.
  2. Enter Organization Name, Tenant Code (e.g., `VISWA`), Primary Admin Email, Subscribed Verticals (`hotels`, `apartments`, `rental`, `workplace`).
  3. Define Workspaces Array (`[{ type: 'hotels', name: 'Grand Resort', is_primary: true }]`).
  4. System executes `provision_tenant_schema()`, creating isolated DB schema, tables, default demo users, and seeds.

### 3. Workspaces & Properties (`/dashboard/admin/properties`)
- **Navigation**: Sidebar -> Administration -> **Workspaces**
- **Operating Instructions**:
  1. View list of physical workspace properties in the tenant shard.
  2. Click **Create Property Workspace**:
     - Name, Address, Timezone (`Asia/Kolkata`, `America/New_York`, etc.), Currency (`INR`, `USD`).
     - Configure Feature Toggles (`rooms_map`, `rate_card`, `restaurant`, `laundry`, `maintenance`, `gym`, `spa`, etc.).
  3. Click **Save Workspace**.

### 4. Role-Based Access Control - RBAC (`/dashboard/admin/roles`)
- **Navigation**: Sidebar -> Administration -> **Roles**
- **Operating Instructions**:
  1. View system role definitions and permitted route mappings (`lib/role-access.ts`).
  2. Assign permitted workspace routes per role.
  3. Restrict sensitive operational actions (e.g., Folio Voids, Budget Overrides) to designated management roles.

### 5. Audit Trail (`/dashboard/admin/audit`)
- **Navigation**: Sidebar -> Administration -> **Audit Trail**
- **Operating Instructions**:
  1. Search security logs by User Email, IP Address, Action Type (`INSERT`, `UPDATE`, `DELETE`, `LOGIN`), or Date Range.
  2. View exact JSON payload changes (Before vs. After state diffs).
  3. Export audit logs for statutory compliance audits.

### 6. System Backup & Restore (`/dashboard/admin/backup`)
- **Navigation**: Sidebar -> Administration -> **Backup**
- **Operating Instructions**:
  1. View historical database backup jobs.
  2. Click **Create Instant Backup**: System creates an encrypted snapshot of the active PostgreSQL database schema.
  3. Click **Restore Snapshot**: Select verified backup file to restore database state in case of emergency data recovery.

### 7. User Management (`/dashboard/admin/users`)
- **Navigation**: Sidebar -> Administration -> **Users**
- **Operating Instructions**:
  1. Click **Create User Account**.
  2. Enter User Details: Full Name, Email, Mobile, Assign System Role, Assign Workspace/Property Scope.
  3. Send automated activation link or set initial password.
  4. Deactivate or lock user accounts upon employee departure.

### 8. Session Monitoring (`/dashboard/admin/sessions`)
- **Navigation**: Sidebar -> Administration -> **Sessions**
- **Operating Instructions**:
  1. View all active user sessions across browsers and mobile devices.
  2. Displays User Email, IP Address, User Agent Browser, Login Time, Last Activity Time.
  3. Click **Revoke Session** to instantly force log-out a suspicious or stale session.

### 9. Support Tickets & Broadcasts (`/dashboard/admin/tickets`, `/dashboard/admin/broadcasts`)
- **Navigation**: Sidebar -> Administration -> **Support Tickets** / **Broadcasts**
- **Operating Instructions**:
  1. **Support Tickets**: Track system bug reports, user access requests, and feature requests. Change ticket status (`Open`, `In Progress`, `Resolved`, `Closed`).
  2. **Broadcasts**: Create system-wide notice banners displayed to all active users upon login (e.g., *"System Maintenance Scheduled for Sunday at 02:00 AM"*).

---

## 👥 Roles & Permissions Matrix

| Action | Platform Superadmin | Tenant Superadmin | Property Manager | Executive | Department Staff |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Provision Tenant Shards | ✅ | ❌ | ❌ | ❌ | ❌ |
| Create Workspaces | ✅ | ✅ | ✅ | ✅ | ❌ |
| Manage System Users | ✅ | ✅ | ✅ | Read Only | ❌ |
| View Audit Logs & Backups | ✅ | ✅ | Read Only | Read Only | ❌ |
| Terminate User Sessions | ✅ | ✅ | ❌ | ❌ | ❌ |

---

## 💡 Operational Best Practices

1. **Strict Property Scoping**: Always assign staff members to their specific physical workspace property during user creation to ensure they only access data relevant to their location.
2. **Weekly Backup Validation**: Verify automated backup execution weekly to ensure restore recovery point objectives (RPO) are met.

---
*Document Version: 1.0 | Module: Workspace & System Administration*
