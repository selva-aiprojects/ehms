# Manual 10: Inventory & Stock Management

## 📌 Module Overview

The **Inventory & Stock Management** module provides real-time visibility into stock levels, multi-warehouse storage, item movements, internal department requisitions, and stock audits across all properties and operational departments.

---

## 🎯 Key Features & Capabilities

- **Master Item Catalog**: Comprehensive item database with SKU codes, barcodes, unit of measure (UOM), minimum safety stock, and reorder levels.
- **Multi-Warehouse Support**: Virtual and physical storage locations (Central Warehouse, Housekeeping Linen Store, Main Kitchen Dry Store, Maintenance Tool Room, Front Desk Stationery Store).
- **Stock Transactions**: Full ledger tracking of Stock Inward (GRN/Purchase), Stock Outward (Department Issue), Inter-Warehouse Transfers, and Stock Adjustments (Damage/Expiry/Audit Variance).
- **Categorization & Valuation**: Multi-tier item categories (Perishables, Dry Goods, Housekeeping Chemicals, Guest Amenities, Maintenance Spares) with FIFO/Weighted Average cost valuation.

---

## 🧭 Sub-Modules & Operating Procedures

### 1. Inventory Dashboard (`/dashboard/inventory`)
- **Navigation**: Sidebar -> Inventory -> **Inventory**
- **Operating Instructions**:
  1. View overall inventory valuation summary: Total Stock Value, Total Items, Low Stock SKU Count, Out-of-Stock SKU Count.
  2. Stock Movement Bar Chart (Monthly Inward vs. Outward).

### 2. Master Item Catalog (`/dashboard/inventory/items`)
- **Navigation**: Sidebar -> Inventory -> **Inv Items**
- **Operating Instructions**:
  1. Click **Add New Item**.
  2. Enter Item Attributes:
     - SKU / Item Code (e.g., `AMEN-SOAP-50G`, `FNB-MILK-1L`)
     - Item Name & Description
     - Category & Sub-category
     - Primary Unit of Measure (Pieces, Packets, Liters, Kilograms, Boxes)
     - Unit Cost Price & Default Selling Price (if applicable)
     - Minimum Reorder Level & Maximum Stock Capacity
  3. Generate printable barcode labels.

### 3. Warehouses & Storage (`/dashboard/inventory/warehouses`)
- **Navigation**: Sidebar -> Inventory -> **Warehouses**
- **Operating Instructions**:
  1. Click **Add Warehouse Location**.
  2. Specify Warehouse Name, Property/Workspace, Manager In-Charge, Location Address/Room Number.
  3. View stock balance breakdown per warehouse location.

### 4. Stock Transactions (`/dashboard/inventory/transactions`)
- **Navigation**: Sidebar -> Inventory -> **Inv Transactions**
- **Operating Instructions**:
  1. Click **New Transaction**:
     - **Issue to Department**: Transfer stock from Central Warehouse to Housekeeping, F&B Kitchen, or Maintenance.
     - **Inter-Warehouse Transfer**: Move stock between Property A Store and Property B Store.
     - **Stock Adjustment**: Record physical inventory audit variance or write off damaged/expired goods.
  2. Input Item, Quantity, Source Warehouse, Destination Warehouse / Department, and Reference Voucher Number.
  3. Click **Post Transaction**. Stock balances update in real-time.

### 5. Categories (`/dashboard/inventory/categories`)
- **Navigation**: Sidebar -> Inventory -> **Inv Categories**
- **Operating Instructions**:
  1. Define category taxonomy (e.g., `Guest Supplies -> Toiletries -> Shampoo 30ml`).
  2. Assign GL expense accounts to categories for automatic accounting posting during stock consumption.

---

## 👥 Roles & Permissions Matrix

| Action | Storekeeper | Department Supervisor | Finance Manager | Property Mgr |
| :--- | :---: | :---: | :---: | :---: |
| Issue Department Stock | ✅ | Request Only | Read Only | ✅ |
| Add Master Items & Categories | ✅ | Read Only | ✅ | ✅ |
| Perform Inter-Store Transfers | ✅ | ❌ | Read Only | ✅ |
| Execute Stock Write-Off / Adjustment | ❌ | ❌ | ✅ | ✅ |

---

## 💡 Operational Best Practices

1. **Monthly Blind Stock Count**: Conduct monthly physical stock counts where storekeepers verify physical counts against system balances without prior knowledge of system numbers.
2. **First-In, First-Out (FIFO)**: Enforce FIFO stock rotation for F&B perishables and guest toiletries to minimize expired stock write-offs.

---
*Document Version: 1.0 | Module: Inventory & Stock Management*
