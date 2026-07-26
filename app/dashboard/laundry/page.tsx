"use client";

import { useState } from "react";
import { Shirt, Loader2, Plus, Package } from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import { useLaundryOrders, useLaundryPriceList } from "@/lib/hooks";
import { useCreateLaundryOrder, useUpdateLaundryOrder } from "@/lib/hooks/mutations";
import { useJourney } from "@/components/providers/JourneyProvider";

const STATUS_VARIANT: Record<string, "teal" | "amber" | "red" | "navy" | "gray"> = {
  pending: "amber",
  picked_up: "navy",
  in_progress: "navy",
  ready: "teal",
  delivered: "teal",
  cancelled: "red",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  picked_up: "Picked Up",
  in_progress: "In Progress",
  ready: "Ready",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

export default function LaundryPage() {
  const { selectedPropertyId } = useJourney();
  const [statusFilter, setStatusFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showPriceList, setShowPriceList] = useState(false);

  const { orders, isLoading } = useLaundryOrders({
    property_id: selectedPropertyId || undefined,
    status: statusFilter || undefined,
  });
  const { priceList } = useLaundryPriceList(selectedPropertyId || undefined);
  const { trigger: createOrder, isMutating } = useCreateLaundryOrder();
  const { trigger: updateOrder } = useUpdateLaundryOrder();

  // Form state
  const [formGuest, setFormGuest] = useState("");
  const [formUnit, setFormUnit] = useState("");
  const [formInstructions, setFormInstructions] = useState("");
  const [formItems, setFormItems] = useState([{ item_name: "", quantity: 1, unit_price: 0, wash_type: "regular" }]);

  const addItem = () => setFormItems([...formItems, { item_name: "", quantity: 1, unit_price: 0, wash_type: "regular" }]);
  const removeItem = (idx: number) => setFormItems(formItems.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: string, value: any) => {
    const updated = [...formItems];
    (updated[idx] as any)[field] = value;
    setFormItems(updated);
  };

  const totalAmount = formItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);

  const handleCreate = async () => {
    if (!selectedPropertyId) return;
    await createOrder({
      property_id: selectedPropertyId,
      guest_id: formGuest || null,
      unit_id: formUnit || null,
      special_instructions: formInstructions,
      total_amount: totalAmount,
      items: formItems.filter((i) => i.item_name),
    });
    setShowForm(false);
    setFormItems([{ item_name: "", quantity: 1, unit_price: 0, wash_type: "regular" }]);
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    await updateOrder(orderId, { status: newStatus });
  };

  // Stats
  const pendingOrders = orders.filter((o: any) => o.status === "pending").length;
  const inProgressOrders = orders.filter((o: any) => o.status === "in_progress" || o.status === "picked_up").length;
  const readyOrders = orders.filter((o: any) => o.status === "ready").length;
  const todayRevenue = orders
    .filter((o: any) => new Date(o.created_at).toDateString() === new Date().toDateString())
    .reduce((sum: number, o: any) => sum + Number(o.total_amount || 0), 0);

  return (
    <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(139,92,246,0.10)" }}>
            <Shirt className="w-5 h-5" style={{ color: "#8B5CF6" }} />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: "#1A3C5E" }}>Laundry Management</h1>
            <p className="text-xs" style={{ color: "#64748B" }}>Guest laundry orders, tracking, and vendor management</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowPriceList(!showPriceList)}>
            <Package className="w-4 h-4" /> Price List
          </Button>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4" /> New Order
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Pending", value: pendingOrders, color: "#F59E0B" },
          { label: "In Progress", value: inProgressOrders, color: "#3B82F6" },
          { label: "Ready", value: readyOrders, color: "#10B981" },
          { label: "Today's Revenue", value: formatCurrency(todayRevenue), color: "#8B5CF6" },
        ].map((stat) => (
          <Card key={stat.label}>
            <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "#94A3B8" }}>{stat.label}</p>
            <p className="text-xl font-bold mt-0.5" style={{ color: stat.color }}>{stat.value}</p>
          </Card>
        ))}
      </div>

      {/* Price List Panel */}
      {showPriceList && (
        <Card>
          <CardHeader title="Laundry Price List" subtitle="Standard rates per item" action={
            <button onClick={() => setShowPriceList(false)} className="text-xs cursor-pointer" style={{ color: "#64748B" }}>Close</button>
          } />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {priceList.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between py-1.5 px-3 rounded-lg" style={{ background: "#F8FAFC" }}>
                <div>
                  <p className="text-xs font-medium" style={{ color: "#1A3C5E" }}>{p.item_name}</p>
                  <p className="text-[10px]" style={{ color: "#94A3B8" }}>{p.wash_type}</p>
                </div>
                <span className="text-xs font-semibold" style={{ color: "#1A3C5E" }}>{formatCurrency(Number(p.price))}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Create Form */}
      {showForm && (
        <Card>
          <CardHeader title="New Laundry Order" action={
            <button onClick={() => setShowForm(false)} className="text-xs cursor-pointer" style={{ color: "#64748B" }}>Cancel</button>
          } />
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: "#64748B" }}>Special Instructions</label>
                <input value={formInstructions} onChange={(e) => setFormInstructions(e.target.value)} className="w-full text-sm border rounded-lg px-3 py-2" style={{ borderColor: "#E2E8F0" }} placeholder="e.g. Handle with care" />
              </div>
            </div>

            {/* Line Items */}
            <div>
              <label className="text-xs font-medium block mb-2" style={{ color: "#64748B" }}>Items</label>
              <div className="space-y-2">
                {formItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      value={item.item_name}
                      onChange={(e) => updateItem(idx, "item_name", e.target.value)}
                      className="flex-1 text-sm border rounded-lg px-3 py-1.5"
                      style={{ borderColor: "#E2E8F0" }}
                      placeholder="Item name"
                      list="laundry-items"
                    />
                    <select value={item.wash_type} onChange={(e) => updateItem(idx, "wash_type", e.target.value)} className="text-xs border rounded-lg px-2 py-1.5" style={{ borderColor: "#E2E8F0" }}>
                      <option value="regular">Regular</option>
                      <option value="dry_clean">Dry Clean</option>
                      <option value="iron_only">Iron Only</option>
                    </select>
                    <input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(idx, "quantity", parseInt(e.target.value) || 1)} className="w-16 text-sm border rounded-lg px-2 py-1.5 text-center" style={{ borderColor: "#E2E8F0" }} />
                    <input type="number" min="0" value={item.unit_price} onChange={(e) => updateItem(idx, "unit_price", parseFloat(e.target.value) || 0)} className="w-24 text-sm border rounded-lg px-2 py-1.5 text-right" style={{ borderColor: "#E2E8F0" }} />
                    <span className="text-xs font-medium w-20 text-right" style={{ color: "#1A3C5E" }}>
                      {formatCurrency(item.quantity * item.unit_price)}
                    </span>
                    {formItems.length > 1 && (
                      <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600 cursor-pointer">
                        <Plus className="w-4 h-4 rotate-45" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3 mt-2">
                <button onClick={addItem} className="text-xs font-medium cursor-pointer" style={{ color: "#3B82F6" }}>+ Add Item</button>
                <span className="ml-auto text-sm font-bold" style={{ color: "#1A3C5E" }}>Total: {formatCurrency(totalAmount)}</span>
              </div>
              <datalist id="laundry-items">
                {priceList.map((p: any) => (
                  <option key={p.id} value={p.item_name} />
                ))}
              </datalist>
            </div>

            <Button onClick={handleCreate} disabled={isMutating || formItems.every((i) => !i.item_name)}>
              {isMutating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Order"}
            </Button>
          </div>
        </Card>
      )}

      {/* Filter */}
      <div className="flex gap-2">
        {["", "pending", "picked_up", "in_progress", "ready", "delivered"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 text-xs rounded-full transition-all cursor-pointer ${statusFilter === s ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            {s ? STATUS_LABELS[s] : "All"}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <Card padding={false}>
        {isLoading ? (
          <div className="py-12 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#3B82F6" }} />
          </div>
        ) : orders.length === 0 ? (
          <div className="py-12 text-center">
            <Shirt className="w-8 h-8 mx-auto mb-2" style={{ color: "#CBD5E1" }} />
            <p className="text-sm" style={{ color: "#94A3B8" }}>No laundry orders found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ background: "#F5F7FA" }}>
                <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "#64748B" }}>Order #</th>
                <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "#64748B" }}>Guest</th>
                <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "#64748B" }}>Room</th>
                <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "#64748B" }}>Amount</th>
                <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "#64748B" }}>Status</th>
                <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "#64748B" }}>Date</th>
                <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-2.5" style={{ color: "#64748B" }}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "#E2E8F0" }}>
              {orders.map((order: any) => {
                const guestName = order.guest ? `${order.guest.first_name || ""} ${order.guest.last_name || ""}`.trim() : "N/A";
                return (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5 text-xs font-mono font-medium" style={{ color: "#3B82F6" }}>{order.order_number}</td>
                    <td className="px-4 py-2.5 text-xs" style={{ color: "#1A3C5E" }}>{guestName}</td>
                    <td className="px-4 py-2.5 text-xs" style={{ color: "#64748B" }}>{order.unit_label || "—"}</td>
                    <td className="px-4 py-2.5 text-xs font-medium" style={{ color: "#1A3C5E" }}>{formatCurrency(Number(order.total_amount))}</td>
                    <td className="px-4 py-2.5">
                      <Badge variant={STATUS_VARIANT[order.status] || "gray"}>{STATUS_LABELS[order.status] || order.status}</Badge>
                    </td>
                    <td className="px-4 py-2.5 text-[10px]" style={{ color: "#94A3B8" }}>
                      {new Date(order.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex gap-1">
                        {order.status === "pending" && (
                          <button onClick={() => handleStatusUpdate(order.id, "picked_up")} className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-600 cursor-pointer hover:bg-blue-100">Pick Up</button>
                        )}
                        {order.status === "picked_up" && (
                          <button onClick={() => handleStatusUpdate(order.id, "in_progress")} className="text-[10px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 cursor-pointer hover:bg-indigo-100">Start</button>
                        )}
                        {order.status === "in_progress" && (
                          <button onClick={() => handleStatusUpdate(order.id, "ready")} className="text-[10px] px-2 py-0.5 rounded bg-green-50 text-green-600 cursor-pointer hover:bg-green-100">Ready</button>
                        )}
                        {order.status === "ready" && (
                          <button onClick={() => handleStatusUpdate(order.id, "delivered")} className="text-[10px] px-2 py-0.5 rounded bg-green-50 text-green-700 cursor-pointer hover:bg-green-100">Deliver</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
