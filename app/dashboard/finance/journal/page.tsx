"use client";

import { useState } from "react";
import { RefreshCw, Plus, Loader2, AlertCircle, CheckCircle, Eye, Send, FileText } from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import Table from "@/components/ui/table";
import { useJournalEntries } from "@/lib/hooks";
import { useCreateJournalEntry, usePostJournalEntry } from "@/lib/hooks/mutations";
import { formatCurrency, formatDateTime } from "@/lib/reference-constants";

const JT_BADGE: Record<string, "teal" | "amber" | "red" | "gray" | "navy"> = {
  general: "gray", sales: "teal", purchase: "red", cash: "navy",
};
const P_BADGE: Record<string, "teal" | "amber"> = { posted: "teal", draft: "amber" };
const JTYPES = [
  { v: "general", l: "General" }, { v: "sales", l: "Sales" },
  { v: "purchase", l: "Purchase" }, { v: "cash", l: "Cash" },
];
const ACCTS = [
  { i: "cash", l: "Cash & Bank" }, { i: "revenue", l: "Revenue" },
  { i: "receivable", l: "Accts Receivable" }, { i: "payable", l: "Accts Payable" },
  { i: "expense", l: "Operating Expense" }, { i: "tax", l: "Tax Payable" },
  { i: "equity", l: "Equity" }, { i: "inventory", l: "Inventory" },
  { i: "fixed_asset", l: "Fixed Assets" }, { i: "depreciation", l: "Acc. Depreciation" },
];
const aName = (id: string) => ACCTS.find((a) => a.i === id)?.l || id;
const inp = (extra = "") => `w-full px-3 py-2 text-sm rounded-lg border outline-none ${extra}`;
const inpSm = (extra = "") => `w-full px-2 py-1.5 text-xs rounded border outline-none ${extra}`;
const B = { border: "1px solid #E2E8F0" };
const C1 = "#1A3C5E", C2 = "#64748B", C3 = "#94A3B8";
const emptyLine = () => ({ account_id: "", debit: 0, credit: 0, description: "" });
const today = () => new Date().toISOString().split("T")[0];

export default function JournalPage() {
  const [flt, setFlt] = useState({ journal_type: "", from_date: "", to_date: "" });
  const [showForm, setShowForm] = useState(false);
  const [vEntry, setVEntry] = useState<any>(null);
  const [form, setForm] = useState({ entry_date: today(), description: "", journal_type: "general", lines: [emptyLine()] });
  const [fErr, setFErr] = useState("");
  const [sMsg, setSMsg] = useState("");

  const { journalEntries, isLoading, isError, mutate } = useJournalEntries(
    Object.fromEntries(Object.entries(flt).filter(([, v]) => v)) as any
  );
  const { trigger: createEntry, isMutating } = useCreateJournalEntry();
  const { trigger: postEntry } = usePostJournalEntry();
  const data: any[] = journalEntries || [];
  const msg = (m: string) => { setSMsg(m); setTimeout(() => setSMsg(""), 3000); };
  const tot = (t: "debit" | "credit") => form.lines.reduce((s, l) => s + (Number(l[t]) || 0), 0);
  const upd = (idx: number, f: string, v: string | number) => setForm((p) => ({
    ...p, lines: p.lines.map((l, i) => (i === idx ? { ...l, [f]: v } : l)),
  }));

  async function handleSubmit() {
    setFErr("");
    if (!form.description.trim() || !form.entry_date) { setFErr("Description and date required."); return; }
    if (form.lines.length < 2) { setFErr("At least two line items required."); return; }
    if (form.lines.some((l) => !l.account_id)) { setFErr("All lines must have an account."); return; }
    const d = tot("debit"), c = tot("credit");
    if (!d && !c) { setFErr("Enter at least one amount."); return; }
    if (d !== c) { setFErr(`Debits (${formatCurrency(d)}) must equal credits (${formatCurrency(c)}).`); return; }
    try {
      await createEntry({
        entry_date: form.entry_date, description: form.description, journal_type: form.journal_type,
        lines: form.lines.filter((l) => Number(l.debit) || Number(l.credit)).map((l) => ({
          account_id: l.account_id, debit: Number(l.debit) || 0, credit: Number(l.credit) || 0, description: l.description,
        })),
      } as any);
      setShowForm(false);
      setForm({ entry_date: today(), description: "", journal_type: "general", lines: [emptyLine()] });
      msg("Journal entry created.");
    } catch { setFErr("Failed to create entry."); }
  }

  async function handlePost(entry: any) {
    try { await postEntry(entry.id); msg("Entry posted."); } catch { setFErr("Failed to post."); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold" style={{ color: C1 }}>Journal Entries</h1>
          <p className="text-sm mt-0.5" style={{ color: C2 }}>Record and manage financial journal entries</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4" /> New Entry
          </Button>
          <button onClick={() => mutate()} className="p-1.5 rounded-lg" style={{ color: C3 }} aria-label="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {sMsg && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm"
          style={{ background: "rgba(43,174,142,0.1)", color: "#2BAE8E" }}>
          <CheckCircle className="w-4 h-4" /> {sMsg}
        </div>
      )}

      <Card>
        <CardHeader title="Filters" action={
          <div className="flex items-center gap-2 flex-wrap">
            <select value={flt.journal_type} onChange={(e) => setFlt((p) => ({ ...p, journal_type: e.target.value }))}
              className={inp()} style={{ ...B }}>
              <option value="">All Types</option>
              {JTYPES.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
            </select>
            <input type="date" value={flt.from_date} onChange={(e) => setFlt((p) => ({ ...p, from_date: e.target.value }))} className={inp()} style={{ ...B }} />
            <span className="text-xs" style={{ color: C3 }}>to</span>
            <input type="date" value={flt.to_date} onChange={(e) => setFlt((p) => ({ ...p, to_date: e.target.value }))} className={inp()} style={{ ...B }} />
            {(flt.journal_type || flt.from_date || flt.to_date) && (
              <button onClick={() => setFlt({ journal_type: "", from_date: "", to_date: "" })}
                className="text-xs underline" style={{ color: C2 }}>Clear</button>
            )}
          </div>
        } />

        {isLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" style={{ color: C3 }} /></div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-2 py-8">
            <AlertCircle className="w-6 h-6" style={{ color: "#E53E3E" }} />
            <p className="text-sm" style={{ color: "#E53E3E" }}>Failed to load journal entries.</p>
            <Button variant="outline" size="sm" onClick={() => mutate()}>Retry</Button>
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8">
            <FileText className="w-8 h-8" style={{ color: C3 }} />
            <p className="text-sm" style={{ color: C2 }}>No journal entries found.</p>
            <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4" /> Create First Entry
            </Button>
          </div>
        ) : (
          <Table columns={[
            { key: "entry_date", header: "Date", render: (r: any) => <span style={{ color: C1 }}>{formatDateTime(r.entry_date)}</span> },
            { key: "description", header: "Description" },
            { key: "journal_type", header: "Type", render: (r: any) => <Badge variant={JT_BADGE[r.journal_type] || "gray"}>{r.journal_type}</Badge> },
            { key: "reference_type", header: "Reference", render: (r: any) => r.reference_type ? <span style={{ color: C2 }}>{r.reference_type}</span> : "—" },
            { key: "is_posted", header: "Status", render: (r: any) => <Badge variant={P_BADGE[r.is_posted ? "posted" : "draft"]}>{r.is_posted ? "Posted" : "Draft"}</Badge> },
            { key: "created_by_name", header: "Created By", render: (r: any) => <span style={{ color: C2 }}>{r.created_by_name || "—"}</span> },
            { key: "actions", header: "Actions", render: (r: any) => (
              <div className="flex items-center gap-1">
                <button onClick={(e) => { e.stopPropagation(); setVEntry(r); }} className="p-1 rounded hover:bg-gray-100" title="View" style={{ color: C3 }}>
                  <Eye className="w-3.5 h-3.5" />
                </button>
                {!r.is_posted && (
                  <button onClick={(e) => { e.stopPropagation(); handlePost(r); }} className="p-1 rounded hover:bg-gray-100" title="Post" style={{ color: "#2BAE8E" }}>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )},
          ]} data={data} keyExtractor={(r: any) => r.id} onRowClick={(r: any) => setVEntry(r)} />
        )}
      </Card>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-full overflow-y-auto p-5 space-y-4" style={{ ...B, boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold" style={{ color: C1 }}>New Journal Entry</h3>
              <button onClick={() => { setShowForm(false); setFErr(""); }} className="text-lg" style={{ color: C3 }}>✕</button>
            </div>
            {fErr && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm" style={{ background: "rgba(229,62,62,0.08)", color: "#E53E3E" }}>
                <AlertCircle className="w-4 h-4 shrink-0" /> {fErr}
              </div>
            )}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: C2 }}>Date</label>
                <input type="date" value={form.entry_date} onChange={(e) => setForm((p) => ({ ...p, entry_date: e.target.value }))} className={inp()} style={{ ...B }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: C2 }}>Type</label>
                <select value={form.journal_type} onChange={(e) => setForm((p) => ({ ...p, journal_type: e.target.value }))} className={inp()} style={{ ...B }}>
                  {JTYPES.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: C2 }}>Description</label>
                <input type="text" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Brief description..." className={inp()} style={{ ...B }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium" style={{ color: C2 }}>Line Items</span>
                <Button variant="outline" size="sm" onClick={() => setForm((p) => ({ ...p, lines: [...p.lines, emptyLine()] }))}>
                  <Plus className="w-3 h-3" /> Add Line
                </Button>
              </div>
              <div className="overflow-x-auto rounded-lg border" style={{ ...B }}>
                <table className="w-full text-sm">
                  <thead><tr style={{ background: "#F5F7FA" }}>
                    <th className="px-3 py-2 text-left text-xs font-semibold" style={{ color: C2 }}>Account</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold" style={{ color: C2 }}>Debit</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold" style={{ color: C2 }}>Credit</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold" style={{ color: C2 }}>Description</th>
                    <th style={{ width: 32 }}></th>
                  </tr></thead>
                  <tbody>
                    {form.lines.map((line, idx) => (
                      <tr key={idx} style={{ borderTop: "1px solid #F1F5F9" }}>
                        <td className="px-3 py-1.5">
                          <select value={line.account_id} onChange={(e) => upd(idx, "account_id", e.target.value)} className={inpSm()} style={{ ...B }}>
                            <option value="">Select account</option>
                            {ACCTS.map((a) => <option key={a.i} value={a.i}>{a.l}</option>)}
                          </select>
                        </td>
                        <td className="px-3 py-1.5">
                          <input type="number" value={line.debit || ""} onChange={(e) => { upd(idx, "debit", Number(e.target.value)); upd(idx, "credit", 0); }}
                            min="0" step="0.01" className={`${inpSm()} text-right`} style={{ ...B }} />
                        </td>
                        <td className="px-3 py-1.5">
                          <input type="number" value={line.credit || ""} onChange={(e) => { upd(idx, "credit", Number(e.target.value)); upd(idx, "debit", 0); }}
                            min="0" step="0.01" className={`${inpSm()} text-right`} style={{ ...B }} />
                        </td>
                        <td className="px-3 py-1.5">
                          <input type="text" value={line.description} onChange={(e) => upd(idx, "description", e.target.value)}
                            placeholder="Line description" className={inpSm()} style={{ ...B }} />
                        </td>
                        <td className="px-3 py-1.5">
                          {form.lines.length > 1 && (
                            <button onClick={() => setForm((p) => ({ ...p, lines: p.lines.filter((_, i) => i !== idx) }))}
                              className="text-xs" style={{ color: "#E53E3E" }}>✕</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: "2px solid #E2E8F0", background: "#F8FAFC" }}>
                      <td className="px-3 py-2 text-xs font-semibold" style={{ color: C1 }}>Totals</td>
                      <td className="px-3 py-2 text-right text-xs font-semibold" style={{ color: C1 }}>{formatCurrency(tot("debit"))}</td>
                      <td className="px-3 py-2 text-right text-xs font-semibold" style={{ color: C1 }}>{formatCurrency(tot("credit"))}</td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              {tot("debit") !== tot("credit") && tot("debit") > 0 && tot("credit") > 0 && (
                <p className="text-xs mt-1" style={{ color: "#F5A623" }}>Diff: {formatCurrency(Math.abs(tot("debit") - tot("credit")))}</p>
              )}
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => { setShowForm(false); setFErr(""); }}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={handleSubmit} disabled={isMutating}>
                {isMutating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {isMutating ? "Creating..." : "Create Entry"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {vEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto p-5 space-y-4" style={{ ...B, boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold" style={{ color: C1 }}>Journal Entry Details</h3>
              <button onClick={() => setVEntry(null)} className="text-lg" style={{ color: C3 }}>✕</button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><span className="text-xs" style={{ color: C3 }}>Date</span><p className="text-sm font-medium" style={{ color: C1 }}>{formatDateTime(vEntry.entry_date)}</p></div>
              <div><span className="text-xs" style={{ color: C3 }}>Type</span><p><Badge variant={JT_BADGE[vEntry.journal_type] || "gray"}>{vEntry.journal_type}</Badge></p></div>
              <div className="col-span-2"><span className="text-xs" style={{ color: C3 }}>Description</span><p className="text-sm font-medium" style={{ color: C1 }}>{vEntry.description}</p></div>
              <div><span className="text-xs" style={{ color: C3 }}>Status</span><p><Badge variant={P_BADGE[vEntry.is_posted ? "posted" : "draft"]}>{vEntry.is_posted ? "Posted" : "Draft"}</Badge></p></div>
              <div><span className="text-xs" style={{ color: C3 }}>Created By</span><p className="text-sm font-medium" style={{ color: C1 }}>{vEntry.created_by_name || "—"}</p></div>
            </div>
            {(vEntry.lines || []).length > 0 && (
              <div>
                <span className="text-xs font-medium" style={{ color: C2 }}>Line Items</span>
                <div className="overflow-x-auto rounded-lg border mt-1" style={{ ...B }}>
                  <table className="w-full text-sm">
                    <thead><tr style={{ background: "#F5F7FA" }}>
                      <th className="px-3 py-2 text-left text-xs font-semibold" style={{ color: C2 }}>Account</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold" style={{ color: C2 }}>Debit</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold" style={{ color: C2 }}>Credit</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold" style={{ color: C2 }}>Description</th>
                    </tr></thead>
                    <tbody>
                      {vEntry.lines.map((line: any, idx: number) => (
                        <tr key={idx} style={{ borderTop: "1px solid #F1F5F9" }}>
                          <td className="px-3 py-2 text-xs" style={{ color: C1 }}>{aName(line.account_id)}</td>
                          <td className="px-3 py-2 text-right text-xs" style={{ color: line.debit > 0 ? "#2BAE8E" : C2 }}>
                            {line.debit > 0 ? formatCurrency(line.debit) : "—"}
                          </td>
                          <td className="px-3 py-2 text-right text-xs" style={{ color: line.credit > 0 ? "#E53E3E" : C2 }}>
                            {line.credit > 0 ? formatCurrency(line.credit) : "—"}
                          </td>
                          <td className="px-3 py-2 text-xs" style={{ color: C2 }}>{line.description || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {!vEntry.is_posted && (
              <div className="flex justify-end">
                <Button variant="primary" size="sm" onClick={() => { handlePost(vEntry); setVEntry(null); }}>
                  <Send className="w-4 h-4" /> Post Entry
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
