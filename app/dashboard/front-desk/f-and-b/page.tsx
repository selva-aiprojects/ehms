"use client";

import { useState, useEffect } from "react";
import { Coffee, Search, Plus, Clock, CheckCircle2, XCircle, ShoppingBag, Utensils } from "lucide-react";
import Card, { CardHeader } from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import ActiveBookingSelector from "../components/ActiveBookingSelector";

export default function FAndBPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [menu, setMenu] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [formData, setFormData] = useState({ booking_id: "", items: [] as { item_id: string, quantity: number }[] });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/dashboard/f-and-b/orders").then(res => res.json()),
      fetch("/api/dashboard/f-and-b/menu").then(res => res.json())
    ]).then(([ordersData, menuData]) => {
      if (ordersData.data) setOrders(ordersData.data);
      if (menuData.data) setMenu(menuData.data);
    }).finally(() => setLoading(false));
  }, []);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.booking_id || formData.items.length === 0) return alert("Please select a guest and add at least one item.");
    setIsSubmitting(true);
    
    // Calculate total
    const totalAmount = formData.items.reduce((sum, orderItem) => {
      const menuItem = menu.find(m => m.id === orderItem.item_id);
      return sum + (menuItem ? menuItem.price * orderItem.quantity : 0);
    }, 0);

    try {
      // 1. Create order
      const res = await fetch("/api/dashboard/f-and-b/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: formData.booking_id,
          propertyId: "default-property",
          orderType: "room_service",
          isComplimentary: false,
          items: formData.items.map(i => {
            const m = menu.find(x => x.id === i.item_id);
            return { id: i.item_id, quantity: i.quantity, price: m ? m.price : 0 };
          }),
          totalAmount
        })
      });
      if (res.ok) {
        // Refresh orders
        const ordersData = await fetch("/api/dashboard/f-and-b/orders").then(r => r.json());
        if (ordersData.data) setOrders(ordersData.data);
        setShowOrderForm(false);
        setFormData({ booking_id: "", items: [] });
      } else {
        alert("Failed to create order");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'amber';
      case 'preparing': return 'blue';
      case 'out_for_delivery': return 'teal';
      case 'delivered': return 'green';
      case 'cancelled': return 'red';
      default: return 'gray';
    }
  };

  return (
    <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "#1A3C5E" }}>
            <Coffee className="w-6 h-6 text-[#2BAE8E]" /> Food & Beverage (Pantry)
          </h1>
          <p className="text-[#64748B] mt-1 text-sm">Manage room service orders, menus, and dining.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search orders..." 
              className="pl-9 pr-4 py-2 border rounded-full text-sm w-64 focus:outline-none focus:ring-2 focus:ring-[#2BAE8E]/20"
              style={{ borderColor: "#E2E8F0" }}
            />
          </div>
          <Button 
            className="bg-[#2BAE8E] hover:bg-[#2BAE8E]/90 text-white rounded-full"
            onClick={() => setShowOrderForm(true)}
          >
            <Plus className="w-4 h-4 mr-2" /> New Order
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Orders List */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader title="Active Orders" subtitle={`${orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length} in progress`} />
            <div className="p-0">
              {loading ? (
                <div className="p-8 text-center text-[#64748B]">Loading orders...</div>
              ) : orders.length === 0 ? (
                <div className="p-12 text-center text-[#64748B]">
                  <ShoppingBag className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                  No orders currently.
                </div>
              ) : (
                <div className="divide-y divide-[#E2E8F0]">
                  {orders.map(order => (
                    <div key={order.id} className="p-4 hover:bg-[#F5F7FA] transition-colors flex flex-col md:flex-row justify-between md:items-center gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-semibold text-[#1A3C5E]">Room {order.unit_label || "Unknown"}</span>
                          <Badge variant={getStatusColor(order.status)} className="capitalize">{order.status.replace(/_/g, ' ')}</Badge>
                          {order.is_complimentary && <Badge variant="green" className="text-[10px]">Complimentary</Badge>}
                        </div>
                        <div className="text-sm text-[#1A2E44]">
                          {order.items?.map((item: any) => `${item.quantity}x ${item.item_name}`).join(', ')}
                        </div>
                        <div className="text-xs text-[#64748B] mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Ordered at {new Date(order.ordered_at).toLocaleTimeString()}
                        </div>
                      </div>
                      <div className="text-right flex flex-row md:flex-col items-center justify-between gap-3">
                        <span className="font-bold text-[#1A3C5E]">₹{order.total_amount?.toLocaleString()}</span>
                        {order.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="h-7 text-xs">Accept</Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Menu Overview */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="Menu Overview" subtitle="Quick access to pantry items" />
            <div className="p-4 space-y-4">
              {loading ? (
                <div className="text-center text-sm text-[#64748B]">Loading menu...</div>
              ) : menu.length === 0 ? (
                <div className="text-center text-sm text-[#64748B]">No items configured.</div>
              ) : (
                <>
                  {['breakfast', 'main_course', 'beverages'].map(cat => {
                    const items = menu.filter(m => m.category === cat);
                    if (!items.length) return null;
                    return (
                      <div key={cat}>
                        <h3 className="text-xs font-bold uppercase text-[#64748B] mb-2 flex items-center gap-1">
                          <Utensils className="w-3 h-3" /> {cat.replace('_', ' ')}
                        </h3>
                        <div className="space-y-2">
                          {items.map(item => (
                            <div key={item.id} className="flex justify-between items-center text-sm p-2 rounded bg-[#F5F7FA]">
                              <span className="font-medium text-[#1A2E44]">{item.item_name}</span>
                              <span className="text-[#2BAE8E]">₹{item.price}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Slide-out Order Form */}
      {showOrderForm && (
        <>
          <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setShowOrderForm(false)} />
          <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#1A3C5E]">Create New Order</h2>
              <button onClick={() => setShowOrderForm(false)} className="text-gray-500 hover:bg-gray-100 p-2 rounded-full transition-colors">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto">
              <form id="orderForm" onSubmit={handleCreateOrder} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-[#1A3C5E] mb-1">Select Guest / Room</label>
                  <ActiveBookingSelector 
                    value={formData.booking_id} 
                    onChange={(bId, _) => setFormData({...formData, booking_id: bId})} 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#1A3C5E] mb-3 border-b pb-1">Order Items</label>
                  <div className="space-y-3">
                    {menu.map(item => {
                      const qty = formData.items.find(i => i.item_id === item.id)?.quantity || 0;
                      return (
                        <div key={item.id} className="flex items-center justify-between bg-[#F5F7FA] p-2 rounded border">
                          <div className="flex flex-col">
                            <span className="font-medium text-sm text-[#1A2E44]">{item.item_name}</span>
                            <span className="text-xs text-[#64748B]">₹{item.price}</span>
                          </div>
                          <div className="flex items-center gap-3 bg-white border rounded">
                            <button type="button" onClick={() => {
                              if (qty > 0) {
                                const newItems = formData.items.filter(i => i.item_id !== item.id);
                                if (qty > 1) newItems.push({ item_id: item.id, quantity: qty - 1 });
                                setFormData({...formData, items: newItems});
                              }
                            }} className="w-7 h-7 flex items-center justify-center hover:bg-gray-100">-</button>
                            <span className="text-sm font-medium w-4 text-center">{qty}</span>
                            <button type="button" onClick={() => {
                              const newItems = formData.items.filter(i => i.item_id !== item.id);
                              newItems.push({ item_id: item.id, quantity: qty + 1 });
                              setFormData({...formData, items: newItems});
                            }} className="w-7 h-7 flex items-center justify-center hover:bg-gray-100">+</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </form>
            </div>
            
            <div className="p-4 border-t bg-[#F5F7FA]">
              <div className="flex justify-between items-center mb-4 font-bold text-[#1A3C5E]">
                <span>Total Folio Charge:</span>
                <span>
                  ₹{formData.items.reduce((sum, orderItem) => {
                    const menuItem = menu.find(m => m.id === orderItem.item_id);
                    return sum + (menuItem ? menuItem.price * orderItem.quantity : 0);
                  }, 0).toLocaleString()}
                </span>
              </div>
              <button 
                form="orderForm"
                type="submit" 
                disabled={isSubmitting || !formData.booking_id || formData.items.length === 0}
                className="w-full bg-[#1A3C5E] hover:bg-[#132d47] text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Processing..." : "Post to Guest Folio"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
