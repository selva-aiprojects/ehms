"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Ticket, ArrowLeft, Send, Loader2, AlertCircle, CheckCircle,
  MessageSquare, Clock, AlertTriangle, User, Building2, Mail,
  Lock, ExternalLink, RefreshCw
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const STATUS_OPTIONS = ["open", "in_progress", "awaiting_tenant", "resolved", "closed"];
const PRIORITY_OPTIONS = ["low", "medium", "high", "critical"];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  open: { bg: "rgba(var(--color-primary-rgb),0.08)", text: "var(--color-primary)" },
  in_progress: { bg: "rgba(var(--color-info-rgb),0.08)", text: "var(--color-info)" },
  awaiting_tenant: { bg: "rgba(var(--color-warning-rgb),0.08)", text: "var(--color-warning)" },
  resolved: { bg: "rgba(var(--color-text-muted-rgb),0.08)", text: "var(--color-text-muted)" },
  closed: { bg: "rgba(var(--color-danger-rgb),0.08)", text: "var(--color-danger)" },
};

interface TicketMessage {
  id: string;
  sender_type: "admin" | "tenant" | "system";
  sender_id: string | null;
  sender_name: string;
  sender_email: string;
  message: string;
  is_internal: boolean;
  created_at: string;
}

interface TicketDetail {
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
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  closed_at: string | null;
  messages: TicketMessage[];
}

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);

  const ticketId = params.id as string;

  function loadTicket() {
    setLoading(true);
    setError(null);
    fetch(`/api/admin/tickets/${ticketId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ticket) setTicket(data.ticket);
        else setError(data.error || "Failed to load");
      })
      .catch(() => setError("Network error"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { if (ticketId) loadTicket(); }, [ticketId]);

  async function handleSendReply() {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: replyText, is_internal: isInternal }),
      });
      if (res.ok) {
        setReplyText("");
        setIsInternal(false);
        loadTicket();
      } else {
        const d = await res.json();
        alert(d.error || "Failed to send");
      }
    } catch {
      alert("Network error");
    }
    setSending(false);
  }

  async function updateField(field: string, value: string | null) {
    setSavingStatus(true);
    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (res.ok) loadTicket();
      else { const d = await res.json(); alert(d.error || "Update failed"); }
    } catch {
      alert("Network error");
    }
    setSavingStatus(false);
  }

  if (!user || !user.is_platform_admin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-10 h-10 mx-auto mb-2" style={{ color: "var(--color-danger)" }} />
          <p className="font-medium" style={{ color: "var(--color-navy)" }}>Platform admin access required</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--color-primary)" }} />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--color-danger)" }} />
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>{error || "Ticket not found"}</p>
        <button onClick={() => router.push("/dashboard/admin/tickets")}
          className="mt-3 text-sm font-medium" style={{ color: "var(--color-primary)" }}
        >&larr; Back to tickets</button>
      </div>
    );
  }

  const sc = STATUS_COLORS[ticket.status] || STATUS_COLORS.open;
  const pc = { bg: "rgba(var(--color-info-rgb),0.08)", text: "var(--color-info)" };

  return (
    <div>
      <button onClick={() => router.push("/dashboard/admin/tickets")}
        className="flex items-center gap-1.5 text-sm font-medium mb-4 transition-colors"
        style={{ color: "var(--color-text-muted)" }}
      >
        <ArrowLeft className="w-4 h-4" /> Back to Tickets
      </button>

      {/* Header */}
      <div className="rounded-xl p-5 mb-4" style={{ background: "var(--color-white)", border: "1px solid var(--color-border)" }}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold truncate" style={{ color: "var(--color-navy)" }}>{ticket.subject}</h1>
            </div>
            <div className="flex items-center gap-3 text-xs" style={{ color: "var(--color-text-muted)" }}>
              <span className="font-mono font-semibold" style={{ color: "var(--color-primary)" }}>{ticket.tenant_code}</span>
              <span>Created {new Date(ticket.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}</span>
              <span>Updated {new Date(ticket.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <RefreshCw className="w-4 h-4 cursor-pointer" style={{ color: "var(--color-text-faint)" }} onClick={loadTicket} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-4 pt-4" style={{ borderTop: "1px solid var(--color-border)" }}>
          {/* Status selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>Status:</span>
            <select value={ticket.status} onChange={(e) => updateField("status", e.target.value)}
              className="text-xs px-2 py-1 rounded-lg border outline-none bg-white"
              style={{ borderColor: "var(--color-border)", color: sc.text }}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s.replace("_", " ")}</option>
              ))}
            </select>
          </div>

          {/* Priority selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>Priority:</span>
            <select value={ticket.priority} onChange={(e) => updateField("priority", e.target.value)}
              className="text-xs px-2 py-1 rounded-lg border outline-none bg-white"
              style={{ borderColor: "var(--color-border)", color: "var(--color-navy)" }}
            >
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <span className="text-xs px-2 py-1 rounded font-medium" style={{ background: sc.bg, color: sc.text }}>
            {ticket.status.replace("_", " ")}
          </span>
          <span className="text-xs px-2 py-1 rounded font-medium" style={{ background: pc.bg, color: pc.text }}>
            {ticket.priority}
          </span>
          <span className="text-xs" style={{ color: "var(--color-text-faint)" }}>{ticket.category}</span>
          {ticket.assigned_email && (
            <span className="text-xs flex items-center gap-1" style={{ color: "var(--color-text-muted)" }}>
              <User className="w-3 h-3" /> {ticket.assigned_email}
            </span>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Main - Messages */}
        <div className="lg:col-span-2 space-y-3">
          {ticket.description && (
            <div className="rounded-xl p-4" style={{ background: "var(--color-light)", border: "1px solid var(--color-border)" }}>
              <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--color-navy)" }}>{ticket.description}</p>
              {ticket.contact_name && (
                <div className="flex items-center gap-3 mt-3 text-xs" style={{ color: "var(--color-text-muted)" }}>
                  <span className="flex items-center gap-1"><User className="w-3 h-3" /> {ticket.contact_name}</span>
                  {ticket.contact_email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {ticket.contact_email}</span>}
                </div>
              )}
            </div>
          )}

          {ticket.messages && ticket.messages.length > 0 && (
            <div className="space-y-2">
              {ticket.messages.map((msg) => {
                const isAdmin = msg.sender_type === "admin";
                const isSystem = msg.sender_type === "system";
                return (
                  <div key={msg.id}
                    className={`rounded-xl p-4 ${msg.is_internal ? "border-dashed" : ""}`}
                    style={{
                      background: msg.is_internal ? "rgba(var(--color-warning-rgb),0.04)" : isSystem ? "rgba(var(--color-text-muted-rgb),0.04)" : "var(--color-white)",
                      border: `1px solid ${msg.is_internal ? "rgba(var(--color-warning-rgb),0.2)" : "var(--color-border)"}`,
                      borderLeft: `3px solid ${isAdmin ? "var(--color-primary)" : isSystem ? "var(--color-text-faint)" : "var(--color-info)"}`,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-semibold" style={{ color: isAdmin ? "var(--color-primary)" : isSystem ? "var(--color-text-muted)" : "var(--color-info)" }}>
                        {isAdmin ? "Platform Admin" : isSystem ? "System" : msg.sender_name || "Tenant"}
                      </span>
                      {msg.is_internal && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded font-medium"
                          style={{ background: "rgba(var(--color-warning-rgb),0.1)", color: "var(--color-warning)" }}
                        >
                          <Lock className="w-2.5 h-2.5" /> Internal
                        </span>
                      )}
                      <span className="text-[10px] ml-auto" style={{ color: "var(--color-text-faint)" }}>
                        {new Date(msg.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--color-navy)" }}>{msg.message}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Reply box */}
          <div className="rounded-xl p-4" style={{ background: "var(--color-white)", border: "1px solid var(--color-border)" }}>
            <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)}
              rows={3} placeholder="Type your reply..."
              className="w-full text-sm resize-none outline-none"
              style={{ color: "var(--color-navy)" }}
            />
            <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: "1px solid var(--color-border)" }}>
              <label className="flex items-center gap-1.5 text-xs cursor-pointer" style={{ color: "var(--color-text-muted)" }}>
                <input type="checkbox" checked={isInternal} onChange={(e) => setIsInternal(e.target.checked)}
                  style={{ accentColor: "var(--color-warning)" }}
                />
                <Lock className="w-3 h-3" /> Internal note (not visible to tenant)
              </label>
              <button onClick={handleSendReply} disabled={sending || !replyText.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium text-white transition-all hover:opacity-90 disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)" }}
              >
                {sending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                Send Reply
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar - Details */}
        <div className="space-y-3">
          <div className="rounded-xl p-4" style={{ background: "var(--color-white)", border: "1px solid var(--color-border)" }}>
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--color-text-faint)" }}>Ticket Info</h4>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span style={{ color: "var(--color-text-muted)" }}>Tenant</span>
                <span className="font-mono font-medium" style={{ color: "var(--color-primary)" }}>{ticket.tenant_code}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--color-text-muted)" }}>Category</span>
                <span style={{ color: "var(--color-navy)" }}>{ticket.category}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--color-text-muted)" }}>Messages</span>
                <span style={{ color: "var(--color-navy)" }}>{ticket.messages?.length || 0}</span>
              </div>
              {ticket.resolved_at && (
                <div className="flex justify-between">
                  <span style={{ color: "var(--color-text-muted)" }}>Resolved</span>
                  <span className="text-xs" style={{ color: "var(--color-navy)" }}>
                    {new Date(ticket.resolved_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {ticket.contact_email && (
            <div className="rounded-xl p-4" style={{ background: "var(--color-white)", border: "1px solid var(--color-border)" }}>
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--color-text-faint)" }}>Contact</h4>
              <div className="space-y-1.5 text-sm">
                {ticket.contact_name && <p style={{ color: "var(--color-navy)" }}>{ticket.contact_name}</p>}
                <p className="text-xs flex items-center gap-1" style={{ color: "var(--color-text-muted)" }}>
                  <Mail className="w-3 h-3" /> {ticket.contact_email}
                </p>
              </div>
            </div>
          )}

          {ticket.assigned_email && (
            <div className="rounded-xl p-4" style={{ background: "var(--color-white)", border: "1px solid var(--color-border)" }}>
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--color-text-faint)" }}>Assigned To</h4>
              <p className="text-sm" style={{ color: "var(--color-navy)" }}>{ticket.assigned_email}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
