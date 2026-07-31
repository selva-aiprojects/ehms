"use client";

import { useState, useEffect } from "react";
import { ClipboardList, AlertCircle, Loader2, RefreshCw, CheckCircle, Search, Building2, Calendar, DollarSign, IndianRupee, FileText } from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import { useVendorOrders, useVendorsList } from "@/lib/hooks";

function SkeletonRow() {
  return <div className="h-12 rounded animate-pulse mb-2" style={{ background: "var(--color-light)" }} />;
}

const PO_STATUS_COLORS: Record<string, "teal" | "amber" | "red" | "gray" | "navy"> = {
  draft: "gray", pending: "amber", approved: "teal",
  ordered: "navy", partially_received: "amber", received: "teal", cancelled: "red",
};

export default function VendorOrdersPage() {
  const [filterVendor, setFilterVendor] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const { vendors = [] } = useVendorsList();
  const { orders, isLoading, mutate } = useVendorOrders(filterVendor || undefined, filterStatus || undefined);
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (actionFeedback) {
      const t = setTimeout(() => setActionFeedback(null), 3000);
      return () => clearTimeout(t);
    }
  }, [actionFeedback]);

  const displayOrders = (orders || []) as any[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--color-navy)" }}>Vendor Orders</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>Purchase orders placed with vendors</p>
        </div>
        <button onClick={() => mutate()} className="p-1.5 rounded-lg transition-colors" style={{ color: "var(--color-text-muted)" }} aria-label="Refresh">
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {actionFeedback && (
        <div className="rounded-lg px-4 py-2.5 text-sm flex items-center gap-2"
          style={{
            background: actionFeedback.type === "success" ? "rgba(var(--color-primary-dark-rgb),0.1)" : "rgba(var(--color-danger-rgb),0.08)",
            color: actionFeedback.type === "success" ? "var(--color-primary)" : "var(--color-danger)",
            border: `1px solid ${actionFeedback.type === "success" ? "rgba(var(--color-primary-dark-rgb),0.2)" : "rgba(var(--color-danger-rgb),0.2)"}`,
          }}
        >
          {actionFeedback.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {actionFeedback.message}
        </div>
      )}

      <Card>
        <CardHeader
          title="Purchase Orders"
          action={
            <div className="flex items-center gap-2">
              <select value={filterVendor} onChange={(e) => setFilterVendor(e.target.value)}
                className="px-3 py-1.5 rounded-lg border text-sm outline-none bg-white" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}>
                <option value="">All Vendors</option>
                {vendors.map((v: any) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-1.5 rounded-lg border text-sm outline-none bg-white" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}>
                <option value="">All Status</option>
                <option value="draft">Draft</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="ordered">Ordered</option>
                <option value="partially_received">Partially Received</option>
                <option value="received">Received</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          }
        />
        {isLoading ? (
          <div className="space-y-1">{[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}</div>
        ) : displayOrders.length === 0 ? (
          <div className="text-center py-8">
            <ClipboardList className="w-6 h-6 mx-auto mb-2" style={{ color: "var(--color-text-muted)" }} />
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>No purchase orders found</p>
          </div>
        ) : (
          <div className="space-y-1">
            {displayOrders.map((po: any) => {
              const badgeColor = PO_STATUS_COLORS[po.status] || "gray";
              const poDate = po.po_date ? new Date(po.po_date).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) : "—";
              const lineCount = po.line_items?.length || 0;
              return (
                <div key={po.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--color-light)" }}>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="w-5 h-5 shrink-0" style={{ color: "var(--color-navy)" }} />
                    <div className="min-w-0">
                      <div className="text-sm font-medium" style={{ color: "var(--color-text)" }}>{po.po_number || "—"}</div>
                      <div className="text-xs flex items-center gap-2 flex-wrap" style={{ color: "var(--color-text-muted)" }}>
                        <Calendar className="w-3 h-3" /> {poDate}
                        <Building2 className="w-3 h-3 ml-1" /> {po.property_name || "—"}
                        <FileText className="w-3 h-3 ml-1" /> {lineCount} item(s)
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-sm flex items-center" style={{ color: "var(--color-text)" }}>
                      <IndianRupee className="w-3.5 h-3.5 inline mr-0.5" />{parseFloat(po.total_amount || 0).toLocaleString()}
                    </span>
                    <Badge variant={badgeColor}>{po.status?.replace("_", " ") || "draft"}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
