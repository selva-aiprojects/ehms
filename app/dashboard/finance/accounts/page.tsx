"use client";

import { useState } from "react";
import { Plus, RefreshCw, Loader2, CheckCircle, AlertCircle, X, Save, Ban } from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import Table from "@/components/ui/table";
import { useAccounts } from "@/lib/hooks";
import { useCreateAccount } from "@/lib/hooks/mutations";
import { formatCurrency } from "@/lib/reference-constants";

const ACCOUNT_TYPES = ["asset", "liability", "income", "expense", "equity"] as const;

const SUB_TYPES: Record<string, string[]> = {
  asset: ["current", "fixed", "intangible", "receivable", "cash"],
  liability: ["current", "long_term", "payable"],
  income: ["revenue", "other_income", "discount"],
  expense: ["direct", "indirect", "operating", "administrative"],
  equity: ["capital", "retained_earnings", "drawings"],
};

const TYPE_BADGE: Record<string, "teal" | "navy" | "amber" | "gray"> = {
  asset: "teal", liability: "navy", income: "teal",
  expense: "amber", equity: "gray",
};

const initialForm = {
  account_code: "", account_name: "", account_type: "asset" as string,
  sub_type: "", opening_balance: "", description: "",
};

export default function ChartOfAccountsPage() {
  const [typeFilter, setTypeFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const { accounts, isLoading, isError, mutate } = useAccounts(typeFilter ? { account_type: typeFilter } : {});
  const { trigger: createAccount, isMutating: creating } = useCreateAccount();

  function showFeedback(type: "success" | "error", message: string) {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  }

  async function handleCreate() {
    if (!form.account_code || !form.account_name) {
      showFeedback("error", "Account code and name are required");
      return;
    }
    try {
      await createAccount({
        account_code: form.account_code,
        account_name: form.account_name,
        account_type: form.account_type,
        sub_type: form.sub_type || null,
        opening_balance: form.opening_balance ? Number(form.opening_balance) : 0,
        description: form.description || null,
      });
      showFeedback("success", `Account "${form.account_name}" created successfully`);
      setShowModal(false);
      setForm(initialForm);
    } catch {
      showFeedback("error", "Failed to create account");
    }
  }

  const columns = [
    { key: "account_code", header: "Code", render: (a: any) => (
      <span className="font-mono text-xs font-medium" style={{ color: "#1A2E44" }}>{a.account_code}</span>
    )},
    { key: "account_name", header: "Account Name", render: (a: any) => (
      <span className="text-sm font-medium" style={{ color: "#1A2E44" }}>{a.account_name}</span>
    )},
    { key: "account_type", header: "Type", render: (a: any) => (
      <Badge variant={TYPE_BADGE[a.account_type] || "gray"}>{a.account_type.replace(/_/g, " ")}</Badge>
    )},
    { key: "sub_type", header: "Sub Type", render: (a: any) => (
      <span className="text-xs capitalize" style={{ color: "#64748B" }}>{a.sub_type?.replace(/_/g, " ") || "—"}</span>
    )},
    { key: "opening_balance", header: "Opening Balance", render: (a: any) => (
      <span className="text-sm font-mono" style={{ color: a.opening_balance >= 0 ? "#1A2E44" : "#E53E3E" }}>
        {formatCurrency(a.opening_balance || 0)}
      </span>
    )},
    { key: "is_active", header: "Status", render: (a: any) => (
      <Badge variant={a.is_active ? "teal" : "red"}>{a.is_active ? "Active" : "Inactive"}</Badge>
    )},
    { key: "actions", header: "Actions", render: (a: any) => (
      <Button variant="ghost" size="sm" disabled>
        <Ban className="w-3 h-3" /> Edit
      </Button>
    )},
  ];

  const displayedAccounts = Array.isArray(accounts) ? accounts : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#1A3C5E" }}>Chart of Accounts</h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>Manage your financial account hierarchy</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => mutate()} className="p-1.5 rounded-lg transition-colors" style={{ color: "#64748B" }} aria-label="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
          <Button size="sm" onClick={() => setShowModal(true)}>
            <Plus className="w-3.5 h-3.5" /> Add Account
          </Button>
        </div>
      </div>

      {feedback && (
        <div className="rounded-lg px-4 py-2.5 text-sm flex items-center gap-2"
          style={{ background: feedback.type === "success" ? "rgba(42,157,143,0.1)" : "rgba(229,62,62,0.08)", color: feedback.type === "success" ? "#2BAE8E" : "#E53E3E", border: `1px solid ${feedback.type === "success" ? "rgba(42,157,143,0.2)" : "rgba(229,62,62,0.2)"}` }}>
          {feedback.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {feedback.message}
        </div>
      )}

      <Card>
        <CardHeader title="Accounts" subtitle={`${displayedAccounts.length} accounts`}
          action={
            <div className="flex items-center gap-1.5">
              {["", ...ACCOUNT_TYPES].map((t) => (
                <button key={t || "all"} onClick={() => setTypeFilter(t)}
                  className="px-2.5 py-1 text-[10px] font-medium rounded transition-all capitalize"
                  style={{ background: typeFilter === t ? "#1A3C5E" : "#F5F7FA", color: typeFilter === t ? "#FFFFFF" : "#64748B" }}>
                  {t || "All"}
                </button>
              ))}
            </div>
          } />
        {isLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" style={{ color: "#94A3B8" }} /></div>
        ) : isError ? (
          <div className="text-center py-8">
            <AlertCircle className="w-6 h-6 mx-auto mb-2" style={{ color: "#E53E3E" }} />
            <p className="text-sm" style={{ color: "#64748B" }}>Failed to load accounts. Please try again.</p>
          </div>
        ) : displayedAccounts.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center" style={{ background: "rgba(43,174,142,0.1)" }}>
              <Ban className="w-5 h-5" style={{ color: "#2BAE8E" }} />
            </div>
            <p className="text-sm font-medium" style={{ color: "#1A2E44" }}>No accounts found</p>
            <p className="text-xs mt-1" style={{ color: "#64748B" }}>Click "Add Account" to create your first account</p>
          </div>
        ) : (
          <Table data={displayedAccounts} keyExtractor={(a: any) => a.id} columns={columns} />
        )}
      </Card>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "#E2E8F0" }}>
              <h3 className="font-bold text-lg" style={{ color: "#1A3C5E" }}>Add Account</h3>
              <button onClick={() => { setShowModal(false); setForm(initialForm); }} className="text-slate-400 hover:text-slate-600 font-bold text-lg">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Account Code *</label>
                  <input type="text" value={form.account_code} onChange={(e) => setForm({ ...form, account_code: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={{ border: "1px solid #E2E8F0" }} placeholder="e.g. 1010" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Account Name *</label>
                  <input type="text" value={form.account_name} onChange={(e) => setForm({ ...form, account_name: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={{ border: "1px solid #E2E8F0" }} placeholder="e.g. Cash in Hand" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Account Type</label>
                  <select value={form.account_type} onChange={(e) => setForm({ ...form, account_type: e.target.value, sub_type: "" })}
                    className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={{ border: "1px solid #E2E8F0", color: "#1A2E44" }}>
                    {ACCOUNT_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Sub Type</label>
                  <select value={form.sub_type} onChange={(e) => setForm({ ...form, sub_type: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={{ border: "1px solid #E2E8F0", color: "#1A2E44" }}>
                    <option value="">— Select —</option>
                    {(SUB_TYPES[form.account_type] || []).map((st) => <option key={st} value={st}>{st.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Opening Balance</label>
                <input type="number" value={form.opening_balance} onChange={(e) => setForm({ ...form, opening_balance: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={{ border: "1px solid #E2E8F0" }} placeholder="0" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg outline-none resize-none" style={{ border: "1px solid #E2E8F0" }} rows={2} placeholder="Optional description" />
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-2" style={{ borderColor: "#E2E8F0" }}>
              <Button variant="outline" size="sm" onClick={() => { setShowModal(false); setForm(initialForm); }}>Cancel</Button>
              <Button size="sm" onClick={handleCreate} disabled={creating}>
                {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {creating ? "Creating..." : "Create Account"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
