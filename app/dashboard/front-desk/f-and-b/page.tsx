"use client";

import { useState, useEffect } from "react";
import { Coffee, Search, Plus, Clock, ShoppingBag, Utensils, XCircle, Loader2 } from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import ActiveBookingSelector from "../components/ActiveBookingSelector";
import { useProperties } from "@/lib/hooks";
import { toast } from "react-hot-toast";

// Menu categories as stored in DB (from migration 015 seed)
const MENU_CATEGORIES = ["Breakfast", "Appetizers", "Main Course", "Desserts", "Beverages", "Room Service Specials"];

export default function FAndBPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [menu, setMenu] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");

  const [showOrderForm, setShowOrderForm] = useState(false);
  const [formData, setFormData] = useState({
    booking_id: "",
    items: [] as { item_id: string; item_name: string; price: number; quantity: number }[]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get real property_id
  const { properties } = useProperties("hotel");
  const propertyId = properties?.[0]?.id || "";

  const fetchOrders = () =>
    fetch("/api/dashboard/f-and-b/orders")
      .then(r => r.json())
      .then(d => { if (d.data) setOrders(d.data); });

  useEffect(() => {
    Promise.all([
      fetch("/api/dashboard/f-and-b/orders").then(r => r.json()),
      fetch("/api/dashboard/f-and-b/menu").then(r => r.json())
    ]).then(([ordersData, menuData]) => {
      if (ordersData.data) setOrders(ordersData.data);
      if (menuData.data) setMenu(menuData.data);
    }).catch(err => {
      console.error("Failed to load F&B data", err);
      toast.error("Failed to load F&B data");
    }).finally(() => setLoading(false));
  }, []);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.booking_id) return toast.error("Please select a guest / room.");
    if (formData.items.length === 0) return toast.error("Please add at least one item.");
    if (!propertyId) return toast.error("No property found. Please try again.");

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/dashboard/f-and-b/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
          bookingId: formData.booking_id,
          orderType: "room_service",
          isComplimentary: false,
          // Pass item_name so the NOT NULL constraint is satisfied
          items: formData.items.map(i => ({
            id: i.item_id,
            item_name: i.item_name,
            quantity: i.quantity,
            price: i.price
          }))
        })
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to create order");
        return;
      }

      toast.success("Order created and posted to guest folio!");
      await fetchOrders();
      setShowOrderForm(false);
      setFormData({ booking_id: "", items: [] });
    } catch (err: any) {
      console.error("[handleCreateOrder]", err);
      toast.error("Network error — could not create order");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateQty = (item: any, delta: number) => {
    const existing = formData.items.find(i => i.item_id === item.id);
    const currentQty = existing?.quantity || 0;
    const newQty = currentQty + delta;
    if (newQty < 0) return;
    const newItems = formData.items.filter(i => i.item_id !== item.id);
    if (newQty > 0) {
      newItems.push({ item_id: item.id, item_name: item.item_name, price: Number(item.price), quantity: newQty });
    }
    setFormData({ ...formData, items: newItems });
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "pending": return "amber";
      case "preparing": return "blue";
      case "ready": return "teal";
      case "delivered": return "gray";
      case "cancelled": return "red";
      default: return "gray";
    }
  };

  const filteredMenu = activeCategory === "All"
    ? menu
    : menu.filter(m => m.category === activeCategory);

  const orderTotal = formData.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "#1A3C5E" }}>
            <Coffee className="w-6 h-6 text-[#2BAE8E]" /> Food & Beverage
          </h1>
          <p className="text-[#64748B] mt-1 text-sm">Manage room service orders and post charges to guest folios.</p>
        </div>
        <Button className="bg-[#2BAE8E] hover:bg-[#239B7E] text-white" onClick={() => setShowOrderForm(true)}>
          <Plus className="w-4 h-4 mr-2" /> New Order
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Orders */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader
              title="Active Orders"
              subtitle={`${orders.filter(o => o.status !== "delivered" && o.status !== "cancelled").length} in progress`}
            />
            {loading ? (
              <div className="flex justify-center p-12"><Loader2 className="w-7 h-7 animate-spin text-[#64748B]" /></div>
            ) : orders.length === 0 ? (
              <div className="p-12 text-center text-[#64748B]">
                <ShoppingBag className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                No orders yet. Create one using the button above.
              </div>
            ) : (
              <div className="divide-y divide-[#E2E8F0]">
                {orders.map(order => (
                  <div key={order.id} className="p-4 hover:bg-[#F5F7FA] transition-colors flex flex-col md:flex-row justify-between md:items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-semibold text-[#1A3C5E]">Room {order.unit_label || "—"}</span>
                        <Badge variant={getStatusVariant(order.status)} className="capitalize">
                          {order.status.replace(/_/g, " ")}
                        </Badge>
                        {order.is_complimentary && <Badge variant="teal" className="text-[10px]">Complimentary</Badge>}
                      </div>
                      <div className="text-sm text-[#1A2E44]">
                        {order.items?.map((item: any) => `${item.quantity}x ${item.item_name}`).join(", ") || "—"}
                      </div>
                      <div className="text-xs text-[#64748B] mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(order.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-[#1A3C5E]">₹{Number(order.total_amount).toLocaleString("en-IN")}</div>
                      {order.status === "pending" && (
                        <button
                          onClick={async () => {
                            await fetch(`/api/dashboard/f-and-b/orders/${order.id}`, {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ status: "preparing" })
                            });
                            await fetchOrders();
                          }}
                          className="text-xs mt-1 text-[#2BAE8E] border border-[#2BAE8E] rounded px-2 py-0.5 hover:bg-[#2BAE8E]/10 transition-colors"
                        >
                          Accept
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Menu Overview */}
        <div>
          <Card>
            <CardHeader title="Menu" subtitle="Browse all items" />
            {/* Category pills */}
            <div className="flex gap-1.5 flex-wrap mb-3">
              {["All", ...MENU_CATEGORIES].map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className="text-xs px-2.5 py-1 rounded-full font-medium transition-all"
                  style={{
                    background: activeCategory === cat ? "#1A3C5E" : "#F5F7FA",
                    color: activeCategory === cat ? "#fff" : "#64748B"
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="space-y-1.5 max-h-96 overflow-y-auto">
              {loading ? (
                <div className="text-center text-sm text-[#64748B] py-4">Loading menu...</div>
              ) : filteredMenu.length === 0 ? (
                <div className="text-center text-sm text-[#64748B] py-4">No items.</div>
              ) : (
                filteredMenu.map(item => (
                  <div key={item.id} className="flex justify-between items-center p-2 rounded bg-[#F5F7FA] text-sm">
                    <div>
                      <div className="font-medium text-[#1A2E44]">{item.item_name}</div>
                      <div className="text-xs text-[#64748B]">{item.category}</div>
                    </div>
                    <span className="text-[#2BAE8E] font-semibold">₹{item.price}</span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Slide-out Order Form */}
      {showOrderForm && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setShowOrderForm(false)} />
          <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl z-50 animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#1A3C5E]">New Room Service Order</h2>
              <button onClick={() => setShowOrderForm(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-5">
              {/* Guest selector */}
              <div>
                <label className="block text-sm font-medium text-[#1A3C5E] mb-1">Guest / Room</label>
                <ActiveBookingSelector
                  value={formData.booking_id}
                  onChange={(bId) => setFormData({ ...formData, booking_id: bId })}
                />
              </div>

              {/* Category tabs */}
              <div>
                <label className="block text-sm font-medium text-[#1A3C5E] mb-2">Menu Items</label>
                <div className="flex gap-1.5 flex-wrap mb-3">
                  {["All", ...MENU_CATEGORIES].map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setActiveCategory(cat)}
                      className="text-xs px-2.5 py-1 rounded-full font-medium transition-all"
                      style={{
                        background: activeCategory === cat ? "#1A3C5E" : "#F5F7FA",
                        color: activeCategory === cat ? "#fff" : "#64748B"
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Menu item rows with +/- */}
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {filteredMenu.map(item => {
                    const qty = formData.items.find(i => i.item_id === item.id)?.quantity || 0;
                    return (
                      <div key={item.id} className="flex items-center justify-between bg-[#F5F7FA] p-2.5 rounded-lg border border-[#E2E8F0]">
                        <div>
                          <div className="text-sm font-medium text-[#1A2E44]">{item.item_name}</div>
                          <div className="text-xs text-[#64748B]">
                            ₹{item.price}
                            {item.is_veg
                              ? <span className="ml-1.5 text-green-600">🟢 Veg</span>
                              : <span className="ml-1.5 text-red-500">🔴 Non-veg</span>
                            }
                          </div>
                        </div>
                        <div className="flex items-center gap-2 bg-white border rounded-lg overflow-hidden">
                          <button type="button" onClick={() => updateQty(item, -1)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 text-lg font-bold text-[#64748B]">−</button>
                          <span className="text-sm font-semibold w-5 text-center text-[#1A3C5E]">{qty}</span>
                          <button type="button" onClick={() => updateQty(item, +1)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-[#2BAE8E]/10 text-lg font-bold text-[#2BAE8E]">+</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer with total and submit */}
            <div className="p-4 border-t bg-[#F5F7FA]">
              {formData.items.length > 0 && (
                <div className="mb-3 space-y-1">
                  {formData.items.map(i => (
                    <div key={i.item_id} className="flex justify-between text-sm text-[#1A2E44]">
                      <span>{i.quantity}× {i.item_name}</span>
                      <span>₹{(i.price * i.quantity).toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-bold text-[#1A3C5E] border-t pt-2 mt-1">
                    <span>Total</span>
                    <span>₹{orderTotal.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={handleCreateOrder}
                disabled={isSubmitting || !formData.booking_id || formData.items.length === 0}
                className="w-full bg-[#1A3C5E] hover:bg-[#132d47] text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : "Post to Guest Folio"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
