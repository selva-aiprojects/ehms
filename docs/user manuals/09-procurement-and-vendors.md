# Manual 09: Procurement & Vendor Operations

## 📌 Module Overview

The **Procurement & Vendor Operations** module governs supplier relationships, raw material purchasing, item replenishment, service contracts, and goods receipt verification. It seamlessly connects purchase requisitions from Housekeeping, Maintenance, and F&B directly to Finance Accounts Payable.

---

## 🎯 Key Features & Capabilities

- **Vendor Directory & Profiles**: Complete supplier database (GSTIN/Tax ID, Bank Account details, Payment terms, Approved categories, Performance ratings).
- **Purchase Orders (PO)**: Digital PO generation, multi-tier approval workflow based on order thresholds, and PDF dispatch to suppliers.
- **Goods Receipt Notes (GRN)**: Gate inspection, quantity verification, damaged/rejected goods logging, and inventory stock updates.
- **Vendor Services Catalog**: Service contract management (AMC contracts, Lift maintenance, Pest control, Commercial laundry, Security services).
- **3-Way Matching**: Automated reconciliation between Purchase Order, Goods Receipt Note, and Vendor Payable Bill.

---

## 🧭 Sub-Modules & Operating Procedures

### 1. Procurement Dashboard (`/dashboard/procurement`)
- **Navigation**: Sidebar -> Procurement -> **Procurement**
- **Operating Instructions**:
  1. View key metrics: Pending Purchase Requisitions, Active Purchase Orders, Orders Awaiting Delivery (GRN), Total Monthly Purchasing Spend.
  2. Access quick links for PO creation and GRN inspection.

### 2. Vendor Directory (`/dashboard/vendors`)
- **Navigation**: Sidebar -> Procurement -> **Vendors**
- **Operating Instructions**:
  1. Click **Add New Vendor**.
  2. Input Vendor Details: Company Name, Contact Person, Phone, Email, Address, GSTIN / Tax Registration Number, Payment Terms (e.g., `Net 30`, `Immediate Cash`, `50% Advance`).
  3. Assign Vendor Categories: Provisions, Beverage, Housekeeping Supplies, Linen, Electrical, Plumbing, IT, AMC Service.
  4. Record Rating (1 to 5 Stars) based on delivery timeliness and product quality.

### 3. Purchase Orders (PO) (`/dashboard/procurement/purchase-orders`)
- **Navigation**: Sidebar -> Procurement -> **Purchase Orders**
- **Operating Instructions**:
  1. Click **Create Purchase Order**.
  2. Select Vendor and Receiving Warehouse/Property.
  3. Add Line Items: Select Inventory/Spare Item, Order Quantity, Unit Price, and Applicable Tax Rate.
  4. **Approval Routing**:
     - Orders < ₹25,000: Auto-approved / Maintenance Supervisor Approval
     - Orders ≥ ₹25,000: Requires Property Manager / Finance Manager Approval
  5. Upon approval, click **Dispatch PO** to email the purchase order PDF directly to the vendor.

### 4. Goods Receipt Note (GRN) (`/dashboard/procurement/grn`)
- **Navigation**: Sidebar -> Procurement -> **Goods Receipt**
- **Operating Instructions**:
  1. Upon shipment delivery at hotel/facility loading dock, open the pending PO in GRN screen.
  2. Input **Delivered Quantity** and **Accepted Quantity**.
  3. If items are damaged or defective, enter **Rejected Quantity** and select Rejection Reason.
  4. Upload physical delivery challan / invoice photo.
  5. Click **Submit GRN**:
     - System automatically increases item stock levels in the target **Inventory Warehouse**.
     - System creates a draft **Vendor Bill** in Accounts Payable for the accepted quantity amount.

### 5. Vendor Services & Orders (`/dashboard/vendors/services`, `/dashboard/vendors/orders`)
- **Navigation**: Sidebar -> Procurement -> **Vendor Services** / **Vendor Orders**
- **Operating Instructions**:
  1. Manage recurring Annual Maintenance Contracts (AMC) and outsourced services (Pest Control, Water Tank Cleaning, Deep Cleaning, Security Guards).
  2. Record service completion tickets and rate vendor execution quality.

---

## 👥 Roles & Permissions Matrix

| Action | Department Head | Procurement Officer | Finance Manager | Property Mgr |
| :--- | :---: | :---: | :---: | :---: |
| Create Purchase Requisition | ✅ | ✅ | ✅ | ✅ |
| Generate & Issue PO | ❌ | ✅ | ✅ | ✅ |
| Approve High-Value PO | ❌ | ❌ | ✅ | ✅ |
| Receive GRN & Inspect Goods | ✅ | ✅ | Read Only | ✅ |
| Manage Vendor Profiles | Read Only | ✅ | ✅ | ✅ |

---

## 💡 Operational Best Practices

1. **Mandatory 3-Way Matching**: Never approve a vendor payment in Finance until the Purchase Order, GRN Accepted Quantity, and Vendor Invoice line items match 100%.
2. **Reorder Point Automation**: Configure automated PO drafts when inventory stocks fall below safety stock limits to prevent stockouts of critical guest amenities and food provisions.

---
*Document Version: 1.0 | Module: Procurement & Vendors*
