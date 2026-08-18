"use client";

import { useState } from "react";
import { ArrowUpDown, Search, RefreshCw, Loader2, Calendar, Filter } from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import { useInventoryTransactions } from "@/lib/hooks";

const TRANSACTION_LABELS: Record<string, string> = {
  purchase_receipt: "Purchase Receipt",
  sales_issue: "Sales Issue",
  transfer_in: "Transfer In",
  transfer_out: "Transfer Out",
  adjustment_add: "Adjustment +",
  adjustment_subtract: "Adjustment -",
  return: "Return",
  damage: "Damage",
};

const INBOUND_TYPES = new Set(["purchase_receipt", "return", "transfer_in", "adjustment_add"]);

function isInbound(type: string) {
  return INBOUND_TYPES.has(type);
}

function getDefaultDates() {
  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
  return { today, thirtyDaysAgo };
}

export default function InventoryTransactionsPage() {
  const [fromDate, setFromDate] = useState(() => getDefaultDates().thirtyDaysAgo);
  const [toDate, setToDate] = useState(() => getDefaultDates().today);
  const [filterType, setFilterType] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const { transactions = [], isLoading, mutate } = useInventoryTransactions({
    from_date: fromDate || undefined,
    to_date: toDate || undefined,
    transaction_type: filterType || undefined,
  });

  const filtered = (transactions || []).filter((t: any) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!t.item_name?.toLowerCase().includes(q) && !t.item_sku?.toLowerCase().includes(q) && !t.notes?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--color-navy)" }}>Transaction Log</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>View all stock movements and adjustments</p>
        </div>
        <button onClick={() => mutate()} className="p-1.5 rounded-lg transition-colors" style={{ color: "var(--color-text-muted)" }}>
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5" style={{ color: "var(--color-text-faint)" }} />
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border outline-none" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }} />
          <span className="text-xs" style={{ color: "var(--color-text-faint)" }}>to</span>
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border outline-none" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }} />
        </div>
        <div className="flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" style={{ color: "var(--color-text-faint)" }} />
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border outline-none bg-white" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}>
            <option value="">All Types</option>
            {Object.entries(TRANSACTION_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-faint)" }} />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by item name, SKU, notes..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border outline-none" style={{ borderColor: "var(--color-border)" }} />
        </div>
      </div>

      {/* Transaction Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-lg px-4 py-3" style={{ background: "rgba(var(--color-primary-rgb),0.08)", border: "1px solid rgba(var(--color-primary-rgb),0.2)" }}>
          <div className="text-xs font-medium" style={{ color: "var(--color-primary)" }}>Inbound (Total In)</div>
          <div className="text-xl font-bold mt-1" style={{ color: "var(--color-navy)" }}>
            {filtered.filter((t: any) => isInbound(t.transaction_type)).reduce((s: number, t: any) => s + parseFloat(t.quantity || 0), 0).toFixed(2)}
          </div>
        </div>
        <div className="rounded-lg px-4 py-3" style={{ background: "rgba(var(--color-danger-rgb),0.08)", border: "1px solid rgba(var(--color-danger-rgb),0.2)" }}>
          <div className="text-xs font-medium" style={{ color: "var(--color-danger)" }}>Outbound (Total Out)</div>
          <div className="text-xl font-bold mt-1" style={{ color: "var(--color-navy)" }}>
            {filtered.filter((t: any) => !isInbound(t.transaction_type)).reduce((s: number, t: any) => s + parseFloat(t.quantity || 0), 0).toFixed(2)}
          </div>
        </div>
        <div className="rounded-lg px-4 py-3" style={{ background: "var(--color-light)", border: "1px solid var(--color-border)" }}>
          <div className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>Total Transactions</div>
          <div className="text-xl font-bold mt-1" style={{ color: "var(--color-navy)" }}>{filtered.length}</div>
        </div>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader title="Transactions" subtitle={`${filtered.length} records in selected period`} />
        {isLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--color-text-faint)" }} /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8">
            <ArrowUpDown className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--color-text-faint)" }} />
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>No transactions found for the selected period.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {["Date", "Item", "SKU", "Type", "Quantity", "Unit Cost", "Total", "Warehouse", "Reference", "Notes"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap"
                      style={{ color: "var(--color-on-dark)", background: "var(--color-navy)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((t: any, idx: number) => {
                  const inbound = isInbound(t.transaction_type);
                  return (
                    <tr key={t.id}
                      style={{ background: idx % 2 === 0 ? "var(--color-white)" : "var(--color-light)", borderBottom: "1px solid var(--color-border)" }}>
                      <td className="px-4 py-3 whitespace-nowrap text-xs" style={{ color: "var(--color-text-muted)" }}>
                        {new Date(t.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="px-4 py-3 font-medium whitespace-nowrap" style={{ color: "var(--color-text)" }}>{t.item_name || "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs whitespace-nowrap" style={{ color: "var(--color-text-faint)" }}>{t.item_sku || "—"}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge variant={inbound ? "teal" : "red"}>
                          {TRANSACTION_LABELS[t.transaction_type] || t.transaction_type}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-semibold whitespace-nowrap" style={{ color: inbound ? "var(--color-primary)" : "var(--color-danger)" }}>
                        {inbound ? "+" : "-"}{t.quantity}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap" style={{ color: "var(--color-text-muted)" }}>
                        ${parseFloat(t.unit_cost || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap" style={{ color: "var(--color-navy)" }}>
                        ${(parseFloat(t.quantity || 0) * parseFloat(t.unit_cost || 0)).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs" style={{ color: "var(--color-text-muted)" }}>{t.warehouse_name || "—"}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs" style={{ color: "var(--color-text-muted)" }}>{t.reference_type || "—"}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs max-w-[150px] truncate" style={{ color: "var(--color-text-faint)" }} title={t.notes || ""}>{t.notes || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
