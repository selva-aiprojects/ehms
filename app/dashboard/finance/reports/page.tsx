"use client";

import { useState } from "react";
import { BarChart3, FileText, Scale, TrendingUp, TrendingDown, DollarSign, CheckCircle, XCircle, Loader2 } from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import { useTrialBalance, useProfitLoss, useBalanceSheet } from "@/lib/hooks";
import { formatCurrency } from "@/lib/reference-constants";

const TABS = [
  { key: "trial_balance", label: "Trial Balance", icon: Scale },
  { key: "profit_loss", label: "Profit & Loss", icon: TrendingUp },
  { key: "balance_sheet", label: "Balance Sheet", icon: FileText },
];

function SkeletonBlock() {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-6 rounded" style={{ background: "#F5F7FA" }} />
      ))}
    </div>
  );
}

function SectionTitle({ label, total, color }: { label: string; total: string; color: string }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg text-sm font-semibold mb-2" style={{ background: `${color}0a`, color, borderLeft: `3px solid ${color}` }}>
      <span>{label}</span>
      <span>{total}</span>
    </div>
  );
}

function TotalCheckRow({ label, left, right, equal }: { label: string; left: string; right: string; equal: boolean }) {
  return (
    <div className="flex items-center justify-between py-3 px-3 rounded-lg text-sm font-bold mt-3" style={{ background: "#F5F7FA", color: "#1A3C5E", border: `1px solid ${equal ? "#2BAE8E" : "#E53E3E"}` }}>
      <div className="flex items-center gap-2">
        {equal ? <CheckCircle className="w-4 h-4" style={{ color: "#2BAE8E" }} /> : <XCircle className="w-4 h-4" style={{ color: "#E53E3E" }} />}
        <span>{label}</span>
      </div>
      <div className="flex gap-4 text-xs">
        <span style={{ color: "#64748B" }}>{left}</span>
        <span style={{ color: "#1A2E44" }}>{right}</span>
      </div>
    </div>
  );
}

function Row({ code, name, debit, credit, balance, type }: { code?: string; name: string; debit?: number; credit?: number; balance?: number; type?: string }) {
  return (
    <div className="flex items-center text-xs py-1.5 px-3" style={{ borderBottom: "1px solid #F5F7FA" }}>
      {code && <span className="w-24 font-mono" style={{ color: "#64748B" }}>{code}</span>}
      <span className="flex-1" style={{ color: "#1A2E44" }}>{name}</span>
      {debit !== undefined && <span className="w-28 text-right" style={{ color: "#64748B" }}>{formatCurrency(debit)}</span>}
      {credit !== undefined && <span className="w-28 text-right" style={{ color: "#64748B" }}>{formatCurrency(credit)}</span>}
      {balance !== undefined && (
        <span className="w-28 text-right font-medium" style={{ color: type === "Dr" ? "#E53E3E" : "#2BAE8E" }}>
          {formatCurrency(balance)} {type}
        </span>
      )}
    </div>
  );
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("trial_balance");
  const [asAtDate, setAsAtDate] = useState(new Date().toISOString().split("T")[0]);

  const { trialBalance, isLoading: tbLoading } = useTrialBalance({ as_at_date: asAtDate });
  const { profitLoss, isLoading: plLoading } = useProfitLoss();
  const { balanceSheet, isLoading: bsLoading } = useBalanceSheet({ as_at_date: asAtDate });

  const tb = trialBalance as any;
  const pl = profitLoss as any;
  const bs = balanceSheet as any;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#1A3C5E" }}>Financial Reports</h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>Trial balance, profit & loss, and balance sheet</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: "#64748B" }}>As at</span>
          <input type="date" value={asAtDate} onChange={(e) => setAsAtDate(e.target.value)} className="px-3 py-1.5 rounded-lg text-xs" style={{ border: "1px solid #E2E8F0", color: "#1A2E44", background: "#FFFFFF" }} />
        </div>
      </div>

      <div className="flex gap-1.5 p-1 rounded-xl" style={{ background: "#F5F7FA", border: "1px solid #E2E8F0" }}>
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-colors"
              style={{ background: isActive ? "#FFFFFF" : "transparent", color: isActive ? "#1A3C5E" : "#64748B", boxShadow: isActive ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}
            >
              <Icon className="w-3.5 h-3.5" /> {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "trial_balance" && (
        <Card>
          <CardHeader title="Trial Balance" subtitle={`As at ${asAtDate}`} />
          {tbLoading ? <SkeletonBlock /> : !tb ? (
            <div className="text-center py-8 text-sm" style={{ color: "#64748B" }}>No trial balance data available</div>
          ) : (
            <>
              <div className="flex items-center text-xs font-semibold py-2 px-3 rounded-t-lg" style={{ background: "#1A3C5E", color: "#FFFFFF" }}>
                <span className="w-24">Code</span>
                <span className="flex-1">Account</span>
                <span className="w-28 text-right">Debit</span>
                <span className="w-28 text-right">Credit</span>
                <span className="w-28 text-right">Balance</span>
              </div>
              {(tb.rows || []).map((r: any, i: number) => (
                <Row key={i} code={r.account_code} name={r.account_name} debit={r.debit} credit={r.credit} balance={r.balance} type={r.balance_type} />
              ))}
              <div className="flex items-center text-xs font-bold py-2 px-3 mt-2 rounded-lg" style={{ background: "#F5F7FA", color: "#1A3C5E" }}>
                <span className="w-24" />
                <span className="flex-1">Total</span>
                <span className="w-28 text-right">{formatCurrency(tb.total_debits ?? 0)}</span>
                <span className="w-28 text-right">{formatCurrency(tb.total_credits ?? 0)}</span>
                <span className="w-28 text-right" />
              </div>
              <TotalCheckRow
                label="Trial Balance Check"
                left={`Dr ${formatCurrency(tb.total_debits ?? 0)}`}
                right={`Cr ${formatCurrency(tb.total_credits ?? 0)}`}
                equal={tb.in_balance}
              />
            </>
          )}
        </Card>
      )}

      {activeTab === "profit_loss" && (
        <Card>
          <CardHeader title="Profit & Loss Statement" subtitle={`Period ending ${asAtDate}`} />
          {plLoading ? <SkeletonBlock /> : !pl ? (
            <div className="text-center py-8 text-sm" style={{ color: "#64748B" }}>No P&L data available</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <SectionTitle label="Income / Revenue" total={formatCurrency(pl.total_income ?? 0)} color="#2BAE8E" />
                <div className="space-y-0.5">
                  {(pl.income || []).map((r: any, i: number) => (
                    <div key={i} className="flex justify-between text-xs py-1.5 px-3" style={{ borderBottom: "1px solid #F5F7FA" }}>
                      <span style={{ color: "#1A2E44" }}>{r.account_name}</span>
                      <span style={{ color: "#2BAE8E" }}>{formatCurrency(r.amount)}</span>
                    </div>
                  ))}
                </div>
                {(!pl.income || pl.income.length === 0) && <div className="text-xs px-3 py-4 text-center" style={{ color: "#94A3B8" }}>No income entries</div>}
              </div>
              <div>
                <SectionTitle label="Expenses" total={formatCurrency(pl.total_expenses ?? 0)} color="#E53E3E" />
                <div className="space-y-0.5">
                  {(pl.expenses || []).map((r: any, i: number) => (
                    <div key={i} className="flex justify-between text-xs py-1.5 px-3" style={{ borderBottom: "1px solid #F5F7FA" }}>
                      <span style={{ color: "#1A2E44" }}>{r.account_name}</span>
                      <span style={{ color: "#E53E3E" }}>{formatCurrency(r.amount)}</span>
                    </div>
                  ))}
                </div>
                {(!pl.expenses || pl.expenses.length === 0) && <div className="text-xs px-3 py-4 text-center" style={{ color: "#94A3B8" }}>No expense entries</div>}
              </div>
              <div className="md:col-span-2 flex items-center justify-between p-4 rounded-lg" style={{ background: "#F5F7FA", border: "1px solid #E2E8F0" }}>
                <div>
                  <div className="text-xs font-medium" style={{ color: "#64748B" }}>Net {pl.net_profit >= 0 ? "Profit" : "Loss"}</div>
                  <div className="text-xl font-bold mt-0.5" style={{ color: pl.net_profit >= 0 ? "#2BAE8E" : "#E53E3E" }}>
                    {pl.net_profit >= 0 ? "+" : ""}{formatCurrency(Math.abs(pl.net_profit ?? 0))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {pl.net_profit >= 0 ? <TrendingUp className="w-5 h-5" style={{ color: "#2BAE8E" }} /> : <TrendingDown className="w-5 h-5" style={{ color: "#E53E3E" }} />}
                  <span className="text-lg font-bold" style={{ color: pl.net_profit >= 0 ? "#2BAE8E" : "#E53E3E" }}>
                    {Math.abs(pl.profit_margin ?? 0).toFixed(1)}%
                  </span>
                  <span className="text-xs" style={{ color: "#64748B" }}>margin</span>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {activeTab === "balance_sheet" && (
        <Card>
          <CardHeader title="Balance Sheet" subtitle={`As at ${asAtDate}`} />
          {bsLoading ? <SkeletonBlock /> : !bs ? (
            <div className="text-center py-8 text-sm" style={{ color: "#64748B" }}>No balance sheet data available</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <SectionTitle label="Assets" total={formatCurrency(bs.total_assets ?? 0)} color="#2BAE8E" />
                <div className="space-y-0.5">
                  {(bs.assets || []).map((r: any, i: number) => (
                    <div key={i} className="flex justify-between text-xs py-1.5 px-3" style={{ borderBottom: "1px solid #F5F7FA" }}>
                      <span><span style={{ color: "#1A2E44" }}>{r.account_name}</span>{r.sub_type ? <span className="ml-1 text-[10px]" style={{ color: "#94A3B8" }}>({r.sub_type})</span> : null}</span>
                      <span style={{ color: "#2BAE8E" }}>{formatCurrency(r.balance)}</span>
                    </div>
                  ))}
                </div>
                {(!bs.assets || bs.assets.length === 0) && <div className="text-xs px-3 py-4 text-center" style={{ color: "#94A3B8" }}>No asset entries</div>}
              </div>
              <div>
                <SectionTitle label="Liabilities" total={formatCurrency(bs.total_liabilities ?? 0)} color="#E53E3E" />
                <div className="space-y-0.5">
                  {(bs.liabilities || []).map((r: any, i: number) => (
                    <div key={i} className="flex justify-between text-xs py-1.5 px-3" style={{ borderBottom: "1px solid #F5F7FA" }}>
                      <span><span style={{ color: "#1A2E44" }}>{r.account_name}</span>{r.sub_type ? <span className="ml-1 text-[10px]" style={{ color: "#94A3B8" }}>({r.sub_type})</span> : null}</span>
                      <span style={{ color: "#E53E3E" }}>{formatCurrency(r.balance)}</span>
                    </div>
                  ))}
                </div>
                {(!bs.liabilities || bs.liabilities.length === 0) && <div className="text-xs px-3 py-4 text-center" style={{ color: "#94A3B8" }}>No liability entries</div>}
              </div>
              <div>
                <SectionTitle label="Equity" total={formatCurrency(bs.total_equity ?? 0)} color="#F5A623" />
                <div className="space-y-0.5">
                  {(bs.equity || []).map((r: any, i: number) => (
                    <div key={i} className="flex justify-between text-xs py-1.5 px-3" style={{ borderBottom: "1px solid #F5F7FA" }}>
                      <span style={{ color: "#1A2E44" }}>{r.account_name}</span>
                      <span style={{ color: "#F5A623" }}>{formatCurrency(r.balance)}</span>
                    </div>
                  ))}
                </div>
                {(!bs.equity || bs.equity.length === 0) && <div className="text-xs px-3 py-4 text-center" style={{ color: "#94A3B8" }}>No equity entries</div>}
              </div>
              <div className="md:col-span-3">
                <TotalCheckRow
                  label="Balance Sheet Check: Assets = Liabilities + Equity"
                  left={`Assets ${formatCurrency(bs.total_assets ?? 0)}`}
                  right={`L+E ${formatCurrency((bs.total_liabilities ?? 0) + (bs.total_equity ?? 0))}`}
                  equal={Math.abs((bs.total_assets ?? 0) - ((bs.total_liabilities ?? 0) + (bs.total_equity ?? 0))) < 0.01}
                />
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
