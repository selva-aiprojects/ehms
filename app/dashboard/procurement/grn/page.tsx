"use client";

import { useState, useEffect } from "react";
import {
  ClipboardList, Plus, Search, ChevronDown, ChevronRight, Loader2, RefreshCw,
  CheckCircle, AlertCircle, X, Package
} from "lucide-react";
import Card from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import { useGrnList, usePurchaseOrders } from "@/lib/hooks";
import { useCreateGrn } from "@/lib/hooks/mutations";

export default function GrnPage() {
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [expandedGrn, setExpandedGrn] = useState<string | null>(null);
  const [selectedPo, setSelectedPo] = useState<any>(null);

  const { grns = [], isLoading, mutate } = useGrnList();
  const { purchaseOrders = [] } = usePurchaseOrders({ status: "approved" });

  const { trigger: createGrn, isMutating: isCreating } = useCreateGrn();

  const [formData, setFormData] = useState({
    po_id: "",
    received_date: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const [grnLines, setGrnLines] = useState<any[]>([]);

  useEffect(() => {
    if (actionFeedback) {
      const t = setTimeout(() => setActionFeedback(null), 3000);
      return () => clearTimeout(t);
    }
  }, [actionFeedback]);

  function resetForm() {
    setFormData({ po_id: "", received_date: new Date().toISOString().split("T")[0], notes: "" });
    setGrnLines([]);
    setSelectedPo(null);
  }

  function handlePoSelect(poId: string) {
    const po = purchaseOrders.find((p: any) => p.id === poId);
    setSelectedPo(po);
    setFormData({ ...formData, po_id: poId });
    if (po?.line_items) {
      setGrnLines(po.line_items.map((li: any) => ({
        po_line_id: li.id,
        item_description: li.item_description,
        ordered_qty: li.quantity,
        previously_received: li.received_qty || 0,
        received_qty: Math.max(0, li.quantity - (li.received_qty || 0)),
        accepted_qty: Math.max(0, li.quantity - (li.received_qty || 0)),
        rejected_qty: 0,
        rejection_reason: "",
      })));
    }
  }

  function updateGrnLine(index: number, field: string, value: any) {
    const updated = [...grnLines];
    const numVal = parseInt(value) || 0;
    (updated[index] as any)[field] = numVal;

    if (field === "received_qty") {
      updated[index].accepted_qty = numVal;
      updated[index].rejected_qty = 0;
    }
    if (field === "rejected_qty") {
      updated[index].accepted_qty = Math.max(0, updated[index].received_qty - numVal);
    }
    if (field === "accepted_qty") {
      updated[index].rejected_qty = Math.max(0, updated[index].received_qty - numVal);
    }

    setGrnLines(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.po_id) return;
    try {
      const lines = grnLines
        .filter((l) => l.received_qty > 0)
        .map((l) => ({
          po_line_id: l.po_line_id,
          received_qty: l.received_qty,
          accepted_qty: l.accepted_qty,
          rejected_qty: l.rejected_qty,
          rejection_reason: l.rejection_reason || null,
        }));

      if (lines.length === 0) {
        setActionFeedback({ type: "error", message: "At least one item must have received quantity" });
        return;
      }

      await createGrn({
        po_id: formData.po_id,
        received_date: formData.received_date,
        notes: formData.notes || undefined,
        lines,
      } as any);

      setActionFeedback({ type: "success", message: "Goods received note created" });
      setShowModal(false);
      resetForm();
      mutate();
    } catch (err: any) {
      setActionFeedback({ type: "error", message: err.message || "Failed to create GRN" });
    }
  }

  const totalGrns = grns.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#1A3C5E" }}>Goods Received Notes</h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>Record goods received against purchase orders</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => { resetForm(); setShowModal(true); }}>
            <Plus className="w-3.5 h-3.5" /> New GRN
          </Button>
          <button onClick={() => mutate()} className="p-1.5 rounded-lg transition-colors" style={{ color: "#64748B" }}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {actionFeedback && (
        <div className="rounded-lg px-4 py-2.5 text-sm flex items-center gap-2"
          style={{
            background: actionFeedback.type === "success" ? "rgba(42,157,143,0.1)" : "rgba(229,62,62,0.08)",
            color: actionFeedback.type === "success" ? "#2BAE8E" : "#E53E3E",
            border: `1px solid ${actionFeedback.type === "success" ? "rgba(42,157,143,0.2)" : "rgba(229,62,62,0.2)"}`,
          }}>
          {actionFeedback.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {actionFeedback.message}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(26,60,94,0.1)" }}>
              <ClipboardList className="w-5 h-5" style={{ color: "#1A3C5E" }} />
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: "#64748B" }}>Total GRNs</p>
              <p className="text-lg font-bold" style={{ color: "#1A3C5E" }}>{totalGrns}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(43,174,142,0.1)" }}>
              <Package className="w-5 h-5" style={{ color: "#2BAE8E" }} />
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: "#64748B" }}>Approved POs Ready</p>
              <p className="text-lg font-bold" style={{ color: "#2BAE8E" }}>{purchaseOrders.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {isLoading && !grns.length ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin" style={{ color: "#94A3B8" }} /></div>
      ) : grns.length === 0 ? (
        <div className="text-center py-12">
          <ClipboardList className="w-10 h-10 mx-auto mb-3" style={{ color: "#94A3B8" }} />
          <p className="text-sm" style={{ color: "#64748B" }}>No goods received notes yet. Create your first GRN.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {grns.map((grn: any) => {
            const isExpanded = expandedGrn === grn.id;
            return (
              <Card key={grn.id} padding={false}>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <button onClick={() => setExpandedGrn(isExpanded ? null : grn.id)}
                        className="p-0.5 rounded hover:bg-slate-100 transition-colors" style={{ color: "#94A3B8" }}>
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(26,60,94,0.08)" }}>
                        <ClipboardList className="w-4.5 h-4.5" style={{ color: "#1A3C5E" }} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm" style={{ color: "#1A2E44" }}>{grn.grn_number}</span>
                          <Badge variant="teal">Received</Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: "#64748B" }}>
                          <span>PO: {grn.po_number || "—"}</span>
                          <span>{grn.vendor_name || "—"}</span>
                          <span>{grn.received_date ? new Date(grn.received_date).toLocaleDateString() : "—"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t px-4 py-3" style={{ borderColor: "#E2E8F0", background: "#F5F7FA" }}>
                    <h4 className="text-xs font-semibold mb-2" style={{ color: "#1A3C5E" }}>Received Items ({grn.lines?.length || 0})</h4>
                    {grn.lines?.length > 0 ? (
                      <div className="space-y-1">
                        {grn.lines.map((line: any) => (
                          <div key={line.id} className="flex items-center justify-between text-xs py-1.5 px-3 rounded"
                            style={{ background: "#FFFFFF" }}>
                            <div className="flex items-center gap-4 flex-1">
                              <span className="font-medium" style={{ color: "#1A2E44" }}>{line.item_description}</span>
                              <span style={{ color: "#64748B" }}>Rcvd: {line.received_qty}</span>
                              {line.accepted_qty != null && (
                                <span style={{ color: "#2BAE8E" }}>Accepted: {line.accepted_qty}</span>
                              )}
                              {line.rejected_qty > 0 && (
                                <span style={{ color: "#E53E3E" }}>Rejected: {line.rejected_qty}</span>
                              )}
                            </div>
                            {line.rejection_reason && (
                              <span className="text-xs" style={{ color: "#94A3B8" }}>{line.rejection_reason}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs" style={{ color: "#94A3B8" }}>No line details</p>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b flex items-center justify-between sticky top-0 bg-white z-10" style={{ borderColor: "#E2E8F0" }}>
              <h3 className="font-bold text-lg" style={{ color: "#1A3C5E" }}>New Goods Received Note</h3>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="text-slate-400 hover:text-slate-600 font-bold text-lg">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>Purchase Order *</label>
                  <select required value={formData.po_id}
                    onChange={(e) => handlePoSelect(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none bg-white" style={{ borderColor: "#E2E8F0" }}>
                    <option value="">Select Approved PO</option>
                    {purchaseOrders.map((po: any) => (
                      <option key={po.id} value={po.id}>{po.po_number} — {po.vendor_name || "No vendor"}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>Received Date</label>
                  <input type="date" value={formData.received_date}
                    onChange={(e) => setFormData({ ...formData, received_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: "#E2E8F0" }} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>Notes</label>
                <textarea value={formData.notes} rows={2}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none resize-none" style={{ borderColor: "#E2E8F0" }}
                  placeholder="Optional notes..." />
              </div>

              {selectedPo && (
                <div>
                  <h4 className="text-xs font-semibold mb-2" style={{ color: "#1A2E44" }}>
                    Line Items — {selectedPo.po_number}
                  </h4>
                  <div className="space-y-2">
                    {grnLines.map((line, idx) => (
                      <div key={idx} className="p-3 rounded-lg border" style={{ borderColor: "#E2E8F0" }}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium" style={{ color: "#1A2E44" }}>{line.item_description}</span>
                          <span className="text-xs" style={{ color: "#64748B" }}>
                            Ordered: {line.ordered_qty} | Previously received: {line.previously_received}
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          <div>
                            <label className="block text-[10px] font-medium mb-0.5" style={{ color: "#64748B" }}>Received</label>
                            <input type="number" value={line.received_qty} min={0}
                              onChange={(e) => updateGrnLine(idx, "received_qty", e.target.value)}
                              className="w-full px-2 py-1.5 text-xs rounded-lg border outline-none" style={{ borderColor: "#E2E8F0" }} />
                          </div>
                          <div>
                            <label className="block text-[10px] font-medium mb-0.5" style={{ color: "#64748B" }}>Accepted</label>
                            <input type="number" value={line.accepted_qty} min={0}
                              onChange={(e) => updateGrnLine(idx, "accepted_qty", e.target.value)}
                              className="w-full px-2 py-1.5 text-xs rounded-lg border outline-none" style={{ borderColor: "#E2E8F0" }} />
                          </div>
                          <div>
                            <label className="block text-[10px] font-medium mb-0.5" style={{ color: "#64748B" }}>Rejected</label>
                            <input type="number" value={line.rejected_qty} min={0}
                              onChange={(e) => updateGrnLine(idx, "rejected_qty", e.target.value)}
                              className="w-full px-2 py-1.5 text-xs rounded-lg border outline-none" style={{ borderColor: "#E2E8F0" }} />
                          </div>
                          <div>
                            <label className="block text-[10px] font-medium mb-0.5" style={{ color: "#64748B" }}>Reason (if rejected)</label>
                            <input type="text" value={line.rejection_reason}
                              onChange={(e) => {
                                const updated = [...grnLines];
                                updated[idx].rejection_reason = e.target.value;
                                setGrnLines(updated);
                              }}
                              className="w-full px-2 py-1.5 text-xs rounded-lg border outline-none" style={{ borderColor: "#E2E8F0" }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t" style={{ borderColor: "#E2E8F0" }}>
                <Button type="button" variant="outline" size="sm" onClick={() => { setShowModal(false); resetForm(); }}>Cancel</Button>
                <Button type="submit" size="sm" disabled={isCreating || !formData.po_id}>
                  {isCreating ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> Saving</> : "Create GRN"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
