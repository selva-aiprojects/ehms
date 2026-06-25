"use client";

import { useState, useEffect } from "react";
import {
  FileText, Plus, Search, ChevronDown, ChevronRight, Loader2, RefreshCw,
  CheckCircle, AlertCircle, X, Trash2, ArrowRight
} from "lucide-react";
import Card from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import { usePurchaseOrders, useVendorsList, useProperties } from "@/lib/hooks";
import { useCreatePurchaseOrder, useUpdatePurchaseOrder } from "@/lib/hooks/mutations";

const STATUS_OPTIONS = ["draft", "sent", "approved", "received", "closed"];
const STATUS_BADGE: Record<string, "teal" | "amber" | "red" | "gray" | "navy"> = {
  draft: "gray", sent: "navy", approved: "teal", received: "teal", closed: "teal",
};

export default function PurchaseOrdersPage() {
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editPo, setEditPo] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [expandedPo, setExpandedPo] = useState<string | null>(null);
  const [viewingPo, setViewingPo] = useState<any>(null);
  const [statusAction, setStatusAction] = useState<string | null>(null);

  const { purchaseOrders = [], isLoading, mutate } = usePurchaseOrders({
    search: searchQuery || undefined,
    status: filterStatus || undefined,
  });
  const { vendors = [] } = useVendorsList();
  const { properties = [] } = useProperties();

  const { trigger: createPo, isMutating: isCreating } = useCreatePurchaseOrder();
  const { trigger: updatePo, isMutating: isUpdating } = useUpdatePurchaseOrder();

  const [formData, setFormData] = useState({
    property_id: "",
    vendor_id: "",
    po_date: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const [lineItems, setLineItems] = useState([{ item_description: "", quantity: 1, unit_price: 0 }]);

  useEffect(() => {
    if (actionFeedback) {
      const t = setTimeout(() => setActionFeedback(null), 3000);
      return () => clearTimeout(t);
    }
  }, [actionFeedback]);

  function resetForm() {
    setFormData({ property_id: "", vendor_id: "", po_date: new Date().toISOString().split("T")[0], notes: "" });
    setLineItems([{ item_description: "", quantity: 1, unit_price: 0 }]);
  }

  function handleEdit(po: any) {
    setEditPo(po);
    setFormData({
      property_id: po.property_id || "",
      vendor_id: po.vendor_id || "",
      po_date: po.po_date?.split("T")[0] || new Date().toISOString().split("T")[0],
      notes: po.notes || "",
    });
    setLineItems(po.line_items?.map((li: any) => ({
      item_description: li.item_description,
      quantity: li.quantity,
      unit_price: parseFloat(li.unit_price),
    })) || [{ item_description: "", quantity: 1, unit_price: 0 }]);
    setViewingPo(null);
    setShowModal(true);
  }

  function handleView(po: any) {
    setViewingPo(po);
    setEditPo(null);
    setShowModal(true);
  }

  function addLineItem() {
    setLineItems([...lineItems, { item_description: "", quantity: 1, unit_price: 0 }]);
  }

  function removeLineItem(index: number) {
    if (lineItems.length > 1) setLineItems(lineItems.filter((_, i) => i !== index));
  }

  function updateLineItem(index: number, field: string, value: any) {
    const updated = [...lineItems];
    (updated[index] as any)[field] = field === "item_description" ? value : parseFloat(value) || 0;
    setLineItems(updated);
  }

  function calcTotal() {
    return lineItems.reduce((sum, li) => sum + li.quantity * li.unit_price, 0);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const isEdit = !!editPo;
    try {
      const payload = {
        property_id: formData.property_id,
        vendor_id: formData.vendor_id || undefined,
        po_date: formData.po_date,
        notes: formData.notes || undefined,
        line_items: lineItems.filter((li) => li.item_description.trim()),
      };

      if (isEdit) {
        await updatePo(editPo.id, payload as any);
        setActionFeedback({ type: "success", message: "Purchase order updated" });
      } else {
        await createPo(payload as any);
        setActionFeedback({ type: "success", message: "Purchase order created" });
      }
      setShowModal(false);
      setEditPo(null);
      resetForm();
      mutate();
    } catch (err: any) {
      setActionFeedback({ type: "error", message: err.message || "Operation failed" });
    }
  }

  async function handleStatusChange(poId: string, newStatus: string) {
    setStatusAction(poId);
    try {
      await updatePo(poId, { status: newStatus } as any);
      setActionFeedback({ type: "success", message: `PO status updated to ${newStatus}` });
      mutate();
    } catch (err: any) {
      setActionFeedback({ type: "error", message: err.message || "Failed to update status" });
    } finally {
      setStatusAction(null);
    }
  }

  const totalPos = purchaseOrders.length;
  const draftCount = purchaseOrders.filter((p: any) => p.status === "draft").length;
  const approvedCount = purchaseOrders.filter((p: any) => p.status === "approved" || p.status === "sent").length;
  const receivedCount = purchaseOrders.filter((p: any) => p.status === "received" || p.status === "closed").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#1A3C5E" }}>Purchase Orders</h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>Create and manage purchase orders</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => { setEditPo(null); setViewingPo(null); resetForm(); setShowModal(true); }}>
            <Plus className="w-3.5 h-3.5" /> New PO
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

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(26,60,94,0.1)" }}>
              <FileText className="w-5 h-5" style={{ color: "#1A3C5E" }} />
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: "#64748B" }}>Total</p>
              <p className="text-lg font-bold" style={{ color: "#1A3C5E" }}>{totalPos}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(245,166,35,0.1)" }}>
              <FileText className="w-5 h-5" style={{ color: "#F5A623" }} />
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: "#64748B" }}>Draft</p>
              <p className="text-lg font-bold" style={{ color: "#F5A623" }}>{draftCount}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(43,174,142,0.1)" }}>
              <CheckCircle className="w-5 h-5" style={{ color: "#2BAE8E" }} />
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: "#64748B" }}>Active</p>
              <p className="text-lg font-bold" style={{ color: "#2BAE8E" }}>{approvedCount}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(99,102,241,0.1)" }}>
              <CheckCircle className="w-5 h-5" style={{ color: "#6366F1" }} />
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: "#64748B" }}>Received / Closed</p>
              <p className="text-lg font-bold" style={{ color: "#6366F1" }}>{receivedCount}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "#94A3B8" }} />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search PO number, vendor..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border outline-none" style={{ borderColor: "#E2E8F0" }} />
        </div>
        <div className="flex items-center gap-1">
          {["", ...STATUS_OPTIONS].map((s) => (
            <button key={s || "all"} onClick={() => setFilterStatus(s)}
              className="px-2.5 py-1 text-[10px] font-medium rounded transition-all"
              style={{ background: filterStatus === s ? "#1A3C5E" : "#F5F7FA", color: filterStatus === s ? "#FFFFFF" : "#64748B" }}>
              {s ? s.charAt(0).toUpperCase() + s.slice(1) : "All"}
            </button>
          ))}
        </div>
      </div>

      {isLoading && !purchaseOrders.length ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin" style={{ color: "#94A3B8" }} /></div>
      ) : purchaseOrders.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-10 h-10 mx-auto mb-3" style={{ color: "#94A3B8" }} />
          <p className="text-sm" style={{ color: "#64748B" }}>No purchase orders found. Create your first PO.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {purchaseOrders.map((po: any) => {
            const isExpanded = expandedPo === po.id;
            return (
              <Card key={po.id} padding={false}>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <button onClick={() => setExpandedPo(isExpanded ? null : po.id)}
                        className="p-0.5 rounded hover:bg-slate-100 transition-colors" style={{ color: "#94A3B8" }}>
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(26,60,94,0.08)" }}>
                        <FileText className="w-4.5 h-4.5" style={{ color: "#1A3C5E" }} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm" style={{ color: "#1A2E44" }}>{po.po_number}</span>
                          <Badge variant={STATUS_BADGE[po.status] || "gray"}>{po.status}</Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: "#64748B" }}>
                          <span>{po.vendor_name || "No vendor"}</span>
                          <span>{po.property_name || "—"}</span>
                          <span>{po.po_date ? new Date(po.po_date).toLocaleDateString() : "—"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold" style={{ color: "#1A2E44" }}>₹{Number(po.total_amount || 0).toLocaleString()}</span>
                      <button onClick={() => handleView(po)} className="p-1.5 rounded hover:bg-slate-100 transition-colors" style={{ color: "#64748B" }}>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t px-4 py-3" style={{ borderColor: "#E2E8F0", background: "#F5F7FA" }}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-semibold" style={{ color: "#1A3C5E" }}>Line Items ({po.line_items?.length || 0})</h4>
                      <div className="flex items-center gap-1">
                        {po.status === "draft" && (
                          <>
                            <Button size="sm" variant="secondary" onClick={() => handleStatusChange(po.id, "sent")} disabled={statusAction === po.id}>
                              {statusAction === po.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Send"}
                            </Button>
                            <Button size="sm" onClick={() => handleEdit(po)}>Edit</Button>
                          </>
                        )}
                        {po.status === "sent" && (
                          <Button size="sm" onClick={() => handleStatusChange(po.id, "approved")} disabled={statusAction === po.id}>
                            {statusAction === po.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Approve"}
                          </Button>
                        )}
                        {po.status === "approved" && (
                          <Button size="sm" variant="secondary"
                            onClick={() => window.location.href = `/dashboard/procurement/grn`}>
                            Receive
                          </Button>
                        )}
                      </div>
                    </div>
                    {po.line_items?.length > 0 ? (
                      <div className="space-y-1">
                        {po.line_items.map((li: any) => (
                          <div key={li.id} className="flex items-center justify-between text-xs py-1.5 px-3 rounded"
                            style={{ background: "#FFFFFF" }}>
                            <div className="flex items-center gap-4 flex-1">
                              <span className="font-medium" style={{ color: "#1A2E44" }}>{li.item_description}</span>
                              <span style={{ color: "#64748B" }}>Qty: {li.quantity}</span>
                              <span style={{ color: "#64748B" }}>₹{parseFloat(li.unit_price).toLocaleString()}/unit</span>
                            </div>
                            <span className="font-semibold" style={{ color: "#1A2E44" }}>₹{parseFloat(li.line_total || li.quantity * li.unit_price).toLocaleString()}</span>
                          </div>
                        ))}
                        <div className="flex justify-end pt-2 text-xs font-bold" style={{ color: "#1A2E44" }}>
                          Total: ₹{Number(po.total_amount || 0).toLocaleString()}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs" style={{ color: "#94A3B8" }}>No line items</p>
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
              <h3 className="font-bold text-lg" style={{ color: "#1A3C5E" }}>
                {viewingPo ? `PO: ${viewingPo.po_number}` : editPo ? "Edit Purchase Order" : "New Purchase Order"}
              </h3>
              <button onClick={() => { setShowModal(false); setEditPo(null); setViewingPo(null); }} className="text-slate-400 hover:text-slate-600 font-bold text-lg">&times;</button>
            </div>

            {viewingPo ? (
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs font-medium" style={{ color: "#64748B" }}>PO Number</p>
                    <p className="text-sm font-semibold" style={{ color: "#1A2E44" }}>{viewingPo.po_number}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium" style={{ color: "#64748B" }}>Status</p>
                    <Badge variant={STATUS_BADGE[viewingPo.status] || "gray"}>{viewingPo.status}</Badge>
                  </div>
                  <div>
                    <p className="text-xs font-medium" style={{ color: "#64748B" }}>Date</p>
                    <p className="text-sm" style={{ color: "#1A2E44" }}>{viewingPo.po_date ? new Date(viewingPo.po_date).toLocaleDateString() : "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium" style={{ color: "#64748B" }}>Vendor</p>
                    <p className="text-sm" style={{ color: "#1A2E44" }}>{viewingPo.vendor_name || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium" style={{ color: "#64748B" }}>Property</p>
                    <p className="text-sm" style={{ color: "#1A2E44" }}>{viewingPo.property_name || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium" style={{ color: "#64748B" }}>Total Amount</p>
                    <p className="text-sm font-bold" style={{ color: "#1A2E44" }}>₹{Number(viewingPo.total_amount || 0).toLocaleString()}</p>
                  </div>
                </div>
                {viewingPo.notes && (
                  <div>
                    <p className="text-xs font-medium mb-1" style={{ color: "#64748B" }}>Notes</p>
                    <p className="text-sm p-3 rounded-lg" style={{ background: "#F5F7FA", color: "#1A2E44" }}>{viewingPo.notes}</p>
                  </div>
                )}
                <div>
                  <h4 className="text-xs font-semibold mb-2" style={{ color: "#1A3C5E" }}>Line Items</h4>
                  <div className="space-y-1">
                    {viewingPo.line_items?.map((li: any) => (
                      <div key={li.id} className="flex items-center justify-between text-xs py-2 px-3 rounded" style={{ background: "#F5F7FA" }}>
                        <span className="font-medium" style={{ color: "#1A2E44" }}>{li.item_description}</span>
                        <div className="flex items-center gap-4">
                          <span style={{ color: "#64748B" }}>Qty: {li.quantity}</span>
                          <span style={{ color: "#64748B" }}>₹{parseFloat(li.unit_price).toLocaleString()}</span>
                          <span className="font-semibold" style={{ color: "#1A2E44" }}>₹{parseFloat(li.line_total || li.quantity * li.unit_price).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {viewingPo.status === "draft" && (
                  <div className="flex justify-end gap-2 pt-4 border-t" style={{ borderColor: "#E2E8F0" }}>
                    <Button size="sm" variant="secondary" onClick={() => handleEdit(viewingPo)}>Edit PO</Button>
                    <Button size="sm" onClick={() => handleStatusChange(viewingPo.id, "sent")} disabled={statusAction === viewingPo.id}>
                      {statusAction === viewingPo.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Send PO"}
                    </Button>
                  </div>
                )}
                {viewingPo.status === "sent" && (
                  <div className="flex justify-end pt-4 border-t" style={{ borderColor: "#E2E8F0" }}>
                    <Button size="sm" onClick={() => handleStatusChange(viewingPo.id, "approved")} disabled={statusAction === viewingPo.id}>
                      {statusAction === viewingPo.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Approve PO"}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>Property *</label>
                    <select required value={formData.property_id}
                      onChange={(e) => setFormData({ ...formData, property_id: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border text-sm outline-none bg-white" style={{ borderColor: "#E2E8F0" }}>
                      <option value="">Select Property</option>
                      {(properties || []).map((p: any) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>Vendor</label>
                    <select value={formData.vendor_id}
                      onChange={(e) => setFormData({ ...formData, vendor_id: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border text-sm outline-none bg-white" style={{ borderColor: "#E2E8F0" }}>
                      <option value="">Select Vendor</option>
                      {(vendors || []).filter((v: any) => v.status === "approved").map((v: any) => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: "#1A2E44" }}>PO Date</label>
                    <input type="date" value={formData.po_date}
                      onChange={(e) => setFormData({ ...formData, po_date: e.target.value })}
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

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-semibold" style={{ color: "#1A3C5E" }}>Line Items</h4>
                    <Button type="button" size="sm" variant="secondary" onClick={addLineItem}>
                      <Plus className="w-3 h-3" /> Add Item
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {lineItems.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input type="text" value={item.item_description}
                          onChange={(e) => updateLineItem(idx, "item_description", e.target.value)}
                          placeholder="Item description"
                          className="flex-1 px-3 py-2 text-xs rounded-lg border outline-none" style={{ borderColor: "#E2E8F0" }} />
                        <input type="number" value={item.quantity}
                          onChange={(e) => updateLineItem(idx, "quantity", e.target.value)}
                          placeholder="Qty" min={1}
                          className="w-20 px-3 py-2 text-xs rounded-lg border outline-none" style={{ borderColor: "#E2E8F0" }} />
                        <input type="number" value={item.unit_price}
                          onChange={(e) => updateLineItem(idx, "unit_price", e.target.value)}
                          placeholder="Unit price" min={0} step={0.01}
                          className="w-28 px-3 py-2 text-xs rounded-lg border outline-none" style={{ borderColor: "#E2E8F0" }} />
                        <span className="text-xs font-medium w-24 text-right" style={{ color: "#1A2E44" }}>
                          ₹{(item.quantity * item.unit_price).toLocaleString()}
                        </span>
                        <button type="button" onClick={() => removeLineItem(idx)}
                          className="p-1.5 rounded hover:bg-red-50 transition-colors" style={{ color: "#94A3B8" }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end mt-3 pt-3 border-t" style={{ borderColor: "#E2E8F0" }}>
                    <span className="text-sm font-bold" style={{ color: "#1A2E44" }}>Total: ₹{calcTotal().toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t" style={{ borderColor: "#E2E8F0" }}>
                  <Button type="button" variant="outline" size="sm" onClick={() => { setShowModal(false); setEditPo(null); }}>Cancel</Button>
                  <Button type="submit" size="sm" disabled={isCreating || isUpdating}>
                    {isCreating || isUpdating ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> Saving</> : editPo ? "Update PO" : "Create PO"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
