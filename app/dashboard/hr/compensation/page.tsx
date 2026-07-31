"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from "react";
import {
  TrendingUp, ArrowUpDown, AlertCircle, Loader2, RefreshCw,
  Plus, Eye, X, Save, Check, User, DollarSign, Calendar,
  BadgePercent, FileText, ChevronRight
} from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Table from "@/components/ui/table";
import { useIncrements, usePromotions, useEmployees } from "@/lib/hooks";

function SkeletonRow() {
  return <div className="h-10 rounded animate-pulse mb-2" style={{ background: "var(--color-light)" }} />;
}

const EMPTY_INCREMENT = {
  employee_id: "", current_ctc: 0, new_ctc: 0, effective_date: "",
  reason: "", status: "draft",
};

const EMPTY_PROMOTION = {
  employee_id: "", from_designation: "", to_designation: "",
  from_band_id: "", to_band_id: "", from_ctc: 0, to_ctc: 0,
  effective_date: "", reason: "", status: "draft",
};

const statusVariant: Record<string, "teal" | "amber" | "red" | "gray" | "navy"> = {
  draft: "gray",
  approved: "teal",
  paid: "navy",
  effected: "navy",
};

export default function CompensationPage() {
  const [activeTab, setActiveTab] = useState<"increments" | "promotions">("increments");
  const [allEmployees, setAllEmployees] = useState<any[]>([]);
  const [allBands, setAllBands] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  // Increments state
  const [showIncForm, setShowIncForm] = useState(false);
  const [incFormData, setIncFormData] = useState<Record<string, any>>({ ...EMPTY_INCREMENT });
  const [viewInc, setViewInc] = useState<any>(null);

  // Promotions state
  const [showPromForm, setShowPromForm] = useState(false);
  const [promFormData, setPromFormData] = useState<Record<string, any>>({ ...EMPTY_PROMOTION });
  const [viewProm, setViewProm] = useState<any>(null);

  const { increments, isLoading: incLoading, isError: incError, mutate: incMutate } = useIncrements();
  const { promotions, isLoading: promLoading, isError: promError, mutate: promMutate } = usePromotions();
  const { employees: employeeList } = useEmployees();

  useEffect(() => {
    if (feedback) {
      const t = setTimeout(() => setFeedback(null), 3000);
      return () => clearTimeout(t);
    }
  }, [feedback]);

  useEffect(() => {
    fetch("/api/hr/employees?limit=500").then(r => r.json()).then(d => setAllEmployees(d?.data || [])).catch(() => {});
    fetch("/api/hr/bands").then(r => r.json()).then(d => setAllBands(d?.data || [])).catch(() => {});
  }, []);

  // Increment helpers
  const openAddIncrement = () => {
    setIncFormData({ ...EMPTY_INCREMENT });
    setShowIncForm(true);
  };

  const computeIncrementPct = (current: number, newVal: number) =>
    current > 0 ? ((newVal - current) / current * 100).toFixed(2) : "0.00";

  const handleSaveIncrement = async () => {
    setSaving(true);
    try {
      const payload = {
        ...incFormData,
        current_ctc: Number(incFormData.current_ctc),
        new_ctc: Number(incFormData.new_ctc),
        increment_pct: computeIncrementPct(Number(incFormData.current_ctc), Number(incFormData.new_ctc)),
      };
      const res = await fetch("/api/hr/increments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Save failed");
      setFeedback({ type: "success", message: "Increment created" });
      setShowIncForm(false);
      incMutate();
    } catch {
      setFeedback({ type: "error", message: "Failed to save increment" });
    } finally {
      setSaving(false);
    }
  };

  // Promotion helpers
  const openAddPromotion = () => {
    setPromFormData({ ...EMPTY_PROMOTION });
    setShowPromForm(true);
  };

  const handleEmployeeSelectPromo = (empId: string) => {
    const emp = allEmployees.find(e => e.id === empId);
    setPromFormData({
      ...promFormData,
      employee_id: empId,
      from_designation: emp?.designation || "",
      from_band_id: emp?.band_id || "",
      from_ctc: emp?.base_salary || 0,
    });
  };

  const handleSavePromotion = async () => {
    setSaving(true);
    try {
      const payload = {
        ...promFormData,
        from_ctc: Number(promFormData.from_ctc),
        to_ctc: Number(promFormData.to_ctc),
      };
      const res = await fetch("/api/hr/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Save failed");
      setFeedback({ type: "success", message: "Promotion created" });
      setShowPromForm(false);
      promMutate();
    } catch {
      setFeedback({ type: "error", message: "Failed to save promotion" });
    } finally {
      setSaving(false);
    }
  };

  const empName = (emp: any) =>
    emp ? `${emp.employee_code || ""}` : "—";
  const empFullName = (emp: any) => {
    const e = allEmployees.find(x => x.id === emp?.id);
    if (!e?.user) return emp?.employee_code || "—";
    return `${e.user.first_name || ""} ${e.user.last_name || ""}`;
  };
  const empDisplayName = (id: string) => {
    const e = allEmployees.find(x => x.id === id);
    if (!e) return "—";
    return e.user ? `${e.user.first_name || ""} ${e.user.last_name || ""}` : e.employee_code;
  };

  const inputStyle = { border: "1px solid var(--color-border)", borderRadius: "8px", padding: "8px 12px", width: "100%" };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--color-sidebar)" }}>Compensation</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>Manage increments and promotions</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { activeTab === "increments" ? incMutate() : promMutate(); }} className="p-1.5 rounded-lg transition-colors" style={{ color: "var(--color-text-muted)" }} aria-label="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={activeTab === "increments" ? openAddIncrement : openAddPromotion} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors" style={{ background: "var(--color-primary)" }}>
            <Plus className="w-3.5 h-3.5" /> {activeTab === "increments" ? "Add Increment" : "Add Promotion"}
          </button>
        </div>
      </div>

      {feedback && (
        <div className="rounded-lg px-4 py-2.5 text-sm flex items-center gap-2" style={{
          background: feedback.type === "success" ? "rgba(var(--color-primary-rgb),0.08)" : "rgba(var(--color-danger-rgb),0.08)",
          color: feedback.type === "success" ? "var(--color-primary)" : "var(--color-danger)",
          border: feedback.type === "success" ? "1px solid rgba(var(--color-primary-rgb),0.2)" : "1px solid rgba(var(--color-danger-rgb),0.2)",
        }}>
          {feedback.type === "success" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {feedback.message}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: "var(--color-light)", width: "fit-content" }}>
        <button
          onClick={() => setActiveTab("increments")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
          style={{ background: activeTab === "increments" ? "var(--color-white)" : "transparent", color: activeTab === "increments" ? "var(--color-sidebar)" : "var(--color-text-muted)", boxShadow: activeTab === "increments" ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}
        >
          <TrendingUp className="w-3.5 h-3.5" /> Increments
        </button>
        <button
          onClick={() => setActiveTab("promotions")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
          style={{ background: activeTab === "promotions" ? "var(--color-white)" : "transparent", color: activeTab === "promotions" ? "var(--color-sidebar)" : "var(--color-text-muted)", boxShadow: activeTab === "promotions" ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}
        >
          <ArrowUpDown className="w-3.5 h-3.5" /> Promotions
        </button>
      </div>

      {/* ────────────── INCREMENTS TAB ────────────── */}
      {activeTab === "increments" && (
        <Card>
          <CardHeader
            title="Increments"
            subtitle={`${(increments || []).length} records`}
          />
          {incLoading && !increments ? (
            <div className="space-y-1">
              {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
            </div>
          ) : incError ? (
            <div className="rounded-lg px-4 py-2.5 text-sm flex items-center gap-2" style={{ background: "rgba(var(--color-danger-rgb),0.08)", color: "var(--color-danger)", border: "1px solid rgba(var(--color-danger-rgb),0.2)" }}>
              <AlertCircle className="w-4 h-4" />
              Failed to load increments.
              <button onClick={() => incMutate()} className="ml-auto underline text-xs">Retry</button>
            </div>
          ) : !increments || increments.length === 0 ? (
            <div className="text-center py-8">
              <TrendingUp className="w-6 h-6 mx-auto mb-2" style={{ color: "var(--color-text-muted)" }} />
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>No increments found</p>
            </div>
          ) : (
            <Table
              data={increments}
              keyExtractor={(i: any) => i.id}
              onRowClick={(i: any) => setViewInc(i)}
              columns={[
                { key: "employee_code", header: "Employee Code", render: (i: any) => <span className="font-mono text-xs" style={{ color: "var(--color-text-muted)" }}>{i.employee?.employee_code || "—"}</span> },
                { key: "employee_name", header: "Employee Name", render: (i: any) => <span className="text-sm">{empFullName(i.employee) || "—"}</span> },
                { key: "current_ctc", header: "Current CTC", render: (i: any) => <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{"\u20B9"}{Number(i.current_ctc).toLocaleString()}</span> },
                { key: "new_ctc", header: "New CTC", render: (i: any) => <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{"\u20B9"}{Number(i.new_ctc).toLocaleString()}</span> },
                { key: "increment_amount", header: "Inc. Amount", render: (i: any) => <span className="text-xs font-medium" style={{ color: "var(--color-primary)" }}>{"\u20B9"}{(Number(i.new_ctc) - Number(i.current_ctc)).toLocaleString()}</span> },
                { key: "increment_pct", header: "Inc. %", render: (i: any) => <span className="text-xs">{i.increment_pct || computeIncrementPct(Number(i.current_ctc), Number(i.new_ctc))}%</span> },
                { key: "effective_date", header: "Effective Date", render: (i: any) => <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{i.effective_date ? new Date(i.effective_date).toLocaleDateString() : "—"}</span> },
                { key: "status", header: "Status", render: (i: any) => <Badge variant={statusVariant[i.status] || "gray"}>{i.status}</Badge> },
                { key: "actions", header: "Actions", render: (i: any) => (
                  <div className="flex items-center gap-1" onClick={(ev) => ev.stopPropagation()}>
                    <button onClick={() => setViewInc(i)} className="p-1 rounded hover:bg-gray-100" title="View"><Eye className="w-3.5 h-3.5" style={{ color: "var(--color-sidebar)" }} /></button>
                  </div>
                )},
              ]}
            />
          )}
        </Card>
      )}

      {/* ────────────── PROMOTIONS TAB ────────────── */}
      {activeTab === "promotions" && (
        <Card>
          <CardHeader
            title="Promotions"
            subtitle={`${(promotions || []).length} records`}
          />
          {promLoading && !promotions ? (
            <div className="space-y-1">
              {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
            </div>
          ) : promError ? (
            <div className="rounded-lg px-4 py-2.5 text-sm flex items-center gap-2" style={{ background: "rgba(var(--color-danger-rgb),0.08)", color: "var(--color-danger)", border: "1px solid rgba(var(--color-danger-rgb),0.2)" }}>
              <AlertCircle className="w-4 h-4" />
              Failed to load promotions.
              <button onClick={() => promMutate()} className="ml-auto underline text-xs">Retry</button>
            </div>
          ) : !promotions || promotions.length === 0 ? (
            <div className="text-center py-8">
              <ArrowUpDown className="w-6 h-6 mx-auto mb-2" style={{ color: "var(--color-text-muted)" }} />
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>No promotions found</p>
            </div>
          ) : (
            <Table
              data={promotions}
              keyExtractor={(p: any) => p.id}
              onRowClick={(p: any) => setViewProm(p)}
              columns={[
                { key: "employee_code", header: "Employee", render: (p: any) => <span className="text-sm">{empFullName(p.employee) || "—"}</span> },
                { key: "from_designation", header: "From Designation", render: (p: any) => <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{p.from_designation || "—"}</span> },
                { key: "to_designation", header: "To Designation", render: (p: any) => <span className="text-xs">{p.to_designation || "—"}</span> },
                { key: "from_band", header: "From Band", render: (p: any) => <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{p.from_band?.name || "—"}</span> },
                { key: "to_band", header: "To Band", render: (p: any) => <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{p.to_band?.name || "—"}</span> },
                { key: "effective_date", header: "Effective Date", render: (p: any) => <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{p.effective_date ? new Date(p.effective_date).toLocaleDateString() : "—"}</span> },
                { key: "status", header: "Status", render: (p: any) => <Badge variant={statusVariant[p.status] || "gray"}>{p.status}</Badge> },
                { key: "actions", header: "Actions", render: (p: any) => (
                  <div className="flex items-center gap-1" onClick={(ev) => ev.stopPropagation()}>
                    <button onClick={() => setViewProm(p)} className="p-1 rounded hover:bg-gray-100" title="View"><Eye className="w-3.5 h-3.5" style={{ color: "var(--color-sidebar)" }} /></button>
                  </div>
                )},
              ]}
            />
          )}
        </Card>
      )}

      {/* ── View Increment Details Panel ── */}
      {viewInc && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/20" onClick={() => setViewInc(null)} />
          <div className="relative w-full max-w-lg bg-white h-full overflow-y-auto shadow-xl" style={{ borderLeft: "1px solid var(--color-border)" }}>
            <div className="sticky top-0 bg-white z-10 px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--color-border)" }}>
              <h2 className="text-base font-semibold" style={{ color: "var(--color-sidebar)" }}>Increment Details</h2>
              <button onClick={() => setViewInc(null)} className="p-1 rounded hover:bg-gray-100"><X className="w-4 h-4" style={{ color: "var(--color-text-muted)" }} /></button>
            </div>
            <div className="p-6 space-y-6 text-sm">
              <div>
                <h4 className="text-xs font-semibold uppercase mb-2" style={{ color: "var(--color-text-muted)" }}>Employee</h4>
                <div className="grid grid-cols-2 gap-3 p-3 rounded-lg" style={{ background: "var(--color-light)" }}>
                  <div><span className="text-xs" style={{ color: "var(--color-text-muted)" }}>Code</span><p className="font-medium">{viewInc.employee?.employee_code || "—"}</p></div>
                  <div><span className="text-xs" style={{ color: "var(--color-text-muted)" }}>Name</span><p className="font-medium">{empFullName(viewInc.employee) || "—"}</p></div>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase mb-2" style={{ color: "var(--color-text-muted)" }}>Compensation</h4>
                <div className="grid grid-cols-2 gap-3 p-3 rounded-lg" style={{ background: "var(--color-light)" }}>
                  <div><span className="text-xs" style={{ color: "var(--color-text-muted)" }}>Current CTC</span><p className="font-medium">{'\u20B9'}{Number(viewInc.current_ctc).toLocaleString()}</p></div>
                  <div><span className="text-xs" style={{ color: "var(--color-text-muted)" }}>New CTC</span><p className="font-medium">{'\u20B9'}{Number(viewInc.new_ctc).toLocaleString()}</p></div>
                  <div><span className="text-xs" style={{ color: "var(--color-text-muted)" }}>Increment Amount</span><p className="font-medium" style={{ color: "var(--color-primary)" }}>{'\u20B9'}{(Number(viewInc.new_ctc) - Number(viewInc.current_ctc)).toLocaleString()}</p></div>
                  <div><span className="text-xs" style={{ color: "var(--color-text-muted)" }}>Increment %</span><p className="font-medium">{viewInc.increment_pct || computeIncrementPct(Number(viewInc.current_ctc), Number(viewInc.new_ctc))}%</p></div>
                  <div><span className="text-xs" style={{ color: "var(--color-text-muted)" }}>Effective Date</span><p className="font-medium">{viewInc.effective_date ? new Date(viewInc.effective_date).toLocaleDateString() : "—"}</p></div>
                  <div><span className="text-xs" style={{ color: "var(--color-text-muted)" }}>Status</span><p className="font-medium"><Badge variant={statusVariant[viewInc.status] || "gray"}>{viewInc.status}</Badge></p></div>
                </div>
              </div>
              {viewInc.reason && (
                <div>
                  <h4 className="text-xs font-semibold uppercase mb-2" style={{ color: "var(--color-text-muted)" }}>Reason</h4>
                  <div className="p-3 rounded-lg text-xs" style={{ background: "var(--color-light)" }}>{viewInc.reason}</div>
                </div>
              )}
              {viewInc.approved_by_user && (
                <div>
                  <h4 className="text-xs font-semibold uppercase mb-2" style={{ color: "var(--color-text-muted)" }}>Approved By</h4>
                  <div className="p-3 rounded-lg" style={{ background: "var(--color-light)" }}>
                    <p className="font-medium">{viewInc.approved_by_user.first_name} {viewInc.approved_by_user.last_name || ""}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── View Promotion Details Panel ── */}
      {viewProm && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/20" onClick={() => setViewProm(null)} />
          <div className="relative w-full max-w-lg bg-white h-full overflow-y-auto shadow-xl" style={{ borderLeft: "1px solid var(--color-border)" }}>
            <div className="sticky top-0 bg-white z-10 px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--color-border)" }}>
              <h2 className="text-base font-semibold" style={{ color: "var(--color-sidebar)" }}>Promotion Details</h2>
              <button onClick={() => setViewProm(null)} className="p-1 rounded hover:bg-gray-100"><X className="w-4 h-4" style={{ color: "var(--color-text-muted)" }} /></button>
            </div>
            <div className="p-6 space-y-6 text-sm">
              <div>
                <h4 className="text-xs font-semibold uppercase mb-2" style={{ color: "var(--color-text-muted)" }}>Employee</h4>
                <div className="p-3 rounded-lg" style={{ background: "var(--color-light)" }}>
                  <p className="font-medium">{empFullName(viewProm.employee) || "—"}</p>
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{viewProm.employee?.employee_code || ""}</p>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase mb-2" style={{ color: "var(--color-text-muted)" }}>Designation</h4>
                <div className="grid grid-cols-2 gap-3 p-3 rounded-lg" style={{ background: "var(--color-light)" }}>
                  <div><span className="text-xs" style={{ color: "var(--color-text-muted)" }}>From</span><p className="font-medium">{viewProm.from_designation || "—"}</p></div>
                  <div><span className="text-xs" style={{ color: "var(--color-text-muted)" }}>To</span><p className="font-medium">{viewProm.to_designation || "—"}</p></div>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase mb-2" style={{ color: "var(--color-text-muted)" }}>Band</h4>
                <div className="grid grid-cols-2 gap-3 p-3 rounded-lg" style={{ background: "var(--color-light)" }}>
                  <div><span className="text-xs" style={{ color: "var(--color-text-muted)" }}>From Band</span><p className="font-medium">{viewProm.from_band?.name || "—"}</p></div>
                  <div><span className="text-xs" style={{ color: "var(--color-text-muted)" }}>To Band</span><p className="font-medium">{viewProm.to_band?.name || "—"}</p></div>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase mb-2" style={{ color: "var(--color-text-muted)" }}>CTC</h4>
                <div className="grid grid-cols-2 gap-3 p-3 rounded-lg" style={{ background: "var(--color-light)" }}>
                  <div><span className="text-xs" style={{ color: "var(--color-text-muted)" }}>From CTC</span><p className="font-medium">{'\u20B9'}{Number(viewProm.from_ctc).toLocaleString()}</p></div>
                  <div><span className="text-xs" style={{ color: "var(--color-text-muted)" }}>To CTC</span><p className="font-medium">{'\u20B9'}{Number(viewProm.to_ctc).toLocaleString()}</p></div>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase mb-2" style={{ color: "var(--color-text-muted)" }}>Details</h4>
                <div className="grid grid-cols-2 gap-3 p-3 rounded-lg" style={{ background: "var(--color-light)" }}>
                  <div><span className="text-xs" style={{ color: "var(--color-text-muted)" }}>Effective Date</span><p className="font-medium">{viewProm.effective_date ? new Date(viewProm.effective_date).toLocaleDateString() : "—"}</p></div>
                  <div><span className="text-xs" style={{ color: "var(--color-text-muted)" }}>Status</span><p className="font-medium"><Badge variant={statusVariant[viewProm.status] || "gray"}>{viewProm.status}</Badge></p></div>
                </div>
              </div>
              {viewProm.reason && (
                <div>
                  <h4 className="text-xs font-semibold uppercase mb-2" style={{ color: "var(--color-text-muted)" }}>Reason</h4>
                  <div className="p-3 rounded-lg text-xs" style={{ background: "var(--color-light)" }}>{viewProm.reason}</div>
                </div>
              )}
              {viewProm.approved_by_user && (
                <div>
                  <h4 className="text-xs font-semibold uppercase mb-2" style={{ color: "var(--color-text-muted)" }}>Approved By</h4>
                  <div className="p-3 rounded-lg" style={{ background: "var(--color-light)" }}>
                    <p className="font-medium">{viewProm.approved_by_user.first_name} {viewProm.approved_by_user.last_name || ""}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Add Increment Form Modal ── */}
      {showIncForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/20" onClick={() => setShowIncForm(false)} />
          <div className="relative w-full max-w-xl bg-white rounded-xl shadow-xl max-h-[90vh] overflow-y-auto" style={{ border: "1px solid var(--color-border)" }}>
            <div className="sticky top-0 bg-white z-10 px-6 py-4 flex items-center justify-between rounded-t-xl" style={{ borderBottom: "1px solid var(--color-border)" }}>
              <h2 className="text-base font-semibold" style={{ color: "var(--color-sidebar)" }}>Add Increment</h2>
              <button onClick={() => setShowIncForm(false)} className="p-1 rounded hover:bg-gray-100"><X className="w-4 h-4" style={{ color: "var(--color-text-muted)" }} /></button>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>Employee *</label>
                <select
                  value={incFormData.employee_id}
                  onChange={(e) => {
                    const emp = allEmployees.find(x => x.id === e.target.value);
                    setIncFormData({ ...incFormData, employee_id: e.target.value, current_ctc: emp?.base_salary || 0 });
                  }}
                  style={inputStyle}
                >
                  <option value="">Select Employee</option>
                  {allEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.user ? `${emp.user.first_name || ""} ${emp.user.last_name || ""}` : emp.employee_code} ({emp.employee_code})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>Current CTC (₹)</label>
                  <input type="number" value={incFormData.current_ctc} onChange={(e) => setIncFormData({ ...incFormData, current_ctc: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>New CTC (₹)</label>
                  <input type="number" value={incFormData.new_ctc} onChange={(e) => setIncFormData({ ...incFormData, new_ctc: e.target.value })} style={inputStyle} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>Increment % (auto-computed)</label>
                <input type="text" readOnly value={computeIncrementPct(Number(incFormData.current_ctc), Number(incFormData.new_ctc)) + "%"} style={{ ...inputStyle, background: "var(--color-light)", color: "var(--color-text-muted)" }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>Effective Date *</label>
                <input type="date" value={incFormData.effective_date} onChange={(e) => setIncFormData({ ...incFormData, effective_date: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>Reason</label>
                <textarea rows={3} value={incFormData.reason} onChange={(e) => setIncFormData({ ...incFormData, reason: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>Status</label>
                <select value={incFormData.status} onChange={(e) => setIncFormData({ ...incFormData, status: e.target.value })} style={inputStyle}>
                  <option value="draft">Draft</option>
                  <option value="approved">Approved</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
            </div>
            <div className="px-6 py-4 flex items-center justify-end gap-2" style={{ borderTop: "1px solid var(--color-border)" }}>
              <button onClick={() => setShowIncForm(false)} className="px-4 py-1.5 rounded-lg text-xs font-medium" style={{ color: "var(--color-text-muted)", background: "var(--color-light)" }}>Cancel</button>
              <button onClick={handleSaveIncrement} disabled={saving} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium text-white transition-colors" style={{ background: "var(--color-primary)" }}>
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Promotion Form Modal ── */}
      {showPromForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/20" onClick={() => setShowPromForm(false)} />
          <div className="relative w-full max-w-xl bg-white rounded-xl shadow-xl max-h-[90vh] overflow-y-auto" style={{ border: "1px solid var(--color-border)" }}>
            <div className="sticky top-0 bg-white z-10 px-6 py-4 flex items-center justify-between rounded-t-xl" style={{ borderBottom: "1px solid var(--color-border)" }}>
              <h2 className="text-base font-semibold" style={{ color: "var(--color-sidebar)" }}>Add Promotion</h2>
              <button onClick={() => setShowPromForm(false)} className="p-1 rounded hover:bg-gray-100"><X className="w-4 h-4" style={{ color: "var(--color-text-muted)" }} /></button>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>Employee *</label>
                <select
                  value={promFormData.employee_id}
                  onChange={(e) => handleEmployeeSelectPromo(e.target.value)}
                  style={inputStyle}
                >
                  <option value="">Select Employee</option>
                  {allEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.user ? `${emp.user.first_name || ""} ${emp.user.last_name || ""}` : emp.employee_code} ({emp.employee_code})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>From Designation</label>
                  <input type="text" value={promFormData.from_designation} readOnly style={{ ...inputStyle, background: "var(--color-light)", color: "var(--color-text-muted)" }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>To Designation *</label>
                  <input type="text" value={promFormData.to_designation} onChange={(e) => setPromFormData({ ...promFormData, to_designation: e.target.value })} style={inputStyle} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>From Band</label>
                  <select value={promFormData.from_band_id} onChange={(e) => setPromFormData({ ...promFormData, from_band_id: e.target.value })} style={inputStyle}>
                    <option value="">Select Band</option>
                    {allBands.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>To Band *</label>
                  <select value={promFormData.to_band_id} onChange={(e) => setPromFormData({ ...promFormData, to_band_id: e.target.value })} style={inputStyle}>
                    <option value="">Select Band</option>
                    {allBands.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>From CTC (₹)</label>
                  <input type="number" value={promFormData.from_ctc} onChange={(e) => setPromFormData({ ...promFormData, from_ctc: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>To CTC (₹) *</label>
                  <input type="number" value={promFormData.to_ctc} onChange={(e) => setPromFormData({ ...promFormData, to_ctc: e.target.value })} style={inputStyle} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>Effective Date *</label>
                <input type="date" value={promFormData.effective_date} onChange={(e) => setPromFormData({ ...promFormData, effective_date: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>Reason</label>
                <textarea rows={3} value={promFormData.reason} onChange={(e) => setPromFormData({ ...promFormData, reason: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>Status</label>
                <select value={promFormData.status} onChange={(e) => setPromFormData({ ...promFormData, status: e.target.value })} style={inputStyle}>
                  <option value="draft">Draft</option>
                  <option value="approved">Approved</option>
                  <option value="effected">Effected</option>
                </select>
              </div>
            </div>
            <div className="px-6 py-4 flex items-center justify-end gap-2" style={{ borderTop: "1px solid var(--color-border)" }}>
              <button onClick={() => setShowPromForm(false)} className="px-4 py-1.5 rounded-lg text-xs font-medium" style={{ color: "var(--color-text-muted)", background: "var(--color-light)" }}>Cancel</button>
              <button onClick={handleSavePromotion} disabled={saving} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium text-white transition-colors" style={{ background: "var(--color-primary)" }}>
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Toast */}
      {feedback && (
        <div className="fixed bottom-6 right-6 z-[100] rounded-lg px-4 py-2.5 text-sm flex items-center gap-2 shadow-lg" style={{
          background: feedback.type === "success" ? "var(--color-primary)" : "var(--color-danger)",
          color: "var(--color-white)",
        }}>
          {feedback.type === "success" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {feedback.message}
        </div>
      )}
    </div>
  );
}
