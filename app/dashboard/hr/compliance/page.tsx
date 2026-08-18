"use client";

import { useState, useEffect } from "react";
import {
  AlertCircle, Loader2, RefreshCw, Download,
  FileText, Users, BadgePercent, CreditCard,
  Landmark, Calendar
} from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";

function SkeletonCard() {
  return <div className="rounded-xl p-4 animate-pulse" style={{ background: "var(--color-border)" }}>
    <div className="w-12 h-8 rounded mb-2" style={{ background: "var(--color-border-strong)" }} />
    <div className="w-16 h-3 rounded" style={{ background: "var(--color-border-strong)" }} />
  </div>;
}

const COMPLIANCE_TABS = [
  { key: "pf", label: "PF (Provident Fund)", icon: Landmark },
  { key: "esi", label: "ESI", icon: CreditCard },
  { key: "pt", label: "Professional Tax", icon: BadgePercent },
  { key: "tds", label: "TDS", icon: FileText },
];

export default function CompliancePage() {
  const [activeTab, setActiveTab] = useState("pf");
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/hr/compliance");
      const json = await res.json();
      setData(json?.data || null);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchData(); }, []);

  const contributions = data?.contributions as Record<string, { amount: number; rate: string }> | undefined;

  const summaryCards = [
    { label: "Total Gross", value: (data?.total_gross as number) || 0, icon: Users, color: "var(--color-navy)" },
    { label: "Total Deductions", value: (data?.total_deductions as number) || 0, icon: CreditCard, color: "var(--color-danger)" },
    { label: "Total Net Pay", value: (data?.total_net as number) || 0, icon: FileText, color: "var(--color-primary)" },
    { label: "Employees", value: (data?.employee_count as number) || 0, icon: Users, color: "var(--color-warning)" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--color-navy)" }}>Statutory Compliance</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--color-text-muted)" }}>{data?.month as string || "Current month"} &middot; PF, ESI, PT & TDS</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchData} className="p-1.5 rounded-lg transition-colors" style={{ color: "var(--color-text-muted)" }} aria-label="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors" style={{ color: "var(--color-navy)", background: "var(--color-light)", border: "1px solid var(--color-border)" }}>
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {summaryCards.map((card) => (
            <div key={card.label} className="rounded-xl p-4 text-white" style={{ background: card.color }}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-lg font-bold">{(card.label === "Employees") ? card.value : `\u20B9${Number(card.value).toLocaleString()}`}</div>
                <card.icon className="w-5 h-5 opacity-60" />
              </div>
              <div className="text-xs opacity-80">{card.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center rounded-lg text-xs font-medium overflow-hidden" style={{ border: "1px solid var(--color-border)", width: "fit-content" }}>
        {COMPLIANCE_TABS.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className="flex items-center gap-1.5 px-4 py-2 transition-colors"
            style={{ background: activeTab === tab.key ? "var(--color-navy)" : "var(--color-light)", color: activeTab === tab.key ? "var(--color-white)" : "var(--color-text-muted)" }}>
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader
          title={COMPLIANCE_TABS.find((t) => t.key === activeTab)?.label || "Details"}
          subtitle="Current month contributions"
        />
        <div className="p-1">
          {contributions?.[activeTab] ? (
            <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: "var(--color-light)" }}>
              <div>
                <div className="text-sm font-medium" style={{ color: "var(--color-text)" }}>{COMPLIANCE_TABS.find((t) => t.key === activeTab)?.label}</div>
                <div className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>Rate: {contributions[activeTab].rate}</div>
              </div>
              <div className="text-lg font-bold" style={{ color: "var(--color-navy)" }}>
                {'\u20B9'}{Number(contributions[activeTab].amount).toLocaleString()}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="w-6 h-6 mx-auto mb-2" style={{ color: "var(--color-text-muted)" }} />
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>No data available for this period</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
