"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useMemo } from "react";
import {
  Monitor, AlertCircle, Loader2, RefreshCw, Search as SearchIcon,
  Plus, X, Save, Calendar, Building2, Shield, Trash2, Wrench, DollarSign, CheckCircle
} from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Table from "@/components/ui/table";
import { useMaintenanceAssets } from "@/lib/hooks";
import { useProperties } from "@/lib/hooks";

function SkeletonRow() {
  return <div className="h-10 rounded animate-pulse mb-2" style={{ background: "var(--color-light)" }} />;
}

const ASSET_TYPES = ["AC", "TV", "Smart Lock", "Geyser", "Refrigerator", "Washing Machine", "Microwave", "Sofa", "Bed", "Table", "Chair", "Fan", "Lighting", "Water Heater", "Other"];
const STATUS_OPTIONS = ["active", "maintenance", "scrapped"];

const NOW = Date.now();

function WarrantyBadge({ expiry }: { expiry: string }) {
  const days = useMemo(() => {
    if (!expiry) return null;
    return Math.ceil((new Date(expiry).getTime() - NOW) / (1000 * 60 * 60 * 24));
  }, [expiry]);
  if (days === null) return <Badge variant="gray">—</Badge>;
  if (days > 90) return <Badge variant="teal">{days}d remaining</Badge>;
  if (days >= 30) return <Badge variant="amber">{days}d remaining</Badge>;
  if (days >= 0) return <Badge variant="red">{days}d remaining</Badge>;
  return <Badge variant="gray">Expired</Badge>;
}

const ASSET_STATUS_BADGE: Record<string, "teal" | "amber" | "red" | "gray"> = {
  active: "teal",
  maintenance: "amber",
  scrapped: "red",
};

export default function AssetsPage() {
  const [search, setSearch] = useState("");
  const [propertyFilter, setPropertyFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({
    unit_id: "", asset_type: "", brand: "", model: "", serial_number: "",
    purchase_date: "", warranty_months: 0, current_value: 0, status: "active", property_id: "",
  });
  const { assets, isLoading, isError, mutate } = useMaintenanceAssets(propertyFilter || undefined, statusFilter || undefined);
  const { properties = [] } = useProperties();

  useEffect(() => {
    if (feedback) {
      const t = setTimeout(() => setFeedback(null), 3000);
      return () => clearTimeout(t);
    }
  }, [feedback]);

  const displayAssets = (assets || []) as any[];
  const filtered = displayAssets.filter((a) => {
    if (typeFilter && a.asset_type !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const matches = a.brand?.toLowerCase().includes(q) || a.model?.toLowerCase().includes(q) || a.serial_number?.toLowerCase().includes(q) || a.asset_type?.toLowerCase().includes(q);
      if (!matches) return false;
    }
    return true;
  });

  const openAdd = () => {
    setFormData({ unit_id: "", asset_type: "", brand: "", model: "", serial_number: "", purchase_date: "", warranty_months: 0, current_value: 0, status: "active", property_id: "" });
    setShowAddModal(true);
  };

  const handleSave = async () => {
    if (!formData.asset_type) {
      setFeedback({ type: "error", message: "Asset type is required" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/maintenance/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Save failed");
      setFeedback({ type: "success", message: "Asset created" });
      setShowAddModal(false);
      mutate();
    } catch {
      setFeedback({ type: "error", message: "Failed to create asset" });
    } finally {
      setSaving(false);
    }
  };

  const activeCount = filtered.filter((a) => a.status === "active").length;
  const maintCount = filtered.filter((a) => a.status === "maintenance").length;
  const scrappedCount = filtered.filter((a) => a.status === "scrapped").length;
  const totalValue = filtered.reduce((s, a) => s + (a.current_value || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--color-navy)" }}>Asset Register</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>Track and manage property assets</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => mutate()} className="p-1.5 rounded-lg transition-colors" style={{ color: "var(--color-text-muted)" }} aria-label="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={openAdd} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors" style={{ background: "var(--color-primary)" }}>
            <Plus className="w-3.5 h-3.5" /> Add Asset
          </button>
        </div>
      </div>

      {feedback && (
        <div className="rounded-lg px-4 py-2.5 text-sm flex items-center gap-2" style={{
          background: feedback.type === "success" ? "rgba(var(--color-primary-rgb),0.08)" : "rgba(var(--color-danger-rgb),0.08)",
          color: feedback.type === "success" ? "var(--color-primary)" : "var(--color-danger)",
          border: feedback.type === "success" ? "1px solid rgba(var(--color-primary-rgb),0.2)" : "1px solid rgba(var(--color-danger-rgb),0.2)",
        }}>
          {feedback.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {feedback.message}
        </div>
      )}

      {isError && (
        <div className="rounded-lg px-4 py-2.5 text-sm flex items-center gap-2" style={{ background: "rgba(var(--color-danger-rgb),0.08)", color: "var(--color-danger)", border: "1px solid rgba(var(--color-danger-rgb),0.2)" }}>
          <AlertCircle className="w-4 h-4" /> Failed to load assets.
          <button onClick={() => mutate()} className="ml-auto underline text-xs">Retry</button>
        </div>
      )}

      {isLoading && !assets ? (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl p-4 animate-pulse" style={{ background: "var(--color-border)" }}>
              <div className="w-12 h-8 rounded mb-2" style={{ background: "var(--color-border-strong)" }} />
              <div className="w-16 h-3 rounded" style={{ background: "var(--color-border-strong)" }} />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="rounded-xl p-4 text-white" style={{ background: "var(--color-navy)" }}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl font-bold">{filtered.length}</div>
              <Monitor className="w-5 h-5 opacity-60" />
            </div>
            <div className="text-xs opacity-80">Total Assets</div>
          </div>
          <div className="rounded-xl p-4 text-white" style={{ background: "var(--color-primary)" }}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl font-bold">{activeCount}</div>
              <Shield className="w-5 h-5 opacity-60" />
            </div>
            <div className="text-xs opacity-80">Active</div>
          </div>
          <div className="rounded-xl p-4 text-white" style={{ background: "var(--color-warning)" }}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl font-bold">{maintCount}</div>
              <Wrench className="w-5 h-5 opacity-60" />
            </div>
            <div className="text-xs opacity-80">Under Maintenance</div>
          </div>
          <div className="rounded-xl p-4" style={{ background: "var(--color-light)" }}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>₹{totalValue.toLocaleString()}</div>
              <DollarSign className="w-5 h-5" style={{ color: "var(--color-text-muted)" }} />
            </div>
            <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>Total Value</div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader
          title="Asset Register"
          subtitle={`${filtered.length} assets · ${activeCount} active`}
          action={
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "var(--color-text-muted)" }} />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search assets..."
                  className="pl-8 pr-3 py-1.5 rounded-lg text-xs outline-none border w-40"
                  style={{ borderColor: "var(--color-border)", background: "var(--color-light)" }} />
              </div>
              <select value={propertyFilter} onChange={(e) => setPropertyFilter(e.target.value)}
                className="px-2 py-1.5 rounded-lg text-xs outline-none border"
                style={{ borderColor: "var(--color-border)", background: "var(--color-light)", color: "var(--color-text)" }}>
                <option value="">All Properties</option>
                {properties.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2 py-1.5 rounded-lg text-xs outline-none border"
                style={{ borderColor: "var(--color-border)", background: "var(--color-light)", color: "var(--color-text)" }}>
                <option value="">All Status</option>
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
                className="px-2 py-1.5 rounded-lg text-xs outline-none border"
                style={{ borderColor: "var(--color-border)", background: "var(--color-light)", color: "var(--color-text)" }}>
                <option value="">All Types</option>
                {ASSET_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          }
        />
        {isLoading ? (
          <div className="space-y-1">
            {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8">
            <Monitor className="w-6 h-6 mx-auto mb-2" style={{ color: "var(--color-text-muted)" }} />
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>No assets found</p>
          </div>
        ) : (
          <Table
            data={filtered}
            keyExtractor={(a: any) => a.id}
            columns={[
              { key: "asset_type", header: "Asset Type", render: (a: any) => <Badge variant="gray">{a.asset_type || "—"}</Badge> },
              { key: "brand_model", header: "Brand / Model", render: (a: any) => <span className="text-sm">{a.brand ? `${a.brand} ${a.model || ""}` : "—"}</span> },
              { key: "serial_number", header: "Serial #", render: (a: any) => <span className="font-mono text-xs" style={{ color: "var(--color-text-muted)" }}>{a.serial_number || "—"}</span> },
              { key: "unit_label", header: "Unit", render: (a: any) => <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{a.unit_label || "—"}</span> },
              { key: "purchase_date", header: "Purchase Date", render: (a: any) => <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{a.purchase_date ? new Date(a.purchase_date).toLocaleDateString() : "—"}</span> },
              { key: "warranty_expiry", header: "Warranty Expiry", render: (a: any) => {
                if (!a.warranty_months || !a.purchase_date) return <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>—</span>;
                const expiry = new Date(a.purchase_date);
                expiry.setMonth(expiry.getMonth() + a.warranty_months);
                return <WarrantyBadge expiry={expiry.toISOString()} />;
              }},
              { key: "status", header: "Status", render: (a: any) => <Badge variant={ASSET_STATUS_BADGE[a.status] || "gray"}>{a.status || "—"}</Badge> },
              { key: "actions", header: "Actions", render: (a: any) => (
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <button className="p-1 rounded hover:bg-gray-100" title="Edit"><Monitor className="w-3.5 h-3.5" style={{ color: "var(--color-sidebar)" }} /></button>
                </div>
              )},
            ]}
          />
        )}
      </Card>

      {/* Add Asset Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/20" onClick={() => setShowAddModal(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-xl max-h-[90vh] overflow-y-auto" style={{ border: "1px solid var(--color-border)" }}>
            <div className="sticky top-0 bg-white z-10 px-6 py-4 flex items-center justify-between rounded-t-xl" style={{ borderBottom: "1px solid var(--color-border)" }}>
              <h2 className="text-base font-semibold" style={{ color: "var(--color-sidebar)" }}>Add Asset</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded hover:bg-gray-100"><X className="w-4 h-4" style={{ color: "var(--color-text-muted)" }} /></button>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>Asset Type *</label>
                  <select value={formData.asset_type} onChange={(e) => setFormData({ ...formData, asset_type: e.target.value })}
                    style={{ border: "1px solid var(--color-border)", borderRadius: "8px", padding: "8px 12px", width: "100%", color: "var(--color-text)" }}>
                    <option value="">Select Type</option>
                    {ASSET_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    style={{ border: "1px solid var(--color-border)", borderRadius: "8px", padding: "8px 12px", width: "100%", color: "var(--color-text)" }}>
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>Brand</label>
                  <input type="text" value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    style={{ border: "1px solid var(--color-border)", borderRadius: "8px", padding: "8px 12px", width: "100%" }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>Model</label>
                  <input type="text" value={formData.model} onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    style={{ border: "1px solid var(--color-border)", borderRadius: "8px", padding: "8px 12px", width: "100%" }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>Serial Number</label>
                  <input type="text" value={formData.serial_number} onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                    style={{ border: "1px solid var(--color-border)", borderRadius: "8px", padding: "8px 12px", width: "100%" }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>Unit ID</label>
                  <input type="text" value={formData.unit_id} onChange={(e) => setFormData({ ...formData, unit_id: e.target.value })}
                    style={{ border: "1px solid var(--color-border)", borderRadius: "8px", padding: "8px 12px", width: "100%" }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>Purchase Date</label>
                  <input type="date" value={formData.purchase_date} onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                    style={{ border: "1px solid var(--color-border)", borderRadius: "8px", padding: "8px 12px", width: "100%" }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>Warranty (months)</label>
                  <input type="number" min={0} value={formData.warranty_months} onChange={(e) => setFormData({ ...formData, warranty_months: Number(e.target.value) })}
                    style={{ border: "1px solid var(--color-border)", borderRadius: "8px", padding: "8px 12px", width: "100%" }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>Current Value (₹)</label>
                  <input type="number" min={0} step="0.01" value={formData.current_value} onChange={(e) => setFormData({ ...formData, current_value: Number(e.target.value) })}
                    style={{ border: "1px solid var(--color-border)", borderRadius: "8px", padding: "8px 12px", width: "100%" }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-muted)" }}>Property</label>
                  <select value={formData.property_id} onChange={(e) => setFormData({ ...formData, property_id: e.target.value })}
                    style={{ border: "1px solid var(--color-border)", borderRadius: "8px", padding: "8px 12px", width: "100%", color: "var(--color-text)" }}>
                    <option value="">Select Property</option>
                    {properties.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 flex items-center justify-end gap-2" style={{ borderTop: "1px solid var(--color-border)" }}>
              <button onClick={() => setShowAddModal(false)} className="px-4 py-1.5 rounded-lg text-xs font-medium" style={{ color: "var(--color-text-muted)", background: "var(--color-light)" }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium text-white transition-colors" style={{ background: "var(--color-primary)" }}>
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


