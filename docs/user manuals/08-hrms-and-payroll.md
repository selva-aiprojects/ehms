# Manual 08: HRMS & Payroll Module

## 📌 Module Overview

The **HRMS & Payroll** module manages the complete employee lifecycle from onboarding, shift scheduling, and biometric/digital attendance tracking to statutory compliance, performance appraisals, and automated salary slip generation for hospitality staff.

---

## 🎯 Key Features & Capabilities

- **Employee Directory & Onboarding**: Employee digital profiles, department mapping, role assignments, document attachments (Aadhaar, PAN, Passport, Bank Details).
- **Attendance & Timesheets**: Biometric/GPS clock-in logging, overtime tracking, late entry penalties, and timesheet sign-offs.
- **Leave Management**: Leave types (Casual Leave, Sick Leave, Earned Leave, Maternity Leave), leave balance ledgers, approval workflows, and holiday calendar.
- **Shift Scheduling & Rotations**: Morning, Afternoon, Night, and Split shift planning with automated clash detection.
- **Automated Payroll Engine**: Salary calculation based on days worked, overtime hours, deductions (PF, ESI, TDS, Advance Salary recovery), bonuses, and automated payslip generation.
- **Statutory Compliance**: Automated computation of Provident Fund (PF), Employee State Insurance (ESI), Professional Tax (PT), and Income Tax / TDS.
- **Performance Appraisals**: Goal setting, quarterly evaluations, 360-degree reviews, and appraisal scoring.
- **HR Master Data & Policies**: Department definitions, designation tiers, leave policy rules, and company policy document repository.

---

## 🧭 Sub-Modules & Operating Procedures

### 1. HRMS Overview (`/dashboard/hr`)
- **Navigation**: Sidebar -> Human Resources -> **HRMS**
- **Operating Instructions**:
  1. View HR Metrics: Total Headcount, Active Staff Today, Present %, Staff On Leave, Open Requisitions, Monthly Payroll Liability.
  2. Department Distribution: Front Desk, Housekeeping, F&B, Maintenance, Security, Finance, Admin.

### 2. Employee Directory (`/dashboard/hr/employees`)
- **Navigation**: Sidebar -> Human Resources -> **Employees**
- **Operating Instructions**:
  1. Click **Add New Employee**.
  2. Fill Personal Details: Full Name, Gender, Date of Birth, Phone, Personal Email, Emergency Contact.
  3. Fill Employment Details: Employee Code (e.g., `EMP-104`), Joining Date, Property/Workspace, Department, Designation, Manager, Employment Type (Permanent, Contract, Trainee).
  4. Upload Identity & Bank Documents.

### 3. Timesheets & Attendance (`/dashboard/hr/timesheet`)
- **Navigation**: Sidebar -> Human Resources -> **Timesheets**
- **Operating Instructions**:
  1. Review daily clock-in and clock-out logs.
  2. Attendance Statuses: `Present`, `Absent`, `Half-Day`, `On Leave`, `Weekly Off`, `Holiday`.
  3. Supervisor performs **Weekly Timesheet Approval**: Review overtime hours logged and click **Approve Timesheet** to freeze hours for payroll.

### 4. Leave Management (`/dashboard/hr/leave`)
- **Navigation**: Sidebar -> Human Resources -> **Leave**
- **Operating Instructions**:
  1. **Employee Request**: Staff selects Leave Type, Start Date, End Date, Reason, and Duty Back-up.
  2. **Manager Approval**: HR Manager/Supervisor receives notification, reviews leave balance, and clicks **Approve** or **Reject**.
  3. View leave balance ledgers per employee.

### 5. Shift Management (`/dashboard/hr/shifts`)
- **Navigation**: Sidebar -> Human Resources -> **Shifts**
- **Operating Instructions**:
  1. Define Shift Templates:
     - 🌅 `Morning Shift`: 07:00 AM – 03:30 PM
     - 🌆 `Afternoon Shift`: 03:00 PM – 11:30 PM
     - 🌃 `Night Shift`: 11:00 PM – 07:30 AM
     - 🌗 `Split Shift`: 11:00 AM – 03:00 PM & 07:00 PM – 11:00 PM (F&B Dining)
  2. Assign weekly rosters to employees. System alerts if rest gap between shifts is less than 11 hours.

### 6. Payroll Execution (`/dashboard/hr/payroll`)
- **Navigation**: Sidebar -> Human Resources -> **Payroll**
- **Operating Instructions**:
  1. Select Payroll Month & Year (e.g., July 2026).
  2. Click **Fetch Attendance & Approved Leaves**.
  3. System computes gross earnings (Basic, HRA, Conveyance, Special Allowance, Overtime) and deductions (PF Employee/Employer contribution, ESI, TDS, Salary Advances).
  4. Click **Execute Payroll Run**.
  5. System generates individual **Salary Slips (PDF)** and dispatches them via email.
  6. Export Bank Transfer File (NACH / Direct Deposit batch file) for direct salary payment.

### 7. Statutory Compliance (`/dashboard/hr/compliance`)
- **Navigation**: Sidebar -> Human Resources -> **Compliance**
- **Operating Instructions**:
  1. View monthly PF ECR electronic challenge reports.
  2. View ESI contribution statements.
  3. Generate Quarterly Form 24Q TDS filing details for income tax compliance.

### 8. Appraisals & Performance (`/dashboard/hr/appraisal`)
- **Navigation**: Sidebar -> Human Resources -> **Appraisal**
- **Operating Instructions**:
  1. Initiate Annual / Mid-Year Appraisal Cycle.
  2. Employees complete self-evaluation scores.
  3. Reporting managers complete manager evaluation scores.
  4. HR Manager finalizes rating (1 to 5 Stars) and records salary revision recommendations in **Compensation** (`/dashboard/hr/compensation`).

---

## 👥 Roles & Permissions Matrix

| Action | Employee | HR Executive | HR Manager | Property Mgr | Super Admin |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Apply for Leave | ✅ | ✅ | ✅ | ✅ | ✅ |
| Clock In/Out Attendance | ✅ | ✅ | ✅ | ✅ | ✅ |
| Approve Leaves & Shifts | ❌ | ✅ | ✅ | ✅ | ✅ |
| Execute Monthly Payroll | ❌ | ❌ | ✅ | Read Only | ✅ |
| View Salary Slips | Own Only | All | All | All | All |

---

## 💡 Operational Best Practices

1. **Payroll Cut-Off Date**: Freeze attendance and leave applications on the 25th of every month to allow HR 3 business days for timesheet validation before end-of-month payroll execution.
2. **Statutory Filing Deadlines**: Ensure PF and ESI monthly contributions are remitted on or before the 15th of the following month to avoid statutory interest penalties.

---
*Document Version: 1.0 | Module: HRMS & Payroll*
