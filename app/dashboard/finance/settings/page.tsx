"use client";

import { useState } from "react";
import { Plus, Loader2, RefreshCw, AlertCircle, CheckCircle, Save, Ban } from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import Table from "@/components/ui/table";
import { useCostCenters, useFiscalYears, useBudgetHeads, useAccounts } from "@/lib/hooks";
import { useCreateCostCenter, useCreateFiscalYear, useCreateBudgetHead } from "@/lib/hooks/mutations";
import { formatDate } from "@/lib/reference-constants";

type Tab = "cost-centers" | "fiscal-years" | "budget-heads";

export default function FinanceSettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("cost-centers");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<Tab | null>(null);

  const { costCenters, isLoading: ccLoading, isError: ccError, mutate: ccMutate } = useCostCenters();
  const { fiscalYears, isLoading: fyLoading, isError: fyError, mutate: fyMutate } = useFiscalYears();
  const { budgetHeads, isLoading: bhLoading, isError: bhError, mutate: bhMutate } = useBudgetHeads();
  const { accounts } = useAccounts();

  const { trigger: createCC, isMutating: ccCreating } = useCreateCostCenter();
  const { trigger: createFY, isMutating: fyCreating } = useCreateFiscalYear();
  const { trigger: createBH, isMutating: bhCreating } = useCreateBudgetHead();

  const [formCC, setFormCC] = useState({ code: "", name: "", department_id: "" });
  const [formFY, setFormFY] = useState({ name: "", start_date: "", end_date: "" });
  const [formBH, setFormBH] = useState({ code: "", name: "", account_id: "" });

  function showFeedback(type: "success" | "error", message: string) {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  }

  function openModal(type: Tab) {
    setModalType(type);
    setShowModal(true);
    setFormCC({ code: "", name: "", department_id: "" });
    setFormFY({ name: "", start_date: "", end_date: "" });
    setFormBH({ code: "", name: "", account_id: "" });
  }

  function closeModal() { setShowModal(false); setModalType(null); }

  async function handleCreate() {
    try {
      if (modalType === "cost-centers") {
        if (!formCC.code || !formCC.name) { showFeedback("error", "Code and name are required"); return; }
        await createCC({ code: formCC.code, name: formCC.name, department_id: formCC.department_id || null });
        showFeedback("success", "Cost center created");
      } else if (modalType === "fiscal-years") {
        if (!formFY.name || !formFY.start_date || !formFY.end_date) { showFeedback("error", "All fields are required"); return; }
        await createFY({ name: formFY.name, start_date: formFY.start_date, end_date: formFY.end_date });
        showFeedback("success", "Fiscal year created");
      } else if (modalType === "budget-heads") {
        if (!formBH.code || !formBH.name || !formBH.account_id) { showFeedback("error", "All fields are required"); return; }
        await createBH({ code: formBH.code, name: formBH.name, account_id: formBH.account_id });
        showFeedback("success", "Budget head created");
      }
      closeModal();
    } catch { showFeedback("error", "Failed to create"); }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "cost-centers", label: "Cost Centers" },
    { key: "fiscal-years", label: "Fiscal Years" },
    { key: "budget-heads", label: "Budget Heads" },
  ];

  function isCreating() {
    if (modalType === "cost-centers") return ccCreating;
    if (modalType === "fiscal-years") return fyCreating;
    return bhCreating;
  }

  const ccData = Array.isArray(costCenters) ? costCenters : [];
  const fyData = Array.isArray(fiscalYears) ? fiscalYears : [];
  const bhData = Array.isArray(budgetHeads) ? budgetHeads : [];
  const accountList = Array.isArray(accounts) ? accounts : [];

  const tabContent = {
    "cost-centers": {
      loading: ccLoading, error: ccError, empty: ccData.length === 0, data: ccData,
      columns: [
        { key: "code", header: "Code", render: (c: any) => <span className="font-mono text-xs font-medium" style={{ color: "#1A2E44" }}>{c.code}</span> },
        { key: "name", header: "Name", render: (c: any) => <span className="text-sm" style={{ color: "#1A2E44" }}>{c.name}</span> },
        { key: "department_name", header: "Department", render: (c: any) => <span className="text-xs" style={{ color: "#64748B" }}>{c.department_name || "—"}</span> },
        { key: "is_active", header: "Status", render: (c: any) => <Badge variant={c.is_active ? "teal" : "red"}>{c.is_active ? "Active" : "Inactive"}</Badge> },
      ],
      addLabel: "Add Cost Center",
      modal: (
        <div className="space-y-4">
          {[
            { label: "Code *", value: formCC.code, key: "code", placeholder: "e.g. CC-001" },
            { label: "Name *", value: formCC.name, key: "name", placeholder: "e.g. Front Office" },
          ].map((f) => (
            <div key={f.key}>
              <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>{f.label}</label>
              <input type="text" value={f.value} onChange={(e) => setFormCC({ ...formCC, [f.key]: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={{ border: "1px solid #E2E8F0" }} placeholder={f.placeholder} />
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Department ID</label>
            <input type="text" value={formCC.department_id} onChange={(e) => setFormCC({ ...formCC, department_id: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={{ border: "1px solid #E2E8F0" }} placeholder="Optional" />
          </div>
        </div>
      ),
    },
    "fiscal-years": {
      loading: fyLoading, error: fyError, empty: fyData.length === 0, data: fyData,
      columns: [
        { key: "name", header: "Name", render: (f: any) => <span className="text-sm font-medium" style={{ color: "#1A2E44" }}>{f.name}</span> },
        { key: "start_date", header: "Start Date", render: (f: any) => <span className="text-xs" style={{ color: "#64748B" }}>{formatDate(f.start_date)}</span> },
        { key: "end_date", header: "End Date", render: (f: any) => <span className="text-xs" style={{ color: "#64748B" }}>{formatDate(f.end_date)}</span> },
        { key: "is_closed", header: "Status", render: (f: any) => <Badge variant={f.is_closed ? "gray" : "teal"}>{f.is_closed ? "Closed" : "Open"}</Badge> },
      ],
      addLabel: "Add Fiscal Year",
      modal: (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Name *</label>
            <input type="text" value={formFY.name} onChange={(e) => setFormFY({ ...formFY, name: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={{ border: "1px solid #E2E8F0" }} placeholder="e.g. FY 2026-27" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Start Date *</label>
              <input type="date" value={formFY.start_date} onChange={(e) => setFormFY({ ...formFY, start_date: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={{ border: "1px solid #E2E8F0" }} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>End Date *</label>
              <input type="date" value={formFY.end_date} onChange={(e) => setFormFY({ ...formFY, end_date: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={{ border: "1px solid #E2E8F0" }} />
            </div>
          </div>
        </div>
      ),
    },
    "budget-heads": {
      loading: bhLoading, error: bhError, empty: bhData.length === 0, data: bhData,
      columns: [
        { key: "code", header: "Code", render: (b: any) => <span className="font-mono text-xs font-medium" style={{ color: "#1A2E44" }}>{b.code}</span> },
        { key: "name", header: "Name", render: (b: any) => <span className="text-sm" style={{ color: "#1A2E44" }}>{b.name}</span> },
        { key: "account_code", header: "Linked Account", render: (b: any) => <span className="text-xs" style={{ color: "#64748B" }}>{b.account_name || b.account_code || "—"}</span> },
      ],
      addLabel: "Add Budget Head",
      modal: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Code *</label>
              <input type="text" value={formBH.code} onChange={(e) => setFormBH({ ...formBH, code: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={{ border: "1px solid #E2E8F0" }} placeholder="e.g. BH-001" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Name *</label>
              <input type="text" value={formBH.name} onChange={(e) => setFormBH({ ...formBH, name: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={{ border: "1px solid #E2E8F0" }} placeholder="e.g. Utilities" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "#64748B" }}>Linked Account *</label>
            <select value={formBH.account_id} onChange={(e) => setFormBH({ ...formBH, account_id: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-lg outline-none" style={{ border: "1px solid #E2E8F0", color: "#1A2E44" }}>
              <option value="">— Select Account —</option>
              {accountList.map((a: any) => (
                <option key={a.id} value={a.id}>{a.account_code} — {a.account_name}</option>
              ))}
            </select>
          </div>
        </div>
      ),
    },
  };

  function renderCard(tab: Tab) {
    const tc = tabContent[tab];
    return (
      <Card>
        <CardHeader title={tabs.find((t) => t.key === tab)?.label || ""}
          action={<Button size="sm" onClick={() => openModal(tab)}><Plus className="w-3.5 h-3.5" /> {tc.addLabel}</Button>} />
        {tc.loading ? (
          <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" style={{ color: "#94A3B8" }} /></div>
        ) : tc.error ? (
          <div className="text-center py-8">
            <AlertCircle className="w-6 h-6 mx-auto mb-2" style={{ color: "#E53E3E" }} />
            <p className="text-sm" style={{ color: "#64748B" }}>Failed to load data. Please try again.</p>
          </div>
        ) : tc.empty ? (
          <div className="text-center py-8">
            <Ban className="w-8 h-8 mx-auto mb-2" style={{ color: "#CBD5E1" }} />
            <p className="text-sm" style={{ color: "#64748B" }}>No {tabs.find((t) => t.key === tab)?.label.toLowerCase()} found</p>
          </div>
        ) : (
          <Table data={tc.data} keyExtractor={(item: any) => item.id} columns={tc.columns as any} />
        )}
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#1A3C5E" }}>Finance Settings</h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>Manage cost centers, fiscal years, and budget heads</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { ccMutate(); fyMutate(); bhMutate(); }} className="p-1.5 rounded-lg transition-colors" style={{ color: "#64748B" }} aria-label="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {feedback && (
        <div className="rounded-lg px-4 py-2.5 text-sm flex items-center gap-2"
          style={{ background: feedback.type === "success" ? "rgba(42,157,143,0.1)" : "rgba(229,62,62,0.08)", color: feedback.type === "success" ? "#2BAE8E" : "#E53E3E", border: `1px solid ${feedback.type === "success" ? "rgba(42,157,143,0.2)" : "rgba(229,62,62,0.2)"}` }}>
          {feedback.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {feedback.message}
        </div>
      )}

      <div className="flex gap-1 p-1 rounded-xl" style={{ background: "#F5F7FA", border: "1px solid #E2E8F0" }}>
        {tabs.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className="flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all"
            style={{ background: activeTab === tab.key ? "#FFFFFF" : "transparent", color: activeTab === tab.key ? "#1A3C5E" : "#64748B", boxShadow: activeTab === tab.key ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
            {tab.label}
          </button>
        ))}
      </div>

      {renderCard(activeTab)}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "#E2E8F0" }}>
              <h3 className="font-bold text-lg" style={{ color: "#1A3C5E" }}>{tabContent[modalType!].addLabel}</h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 font-bold text-lg">&times;</button>
            </div>
            <div className="p-6">{tabContent[modalType!].modal}</div>
            <div className="px-6 py-4 border-t flex justify-end gap-2" style={{ borderColor: "#E2E8F0" }}>
              <Button variant="outline" size="sm" onClick={closeModal}>Cancel</Button>
              <Button size="sm" onClick={handleCreate} disabled={isCreating()}>
                {isCreating() ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {isCreating() ? "Creating..." : "Create"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
