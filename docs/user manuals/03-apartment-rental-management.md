# Manual 03: Apartment Long-Term Rental Management

## 📌 Module Overview

The **Apartment Long-Term Rental Management** module is tailored for property developers, landlords, and asset managers overseeing long-term residential rental properties and commercial real estate. It automates tenant onboarding, lease agreement lifecycles, monthly rent invoice generation, utility recovery, and security deposit management.

---

## 🎯 Key Features & Capabilities

- **Tenant Onboarding & Profiles**: Complete tenant ledger with primary tenant information, co-occupants, background verification docs, and emergency contacts.
- **Lease Agreement Management**: Digital lease lifecycle tracking (Draft, Active, Pending Renewal, Terminated, Expired) with start/end dates, escalation percentage, and notice periods.
- **Automated Monthly Rent Invoicing**: Auto-generation of recurring monthly rent bills, common area maintenance (CAM) charges, water/electricity consumption fees, and late payment penalties.
- **Security Deposit Ledger**: Tracking initial deposit collected, holding bank account, deductions for damages/unpaid bills, and refund processing upon lease termination.

---

## 🧭 Sub-Modules & Operating Procedures

### 1. Rental Dashboard (`/dashboard/rental`)
- **Navigation**: Sidebar -> Properties & Verticals -> **Rental**
- **Operating Instructions**:
  1. Review key metrics: Total Leased Units, Occupancy Rate %, Monthly Rent Receivable, Overdue Rent Count, Expedited Lease Renewals.
  2. Filter by building block or rental property workspace.

### 2. Lease Agreements (`/dashboard/rental/leases`)
- **Navigation**: Sidebar -> Properties & Verticals -> **Leases**
- **Operating Instructions**:
  1. Click **Create New Lease**.
  2. Input Lease Details:
     - Tenant Name & Contact
     - Assigned Unit / Apartment Number
     - Lease Commencement Date & Expiration Date
     - Monthly Rent Amount & Payment Due Day (e.g., 5th of every month)
     - Security Deposit Amount
     - Annual Escalation Rate % (e.g., 5% or 10%)
     - Lock-in Period (Months)
  3. Upload signed lease contract PDF.
  4. Status changes to **Active**.

### 3. Rent Invoices (`/dashboard/rental/invoices`)
- **Navigation**: Sidebar -> Properties & Verticals -> **Rent Invoices**
- **Operating Instructions**:
  1. System generates draft invoices on the 1st of every month.
  2. Click **Review & Publish Invoices** to broadcast payment links via email and WhatsApp to tenants.
  3. Record manual bank transfers or cash payments by clicking **Record Payment**, selecting Payment Date, Reference Transaction ID, and Payment Method.
  4. Auto-calculate late fees if payment exceeds the grace period.

### 4. Tenant Deposits (`/dashboard/rental/deposits`)
- **Navigation**: Sidebar -> Properties & Verticals -> **Deposits**
- **Operating Instructions**:
  1. View deposit balances for active tenants.
  2. Upon lease termination, click **Process Deposit Settlement**:
     - Input final utility meter readings (Electricity, Water).
     - Enter repair/cleaning deduction line items.
     - System calculates Net Refund Amount = `Security Deposit` - `Unpaid Rent` - `Utility Bills` - `Damages`.
  3. Issue refund and mark lease status as **Closed**.

---

## 👥 Roles & Permissions Matrix

| Action | Property Manager | Finance Manager | Executive | Super Admin |
| :--- | :---: | :---: | :---: | :---: |
| Create & Terminate Leases | ✅ | Read Only | ✅ | ✅ |
| Generate Rent Invoices | ✅ | ✅ | ✅ | ✅ |
| Record Rent Payments | ✅ | ✅ | ✅ | ✅ |
| Approve Deposit Refunds | ✅ | ✅ | ✅ | ✅ |

---

## 💡 Operational Best Practices

1. **Automated Escalation**: Set up auto-reminders 60 days before lease expiration to initiate renewal negotiations or notice period proceedings.
2. **Meter Reading Deadlines**: Record physical utility meter readings on the 28th of every month to ensure accurate utility recovery in the upcoming 1st-of-month rent invoice cycle.

---
*Document Version: 1.0 | Module: Apartment Rental Management*
