"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Ticket, Search, RefreshCw, Loader2, AlertCircle, Plus,
  MessageSquare, Clock, AlertTriangle, CheckCircle, XCircle,
  ArrowUpRight, Filter, ChevronDown
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const STATUS_OPTIONS = ["all", "open", "in_progress", "awaiting_tenant", "resolved", "closed"];
const PRIORITY_OPTIONS = ["all", "low", "medium", "high", "critical"];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  open: { bg: "rgba(43,174,142,0.08)", text: "#2BAE8E" },
  in_progress: { bg: "rgba(33,150,243,0.08)", text: "#2196F3" },
  awaiting_tenant: { bg: "rgba(245,166,35,0.08)", text: "#F5A623" },
  resolved: { bg: "rgba(100,116,139,0.08)", text: "#64748B" },
  closed: { bg: "rgba(229,62,62,0.08)", text: "#E53E3E" },
};

const PRIORITY_COLORS: Record<string, { bg: string; text: string }> = {
  low: { bg: "rgba(43,174,142,0.08)", text: "#2BAE8E" },
  medium: { bg: "rgba(33,150,243,0.08)", text: "#2196F3" },
  high: { bg: "rgba(245,166,35,0.08)", text: "#F5A623" },
  critical: { bg: "rgba(229,62,62,0.08)", text: "#E53E3E" },
};

interface TicketRecord {
  id: string;
  tenant_code: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  assigned_to: string | null;
  assigned_email: string | null;
  contact_name: string | null;
  contact_email: string | null;
  message_count: number;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

export default function AdminTicketsPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<TicketRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  function loadTickets() {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (priorityFilter !== "all") params.set("priority", priorityFilter);
    if (searchTerm) params.set("search", searchTerm);

    fetch(`/api/admin/tickets?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.tickets) setTickets(data.tickets);
        else setError(data.error || "Failed to load");
      })
      .catch(() => setError("Network error"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadTickets(); }, [statusFilter, priorityFilter]);

  function handleSearch() { loadTickets(); }

  if (!user || !user.is_platform_admin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-10 h-10 mx-auto mb-2" style={{ color: "#E53E3E" }} />
          <p className="font-medium" style={{ color: "#1A3C5E" }}>Platform admin access required</p>
          <p className="text-sm" style={{ color: "#64748B" }}>Only platform superadmins can manage support tickets.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1A3C5E" }}>Support Tickets</h1>
          <p className="text-sm" style={{ color: "#64748B" }}>Manage tenant support requests and resolutions</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadTickets} className="p-2 rounded-lg transition-colors" style={{ color: "#64748B" }}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105"
            style={{ background: "linear-gradient(135deg, #2BAE8E 0%, #4DB88A 100%)", color: "#FFF" }}
          >
            <Plus className="w-4 h-4" /> New Ticket
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#94A3B8" }} />
          <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search tickets..."
            className="w-full pl-9 pr-3 py-2 rounded-lg text-sm border outline-none"
            style={{ borderColor: "#E2E8F0", color: "#1A3C5E" }}
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm border outline-none bg-white"
          style={{ borderColor: "#E2E8F0", color: "#1A3C5E" }}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s === "all" ? "All Status" : s.replace("_", " ")}</option>
          ))}
        </select>
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm border outline-none bg-white"
          style={{ borderColor: "#E2E8F0", color: "#1A3C5E" }}
        >
          {PRIORITY_OPTIONS.map((p) => (
            <option key={p} value={p}>{p === "all" ? "All Priority" : p}</option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#2BAE8E" }} />
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 py-8 text-sm" style={{ color: "#E53E3E" }}>
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {!loading && !error && tickets.length === 0 && (
        <div className="text-center py-16">
          <Ticket className="w-10 h-10 mx-auto mb-3" style={{ color: "#94A3B8" }} />
          <p className="font-medium" style={{ color: "#1A3C5E" }}>No tickets found</p>
          <p className="text-sm mt-1" style={{ color: "#64748B" }}>
            {statusFilter !== "all" || priorityFilter !== "all" ? "Try different filters." : "Create your first support ticket."}
          </p>
        </div>
      )}

      {!loading && !error && tickets.length > 0 && (
        <div className="space-y-2">
          {tickets.map((t) => {
            const sc = STATUS_COLORS[t.status] || STATUS_COLORS.open;
            const pc = PRIORITY_COLORS[t.priority] || PRIORITY_COLORS.medium;
            const PIcon = t.priority === "high" || t.priority === "critical" ? AlertTriangle : Clock;
            return (
              <Link key={t.id} href={`/dashboard/admin/tickets/${t.id}`}
                className="block rounded-xl p-4 transition-all hover:shadow-md"
                style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm truncate" style={{ color: "#1A3C5E" }}>{t.subject}</h3>
                      <ArrowUpRight className="w-3 h-3 shrink-0" style={{ color: "#94A3B8" }} />
                    </div>
                    <div className="flex items-center gap-3 text-xs" style={{ color: "#64748B" }}>
                      <span className="font-mono font-medium" style={{ color: "#2BAE8E" }}>{t.tenant_code}</span>
                      {t.contact_name && <span>{t.contact_name}</span>}
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" /> {t.message_count}
                      </span>
                      <span>{new Date(t.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
                    </div>
                    {t.description && (
                      <p className="text-xs mt-1.5 line-clamp-1" style={{ color: "#94A3B8" }}>{t.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium"
                      style={{ background: pc.bg, color: pc.text }}
                    >
                      <PIcon className="w-2.5 h-2.5" /> {t.priority}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium"
                      style={{ background: sc.bg, color: sc.text }}
                    >
                      {t.status.replace("_", " ")}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {showCreateModal && (
        <CreateTicketModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => { setShowCreateModal(false); loadTickets(); }}
        />
      )}
    </div>
  );
}

function CreateTicketModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [tenants, setTenants] = useState<{ code: string; name: string }[]>([]);
  const [form, setForm] = useState({
    tenant_code: "", subject: "", description: "", priority: "medium", category: "general",
    contact_name: "", contact_email: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/tenants")
      .then((r) => r.json())
      .then((data) => {
        if (data.tenants) setTenants(data.tenants.map((t: { code: string; name: string }) => ({ code: t.code, name: t.name })));
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.tenant_code || !form.subject) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) onCreated();
      else { const d = await res.json(); alert(d.error || "Failed to create"); }
    } catch { alert("Network error"); }
    setSaving(false);
  }

  const CATEGORIES = ["general", "billing", "technical", "feature_request", "complaint", "other"];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
    >
      <div className="relative w-full max-w-lg rounded-2xl p-6 bg-white shadow-xl animate-slide-up">
        <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100" style={{ color: "#64748B" }}>
          <XCircle className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(43,174,142,0.1)" }}>
            <Ticket className="w-5 h-5" style={{ color: "#2BAE8E" }} />
          </div>
          <div>
            <h3 className="text-lg font-bold" style={{ color: "#1A3C5E" }}>Create Support Ticket</h3>
            <p className="text-xs" style={{ color: "#64748B" }}>Raise a ticket on behalf of a tenant</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "#1A2E44" }}>Tenant *</label>
            <select required value={form.tenant_code} onChange={(e) => setForm({ ...form, tenant_code: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm border outline-none bg-white"
              style={{ borderColor: "#E2E8F0", color: "#1A3C5E" }}
            >
              <option value="">Select tenant...</option>
              {tenants.map((t) => (
                <option key={t.code} value={t.code}>{t.name} ({t.code})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "#1A2E44" }}>Subject *</label>
            <input type="text" required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
              style={{ borderColor: "#E2E8F0", color: "#1A3C5E" }} placeholder="Brief summary of the issue"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "#1A2E44" }}>Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3} className="w-full px-3 py-2 rounded-lg text-sm border outline-none resize-none"
              style={{ borderColor: "#E2E8F0", color: "#1A3C5E" }} placeholder="Detailed description of the issue"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "#1A2E44" }}>Priority</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full px-3 py-2 rounded-lg text-sm border outline-none bg-white"
                style={{ borderColor: "#E2E8F0", color: "#1A3C5E" }}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "#1A2E44" }}>Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 rounded-lg text-sm border outline-none bg-white"
                style={{ borderColor: "#E2E8F0", color: "#1A3C5E" }}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c.replace("_", " ")}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "#1A2E44" }}>Contact Name</label>
              <input type="text" value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                style={{ borderColor: "#E2E8F0", color: "#1A3C5E" }} placeholder="Optional"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "#1A2E44" }}>Contact Email</label>
              <input type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                className="w-full px-3 py-2 rounded-lg text-sm border outline-none"
                style={{ borderColor: "#E2E8F0", color: "#1A3C5E" }} placeholder="For email notifications"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium"
              style={{ border: "1px solid #E2E8F0", color: "#64748B" }}
            >Cancel</button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #2BAE8E 0%, #4DB88A 100%)" }}
            >{saving ? "Creating..." : "Create Ticket"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
