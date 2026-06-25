"use client";

import { useState, useEffect } from "react";
import { Package, ClipboardList, FileText, Briefcase, ShoppingCart, TrendingUp, AlertCircle, CheckCircle, Clock, ArrowRight, RefreshCw, Loader2 } from "lucide-react";
import Card from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import { useProcurementStats } from "@/lib/hooks";
import Link from "next/link";

const STATUS_BADGE: Record<string, "teal" | "amber" | "red" | "gray" | "navy"> = {
  draft: "gray", sent: "navy", approved: "teal", received: "teal", closed: "teal",
};

export default function ProcurementDashboard() {
  const { procurementStats, isLoading, mutate } = useProcurementStats();

  const stats = procurementStats || {};

  const quickLinks = [
    { label: "Create Purchase Order", href: "/dashboard/procurement/purchase-orders", icon: FileText, color: "#1A3C5E" },
    { label: "Record Goods Receipt", href: "/dashboard/procurement/grn", icon: ClipboardList, color: "#2BAE8E" },
    { label: "Manage Vendors", href: "/dashboard/vendors", icon: Briefcase, color: "#F5A623" },
    { label: "View Inventory", href: "/dashboard/inventory", icon: Package, color: "#E53E3E" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "#1A3C5E" }}>Procurement</h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748B" }}>Purchase orders, goods receipt, and vendor management</p>
        </div>
        <button onClick={() => mutate()} className="p-1.5 rounded-lg transition-colors" style={{ color: "#64748B" }}>
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(26,60,94,0.1)" }}>
              <FileText className="w-5 h-5" style={{ color: "#1A3C5E" }} />
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: "#64748B" }}>Total POs</p>
              <p className="text-lg font-bold" style={{ color: "#1A3C5E" }}>{stats.total_pos ?? "—"}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(43,174,142,0.1)" }}>
              <CheckCircle className="w-5 h-5" style={{ color: "#2BAE8E" }} />
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: "#64748B" }}>Approved</p>
              <p className="text-lg font-bold" style={{ color: "#2BAE8E" }}>{stats.approved_count ?? "—"}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(245,166,35,0.1)" }}>
              <Clock className="w-5 h-5" style={{ color: "#F5A623" }} />
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: "#64748B" }}>Pending / Sent</p>
              <p className="text-lg font-bold" style={{ color: "#F5A623" }}>{(stats.draft_count ?? 0) + (stats.sent_count ?? 0)}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(229,62,62,0.1)" }}>
              <TrendingUp className="w-5 h-5" style={{ color: "#E53E3E" }} />
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: "#64748B" }}>Total Value</p>
              <p className="text-lg font-bold" style={{ color: "#E53E3E" }}>₹{Number(stats.total_amount || 0).toLocaleString()}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="col-span-1 space-y-4">
          <Card>
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#64748B" }}>Quick Actions</h3>
              {quickLinks.map((link) => (
                <Link key={link.label} href={link.href}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all hover:bg-slate-50 group"
                  style={{ color: "#1A2E44" }}>
                  <div className="w-7 h-7 rounded flex items-center justify-center" style={{ background: `${link.color}15` }}>
                    <link.icon className="w-3.5 h-3.5" style={{ color: link.color }} />
                  </div>
                  <span className="flex-1">{link.label}</span>
                  <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "#94A3B8" }} />
                </Link>
              ))}
            </div>
          </Card>
          <Card>
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#64748B" }}>Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span style={{ color: "#64748B" }}>Active Vendors</span>
                  <span className="font-semibold" style={{ color: "#1A2E44" }}>{stats.active_vendors ?? "—"}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: "#64748B" }}>Total Vendors</span>
                  <span className="font-semibold" style={{ color: "#1A2E44" }}>{stats.total_vendors ?? "—"}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: "#64748B" }}>Goods Received</span>
                  <span className="font-semibold" style={{ color: "#1A2E44" }}>{stats.total_grns ?? "—"}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: "#64748B" }}>Pending Amount</span>
                  <span className="font-semibold" style={{ color: "#F5A623" }}>₹{Number(stats.total_pending_amount || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="col-span-3">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#64748B" }}>Recent Purchase Orders</h3>
              <Link href="/dashboard/procurement/purchase-orders" className="text-xs font-medium flex items-center gap-1" style={{ color: "#1A3C5E" }}>
                View All <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {isLoading ? (
              <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" style={{ color: "#94A3B8" }} /></div>
            ) : !stats.recent_pos?.length ? (
              <div className="text-center py-8">
                <ShoppingCart className="w-8 h-8 mx-auto mb-2" style={{ color: "#94A3B8" }} />
                <p className="text-xs" style={{ color: "#64748B" }}>No purchase orders yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {stats.recent_pos.map((po: any) => (
                  <Link key={po.id} href={`/dashboard/procurement/purchase-orders`}
                    className="flex items-center justify-between px-3 py-2 rounded-lg transition-colors hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold" style={{ color: "#1A2E44" }}>{po.po_number}</span>
                      <span className="text-xs" style={{ color: "#64748B" }}>{po.vendor_name || "—"}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={STATUS_BADGE[po.status] || "gray"}>{po.status}</Badge>
                      <span className="text-xs font-medium" style={{ color: "#1A2E44" }}>₹{Number(po.total_amount || 0).toLocaleString()}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
