"use client";

import { useState, useEffect } from "react";
import {
  FileText, Plus, Search, Loader2, RefreshCw, CheckCircle, AlertCircle,
  ChevronDown, ChevronRight, Edit2, X, Trash2, Home, User, Calendar, DollarSign
} from "lucide-react";
import Card from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import { useLeases, useProperties, useGuests } from "@/lib/hooks";
import { useCreateLease, useUpdateLease } from "@/lib/hooks/mutations";

const STATUS_BADGE: Record<string, "teal" | "amber" | "red" | "gray" | "navy"> = {
  active: "teal", renewal_due: "amber", signed: "navy", drafted: "gray", terminated: "red", renewed: "teal",
};

export default function LeasesPage() {
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editLease, setEditLease] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [expandedLease, setExpandedLease] = useState<string | null>(null);
  const [statusAction, setStatusAction] = useState<string | null>(null);

  const { leases = [], isLoading, mutate } = useLeases({ status: filterStatus || undefined });
  const { properties = [] } = useProperties("rental_apartment");
  const { guests = [] } = useGuests("", 1);

  const { trigger: createLease, isMutating: isCreating } = useCreateLease();
  const { trigger: updateLease, isMutating: isUpdating } = useUpdateLease();

  const [formData, setFormData] = useState({
    property_id: "", unit_id: "", tenant_id: "",
    start_date: "", end_date: "",
    rent_amount: "", security_deposit: "", notice_period_days: "30",
    status: "active",
  });

  const [availableUnits, setAvailableUnits] = useState<any[]>([]);

  useEffect(() => {
    if (actionFeedback) {
      const t = setTimeout(() => setActionFeedback(null), 3000);
      return () => clearTimeout(t);
    }
  }, [actionFeedback]);

  useEffect(() => {
    if (formData.property_id) {
      const prop = properties.find((p: any) => p.id === formData.property_id);
      const units = (prop?.units || []).filter((u: any) => u.status === "vacant" || (editLease && u.id === formData.unit_id));
      setAvailableUnits(units);
    } else {
      setAvailableUnits([]);
    }
  }, [formData.property_id, properties, editLease]);

  function resetForm() {
    setFormData({
      property_id: "", unit_id: "", tenant_id: "",
      start_date: "", end_date: "", rent_amount: "",
      security_deposit: "", notice_period_days: "30", status: "active",
    });
    setAvailableUnits([]);
  }

  function handleEdit(lease: any) {
    setEditLease(lease);
    setFormData({
      property_id: lease.property_id || lease.property?.id || "",
      unit_id: lease.unit_id || lease.unit?.id || "",
      tenant_id: lease.tenant_id || lease.tenant?.id || "",
      start_date: lease.start_date?.split("T")[0] || "",
      end_date: lease.end_date?.split("T")[0] || "",
      rent_amount: String(lease.rent_amount || ""),
      security_deposit: String(lease.security_deposit || ""),
      notice_period_days: String(lease.notice_period_days || "30"),
      status: lease.status || "active",
    });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const payload = {
        property_id: formData.property_id,
        unit_id: formData.unit_id,
        tenant_id: formData.tenant_id,
        start_date: formData.start_date,
        end_date: formData.end_date,
        rent_amount: parseFloat(formData.rent_amount),
        security_deposit: formData.security_deposit ? parseFloat(formData.security_deposit) : null,
        notice_period_days: parseInt(formData.notice_period_days) || 30,
        status: formData.status,
      };

      if (editLease) {
        await updateLease(editLease.id, payload as any);
        setActionFeedback({ type: "success", message: "Lease updated" });
      } else {
        await createLease(payload as any);
        setActionFeedback({ type: "success", message: "Lease created" });
      }
      setShowModal(false);
      setEditLease(null);
      resetForm();
      mutate();
    } catch (err: any) {
      setActionFeedback({ type: "error", message: err.message || "Operation failed" });
    }
  }

  async function handleStatusChange(leaseId: string, newStatus: string) {
    setStatusAction(leaseId);
    try {
      await updateLease(leaseId, { status: newStatus } as any);
      setActionFeedback({ type: "success", message: `Lease status updated to ${newStatus}` });
      mutate();
    } catch (err: any) {
      setActionFeedback({ type: "error", message: err.message || "Failed to update status" });
    } finally {
      setStatusAction(null);
    }
  }

  const filtered = leases.filter((l: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const tenantName = l.tenant_name || `${l.tenant?.first_name || ""} ${l.tenant?.last_name || ""}`;
    return (l.agreement_ref || "").toLowerCase().includes(q) || tenantName.toLowerCase().includes(q);
  });

  const activeLeases = filtered.filter((l: any) => l.status === "active" || l.status === "signed");
  const renewalDue = filtered.filter((l: any) => l.status === "renewal_due");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--color-navy)" }}>Lease Agreements</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>Manage tenant leases, renewals, and terminations</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => { setEditLease(null); resetForm(); setShowModal(true); }}>
            <Plus className="w-3.5 h-3.5" /> New Lease
          </Button>
          <button onClick={() => mutate()} className="p-1.5 rounded-lg transition-colors" style={{ color: "var(--color-text-muted)" }}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {actionFeedback && (
        <div className="rounded-lg px-4 py-2.5 text-sm flex items-center gap-2"
          style={{
            background: actionFeedback.type === "success" ? "rgba(var(--color-primary-dark-rgb),0.1)" : "rgba(var(--color-danger-rgb),0.08)",
            color: actionFeedback.type === "success" ? "var(--color-primary)" : "var(--color-danger)",
            border: `1px solid ${actionFeedback.type === "success" ? "rgba(var(--color-primary-dark-rgb),0.2)" : "rgba(var(--color-danger-rgb),0.2)"}`,
          }}>
          {actionFeedback.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {actionFeedback.message}
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(var(--color-primary-rgb),0.1)" }}>
              <Home className="w-5 h-5" style={{ color: "var(--color-primary)" }} />
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>Active Leases</p>
              <p className="text-lg font-bold" style={{ color: "var(--color-primary)" }}>{activeLeases.length}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(var(--color-warning-rgb),0.1)" }}>
              <Calendar className="w-5 h-5" style={{ color: "var(--color-warning)" }} />
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>Renewal Due</p>
              <p className="text-lg font-bold" style={{ color: "var(--color-warning)" }}>{renewalDue.length}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(var(--color-navy-rgb),0.1)" }}>
              <FileText className="w-5 h-5" style={{ color: "var(--color-navy)" }} />
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>Total</p>
              <p className="text-lg font-bold" style={{ color: "var(--color-navy)" }}>{filtered.length}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(var(--color-danger-rgb),0.1)" }}>
              <DollarSign className="w-5 h-5" style={{ color: "var(--color-danger)" }} />
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>Monthly Rent Roll</p>
              <p className="text-lg font-bold" style={{ color: "var(--color-danger)" }}>
                ₹{activeLeases.reduce((s: number, l: any) => s + Number(l.rent_amount || 0), 0).toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-faint)" }} />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by tenant, agreement ref..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border outline-none" style={{ borderColor: "var(--color-border)" }} />
        </div>
        <div className="flex items-center gap-1">
          {["", "active", "renewal_due", "signed", "drafted", "terminated"].map((s) => (
            <button key={s || "all"} onClick={() => setFilterStatus(s)}
              className="px-2.5 py-1 text-[10px] font-medium rounded transition-all"
              style={{ background: filterStatus === s ? "var(--color-navy)" : "var(--color-light)", color: filterStatus === s ? "var(--color-white)" : "var(--color-text-muted)" }}>
              {s ? s.replace("_", " ") : "All"}
            </button>
          ))}
        </div>
      </div>

      {isLoading && !leases.length ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--color-text-faint)" }} /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--color-text-faint)" }} />
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>No lease agreements found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((lease: any) => {
            const isExpanded = expandedLease === lease.id;
            const tenantName = lease.tenant_name || `${lease.tenant?.first_name || ""} ${lease.tenant?.last_name || ""}`;
            const unitLabel = lease.unit_label || lease.unit?.unit_label || "—";
            const propName = lease.property_name || lease.property?.name || "—";
            return (
              <Card key={lease.id} padding={false}>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <button onClick={() => setExpandedLease(isExpanded ? null : lease.id)}
                        className="p-0.5 rounded hover:bg-slate-100 transition-colors" style={{ color: "var(--color-text-faint)" }}>
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(var(--color-navy-rgb),0.08)" }}>
                        <FileText className="w-4.5 h-4.5" style={{ color: "var(--color-navy)" }} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm" style={{ color: "var(--color-text)" }}>{lease.agreement_ref}</span>
                          <Badge variant={STATUS_BADGE[lease.status] || "gray"}>{lease.status?.replace("_", " ")}</Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
                          <span className="flex items-center gap-1"><User className="w-3 h-3" />{tenantName}</span>
                          <span>{unitLabel}</span>
                          <span>{propName}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold" style={{ color: "var(--color-text)" }}>₹{Number(lease.rent_amount || 0).toLocaleString()}/mo</span>
                      <button onClick={() => handleEdit(lease)} className="p-1.5 rounded hover:bg-slate-100 transition-colors" style={{ color: "var(--color-text-muted)" }}>
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t px-4 py-3" style={{ borderColor: "var(--color-border)", background: "var(--color-light)" }}>
                    <div className="grid grid-cols-4 gap-3 mb-3">
                      <div>
                        <p className="text-[10px] font-medium" style={{ color: "var(--color-text-muted)" }}>Start Date</p>
                        <p className="text-xs font-semibold" style={{ color: "var(--color-text)" }}>
                          {lease.start_date ? new Date(lease.start_date).toLocaleDateString() : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-medium" style={{ color: "var(--color-text-muted)" }}>End Date</p>
                        <p className="text-xs font-semibold" style={{ color: "var(--color-text)" }}>
                          {lease.end_date ? new Date(lease.end_date).toLocaleDateString() : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-medium" style={{ color: "var(--color-text-muted)" }}>Security Deposit</p>
                        <p className="text-xs font-semibold" style={{ color: "var(--color-text)" }}>₹{Number(lease.security_deposit || 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-medium" style={{ color: "var(--color-text-muted)" }}>Notice Period</p>
                        <p className="text-xs font-semibold" style={{ color: "var(--color-text)" }}>{lease.notice_period_days || 30} days</p>
                      </div>
                    </div>
                    {lease.status === "active" && (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="secondary"
                          onClick={() => handleStatusChange(lease.id, "renewal_due")}
                          disabled={statusAction === lease.id}>
                          Mark Renewal Due
                        </Button>
                        <Button size="sm"
                          onClick={() => handleStatusChange(lease.id, "terminated")}
                          disabled={statusAction === lease.id}
                          style={{ background: "var(--color-danger)" }}>
                          {statusAction === lease.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Terminate"}
                        </Button>
                      </div>
                    )}
                    {lease.status === "renewal_due" && (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="secondary"
                          onClick={() => handleStatusChange(lease.id, "terminated")}
                          disabled={statusAction === lease.id}>
                          Terminate
                        </Button>
                        <Button size="sm"
                          onClick={() => handleStatusChange(lease.id, "renewed")}
                          disabled={statusAction === lease.id}>
                          Renew
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b flex items-center justify-between sticky top-0 bg-white z-10" style={{ borderColor: "var(--color-border)" }}>
              <h3 className="font-bold text-lg" style={{ color: "var(--color-navy)" }}>
                {editLease ? "Edit Lease" : "New Lease Agreement"}
              </h3>
              <button onClick={() => { setShowModal(false); setEditLease(null); }} className="text-slate-400 hover:text-slate-600 font-bold text-lg">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "var(--color-text)" }}>Tenant *</label>
                  <select required value={formData.tenant_id}
                    onChange={(e) => setFormData({ ...formData, tenant_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none bg-white" style={{ borderColor: "var(--color-border)" }}>
                    <option value="">Select Tenant</option>
                    {(guests || []).map((g: any) => (
                      <option key={g.id} value={g.id}>{g.first_name} {g.last_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "var(--color-text)" }}>Property *</label>
                  <select required value={formData.property_id}
                    onChange={(e) => setFormData({ ...formData, property_id: e.target.value, unit_id: "" })}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none bg-white" style={{ borderColor: "var(--color-border)" }}>
                    <option value="">Select Property</option>
                    {properties.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "var(--color-text)" }}>Unit *</label>
                <select required value={formData.unit_id}
                  onChange={(e) => setFormData({ ...formData, unit_id: e.target.value })}
                  disabled={!formData.property_id}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none bg-white disabled:bg-gray-100" style={{ borderColor: "var(--color-border)" }}>
                  <option value="">Select Vacant Unit</option>
                  {availableUnits.map((u: any) => (
                    <option key={u.id} value={u.id}>{u.unit_label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "var(--color-text)" }}>Start Date *</label>
                  <input type="date" required value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "var(--color-border)" }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "var(--color-text)" }}>End Date *</label>
                  <input type="date" required value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "var(--color-border)" }} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "var(--color-text)" }}>Monthly Rent (₹) *</label>
                  <input type="number" required min={1} value={formData.rent_amount}
                    onChange={(e) => setFormData({ ...formData, rent_amount: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "var(--color-border)" }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "var(--color-text)" }}>Security Deposit (₹)</label>
                  <input type="number" min={0} value={formData.security_deposit}
                    onChange={(e) => setFormData({ ...formData, security_deposit: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "var(--color-border)" }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "var(--color-text)" }}>Notice Period (days)</label>
                  <input type="number" min={1} value={formData.notice_period_days}
                    onChange={(e) => setFormData({ ...formData, notice_period_days: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "var(--color-border)" }} />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t" style={{ borderColor: "var(--color-border)" }}>
                <Button type="button" variant="outline" size="sm" onClick={() => { setShowModal(false); setEditLease(null); }}>Cancel</Button>
                <Button type="submit" size="sm" disabled={isCreating || isUpdating}>
                  {isCreating || isUpdating ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> Saving</> : editLease ? "Update Lease" : "Create Lease"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
