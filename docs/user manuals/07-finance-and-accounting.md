# Manual 07: Finance & Accounts Module

## 📌 Module Overview

The **Finance & Accounts** module delivers enterprise-grade double-entry accounting, financial auditing, tax compliance, budget tracking, fixed asset depreciation, and executive financial reporting for hospitality organizations. It is fully integrated with downstream operations (Front Desk folios, POS billing, Vendor payables, Payroll disbursement).

---

## 🎯 Key Features & Capabilities

- **Chart of Accounts (COA)**: Hierarchical financial structure (Assets, Liabilities, Equity, Revenue, Expenses) customized for hospitality accounting.
- **Double-Entry Journal & Ledger**: Automated transaction posting from operational modules and manual journal entries with debit/credit balance validation.
- **Accounts Receivable (AR)**: Guest ledger balance, corporate credit accounts, city ledger billing, aging analysis (30-60-90 days), and payment tracking.
- **Accounts Payable (AP)**: Vendor bill processing, line-item matching, bill approval workflow, payment scheduling, and vendor disbursement.
- **Budgeting & Cost Centers**: Fiscal year budget allocation by cost center/department with real-time budget vs. actual variance analysis.
- **Tax Filings & Compliance**: Automated calculation of GST, VAT, Service Tax, and TDS deductions with monthly tax filing summaries.
- **Fixed Asset Depreciation**: Automated straight-line or declining-balance asset depreciation schedules posted directly to the general ledger.
- **Financial Reports & Statements**: Automated Generation of Trial Balance, Profit & Loss (P&L) Statement, and Balance Sheet.
- **Bank Reconciliation**: Statement import, auto-matching with bank books, and un-reconciled transaction resolution.

---

## 🧭 Sub-Modules & Operating Procedures

### 1. Finance Overview (`/dashboard/finance`)
- **Navigation**: Sidebar -> Finance & Accounts -> **Finance**
- **Operating Instructions**:
  1. Executive Financial Summary: Total Revenue, Gross Expenses, Net Profit Margin %, Operating Cash Flow, Total AR Balance, Total AP Outstanding.
  2. Financial Health Scorecard & Monthly Revenue Trend Chart.

### 2. Chart of Accounts (`/dashboard/finance/accounts`)
- **Navigation**: Sidebar -> Finance & Accounts -> **Chart of Accts**
- **Operating Instructions**:
  1. View 5-tier account hierarchy: 
     - `1000 Assets` (Cash, Bank, Accounts Receivable, Inventory, Fixed Assets)
     - `2000 Liabilities` (Accounts Payable, Tax Liabilities, Security Deposits Held)
     - `3000 Equity` (Owner Equity, Retained Earnings)
     - `4000 Revenue` (Room Tariff, F&B Sales, Laundry Revenue, Event Space Rental)
     - `5000 Expenses` (Salaries, Utilities, Maintenance, Food Supplies, Marketing)
  2. Click **Add Account**: Specify Parent Account, Account Name, Account Code, Account Type, and Opening Balance.

### 3. Journal Entries (`/dashboard/finance/journal`)
- **Navigation**: Sidebar -> Finance & Accounts -> **Journal**
- **Operating Instructions**:
  1. Click **New Journal Entry**.
  2. Enter Entry Date, Fiscal Year, Cost Center, and Description.
  3. Add Line Items (Minimum 2 lines): Select Account, enter Debit or Credit amount.
  4. System verifies that `Total Debits === Total Credits`. Click **Post Journal Entry**.

### 4. General Ledger (`/dashboard/finance/ledger`)
- **Navigation**: Sidebar -> Finance & Accounts -> **Ledger**
- **Operating Instructions**:
  1. Select target Account and Date Range (e.g., Q1 2026).
  2. Review running balance, opening balance, posted transactions, and closing balance.
  3. Export detailed ledger to Excel or PDF.

### 5. Accounts Receivable (AR) (`/dashboard/finance/receivables`)
- **Navigation**: Sidebar -> Finance & Accounts -> **Receivables**
- **Operating Instructions**:
  1. Monitor outstanding guest folios and corporate city ledger invoices.
  2. View Aging Matrix: Current, 1-30 Days, 31-60 Days, 61-90 Days, >90 Days.
  3. Send automated payment reminder notices to corporate clients.
  4. Click **Receive Payment** to record bank receipts and clear AR invoices.

### 6. Accounts Payable (AP) (`/dashboard/finance/payables`)
- **Navigation**: Sidebar -> Finance & Accounts -> **Payables**
- **Operating Instructions**:
  1. Click **Record Vendor Bill**.
  2. Select Vendor, Bill Number, Invoice Date, Due Date, and Expense Category.
  3. Add Line Items matching the Goods Receipt Note (GRN).
  4. Approve Bill -> Click **Record Bill Payment** -> Select Paying Bank Account, Cheque/NEFT Ref Number, and Amount Paid.

### 7. Budgeting & Cost Centers (`/dashboard/finance/budget`)
- **Navigation**: Sidebar -> Finance & Accounts -> **Budget**
- **Operating Instructions**:
  1. Set Fiscal Year Budget for departments (Front Desk, Housekeeping, F&B, Maintenance, HR, IT).
  2. Track **Budget vs. Actual Variance**: System highlights cost centers exceeding allocated budget limits in red.

### 8. Tax Filings (`/dashboard/finance/tax`)
- **Navigation**: Sidebar -> Finance & Accounts -> **Tax**
- **Operating Instructions**:
  1. Generate monthly GST/VAT Output Tax liability from guest invoices and sales.
  2. Calculate Input Tax Credits (ITC) from vendor bills.
  3. Calculate Tax Deducted at Source (TDS) on vendor payments.
  4. Export structured GSTR-1, GSTR-3B, or statutory tax returns.

### 9. Fixed Assets & Depreciation (`/dashboard/finance/assets`)
- **Navigation**: Sidebar -> Finance & Accounts -> **Fixed Assets**
- **Operating Instructions**:
  1. Register fixed asset asset code, acquisition cost, scrap value, and useful life (years).
  2. Click **Run Monthly Depreciation Batch**. System calculates monthly depreciation value and posts automated journal entry: `Debit: Depreciation Expense` / `Credit: Accumulated Depreciation`.

### 10. Financial Reports (`/dashboard/finance/reports`)
- **Navigation**: Sidebar -> Finance & Accounts -> **Reports**
- **Operating Instructions**:
  1. Select report type: **Trial Balance**, **Profit & Loss Statement (P&L)**, **Balance Sheet**, or **Cash Flow Statement**.
  2. Set reporting period and select comparative period (e.g., This Month vs. Last Month).
  3. System renders compliant financial statement with drill-down capability to underlying vouchers.

### 11. Bank Reconciliation (`/dashboard/finance/reconciliation`)
- **Navigation**: Sidebar -> Finance & Accounts -> **Reconciliation**
- **Operating Instructions**:
  1. Upload CSV bank statement from corporate bank account.
  2. System auto-matches deposits and withdrawals against cashbook entries by date and amount.
  3. Manually match unlinked bank fees, interest income, or direct transfers.
  4. Finalize bank reconciliation statement.

---

## 👥 Roles & Permissions Matrix

| Action | Finance Exec | Finance Manager | Executive | Super Admin | Property Mgr |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Post Journal Entries | ✅ | ✅ | ✅ | ✅ | Read Only |
| Record Payments & Bills | ✅ | ✅ | ✅ | ✅ | Read Only |
| Approve Budgets & Tax Filings | ❌ | ✅ | ✅ | ✅ | ❌ |
| Run Depreciation & Month-End | ❌ | ✅ | ✅ | ✅ | ❌ |
| Generate Financial Statements | ✅ | ✅ | ✅ | ✅ | Read Only |

---

## 💡 Operational Best Practices

1. **Monthly Financial Close**: Complete all AR receipts, AP bill postings, and bank reconciliations by the 5th of the following month before triggering the automated month-end financial closure batch.
2. **Double-Sign Off on Payables**: Vendor bill disbursements exceeding ₹100,000 (or $5,000) require approval from both the Finance Manager and Executive/Super Admin.

---
*Document Version: 1.0 | Module: Finance & Accounts*
