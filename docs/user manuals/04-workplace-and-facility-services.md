# Manual 04: Workplace & Facility Services Management

## 📌 Module Overview

The **Workplace & Facility Services** module provides end-to-end management for co-working spaces, corporate offices, flex-desks, conference rooms, and facility access security. It streamlines space allocation, member subscriptions, visitor registration, and turnstile/gate security logging.

---

## 🎯 Key Features & Capabilities

- **Desk & Zone Management**: Hot desk allocation, dedicated desk reservation, private office suites, and meeting room scheduling.
- **Membership Plans & Subscriptions**: Flex pass plans, monthly dedicated memberships, enterprise team plans, and meeting room credit tracking.
- **Visitor Access & Pass Management**: Visitor pre-registration by corporate hosts, instant QR badge generation, check-in/out timestamping, and security gate control.
- **Facility Security Logs**: Live monitoring of active visitors on-site, security alerts, and host notification system.

---

## 🧭 Sub-Modules & Operating Procedures

### 1. Workplace Dashboard (`/dashboard/workplace`)
- **Navigation**: Sidebar -> Properties & Verticals -> **Workplace**
- **Operating Instructions**:
  1. View live facility stats: Total Desk Capacity, Occupied Desks, Active Members, Today's Scheduled Visitors, Meeting Room Utilization %.
  2. Interactive zone filter: Floor 1 Flex Bay, Floor 2 Quiet Zone, Executive Suites.

### 2. Memberships (`/dashboard/workplace/memberships`)
- **Navigation**: Sidebar -> Properties & Verticals -> **Memberships**
- **Operating Instructions**:
  1. Click **Add New Member / Company**.
  2. Input Details:
     - Member Type: `Individual` or `Enterprise Company`
     - Plan Type: `Day Pass`, `Hot Desk Monthly`, `Dedicated Desk`, `Private Office`
     - Start Date & Billing Cycle (Monthly, Quarterly, Annual)
     - Assigned Desk / Suite Number
     - Monthly Meeting Room Credits (Hours)
  3. Issue RFID Access Badge or Digital PIN.

### 3. Visitor Management (`/dashboard/workplace/visitors`)
- **Navigation**: Sidebar -> Properties & Verticals -> **Visitors**
- **Operating Instructions**:
  1. **Pre-Registration (by Host)**: Member logs visitor details (Name, Company, Email, Purpose of Visit, Arrival Time).
  2. **Security Desk Check-In**: Security staff scans visitor QR code or enters visitor mobile number.
  3. Capture visitor photo via web camera and print Visitor Access Pass.
  4. System dispatches SMS/WhatsApp notification to host: *"Your visitor [Name] has arrived at the reception desk."*
  5. Upon departure, security clicks **Check-Out Visitor**. Live count of guests on premises updates automatically.

---

## 👥 Roles & Permissions Matrix

| Action | Facility Manager | Security Staff | Property Manager | Super Admin |
| :--- | :---: | :---: | :---: | :---: |
| Manage Desks & Zones | ✅ | Read Only | ✅ | ✅ |
| Create Membership Plans | ✅ | ❌ | ✅ | ✅ |
| Register & Check-In Visitors | ✅ | ✅ | ✅ | ✅ |
| View Security Access Logs | ✅ | ✅ | ✅ | ✅ |

---

## 💡 Operational Best Practices

1. **Over-stay Security Alerts**: Configure automatic security alerts for visitors who remain checked-in past 07:00 PM without an extended access authorization.
2. **Meeting Room Credit Renewal**: Meeting room credits reset on the 1st of every month; unutilized credits expire automatically unless rollover is configured in the membership tier.

---
*Document Version: 1.0 | Module: Workplace & Facility Services*
