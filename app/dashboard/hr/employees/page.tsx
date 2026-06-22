"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from "react";
import {
  Users, AlertCircle, Loader2, RefreshCw, Search as SearchIcon,
  Plus, Eye, Edit2, X, ChevronDown, User, Mail, Phone, MapPin,
  Briefcase, DollarSign, CreditCard, Building, ChevronRight,
  Calendar, Check, ArrowLeft, Save
} from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Table from "@/components/ui/table";
import { useEmployees } from "@/lib/hooks";

function SkeletonRow() {
  return <div className="h-10 rounded animate-pulse mb-2" style={{ background: "#F5F7FA" }} />;
}

interface Employee {
  id: string;
  employee_code: string;
  user_id: string;
  department_id: string;
  designation: string;
  employment_type: string;
  doj: string;
  base_salary: number;
  bank_account: string;
  bank_ifsc: string;
  pan_number: string;
  uan_number: string;
  esi_number: string;
  reporting_manager_id: string;
  shift_id: string;
  band_id: string;
  is_active: boolean;
  department: { id: string; name: string } | null;
  user: { id: string; first_name: string; last_name: string; email: string; avatar_url: string | null } | null;
  reporting_manager?: Employee | null;
  shift?: { id: string; name: string } | null;
  band?: { id: string; name: string } | null;
}

interface Department {
  id: string;
  name: string;
  code: string;
}

interface Shift {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
}

interface EmployeeBand {
  id: string;
  name: string;
  code: string;
}

const EMPTY_EMPLOYEE = {
  first_name: "", last_name: "", email: "", department_id: "", designation: "",
  employment_type: "full_time", doj: "", base_salary: 0, bank_account: "",
  bank_ifsc: "", pan_number: "", uan_number: "", esi_number: "",
  reporting_manager_id: "", shift_id: "", band_id: "",
};

export default function EmployeesPage() {
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [viewEmployee, setViewEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({ ...EMPTY_EMPLOYEE });
  const [saving, setSaving] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [bands, setBands] = useState<EmployeeBand[]>([]);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const { employees, isLoading, isError, mutate } = useEmployees(search || undefined, deptFilter || undefined);
  const displayData = employees || [];

  useEffect(() => {
    if (feedback) {
      const t = setTimeout(() => setFeedback(null), 3000);
      return () => clearTimeout(t);
    }
  }, [feedback]);

  useEffect(() => {
    fetch("/api/hr/departments").then(r => r.json()).then(d => setDepartments(d?.data || [])).catch(() => {});
    fetch("/api/hr/shifts").then(r => r.json()).then(d => setShifts(d?.data || [])).catch(() => {});
    fetch("/api/hr/employees?limit=500").then(r => r.json()).then(d => setAllEmployees(d?.data || [])).catch(() => {});
    fetch("/api/hr/bands").then(r => r.json()).then(d => setBands(d?.data || [])).catch(() => {});
  }, []);

  const openAdd = () => {
    setEditEmployee(null);
    setFormData({ ...EMPTY_EMPLOYEE });
    setShowAddModal(true);
  };

  const openEdit = (emp: Employee) => {
    setEditEmployee(emp);
    setFormData({
      first_name: emp.user?.first_name || "",
      last_name: emp.user?.last_name || "",
      email: emp.user?.email || "",
      department_id: emp.department_id || "",
      designation: emp.designation || "",
      employment_type: emp.employment_type || "full_time",
      doj: emp.doj?.split("T")[0] || "",
      base_salary: emp.base_salary || 0,
      bank_account: emp.bank_account || "",
      bank_ifsc: emp.bank_ifsc || "",
      pan_number: emp.pan_number || "",
      uan_number: emp.uan_number || "",
      esi_number: emp.esi_number || "",
      reporting_manager_id: emp.reporting_manager_id || "",
      shift_id: emp.shift_id || "",
      band_id: emp.band_id || "",
    });
    setShowAddModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const url = editEmployee ? `/api/hr/employees/${editEmployee.id}` : "/api/hr/employees";
      const method = editEmployee ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Save failed");
      setFeedback({ type: "success", message: editEmployee ? "Employee updated" : "Employee created" });
      setShowAddModal(false);
      mutate();
    } catch {
      setFeedback({ type: "error", message: "Failed to save employee" });
    } finally {
      setSaving(false);
    }
  };

  const statusBadge = (emp: Employee) => {
    if (!emp.is_active) return <Badge variant="red">Inactive</Badge>;
    return <Badge variant="teal">Active</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#1A3C5E" }}>Employees</h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>Manage employee directory and records</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => mutate()} className="p-1.5 rounded-lg transition-colors" style={{ color: "#64748B" }} aria-label="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={openAdd} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors" style={{ background: "#2BAE8E" }}>
            <Plus className="w-3.5 h-3.5" /> Add Employee
          </button>
        </div>
      </div>

      {feedback && (
        <div className="rounded-lg px-4 py-2.5 text-sm flex items-center gap-2" style={{
          background: feedback.type === "success" ? "rgba(43,174,142,0.08)" : "rgba(229,62,62,0.08)",
          color: feedback.type === "success" ? "#2BAE8E" : "#E53E3E",
          border: feedback.type === "success" ? "1px solid rgba(43,174,142,0.2)" : "1px solid rgba(229,62,62,0.2)",
        }}>
          {feedback.type === "success" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {feedback.message}
        </div>
      )}

      {isError && (
        <div className="rounded-lg px-4 py-2.5 text-sm flex items-center gap-2" style={{ background: "rgba(229,62,62,0.08)", color: "#E53E3E", border: "1px solid rgba(229,62,62,0.2)" }}>
          <AlertCircle className="w-4 h-4" />
          Failed to load employees.
          <button onClick={() => mutate()} className="ml-auto underline text-xs">Retry</button>
        </div>
      )}

      {isLoading && !employees ? (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl p-4 animate-pulse" style={{ background: "#E2E8F0" }}>
              <div className="w-12 h-8 rounded mb-2" style={{ background: "#CBD5E1" }} />
              <div className="w-16 h-3 rounded" style={{ background: "#CBD5E1" }} />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="rounded-xl p-4 text-white" style={{ background: "#1A3C5E" }}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl font-bold">{displayData.length}</div>
              <Users className="w-5 h-5 opacity-60" />
            </div>
            <div className="text-xs opacity-80">Total Employees</div>
          </div>
          <div className="rounded-xl p-4 text-white" style={{ background: "#2BAE8E" }}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl font-bold">{displayData.filter((e: any) => e.is_active !== false).length}</div>
              <Check className="w-5 h-5 opacity-60" />
            </div>
            <div className="text-xs opacity-80">Active</div>
          </div>
          <div className="rounded-xl p-4" style={{ background: "#F5F7FA" }}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl font-bold" style={{ color: "#1A2E44" }}>{displayData.filter((e: any) => e.employment_type === "contract").length}</div>
              <Briefcase className="w-5 h-5" style={{ color: "#64748B" }} />
            </div>
            <div className="text-xs" style={{ color: "#64748B" }}>Contractors</div>
          </div>
          <div className="rounded-xl p-4" style={{ background: "#F5F7FA" }}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl font-bold" style={{ color: "#1A2E44" }}>{departments.length}</div>
              <Building className="w-5 h-5" style={{ color: "#64748B" }} />
            </div>
            <div className="text-xs" style={{ color: "#64748B" }}>Departments</div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader
          title="Employee Directory"
          subtitle={`${displayData.length} employees`}
          action={
            <div className="flex items-center gap-2">
              <div className="relative">
                <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "#64748B" }} />
                <input
                  type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search employees..."
                  className="pl-8 pr-3 py-1.5 rounded-lg text-xs outline-none border w-40"
                  style={{ borderColor: "#E2E8F0", background: "#F5F7FA" }}
                />
              </div>
              <select
                value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}
                className="px-2 py-1.5 rounded-lg text-xs outline-none border"
                style={{ borderColor: "#E2E8F0", background: "#F5F7FA", color: "#1A2E44" }}
              >
                <option value="">All Departments</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          }
        />
        {isLoading ? (
          <div className="space-y-1">
            {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
          </div>
        ) : displayData.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-6 h-6 mx-auto mb-2" style={{ color: "#64748B" }} />
            <p className="text-sm" style={{ color: "#64748B" }}>No employees found</p>
          </div>
        ) : (
          <Table
            data={displayData}
            keyExtractor={(e: any) => e.id}
            onRowClick={(emp: any) => setViewEmployee(emp)}
            columns={[
              { key: "employee_code", header: "Code", render: (e: any) => <span className="font-mono text-xs" style={{ color: "#64748B" }}>{e.employee_code}</span> },
              { key: "name", header: "Name", render: (e: any) => (
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: "#1A3C5E" }}>
                    {((e.user?.first_name?.[0] || "") + (e.user?.last_name?.[0] || "")).toUpperCase() || "?"}
                  </div>
                  <span className="font-medium text-sm">{e.user ? `${e.user.first_name} ${e.user.last_name || ""}` : e.name || "—"}</span>
                </div>
              )},
              { key: "department", header: "Department", render: (e: any) => <span className="text-xs" style={{ color: "#64748B" }}>{e.department?.name || "—"}</span> },
              { key: "designation", header: "Designation", render: (e: any) => <span className="text-xs">{e.designation || "—"}</span> },
              { key: "email", header: "Contact", render: (e: any) => <span className="text-xs" style={{ color: "#64748B" }}>{e.user?.email || "—"}</span> },
              { key: "status", header: "Status", render: (e: any) => statusBadge(e) },
              { key: "actions", header: "Actions", render: (e: any) => (
                <div className="flex items-center gap-1" onClick={(ev) => ev.stopPropagation()}>
                  <button onClick={() => { setViewEmployee(e); }} className="p-1 rounded hover:bg-gray-100" title="View"><Eye className="w-3.5 h-3.5" style={{ color: "#1A3C5E" }} /></button>
                  <button onClick={() => openEdit(e)} className="p-1 rounded hover:bg-gray-100" title="Edit"><Edit2 className="w-3.5 h-3.5" style={{ color: "#2BAE8E" }} /></button>
                </div>
              )},
            ]}
          />
        )}
      </Card>

      {/* View Employee Panel */}
      {viewEmployee && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/20" onClick={() => setViewEmployee(null)} />
          <div className="relative w-full max-w-lg bg-white h-full overflow-y-auto shadow-xl" style={{ borderLeft: "1px solid #E2E8F0" }}>
            <div className="sticky top-0 bg-white z-10 px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid #E2E8F0" }}>
              <h2 className="text-base font-semibold" style={{ color: "#1A3C5E" }}>Employee Details</h2>
              <button onClick={() => setViewEmployee(null)} className="p-1 rounded hover:bg-gray-100"><X className="w-4 h-4" style={{ color: "#64748B" }} /></button>
            </div>
            <div className="p-6 space-y-6 text-sm">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold text-white" style={{ background: "#1A3C5E" }}>
                  {((viewEmployee.user?.first_name?.[0] || "") + (viewEmployee.user?.last_name?.[0] || "")).toUpperCase() || "?"}
                </div>
                <div>
                  <div className="text-base font-semibold" style={{ color: "#1A2E44" }}>
                    {viewEmployee.user ? `${viewEmployee.user.first_name} ${viewEmployee.user.last_name || ""}` : "—"}
                  </div>
                  <div className="text-xs" style={{ color: "#64748B" }}>{viewEmployee.employee_code} · {viewEmployee.designation}</div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase mb-2" style={{ color: "#64748B" }}>Personal Info</h4>
                <div className="grid grid-cols-2 gap-3 p-3 rounded-lg" style={{ background: "#F5F7FA" }}>
                  <div><span className="text-xs" style={{ color: "#64748B" }}>Email</span><p className="font-medium">{viewEmployee.user?.email || "—"}</p></div>
                  <div><span className="text-xs" style={{ color: "#64748B" }}>Department</span><p className="font-medium">{viewEmployee.department?.name || "—"}</p></div>
                  <div><span className="text-xs" style={{ color: "#64748B" }}>Designation</span><p className="font-medium">{viewEmployee.designation || "—"}</p></div>
                  <div><span className="text-xs" style={{ color: "#64748B" }}>Type</span><p className="font-medium capitalize">{viewEmployee.employment_type?.replace("_", " ") || "—"}</p></div>
                  <div><span className="text-xs" style={{ color: "#64748B" }}>Date of Joining</span><p className="font-medium">{viewEmployee.doj ? new Date(viewEmployee.doj).toLocaleDateString() : "—"}</p></div>
                  <div><span className="text-xs" style={{ color: "#64748B" }}>Status</span><p className="font-medium">{viewEmployee.is_active ? "Active" : "Inactive"}</p></div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase mb-2" style={{ color: "#64748B" }}>Bank Details</h4>
                <div className="grid grid-cols-2 gap-3 p-3 rounded-lg" style={{ background: "#F5F7FA" }}>
                  <div><span className="text-xs" style={{ color: "#64748B" }}>Account Number</span><p className="font-medium">{viewEmployee.bank_account || "—"}</p></div>
                  <div><span className="text-xs" style={{ color: "#64748B" }}>IFSC Code</span><p className="font-medium">{viewEmployee.bank_ifsc || "—"}</p></div>
                  <div><span className="text-xs" style={{ color: "#64748B" }}>PAN Number</span><p className="font-medium">{viewEmployee.pan_number || "—"}</p></div>
                  <div><span className="text-xs" style={{ color: "#64748B" }}>UAN Number</span><p className="font-medium">{viewEmployee.uan_number || "—"}</p></div>
                  <div><span className="text-xs" style={{ color: "#64748B" }}>ESI Number</span><p className="font-medium">{viewEmployee.esi_number || "—"}</p></div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase mb-2" style={{ color: "#64748B" }}>Salary Info</h4>
                <div className="grid grid-cols-2 gap-3 p-3 rounded-lg" style={{ background: "#F5F7FA" }}>
                  <div><span className="text-xs" style={{ color: "#64748B" }}>Base Salary</span><p className="font-medium">₹{Number(viewEmployee.base_salary || 0).toLocaleString()}</p></div>
                  <div><span className="text-xs" style={{ color: "#64748B" }}>Band</span><p className="font-medium">{viewEmployee.band?.name || "—"}</p></div>
                  <div><span className="text-xs" style={{ color: "#64748B" }}>Shift</span><p className="font-medium">{viewEmployee.shift?.name || "—"}</p></div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase mb-2" style={{ color: "#64748B" }}>Reporting Manager</h4>
                <div className="p-3 rounded-lg" style={{ background: "#F5F7FA" }}>
                  {viewEmployee.reporting_manager ? (
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: "#2BAE8E" }}>
                        {((viewEmployee.reporting_manager.user?.first_name?.[0] || "") + (viewEmployee.reporting_manager.user?.last_name?.[0] || "")).toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="font-medium">{viewEmployee.reporting_manager.user ? `${viewEmployee.reporting_manager.user.first_name} ${viewEmployee.reporting_manager.user.last_name || ""}` : "—"}</p>
                        <p className="text-xs" style={{ color: "#64748B" }}>{viewEmployee.reporting_manager.designation}</p>
                      </div>
                    </div>
                  ) : <p style={{ color: "#64748B" }}>—</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/20" onClick={() => setShowAddModal(false)} />
          <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-xl max-h-[90vh] overflow-y-auto" style={{ border: "1px solid #E2E8F0" }}>
            <div className="sticky top-0 bg-white z-10 px-6 py-4 flex items-center justify-between rounded-t-xl" style={{ borderBottom: "1px solid #E2E8F0" }}>
              <h2 className="text-base font-semibold" style={{ color: "#1A3C5E" }}>{editEmployee ? "Edit Employee" : "Add Employee"}</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded hover:bg-gray-100"><X className="w-4 h-4" style={{ color: "#64748B" }} /></button>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>First Name *</label>
                  <input type="text" value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg text-xs outline-none border" style={{ borderColor: "#E2E8F0", background: "#F5F7FA" }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Last Name</label>
                  <input type="text" value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg text-xs outline-none border" style={{ borderColor: "#E2E8F0", background: "#F5F7FA" }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Email *</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg text-xs outline-none border" style={{ borderColor: "#E2E8F0", background: "#F5F7FA" }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Department</label>
                  <select value={formData.department_id} onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg text-xs outline-none border" style={{ borderColor: "#E2E8F0", background: "#F5F7FA", color: "#1A2E44" }}>
                    <option value="">Select Department</option>
                    {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Designation</label>
                  <input type="text" value={formData.designation} onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg text-xs outline-none border" style={{ borderColor: "#E2E8F0", background: "#F5F7FA" }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Employment Type</label>
                  <select value={formData.employment_type} onChange={(e) => setFormData({ ...formData, employment_type: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg text-xs outline-none border" style={{ borderColor: "#E2E8F0", background: "#F5F7FA", color: "#1A2E44" }}>
                    <option value="full_time">Full Time</option>
                    <option value="part_time">Part Time</option>
                    <option value="contract">Contract</option>
                    <option value="intern">Intern</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Date of Joining</label>
                  <input type="date" value={formData.doj} onChange={(e) => setFormData({ ...formData, doj: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg text-xs outline-none border" style={{ borderColor: "#E2E8F0", background: "#F5F7FA" }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Base Salary</label>
                  <input type="number" value={formData.base_salary} onChange={(e) => setFormData({ ...formData, base_salary: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded-lg text-xs outline-none border" style={{ borderColor: "#E2E8F0", background: "#F5F7FA" }} />
                </div>
              </div>

              <div style={{ borderTop: "1px solid #E2E8F0" }} className="pt-4">
                <h4 className="text-xs font-semibold uppercase mb-2" style={{ color: "#64748B" }}>Bank & Compliance</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Bank Account</label>
                    <input type="text" value={formData.bank_account} onChange={(e) => setFormData({ ...formData, bank_account: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg text-xs outline-none border" style={{ borderColor: "#E2E8F0", background: "#F5F7FA" }} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>IFSC Code</label>
                    <input type="text" value={formData.bank_ifsc} onChange={(e) => setFormData({ ...formData, bank_ifsc: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg text-xs outline-none border" style={{ borderColor: "#E2E8F0", background: "#F5F7FA" }} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>PAN Number</label>
                    <input type="text" value={formData.pan_number} onChange={(e) => setFormData({ ...formData, pan_number: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg text-xs outline-none border" style={{ borderColor: "#E2E8F0", background: "#F5F7FA" }} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>UAN Number</label>
                    <input type="text" value={formData.uan_number} onChange={(e) => setFormData({ ...formData, uan_number: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg text-xs outline-none border" style={{ borderColor: "#E2E8F0", background: "#F5F7FA" }} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>ESI Number</label>
                    <input type="text" value={formData.esi_number} onChange={(e) => setFormData({ ...formData, esi_number: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg text-xs outline-none border" style={{ borderColor: "#E2E8F0", background: "#F5F7FA" }} />
                  </div>
                </div>
              </div>

              <div style={{ borderTop: "1px solid #E2E8F0" }} className="pt-4">
                <h4 className="text-xs font-semibold uppercase mb-2" style={{ color: "#64748B" }}>Assignments</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Reporting Manager</label>
                    <select value={formData.reporting_manager_id} onChange={(e) => setFormData({ ...formData, reporting_manager_id: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg text-xs outline-none border" style={{ borderColor: "#E2E8F0", background: "#F5F7FA", color: "#1A2E44" }}>
                      <option value="">Select Manager</option>
                      {allEmployees.filter((e: any) => e.id !== editEmployee?.id).map((emp: any) => (
                        <option key={emp.id} value={emp.id}>{emp.user ? `${emp.user.first_name} ${emp.user.last_name || ""}` : emp.employee_code}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Shift</label>
                    <select value={formData.shift_id} onChange={(e) => setFormData({ ...formData, shift_id: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg text-xs outline-none border" style={{ borderColor: "#E2E8F0", background: "#F5F7FA", color: "#1A2E44" }}>
                      <option value="">Select Shift</option>
                      {shifts.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Band</label>
                    <select value={formData.band_id} onChange={(e) => setFormData({ ...formData, band_id: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg text-xs outline-none border" style={{ borderColor: "#E2E8F0", background: "#F5F7FA", color: "#1A2E44" }}>
                      <option value="">Select Band</option>
                      {bands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 flex items-center justify-end gap-2" style={{ borderTop: "1px solid #E2E8F0" }}>
              <button onClick={() => setShowAddModal(false)} className="px-4 py-1.5 rounded-lg text-xs font-medium" style={{ color: "#64748B", background: "#F5F7FA" }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium text-white transition-colors" style={{ background: "#2BAE8E" }}>
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
