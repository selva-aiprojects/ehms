"use client";

import { useState } from "react";
import { Loader2, RefreshCw, AlertCircle, Search, Ban } from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Table from "@/components/ui/table";
import { useAccounts, useLedger, useProperties } from "@/lib/hooks";
import { formatCurrency, formatDate } from "@/lib/reference-constants";

const TYPE_BADGE: Record<string, "teal" | "navy" | "amber" | "gray"> = {
  asset: "teal", liability: "navy", income: "teal", expense: "amber", equity: "gray",
};

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} className="px-4 py-3"><div className="h-4 rounded animate-pulse" style={{ background: "#E2E8F0", width: `${60 + i * 10}px` }} /></td>
      ))}
    </tr>
  );
}

export default function GeneralLedgerPage() {
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [viewTrigger, setViewTrigger] = useState(0);

  const { accounts, isLoading: acctsLoading } = useAccounts();
  const { properties, isLoading: propsLoading } = useProperties();
  const { ledger, isLoading, isError, mutate } = useLedger(
    viewTrigger > 0 && selectedAccountId
      ? {
          account_id: selectedAccountId,
          ...(selectedPropertyId && { property_id: selectedPropertyId }),
          ...(fromDate && { from_date: fromDate }),
          ...(toDate && { to_date: toDate }),
        }
      : { account_id: "__skip__" }
  );

  const accountList = Array.isArray(accounts) ? accounts : [];
  const propertyList = Array.isArray(properties) ? properties : [];
  const entries = ledger?.entries ?? [];
  const accountInfo = ledger?.account;

  function handleViewLedger() {
    if (!selectedAccountId) return;
    setViewTrigger((p) => p + 1);
  }

  const isLoadingDisplay = isLoading && viewTrigger > 0 && !ledger;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#1A3C5E" }}>General Ledger</h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>View account-wise ledger with running balance</p>
        </div>
        <button onClick={() => mutate()} className="p-1.5 rounded-lg transition-colors" style={{ color: "#64748B" }} aria-label="Refresh">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <Card padding={false}>
        <div className="p-5 flex flex-wrap items-end gap-3">
          <div className="min-w-[200px] flex-1">
            <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Account</label>
            <select value={selectedAccountId} onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={{ border: "1px solid #E2E8F0", color: "#1A2E44" }}>
              <option value="">— Select Account —</option>
              {accountList.map((a: any) => (
                <option key={a.id} value={a.id}>{a.account_code} — {a.account_name}</option>
              ))}
            </select>
          </div>
          <div className="min-w-[180px] flex-1">
            <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Property</label>
            <select value={selectedPropertyId} onChange={(e) => setSelectedPropertyId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={{ border: "1px solid #E2E8F0", color: "#1A2E44" }}>
              <option value="">All Properties</option>
              {propertyList.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="min-w-[140px]">
            <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>From</label>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={{ border: "1px solid #E2E8F0" }} />
          </div>
          <div className="min-w-[140px]">
            <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>To</label>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={{ border: "1px solid #E2E8F0" }} />
          </div>
          <button onClick={handleViewLedger} disabled={!selectedAccountId || isLoading}
            className="px-4 py-2 text-sm font-medium rounded-lg transition-all disabled:opacity-50 text-white"
            style={{ background: "#1A3C5E" }}>
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin inline" /> : <Search className="w-3.5 h-3.5 inline" />}
            {" "}View Ledger
          </button>
        </div>
      </Card>

      {isError && (
        <div className="rounded-lg px-4 py-2.5 text-sm flex items-center gap-2" style={{ background: "rgba(229,62,62,0.08)", color: "#E53E3E", border: "1px solid rgba(229,62,62,0.2)" }}>
          <AlertCircle className="w-4 h-4" /> Failed to load ledger. <button onClick={() => mutate()} className="ml-auto underline text-xs">Retry</button>
        </div>
      )}

      {viewTrigger === 0 && !ledger && (
        <Card>
          <div className="text-center py-12">
            <Search className="w-10 h-10 mx-auto mb-3" style={{ color: "#CBD5E1" }} />
            <p className="text-sm font-medium" style={{ color: "#1A2E44" }}>Select an account and click "View Ledger"</p>
            <p className="text-xs mt-1" style={{ color: "#64748B" }}>Choose an account from the dropdown above to view its ledger entries</p>
          </div>
        </Card>
      )}

      {isLoadingDisplay && (
        <Card>
          <CardHeader title="Ledger Entries" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {["Date", "Description", "Ref Type", "Debit", "Credit", "Running Balance"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap"
                      style={{ color: "#FFFFFF", background: "#1A3C5E" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {ledger && !isLoadingDisplay && (
        <Card>
          <CardHeader title={accountInfo?.account_name || "Ledger"}
            subtitle={accountInfo ? `${accountInfo.account_code} · ${accountInfo.account_type.replace(/_/g, " ")}` : ""}
            action={accountInfo?.account_type && <Badge variant={TYPE_BADGE[accountInfo.account_type] || "gray"}>{accountInfo.account_type.replace(/_/g, " ")}</Badge>} />
          <div className="px-5 pb-4 flex items-center gap-4 text-sm flex-wrap">
            <div>
              <span className="text-xs font-medium" style={{ color: "#64748B" }}>Opening Balance</span>
              <div className="font-semibold" style={{ color: "#1A3C5E" }}>{formatCurrency(ledger.opening_balance || 0)}</div>
            </div>
            <div className="text-xs px-2 py-0.5 rounded" style={{ background: "#F5F7FA", color: "#64748B" }}>
              {accountInfo && (accountInfo.account_type === "asset" || accountInfo.account_type === "expense")
                ? "Debit increases balance"
                : "Credit increases balance"}
            </div>
          </div>
          {entries.length === 0 ? (
            <div className="text-center py-8">
              <Ban className="w-8 h-8 mx-auto mb-2" style={{ color: "#CBD5E1" }} />
              <p className="text-sm" style={{ color: "#64748B" }}>No ledger entries found for the selected filters</p>
            </div>
          ) : (
            <>
              <Table
                data={entries}
                keyExtractor={(_: any, i: number) => String(i)}
                columns={[
                  { key: "entry_date", header: "Date", render: (e: any) => <span className="text-xs" style={{ color: "#64748B" }}>{formatDate(e.entry_date)}</span> },
                  { key: "description", header: "Description", render: (e: any) => (
                    <div><div className="text-sm" style={{ color: "#1A2E44" }}>{e.description || e.journal_description || "—"}</div></div>
                  )},
                  { key: "reference_type", header: "Ref Type", render: (e: any) => (
                    <Badge variant="gray">{e.reference_type || "—"}</Badge>
                  )},
                  { key: "debit", header: "Debit", render: (e: any) => (
                    <span className="font-mono text-sm" style={{ color: e.debit ? "#1A3C5E" : "#CBD5E1" }}>{e.debit ? formatCurrency(e.debit) : "—"}</span>
                  )},
                  { key: "credit", header: "Credit", render: (e: any) => (
                    <span className="font-mono text-sm" style={{ color: e.credit ? "#1A3C5E" : "#CBD5E1" }}>{e.credit ? formatCurrency(e.credit) : "—"}</span>
                  )},
                  { key: "running_balance", header: "Running Balance", render: (e: any) => {
                    const bal = e.running_balance ?? 0;
                    return <span className="font-mono text-sm font-semibold" style={{ color: bal >= 0 ? "#1A3C5E" : "#E53E3E" }}>{formatCurrency(bal)}</span>;
                  }},
                ]}
              />
              <div className="px-5 py-3 flex items-center justify-end gap-6 text-sm border-t" style={{ borderColor: "#E2E8F0", background: "#F5F7FA" }}>
                <div><span className="text-xs font-medium" style={{ color: "#64748B" }}>Total Debits</span><div className="font-semibold" style={{ color: "#1A3C5E" }}>{formatCurrency(ledger.total_debits || 0)}</div></div>
                <div><span className="text-xs font-medium" style={{ color: "#64748B" }}>Total Credits</span><div className="font-semibold" style={{ color: "#1A3C5E" }}>{formatCurrency(ledger.total_credits || 0)}</div></div>
                <div className="pl-4" style={{ borderLeft: "1px solid #E2E8F0" }}>
                  <span className="text-xs font-medium" style={{ color: "#64748B" }}>Closing Balance</span>
                  <div className="font-bold text-base" style={{ color: (ledger.closing_balance ?? 0) >= 0 ? "#1A3C5E" : "#E53E3E" }}>
                    {formatCurrency(ledger.closing_balance || 0)}
                  </div>
                </div>
              </div>
            </>
          )}
        </Card>
      )}
    </div>
  );
}
