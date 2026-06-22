"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from "react";
import {
  DollarSign, AlertCircle, Loader2, RefreshCw,
  Plus, Check, X, ChevronDown, ChevronRight, Calendar,
  Users, TrendingUp, FileText, ArrowRight, Play, ThumbsUp,
  CreditCard, Eye, Building
} from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Table from "@/components/ui/table";

function SkeletonRow() {
  return <div className="h-10 rounded animate-pulse mb-2" style={{ background: "#F5F7FA" }} />;
}

function SkeletonCard() {
  return <div className="rounded-xl p-4 animate-pulse" style={{ background: "#E2E8F0" }}>
    <div className="w-12 h-8 rounded mb-2" style={{ background: "#CBD5E1" }} />
    <div className="w-16 h-3 rounded" style={{ background: "#CBD5E1" }} />
  </div>;
}

export default function PayrollPage() {
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [selectedPayroll, setSelectedPayroll] = useState<any | null>(null);
  const [payrollDetails, setPayrollDetails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showRunModal, setShowRunModal] = useState(false);
  const [runForm, setRunForm] = useState({ property_id: "", period_start: "", period_end: "" });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [summary, setSummary] = useState({ totalMtd: 0, avgSalary: 0, totalEmployees: 0 });

  useEffect(() => {
    if (feedback) {
      const t = setTimeout(() => setFeedback(null), 3000);
      return () => clearTimeout(t);
    }
  }, [feedback]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const payRes = await fetch("/api/hr/payroll");
      const payData = await payRes.json();
      setPayrolls(payData?.data || []);
    } catch {
      setPayrolls([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(); // eslint-disable-line react-hooks/set-state-in-effect
    fetch("/api/properties").then(r => r.json()).then(d => setProperties(d?.data || [])).catch(() => {});
  }, []);

  const fetchPayrollDetails = async (id: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/hr/payroll/${id}`);
      const data = await res.json();
      setPayrollDetails(data?.data || []);
    } catch {
      setPayrollDetails([]);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleView = (pr: any) => {
    setSelectedPayroll(pr);
    fetchPayrollDetails(pr.id);
  };

  const handleStatusUpdate = async (prId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/hr/payroll/${prId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      setFeedback({ type: "success", message: `Payroll ${newStatus}` });
      fetchData();
      if (selectedPayroll?.id === prId) {
        setSelectedPayroll({ ...selectedPayroll, status: newStatus });
      }
    } catch {
      setFeedback({ type: "error", message: "Status update failed" });
    }
  };

  const handleRunPayroll = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/hr/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(runForm),
      });
      if (!res.ok) throw new Error();
      setFeedback({ type: "success", message: "Payroll run created" });
      setShowRunModal(false);
      setRunForm({ property_id: "", period_start: "", period_end: "" });
      fetchData();
    } catch {
      setFeedback({ type: "error", message: "Failed to run payroll" });
    } finally {
      setSaving(false);
    }
  };

  const statusBadge = (s: string) => {
    const map: Record<string, "teal" | "amber" | "red" | "gray" | "navy"> = {
      computed: "teal", approved: "navy", paid: "teal",
      draft: "gray", processing: "amber", failed: "red",
    };
    return <Badge variant={map[s] || "gray"}>{(s || "draft").charAt(0).toUpperCase() + (s || "draft").slice(1)}</Badge>;
  };

  const statusActions = (pr: any) => {
    const nextSteps: Record<string, { label: string; status: string; color: string }[]> = {
      draft: [{ label: "Compute", status: "computed", color: "#1A3C5E" }],
      computed: [{ label: "Approve", status: "approved", color: "#2BAE8E" }],
      approved: [{ label: "Mark Paid", status: "paid", color: "#2BAE8E" }],
    };
    const steps = nextSteps[pr.status] || [];
    return steps.map((step) => (
      <button key={step.status} onClick={() => handleStatusUpdate(pr.id, step.status)}
        className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium text-white transition-colors" style={{ background: step.color }}>
        {step.status === "computed" ? <Play className="w-3 h-3" /> : step.status === "approved" ? <ThumbsUp className="w-3 h-3" /> : <Check className="w-3 h-3" />}
        {step.label}
      </button>
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#1A3C5E" }}>Payroll</h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>Manage payroll runs and salary processing</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchData} className="p-1.5 rounded-lg transition-colors" style={{ color: "#64748B" }} aria-label="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => setShowRunModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors" style={{ background: "#2BAE8E" }}>
            <Plus className="w-3.5 h-3.5" /> Run Payroll
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

      {/* Summary Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl p-4 text-white" style={{ background: "#1A3C5E" }}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl font-bold">₹{Number(summary.totalMtd || 0).toLocaleString()}</div>
              <DollarSign className="w-5 h-5 opacity-60" />
            </div>
            <div className="text-xs opacity-80">Total Payroll MTD</div>
          </div>
          <div className="rounded-xl p-4 text-white" style={{ background: "#2BAE8E" }}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl font-bold">₹{Number(summary.avgSalary || 0).toLocaleString()}</div>
              <TrendingUp className="w-5 h-5 opacity-60" />
            </div>
            <div className="text-xs opacity-80">Average Salary</div>
          </div>
          <div className="rounded-xl p-4" style={{ background: "#F5A623" }}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl font-bold" style={{ color: "#1A2E44" }}>{summary.totalEmployees || 0}</div>
              <Users className="w-5 h-5" style={{ color: "rgba(0,0,0,0.4)" }} />
            </div>
            <div className="text-xs" style={{ color: "rgba(0,0,0,0.6)" }}>Total Employees</div>
          </div>
        </div>
      )}

      {/* Payroll Runs Table */}
      <Card>
        <CardHeader title="Payroll Runs" subtitle={`${payrolls.length} runs`} />
        {loading ? (
          <div className="space-y-1">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
          </div>
        ) : payrolls.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-6 h-6 mx-auto mb-2" style={{ color: "#64748B" }} />
            <p className="text-sm" style={{ color: "#64748B" }}>No payroll runs yet</p>
          </div>
        ) : (
          <Table
            data={payrolls}
            keyExtractor={(pr: any) => pr.id}
            columns={[
              { key: "run_id", header: "Run ID", render: (pr: any) => <span className="font-mono text-xs" style={{ color: "#64748B" }}>{pr.run_id || pr.id?.slice(0, 8) || "—"}</span> },
              { key: "period", header: "Period", render: (pr: any) => <span className="text-xs">{pr.period_start ? new Date(pr.period_start).toLocaleDateString("en-IN") : "—"} - {pr.period_end ? new Date(pr.period_end).toLocaleDateString("en-IN") : "—"}</span> },
              { key: "total_gross", header: "Total Gross", render: (pr: any) => <span className="text-xs font-medium">₹{Number(pr.total_gross || 0).toLocaleString()}</span> },
              { key: "total_deductions", header: "Total Deductions", render: (pr: any) => <span className="text-xs" style={{ color: "#E53E3E" }}>₹{Number(pr.total_deductions || 0).toLocaleString()}</span> },
              { key: "total_net", header: "Total Net", render: (pr: any) => <span className="text-xs font-semibold" style={{ color: "#1A3C5E" }}>₹{Number(pr.total_net || 0).toLocaleString()}</span> },
              { key: "status", header: "Status", render: (pr: any) => statusBadge(pr.status) },
              { key: "processed_by", header: "Processed By", render: (pr: any) => <span className="text-xs" style={{ color: "#64748B" }}>{pr.processed_by?.user ? `${pr.processed_by.user.first_name} ${pr.processed_by.user.last_name || ""}` : "—"}</span> },
              { key: "actions", header: "Actions", render: (pr: any) => (
                <div className="flex items-center gap-1">
                  {statusActions(pr)}
                  <button onClick={() => handleView(pr)} className="p-1 rounded hover:bg-gray-100" title="View Details">
                    <Eye className="w-3.5 h-3.5" style={{ color: "#1A3C5E" }} />
                  </button>
                </div>
              )},
            ]}
          />
        )}
      </Card>

      {/* Payroll Detail */}
      {selectedPayroll && (
        <Card>
          <CardHeader
            title={`Payroll Detail: ${selectedPayroll.run_id || selectedPayroll.id?.slice(0, 8)}`}
            subtitle={`Status: ${selectedPayroll.status}`}
            action={
              <div className="flex items-center gap-2">
                {statusActions(selectedPayroll)}
                <button onClick={() => setSelectedPayroll(null)} className="p-1 rounded hover:bg-gray-100"><X className="w-4 h-4" style={{ color: "#64748B" }} /></button>
              </div>
            }
          />
          {detailLoading ? (
            <div className="space-y-1">
              {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
            </div>
          ) : payrollDetails.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-6 h-6 mx-auto mb-2" style={{ color: "#64748B" }} />
              <p className="text-sm" style={{ color: "#64748B" }}>No detail records</p>
            </div>
          ) : (
            <Table
              data={payrollDetails}
              keyExtractor={(pd: any) => pd.id || Math.random().toString()}
              columns={[
                { key: "employee", header: "Employee", render: (pd: any) => (
                  <span className="text-xs font-medium">{pd.employee?.user ? `${pd.employee.user.first_name} ${pd.employee.user.last_name || ""}` : pd.employee?.employee_code || "—"}</span>
                )},
                { key: "department", header: "Department", render: (pd: any) => <span className="text-xs" style={{ color: "#64748B" }}>{pd.employee?.department?.name || "—"}</span> },
                { key: "gross_pay", header: "Gross Pay", render: (pd: any) => <span className="text-xs">₹{Number(pd.gross_pay || 0).toLocaleString()}</span> },
                { key: "pf", header: "PF", render: (pd: any) => <span className="text-xs" style={{ color: "#64748B" }}>₹{Number(pd.pf || 0).toLocaleString()}</span> },
                { key: "esi", header: "ESI", render: (pd: any) => <span className="text-xs" style={{ color: "#64748B" }}>₹{Number(pd.esi || 0).toLocaleString()}</span> },
                { key: "pt", header: "PT", render: (pd: any) => <span className="text-xs" style={{ color: "#64748B" }}>₹{Number(pd.pt || 0).toLocaleString()}</span> },
                { key: "tds", header: "TDS", render: (pd: any) => <span className="text-xs" style={{ color: "#64748B" }}>₹{Number(pd.tds || 0).toLocaleString()}</span> },
                { key: "net_pay", header: "Net Pay", render: (pd: any) => <span className="text-xs font-semibold" style={{ color: "#2BAE8E" }}>₹{Number(pd.net_pay || 0).toLocaleString()}</span> },
              ]}
            />
          )}
        </Card>
      )}

      {/* Run Payroll Modal */}
      {showRunModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/20" onClick={() => setShowRunModal(false)} />
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-xl" style={{ border: "1px solid #E2E8F0" }}>
            <div className="px-6 py-4 flex items-center justify-between rounded-t-xl" style={{ borderBottom: "1px solid #E2E8F0" }}>
              <h2 className="text-base font-semibold" style={{ color: "#1A3C5E" }}>Run Payroll</h2>
              <button onClick={() => setShowRunModal(false)} className="p-1 rounded hover:bg-gray-100"><X className="w-4 h-4" style={{ color: "#64748B" }} /></button>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Property</label>
                <select value={runForm.property_id} onChange={(e) => setRunForm({ ...runForm, property_id: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg text-xs outline-none border" style={{ borderColor: "#E2E8F0", background: "#F5F7FA", color: "#1A2E44" }}>
                  <option value="">Select Property</option>
                  {properties.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Period Start *</label>
                  <input type="date" value={runForm.period_start} onChange={(e) => setRunForm({ ...runForm, period_start: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg text-xs outline-none border" style={{ borderColor: "#E2E8F0", background: "#F5F7FA" }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Period End *</label>
                  <input type="date" value={runForm.period_end} onChange={(e) => setRunForm({ ...runForm, period_end: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg text-xs outline-none border" style={{ borderColor: "#E2E8F0", background: "#F5F7FA" }} />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 flex items-center justify-end gap-2" style={{ borderTop: "1px solid #E2E8F0" }}>
              <button onClick={() => setShowRunModal(false)} className="px-4 py-1.5 rounded-lg text-xs font-medium" style={{ color: "#64748B", background: "#F5F7FA" }}>Cancel</button>
              <button onClick={handleRunPayroll} disabled={saving || !runForm.period_start || !runForm.period_end}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium text-white transition-colors" style={{ background: "#2BAE8E" }}>
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                {saving ? "Processing..." : "Run Payroll"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
