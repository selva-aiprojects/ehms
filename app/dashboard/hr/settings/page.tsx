"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from "react";
import {
  Settings, AlertCircle, Loader2, RefreshCw,
  Plus, Check, X, Edit2, Save, Building, Briefcase,
  Layers, DollarSign, ChevronRight
} from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";

function SkeletonRow() {
  return <div className="h-14 rounded animate-pulse mb-2" style={{ background: "#F5F7FA" }} />;
}

const SECTIONS = [
  { key: "departments", label: "Departments", icon: Building, desc: "Manage departments and managers" },
  { key: "designations", label: "Designations", icon: Briefcase, desc: "Job titles and hierarchy levels" },
  { key: "bands", label: "Employee Bands", icon: Layers, desc: "Salary band classifications" },
  { key: "salary_structures", label: "Salary Structures", icon: DollarSign, desc: "Pay component percentages per band" },
];

const EMPTY_DEPT = { name: "", code: "", manager_id: "" };
const EMPTY_DESIG = { name: "", code: "", department_id: "", level: 1 };
const EMPTY_BAND = { name: "", code: "", description: "" };
const EMPTY_SALARY_STRUCT = { band_id: "", name: "", base_percentage: 60, hra_percentage: 20, pf_applicable: true };

export default function HRSettingsPage() {
  const [activeSection, setActiveSection] = useState("departments");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [bands, setBands] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const [deptForm, setDeptForm] = useState({ ...EMPTY_DEPT });
  const [desigForm, setDesigForm] = useState({ ...EMPTY_DESIG });
  const [bandForm, setBandForm] = useState({ ...EMPTY_BAND });
  const [salaryForm, setSalaryForm] = useState({ ...EMPTY_SALARY_STRUCT });

  const currentForm = {
    departments: deptForm,
    designations: desigForm,
    bands: bandForm,
    salary_structures: salaryForm,
  }[activeSection];

  const setCurrentForm = (val: any) => {
    const setters: Record<string, (v: any) => void> = {
      departments: setDeptForm, designations: setDesigForm, bands: setBandForm, salary_structures: setSalaryForm,
    };
    setters[activeSection]?.(val);
  };

  const resetForm = () => {
    const defaults: Record<string, any> = {
      departments: EMPTY_DEPT, designations: EMPTY_DESIG, bands: EMPTY_BAND, salary_structures: EMPTY_SALARY_STRUCT,
    };
    setCurrentForm(defaults[activeSection]);
    setEditingId(null);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/hr/${activeSection}`);
      const d = await res.json();
      setData(d?.data || []);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (feedback) {
      const t = setTimeout(() => setFeedback(null), 3000);
      return () => clearTimeout(t);
    }
  }, [feedback]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    fetch("/api/hr/employees?limit=500").then(r => r.json()).then(d => setEmployees(d?.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    resetForm(); // eslint-disable-line react-hooks/set-state-in-effect
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [activeSection]);

  useEffect(() => {
    if (activeSection === "salary_structures") {
      fetch("/api/hr/departments").then(r => r.json()).then(d => setDepartments(d?.data || [])).catch(() => {});
      fetch("/api/hr/bands").then(r => r.json()).then(d => setBands(d?.data || [])).catch(() => {});
    }
  }, [activeSection]);

  const openAdd = () => { resetForm(); setShowForm(true); };

  const openEdit = (item: any) => {
    setEditingId(item.id);
    const formMap: Record<string, any> = {
      departments: { name: item.name, code: item.code || "", manager_id: item.manager_id || "" },
      designations: { name: item.name, code: item.code || "", department_id: item.department_id || "", level: item.level || 1 },
      bands: { name: item.name, code: item.code || "", description: item.description || "" },
      salary_structures: { band_id: item.band_id || "", name: item.name || "", base_percentage: item.base_percentage || 60, hra_percentage: item.hra_percentage || 20, pf_applicable: item.pf_applicable !== false },
    };
    setCurrentForm(formMap[activeSection]);
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const url = editingId ? `/api/hr/${activeSection}/${editingId}` : `/api/hr/${activeSection}`;
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentForm),
      });
      if (!res.ok) throw new Error();
      setFeedback({ type: "success", message: "Saved successfully" });
      setShowForm(false);
      fetchData();
    } catch {
      setFeedback({ type: "error", message: "Save failed" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/hr/${activeSection}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setFeedback({ type: "success", message: "Deleted successfully" });
      fetchData();
    } catch {
      setFeedback({ type: "error", message: "Delete failed" });
    }
  };

  const renderForm = () => {
    if (!showForm) return null;
    const common = (
      <div className="flex items-center justify-end gap-2 pt-3 mt-4" style={{ borderTop: "1px solid #E2E8F0" }}>
        <button onClick={() => { setShowForm(false); resetForm(); }} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ color: "#64748B", background: "#F5F7FA" }}>Cancel</button>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors" style={{ background: "#2BAE8E" }}>
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    );

    if (activeSection === "departments") return (
      <div className="space-y-3 text-sm">
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Department Name *</label>
          <input type="text" value={deptForm.name} onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
            className="w-full px-3 py-1.5 rounded-lg text-xs outline-none border" style={{ borderColor: "#E2E8F0", background: "#F5F7FA" }} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Code</label>
          <input type="text" value={deptForm.code} onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })}
            className="w-full px-3 py-1.5 rounded-lg text-xs outline-none border" style={{ borderColor: "#E2E8F0", background: "#F5F7FA" }} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Manager</label>
          <select value={deptForm.manager_id} onChange={(e) => setDeptForm({ ...deptForm, manager_id: e.target.value })}
            className="w-full px-3 py-1.5 rounded-lg text-xs outline-none border" style={{ borderColor: "#E2E8F0", background: "#F5F7FA", color: "#1A2E44" }}>
            <option value="">Select Manager</option>
            {employees.map((e: any) => <option key={e.id} value={e.id}>{e.user ? `${e.user.first_name} ${e.user.last_name || ""}` : e.employee_code}</option>)}
          </select>
        </div>
        {common}
      </div>
    );

    if (activeSection === "designations") return (
      <div className="space-y-3 text-sm">
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Designation Name *</label>
          <input type="text" value={desigForm.name} onChange={(e) => setDesigForm({ ...desigForm, name: e.target.value })}
            className="w-full px-3 py-1.5 rounded-lg text-xs outline-none border" style={{ borderColor: "#E2E8F0", background: "#F5F7FA" }} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Code</label>
          <input type="text" value={desigForm.code} onChange={(e) => setDesigForm({ ...desigForm, code: e.target.value })}
            className="w-full px-3 py-1.5 rounded-lg text-xs outline-none border" style={{ borderColor: "#E2E8F0", background: "#F5F7FA" }} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Department</label>
          <select value={desigForm.department_id} onChange={(e) => setDesigForm({ ...desigForm, department_id: e.target.value })}
            className="w-full px-3 py-1.5 rounded-lg text-xs outline-none border" style={{ borderColor: "#E2E8F0", background: "#F5F7FA", color: "#1A2E44" }}>
            <option value="">Select Department</option>
            {data.length > 0 && data.filter((d: any) => d.department).map((d: any) => (
              <option key={d.department.id} value={d.department.id}>{d.department.name}</option>
            ))}
            {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Level</label>
          <input type="number" min={1} max={20} value={desigForm.level} onChange={(e) => setDesigForm({ ...desigForm, level: Number(e.target.value) })}
            className="w-full px-3 py-1.5 rounded-lg text-xs outline-none border" style={{ borderColor: "#E2E8F0", background: "#F5F7FA" }} />
        </div>
        {common}
      </div>
    );

    if (activeSection === "bands") return (
      <div className="space-y-3 text-sm">
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Band Name *</label>
          <input type="text" value={bandForm.name} onChange={(e) => setBandForm({ ...bandForm, name: e.target.value })}
            className="w-full px-3 py-1.5 rounded-lg text-xs outline-none border" style={{ borderColor: "#E2E8F0", background: "#F5F7FA" }} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Code</label>
          <input type="text" value={bandForm.code} onChange={(e) => setBandForm({ ...bandForm, code: e.target.value })}
            className="w-full px-3 py-1.5 rounded-lg text-xs outline-none border" style={{ borderColor: "#E2E8F0", background: "#F5F7FA" }} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Description</label>
          <textarea value={bandForm.description} onChange={(e) => setBandForm({ ...bandForm, description: e.target.value })}
            className="w-full px-3 py-1.5 rounded-lg text-xs outline-none border" style={{ borderColor: "#E2E8F0", background: "#F5F7FA", minHeight: 60 }} />
        </div>
        {common}
      </div>
    );

    if (activeSection === "salary_structures") return (
      <div className="space-y-3 text-sm">
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Structure Name *</label>
          <input type="text" value={salaryForm.name} onChange={(e) => setSalaryForm({ ...salaryForm, name: e.target.value })}
            className="w-full px-3 py-1.5 rounded-lg text-xs outline-none border" style={{ borderColor: "#E2E8F0", background: "#F5F7FA" }} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Band</label>
          <select value={salaryForm.band_id} onChange={(e) => setSalaryForm({ ...salaryForm, band_id: e.target.value })}
            className="w-full px-3 py-1.5 rounded-lg text-xs outline-none border" style={{ borderColor: "#E2E8F0", background: "#F5F7FA", color: "#1A2E44" }}>
            <option value="">Select Band</option>
            {bands.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Base %</label>
            <input type="number" min={0} max={100} value={salaryForm.base_percentage} onChange={(e) => setSalaryForm({ ...salaryForm, base_percentage: Number(e.target.value) })}
              className="w-full px-3 py-1.5 rounded-lg text-xs outline-none border" style={{ borderColor: "#E2E8F0", background: "#F5F7FA" }} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>HRA %</label>
            <input type="number" min={0} max={100} value={salaryForm.hra_percentage} onChange={(e) => setSalaryForm({ ...salaryForm, hra_percentage: Number(e.target.value) })}
              className="w-full px-3 py-1.5 rounded-lg text-xs outline-none border" style={{ borderColor: "#E2E8F0", background: "#F5F7FA" }} />
          </div>
        </div>
        <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: "#1A2E44" }}>
          <input type="checkbox" checked={salaryForm.pf_applicable} onChange={(e) => setSalaryForm({ ...salaryForm, pf_applicable: e.target.checked })} />
          PF Applicable
        </label>
        {common}
      </div>
    );
  };

  const renderList = () => {
    if (loading) return <div className="space-y-1">{Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}</div>;
    if (data.length === 0) return (
      <div className="text-center py-8">
        <div className="w-8 h-8 mx-auto mb-2 flex items-center justify-center rounded-full" style={{ background: "#F5F7FA" }}>
          {activeSection === "departments" ? <Building className="w-4 h-4" style={{ color: "#64748B" }} /> :
           activeSection === "designations" ? <Briefcase className="w-4 h-4" style={{ color: "#64748B" }} /> :
           activeSection === "bands" ? <Layers className="w-4 h-4" style={{ color: "#64748B" }} /> :
           <DollarSign className="w-4 h-4" style={{ color: "#64748B" }} />}
        </div>
        <p className="text-sm" style={{ color: "#64748B" }}>No items yet</p>
      </div>
    );

    return (
      <div className="space-y-2">
        {data.map((item: any) => (
          <div key={item.id} className="flex items-center justify-between p-3 rounded-lg text-sm" style={{ background: "#F5F7FA" }}>
            <div>
              <div className="font-medium" style={{ color: "#1A2E44" }}>{item.name}</div>
              <div className="text-xs" style={{ color: "#64748B" }}>
                {activeSection === "departments" && <>Code: {item.code || "—"} · Manager: {item.manager?.user ? `${item.manager.user.first_name} ${item.manager.user.last_name || ""}` : "—"}</>}
                {activeSection === "designations" && <>Code: {item.code || "—"} · Level: {item.level || "—"} · Dept: {item.department?.name || "—"}</>}
                {activeSection === "bands" && <>{item.description || item.code ? `Code: ${item.code || ""} ${item.description ? `· ${item.description}` : ""}` : "—"}</>}
                {activeSection === "salary_structures" && <>Band: {item.band?.name || "—"} · Base: {item.base_percentage}% · HRA: {item.hra_percentage}% · PF: {item.pf_applicable ? "Yes" : "No"}</>}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => openEdit(item)} className="p-1.5 rounded hover:bg-gray-100"><Edit2 className="w-3.5 h-3.5" style={{ color: "#2BAE8E" }} /></button>
              <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded hover:bg-gray-100"><X className="w-3.5 h-3.5" style={{ color: "#E53E3E" }} /></button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#1A3C5E" }}>HR Settings</h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>Configure departments, designations, bands & salary structures</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="space-y-1">
          {SECTIONS.map((section) => (
            <button key={section.key} onClick={() => setActiveSection(section.key)}
              className="w-full text-left p-3 rounded-lg transition-colors"
              style={{ background: activeSection === section.key ? "#1A3C5E" : "transparent", color: activeSection === section.key ? "#FFF" : "#1A2E44" }}>
              <div className="flex items-center gap-2 text-sm font-medium">
                <section.icon className="w-4 h-4" />
                {section.label}
              </div>
              <div className="text-[10px] mt-0.5 opacity-70">{section.desc}</div>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardHeader
              title={SECTIONS.find((s) => s.key === activeSection)?.label || ""}
              action={
                <button onClick={openAdd} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors" style={{ background: "#2BAE8E" }}>
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              }
            />
            {renderList()}
          </Card>

          {/* Inline Form */}
          {showForm && (
            <Card>
              <CardHeader title={editingId ? "Edit" : "New"} />
              {renderForm()}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
