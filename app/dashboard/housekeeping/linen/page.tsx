"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from "react";
import {
  Layers, AlertCircle, Loader2, RefreshCw, Search as SearchIcon,
  Plus, Eye, X, Check, Tag, Shirt, ArrowRightLeft,
  Package, Building, User, Calendar
} from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Table from "@/components/ui/table";
import { useLinenBatches, useLinenItems, useLinenTransactions, useProperties } from "@/lib/hooks";

const STATUS_BADGE: Record<string, "teal" | "amber" | "red" | "gray" | "navy"> = {
  clean: "teal", soiled: "amber", damaged: "red", in_use: "navy", laundered: "teal",
};

function SkeletonRow() {
  return <div className="h-10 rounded animate-pulse mb-2" style={{ background: "#F5F7FA" }} />;
}

export default function LinenPage() {
  const [activeTab, setActiveTab] = useState<"batches" | "items" | "transactions">("batches");
  const [statusFilter, setStatusFilter] = useState("");
  const [batchFilter, setBatchFilter] = useState("");
  const [showAddBatch, setShowAddBatch] = useState(false);
  const [adding, setAdding] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [batchForm, setBatchForm] = useState({ item_type: "", quantity: 0, lifecycle_stage: "in_use", vendor_id: "" });

  const { linenBatches, isLoading: batchesLoading, isError: batchesError, mutate: mutateBatches } = useLinenBatches();
  const { linenItems, isLoading: itemsLoading, isError: itemsError, mutate: mutateItems } = useLinenItems(undefined, statusFilter || undefined);
  const { linenTransactions, isLoading: txLoading, isError: txError, mutate: mutateTx } = useLinenTransactions(undefined, batchFilter || undefined);
  const { properties } = useProperties();

  useEffect(() => {
    if (feedback) {
      const t = setTimeout(() => setFeedback(null), 3000);
      return () => clearTimeout(t);
    }
  }, [feedback]);

  async function handleAddBatch() {
    setAdding(true);
    try {
      const res = await fetch("/api/housekeeping/linen/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(batchForm),
      });
      if (!res.ok) throw new Error("Failed");
      setFeedback({ type: "success", message: "Batch created" });
      setShowAddBatch(false);
      setBatchForm({ item_type: "", quantity: 0, lifecycle_stage: "in_use", vendor_id: "" });
      mutateBatches();
    } catch {
      setFeedback({ type: "error", message: "Failed to create batch" });
    } finally {
      setAdding(false);
    }
  }

  const tabs = [
    { key: "batches" as const, label: "Batches", icon: <Package className="w-3.5 h-3.5" /> },
    { key: "items" as const, label: "Items", icon: <Tag className="w-3.5 h-3.5" /> },
    { key: "transactions" as const, label: "Transactions", icon: <ArrowRightLeft className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#1A3C5E" }}>Linen Management</h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>Track batches, items, and lifecycle transactions</p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === "batches" && (
            <button onClick={() => setShowAddBatch(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors" style={{ background: "#2BAE8E" }}>
              <Plus className="w-3.5 h-3.5" /> Add Batch
            </button>
          )}
          <button onClick={() => {
            if (activeTab === "batches") mutateBatches();
            else if (activeTab === "items") mutateItems();
            else mutateTx();
          }} className="p-1.5 rounded-lg transition-colors" style={{ color: "#64748B" }} aria-label="Refresh">
            <RefreshCw className="w-4 h-4" />
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

      <div className="flex items-center gap-2 flex-wrap">
        {tabs.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all"
            style={{
              background: activeTab === tab.key ? "#1A3C5E" : "#F5F7FA",
              color: activeTab === tab.key ? "#FFFFFF" : "#64748B",
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "batches" && (
        <Card>
          <CardHeader
            title="Linen Batches"
            subtitle={`${(linenBatches || []).length} batches`}
            action={
              <select
                value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2 py-1.5 rounded-lg text-xs outline-none border"
                style={{ borderColor: "#E2E8F0", background: "#F5F7FA", color: "#1A2E44" }}
              >
                <option value="">All Stages</option>
                <option value="in_use">In Use</option>
                <option value="soiled">Soiled</option>
                <option value="dispatched">Dispatched</option>
                <option value="received">Received</option>
                <option value="scrapped">Scrapped</option>
              </select>
            }
          />
          {batchesLoading ? (
            <div className="space-y-1">{Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}</div>
          ) : batchesError ? (
            <div className="text-center py-8"><AlertCircle className="w-6 h-6 mx-auto mb-2" style={{ color: "#64748B" }} /><p className="text-sm" style={{ color: "#64748B" }}>Failed to load batches</p></div>
          ) : (linenBatches || []).length === 0 ? (
            <div className="text-center py-8"><Package className="w-6 h-6 mx-auto mb-2" style={{ color: "#64748B" }} /><p className="text-sm" style={{ color: "#64748B" }}>No batches found</p></div>
          ) : (
            <Table
              data={linenBatches || []}
              keyExtractor={(b: any) => b.id}
              columns={[
                { key: "item_type", header: "Item Type", render: (b: any) => <span className="font-medium text-sm capitalize">{b.item_type?.replace(/_/g, " ") || "—"}</span> },
                { key: "quantity", header: "Quantity", render: (b: any) => <span className="text-sm">{b.quantity ?? "—"}</span> },
                { key: "lifecycle_stage", header: "Lifecycle Stage", render: (b: any) => <Badge variant={STATUS_BADGE[b.lifecycle_stage] || "gray"}>{(b.lifecycle_stage || "").replace(/_/g, " ")}</Badge> },
                { key: "vendor", header: "Vendor", render: (b: any) => <span className="text-xs" style={{ color: "#64748B" }}>{b.vendor?.name || b.vendor_name || "—"}</span> },
                { key: "actions", header: "Actions", render: (b: any) => (
                  <div className="flex items-center gap-1" onClick={(ev) => ev.stopPropagation()}>
                    <button className="p-1 rounded hover:bg-gray-100" title="View"><Eye className="w-3.5 h-3.5" style={{ color: "#1A3C5E" }} /></button>
                  </div>
                )},
              ]}
            />
          )}
        </Card>
      )}

      {activeTab === "items" && (
        <Card>
          <CardHeader
            title="Linen Items"
            subtitle={`${(linenItems || []).length} items`}
            action={
              <div className="flex items-center gap-2">
                <div className="relative">
                  <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "#64748B" }} />
                  <input type="text" placeholder="Search RFID..."
                    className="pl-8 pr-3 py-1.5 rounded-lg text-xs outline-none border w-40"
                    style={{ borderColor: "#E2E8F0", background: "#F5F7FA" }} />
                </div>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2 py-1.5 rounded-lg text-xs outline-none border"
                  style={{ borderColor: "#E2E8F0", background: "#F5F7FA", color: "#1A2E44" }}>
                  <option value="">All Statuses</option>
                  <option value="clean">Clean</option>
                  <option value="soiled">Soiled</option>
                  <option value="damaged">Damaged</option>
                  <option value="laundered">Laundered</option>
                </select>
              </div>
            }
          />
          {itemsLoading ? (
            <div className="space-y-1">{Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}</div>
          ) : itemsError ? (
            <div className="text-center py-8"><AlertCircle className="w-6 h-6 mx-auto mb-2" style={{ color: "#64748B" }} /><p className="text-sm" style={{ color: "#64748B" }}>Failed to load items</p></div>
          ) : (linenItems || []).length === 0 ? (
            <div className="text-center py-8"><Tag className="w-6 h-6 mx-auto mb-2" style={{ color: "#64748B" }} /><p className="text-sm" style={{ color: "#64748B" }}>No items found</p></div>
          ) : (
            <Table
              data={linenItems || []}
              keyExtractor={(i: any) => i.id}
              columns={[
                { key: "rfid_tag", header: "RFID Tag", render: (i: any) => <span className="font-mono text-xs" style={{ color: "#64748B" }}>{i.rfid_tag || "—"}</span> },
                { key: "item_type", header: "Item Type", render: (i: any) => <span className="text-sm capitalize">{(i.item_type || "").replace(/_/g, " ")}</span> },
                { key: "status", header: "Status", render: (i: any) => <Badge variant={STATUS_BADGE[i.status] || "gray"}>{(i.status || "").replace(/_/g, " ")}</Badge> },
                { key: "assigned_unit", header: "Assigned Unit", render: (i: any) => <span className="text-xs" style={{ color: "#64748B" }}>{i.assigned_unit || i.unit?.unit_label || "—"}</span> },
                { key: "last_cleaned", header: "Last Cleaned", render: (i: any) => <span className="text-xs" style={{ color: "#64748B" }}>{i.last_cleaned ? new Date(i.last_cleaned).toLocaleDateString() : "—"}</span> },
                { key: "actions", header: "Actions", render: (i: any) => (
                  <div className="flex items-center gap-1" onClick={(ev) => ev.stopPropagation()}>
                    <button className="p-1 rounded hover:bg-gray-100" title="View"><Eye className="w-3.5 h-3.5" style={{ color: "#1A3C5E" }} /></button>
                  </div>
                )},
              ]}
            />
          )}
        </Card>
      )}

      {activeTab === "transactions" && (
        <Card>
          <CardHeader
            title="Linen Transactions"
            subtitle={`${(linenTransactions || []).length} entries`}
            action={
              <select value={batchFilter} onChange={(e) => setBatchFilter(e.target.value)}
                className="px-2 py-1.5 rounded-lg text-xs outline-none border"
                style={{ borderColor: "#E2E8F0", background: "#F5F7FA", color: "#1A2E44" }}>
                <option value="">All Batches</option>
                {(linenBatches || []).map((b: any) => (
                  <option key={b.id} value={b.id}>{(b.item_type || "Batch").replace(/_/g, " ")}</option>
                ))}
              </select>
            }
          />
          {txLoading ? (
            <div className="space-y-1">{Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}</div>
          ) : txError ? (
            <div className="text-center py-8"><AlertCircle className="w-6 h-6 mx-auto mb-2" style={{ color: "#64748B" }} /><p className="text-sm" style={{ color: "#64748B" }}>Failed to load transactions</p></div>
          ) : (linenTransactions || []).length === 0 ? (
            <div className="text-center py-8"><ArrowRightLeft className="w-6 h-6 mx-auto mb-2" style={{ color: "#64748B" }} /><p className="text-sm" style={{ color: "#64748B" }}>No transactions found</p></div>
          ) : (
            <Table
              data={linenTransactions || []}
              keyExtractor={(tx: any) => tx.id}
              columns={[
                { key: "batch", header: "Batch", render: (tx: any) => <span className="text-sm">{tx.batch?.item_type ? tx.batch.item_type.replace(/_/g, " ") : tx.batch_id || "—"}</span> },
                { key: "from_to", header: "From → To Stage", render: (tx: any) => (
                  <span className="text-xs flex items-center gap-1">
                    <Badge variant={STATUS_BADGE[tx.from_stage] || "gray"}>{(tx.from_stage || "").replace(/_/g, " ")}</Badge>
                    <span style={{ color: "#64748B" }}>→</span>
                    <Badge variant={STATUS_BADGE[tx.to_stage] || "gray"}>{(tx.to_stage || "").replace(/_/g, " ")}</Badge>
                  </span>
                )},
                { key: "quantity", header: "Quantity", render: (tx: any) => <span className="text-sm">{tx.quantity ?? "—"}</span> },
                { key: "unit", header: "Unit", render: (tx: any) => <span className="text-xs" style={{ color: "#64748B" }}>{tx.unit || "—"}</span> },
                { key: "logged_by", header: "Logged By", render: (tx: any) => <span className="text-xs" style={{ color: "#64748B" }}>{tx.logged_by_name || tx.logged_by || "—"}</span> },
                { key: "date", header: "Date", render: (tx: any) => <span className="text-xs" style={{ color: "#64748B" }}>{tx.created_at ? new Date(tx.created_at).toLocaleDateString() : "—"}</span> },
              ]}
            />
          )}
        </Card>
      )}

      {showAddBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/20" onClick={() => setShowAddBatch(false)} />
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-xl" style={{ border: "1px solid #E2E8F0" }}>
            <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid #E2E8F0" }}>
              <h2 className="text-base font-semibold" style={{ color: "#1A3C5E" }}>Add Linen Batch</h2>
              <button onClick={() => setShowAddBatch(false)} className="p-1 rounded hover:bg-gray-100"><X className="w-4 h-4" style={{ color: "#64748B" }} /></button>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Item Type</label>
                <input type="text" value={batchForm.item_type} onChange={(e) => setBatchForm({ ...batchForm, item_type: e.target.value })}
                  style={{ border: "1px solid #E5E7EB", borderRadius: "8px", padding: "8px 12px", width: "100%" }} placeholder="e.g. bedsheet, towel" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Quantity</label>
                <input type="number" value={batchForm.quantity} onChange={(e) => setBatchForm({ ...batchForm, quantity: Number(e.target.value) })}
                  style={{ border: "1px solid #E5E7EB", borderRadius: "8px", padding: "8px 12px", width: "100%" }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Lifecycle Stage</label>
                <select value={batchForm.lifecycle_stage} onChange={(e) => setBatchForm({ ...batchForm, lifecycle_stage: e.target.value })}
                  style={{ border: "1px solid #E5E7EB", borderRadius: "8px", padding: "8px 12px", width: "100%" }}>
                  <option value="in_use">In Use</option>
                  <option value="soiled">Soiled</option>
                  <option value="dispatched">Dispatched</option>
                  <option value="received">Received</option>
                  <option value="scrapped">Scrapped</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Vendor</label>
                <select value={batchForm.vendor_id} onChange={(e) => setBatchForm({ ...batchForm, vendor_id: e.target.value })}
                  style={{ border: "1px solid #E5E7EB", borderRadius: "8px", padding: "8px 12px", width: "100%" }}>
                  <option value="">Select vendor</option>
                  {(properties || []).map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>
            <div className="px-6 py-4 flex items-center justify-end gap-2" style={{ borderTop: "1px solid #E2E8F0" }}>
              <button onClick={() => setShowAddBatch(false)} className="px-4 py-1.5 rounded-lg text-xs font-medium" style={{ color: "#64748B", background: "#F5F7FA" }}>Cancel</button>
              <button onClick={handleAddBatch} disabled={adding} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium text-white transition-colors" style={{ background: "#2BAE8E" }}>
                {adding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Package className="w-3 h-3" />}
                {adding ? "Adding..." : "Add Batch"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
