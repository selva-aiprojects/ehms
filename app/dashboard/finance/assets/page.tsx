"use client";

import { useState, useEffect } from "react";
import { Plus, AlertCircle, Loader2, RefreshCw, CheckCircle, DollarSign, Building2, Package, FileText } from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Table from "@/components/ui/table";
import { useFixedAssets, useFixedAsset, useDepreciationSchedule } from "@/lib/hooks";
import { useCreateFixedAsset, useRecordDepreciation } from "@/lib/hooks/mutations";
import { formatCurrency, formatDate } from "@/lib/reference-constants";

const STATUS_FILTERS = ["all", "active", "disposed", "sold", "fully_depreciated"] as const;

const ASSET_BADGE: Record<string, "teal" | "gray" | "navy" | "amber" | "red"> = {
  active: "teal", disposed: "gray", sold: "navy", fully_depreciated: "amber",
};

const CATEGORIES = ["Furniture", "Electronics", "Vehicles", "Machinery", "IT Equipment", "Fixtures", "Other"];

function SkeletonRow() {
  return (
    <div className="flex gap-4 p-4 animate-pulse rounded-lg" style={{ background: "#F5F7FA" }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex-1 h-5 rounded" style={{ background: "#E2E8F0" }} />
      ))}
    </div>
  );
}

export default function AssetsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showModal, setShowModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [form, setForm] = useState({ asset_code: "", asset_name: "", category: "", purchase_date: "", purchase_cost: 0, salvage_value: 0, useful_life_yrs: 5, depreciation_method: "straight_line", location: "", notes: "" });

  const { fixedAssets, isLoading, isError, mutate } = useFixedAssets({ status: statusFilter !== "all" ? statusFilter : undefined });
  const createAsset = useCreateFixedAsset();
  const { depreciation } = useDepreciationSchedule({ asset_id: selectedAsset?.id, is_posted: true });

  const assets: any[] = fixedAssets || [];
  const totalPurchaseCost = assets.reduce((s: number, a: any) => s + (a.purchase_cost ?? 0), 0);
  const totalBookValue = assets.reduce((s: number, a: any) => s + (a.book_value ?? 0), 0);
  const totalDepreciation = assets.reduce((s: number, a: any) => s + ((a.purchase_cost ?? 0) - (a.book_value ?? 0)), 0);

  useEffect(() => {
    if (actionFeedback) {
      const t = setTimeout(() => setActionFeedback(null), 3000);
      return () => clearTimeout(t);
    }
  }, [actionFeedback]);

  async function handleCreateAsset() {
    try {
      await createAsset.trigger({ ...form, purchase_cost: Number(form.purchase_cost), salvage_value: Number(form.salvage_value), useful_life_yrs: Number(form.useful_life_yrs) });
      setShowModal(false);
      setForm({ asset_code: "", asset_name: "", category: "", purchase_date: "", purchase_cost: 0, salvage_value: 0, useful_life_yrs: 5, depreciation_method: "straight_line", location: "", notes: "" });
      setActionFeedback({ type: "success", message: "Fixed asset added successfully" });
    } catch {
      setActionFeedback({ type: "error", message: "Failed to add asset" });
    }
  }

  function handleRefresh() {
    mutate();
    setActionFeedback({ type: "success", message: "Data refreshed" });
  }

  if (isLoading && !assets.length) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-52 rounded animate-pulse" style={{ background: "#E2E8F0" }} />
          <div className="h-5 w-28 rounded animate-pulse" style={{ background: "#E2E8F0" }} />
        </div>
        <div className="grid grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)}</div>
        <SkeletonRow /><SkeletonRow /><SkeletonRow />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#1A3C5E" }}>Fixed Assets Register</h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>Track asset value, depreciation and disposal</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleRefresh} className="p-1.5 rounded-lg transition-colors" style={{ color: "#64748B" }} aria-label="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors" style={{ background: "#1A3C5E" }}>
            <Plus className="w-3.5 h-3.5" /> Add Asset
          </button>
        </div>
      </div>

      {actionFeedback && (
        <div className="rounded-lg px-4 py-2.5 text-sm flex items-center gap-2" style={{
          background: actionFeedback.type === "success" ? "rgba(42,157,143,0.1)" : "rgba(229,62,62,0.08)",
          color: actionFeedback.type === "success" ? "#2BAE8E" : "#E53E3E",
          border: `1px solid ${actionFeedback.type === "success" ? "rgba(42,157,143,0.2)" : "rgba(229,62,62,0.2)"}`,
        }}>
          {actionFeedback.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {actionFeedback.message}
        </div>
      )}

      {isError && (
        <div className="rounded-lg px-4 py-2.5 text-sm flex items-center gap-2" style={{ background: "rgba(229,62,62,0.08)", color: "#E53E3E", border: "1px solid rgba(229,62,62,0.2)" }}>
          <AlertCircle className="w-4 h-4" /> Failed to load assets data.
          <button onClick={() => mutate()} className="ml-auto underline text-xs">Retry</button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl p-4 text-white" style={{ background: "#1A3C5E" }}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-lg font-bold">{formatCurrency(totalPurchaseCost)}</div>
            <DollarSign className="w-5 h-5 opacity-60" />
          </div>
          <div className="text-xs opacity-80">Total Asset Value</div>
          <div className="text-[10px] mt-0.5 opacity-60">{assets.length} assets</div>
        </div>
        <div className="rounded-xl p-4 text-white" style={{ background: "#2BAE8E" }}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-lg font-bold">{formatCurrency(totalBookValue)}</div>
            <Building2 className="w-5 h-5 opacity-60" />
          </div>
          <div className="text-xs opacity-80">Book Value</div>
          <div className="text-[10px] mt-0.5 opacity-60">Net carrying value</div>
        </div>
        <div className="rounded-xl p-4 text-white" style={{ background: "#F5A623" }}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-lg font-bold">{formatCurrency(totalDepreciation)}</div>
            <Package className="w-5 h-5 opacity-60" />
          </div>
          <div className="text-xs opacity-80">Accumulated Depreciation</div>
          <div className="text-[10px] mt-0.5 opacity-60">Depreciated to date</div>
        </div>
      </div>

      <Card>
        <CardHeader
          title="Assets"
          subtitle={assets.length + " assets"}
          action={
            <div className="flex gap-1.5 flex-wrap">
              {STATUS_FILTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className="px-3 py-1 text-xs font-medium rounded-full capitalize transition-colors"
                  style={{
                    background: statusFilter === s ? "#1A3C5E" : "#F5F7FA",
                    color: statusFilter === s ? "#FFFFFF" : "#64748B",
                    border: statusFilter === s ? "none" : "1px solid #E2E8F0",
                  }}
                >
                  {s === "all" ? "All" : s.replace("_", " ")}
                </button>
              ))}
            </div>
          }
        />
        {assets.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-8 h-8 mx-auto mb-3" style={{ color: "#CBD5E1" }} />
            <p className="text-sm font-medium" style={{ color: "#64748B" }}>No fixed assets found</p>
            <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>Add an asset to start the register</p>
          </div>
        ) : (
          <Table
            data={assets}
            keyExtractor={(item: any, i) => item.id || String(i)}
            onRowClick={(item: any) => setSelectedAsset(item)}
            columns={[
              { key: "asset_code", header: "Asset Code", render: (a: any) => <span className="font-mono text-xs font-medium" style={{ color: "#1A3C5E" }}>{a.asset_code || "—"}</span> },
              { key: "asset_name", header: "Asset Name", render: (a: any) => <span className="text-sm">{a.asset_name || "—"}</span> },
              { key: "category", header: "Category", render: (a: any) => <span className="text-xs" style={{ color: "#64748B" }}>{a.category || "—"}</span> },
              { key: "purchase_date", header: "Purchase Date", render: (a: any) => <span className="text-xs" style={{ color: "#64748B" }}>{a.purchase_date ? formatDate(a.purchase_date) : "—"}</span> },
              { key: "purchase_cost", header: "Cost", render: (a: any) => <span className="font-medium">{formatCurrency(a.purchase_cost ?? 0)}</span> },
              { key: "book_value", header: "Book Value", render: (a: any) => <span className="font-medium" style={{ color: a.book_value ? "#2BAE8E" : "#64748B" }}>{formatCurrency(a.book_value ?? 0)}</span> },
              { key: "depreciation_pct", header: "Depr. %", render: (a: any) => {
                const pct = a.purchase_cost && a.purchase_cost > 0 ? ((1 - (a.book_value ?? 0) / a.purchase_cost) * 100).toFixed(1) : "0.0";
                return <span className="text-xs" style={{ color: "#64748B" }}>{pct}%</span>;
              }},
              { key: "status", header: "Status", render: (a: any) => <Badge variant={ASSET_BADGE[a.status] || "gray"}>{a.status ? a.status.replace("_", " ") : "—"}</Badge> },
              { key: "location", header: "Location", render: (a: any) => <span className="text-xs" style={{ color: "#64748B" }}>{a.location || "—"}</span> },
            ]}
          />
        )}
      </Card>

      {selectedAsset && (
        <Card>
          <CardHeader
            title={selectedAsset.asset_name || "Asset Detail"}
            subtitle={`${selectedAsset.asset_code || ""} · ${selectedAsset.category || ""}`}
            action={<button onClick={() => setSelectedAsset(null)} className="p-1 rounded text-xs font-medium" style={{ color: "#64748B" }}>Close</button>}
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {[
              { label: "Purchase Cost", value: formatCurrency(selectedAsset.purchase_cost ?? 0) },
              { label: "Book Value", value: formatCurrency(selectedAsset.book_value ?? 0) },
              { label: "Salvage Value", value: formatCurrency(selectedAsset.salvage_value ?? 0) },
              { label: "Useful Life", value: (selectedAsset.useful_life_yrs ?? "-") + " yrs" },
              { label: "Depreciation Method", value: selectedAsset.depreciation_method?.replace("_", " ") || "—" },
              { label: "Location", value: selectedAsset.location || "—" },
              { label: "Assigned To", value: selectedAsset.assigned_to || "—" },
              { label: "Status", value: selectedAsset.status?.replace("_", " ") || "—" },
            ].map((d) => (
              <div key={d.label} className="p-3 rounded-lg" style={{ background: "#F5F7FA" }}>
                <div className="text-xs" style={{ color: "#64748B" }}>{d.label}</div>
                <div className="text-sm font-semibold mt-0.5" style={{ color: "#1A2E44" }}>{d.value}</div>
              </div>
            ))}
          </div>
          {selectedAsset.notes && (
            <p className="text-sm mb-4 p-3 rounded-lg" style={{ background: "#F5F7FA", color: "#64748B" }}>{selectedAsset.notes}</p>
          )}
          <div>
            <h4 className="text-sm font-semibold mb-2" style={{ color: "#1A3C5E" }}>Depreciation Schedule</h4>
            {!depreciation || depreciation.length === 0 ? (
              <p className="text-xs py-4 text-center" style={{ color: "#94A3B8" }}>No depreciation entries recorded yet</p>
            ) : (
              <Table
                data={depreciation}
                keyExtractor={(item: any, i) => item.id || String(i)}
                columns={[
                  { key: "period", header: "Period", render: (d: any) => <span className="text-xs" style={{ color: "#64748B" }}>{d.period || "—"}</span> },
                  { key: "amount", header: "Amount", render: (d: any) => <span className="font-medium">{formatCurrency(d.amount ?? 0)}</span> },
                  { key: "book_value_after", header: "Book Value", render: (d: any) => <span className="text-xs" style={{ color: "#64748B" }}>{formatCurrency(d.book_value_after ?? 0)}</span> },
                  { key: "is_posted", header: "Status", render: (d: any) => <Badge variant={d.is_posted ? "teal" : "amber"}>{d.is_posted ? "Posted" : "Draft"}</Badge> },
                ]}
              />
            )}
          </div>
        </Card>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="bg-white rounded-xl w-full max-w-lg mx-4 p-6" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
            <h2 className="text-base font-bold mb-4" style={{ color: "#1A3C5E" }}>Add Fixed Asset</h2>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Asset Code</label>
                  <input value={form.asset_code} onChange={(e) => setForm({ ...form, asset_code: e.target.value })} className="w-full px-3 py-2 rounded-lg text-xs" style={{ border: "1px solid #E2E8F0", color: "#1A2E44" }} placeholder="AST-001" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Asset Name</label>
                  <input value={form.asset_name} onChange={(e) => setForm({ ...form, asset_name: e.target.value })} className="w-full px-3 py-2 rounded-lg text-xs" style={{ border: "1px solid #E2E8F0", color: "#1A2E44" }} placeholder="Laptop / Desk / AC" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Category</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 rounded-lg text-xs" style={{ border: "1px solid #E2E8F0", color: "#1A2E44", background: "#FFFFFF" }}>
                  <option value="">Select category</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Purchase Date</label>
                  <input type="date" value={form.purchase_date} onChange={(e) => setForm({ ...form, purchase_date: e.target.value })} className="w-full px-3 py-2 rounded-lg text-xs" style={{ border: "1px solid #E2E8F0", color: "#1A2E44" }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Purchase Cost</label>
                  <input type="number" value={form.purchase_cost || ""} onChange={(e) => setForm({ ...form, purchase_cost: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg text-xs" style={{ border: "1px solid #E2E8F0", color: "#1A2E44" }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Salvage Value</label>
                  <input type="number" value={form.salvage_value || ""} onChange={(e) => setForm({ ...form, salvage_value: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg text-xs" style={{ border: "1px solid #E2E8F0", color: "#1A2E44" }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Useful Life (yrs)</label>
                  <input type="number" value={form.useful_life_yrs || ""} onChange={(e) => setForm({ ...form, useful_life_yrs: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg text-xs" style={{ border: "1px solid #E2E8F0", color: "#1A2E44" }} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Depreciation Method</label>
                <select value={form.depreciation_method} onChange={(e) => setForm({ ...form, depreciation_method: e.target.value })} className="w-full px-3 py-2 rounded-lg text-xs" style={{ border: "1px solid #E2E8F0", color: "#1A2E44", background: "#FFFFFF" }}>
                  <option value="straight_line">Straight Line</option>
                  <option value="declining">Declining Balance</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Location</label>
                <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full px-3 py-2 rounded-lg text-xs" style={{ border: "1px solid #E2E8F0", color: "#1A2E44" }} placeholder="Floor 3 / Room 201" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2 rounded-lg text-xs" style={{ border: "1px solid #E2E8F0", color: "#1A2E44" }} rows={2} />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowModal(false)} className="px-4 py-1.5 rounded-lg text-xs font-medium" style={{ color: "#64748B", background: "#F5F7FA" }}>Cancel</button>
              <button onClick={handleCreateAsset} className="px-4 py-1.5 rounded-lg text-xs font-medium text-white" style={{ background: "#1A3C5E" }}>{createAsset.isMutating ? "Saving..." : "Save Asset"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
